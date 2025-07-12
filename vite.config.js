import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

function copyHtmlFromPagesToDistRoot() {
  return {
    name: 'copy-html-from-pages',
    closeBundle() {
      const distPagesDir = path.resolve(__dirname, 'dist/src/pages');
      const distRoot = path.resolve(__dirname, 'dist');

      // Salin semua .html dari /Admin dan /Karyawan ke dist root
      const walk = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (file.endsWith('.html')) {
            const relative = path.relative(distPagesDir, fullPath).replace(/\\/g, '/');
            const outputName = relative.replace(/\//g, '_'); // Misal: Admin/add_employee.html -> Admin_add_employee.html
            const outputPath = path.join(distRoot, outputName);
            fs.copyFileSync(fullPath, outputPath);
            console.log(`✔ Copied: ${relative} → ${outputName}`);
          }
        });
      };

      if (fs.existsSync(distPagesDir)) {
        walk(distPagesDir);
      }
    }
  };
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'src/pages/login.html'),
        // Admin
        admin_dashboard: resolve(__dirname, 'src/pages/Admin/admin_dashboard.html'),
        add_employee: resolve(__dirname, 'src/pages/Admin/add_employee.html'),
        add_department: resolve(__dirname, 'src/pages/Admin/add_department.html'),
        admin_leave_requests: resolve(__dirname, 'src/pages/Admin/admin_leave_requests.html'),
        list_attendance: resolve(__dirname, 'src/pages/Admin/list_attendance.html'),
        manage_departments: resolve(__dirname, 'src/pages/Admin/manage_departments.html'),
        manage_employees: resolve(__dirname, 'src/pages/Admin/manage_employees.html'),
        // Karyawan
        employee_dashboard: resolve(__dirname, 'src/pages/Karyawan/employee_dashboard.html'),
        employee_profile: resolve(__dirname, 'src/pages/Karyawan/employee_profile.html'),
        request_leave: resolve(__dirname, 'src/pages/Karyawan/request_leave.html'),
        attendance_history: resolve(__dirname, 'src/pages/Karyawan/attendance_history.html'),
      }
    }
  },
  plugins: [copyHtmlFromPagesToDistRoot()]
});
