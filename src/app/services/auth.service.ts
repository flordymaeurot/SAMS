import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private isBrowser = isPlatformBrowser(this.platformId);
  private apiUrl = this.getApiUrl();
  currentUser = signal<User | null>(null);
  
  private getApiUrl(): string {
    // Determine API URL based on environment
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      // Mobile on same local network
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `${protocol}//${hostname}:3000`;
      }
    }
    
    // Default: use localhost (works for dev and local mobile testing)
    // For production on Vercel, deploy json-server to Render and update this URL
    return 'http://localhost:3000';
  }
  
  constructor(private router: Router) {
    this.loadUser();
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      // Fetch all users from JSON server
      const users = await firstValueFrom(this.http.get<User[]>(`${this.apiUrl}/users`));
      
      // Find user with matching email and password
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Remove password before storing
        const { password: _, ...userWithoutPassword } = user;
        this.currentUser.set(userWithoutPassword as User);
        
        if (this.isBrowser) {
          localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        }
        
        this.redirectByRole(user.role);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  logout() {
    this.currentUser.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    this.router.navigate(['/login']);
  }

  private loadUser() {
    if (this.isBrowser) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        this.currentUser.set(JSON.parse(stored));
      }
    }
  }

  private redirectByRole(role: string) {
    this.router.navigate(['/dashboard']);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role) : false;
  }
}
