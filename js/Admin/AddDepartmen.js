import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", async () => {
  feather.replace();

  const addDepartmentForm = document.getElementById("addDepartmentForm");
  const departmentNameInput = document.getElementById("departmentName");
  const departmentErrorMessageDiv = document.getElementById("departmentErrorMessage");
  const departmentSuccessMessageDiv = document.getElementById("departmentSuccessMessage");
  const cancelButton = document.getElementById("cancelButton");
  const logoutButton = document.getElementById("logoutButton");

  const showMessage = (message, type = "success", targetDiv) => {
    targetDiv.classList.add("hidden");
    targetDiv.textContent = "";

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

  if (!addDepartmentForm) {
    console.error('Formulir tambah departemen tidak ditemukan. Pastikan ID "addDepartmentForm" benar.');
    return;
  }

  addDepartmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    departmentErrorMessageDiv.classList.add("hidden");
    departmentSuccessMessageDiv.classList.add("hidden");
    departmentErrorMessageDiv.textContent = "";
    departmentSuccessMessageDiv.textContent = "";

    const departmentName = departmentNameInput.value.trim();

    if (!departmentName) {
      showMessage("Nama departemen tidak boleh kosong.", "error", departmentErrorMessageDiv);
      return;
    }

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      showMessage("Anda tidak terautentikasi. Silakan login ulang.", "error", departmentErrorMessageDiv);
      authService.logout();
      return;
    }

    try {
      const response = await departmentService.createDepartment({ name: departmentName }, authToken);
      console.log("Departemen berhasil ditambahkan:", response);

      showMessage("Departemen berhasil ditambahkan!", "success", departmentSuccessMessageDiv);
      addDepartmentForm.reset();

      setTimeout(() => {
        window.location.href = "/src/pages/Admin/manage_departments.html";
      }, 2000);
    } catch (error) {
      console.error("Gagal menambahkan departemen:", error);
      let errorMessage = "Terjadi kesalahan saat menambahkan departemen. Silakan coba lagi.";

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
      showMessage(errorMessage, "error", departmentErrorMessageDiv);
    }
  });

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      addDepartmentForm.reset();
      window.location.href = "/src/pages/Admin/admin_dashboard.html";
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
