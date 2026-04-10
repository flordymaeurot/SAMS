import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { ThemeService, THEMES, Theme } from '../../services/theme.service';
import { LucideAngularModule, Eye, EyeClosed } from 'lucide-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private dataService = inject(DataService);
  themeService = inject(ThemeService);

  readonly themes = THEMES;

  profileForm: any = { email: '', name: '' };
  passwordForm: any = { current: '', new: '', confirm: '' };
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  readonly Eye = Eye;
  readonly EyeClosed = EyeClosed;
  showCurrent = signal(false);
  showNew = signal(false);
  showConfirm = signal(false);

  constructor() {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.email = user.email;
      this.profileForm.name = user.full_name;
    }
  }

  async updateProfile() {
    const user = this.authService.currentUser();
    if (!user) return;

    if (!this.profileForm.email) {
      this.showMessage('Email is required', 'error');
      return;
    }

    try {
      const updated = await this.dataService.updateUser({
        ...user,
        email: this.profileForm.email,
        full_name: this.profileForm.name,
        first_name: user.first_name,
        last_name: user.last_name
      });
      // Refresh session
      const { password: _, ...withoutPassword } = updated as any;
      this.authService.currentUser.set(withoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(withoutPassword));
      this.showMessage('Profile updated successfully', 'success');
    } catch {
      this.showMessage('Failed to update profile', 'error');
    }
  }

  async changePassword() {
    if (!this.passwordForm.current || !this.passwordForm.new || !this.passwordForm.confirm) {
      this.showMessage('All fields are required', 'error');
      return;
    }
    if (this.passwordForm.new !== this.passwordForm.confirm) {
      this.showMessage('New passwords do not match', 'error');
      return;
    }
    if (this.passwordForm.new.length < 6) {
      this.showMessage('Password must be at least 6 characters', 'error');
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    // Verify current password against DB
    try {
      const users = await this.dataService.loadUsers().then(() => this.dataService.users());
      const dbUser = users.find(u => u.user_id === user.user_id);
      if (!dbUser || (dbUser as any).password !== this.passwordForm.current) {
        this.showMessage('Current password is incorrect', 'error');
        return;
      }

      await this.dataService.updateUser({ ...dbUser, password: this.passwordForm.new });
      this.passwordForm = { current: '', new: '', confirm: '' };
      this.showMessage('Password changed successfully', 'success');
    } catch {
      this.showMessage('Failed to change password', 'error');
    }
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message.set(msg);
    this.messageType.set(type);
    setTimeout(() => this.message.set(''), 3000);
  }
}
