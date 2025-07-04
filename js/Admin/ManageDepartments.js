import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", async () => {
  feather.replace();

  const departmentTableBody = document.getElementById("departmentTableBody");
  const loadingMessage = document.getElementById("loadingMessage");
  const departmentListError = document.getElementById("departmentListError");
  const departmentListSuccess = document.getElementById("departmentListSuccess");
  const paginationInfo = document.getElementById("paginationInfo");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const searchInput = document.getElementById("searchInput");

  const editDepartmentModal = document.getElementById("editDepartmentModal");
  const closeEditDepartmentModalBtn = document.getElementById("closeEditDepartmentModalBtn");
  const cancelEditDepartmentBtn = document.getElementById("cancelEditDepartmentBtn");
  const editDepartmentForm = document.getElementById("editDepartmentForm");
  const editDepartmentErrorMessage = document.getElementById("editDepartmentErrorMessage");
  const editDepartmentSuccessMessage = document.getElementById("editDepartmentSuccessMessage");

  const editDepartmentId = document.getElementById("editDepartmentId");
  const editDepartmentName = document.getElementById("editDepartmentName");

  const logoutButton = document.getElementById("logoutButton");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileSidebar = document.getElementById("mobileSidebar");
  const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
  const closeSidebar = document.getElementById("closeSidebar");

  let currentPage = 1;
  const itemsPerPage = 10;
  let currentSearch = "";

  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    showGlobalMessage("Anda tidak terautentikasi. Silakan login ulang.", "error");
    setTimeout(() => (window.location.href = "/src/pages/login.html"), 2000);
    return;
  }

  const showGlobalMessage = (message, type = "success") => {
    departmentListSuccess.classList.add("hidden");
    departmentListError.classList.add("hidden");
    departmentListSuccess.textContent = "";
    departmentListError.textContent = "";

    if (type === "success") {
      departmentListSuccess.textContent = message;
      departmentListSuccess.classList.remove("hidden");
      departmentListSuccess.classList.remove("text-red-600");
      departmentListSuccess.classList.add("text-green-600");
    } else {
      departmentListError.textContent = message;
      departmentListError.classList.remove("hidden");
      departmentListError.classList.remove("text-green-600");
      departmentListError.classList.add("text-red-600");
    }
    setTimeout(() => {
      departmentListSuccess.classList.add("hidden");
      departmentListError.classList.add("hidden");
    }, 3000);
  };

  const showModalMessage = (message, type = "success", targetErrorDiv, targetSuccessDiv) => {
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

  const fetchDepartments = async () => {
    departmentTableBody.innerHTML = "";
    loadingMessage.classList.remove("hidden");

    try {
      const departments = await departmentService.getAllDepartments(authToken);
      console.log("Daftar Departemen dari API:", departments);

      loadingMessage.classList.add("hidden");

      if (departments && departments.length > 0) {
        renderDepartments(departments);

        paginationInfo.textContent = `Menampilkan ${departments.length} dari ${departments.length} departemen`;
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
      } else {
        departmentTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">Tidak ada data departemen.</td></tr>';
        paginationInfo.textContent = "Menampilkan 0 dari 0 departemen";
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
      }
    } catch (error) {
      console.error("Gagal memuat data departemen:", error);
      loadingMessage.classList.add("hidden");
      let errorMessage = "Gagal memuat data departemen. Silakan coba lagi.";
      if (error.status === 401 || error.status === 403) {
        errorMessage = "Sesi Anda telah berakhir atau Anda tidak memiliki izin. Silakan login kembali.";
        setTimeout(() => (window.location.href = "/src/pages/login.html"), 2000);
      } else if (error.message) {
        errorMessage = error.message;
      }
      showGlobalMessage(errorMessage, "error");
    }
  };

  const renderDepartments = (departments) => {
    departmentTableBody.innerHTML = "";

    departments.forEach((dept) => {
      const row = document.createElement("tr");
      row.className = "border-b border-gray-100";

      const createdAt = new Date(dept.created_at).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      row.innerHTML = `
                <td class="px-4 py-3">${dept.name}</td>
                <td class="px-4 py-3">${createdAt}</td>
                <td class="px-4 py-3">
                    <button class="edit-btn text-blue-600 hover:text-blue-800 mr-2" title="Edit" data-id="${dept.id}">
                        <i data-feather="edit" class="w-5 h-5"></i>
                    </button>
                    <button class="delete-btn text-red-600 hover:text-red-800" title="Hapus" data-id="${dept.id}" data-name="${dept.name}">
                        <i data-feather="trash-2" class="w-5 h-5"></i>
                    </button>
                </td>
            `;
      departmentTableBody.appendChild(row);
    });
    feather.replace();

    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", (e) => openEditModal(e.currentTarget.dataset.id));
    });
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", (e) => handleDelete(e.currentTarget.dataset.id, e.currentTarget.dataset.name));
    });
  };

  const openEditModal = async (departmentId) => {
    editDepartmentErrorMessage.classList.add("hidden");
    editDepartmentSuccessMessage.classList.add("hidden");
    editDepartmentErrorMessage.textContent = "";
    editDepartmentSuccessMessage.textContent = "";

    try {
      const department = await departmentService.getDepartmentByID(departmentId, authToken);
      if (department) {
        editDepartmentId.value = department.id;
        editDepartmentName.value = department.name;
        editDepartmentModal.classList.remove("hidden");
      } else {
        showGlobalMessage("Data departemen tidak ditemukan.", "error");
      }
    } catch (error) {
      console.error("Gagal mengambil data departemen untuk edit:", error);
      showGlobalMessage(`Gagal memuat data edit: ${error.message || "Terjadi kesalahan"}`, "error");
    }
  };

  const closeEditModal = () => {
    editDepartmentModal.classList.add("hidden");
    editDepartmentForm.reset();
  };

  if (closeEditDepartmentModalBtn) closeEditDepartmentModalBtn.addEventListener("click", closeEditModal);
  if (cancelEditDepartmentBtn) cancelEditDepartmentBtn.addEventListener("click", closeEditModal);
  if (editDepartmentModal) {
    editDepartmentModal.addEventListener("click", (event) => {
      if (event.target === editDepartmentModal) {
        closeEditModal();
      }
    });
  }

  if (editDepartmentForm) {
    editDepartmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      editDepartmentErrorMessage.classList.add("hidden");
      editDepartmentSuccessMessage.classList.add("hidden");

      const departmentId = editDepartmentId.value;
      const updatedName = editDepartmentName.value.trim();

      if (!updatedName) {
        showModalMessage("Nama departemen tidak boleh kosong.", "error", editDepartmentErrorMessage, editDepartmentSuccessMessage);
        return;
      }

      try {
        const response = await departmentService.updateDepartment(departmentId, { name: updatedName }, authToken);
        console.log("Departemen berhasil diupdate:", response);

        showModalMessage("Departemen berhasil diupdate!", "success", editDepartmentErrorMessage, editDepartmentSuccessMessage);

        setTimeout(() => {
          closeEditModal();
          fetchDepartments();
        }, 1500);
      } catch (error) {
        console.error("Gagal mengupdate departemen:", error);
        let errorMessage = "Terjadi kesalahan saat mengupdate departemen. Silakan coba lagi.";
        if (error.details) {
          if (Array.isArray(error.details)) {
            errorMessage = error.details.map((err) => `${err.Field || "Error"}: ${err.Msg}`).join("<br>");
          } else if (typeof error.details === "string") {
            errorMessage = error.details;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        showModalMessage(errorMessage, "error", editDepartmentErrorMessage, editDepartmentSuccessMessage);
      }
    });
  }

  const handleDelete = async (departmentId, departmentName) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus departemen "${departmentName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const response = await departmentService.deleteDepartment(departmentId, authToken);
      console.log("Departemen berhasil dihapus:", response);
      showGlobalMessage(`Departemen "${departmentName}" berhasil dihapus!`, "success");
      fetchDepartments();
    } catch (error) {
      console.error("Gagal menghapus departemen:", error);
      let errorMessage = "Terjadi kesalahan saat menghapus departemen. Silakan coba lagi.";
      if (error.status === 401 || error.status === 403) {
        errorMessage = "Anda tidak memiliki izin untuk menghapus departemen ini.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      showGlobalMessage(errorMessage, "error");
    }
  };

  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        fetchDepartments();
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => {
      currentPage++;
      fetchDepartments();
    });
  }

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = searchInput.value;
        currentPage = 1;
        fetchDepartments();
      }, 500);
    });
  }

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

  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      authService.logout();
    });
  }

  fetchDepartments();
});
