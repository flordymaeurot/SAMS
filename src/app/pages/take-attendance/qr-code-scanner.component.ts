import { Component, ViewChild, ElementRef, signal, inject, computed, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Camera, CheckCircle, AlertCircle, XCircle, Upload } from 'lucide-angular';
import { BrowserQRCodeReader } from '@zxing/library';
import Swal from 'sweetalert2';

interface ScanResult {
  sessionId: string;
  timestamp: Date;
  status: 'success' | 'error' | 'duplicate';
}

@Component({
  selector: 'app-qr-code-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-slate-800">Mark Attendance via QR Code</h1>
            <p class="text-slate-600 mt-2">Scan the QR code to mark yourself present</p>
          </div>
          <lucide-icon [img]="CameraIcon" [size]="48" class="text-amber-600"></lucide-icon>
        </div>

        @if (!cameraStarted()) {
          <div class="flex flex-col gap-3">
            <button (click)="startCamera()" class="w-full btn-primary rounded-lg px-6 py-4 font-medium text-lg flex items-center justify-center gap-2">
              <lucide-icon [img]="CameraIcon" [size]="20"></lucide-icon>
              Start Camera & Scan QR Code
            </button>
            <label class="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-800 rounded-lg px-6 py-4 font-medium text-lg cursor-pointer transition-colors">
              <lucide-icon [img]="UploadIcon" [size]="20"></lucide-icon>
              Upload QR Code Image
              <input type="file" accept="image/*" class="hidden" (change)="onFileUpload($event)">
            </label>
          </div>
        } @else {
          <div class="space-y-4">
            <!-- Camera Stream -->
            <div class="relative border-4 border-amber-400 rounded-lg overflow-hidden bg-black h-96">
              <video #videoElement class="w-full h-full object-cover" (play)="onVidePlay()"></video>
              @if (scanning()) {
                <div class="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div class="text-white text-center">
                    <div class="animate-spin w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p class="text-lg font-semibold">Scanning...</p>
                  </div>
                </div>
              }
            </div>

            <!-- Stop Button -->
            <button (click)="stopCamera()" class="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-2 font-medium transition-colors">
              Stop Scanning
            </button>

            <!-- Last Scan Result -->
            @if (lastScan(); as scan) {
              <div [ngClass]="'p-4 rounded-lg border-2 ' + getScanStatusClasses(scan.status)">
                <div class="flex items-center gap-3">
                  @switch (scan.status) {
                    @case ('success') {
                      <lucide-icon [img]="CheckIcon" [size]="24" class="text-green-600"></lucide-icon>
                      <div>
                        <p class="font-bold text-green-800">Attendance Marked!</p>
                        <p class="text-sm text-green-700">Scanned at {{ scan.timestamp | date:'medium' }}</p>
                      </div>
                    }
                    @case ('duplicate') {
                      <lucide-icon [img]="AlertIcon" [size]="24" class="text-yellow-600"></lucide-icon>
                      <div>
                        <p class="font-bold text-yellow-800">Already Marked</p>
                        <p class="text-sm text-yellow-700">You've already marked attendance for this session</p>
                      </div>
                    }
                    @case ('error') {
                      <lucide-icon [img]="ErrorIcon" [size]="24" class="text-red-600"></lucide-icon>
                      <div>
                        <p class="font-bold text-red-800">Error</p>
                        <p class="text-sm text-red-700">Failed to process attendance. Please try again.</p>
                      </div>
                    }
                  }
                </div>
              </div>
            }

            <!-- Scan History -->
            @if (scanHistory().length > 0) {
              <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 class="font-bold text-slate-800 mb-3">Today's Attendance Records</h3>
                <div class="space-y-2">
                  @for (record of scanHistory(); track $index) {
                    <div class="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                      <div>
                        <p class="text-sm font-medium text-slate-800">{{ record.subject_name }}</p>
                        <p class="text-xs text-slate-600">{{ record.date | date:'short' }}</p>
                      </div>
                      <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">Present</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./qr-code-scanner.component.css']
})
export class QrCodeScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  readonly CameraIcon = Camera;
  readonly CheckIcon = CheckCircle;
  readonly AlertIcon = AlertCircle;
  readonly ErrorIcon = XCircle;
  readonly UploadIcon = Upload;

  codeReader?: BrowserQRCodeReader;
  cameraStarted = signal(false);
  scanning = signal(false);
  lastScan = signal<ScanResult | null>(null);
  scannedSessions = signal<Set<string>>(new Set());

  currentUser = this.authService.currentUser;

  scanHistory = computed(() => {
    const user = this.currentUser();
    if (!user) return [];

    const student = this.dataService.students().find(s => s.user_id === user.user_id);
    if (!student) return [];

    const today = new Date().toDateString();
    const attendance = this.dataService.attendance().filter(a => {
      const attendDate = new Date(a.date).toDateString();
      return a.student_id === student.student_id && attendDate === today;
    });

    return attendance.map(a => ({
      ...a,
      subject_name: this.dataService.subjects().find(s => s.subject_id === a.subject_id)?.subject_name || 'Unknown'
    }));
  });

  ngOnInit() {
    this.codeReader = new BrowserQRCodeReader();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    try {
      // Set flag first so Angular renders the <video> element
      this.cameraStarted.set(true);
      this.scanning.set(true);
      // Wait for Angular to render the video element into the DOM
      this.cdr.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!this.videoElement?.nativeElement || !this.codeReader) {
        throw new Error('Camera element not ready');
      }

      // Request camera permission explicitly first
      await navigator.mediaDevices.getUserMedia({ video: true });

      this.codeReader
        .decodeFromVideoDevice(null, this.videoElement.nativeElement, async (result, err) => {
          if (result) {
            this.scanning.set(false);
            await this.processQRCode(result.getText());
          }
        })
        .catch(err => {
          console.error('Scanner error:', err);
          this.scanning.set(false);
        });
    } catch (error: any) {
      console.error('Camera error:', error);
      this.cameraStarted.set(false);
      this.scanning.set(false);
      const msg = error?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Failed to start camera. Please check your device.';
      await Swal.fire('Camera Error', msg, 'error');
    }
  }

  async onFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeFromImageUrl(url);
      URL.revokeObjectURL(url);
      await this.processQRCode(result.getText());
    } catch {
      await Swal.fire('Invalid Image', 'Could not find a valid QR code in the uploaded image.', 'error');
    }
    (event.target as HTMLInputElement).value = '';
  }

  stopCamera() {
    try {
      if (this.codeReader) {
        this.codeReader.reset();
      }
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = null;
      }
      this.cameraStarted.set(false);
      this.scanning.set(false);
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  }

  async processQRCode(qrData: string) {
    try {
      if (!qrData.startsWith('ATTEND:')) {
        this.lastScan.set({ sessionId: qrData, timestamp: new Date(), status: 'error' });
        await Swal.fire('Invalid QR Code', 'This is not a valid attendance QR code.', 'error');
        return;
      }

      // Format: ATTEND:<subjectId>:<expiryTimestamp>
      const parts = qrData.replace('ATTEND:', '').split(':');
      const subjectId = parts[0];
      const expiryTs = parts[1] ? parseInt(parts[1]) : null;

      // Check expiry
      if (expiryTs && Date.now() > expiryTs) {
        this.lastScan.set({ sessionId: qrData, timestamp: new Date(), status: 'error' });
        await Swal.fire({
          title: 'QR Code Expired',
          text: 'This QR code has already expired. Please ask your instructor to generate a new one.',
          icon: 'warning',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }

      const sessionId = qrData;

      // Check for duplicate scan
      if (this.scannedSessions().has(sessionId)) {
        this.lastScan.set({ sessionId, timestamp: new Date(), status: 'duplicate' });
        return;
      }

      const user = this.currentUser();
      const student = this.dataService.students().find(s => s.user_id === user?.user_id);
      if (!student) throw new Error('Student not found');

      const subject = this.dataService.subjects().find(s => s.subject_id === subjectId);
      if (!subject) throw new Error('Subject not found');

      const attendanceRecord = {
        attendance_id: 'ATT' + Date.now(),
        student_id: student.student_id,
        student_name: student.full_name,
        instructor_id: subject.instructor_id,
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
        date: new Date(),
        time: new Date().toLocaleTimeString(),
        status: 'Present' as const,
        method: 'QR' as const
      };

      await this.dataService.addAttendance(attendanceRecord);

      this.scannedSessions().add(sessionId);
      this.lastScan.set({ sessionId, timestamp: new Date(), status: 'success' });

      await this.notifyParentAndInstructor(student, subjectId);

      setTimeout(() => {
        if (this.cameraStarted()) this.scanning.set(true);
      }, 3000);

    } catch (error) {
      console.error('QR processing error:', error);
      this.lastScan.set({ sessionId: '', timestamp: new Date(), status: 'error' });
      await Swal.fire('Error', 'Failed to mark attendance. Please try again.', 'error');
    }
  }

  private async notifyParentAndInstructor(student: any, subjectId: string) {
    try {
      const subject = this.dataService.subjects().find(s => s.subject_id === subjectId);
      const instructor = this.dataService.instructors().find(i => i.instructor_id === subject?.instructor_id);

      // Notify instructor
      if (instructor?.user_id) {
        // In a real app, send via email/SMS
        console.log(`Instructor ${instructor?.full_name} notified: ${student.full_name} marked present`);
      }

      // Notify parent(s)
      const parents = this.dataService.parents().filter(p => p.student_id === student.student_id);
      parents.forEach(parent => {
        console.log(`Parent ${parent?.full_name} notified: ${student.full_name} marked present for ${subject?.subject_name}`);
      });
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  onVidePlay() {
    this.scanning.set(true);
  }

  getScanStatusClasses(status: string): string {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-300';
      case 'duplicate':
        return 'bg-yellow-50 border-yellow-300';
      case 'error':
        return 'bg-red-50 border-red-300';
      default:
        return 'bg-slate-50 border-slate-300';
    }
  }
}
