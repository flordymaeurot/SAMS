import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { RoleService } from '../../services/role.service';
import { Subject } from '../../models/user.model';
import { LucideAngularModule, BookOpen, Users, UserCircle, GraduationCap } from 'lucide-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.css']
})
export class SubjectsComponent {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private roleService = inject(RoleService);
  
  // Lucide icons
  readonly BookOpen = BookOpen;
  readonly Users = Users;
  readonly UserCircle = UserCircle;
  readonly GraduationCap = GraduationCap;
  
  searchTerm = '';
  showCreateModal = signal(false);
  newSubject: any = {};

  isStudent = this.roleService.isStudent;
  canManage = this.roleService.canManageOwnSubjects;

  getInstructorName(instructorId: string): string {
    return this.dataService.instructors().find(i => i.instructor_id === instructorId)?.full_name || instructorId;
  }

  filteredSubjects = () => {
    const subjects = this.dataService.subjects();
    const user = this.authService.currentUser();
    
    let filtered = subjects;
    
    // Filter by instructor - each instructor only sees their own subjects
    if (this.roleService.isInstructor() && user) {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (instructor) {
        filtered = subjects.filter(s => s.instructor_id === instructor.instructor_id);
      }
    }
    
    // If student, only show enrolled subjects
    if (this.roleService.isStudent()) {
      const enrollments = this.dataService.enrollments();
      const enrolledSubjectIds = enrollments.map(e => e.subject_id);
      filtered = filtered.filter(s => enrolledSubjectIds.includes(s.subject_id));
    }
    
    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(s => 
        s.subject_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.subject_code.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  getEnrolledCount(subjectId: string): number {
    return this.dataService.enrollments().filter(e => e.subject_id === subjectId).length;
  }

  canManageSubject(subject: Subject): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    
    // Admin can manage all subjects
    if (this.roleService.isAdmin()) return true;
    
    // Instructor can only manage their own subjects
    if (this.roleService.isInstructor()) {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      return instructor?.instructor_id === subject.instructor_id;
    }
    
    return false;
  }

  async createSubject() {
    const user = this.authService.currentUser();
    if (!user) return;

    let instructorId: string;

    if (this.roleService.isAdmin()) {
      // Admin must pick an instructor — for now use the first available, or require selection
      // We'll use a prompt via Swal if there are instructors, otherwise block
      const instructors = this.dataService.instructors();
      if (instructors.length === 0) {
        await Swal.fire({ title: 'No Instructors', text: 'Create an instructor account first before adding subjects.', icon: 'warning' });
        return;
      }
      // Build options map
      const options: Record<string, string> = {};
      instructors.forEach(i => options[i.instructor_id] = i.full_name);
      const { value: selectedId } = await Swal.fire({
        title: 'Assign Instructor',
        input: 'select',
        inputOptions: options,
        inputPlaceholder: 'Select an instructor',
        showCancelButton: true,
        confirmButtonText: 'Continue'
      });
      if (!selectedId) return;
      instructorId = selectedId;
    } else {
      const instructor = this.dataService.instructors().find(i => i.user_id === user.user_id);
      if (!instructor) {
        await Swal.fire({ title: 'Error!', text: 'Instructor profile not found', icon: 'error' });
        return;
      }
      instructorId = instructor.instructor_id;
    }

    const subject: Subject = {
      subject_id: 'SUB' + Date.now(),
      subject_name: this.newSubject.subject_name,
      subject_code: this.newSubject.subject_code,
      instructor_id: instructorId,
      grade_level: this.newSubject.grade_level,
      section: this.newSubject.section,
      schedule: this.newSubject.schedule
    };

    try {
      await this.dataService.addSubject(subject);
      this.showCreateModal.set(false);
      this.newSubject = {};
      await Swal.fire({ title: 'Success!', text: 'Subject created successfully', icon: 'success', timer: 2000, showConfirmButton: false });
    } catch {
      await Swal.fire({ title: 'Error!', text: 'Failed to create subject', icon: 'error' });
    }
  }

  async deleteSubject(id: string) {
    const result = await Swal.fire({
      title: 'Delete Subject?',
      text: 'Are you sure you want to delete this subject? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await this.dataService.deleteSubject(id);
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Subject has been deleted',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        await Swal.fire({
          title: 'Error!',
          text: 'Failed to delete subject',
          icon: 'error'
        });
      }
    }
  }
}
