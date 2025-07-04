// src/js/Karyawan/EmployeeProfile.js

import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", async () => {
  feather.replace();

  // Elemen untuk form profil
  const profilePhotoPreview = document.getElementById("profilePhotoPreview");
  const photoUploadInput = document.getElementById("photoUpload");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const positionInput = document.getElementById("position");
  const departmentInput = document.getElementById("department");
  const baseSalaryInput = document.getElementById("base_salary");
  const addressTextarea = document.getElementById("address");

  const profileForm = document.getElementById("profileForm");
  const profilePageError = document.getElementById("profilePageError");
  const profilePageSuccess = document.getElementById("profilePageSuccess");
  const cancelProfileEditBtn = document.getElementById("cancelProfileEditBtn");

  // Elemen untuk dropdown user di navbar (tetap ada di sini untuk halaman profil)
  // Ensure this selector is correct if you moved/refactored headers into a shared component
  // It's generally better to get elements directly if they are guaranteed to be unique
  const userDropdownContainer = document.querySelector('header .relative[id="userDropdown"]'); 
  const userAvatarNav = document.getElementById("userAvatar");
  const dropdownMenu = document.getElementById("dropdownMenu");


  // Elemen untuk form Ganti Password (sekarang langsung di halaman profil)
  const changePasswordFormProfile = document.getElementById("changePasswordFormProfile");
  const oldPasswordProfileInput = document.getElementById("oldPasswordProfile");
  const newPasswordProfileInput = document.getElementById("newPasswordProfile");
  const confirmNewPasswordProfileInput = document.getElementById("confirmNewPasswordProfile");
  const changePasswordErrorMessageProfile = document.getElementById("changePasswordErrorMessageProfile");
  const changePasswordSuccessMessageProfile = document.getElementById("changePasswordSuccessMessageProfile");

  // Elemen logout
  const logoutButton = document.getElementById("logoutButton");
  const dropdownLogoutButton = document.getElementById("dropdownLogoutButton");
  const mobileLogoutButton = document.getElementById("mobileLogoutButton");

  // Elemen sidebar mobile
  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileSidebar = document.getElementById("mobileSidebar");
  const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
  const closeSidebar = document.getElementById("closeSidebar");


  const showMessage = (message, type = "success", targetDiv) => {
    profilePageError.classList.add("hidden");
    profilePageSuccess.classList.add("hidden");
    profilePageError.textContent = "";
    profilePageSuccess.textContent = "";

    if (type === "success") {
      targetDiv.textContent = message;
      targetDiv.classList.remove("hidden");
      targetDiv.classList.remove("text-red-600");
      targetDiv.classList.add("text-green-600");
    } else {
      targetDiv.textContent = message;
      targetDiv.classList.remove("hidden");
      targetDiv.classList.remove("text-green-600");
      targetDiv.classList.add("text-red-600");
    }
    setTimeout(() => {
      targetDiv.classList.add("hidden");
    }, 5000);
  };

  const showChangePasswordMessage = (message, type = "success", targetErrorDiv, targetSuccessDiv) => {
    targetErrorDiv.classList.add("hidden");
    targetSuccessDiv.classList.add("hidden");
    targetErrorDiv.textContent = "";
    targetSuccessDiv.textContent = "";

    if (type === "success") {
      targetSuccessDiv.textContent = message;
      targetSuccessDiv.classList.remove("hidden");
      targetSuccessDiv.classList.remove("text-red-600");
      targetSuccessDiv.classList.add("text-green-600");
    } else {
      targetErrorDiv.textContent = message;
      targetErrorDiv.classList.remove("hidden");
      targetErrorDiv.classList.remove("text-green-600");
      targetErrorDiv.classList.add("text-red-600");
    }
    setTimeout(() => {
      targetErrorDiv.classList.add("hidden");
      targetSuccessDiv.classList.add("hidden");
    }, 3000);
  };

  const loadProfileData = async () => {
    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");

    if (!authToken || !userId || userRole !== "karyawan") {
      showMessage("Anda tidak terautentikasi atau tidak memiliki akses. Silakan login kembali.", "error", profilePageError);
      setTimeout(() => authService.logout(), 2000);
      return;
    }

    try {
      const employee = await userService.getUserByID(userId, authToken);
      console.log("Data Profil Karyawan:", employee);

      if (employee) {
        nameInput.value = employee.name || "";
        emailInput.value = employee.email || "";
        positionInput.value = employee.position || "";
        departmentInput.value = employee.department || "";
        baseSalaryInput.value = employee.base_salary || 0;
        addressTextarea.value = employee.address || "";

        profilePhotoPreview.src = employee.photo || "https://placehold.co/128x128/E2E8F0/4A5568?text=ME";
        profilePhotoPreview.alt = employee.name || "Foto Profil";

        // Update avatar di navbar juga
        if (userAvatarNav) {
            userAvatarNav.src = employee.photo || "https://placehold.co/40x40/E2E8F0/4A5568?text=ME";
            userAvatarNav.alt = employee.name;
        }
        
      } else {
        showMessage("Data profil karyawan tidak ditemukan.", "error", profilePageError);
      }
    } catch (error) {
      console.error("Gagal memuat data profil karyawan:", error);
      showMessage(`Gagal memuat profil: ${error.message || "Terjadi kesalahan"}`, "error", profilePageError);
      if (error.status === 401 || error.status === 403) {
        setTimeout(() => authService.logout(), 2000);
      }
    }
  };

  loadProfileData();

  // --- Dropdown User Navbar Logic (Disimpan di halaman profil juga) ---
  if (userAvatarNav && dropdownMenu && userDropdownContainer) { // Pastikan semua elemen ada
    userAvatarNav.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent click from immediately closing dropdown
      dropdownMenu.classList.toggle("active"); // Toggle 'active' class
    });

    document.addEventListener("click", (event) => {
      // Check if the click is outside the entire dropdown container
      if (!userDropdownContainer.contains(event.target)) {
        dropdownMenu.classList.remove("active");
      }
    });

    dropdownMenu.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent dropdown from closing when clicking inside it
    });
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      profilePageError.classList.add("hidden");
      profilePageSuccess.classList.add("hidden");

      const authToken = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!authToken || !userId) {
        showMessage("Anda tidak terautentikasi. Silakan login ulang.", "error", profilePageError);
        authService.logout();
        return;
      }

      const updatedData = {
        address: addressTextarea.value.trim(),
      };

      for (const key in updatedData) {
        if (updatedData[key] === "" || updatedData[key] === null || updatedData[key] === undefined) {
          delete updatedData[key];
        }
      }

      const photoFile = photoUploadInput.files[0];

      try {
        // Hanya update data non-foto jika ada perubahan atau tidak ada foto baru yang diupload
        // Consider if 'updatedData' can be empty and if that should still trigger an update
        if (Object.keys(updatedData).length > 0) { 
          const response = await userService.updateUser(userId, updatedData, authToken);
          console.log("Profil (non-foto) berhasil diupdate:", response);
        }

        if (photoFile) {
          const uploadResponse = await userService.uploadProfilePhoto(userId, photoFile, authToken);
          console.log("Foto profil berhasil diunggah:", uploadResponse);
        
          profilePhotoPreview.src = uploadResponse.photo_url;
          if (userAvatarNav) { // Pastikan userAvatarNav ada sebelum memperbarui src
              userAvatarNav.src = uploadResponse.photo_url;
          }
        } else if (Object.keys(updatedData).length === 0) {
            // If no photo file and no other data updated, maybe skip API call or show a message
            showMessage("Tidak ada perubahan yang disimpan.", "error", profilePageError);
            return; // Exit if nothing to update
        }

        showMessage("Profil berhasil diupdate!", "success", profilePageSuccess);

      } catch (error) {
        console.error("Gagal mengupdate profil:", error);
        let errorMessage = "Terjadi kesalahan saat mengupdate profil. Silakan coba lagi.";
        if (error.details) {
          if (Array.isArray(error.details)) {
            errorMessage = error.details.map((err) => `${err.Field || "Error"}: ${err.Msg}`).join("<br>");
          } else if (typeof error.details === "string") {
            errorMessage = error.details;
          } else if (error.details.error) {
            errorMessage = error.details.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        showMessage(errorMessage, "error", profilePageError);
      }
    });
  }

  if (cancelProfileEditBtn) {
    cancelProfileEditBtn.addEventListener("click", () => {
      loadProfileData(); 
      showMessage("Perubahan dibatalkan.", "error", profilePageError);
    });
  }

  if (photoUploadInput) {
    photoUploadInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          profilePhotoPreview.src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  // --- Change Password Logic (Sekarang di halaman profil) ---
  if (changePasswordFormProfile) {
    changePasswordFormProfile.addEventListener("submit", async (event) => {
      event.preventDefault();

      changePasswordErrorMessageProfile.classList.add("hidden");
      changePasswordSuccessMessageProfile.classList.add("hidden");

      const oldPassword = oldPasswordProfileInput.value;
      const newPassword = newPasswordProfileInput.value;
      const confirmNewPassword = confirmNewPasswordProfileInput.value;

      if (newPassword !== confirmNewPassword) {
        showChangePasswordMessage("Password baru dan konfirmasi password tidak cocok.", "error", changePasswordErrorMessageProfile, changePasswordSuccessMessageProfile);
        return;
      }
      if (newPassword.length < 8) {
        showChangePasswordMessage("Password baru minimal 8 karakter.", "error", changePasswordErrorMessageProfile, changePasswordSuccessMessageProfile);
        return;
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        showChangePasswordMessage("Anda tidak terautentikasi. Silakan login ulang.", "error", changePasswordErrorMessageProfile, changePasswordSuccessMessageProfile);
        authService.logout(); // Redirect to login
        return;
      }

      try {
        // Call the changePassword function from authService
        const response = await authService.changePassword(oldPassword, newPassword, authToken);
        console.log("Password berhasil diubah:", response);

        showChangePasswordMessage("Password berhasil diubah!", "success", changePasswordErrorMessageProfile, changePasswordSuccessMessageProfile);
        changePasswordFormProfile.reset(); // Reset form after successful change
      } catch (error) {
        console.error("Gagal mengubah password:", error);
        let errorMessage = "Terjadi kesalahan saat mengubah password. Silakan coba lagi.";
        if (error.details) {
          if (Array.isArray(error.details)) {
            errorMessage = error.details.map((err) => `${err.Field || "Error"}: ${err.Msg}`).join("<br>");
          } else if (typeof error.details === "string") {
            errorMessage = error.details;
          } else if (error.details.error) {
            errorMessage = error.details.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        showChangePasswordMessage(errorMessage, "error", changePasswordErrorMessageProfile, changePasswordSuccessMessageProfile);
      }
    });
  }


  // --- Logout Event Listeners ---
  const handleLogout = (event) => {
    event.preventDefault();
    authService.logout(); // This service should handle token clearing and redirection
  };

  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }
  if (dropdownLogoutButton) {
    dropdownLogoutButton.addEventListener("click", handleLogout);
  }
  if (mobileLogoutButton) {
    mobileLogoutButton.addEventListener("click", handleLogout);
  }

  // --- Mobile Sidebar Logic ---
  if (sidebarToggle && mobileSidebar && mobileSidebarPanel && closeSidebar) {
    sidebarToggle.addEventListener("click", () => {
      mobileSidebar.classList.remove("hidden");
      setTimeout(() => {
        mobileSidebar.classList.add("opacity-100");
        mobileSidebarPanel.classList.remove("-translate-x-full");
      }, 10);
    });

    const hideMobileSidebar = () => {
      mobileSidebar.classList.remove("opacity-100");
      mobileSidebarPanel.classList.add("-translate-x-full");
      setTimeout(() => {
        mobileSidebar.classList.add("hidden");
      }, 300);
    };

    closeSidebar.addEventListener("click", hideMobileSidebar);

    mobileSidebar.addEventListener("click", (event) => {
      if (event.target === mobileSidebar) {
        hideMobileSidebar();
      }
    });
  }
});