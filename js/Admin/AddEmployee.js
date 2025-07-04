import { userService } from "../Services/UserServices.js";
import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", async () => {
  feather.replace();

  const addEmployeeForm = document.getElementById("addEmployeeForm");
  const registerErrorMessageDiv = document.getElementById("registerErrorMessage");
  const registerSuccessMessageDiv = document.getElementById("registerSuccessMessage");
  const departmentSelect = document.getElementById("department");
  const cancelButton = document.getElementById("cancelButton");
  const logoutButton = document.getElementById("logoutButton");

  if (!registerErrorMessageDiv || !registerSuccessMessageDiv) {
    console.error("Elemen pesan error/sukses tidak ditemukan.");
  }

  if (!addEmployeeForm) {
    console.error('Formulir tambah karyawan tidak ditemukan. Pastikan ID "addEmployeeForm" benar.');
    return;
  }

  const loadDepartments = async () => {
    try {
      const departments = await departmentService.getAllDepartments();
      console.log("Daftar Departemen dari API:", departments);

      if (!Array.isArray(departments)) {
        console.error("Respons API departemen bukan array:", departments);
        registerErrorMessageDiv.textContent = "Format data departemen dari server tidak valid.";
        registerErrorMessageDiv.classList.remove("hidden");
        return;
      }

      departmentSelect.innerHTML = '<option value="">Pilih Departemen</option>';

      departments.forEach((dept) => {
        const option = document.createElement("option");
        option.value = dept.name;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Gagal memuat daftar departemen:", error);
      registerErrorMessageDiv.textContent = "Gagal memuat daftar departemen. Silakan coba lagi atau hubungi admin.";
      registerErrorMessageDiv.classList.remove("hidden");

      if (error.status === 401 || error.message.includes("token autentikasi")) {
        authService.logout();
      }
    }
  };

  loadDepartments();

  addEmployeeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    registerErrorMessageDiv.classList.add("hidden");
    registerSuccessMessageDiv.classList.add("hidden");
    registerErrorMessageDiv.textContent = "";
    registerSuccessMessageDiv.textContent = "";

    const formData = new FormData(addEmployeeForm);
    const userData = Object.fromEntries(formData.entries());

    userData.role = "karyawan";

    userData.base_salary = parseFloat(userData.base_salary);
    if (isNaN(userData.base_salary)) {
      registerErrorMessageDiv.textContent = "Gaji pokok harus berupa angka yang valid.";
      registerErrorMessageDiv.classList.remove("hidden");
      return;
    }

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      registerErrorMessageDiv.textContent = "Anda tidak terautentikasi. Silakan login ulang.";
      registerErrorMessageDiv.classList.remove("hidden");
      return;
    }

    try {
      const response = await userService.registerUser(userData, authToken);
      console.log("Karyawan berhasil didaftarkan:", response);

      registerSuccessMessageDiv.textContent = "Karyawan berhasil didaftarkan! Mengarahkan kembali ke dashboard...";
      registerSuccessMessageDiv.classList.remove("hidden");
      addEmployeeForm.reset();

      setTimeout(() => {
        window.location.href = "/src/pages/Admin/manage_employees.html";
      }, 2000);
    } catch (error) {
      console.error("Gagal mendaftarkan karyawan:", error);
      let errorMessage = "Terjadi kesalahan saat mendaftarkan karyawan. Silakan coba lagi.";

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

      registerErrorMessageDiv.innerHTML = errorMessage;
      registerErrorMessageDiv.classList.remove("hidden");
    }
  });

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      addEmployeeForm.reset();
      window.location.href = "/src/pages/Admin/manage_employees.html";
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      authService.logout();
    });
  }

  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileSidebar = document.getElementById("mobileSidebar");
  const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
  const closeSidebar = document.getElementById("closeSidebar");

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
