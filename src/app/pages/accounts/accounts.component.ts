import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { LucideAngularModule, UserCircle, Mail, Calendar, Shield, X, Edit2, Trash2 } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent {
  dataService = inject(DataService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';

  // Icons
  readonly UserCircle = UserCircle;
  readonly Mail = Mail;
  readonly Calendar = Calendar;
  readonly Shield = Shield;
  readonly X = X;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;

  selectedAccount = signal<User | null>(null);
  selectedInstructorDetails = signal<any>(null);
  showModal = signal(false);
  isEditing = signal(false);
  editForm = signal({
    full_name: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    role: 'instructor' as 'admin' | 'instructor' | 'student' | 'parent'
  });

  // Update form field helper
  updateFormField(field: string, value: string) {
    const current = this.editForm();
    this.editForm.set({
      ...current,
      [field]: value
    });
  }

  // Handle input event for form fields
  onFormFieldChange(field: string, event: Event) {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.updateFormField(field, value);
  }

  allAccounts = computed(() => {
    return this.dataService.users().filter(u => u.user_id !== '1'); // Exclude master admin
  });

  instructorAccounts = computed(() => {
    return this.allAccounts().filter(u => u.role === 'instructor');
  });

  studentAccounts = computed(() => {
    return this.allAccounts().filter(u => u.role === 'student');
  });

  parentAccounts = computed(() => {
    return this.allAccounts().filter(u => u.role === 'parent');
  });

  viewAccount(account: User) {
    this.selectedAccount.set(account);
    
    // Load instructor details if it's an instructor
    if (account.role === 'instructor') {
      const instructor = this.dataService.instructors().find(i => i.user_id === account.user_id);
      this.selectedInstructorDetails.set(instructor || null);
    } else {
      this.selectedInstructorDetails.set(null);
    }
    
    this.showModal.set(true);
    this.isEditing.set(false);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedAccount.set(null);
    this.selectedInstructorDetails.set(null);
    this.isEditing.set(false);
  }

  startEdit() {
    const account = this.selectedAccount();
    const instructorDetails = this.selectedInstructorDetails();
    
    if (account) {
      this.editForm.set({
        full_name: account.full_name,
        first_name: account.first_name,
        middle_name: account.middle_name || '',
        last_name: account.last_name,
        email: account.email,
        phone: instructorDetails?.phone || '',
        department: instructorDetails?.department || '',
        role: account.role
      });
      this.isEditing.set(true);
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  async saveEdit() {
    const account = this.selectedAccount();
    if (!account) return;

    const form = this.editForm();
    
    try {
      // Generate full name
      const fullName = form.middle_name 
        ? `${form.first_name} ${form.middle_name} ${form.last_name}`
        : `${form.first_name} ${form.last_name}`;
      
      const updatedUser: User = {
        ...account,
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        full_name: fullName,
        email: form.email,
        role: form.role
      };

      // Update in parallel if instructor
      const updatePromises: Promise<any>[] = [
        this.dataService.updateUser(updatedUser)
      ];

      // Update instructor details if it's an instructor
      if (account.role === 'instructor') {
        const instructorDetails = this.selectedInstructorDetails();
        if (instructorDetails) {
          const updatedInstructor = {
            ...instructorDetails,
            first_name: form.first_name,
            middle_name: form.middle_name,
            last_name: form.last_name,
            full_name: fullName,
            email: form.email,
            phone: form.phone,
            department: form.department
          };
          updatePromises.push(this.dataService.updateInstructor(updatedInstructor));
        }
      }

      // Wait for updates
      await Promise.all(updatePromises);
      
      this.selectedAccount.set(updatedUser);
      this.isEditing.set(false);
      
      await Swal.fire({
        title: 'Updated!',
        text: 'Account updated successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating account:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to update account.',
        icon: 'error'
      });
    }
  }

  getRoleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      'admin': 'badge-admin',
      'instructor': 'badge-instructor',
      'student': 'badge-student',
      'parent': 'badge-parent'
    };
    return classes[role] || '';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInstructorDepartment(userId: string): string {
    const instructor = this.dataService.instructors().find(i => i.user_id === userId);
    return instructor?.department || '';
  }

  async deleteAccount() {
    const account = this.selectedAccount();
    if (!account) return;

    const result = await Swal.fire({
      title: 'Delete Account?',
      html: `Are you sure you want to delete <strong>${account.full_name}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const userId = account.user_id;
      this.closeModal();

      const deleteOps: Promise<any>[] = [];

      if (account.role === 'instructor') {
        const instructor = this.dataService.instructors().find(i => i.user_id === userId);
        if (instructor) {
          const subjects = this.dataService.subjects().filter(s => s.instructor_id === instructor.instructor_id);
          for (const subject of subjects) {
            deleteOps.push(this.dataService.deleteSubject(subject.subject_id).catch(() => {}));
          }
          deleteOps.push(this.dataService.deleteInstructor(instructor.instructor_id).catch(() => {}));
        }
      } else if (account.role === 'student') {
        const student = this.dataService.students().find(s => s.user_id === userId);
        if (student) {
          const parent = this.dataService.parents().find(p => p.student_id === student.student_id);
          if (parent) {
            deleteOps.push(this.dataService.deleteParent(parent.parent_id).catch(() => {}));
            deleteOps.push(this.dataService.deleteUser(parent.user_id).catch(() => {}));
          }
          deleteOps.push(this.dataService.deleteStudent(student.student_id).catch(() => {}));
        }
      } else if (account.role === 'parent') {
        const parent = this.dataService.parents().find(p => p.user_id === userId);
        if (parent) {
          deleteOps.push(this.dataService.deleteParent(parent.parent_id).catch(() => {}));
        }
      }

      if (deleteOps.length > 0) await Promise.all(deleteOps);
      await this.dataService.deleteUser(userId);

      await Swal.fire({ title: 'Deleted!', text: 'Account deleted successfully.', icon: 'success', timer: 1000, showConfirmButton: false });
    } catch (error: any) {
      await Swal.fire({ title: 'Error!', text: error?.message || 'Failed to delete account.', icon: 'error' });
    }
  }
}
