import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Student, Subject, Attendance, SubjectEnrollment, Instructor, Parent, User, Department } from '../models/user.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';

  students = signal<Student[]>([]);
  subjects = signal<Subject[]>([]);
  attendance = signal<Attendance[]>([]);
  enrollments = signal<SubjectEnrollment[]>([]);
  instructors = signal<Instructor[]>([]);
  parents = signal<Parent[]>([]);
  users = signal<User[]>([]);
  departments = signal<Department[]>([]);

  constructor() {
    this.loadAllData();
  }

  async loadAllData() {
    await Promise.all([
      this.loadStudents(),
      this.loadSubjects(),
      this.loadAttendance(),
      this.loadEnrollments(),
      this.loadInstructors(),
      this.loadParents(),
      this.loadUsers(),
      this.loadDepartments()
    ]);
  }

  // Users
  async loadUsers() {
    try {
      const users = await firstValueFrom(this.http.get<User[]>(`${this.apiUrl}/users`));
      this.users.set(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async addUser(user: User) {
    try {
      const newUser = await firstValueFrom(this.http.post<User>(`${this.apiUrl}/users`, user));
      this.users.update(u => [...u, newUser]);
      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async updateUser(user: User) {
    try {
      const updated = await firstValueFrom(this.http.put<User>(`${this.apiUrl}/users/${user.user_id}`, user));
      this.users.update(u => u.map(usr => usr.user_id === user.user_id ? updated : usr));
      return updated;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      console.log('Deleting user:', userId);
      
      // Find the numeric ID from the user object
      const user = this.users().find(u => u.user_id === userId);
      if (!user) {
        console.warn('User not found in local data:', userId);
        throw new Error('User not found');
      }
      
      const numericId = (user as any).id;
      console.log('Numeric ID:', numericId);
      
      try {
        // Use numeric ID for JSON Server delete
        await firstValueFrom(this.http.delete(`${this.apiUrl}/users/${numericId}`));
        console.log('User deleted from server');
      } catch (error: any) {
        if (error?.status === 404) {
          console.log('User not found on server (404), proceeding with UI removal');
        } else {
          throw error;
        }
      }
      
      // Update UI signal by user_id
      console.log('Updating signal to remove user');
      const beforeCount = this.users().length;
      this.users.update(u => u.filter(usr => usr.user_id !== userId));
      const afterCount = this.users().length;
      
      console.log(`Signal updated: ${beforeCount} -> ${afterCount} users`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Students
  async loadStudents() {
    try {
      const students = await firstValueFrom(this.http.get<Student[]>(`${this.apiUrl}/students`));
      this.students.set(students);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }

  getStudents() { return this.students(); }
  
  async addStudent(student: Student) {
    try {
      const newStudent = await firstValueFrom(this.http.post<Student>(`${this.apiUrl}/students`, student));
      this.students.update(s => [...s, newStudent]);
      return newStudent;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  }

  async updateStudent(student: Student) {
    try {
      const updated = await firstValueFrom(this.http.put<Student>(`${this.apiUrl}/students/${student.student_id}`, student));
      this.students.update(s => s.map(st => st.student_id === student.student_id ? updated : st));
      return updated;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  async deleteStudent(studentId: string) {
    try {
      console.log('Deleting student:', studentId);
      const student = this.students().find(s => s.student_id === studentId);
      if (!student || !(student as any).id) {
        console.warn('Student not found:', studentId);
        throw new Error('Student not found');
      }
      
      await firstValueFrom(this.http.delete(`${this.apiUrl}/students/${(student as any).id}`)).catch((e: any) => {
        if (e?.status === 404) {
          console.log('Student not found on server (404)');
        } else {
          throw e;
        }
      });
      this.students.update(s => s.filter(st => st.student_id !== studentId));
      console.log('Student deleted');
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  // Subjects
  async loadSubjects() {
    try {
      const subjects = await firstValueFrom(this.http.get<Subject[]>(`${this.apiUrl}/subjects`));
      this.subjects.set(subjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  }

  getSubjects() { return this.subjects(); }
  
  async addSubject(subject: Subject) {
    try {
      const newSubject = await firstValueFrom(this.http.post<Subject>(`${this.apiUrl}/subjects`, subject));
      this.subjects.update(s => [...s, newSubject]);
      return newSubject;
    } catch (error) {
      console.error('Error adding subject:', error);
      throw error;
    }
  }

  async updateSubject(subject: Subject) {
    try {
      const updated = await firstValueFrom(this.http.put<Subject>(`${this.apiUrl}/subjects/${subject.subject_id}`, subject));
      this.subjects.update(s => s.map(sub => sub.subject_id === subject.subject_id ? updated : sub));
      return updated;
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  }

  async deleteSubject(id: string) {
    try {
      const subject = this.subjects().find(s => s.subject_id === id);
      const deleteId = subject ? (subject as any).id || id : id;
      
      await firstValueFrom(this.http.delete(`${this.apiUrl}/subjects/${deleteId}`)).catch((e: any) => {
        if (e?.status === 404) {
          console.log('Subject not found on server (404)');
        } else {
          throw e;
        }
      });
      this.subjects.update(s => s.filter(sub => sub.subject_id !== id));
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  }

  // Attendance
  async loadAttendance() {
    try {
      const attendance = await firstValueFrom(this.http.get<Attendance[]>(`${this.apiUrl}/attendance`));
      this.attendance.set(attendance);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  }

  getAttendance() { return this.attendance(); }
  
  async addAttendance(record: Attendance) {
    // Check for duplicate
    const exists = this.attendance().some(a => 
      a.student_id === record.student_id && 
      a.subject_id === record.subject_id && 
      new Date(a.date).toDateString() === new Date(record.date).toDateString()
    );
    if (exists) return false;

    try {
      const newRecord = await firstValueFrom(this.http.post<Attendance>(`${this.apiUrl}/attendance`, record));
      this.attendance.update(a => [...a, newRecord]);
      return true;
    } catch (error) {
      console.error('Error adding attendance:', error);
      return false;
    }
  }

  // Enrollments
  async loadEnrollments() {
    try {
      const enrollments = await firstValueFrom(this.http.get<SubjectEnrollment[]>(`${this.apiUrl}/enrollments`));
      this.enrollments.set(enrollments);
    } catch (error) {
      console.error('Error loading enrollments:', error);
    }
  }

  getEnrollments() { return this.enrollments(); }
  
  async enrollStudent(enrollment: SubjectEnrollment) {
    try {
      const newEnrollment = await firstValueFrom(this.http.post<SubjectEnrollment>(`${this.apiUrl}/enrollments`, enrollment));
      this.enrollments.update(e => [...e, newEnrollment]);
      return newEnrollment;
    } catch (error) {
      console.error('Error enrolling student:', error);
      throw error;
    }
  }

  async unenrollStudent(enrollmentId: string) {
    try {
      const enrollment = this.enrollments().find(e => e.enrollment_id === enrollmentId);
      const deleteId = enrollment ? (enrollment as any).id || enrollmentId : enrollmentId;
      
      await firstValueFrom(this.http.delete(`${this.apiUrl}/enrollments/${deleteId}`)).catch((e: any) => {
        if (e?.status === 404) {
          console.log('Enrollment not found on server (404)');
        } else {
          throw e;
        }
      });
      this.enrollments.update(e => e.filter(enr => enr.enrollment_id !== enrollmentId));
    } catch (error) {
      console.error('Error unenrolling student:', error);
      throw error;
    }
  }

  // Instructors
  async loadInstructors() {
    try {
      const instructors = await firstValueFrom(this.http.get<Instructor[]>(`${this.apiUrl}/instructors`));
      this.instructors.set(instructors);
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  }

  getInstructors() { return this.instructors(); }

  async getInstructorByUserId(userId: string): Promise<Instructor | undefined> {
    try {
      const instructors = await firstValueFrom(this.http.get<Instructor[]>(`${this.apiUrl}/instructors?user_id=${userId}`));
      return instructors[0];
    } catch (error) {
      console.error('Error getting instructor by user ID:', error);
      return undefined;
    }
  }

  
  async addInstructor(instructor: Instructor) {
    try {
      const newInstructor = await firstValueFrom(this.http.post<Instructor>(`${this.apiUrl}/instructors`, instructor));
      this.instructors.update(i => [...i, newInstructor]);
      return newInstructor;
    } catch (error) {
      console.error('Error adding instructor:', error);
      throw error;
    }
  }

  async updateInstructor(instructor: Instructor) {
    try {
      const updated = await firstValueFrom(this.http.put<Instructor>(`${this.apiUrl}/instructors/${instructor.instructor_id}`, instructor));
      this.instructors.update(i => i.map(inst => inst.instructor_id === instructor.instructor_id ? updated : inst));
      return updated;
    } catch (error) {
      console.error('Error updating instructor:', error);
      throw error;
    }
  }

  async deleteInstructor(instructorId: string) {
    try {
      const instructor = this.instructors().find(i => i.instructor_id === instructorId);
      if (!instructor || !(instructor as any).id) {
        console.warn('Instructor not found:', instructorId);
        throw new Error('Instructor not found');
      }
      
      await firstValueFrom(this.http.delete(`${this.apiUrl}/instructors/${(instructor as any).id}`)).catch((e: any) => {
        if (e?.status === 404) {
          console.log('Instructor not found on server (404)');
        } else {
          throw e;
        }
      });
      this.instructors.update(i => i.filter(inst => inst.instructor_id !== instructorId));
    } catch (error) {
      console.error('Error deleting instructor:', error);
      throw error;
    }
  }

  // Parents
  async loadParents() {
    try {
      const parents = await firstValueFrom(this.http.get<Parent[]>(`${this.apiUrl}/parents`));
      this.parents.set(parents);
    } catch (error) {
      console.error('Error loading parents:', error);
    }
  }

  getParents() { return this.parents(); }
  
  async addParent(parent: Parent) {
    try {
      const newParent = await firstValueFrom(this.http.post<Parent>(`${this.apiUrl}/parents`, parent));
      this.parents.update(p => [...p, newParent]);
      return newParent;
    } catch (error) {
      console.error('Error adding parent:', error);
      throw error;
    }
  }

  async updateParent(parent: Parent) {
    try {
      const updated = await firstValueFrom(this.http.put<Parent>(`${this.apiUrl}/parents/${parent.parent_id}`, parent));
      this.parents.update(p => p.map(par => par.parent_id === parent.parent_id ? updated : par));
      return updated;
    } catch (error) {
      console.error('Error updating parent:', error);
      throw error;
    }
  }

  async deleteParent(parentId: string) {
    try {
      const parent = this.parents().find(p => p.parent_id === parentId);
      if (!parent || !(parent as any).id) {
        console.warn('Parent not found:', parentId);
        throw new Error('Parent not found');
      }
      
      await firstValueFrom(this.http.delete(`${this.apiUrl}/parents/${(parent as any).id}`)).catch((e: any) => {
        if (e?.status === 404) {
          console.log('Parent not found on server (404)');
        } else {
          throw e;
        }
      });
      this.parents.update(p => p.filter(par => par.parent_id !== parentId));
    } catch (error) {
      console.error('Error deleting parent:', error);
      throw error;
    }
  }

  // Departments
  async loadDepartments() {
    try {
      const departments = await firstValueFrom(this.http.get<Department[]>(`${this.apiUrl}/departments`));
      this.departments.set(departments);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }

  getDepartments() { return this.departments(); }
  
  async addDepartment(department: Department) {
    try {
      const newDepartment = await firstValueFrom(this.http.post<Department>(`${this.apiUrl}/departments`, department));
      this.departments.update(d => [...d, newDepartment]);
      return newDepartment;
    } catch (error) {
      console.error('Error adding department:', error);
      throw error;
    }
  }

  async updateDepartment(department: Department) {
    try {
      const updated = await firstValueFrom(this.http.put<Department>(`${this.apiUrl}/departments/${department.id}`, department));
      this.departments.update(d => d.map(dept => dept.id === department.id ? updated : dept));
      return updated;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  async deleteDepartment(id: number) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/departments/${id}`));
      this.departments.update(d => d.filter(dept => dept.id !== id));
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }
}
