import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { validateChangePasswordForm } from '../Validations/changePasswordValidation.js';

document.addEventListener("DOMContentLoaded", () => {
  feather.replace();

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

  const loadProfileData = async () => {
    try {
      const userString = localStorage.getItem("user");
      if (!userString) throw new Error("Sesi tidak valid. Harap login kembali.");

      const user = JSON.parse(userString);
      const employee = await userService.getUserByID(user.id);

      if (employee) {
        nameInput.value = employee.name || "";
        emailInput.value = employee.email || "";
        positionInput.value = employee.position || "";
        departmentInput.value = employee.department || "";
        document.getElementById("base_salary").value = "••••••••";
        addressTextarea.value = employee.address || "";

        // Ambil foto dari GridFS
        try {
          const blob = await userService.getProfilePhoto(user.id);
          const photoUrl = URL.createObjectURL(blob);
          profilePhotoPreview.src = photoUrl;
        } catch {
          profilePhotoPreview.src = "https://via.placeholder.com/128";
        }
      }
    } catch (error) {
      showToast(error.message, "error");
      if (error.message.includes("Sesi") || error.status === 401 || error.status === 403) {
        setTimeout(() => authService.logout(), 2000);
      }
    }
  };

  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const userString = localStorage.getItem("user");

      try {
        if (!userString) throw new Error("Sesi tidak valid. Harap login kembali.");

        const user = JSON.parse(userString);
        const photoFile = photoUploadInput.files[0];
        const updatedData = { address: addressTextarea.value.trim() };

        if (!updatedData.address && !photoFile) {
          return showToast("Tidak ada perubahan untuk disimpan.", "error");
        }

        if (updatedData.address) {
          await userService.updateUser(user.id, updatedData);
        }
        if (photoFile) {
          const uploadResponse = await userService.uploadProfilePhoto(user.id, photoFile);

          // Ambil ulang foto dari GridFS untuk ditampilkan
          const blob = await userService.getProfilePhoto(user.id);
          profilePhotoPreview.src = URL.createObjectURL(blob);

          const currentUserData = authService.getCurrentUser();
          if (currentUserData) {
            currentUserData.photo = uploadResponse.photo_url;
            localStorage.setItem('user', JSON.stringify(currentUserData));
          }
        }

        showToast("Profil berhasil diupdate!", "success");
        loadProfileData();
      } catch (error) {
        showToast(error.message || "Gagal mengupdate profil.", "error");
        if (error.status === 401 || error.status === 403) {
          setTimeout(() => authService.logout(), 2000);
        }
      }
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const oldPassword = document.getElementById("oldPasswordProfile").value;
      const newPassword = document.getElementById("newPasswordProfile").value;
      const confirmNewPassword = document.getElementById("confirmNewPasswordProfile").value;

      const validationResult = validateChangePasswordForm(oldPassword, newPassword, confirmNewPassword);
      if (!validationResult.isValid) {
        return showToast(validationResult.message, "error");
      }

      try {
        await authService.changePassword(oldPassword, newPassword);
        showToast("Password berhasil diubah!", "success");
        changePasswordForm.reset();
      } catch (error) {
        showToast(error.message || "Gagal mengubah password.", "error");
      }
    });
  }

  if (showPasswordCheckbox) {
    showPasswordCheckbox.addEventListener("change", () => {
      const isChecked = showPasswordCheckbox.checked;
      const fields = [
        document.getElementById("oldPasswordProfile"),
        document.getElementById("newPasswordProfile"),
        document.getElementById("confirmNewPasswordProfile"),
      ];
      fields.forEach(field => {
        if (field) field.type = isChecked ? "text" : "password";
      });
    });
  }

  if (photoUploadInput) {
    photoUploadInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => { profilePhotoPreview.src = e.target.result; };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  logoutButtons.forEach(button => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      authService.logout();
    });
  });

  loadProfileData();
});
