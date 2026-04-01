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

        <!-- Class/Section Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-2">Class/Section</label>
          <input [(ngModel)]="selectedClass" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="e.g. BSIT-1A">
        </div>
        <!-- Session Duration -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-2">Session Duration (minutes)</label>
          <select [(ngModel)]="sessionDuration" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="45">45</option>
            <option value="60">60</option>
          </select>
        </div>

        <!-- QR Code Display & Session State -->
        @if (qrCodeImage()) {
          <div class="border-2 border-dashed border-amber-300 rounded-lg p-8 bg-amber-50 text-center">
            <div class="flex justify-center mb-2">
              <span [ngClass]="sessionStateColor()" class="inline-block w-4 h-4 rounded-full mr-2"></span>
              <span class="font-semibold">{{ sessionStateLabel() }}</span>
            </div>
            <img [src]="qrCodeImage()" alt="QR Code" class="w-64 h-64 mx-auto mb-4 bg-white p-2 rounded-lg">
            <p class="text-slate-700 font-medium mb-4">{{ selectedClass }}</p>
            <p class="text-sm text-slate-600 mb-6">Active until: {{ sessionExpiryTime() | date:'short' }}</p>
            <div class="flex gap-3 justify-center mb-4">
              <button (click)="downloadQR()" class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-medium transition-colors">
                <lucide-icon [img]="Download" [size]="18"></lucide-icon>
                Download
              </button>
              <button (click)="copyQRToClipboard()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition-colors">
                <lucide-icon [img]="Copy" [size]="18"></lucide-icon>
                Copy
              </button>
              <button (click)="regenerateQR()" class="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-4 py-2 font-medium transition-colors">
                <lucide-icon [img]="QrCodeIcon" [size]="18"></lucide-icon>
                Regenerate QR
              </button>
              <button (click)="stopSession()" class="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium transition-colors">
                <lucide-icon [img]="X" [size]="18"></lucide-icon>
                Stop
              </button>
            </div>
            <!-- Real-time Stats -->
            <div class="flex justify-center gap-6 mb-2">
              <div><span class="font-bold">Present:</span> {{ presentCount() }}</div>
              <div><span class="font-bold">Late:</span> {{ lateCount() }}</div>
              <div><span class="font-bold">Absent:</span> {{ absentCount() }}</div>
            </div>
            <!-- Session Log -->
            <div class="text-xs text-slate-500 mt-2">
              <div>Start: {{ sessionLog.start | date:'shortTime' }}</div>
              <div>End: {{ sessionLog.end | date:'shortTime' }}</div>
              <div>Total Scanned: {{ attendanceList().length }}</div>
            </div>
          </div>
        } @else if (selectedClass && sessionDuration) {
          <button (click)="generateQRCode()" [disabled]="generatingQR()" class="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg px-6 py-3 font-medium transition-colors">
            @if (generatingQR()) {
              <span>Generating...</span>
            } @else {
              <span>Generate QR Code</span>
            }
          </button>
        }
  // --- Moved to class body below ---

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
    // Session log and state
    sessionLog = { start: null as Date | null, end: null as Date | null };

    // Session state indicator
    sessionStateColor() {
      const now = new Date();
      const expiry = this.sessionExpiryTime();
      if (!this.qrCodeImage()) return 'bg-gray-400';
      const msLeft = expiry.getTime() - now.getTime();
      if (msLeft > 5 * 60 * 1000) return 'bg-green-500'; // >5 min left
      if (msLeft > 0) return 'bg-yellow-400'; // <5 min left
      return 'bg-red-500'; // expired
    }
    sessionStateLabel() {
      const now = new Date();
      const expiry = this.sessionExpiryTime();
      if (!this.qrCodeImage()) return 'Inactive';
      const msLeft = expiry.getTime() - now.getTime();
      if (msLeft > 5 * 60 * 1000) return 'Active';
      if (msLeft > 0) return 'Ending Soon';
      return 'Expired';
    }

    // Real-time stats (stub logic, replace with real attendance logic)
    presentCount() { return this.attendanceList().filter(s => s.status === 'present').length; }
    lateCount() { return this.attendanceList().filter(s => s.status === 'late').length; }
    absentCount() { return 40 - this.attendanceList().length; } // Example: 40 enrolled

    // Regenerate QR (invalidate old, create new)
    async regenerateQR() {
      this.stopSession();
      await this.generateQRCode();
    }
  private dataService = inject(DataService);
  private authService = inject(AuthService);

  readonly QrCodeIcon = QrCode;
  readonly Copy = Copy;
  readonly Download = Download;
  readonly X = X;

  selectedClass = '';
  sessionDuration = 5;
  qrCodeImage = signal<string | null>(null);
  attendanceList = signal<any[]>([]);
  sessionId = signal<string>('');
  sessionExpiryTime = signal<Date>(new Date());
  generatingQR = signal(false);

  currentUser = this.authService.currentUser;

  // instructorSubjects and selectedSubjectName removed (no subject selection)

  ngOnInit() {
    // Poll for new attendance records
    setInterval(() => this.refreshAttendance(), 2000);
  }

  async generateQRCode() {
    if (!this.selectedClass || !this.sessionDuration) {
      await Swal.fire('Error', 'Please select class/section and session duration', 'error');
      return;
    }

    this.generatingQR.set(true);
    try {
      // Create session ID with class/section info
      this.sessionId.set(`ATT_${this.selectedClass}_${Date.now()}`);
      const now = new Date();
      const expiryTime = new Date(now);
      expiryTime.setMinutes(expiryTime.getMinutes() + Number(this.sessionDuration));
      this.sessionExpiryTime.set(expiryTime);
      this.sessionLog.start = now;
      this.sessionLog.end = expiryTime;

      // Dynamically import qrcode library
      // @ts-ignore
      const QRCode = (await import('qrcode')).default;
      const qrData = `ATTEND:${this.sessionId()}`;

      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

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

  // onSubjectChange removed (no subject selection)

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
    link.download = `attendance-${this.selectedClass}.png`;
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
