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

      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");
      const errorMessage = document.getElementById("errorMessage");
      const submitButton = loginForm.querySelector('button[type="submit"]');

      const email = emailInput.value;
      const password = passwordInput.value;

      // Reset previous error states
      if (errorMessage) {
        errorMessage.classList.add('hidden');
      }
      emailInput.classList.remove('border-red-500');
      passwordInput.classList.remove('border-red-500');

      // Disable submit button during login
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Memproses...';

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
        
        const errorMsg = error.message || "Terjadi kesalahan.";
        
        // Handle different types of login errors with specific validation
        if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('password')) {
          // Both email and password are incorrect
          if (errorMessage) {
            errorMessage.textContent = "Email dan password tidak valid";
            errorMessage.classList.remove('hidden');
          }
          emailInput.classList.add('border-red-500');
          passwordInput.classList.add('border-red-500');
        } else if (errorMsg.toLowerCase().includes('email') || 
                   errorMsg.toLowerCase().includes('user not found') || 
                   errorMsg.toLowerCase().includes('tidak terdaftar') ||
                   errorMsg.toLowerCase().includes('not found') ||
                   errorMsg.toLowerCase().includes('invalid email')) {
          // Email is incorrect
          if (errorMessage) {
            errorMessage.textContent = "Email tidak terdaftar";
            errorMessage.classList.remove('hidden');
          }
          emailInput.classList.add('border-red-500');
        } else if (errorMsg.toLowerCase().includes('password') || 
                   errorMsg.toLowerCase().includes('salah') || 
                   errorMsg.toLowerCase().includes('incorrect') ||
                   errorMsg.toLowerCase().includes('wrong') ||
                   errorMsg.toLowerCase().includes('invalid password')) {
          // Password is incorrect
          if (errorMessage) {
            errorMessage.textContent = "Password salah";
            errorMessage.classList.remove('hidden');
          }
          passwordInput.classList.add('border-red-500');
        } else {
          // Generic error - could be both email and password wrong
          if (errorMessage) {
            errorMessage.textContent = "Email dan password tidak valid";
            errorMessage.classList.remove('hidden');
          }
          emailInput.classList.add('border-red-500');
          passwordInput.classList.add('border-red-500');
        }
        
        Toastify({ text: errorMsg, duration: 3000, style: { background: "red" } }).showToast();
      } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }
});