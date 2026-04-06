import { Component, signal, inject, computed, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, QrCode, Copy, Download, X, Users } from 'lucide-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-qr-code-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">

      <!-- Left Column: QR Generator -->
      <div class="flex flex-col">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
          <div class="flex items-center gap-3 mb-6">
            <lucide-icon [img]="QrCodeIcon" [size]="20" class="text-orange-500 flex-shrink-0"></lucide-icon>
            <h3 class="text-lg font-bold text-slate-800 m-0">Generate QR Code</h3>
          </div>

          <!-- Subject Info -->
          <div class="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Subject</p>
            <p class="text-sm font-bold text-slate-800 mt-1">{{ subjectLabel() }}</p>
          </div>

          <!-- Session Duration -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">Session Duration (minutes)</label>
            <select [(ngModel)]="sessionDuration" [disabled]="!!qrCodeImage()"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="45">45</option>
              <option value="60">60</option>
            </select>
          </div>

          <!-- QR Code Display -->
          @if (qrCodeImage()) {
            <div class="border-2 border-dashed border-amber-300 rounded-lg p-4 bg-amber-50 text-center flex-1">
              <div class="flex justify-center items-center mb-2 gap-2">
                <span [ngClass]="sessionStateColor()" class="inline-block w-3 h-3 rounded-full"></span>
                <span class="text-sm font-semibold">{{ sessionStateLabel() }}</span>
              </div>
              <img [src]="qrCodeImage()" alt="QR Code" class="w-56 h-56 mx-auto mb-3 bg-white p-2 rounded-lg">
              <p class="text-xs text-slate-600 mb-4">Active until: {{ sessionExpiryTime() | date:'shortTime' }}</p>
              <div class="flex flex-wrap gap-2 justify-center">
                <button (click)="downloadQR()" class="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors">
                  <lucide-icon [img]="Download" [size]="14"></lucide-icon> Download
                </button>
                <button (click)="copyQRToClipboard()" class="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors">
                  <lucide-icon [img]="Copy" [size]="14"></lucide-icon> Copy
                </button>
                <button (click)="regenerateQR()" class="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors">
                  <lucide-icon [img]="QrCodeIcon" [size]="14"></lucide-icon> Regenerate
                </button>
                <button (click)="stopSession()" class="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors">
                  <lucide-icon [img]="X" [size]="14"></lucide-icon> Stop
                </button>
              </div>
              <div class="text-xs text-slate-500 mt-3 flex justify-center gap-4">
                <span>Start: {{ sessionLog.start | date:'shortTime' }}</span>
                <span>End: {{ sessionLog.end | date:'shortTime' }}</span>
              </div>
            </div>
          } @else {
            <button (click)="generateQRCode()" [disabled]="generatingQR()"
              class="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg px-6 py-3 font-medium transition-colors mt-auto">
              {{ generatingQR() ? 'Generating...' : 'Generate QR Code' }}
            </button>
          }
        </div>
      </div>

      <!-- Right Column: Live Scan Feed -->
      <div class="flex flex-col">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
          <div class="flex items-center gap-3 mb-6">
            <lucide-icon [img]="UsersIcon" [size]="20" class="text-orange-500 flex-shrink-0"></lucide-icon>
            <h3 class="text-lg font-bold text-slate-800 m-0">Scanned ({{ liveScans().length }})</h3>
          </div>

          @if (liveScans().length > 0) {
            <div class="flex flex-col gap-3 overflow-y-auto max-h-[500px]">
              @for (record of liveScans(); track record.attendance_id) {
                <div class="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-800 m-0">{{ record.student_name }}</p>
                    <p class="text-xs text-slate-500 m-0">{{ record.time }}</p>
                  </div>
                  <span class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium ml-3 flex-shrink-0">
                    {{ record.status }}
                  </span>
                </div>
              }
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center flex-1 text-center py-12">
              <lucide-icon [img]="UsersIcon" [size]="48" class="text-slate-300 mb-3"></lucide-icon>
              <p class="text-base font-semibold text-slate-800 m-0 mb-1">No scans yet</p>
              <p class="text-sm text-slate-500 m-0">Students who scan the QR code will appear here</p>
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styleUrls: ['./qr-code-generator.component.css']
})
export class QrCodeGeneratorComponent implements OnInit, OnDestroy {
  @Input() subjectId = '';

  private dataService = inject(DataService);
  private authService = inject(AuthService);

  readonly QrCodeIcon = QrCode;
  readonly Copy = Copy;
  readonly Download = Download;
  readonly X = X;
  readonly UsersIcon = Users;

  sessionDuration = 5;
  qrCodeImage = signal<string | null>(null);
  sessionId = signal<string>('');
  sessionExpiryTime = signal<Date>(new Date());
  generatingQR = signal(false);
  sessionLog = { start: null as Date | null, end: null as Date | null };

  private pollInterval: any;

  subjectLabel = computed(() => {
    const subject = this.dataService.subjects().find(s => s.subject_id === this.subjectId);
    if (!subject) return '';
    return `${subject.subject_name} (${subject.subject_code}) — Grade ${subject.grade_level} ${subject.section}`;
  });

  // Live scans: attendance records for this session pulled from data service
  liveScans = computed(() => {
    const sid = this.sessionId();
    if (!sid) return [];
    return this.dataService.attendance().filter(a =>
      a.subject_id === this.subjectId &&
      new Date(a.date).toDateString() === new Date().toDateString()
    );
  });

  sessionStateColor() {
    if (!this.qrCodeImage()) return 'bg-gray-400';
    const msLeft = this.sessionExpiryTime().getTime() - Date.now();
    if (msLeft > 5 * 60 * 1000) return 'bg-green-500';
    if (msLeft > 0) return 'bg-yellow-400';
    return 'bg-red-500';
  }

  sessionStateLabel() {
    if (!this.qrCodeImage()) return 'Inactive';
    const msLeft = this.sessionExpiryTime().getTime() - Date.now();
    if (msLeft > 5 * 60 * 1000) return 'Active';
    if (msLeft > 0) return 'Ending Soon';
    return 'Expired';
  }

  async regenerateQR() {
    this.stopSession();
    await this.generateQRCode();
  }

  ngOnInit() {
    // Poll data service every 3s to refresh live scans
    this.pollInterval = setInterval(() => this.dataService.loadAttendance(), 3000);
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }

  async generateQRCode() {
    if (!this.subjectId || !this.sessionDuration) {
      await Swal.fire('Error', 'No subject selected or session duration missing', 'error');
      return;
    }
    this.generatingQR.set(true);
    try {
      this.sessionId.set(`ATT_${this.subjectId}_${Date.now()}`);
      const now = new Date();
      const expiryTime = new Date(now);
      expiryTime.setMinutes(expiryTime.getMinutes() + Number(this.sessionDuration));
      this.sessionExpiryTime.set(expiryTime);
      this.sessionLog.start = now;
      this.sessionLog.end = expiryTime;

      // @ts-ignore
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(`ATTEND:${this.sessionId()}`, {
        width: 400, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      this.qrCodeImage.set(dataUrl);

      await Swal.fire({ title: 'QR Code Generated!', html: 'Share this QR code with students to scan.', icon: 'success', timer: 2000, showConfirmButton: false });
    } catch (error) {
      await Swal.fire('Error', `Failed to generate QR code: ${error instanceof Error ? error.message : error}`, 'error');
    } finally {
      this.generatingQR.set(false);
    }
  }

  async downloadQR() {
    const image = this.qrCodeImage();
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `attendance-${this.subjectId}.png`;
    link.click();
    await Swal.fire({ title: 'Downloaded!', icon: 'success', timer: 1500, showConfirmButton: false });
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
      await Swal.fire({ title: 'Copied!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }

  stopSession() {
    this.qrCodeImage.set(null);
    this.sessionId.set('');
  }
}
