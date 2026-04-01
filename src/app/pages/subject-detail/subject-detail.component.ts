import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { RoleService } from '../../services/role.service';
import { AuthService } from '../../services/auth.service';
import { SubjectEnrollment } from '../../models/user.model';
import { LucideAngularModule, Users, ClipboardList, Plus, X, BookOpen, UserCircle } from 'lucide-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.css']
})
export class SubjectDetailComponent {
  subjectId = '';
  activeTab = signal('students');
  showEnrollModal = signal(false);

  // Lucide icons
  readonly Users = Users;
  readonly ClipboardList = ClipboardList;
  readonly Plus = Plus;
  readonly X = X;
  readonly BookOpen = BookOpen;
  readonly UserCircle = UserCircle;

  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  canTakeAttendance = this.roleService.canTakeAttendance;
  isStudent = this.roleService.isStudent;
  isInstructor = this.roleService.isInstructor;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private dataService: DataService
  ) {
    this.subjectId = this.route.snapshot.paramMap.get('id') || '';
  }

  subject = computed(() => {
    return this.dataService.subjects().find(s => s.subject_id === this.subjectId);
  });

  enrollments = computed(() => {
    return this.dataService.enrollments().filter(e => e.subject_id === this.subjectId);
  });

  subjectAttendance = computed(() => {
    const allAttendance = this.dataService.attendance().filter(a => a.subject_id === this.subjectId);
    return allAttendance;
  });

  availableStudents = computed(() => {
    const subject = this.subject();
    if (!subject) return [];
    const enrolledIds = this.enrollments().map(e => e.student_id);
    return this.dataService.students().filter(s => !enrolledIds.includes(s.student_id));
  });

  enrollStudent(student: any) {
    const subject = this.subject();
    if (!subject) return;

    const enrollment: SubjectEnrollment = {
      enrollment_id: 'E' + Date.now(),
      subject_id: this.subjectId,
      student_id: student.student_id,
      student_name: student.full_name,
      subject_name: subject.subject_name,
      enrolled_date: new Date()
    };

    this.dataService.enrollStudent(enrollment);
    this.showEnrollModal.set(false);
    
    Swal.fire({
      icon: 'success',
      title: 'Student Enrolled!',
      text: `${student.full_name} has been enrolled in ${subject.subject_name}`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  async unenroll(enrollmentId: string) {
    const result = await Swal.fire({
      title: 'Unenroll Student?',
      text: 'Are you sure you want to unenroll this student from the subject?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, unenroll',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      this.dataService.unenrollStudent(enrollmentId);
      Swal.fire({
        icon: 'success',
        title: 'Unenrolled!',
        text: 'Student has been unenrolled from the subject',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'Present': 'rounded-full px-3 py-1 text-sm bg-green-100 text-green-800',
      'Late': 'rounded-full px-3 py-1 text-sm bg-yellow-100 text-yellow-800',
      'Absent': 'rounded-full px-3 py-1 text-sm bg-red-100 text-red-800',
      'Excused': 'rounded-full px-3 py-1 text-sm bg-blue-100 text-blue-800'
    };
    return classes[status] || '';
  }

  canUnenrollStudent(enrollment: SubjectEnrollment): boolean {
    // Instructors can unenroll any student
    if (this.isInstructor()) return true;
    
    // Students can only unenroll themselves
    if (this.isStudent()) {
      const currentUser = this.authService.currentUser();
      if (!currentUser) return false;
      
      const student = this.dataService.students().find(s => s.user_id === currentUser.user_id);
      if (!student) return false;
      
      return enrollment.student_id === student.student_id;
    }
    
    return false;
  }
}
