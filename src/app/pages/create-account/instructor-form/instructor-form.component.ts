import { Component, Output, EventEmitter, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Instructor } from '../../../models/user.model';
import { DataService } from '../../../services/data.service';

@Component({
  selector: 'app-instructor-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-form.component.html',
  styleUrls: ['./instructor-form.component.css']
})
export class InstructorFormComponent {
  private dataService = inject(DataService);
  
  @Output() submitForm = new EventEmitter<Instructor>();
  
  loading = signal(false);
  departments = computed(() => this.dataService.departments());
  
  formData = {
    instructor_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: ''
  };

  onSubmit() {
    if (!this.isFormValid()) return;
    
    this.loading.set(true);
    
    const fullName = [
      this.formData.first_name,
      this.formData.middle_name,
      this.formData.last_name
    ].filter(n => n).join(' ');

    const instructor: Instructor = {
      instructor_id: this.formData.instructor_id,
      first_name: this.formData.first_name,
      middle_name: this.formData.middle_name || undefined,
      last_name: this.formData.last_name,
      full_name: fullName,
      email: this.formData.email,
      phone: this.formData.phone,
      department: this.formData.department,
      user_id: '',
      created_at: new Date().toISOString()
    };
    
    this.submitForm.emit(instructor);
    this.resetForm();
    this.loading.set(false);
  }

  isFormValid(): boolean {
    return !!(
      this.formData.instructor_id &&
      this.formData.first_name &&
      this.formData.last_name &&
      this.formData.email &&
      this.formData.department &&
      this.formData.phone
    );
  }

  resetForm() {
    this.formData = {
      instructor_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: ''
    };
  }
}
