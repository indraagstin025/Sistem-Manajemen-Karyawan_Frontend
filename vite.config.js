// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'), // <-- file root
        login: resolve(__dirname, 'src/pages/login.html'),
        'Admin/add_department': resolve(__dirname, 'src/pages/Admin/add_department.html'),
        'Admin/add_employee': resolve(__dirname, 'src/pages/Admin/add_employee.html'),
        'Admin/admin_dashboard': resolve(__dirname, 'src/pages/Admin/admin_dashboard.html'),
        'Admin/admin_leave_requests': resolve(__dirname, 'src/pages/Admin/admin_leave_requests.html'),
        'Admin/list_attendance': resolve(__dirname, 'src/pages/Admin/list_attendance.html'),
        'Admin/manage_departments': resolve(__dirname, 'src/pages/Admin/manage_departments.html'),
        'Admin/manage_employees': resolve(__dirname, 'src/pages/Admin/manage_employees.html'),
        'Karyawan/attendance_history': resolve(__dirname, 'src/pages/Karyawan/attendance_history.html'),
        'Karyawan/employee_dashboard': resolve(__dirname, 'src/pages/Karyawan/employee_dashboard.html'),
        'Karyawan/employee_profile': resolve(__dirname, 'src/pages/Karyawan/employee_profile.html'),
        'Karyawan/request_leave': resolve(__dirname, 'src/pages/Karyawan/request_leave.html'),
      }
    }
  }
});
