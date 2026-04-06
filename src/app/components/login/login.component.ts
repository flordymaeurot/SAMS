import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, CheckCircle2, AlertCircle, ArrowRight, Eye, EyeClosed } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  // Lucide icons
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly ArrowRight = ArrowRight;
  readonly Eye = Eye;
  readonly EyeClosed = EyeClosed;

  showPassword = signal(false);

  constructor(private authService: AuthService) {}

  async onSubmit() {
    this.loading.set(true);
    this.error.set('');

    const success = await this.authService.login(this.email, this.password);
    if (!success) {
      this.error.set('Invalid email or password');
    }
    this.loading.set(false);
  }
}
