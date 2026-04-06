import { Component, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { RoleService } from '../../services/role.service';
import { InstructorFormComponent } from './instructor-form/instructor-form.component';
import { StudentFormComponent, StudentFormData } from './student-form/student-form.component';
import { Instructor, Parent, Student } from '../../models/user.model';
import { LucideAngularModule, CheckCircle2, AlertCircle, X, UserCircle, GraduationCap } from 'lucide-angular';
import Swal from 'sweetalert2';

// Utility to generate unique IDs for users
function generateUniqueId(prefix: string) {
  return prefix + Date.now() + Math.floor(Math.random() * 10000);
}



@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [CommonModule, InstructorFormComponent, StudentFormComponent, LucideAngularModule],
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css']
})

export class CreateAccountComponent {
  @ViewChild(InstructorFormComponent) instructorForm?: InstructorFormComponent;
  @ViewChild(StudentFormComponent) studentForm?: StudentFormComponent;
  
  private dataService = inject(DataService);
  private roleService = inject(RoleService);
  
  // Lucide icons
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly X = X;
  readonly UserCircle = UserCircle;
  readonly GraduationCap = GraduationCap;
  
  activeTab = signal<'instructor' | 'student'>('instructor');
  
  // Role permissions
  canCreateInstructor = this.roleService.isAdmin;
  canCreateStudent = this.roleService.canCreateAccounts;

  constructor() {
    // Set default tab based on role
    if (!this.canCreateInstructor() && this.canCreateStudent()) {
      this.activeTab.set('student');
    }
  }

  setActiveTab(tab: 'instructor' | 'student') {
    this.activeTab.set(tab);
  }

  async onInstructorSubmit(instructor: Instructor) {
    try {
      // Check for duplicate email
      const emailExists = this.dataService.users().some(u => u.email === instructor.email);
      if (emailExists) {
        await Swal.fire({ title: 'Email already exists', text: 'An account with this email already exists.', icon: 'error' });
        return;
      }

      const userId = generateUniqueId('U');
      const user = {
        user_id: userId,
        email: instructor.email,
        password: 'instructor123', // Default password
        role: 'instructor' as const,
        first_name: instructor.first_name,
        middle_name: instructor.middle_name,
        last_name: instructor.last_name,
        full_name: instructor.full_name,
        created_at: new Date().toISOString()
      };
      
      console.log('Adding user:', user);
      await this.dataService.addUser(user);
      
      // Then create instructor profile
      const instructorWithUser = {
        ...instructor,
        user_id: userId,
        created_at: new Date().toISOString()
      };
      
      console.log('Adding instructor:', instructorWithUser);
      await this.dataService.addInstructor(instructorWithUser);
      
      // Reload instructors data
      await this.dataService.loadInstructors();
      
      await Swal.fire({
        title: 'Success!',
        html: 'Instructor account created successfully!<br><strong>Default password:</strong> instructor123<br><strong>Email:</strong> ' + user.email,
        icon: 'success',
        timer: 2500,
        showConfirmButton: false
      });
      
      // Reset form
      if (this.instructorForm) {
        this.instructorForm.resetForm();
      }
    } catch (error) {
      console.error('Error creating instructor account:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create instructor account. Please try again.';
      await Swal.fire({
        title: 'Error!',
        text: errorMsg,
        icon: 'error'
      });
    }
  }

  async onStudentSubmit(data: StudentFormData) {
    try {
      // Check for duplicate emails
      const existingEmails = this.dataService.users().map(u => u.email);
      if (existingEmails.includes(data.student.email)) {
        await Swal.fire({ title: 'Email already exists', text: `Student email "${data.student.email}" is already in use.`, icon: 'error' });
        return;
      }
      if (existingEmails.includes(data.parent.email)) {
        await Swal.fire({ title: 'Email already exists', text: `Parent email "${data.parent.email}" is already in use.`, icon: 'error' });
        return;
      }

      const studentUserId = generateUniqueId('U');
      const studentUser: any = {
        user_id: studentUserId,
        email: data.student.email,
        password: 'student123',
        role: 'student' as const,
        first_name: data.student.first_name,
        last_name: data.student.last_name,
        full_name: data.student.full_name,
        created_at: new Date().toISOString()
      };
      
      // Only add middle_name if it exists
      if (data.student.middle_name) {
        studentUser.middle_name = data.student.middle_name;
      }
      
      console.log('Adding student user:', studentUser);
      await this.dataService.addUser(studentUser);
      
      // Create student profile
      const studentWithUser: any = {
        student_id: data.student.student_id,
        first_name: data.student.first_name,
        last_name: data.student.last_name,
        full_name: data.student.full_name,
        email: data.student.email,
        grade_level: data.student.grade_level,
        section: data.student.section,
        qr_code_data: data.student.qr_code_data,
        instructor_id: data.student.instructor_id,
        user_id: studentUserId,
        created_at: new Date().toISOString()
      };
      
      // Only add middle_name if it exists
      if (data.student.middle_name) {
        studentWithUser.middle_name = data.student.middle_name;
      }
      
      console.log('Adding student profile:', studentWithUser);
      await this.dataService.addStudent(studentWithUser);
      
      // Create parent user account
      const parentUserId = generateUniqueId('U');
      const parentUser: any = {
        user_id: parentUserId,
        email: data.parent.email,
        password: 'parent123',
        role: 'parent' as const,
        first_name: data.parent.first_name,
        last_name: data.parent.last_name,
        full_name: data.parent.full_name,
        created_at: new Date().toISOString()
      };
      
      // Only add middle_name if it exists
      if (data.parent.middle_name) {
        parentUser.middle_name = data.parent.middle_name;
      }
      
      console.log('Adding parent user:', parentUser);
      await this.dataService.addUser(parentUser);
      
      // Create parent profile
      const parentWithUser: any = {
        parent_id: data.parent.parent_id,
        first_name: data.parent.first_name,
        last_name: data.parent.last_name,
        full_name: data.parent.full_name,
        email: data.parent.email,
        phone: data.parent.phone,
        student_id: data.parent.student_id,
        user_id: parentUserId,
        created_at: new Date().toISOString()
      };
      
      // Only add middle_name if it exists
      if (data.parent.middle_name) {
        parentWithUser.middle_name = data.parent.middle_name;
      }
      
      console.log('Adding parent profile:', parentWithUser);
      await this.dataService.addParent(parentWithUser);
      
      // Reload students and parents data
      await Promise.all([
        this.dataService.loadStudents(),
        this.dataService.loadParents(),
        this.dataService.loadUsers()
      ]);
      
      await Swal.fire({
        title: 'Success!',
        html: 'Student and parent accounts created successfully!<br><strong>Student Email:</strong> ' + studentUser.email + '<br><strong>Default Passwords:</strong> student123 / parent123',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
      
      // Reset form
      if (this.studentForm) {
        this.studentForm.resetForm();
      }
    } catch (error) {
      console.error('Error creating student account:', error);
      
      // Provide detailed error message
      let errorMsg = 'Failed to create student account. Please try again.';
      
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle HttpErrorResponse
        const httpError = error as any;
        if (httpError.status) {
          errorMsg = `Server Error (${httpError.status}): ${httpError.statusText || 'Unknown error'}`;
          if (httpError.error?.message) {
            errorMsg += ` - ${httpError.error.message}`;
          }
        } else if (httpError.message) {
          errorMsg = httpError.message;
        }
      }
      
      console.error('Detailed error:', errorMsg);
      
      await Swal.fire({
        title: 'Error!',
        text: errorMsg,
        icon: 'error'
      });
    }
  }
}
