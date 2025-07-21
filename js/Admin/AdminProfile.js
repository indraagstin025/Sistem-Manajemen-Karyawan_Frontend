import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";


document.addEventListener("DOMContentLoaded", () => {
  feather.replace();

  const profilePhotoPreview = document.getElementById("adminProfilePhotoPreview");
  const photoUploadInput = document.getElementById("adminPhotoUpload");
  const nameInput = document.getElementById("adminName");
  const emailInput = document.getElementById("adminEmail");
  const positionInput = document.getElementById("adminPosition");
  const departmentInput = document.getElementById("adminDepartment");
  const addressTextarea = document.getElementById("adminAddress");
  const profileForm = document.getElementById("adminProfileForm");
  const cancelProfileEditBtn = document.getElementById("adminCancelProfileEditBtn");

  const baseSalaryInput = document.getElementById("adminBaseSalary");
  const toggleSalaryVisibilityBtn = document.getElementById("adminToggleSalaryVisibility");
  const salaryEyeIcon = document.getElementById("adminSalaryEyeIcon");
  let currentSalaryValue = "";

  let initialProfileData = {};

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
        padding: "12px 20px",
      },
    }).showToast();
  };

  const loadProfileData = async () => {
    try {
      const userString = localStorage.getItem("user");
      if (!userString) throw new Error("Sesi tidak valid. Harap login kembali.");

      const user = JSON.parse(userString);

      if (user.role !== "admin") {
        showToast("Akses ditolak. Halaman ini hanya untuk Admin.", "error");
        setTimeout(() => authService.logout(), 1500);
        return;
      }

      const adminData = await userService.getUserByID(user.id);

      if (adminData) {
        nameInput.value = adminData.name || "";
        emailInput.value = adminData.email || "";
        positionInput.value = adminData.position || "";
        departmentInput.value = adminData.department || "";
        addressTextarea.value = adminData.address || "";

        currentSalaryValue = adminData.base_salary;
        if (baseSalaryInput) {
          baseSalaryInput.value = "••••••••••";
          baseSalaryInput.dataset.masked = "true";
          salaryEyeIcon.setAttribute("data-feather", "eye");
          feather.replace();
        }

        initialProfileData = {
          name: adminData.name || "",
          email: adminData.email || "",
          position: adminData.position || "",
          department: adminData.department || "",
          base_salary: adminData.base_salary || 0,
          address: adminData.address || "",
        };

        const userAvatarHeader = document.getElementById("userAvatar");
        if (userAvatarHeader) {
          userAvatarHeader.src = await getUserPhotoBlobUrl(user.id, adminData.name, 40);
        }

        profilePhotoPreview.src = await getUserPhotoBlobUrl(user.id, adminData.name, 128);
      }
    } catch (error) {
      console.error("Error loading admin profile data:", error);
      showToast(error.message || "Gagal memuat data profil admin. Silakan coba lagi.", "error");
      if (error.message.includes("Sesi") || error.status === 401 || error.status === 403) {
        setTimeout(() => authService.logout(), 2000);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const userString = localStorage.getItem("user");

      try {
        if (!userString) throw new Error("Sesi tidak valid. Harap login kembali.");

        const user = JSON.parse(userString);

        if (user.role !== "admin") {
          showToast("Akses ditolak. Anda tidak diizinkan mengubah data ini.", "error");
          return;
        }

        const photoFile = photoUploadInput.files[0];
        const updatedData = {};

        if (nameInput.value.trim() !== initialProfileData.name) {
          updatedData.name = nameInput.value.trim();
        }

        if (emailInput.value.trim() !== initialProfileData.email) {
          updatedData.email = emailInput.value.trim();
        }

        if (positionInput.value.trim() !== initialProfileData.position) {
          updatedData.position = positionInput.value.trim();
        }

        if (departmentInput.value.trim() !== initialProfileData.department) {
          updatedData.department = departmentInput.value.trim();
        }

        const newBaseSalary = parseFloat(baseSalaryInput.value.replace(/[^0-9,-]+/g, "").replace(",", "."));
        if (newBaseSalary !== initialProfileData.base_salary && !isNaN(newBaseSalary)) {
          updatedData.base_salary = newBaseSalary;
        }

        if (addressTextarea.value.trim() !== initialProfileData.address) {
          updatedData.address = addressTextarea.value.trim();
        }

        if (Object.keys(updatedData).length === 0 && !photoFile) {
          return showToast("Tidak ada perubahan untuk disimpan.", "info");
        }

        if (Object.keys(updatedData).length > 0) {
          await userService.updateUser(user.id, updatedData);

          const currentUserData = authService.getCurrentUser();
          if (currentUserData) {
            if (updatedData.email) currentUserData.email = updatedData.email;
            if (updatedData.name) currentUserData.name = updatedData.name;
            localStorage.setItem("user", JSON.stringify(currentUserData));
          }
        }

        if (photoFile) {
          const MAX_FILE_SIZE_MB = 5;
          if (photoFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            showToast(`Ukuran file maksimal adalah ${MAX_FILE_SIZE_MB}MB.`, "error");
            return;
          }

          await userService.uploadProfilePhoto(user.id, photoFile);

          profilePhotoPreview.src = await getUserPhotoBlobUrl(user.id, initialProfileData.name, 128);

          const userAvatarHeader = document.getElementById("userAvatar");
          if (userAvatarHeader) {
            userAvatarHeader.src = await getUserPhotoBlobUrl(user.id, initialProfileData.name, 40);
          }
        }

        showToast("Profil admin berhasil diupdate!", "success");
        loadProfileData();
      } catch (error) {
        console.error("Error updating admin profile:", error);
        const errorMessage = error.response && error.response.data && error.response.data.error ? error.response.data.error : error.message || "Gagal mengupdate profil admin.";
        showToast(errorMessage, "error");
        if (error.status === 401 || error.status === 403) {
          setTimeout(() => authService.logout(), 2000);
        }
      }
    });
  }

  if (cancelProfileEditBtn) {
    cancelProfileEditBtn.addEventListener("click", (event) => {
      event.preventDefault();
      profileForm.reset();
      loadProfileData();
      showToast("Perubahan dibatalkan.", "info");
    });
  }

  if (toggleSalaryVisibilityBtn) {
    toggleSalaryVisibilityBtn.addEventListener("click", () => {
      if (baseSalaryInput.dataset.masked === "true") {
        baseSalaryInput.value = formatCurrency(currentSalaryValue);
        baseSalaryInput.dataset.masked = "false";
        salaryEyeIcon.setAttribute("data-feather", "eye-off");
      } else {
        baseSalaryInput.value = "••••••••••";
        baseSalaryInput.dataset.masked = "true";
        salaryEyeIcon.setAttribute("data-feather", "eye");
      }
      feather.replace();
    });
  }

  if (photoUploadInput) {
    photoUploadInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          profilePhotoPreview.src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  document.querySelectorAll("#logoutButton, #dropdownLogoutButton, #mobileLogoutButton").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      authService.logout();
    });
  });

  loadProfileData();
});
