// File: copy-html.js
import { copyFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const pages = [
  ["src/pages/login.html", "login.html"],
  ["src/pages/Admin/admin_dashboard.html", "admin_dashboard.html"],
  ["src/pages/Admin/add_department.html", "add_department.html"],
  ["src/pages/Admin/add_employee.html", "add_employee.html"],
  ["src/pages/Admin/admin_leave_requests.html", "admin_leave_requests.html"],
  ["src/pages/Admin/list_attendance.html", "list_attendance.html"],
  ["src/pages/Admin/manage_departments.html", "manage_departments.html"],
  ["src/pages/Admin/manage_employees.html", "manage_employees.html"],
  ["src/pages/Admin/manage_work_schedules.html", "manage_work_schedules.html"],
  ["src/pages/Admin/admin_profile.html", "admin_profile.html"] ,
  ["src/pages/Karyawan/employee_dashboard.html", "employee_dashboard.html"],
  ["src/pages/Karyawan/employee_profile.html", "employee_profile.html"],
  ["src/pages/Karyawan/request_leave.html", "request_leave.html"],
  ["src/pages/Karyawan/attendance_history.html", "attendance_history.html"],
  ["src/pages/Karyawan/my_work_schedules.html", "my_work_schedules.html"]
];

mkdirSync("dist", { recursive: true });

for (const [src, dest] of pages) {
  const sourcePath = resolve("dist", src);
  const destPath = resolve("dist", dest);
  copyFileSync(sourcePath, destPath);
  console.log(`✔ Copied: ${src} → ${dest}`);
}
