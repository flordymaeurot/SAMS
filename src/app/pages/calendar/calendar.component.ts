import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, ChevronLeft, ChevronRight, X, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent {
  currentDate = signal(new Date());
  selectedDay = signal<any>(null);

  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly X = X;
  readonly Calendar = Calendar;

  private dataService = inject(DataService);
  private authService = inject(AuthService);

  // Role-filtered attendance
  private roleAttendance = computed(() => {
    const user = this.authService.currentUser();
    let records = this.dataService.attendance();
    if (user?.role === 'student') {
      const student = this.dataService.students().find(s => s.user_id === user.user_id);
      if (student) records = records.filter(a => a.student_id === student.student_id);
    } else if (user?.role === 'parent') {
      const parent = this.dataService.parents().find(p => p.user_id === user.user_id);
      if (parent) records = records.filter(a => a.student_id === parent.student_id);
    } else if (user?.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (instructor) records = records.filter(a => a.instructor_id === instructor.instructor_id);
    }
    return records;
  });

  currentMonthYear = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toDateString();
      const attendanceCount = this.roleAttendance()
        .filter(a => new Date(a.date).toDateString() === dateStr).length;

      days.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        attendanceCount
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  });

  selectedDayRecords = computed(() => {
    const day = this.selectedDay();
    if (!day) return [];
    const dateStr = day.date.toDateString();
    return this.roleAttendance()
      .filter(a => new Date(a.date).toDateString() === dateStr);
  });

  previousMonth() {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }

  nextMonth() {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }

  selectDay(day: any) {
    this.selectedDay.set(day);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
