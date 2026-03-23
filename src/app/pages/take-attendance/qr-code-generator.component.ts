import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, QrCode, Copy, Download, X } from 'lucide-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-qr-code-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-slate-800">QR Code Attendance</h1>
            <p class="text-slate-600 mt-2">Generate QR codes for students to scan</p>
          </div>
          <lucide-icon [img]="QrCodeIcon" [size]="48" class="text-amber-600"></lucide-icon>
        </div>

        <!-- Subject Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
          <select [(ngModel)]="selectedSubjectId" (change)="onSubjectChange()" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">-- Choose a subject --</option>
            @for (subject of instructorSubjects(); track subject.subject_id) {
              <option [value]="subject.subject_id">{{ subject.subject_name }} ({{ subject.section }})</option>
            }
          </select>
        </div>

        <!-- QR Code Display -->
        @if (qrCodeImage()) {
          <div class="border-2 border-dashed border-amber-300 rounded-lg p-8 bg-amber-50 text-center">
            <img [src]="qrCodeImage()" alt="QR Code" class="w-64 h-64 mx-auto mb-4 bg-white p-2 rounded-lg">
            <p class="text-slate-700 font-medium mb-4">{{ selectedSubjectName() }}</p>
            <p class="text-sm text-slate-600 mb-6">Active until: {{ sessionExpiryTime() | date:'short' }}</p>
            
            <div class="flex gap-3 justify-center">
              <button (click)="downloadQR()" class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-medium transition-colors">
                <lucide-icon [img]="Download" [size]="18"></lucide-icon>
                Download
              </button>
              <button (click)="copyQRToClipboard()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition-colors">
                <lucide-icon [img]="Copy" [size]="18"></lucide-icon>
                Copy
              </button>
              <button (click)="stopSession()" class="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium transition-colors">
                <lucide-icon [img]="X" [size]="18"></lucide-icon>
                Stop
              </button>
            </div>
          </div>
        } @else if (selectedSubjectId()) {
          <button (click)="generateQRCode()" [disabled]="generatingQR()" class="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg px-6 py-3 font-medium transition-colors">
            @if (generatingQR()) {
              <span>Generating...</span>
            } @else {
              <span>Generate QR Code</span>
            }
          </button>
        }

        <!-- Real-time Attendance -->
        @if (attendanceList().length > 0) {
          <div class="mt-8 border-t border-slate-200 pt-6">
            <h3 class="text-xl font-bold text-slate-800 mb-4">Students Marked Present ({{ attendanceList().length }})</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (student of attendanceList(); track student.student_id) {
                <div class="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div class="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                  <div class="flex-1">
                    <p class="font-medium text-slate-800">{{ student.full_name }}</p>
                    <p class="text-xs text-slate-600">{{ student.scanned_at | date:'short' }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./qr-code-generator.component.css']
})
export class QrCodeGeneratorComponent implements OnInit {
  private dataService = inject(DataService);
  private authService = inject(AuthService);

  readonly QrCodeIcon = QrCode;
  readonly Copy = Copy;
  readonly Download = Download;
  readonly X = X;

  selectedSubjectId = signal<string>('');
  qrCodeImage = signal<string | null>(null);
  attendanceList = signal<any[]>([]);
  sessionId = signal<string>('');
  sessionExpiryTime = signal<Date>(new Date());
  generatingQR = signal(false);

  currentUser = this.authService.currentUser;

  instructorSubjects = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    
    const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
    if (!instructor) return [];
    
    return this.dataService.subjects().filter(s => s.instructor_id === instructor.instructor_id);
  });

  selectedSubjectName = computed(() => {
    const subjectId = this.selectedSubjectId();
    const subject = this.dataService.subjects().find(s => s.subject_id === subjectId);
    return subject?.subject_name || '';
  });

  ngOnInit() {
    // Poll for new attendance records
    setInterval(() => this.refreshAttendance(), 2000);
  }

  async generateQRCode() {
    const subjectId = this.selectedSubjectId();
    if (!subjectId) {
      await Swal.fire('Error', 'Please select a subject', 'error');
      return;
    }

    this.generatingQR.set(true);
    try {
      // Create session ID with subject info
      this.sessionId.set(`ATT_${subjectId}_${Date.now()}`);
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 15);
      this.sessionExpiryTime.set(expiryTime);

      // Dynamically import qrcode library
      // @ts-ignore
      const QRCode = (await import('qrcode')).default;
      const qrData = `ATTEND:${this.sessionId()}`;
      
      console.log('Generating QR with data:', qrData);
      
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('QR Code generated successfully');
      this.qrCodeImage.set(dataUrl);
      this.attendanceList.set([]);

      await Swal.fire({
        title: 'QR Code Generated!',
        html: 'Share this QR code with students to scan and mark attendance.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('QR Generation Error Details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMsg = error instanceof Error ? error.message : String(error);
      await Swal.fire(
        'Error',
        `Failed to generate QR code: ${errorMsg}`,
        'error'
      );
    } finally {
      this.generatingQR.set(false);
    }
  }

  onSubjectChange() {
    this.qrCodeImage.set(null);
    this.sessionId.set('');
    this.attendanceList.set([]);
  }

  refreshAttendance() {
    if (!this.sessionId()) return;
    
    // This would typically fetch from backend
    // For now, we'll update via data service signals
  }

  async downloadQR() {
    const image = this.qrCodeImage();
    if (!image) return;

    const link = document.createElement('a');
    link.href = image;
    link.download = `attendance-${this.selectedSubjectId()}.png`;
    link.click();

    await Swal.fire({
      title: 'Downloaded!',
      text: 'QR code downloaded successfully',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  }

  async copyQRToClipboard() {
    const image = this.qrCodeImage();
    if (!image) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (blob && navigator.clipboard) {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          }
        });
      };
      img.src = image;

      await Swal.fire({
        title: 'Copied!',
        text: 'QR code copied to clipboard',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }

  stopSession() {
    this.qrCodeImage.set(null);
    this.sessionId.set('');
    this.attendanceList.set([]);
  }
}
