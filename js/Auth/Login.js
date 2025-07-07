// File: js/Auth/Login.js

import { authService } from "../Services/AuthServices.js";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    // GANTI SELURUH BLOK INI DENGAN KODE BARU
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Tombol login ditekan, memulai proses...");

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const data = await authService.login(email, password);

        // ======================================================
        // BAGIAN DEBUG UTAMA
        // ======================================================
        console.log("Login berhasil, menerima data dari server:", data);

        if (data && data.user && data.user.role) {
          console.log("Membaca peran pengguna:", data.user.role);

          if (data.user.role === "admin") {
            console.log('Kondisi IF terpenuhi. Peran adalah "admin", mengarahkan ke dasbor admin...');
            window.location.href = "/src/pages/Admin/admin_dashboard.html";
          } else {
            console.log('Kondisi ELSE terpenuhi. Peran BUKAN "admin", mengarahkan ke dasbor karyawan...');
            window.location.href = "/src/pages/Karyawan/employee_dashboard.html";
          }
        } else {
          console.error("Struktur data dari server tidak sesuai. 'data.user.role' tidak ditemukan.", data);
          Toastify({ text: "Respons dari server tidak lengkap.", duration: 3000, style: { background: "red" } }).showToast();
        }
        // ======================================================

      } catch (error) {
        console.error("Login gagal di dalam blok CATCH:", error);
        Toastify({ text: error.message || "Terjadi kesalahan.", duration: 3000, style: { background: "red" } }).showToast();
      }
    });
  }
});