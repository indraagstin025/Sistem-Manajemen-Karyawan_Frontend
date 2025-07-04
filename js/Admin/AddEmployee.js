import { userService } from "../Services/UserServices.js";
import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeFormValidation, isFormValid } from "../Validations/addEmployeeValidation.js";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

document.addEventListener("DOMContentLoaded", async () => {
  feather.replace();
  initializeFormValidation();

  const addEmployeeForm = document.getElementById("addEmployeeForm");
  const departmentSelect = document.getElementById("department");
  const cancelButton = document.getElementById("cancelButton");
  const logoutButtons = document.querySelectorAll("#logoutButton");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileSidebar = document.getElementById("mobileSidebar");
  const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
  const closeSidebar = document.getElementById("closeSidebar");

  /**
   * Menampilkan notifikasi modal di tengah layar tanpa ikon.
   * @param {string} message - Pesan yang akan ditampilkan.
   * @param {'success' | 'error' | 'warning'} type - Tipe notifikasi untuk menentukan warna.
   */
  function showAlert(message, type = "success") {
    const colorConfig = {
      success: "linear-gradient(to right, #10b981, #14b8a6)",
      error: "linear-gradient(to right, #ef4444, #dc2626)",
      warning: "linear-gradient(to right, #f97316, #ea580c)",
    };

    const backgroundColor = colorConfig[type] || colorConfig.error;

    Toastify({
      text: message,
      duration: type === "success" ? 3000 : -1,
      close: true,
      gravity: "top",
      position: "center",
      stopOnFocus: true,
      style: {
        background: backgroundColor,
        borderRadius: "8px",
        padding: "20px 24px",
        boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
        maxWidth: "400px",
        textAlign: "center",
      },
      modal: true,
    }).showToast();
  }

  const loadDepartments = async () => {
    try {
      const departments = await departmentService.getAllDepartments();
      departmentSelect.innerHTML = '<option value="">Pilih Departemen</option>';
      departments.forEach((dept) => {
        const option = document.createElement("option");
        option.value = dept.name;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Gagal memuat daftar departemen:", error);
      showAlert("Gagal memuat daftar departemen.", "error");
      if (error.status === 401) authService.logout();
    }
  };

  await loadDepartments();

  addEmployeeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isFormValid()) {
      showAlert("Harap perbaiki semua kesalahan pada form.", "error");
      return;
    }

    const formData = new FormData(addEmployeeForm);
    const userData = Object.fromEntries(formData.entries());
    userData.role = "karyawan";
    userData.base_salary = parseFloat(userData.base_salary);
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      authService.logout();
      return;
    }

    try {
      await userService.registerUser(userData, authToken);
      showAlert("Karyawan baru berhasil didaftarkan!", "success");

      addEmployeeForm.reset();
      initializeFormValidation();

      setTimeout(() => {
        window.location.href = "/src/pages/Admin/manage_employees.html";
      }, 2000);
    } catch (error) {
      console.error("Gagal mendaftarkan karyawan:", error);
      const errorMessage = error.details?.error || error.message || "Terjadi kesalahan server.";
      showAlert(errorMessage, "error");
    }
  });

  cancelButton?.addEventListener("click", () => {
    if (confirm("Anda yakin ingin membatalkan? Perubahan tidak akan disimpan.")) {
      window.location.href = "/src/pages/Admin/manage_employees.html";
    }
  });

  logoutButtons.forEach((button) => {
    button?.addEventListener("click", (event) => {
      event.preventDefault();
      authService.logout();
    });
  });

  const showMobileSidebar = () => {
    mobileSidebar?.classList.remove("hidden");
    setTimeout(() => {
      mobileSidebar?.classList.remove("opacity-0");
      mobileSidebarPanel?.classList.remove("-translate-x-full");
    }, 10);
  };

  const hideMobileSidebar = () => {
    mobileSidebar?.classList.add("opacity-0");
    mobileSidebarPanel?.classList.add("-translate-x-full");
    setTimeout(() => mobileSidebar?.classList.add("hidden"), 300);
  };

  sidebarToggle?.addEventListener("click", showMobileSidebar);
  closeSidebar?.addEventListener("click", hideMobileSidebar);
  mobileSidebar?.addEventListener("click", (event) => {
    if (event.target === mobileSidebar) hideMobileSidebar();
  });
});
