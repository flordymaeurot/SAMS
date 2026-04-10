# SAMS — Student Attendance Management System
## Project Documentation

---

## Overview

SAMS is a web-based attendance management system built with **Angular 21** and **JSON Server**. It supports four user roles — Admin, Instructor, Student, and Parent — each with their own dashboard, permissions, and features.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components, signals) |
| Styling | Tailwind CSS + custom CSS variables |
| Backend | JSON Server (local REST API) |
| QR Generation | `qrcode` library |
| QR Scanning | `@zxing/library` |
| Icons | Lucide Angular |
| Alerts | SweetAlert2 |
| Calendar | FullCalendar v6 |
| Reports Export | SheetJS (xlsx) |

---

## User Roles & Access

| Feature | Admin | Instructor | Student | Parent |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Manage Accounts | ✓ | — | — | — |
| Manage Departments | ✓ | — | — | — |
| Create Instructor Account | ✓ | — | — | — |
| Create Student Account | ✓ | ✓ | — | — |
| Manage Subjects | ✓ | ✓ (own only) | — | — |
| View Subjects | — | ✓ | ✓ (enrolled) | — |
| Take Attendance (Manual/QR) | — | ✓ | — | — |
| Scan QR Code | — | — | ✓ | — |
| View Attendance Records | ✓ (all) | ✓ (own subjects) | ✓ (own) | ✓ (child's) |
| Reports & Export | ✓ | ✓ (own subjects) | — | — |
| Settings | ✓ | ✓ | ✓ | ✓ |

---

## Features

### Authentication
- Email and password login
- Role-based redirect on login (all roles go to Dashboard)
- Session persisted in `localStorage`
- Route guards prevent unauthorized access

### Dashboard
- All roles have a dashboard with role-specific stats
- **Admin/Instructor**: Total students, subjects, attendance rate, absents today
- **Student**: Enrolled subjects count, total records, attendance rate, absences
- **Parent**: Child's records, present count, attendance rate, absences
- Quick action links per role
- Attendance calendar embedded for all roles

### Accounts Management (Admin only)
- View all accounts grouped by role: Instructors, Students, Parents
- Edit account details (name, email, phone, department)
- Delete accounts — cascades to related records (subjects, enrollments, student/parent profiles)
- Duplicate email validation on creation

### Create Account
- **Instructor tab** (Admin only): Creates user + instructor profile, default password shown on success
- **Student tab** (Admin + Instructor): Creates student + parent accounts simultaneously, default passwords shown
- Forms reset after successful submission
- Duplicate email check before saving

### Subjects
- Instructors see and manage only their own subjects
- Students see only their enrolled subjects
- Admin can create subjects and assign to any instructor
- Enrolled student count shown per subject
- Delete subject with confirmation

### Subject Detail
- Enrolled students list (names looked up live, not stored redundantly)
- Enroll / Unenroll students with confirmation dialog
- Attendance records tab for that subject
- "Take Attendance" button links directly to the attendance page for that subject

### Take Attendance

#### Instructor View
Two tabs:
1. **Manual Entry** — list of enrolled students with status dropdown (Present/Late/Absent/Excused) + manual ID entry field
2. **Generate QR** — two-column layout:
   - Left: QR code generator with session duration selector, active/expiring/expired status indicator, download and copy buttons
   - Right: Live scan feed showing students as they scan in real time (polls every 3 seconds)

#### Student View
- Skips subject selector entirely — goes straight to the scanner
- **Start Camera** — opens device camera and continuously scans for QR codes
- **Upload QR Code Image** — fallback option to upload a photo of the QR code from the device gallery
- Shows today's attendance history after scanning

### QR Code System
- Each generated QR encodes: `ATTEND:<subjectId>:<expiryTimestamp>`
- Expiry is enforced on the scanner side — expired QR codes are rejected with a SweetAlert notification
- Duplicate scan prevention — same session cannot be scanned twice by the same student
- Session duration options: 5, 10, 15, 30, 45, 60 minutes

### Attendance Records
- Filterable by subject, status, and search term
- Subject dropdown scoped by role (students/parents only see relevant subjects)
- Summary stats at the bottom (Present, Late, Absent, Excused counts)
- Sorted by date, newest first

### Calendar
- Embedded in the Dashboard for all roles
- Shows attendance count per day
- Click any day to see detailed records for that date
- Filtered by role — students see only their own, parents see their child's, instructors see their subjects only

### Reports (Admin + Instructor)
- Filter by subject and date range (7/30/90 days)
- Bar chart and distribution chart of attendance by status
- Shows empty state when no data matches filters
- Export to Excel — monthly report with student names, days conducted, days attended, percentage
- Instructors only see their own subjects in the filter dropdown

### Settings
- **Profile**: Update email and full name — saves to database and refreshes session immediately
- **Password**: Change password with current password verification, minimum 6 characters, match confirmation
- **Appearance**: Choose from 6 color themes — applies instantly and persists across sessions

### Departments
- Admin can add, edit, and delete departments
- Department list is used as the dropdown in instructor account creation

---

## Themes

Six themes available in Settings → Appearance:

| Theme | Description |
|---|---|
| Amber Dusk | Warm amber & orange (default) |
| Ocean Breeze | Cool sky blue & indigo |
| Forest Canopy | Fresh green & lime |
| Rose Garden | Bold rose & pink |
| Violet Dusk | Deep purple & violet |
| Midnight Slate | Minimal dark charcoal |

Themes affect: sidebar background, active nav link, all primary buttons, subject cards, tab indicators, form focus rings, and icon badges.

---

## Improvements Made

### Bug Fixes
- **Delete not persisting** — all delete and update operations now use the numeric `id` field required by JSON Server. Previously used string IDs which caused silent failures.
- **Enrollment names blank** — subject detail page was reading `enrollment.student_name` which was removed as redundant. Now does a live lookup by `student_id`.
- **Settings forms fake** — profile update and password change previously only showed a toast without saving. Now makes real API calls.
- **Instructor delete failing** — cascade delete now runs sequentially (enrollments → subjects → instructor profile → user) instead of parallel, preventing race conditions.
- **QR session expiry not enforced** — expiry timestamp is now encoded in the QR data itself and validated on scan.
- **Camera not opening** — Angular was trying to access the `<video>` element before it was rendered in the DOM. Fixed by triggering change detection and waiting before accessing the element.
- **Students seeing subject selector** — students now go directly to the QR scanner, skipping the instructor-only subject selection flow.
- **Reports showing all data for instructors** — reports now filter by the logged-in instructor's subjects only.
- **Calendar showing all attendance** — calendar now filters by role so students/parents only see their own data.
- **Duplicate email allowed** — email uniqueness is now checked before creating any account.

### Data Model Cleanup
- Removed `instructor_name` from subjects (redundant — looked up via `instructor_id`)
- Removed `student_name` and `subject_name` from enrollments (redundant — looked up via IDs)
- Cleaned up test/junk parent records from the database
- All denormalized fields marked as deprecated in the model

### UX Improvements
- Show/hide password toggle with animated eye icon on login and settings
- Parents column added to accounts management page
- Departments added to sidebar navigation
- "Monitor Scans" tab removed (was identical to Generate QR)
- Generate QR tab now has two-column layout with live scan feed on the right
- Upload QR image option added as fallback for students who can't use camera
- Reports shows proper empty state instead of 0% stats when no data
- Search label in attendance records changed from "Search Student" to "Search"
- Subjects filter in attendance records scoped by role
- Admin can now create subjects and assign to any instructor via a selection prompt
- Forms reset after successful account creation
- Fake 800ms delay removed from account creation forms

---

## Running the Project

Make sure you have Node.js installed, then:

```bash
# Install dependencies
npm install

# Start JSON Server (backend) on port 3000
npm run json-server

# Start Angular dev server on port 4200
npm start

# To access from phone on the same network
ng serve --host 0.0.0.0 --port 4200
```

Default admin login:
- Email: `admin@school.com`
- Password: `admin123`

All other accounts are created by the admin through the Create Account page.

---

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── layout/          # Sidebar, header, navigation
│   │   └── login/           # Login page
│   ├── guards/
│   │   └── auth.guard.ts    # Route protection by role
│   ├── models/
│   │   └── user.model.ts    # TypeScript interfaces
│   ├── pages/
│   │   ├── accounts/        # Account management
│   │   ├── attendance-records/
│   │   ├── calendar/
│   │   ├── create-account/
│   │   ├── dashboard/
│   │   ├── departments/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── subject-detail/
│   │   ├── subjects/
│   │   └── take-attendance/ # QR generator, scanner, manual
│   └── services/
│       ├── auth.service.ts  # Login, session management
│       ├── data.service.ts  # All CRUD operations
│       ├── role.service.ts  # Role-based computed permissions
│       └── theme.service.ts # Theme persistence and application
├── styles.css               # Global styles + theme CSS variables
db.json                      # JSON Server database
```

---

*Documentation generated for the 2A SAMS project — deepz-test-edit branch*
