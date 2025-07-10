import { userService }  from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { validateChangePasswordForm }  from '../Validations/changePasswordValidation.js'; // <-- Pastikan path ini benar!

document.addEventListener("DOMContentLoaded", () => {
  // Panggil Feather Icons untuk merender ikon di awal
  feather.replace();

  // --- 1. Seleksi Semua Elemen DOM ---
  const profilePhotoPreview = document.getElementById("profilePhotoPreview");
  const photoUploadInput = document.getElementById("photoUpload");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const positionInput = document.getElementById("position");
  const departmentInput = document.getElementById("department");
  const addressTextarea = document.getElementById("address");
  const profileForm = document.getElementById("profileForm");
  const changePasswordForm = document.getElementById("changePasswordFormProfile");
  const showPasswordCheckbox = document.getElementById("showPasswordCheckbox");
  const logoutButtons = document.querySelectorAll(".logout-button");

  // --- 2. Fungsi Utilitas (menggunakan Toastify) ---
  const showToast = (message, type = "success") => {
    let backgroundColor;
    if (type === "success") {
      backgroundColor = "linear-gradient(to right, #22c55e, #16a34a)";
    } else if (type === "error") {
      backgroundColor = "linear-gradient(to right, #ef4444, #dc2626)";
    } else {
      backgroundColor = "linear-gradient(to right, #3b82f6, #2563eb)";
    }

    Toastify({
      text: message,
      duration: 3000,
      close: true,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
      style: {
        background: backgroundColor,
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding: "12px 20px"
      },
    }).showToast();
  };

  // --- 3. Logika Utama (Memuat & Mengupdate Data) ---

  // Fungsi untuk memuat data profil saat halaman dibuka
  const loadProfileData = async () => {
    try {
      // Tidak perlu lagi mendapatkan 'token' secara terpisah di sini.
      // Interceptor Axios di apiClient.js sudah menanganinya.
      const userString = localStorage.getItem("user");

      if (!userString) {
        throw new Error("Sesi tidak valid. Harap login kembali.");
      }
      
      const user = JSON.parse(userString);
      // Parameter 'token' dihapus karena sudah di-handle oleh interceptor apiClient
      const employee = await userService.getUserByID(user.id); 

      if (employee) {
        nameInput.value = employee.name || "";
        emailInput.value = employee.email || "";
        positionInput.value = employee.position || "";
        departmentInput.value = employee.department || "";
        document.getElementById("base_salary").value = "••••••••";
        addressTextarea.value = employee.address || "";
        // Pastikan URL placeholder menggunakan via.placeholder.com atau URL lokal yang valid
        profilePhotoPreview.src = employee.photo || "https://via.placeholder.com/128"; 
      }
    } catch (error) {
      showToast(error.message, "error");
      if (error.message.includes("Sesi") || error.status === 401 || error.status === 403) {
        setTimeout(() => authService.logout(), 2000);
      }
    }
  };

  // --- 4. Pendaftaran Semua Event Listener ---

  // Event listener untuk form update profil (alamat & foto)
  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const userString = localStorage.getItem("user");
      
      try {
        if (!userString) throw new new Error("Sesi tidak valid. Harap login kembali."); 
        
        const user = JSON.parse(userString);
        const photoFile = photoUploadInput.files[0];
        const updatedData = { address: addressTextarea.value.trim() };

        if (!updatedData.address && !photoFile) {
          return showToast("Tidak ada perubahan untuk disimpan.", "error");
        }

        // --- DEBUGGING LOGS DIHAPUS DARI SINI ---
        // if (photoFile) {
        //     console.log('--- DEBUG FILE UPLOAD ---');
        //     console.log('Nama file:', photoFile.name);
        //     console.log('Tipe file:', photoFile.type);
        //     console.log('Ukuran file:', photoFile.size, 'bytes');
        //     console.log('Objek file (instance of File?):', photoFile instanceof File, photoFile);
        //     const formDataDebug = new FormData();
        //     formDataDebug.append('photo', photoFile);
        //     for (let [key, value] of formDataDebug.entries()) {
        //         console.log(`FormData entry: ${key}:`, value);
        //     }
        //     console.log('--- END DEBUG FILE UPLOAD ---');
        // }
        // --- AKHIR DEBUGGING LOGS YANG DIHAPUS ---

        if (updatedData.address) {
          await userService.updateUser(user.id, updatedData); 
        }
        if (photoFile) {
          const uploadResponse = await userService.uploadProfilePhoto(user.id, photoFile);
          profilePhotoPreview.src = uploadResponse.photo_url;
          // >>>>> AKTIFKAN INI UNTUK UPDATE FOTO DI LOCALSTORAGE <<<<<
          // Ini akan memperbarui foto di header atau tempat lain yang membaca dari localStorage
          const currentUserData = authService.getCurrentUser(); // Ambil user dari localStorage
          if (currentUserData) {
              currentUserData.photo = uploadResponse.photo_url;
              localStorage.setItem('user', JSON.stringify(currentUserData)); // Simpan kembali ke localStorage
          }
          // >>>>> AKHIR AKTIVASI <<<<<
        }
        showToast("Profil berhasil diupdate!", "success");
        loadProfileData(); // Muat ulang data profil untuk menampilkan perubahan (terutama jika ada di input lain)
      } catch (error) {
        showToast(error.message || "Gagal mengupdate profil.", "error"); 
        if (error.status === 401 || error.status === 403) {
          setTimeout(() => authService.logout(), 2000);
        }
      }
    });
  }

  // Event listener untuk form ganti password
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      // const token = localStorage.getItem("token"); // <<-- Hapus ini, tidak lagi diperlukan
      const oldPassword = document.getElementById("oldPasswordProfile").value;
      const newPassword = document.getElementById("newPasswordProfile").value;
      const confirmNewPassword = document.getElementById("confirmNewPasswordProfile").value;

      const validationResult = validateChangePasswordForm(oldPassword, newPassword, confirmNewPassword);

      if (!validationResult.isValid) {
        return showToast(validationResult.message, "error");
      }
      
      // Token tidak perlu lagi dicek secara manual di sini jika interceptor menangani
      // if (!token) { return showToast("Sesi tidak valid.", "error"); }

      try {
        // Parameter 'token' dihapus karena sudah di-handle oleh interceptor apiClient
        await authService.changePassword(oldPassword, newPassword); 
        showToast("Password berhasil diubah!", "success");
        changePasswordForm.reset();
      } catch (error) {
        showToast(error.message || "Gagal mengubah password.", "error");
      }
    });
  }
  
  // Event listener untuk checkbox tampilkan password
  if (showPasswordCheckbox) {
    showPasswordCheckbox.addEventListener("change", () => {
      const isChecked = showPasswordCheckbox.checked;
      const passwordFields = [
        document.getElementById("oldPasswordProfile"),
        document.getElementById("newPasswordProfile"),
        document.getElementById("confirmNewPasswordProfile"),
      ];
      passwordFields.forEach(field => {
        if (field) field.type = isChecked ? "text" : "password";
      });
    });
  }
  
  // Event listener untuk preview saat memilih foto
  if (photoUploadInput) {
    photoUploadInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => { profilePhotoPreview.src = e.target.result; };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  // Event listener untuk semua tombol logout
  logoutButtons.forEach(button => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      authService.logout();
    });
  });

  // --- 5. Inisialisasi Halaman ---
  loadProfileData();
});