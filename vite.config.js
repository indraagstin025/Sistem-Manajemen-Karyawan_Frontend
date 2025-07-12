// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';
import mpa from 'vite-plugin-html-mpa';

export default defineConfig({
  plugins: [
    mpa({
      pages: [
        // Halaman di root 'src/pages/'
        { name: 'index', filename: 'index.html', template: 'src/pages/index.html' },
        { name: 'login', filename: 'login.html', template: 'src/pages/login.html' },

        // Halaman di 'src/pages/Admin/'
        { name: 'admin-add-department', filename: 'Admin/add_department.html', template: 'src/pages/Admin/add_department.html' },
        { name: 'admin-add-employee', filename: 'Admin/add_employee.html', template: 'src/pages/Admin/add_employee.html' },
        { name: 'admin-dashboard', filename: 'Admin/admin_dashboard.html', template: 'src/pages/Admin/admin_dashboard.html' },
        { name: 'admin-leave-requests', filename: 'Admin/admin_leave_requests.html', template: 'src/pages/Admin/admin_leave_requests.html' },
        { name: 'admin-list-attendance', filename: 'Admin/list_attendance.html', template: 'src/pages/Admin/list_attendance.html' },
        { name: 'admin-manage-departments', filename: 'Admin/manage_departments.html', template: 'src/pages/Admin/manage_departments.html' },
        { name: 'admin-manage-employees', filename: 'Admin/manage_employees.html', template: 'src/pages/Admin/manage_employees.html' },

        // Halaman di 'src/pages/Karyawan/'
        { name: 'karyawan-attendance-history', filename: 'Karyawan/attendance_history.html', template: 'src/pages/Karyawan/attendance_history.html' },
        { name: 'karyawan-employee-dashboard', filename: 'Karyawan/employee_dashboard.html', template: 'src/pages/Karyawan/employee_dashboard.html' },
        { name: 'karyawan-employee-profile', filename: 'Karyawan/employee_profile.html', template: 'src/pages/Karyawan/employee_profile.html' },
        { name: 'karyawan-request-leave', filename: 'Karyawan/request_leave.html', template: 'src/pages/Karyawan/request_leave.html' }
      ]
    })
  ]
});