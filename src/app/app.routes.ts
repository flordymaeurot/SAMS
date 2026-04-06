import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SubjectsComponent } from './pages/subjects/subjects.component';
import { SubjectDetailComponent } from './pages/subject-detail/subject-detail.component';
import { TakeAttendanceComponent } from './pages/take-attendance/take-attendance.component';
import { AttendanceRecordsComponent } from './pages/attendance-records/attendance-records.component';
import { CreateAccountComponent } from './pages/create-account/create-account.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AccountsComponent } from './pages/accounts/accounts.component';
import { DepartmentsComponent } from './pages/departments/departments.component';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [roleGuard(['admin', 'instructor', 'student', 'parent'])] },
      { path: 'accounts', component: AccountsComponent, canActivate: [roleGuard(['admin'])] },
      { path: 'departments', component: DepartmentsComponent, canActivate: [roleGuard(['admin'])] },
      { path: 'subjects', component: SubjectsComponent, canActivate: [roleGuard(['admin', 'instructor', 'student'])] },
      { path: 'subject/:id', component: SubjectDetailComponent, data: { renderMode: 'client' } },
      { path: 'take-attendance', component: TakeAttendanceComponent, canActivate: [roleGuard(['instructor', 'student'])] },
      { path: 'attendance-records', component: AttendanceRecordsComponent },
      { path: 'create-account', component: CreateAccountComponent, canActivate: [roleGuard(['admin', 'instructor'])] },
      { path: 'reports', component: ReportsComponent, canActivate: [roleGuard(['admin', 'instructor'])] },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
