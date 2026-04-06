import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { RoleService } from '../../services/role.service';
import { Attendance } from '../../models/user.model';
import { LucideAngularModule, Users, QrCode, CheckCircle2, XCircle, AlertCircle, RotateCcw, BookOpen } from 'lucide-angular';
import Swal from 'sweetalert2';
import { QrCodeGeneratorComponent } from './qr-code-generator.component';
import { QrCodeScannerComponent } from './qr-code-scanner.component';

@Component({
  selector: 'app-take-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, QrCodeGeneratorComponent, QrCodeScannerComponent],
  templateUrl: './take-attendance.component.html',
  styleUrls: ['./take-attendance.component.css']
})
export class TakeAttendanceComponent implements OnInit {
  dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private roleService = inject(RoleService);
  
  // Lucide icons
  readonly Users = Users;
  readonly QrCode = QrCode;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly AlertCircle = AlertCircle;
  readonly RotateCcw = RotateCcw;
  readonly BookOpen = BookOpen;
  
  selectedSubjectId = '';
  manualStudentId = '';
  message = signal('');
  messageType = signal<'success' | 'error'>('success');
  attendanceMode = signal<'manual' | 'qr-generate'>('manual');

  subjects = this.dataService.subjects;
  canTakeAttendance = this.roleService.canTakeAttendance;
  isStudent = this.roleService.isStudent;

  ngOnInit() {
    // Check if subject ID was passed via query params
    this.route.queryParams.subscribe(params => {
      if (params['subjectId']) {
        this.selectedSubjectId = params['subjectId'];
      }
    });
  }

  instructorSubjects = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return this.subjects();
    
    // For instructors, show only their assigned subjects
    const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
    if (!instructor) return this.subjects();
    
    return this.dataService.subjects().filter(s => s.instructor_id === instructor.instructor_id);
  });

  enrolledStudents = computed(() => {
    if (!this.selectedSubjectId) return [];
    const enrollments = this.dataService.enrollments()
      .filter(e => e.subject_id === this.selectedSubjectId);
    return this.dataService.students()
      .filter(s => enrollments.some(e => e.student_id === s.student_id));
  });

  getSelectedSubject() {
    return this.subjects().find(s => s.subject_id === this.selectedSubjectId);
  }

  onSubjectChange() {
  }

  markAttendanceManual() {
    if (!this.manualStudentId) return;
    const student = this.dataService.students().find(s => s.student_id === this.manualStudentId);
    if (student) {
      this.recordAttendance(student.student_id, student.full_name, 'Present', 'Manual');
      this.manualStudentId = '';
    } else {
      this.showMessage('Student not found', 'error');
    }
  }

  markAttendance(studentId: string, event: any) {
    const status = event.target.value;
    if (!status) return;
    const student = this.dataService.students().find(s => s.student_id === studentId);
    if (student) {
      this.recordAttendance(studentId, student.full_name, status as any, 'Manual');
    }
    event.target.value = '';
  }

  async recordAttendance(studentId: string, studentName: string, status: 'Present' | 'Late' | 'Absent' | 'Excused', method: 'QR' | 'Manual') {
    const subject = this.subjects().find(s => s.subject_id === this.selectedSubjectId);
    if (!subject) return;

    const record: Attendance = {
      attendance_id: 'ATT' + Date.now(),
      student_id: studentId,
      student_name: studentName,
      instructor_id: subject.instructor_id,
      subject_id: subject.subject_id,
      subject_name: subject.subject_name,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      status,
      method
    };

    const success = await this.dataService.addAttendance(record);
    if (success) {
      this.showMessage(`Marked ${studentName} as ${status}`, 'success');
    } else {
      this.showMessage('Already marked today', 'error');
    }
  }

  isMarkedToday(studentId: string): boolean {
    const today = new Date().toDateString();
    return this.dataService.attendance().some(a => 
      a.student_id === studentId && 
      a.subject_id === this.selectedSubjectId &&
      new Date(a.date).toDateString() === today
    );
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message.set(msg);
    this.messageType.set(type);
    setTimeout(() => this.message.set(''), 3000);
  }

  async clearAllMarks() {
    if (!this.selectedSubjectId) return;
    
    const result = await Swal.fire({
      title: 'Clear All Marks?',
      text: 'Are you sure you want to clear all attendance marks for today? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      const today = new Date().toDateString();
      const currentAttendance = this.dataService.attendance();
      const filteredAttendance = currentAttendance.filter(a => 
        !(a.subject_id === this.selectedSubjectId && new Date(a.date).toDateString() === today)
      );
      
      this.dataService.attendance.set(filteredAttendance);
      
      Swal.fire({
        icon: 'success',
        title: 'Cleared!',
        text: 'All marks have been cleared for today',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }
}
