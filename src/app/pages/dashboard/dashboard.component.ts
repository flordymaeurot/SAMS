import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { RoleService } from '../../services/role.service';
import { LucideAngularModule, Users, BookOpen, TrendingUp, UserX, ClipboardList, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private roleService = inject(RoleService);

  // Lucide icons
  readonly Users = Users;
  readonly BookOpen = BookOpen;
  readonly TrendingUp = TrendingUp;
  readonly UserX = UserX;
  readonly ClipboardList = ClipboardList;
  readonly CalendarIcon = Calendar;

  canTakeAttendance = this.roleService.canTakeAttendance;
  showQuickActions = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'instructor';
  });

  getIconComponent(iconName: string) {
    const iconMap: Record<string, any> = {
      'Users': this.Users,
      'BookOpen': this.BookOpen,
      'TrendingUp': this.TrendingUp,
      'UserX': this.UserX,
      'ClipboardList': this.ClipboardList
    };
    return iconMap[iconName];
  }

  stats = computed(() => {
    const role = this.authService.currentUser()?.role;
    const user = this.authService.currentUser();
    let students = this.dataService.students();
    let subjects = this.dataService.subjects();
    let attendance = this.dataService.attendance();
    
    // Filter data for instructors - only show their own data
    if (role === 'instructor' && user) {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (instructor) {
        subjects = subjects.filter(s => s.instructor_id === instructor.instructor_id);
        students = students.filter(st => st.instructor_id === instructor.instructor_id);
        attendance = attendance.filter(a => a.instructor_id === instructor.instructor_id);
      }
    }
    
    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
    const absentToday = attendance.filter(a => 
      new Date(a.date).toDateString() === new Date().toDateString() && a.status === 'Absent'
    ).length;

    return [
      { 
        label: 'Total Students', 
        value: students.length, 
        icon: 'Users', 
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-600'
      },
      { 
        label: 'Total Subjects', 
        value: subjects.length, 
        icon: 'BookOpen', 
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600'
      },
      { 
        label: 'Attendance Rate', 
        value: attendanceRate + '%', 
        icon: 'TrendingUp', 
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-600'
      },
      { 
        label: 'Absent Today', 
        value: absentToday, 
        icon: 'UserX', 
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
      }
    ];
  });

  recentAttendance = computed(() => {
    const role = this.authService.currentUser()?.role;
    const user = this.authService.currentUser();
    let attendance = this.dataService.attendance();
    
    // Filter attendance for instructors
    if (role === 'instructor' && user) {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (instructor) {
        attendance = attendance.filter(a => a.instructor_id === instructor.instructor_id);
      }
    }
    
    return attendance.slice(-5).reverse();
  });

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
