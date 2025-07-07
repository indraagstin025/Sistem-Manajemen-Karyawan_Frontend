import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { validateChangePasswordForm } from '../Validations/changePasswordValidation.js'; // <-- Pastikan path ini benar!

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
  // Hapus seleksi elemen notifikasi HTML lama karena kita akan menggunakan Toastify
  // const profilePageError = document.getElementById("profilePageError");
  // const profilePageSuccess = document.getElementById("profilePageSuccess");
  // const changePasswordErrorMessage = document.getElementById("changePasswordErrorMessageProfile");
  // const changePasswordSuccessMessage = document.getElementById("changePasswordSuccessMessageProfile");
  const showPasswordCheckbox = document.getElementById("showPasswordCheckbox");
  const logoutButtons = document.querySelectorAll(".logout-button");

  // --- 2. Fungsi Utilitas BARU (menggunakan Toastify) ---

  // Fungsi untuk menampilkan pesan notifikasi menggunakan Toastify
  const showToast = (message, type = "success") => {
    let backgroundColor;
    if (type === "success") {
      backgroundColor = "linear-gradient(to right, #22c55e, #16a34a)"; // Tailwind green-500 ke green-700
    } else if (type === "error") {
      backgroundColor = "linear-gradient(to right, #ef4444, #dc2626)"; // Tailwind red-500 ke red-700
    } else { // info atau default, bisa ditambahkan jenis lain jika perlu
      backgroundColor = "linear-gradient(to right, #3b82f6, #2563eb)"; // Tailwind blue-500 ke blue-700
    }

    Toastify({
      text: message,
      duration: 3000, // Durasi notifikasi dalam milidetik
      close: true, // Izinkan user menutup secara manual
      gravity: "top", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Berhenti durasi saat di-hover/fokus
      style: {
        background: backgroundColor,
        borderRadius: "8px", // Sudut yang sedikit melengkung
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Shadow ringan
        padding: "12px 20px"
      },
      // onClick: function(){} // Callback after click
    }).showToast();
  };

  // --- 3. Logika Utama (Memuat & Mengupdate Data) ---

  // Fungsi untuk memuat data profil saat halaman dibuka
  const loadProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");

      if (!token || !userString) {
        throw new Error("Sesi tidak valid. Harap login kembali.");
      }
      
      const user = JSON.parse(userString);
      const employee = await userService.getUserByID(user.id, token);

      if (employee) {
        nameInput.value = employee.name || "";
        emailInput.value = employee.email || "";
        positionInput.value = employee.position || "";
        departmentInput.value = employee.department || "";
        // Elemen gaji sengaja dikosongkan untuk privasi di halaman profil
        document.getElementById("base_salary").value = "••••••••";
        addressTextarea.value = employee.address || "";
        profilePhotoPreview.src = employee.photo || "https://via.placeholder.com/128";
      }
    } catch (error) {
      showToast(error.message, "error"); // Menggunakan showToast
      if (error.message.includes("Sesi")) {
        setTimeout(() => authService.logout(), 2000);
      }
    }
  };

  // --- 4. Pendaftaran Semua Event Listener ---

  // Event listener untuk form update profil (alamat & foto)
  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");
      
      try {
        if (!token || !userString) throw new Error("Sesi tidak valid.");
        
        const user = JSON.parse(userString);
        const photoFile = photoUploadInput.files[0];
        const updatedData = { address: addressTextarea.value.trim() };

        if (!updatedData.address && !photoFile) {
          return showToast("Tidak ada perubahan untuk disimpan.", "error"); // Menggunakan showToast
        }
        
        if (updatedData.address) {
          await userService.updateUser(user.id, updatedData, token);
        }
        if (photoFile) {
          const uploadResponse = await userService.uploadProfilePhoto(user.id, photoFile, token);
          profilePhotoPreview.src = uploadResponse.photo_url;
        }
        showToast("Profil berhasil diupdate!", "success"); // Menggunakan showToast
      } catch (error) {
        showToast(error.message || "Gagal mengupdate profil.", "error"); // Menggunakan showToast
      }
    });
  }

  // Event listener untuk form ganti password
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const token = localStorage.getItem("token");
      const oldPassword = document.getElementById("oldPasswordProfile").value;
      const newPassword = document.getElementById("newPasswordProfile").value;
      const confirmNewPassword = document.getElementById("confirmNewPasswordProfile").value;

      // --- Gunakan validasi baru di sini ---
      const validationResult = validateChangePasswordForm(oldPassword, newPassword, confirmNewPassword);

      if (!validationResult.isValid) {
        return showToast(validationResult.message, "error"); // Menggunakan showToast
      }
      // --- Akhir penggunaan validasi baru ---

      // Cek token sebaiknya dilakukan setelah validasi form dasar, tapi sebelum request API
      if (!token) {
        return showToast("Sesi tidak valid.", "error"); // Menggunakan showToast
      }

      try {
        await authService.changePassword(oldPassword, newPassword, token);
        showToast("Password berhasil diubah!", "success"); // Menggunakan showToast
        changePasswordForm.reset(); // Reset form setelah sukses
      } catch (error) {
        // Pesan error dari backend akan diambil di sini
        showToast(error.message || "Gagal mengubah password.", "error"); // Menggunakan showToast
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