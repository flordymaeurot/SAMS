import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';
import { LucideAngularModule, LayoutDashboard, BookOpen, ClipboardList, BarChart3, UserPlus, Settings, LogOut, ChevronLeft, ChevronRight, Users, Building2 } from 'lucide-angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  authService = inject(AuthService);
  router = inject(Router);
  
  // Lucide icons
  readonly LayoutDashboard = LayoutDashboard;
  readonly BookOpen = BookOpen;
  readonly ClipboardList = ClipboardList;
  readonly BarChart3 = BarChart3;
  readonly UserPlus = UserPlus;
  readonly Users = Users;
  readonly Building2 = Building2;
  readonly Settings = Settings;
  readonly LogOut = LogOut;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  
  sidebarCollapsed = signal(false);
  currentUser = this.authService.currentUser;

  constructor() {
    // Listen to route changes to update page title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Page title will be derived from route
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  getUserInitials(): string {
    const email = this.currentUser()?.email || '';
    return email.charAt(0).toUpperCase();
  }

  getPageTitle(): string {
    const url = this.router.url;
    const titleMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/accounts': 'Account Management',
      '/departments': 'Departments',
      '/subjects': 'Subjects',
      '/take-attendance': 'Take Attendance',
      '/attendance-records': this.currentUser()?.role === 'parent' ? "My Child's Attendance" : 'Attendance Records',
      '/create-account': 'Create Account',
      '/reports': 'Reports',
      '/settings': 'Settings'
    };
    
    for (const [path, title] of Object.entries(titleMap)) {
      if (url.startsWith(path)) return title;
    }
    return 'Attendance System';
  }

  menuItems = () => {
    const role = this.currentUser()?.role;
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['admin', 'instructor', 'student', 'parent'] },
      { path: '/accounts', label: 'Accounts', icon: 'Users', roles: ['admin'] },
      { path: '/departments', label: 'Departments', icon: 'Building2', roles: ['admin'] },
      { path: '/departments', label: 'Departments', icon: 'Building2', roles: ['admin'] },
      { path: '/subjects', label: role === 'student' ? 'My Subjects' : 'Subjects', icon: 'BookOpen', roles: ['instructor', 'student'] },
      { path: '/take-attendance', label: 'Take Attendance', icon: 'ClipboardList', roles: ['instructor'] },
      { path: '/take-attendance', label: 'Scan QR', icon: 'ClipboardList', roles: ['student'] },
      { path: '/attendance-records', label: role === 'parent' ? "My Child's Records" : 'Attendance Records', icon: 'ClipboardList', roles: ['admin', 'instructor', 'student', 'parent'] },
      { path: '/create-account', label: 'Create Account', icon: 'UserPlus', roles: ['admin', 'instructor'] },
      { path: '/reports', label: 'Reports', icon: 'BarChart3', roles: ['admin', 'instructor'] },
      { path: '/settings', label: 'Settings', icon: 'Settings', roles: ['admin', 'instructor', 'student', 'parent'] }
    ];
    return items.filter(item => item.roles.includes(role || ''));
  };

  getIconComponent(iconName: string) {
    const iconMap: Record<string, any> = {
      'LayoutDashboard': this.LayoutDashboard,
      'Users': this.Users,
      'Building2': this.Building2,
      'BookOpen': this.BookOpen,
      'ClipboardList': this.ClipboardList,
      'BarChart3': this.BarChart3,
      'UserPlus': this.UserPlus,
      'Settings': this.Settings
    };
    return iconMap[iconName];
  }

  logout() {
    this.authService.logout();
  }
}
