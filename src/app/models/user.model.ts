export interface User {
  id?: number;
  user_id: string;
  email: string;
  password?: string;
  role: 'admin' | 'instructor' | 'student' | 'parent';
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name: string;
  created_at: string;
}

export interface Instructor {
  id?: number;
  instructor_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  user_id: string;
  created_at: string;
}

export interface Student {
  id?: number;
  student_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name: string;
  email: string;
  grade_level: string;
  section: string;
  qr_code_data: string;
  instructor_id: string;
  user_id: string;
  created_at: string;
}

export interface Parent {
  id?: number;
  parent_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  student_id: string;
  user_id: string;
  created_at: string;
}

export interface Subject {
  id?: number;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  instructor_id: string;
  instructor_name?: string; // deprecated - use instructor_id to look up
  grade_level: string;
  section: string;
  schedule: string;
}

export interface SubjectEnrollment {
  id?: number;
  enrollment_id: string;
  subject_id: string;
  student_id: string;
  student_name?: string; // deprecated - use student_id to look up
  subject_name?: string; // deprecated - use subject_id to look up
  enrolled_date: Date;
}

export interface Attendance {
  id?: number;
  attendance_id: string;
  student_id: string;
  student_name: string;
  instructor_id: string;
  subject_id: string;
  subject_name: string;
  date: Date;
  time: string;
  status: 'Present' | 'Late' | 'Absent' | 'Excused';
  method: 'QR' | 'Manual';
}

export interface Department {
  id?: number;
  name: string;
  created_at: string;
}
