import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, ClipboardList, QrCode, Pencil } from 'lucide-angular';

@Component({
  selector: 'app-attendance-records',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './attendance-records.component.html',
  styleUrls: ['./attendance-records.component.css']
})
export class AttendanceRecordsComponent {
  dataService = inject(DataService);
  authService = inject(AuthService);
  
  // Lucide icons
  readonly ClipboardList = ClipboardList;
  readonly QrCode = QrCode;
  readonly Pencil = Pencil;
  
  filterSubject = '';
  filterStatus = '';
  searchTerm = '';

  subjects = computed(() => {
    const user = this.authService.currentUser();
    const all = this.dataService.subjects();
    if (user?.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      return instructor ? all.filter(s => s.instructor_id === instructor.instructor_id) : [];
    }
    if (user?.role === 'student') {
      const student = this.dataService.students().find(s => s.user_id === user.user_id);
      if (!student) return [];
      const enrolledIds = this.dataService.enrollments().filter(e => e.student_id === student.student_id).map(e => e.subject_id);
      return all.filter(s => enrolledIds.includes(s.subject_id));
    }
    if (user?.role === 'parent') {
      const parent = this.dataService.parents().find(p => p.user_id === user.user_id);
      if (!parent) return [];
      const enrolledIds = this.dataService.enrollments().filter(e => e.student_id === parent.student_id).map(e => e.subject_id);
      return all.filter(s => enrolledIds.includes(s.subject_id));
    }
    return all;
  });

  filteredRecords = computed(() => {
    let records = this.dataService.attendance();
    const user = this.authService.currentUser();

    // Role-based filtering
    if (user?.role === 'student') {
      const student = this.dataService.students().find(s => s.user_id === user.user_id);
      if (student) {
        records = records.filter(r => r.student_id === student.student_id);
      }
    } else if (user?.role === 'parent') {
      const parent = this.dataService.parents().find(p => p.user_id === user.user_id);
      if (parent) {
        records = records.filter(r => r.student_id === parent.student_id);
      }
    } else if (user?.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (instructor) {
        records = records.filter(r => r.instructor_id === instructor.instructor_id);
      }
    }

    // Apply filters
    if (this.filterSubject) {
      records = records.filter(r => r.subject_id === this.filterSubject);
    }
    if (this.filterStatus) {
      records = records.filter(r => r.status === this.filterStatus);
    }
    if (this.searchTerm) {
      records = records.filter(r => 
        r.student_name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'Present': 'bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-sm font-medium',
      'Late': 'bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-sm font-medium',
      'Absent': 'bg-red-100 text-red-700 rounded-full px-3 py-1 text-sm font-medium',
      'Excused': 'bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm font-medium'
    };
    return classes[status] || '';
  }
}
