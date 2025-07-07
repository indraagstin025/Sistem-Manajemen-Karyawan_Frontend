import { userService } from "../Services/UserServices.js";
import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", async () => {
  feather.replace();

  const employeeTableBody = document.getElementById("employeeTableBody");
  const loadingMessage = document.getElementById("loadingMessage");
  const employeeListError = document.getElementById("employeeListError");
  const employeeListSuccess = document.getElementById("employeeListSuccess");
  const paginationInfo = document.getElementById("paginationInfo");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const searchInput = document.getElementById("searchInput");

  const editEmployeeModal = document.getElementById("editEmployeeModal");
  const closeEditEmployeeModalBtn = document.getElementById("closeEditEmployeeModalBtn");
  const cancelEditEmployeeBtn = document.getElementById("cancelEditEmployeeBtn");
  const editEmployeeForm = document.getElementById("editEmployeeForm");
  const editErrorMessageDiv = document.getElementById("editErrorMessage");
  const editSuccessMessageDiv = document.getElementById("editSuccessMessage");
  
  const editEmployeeId = document.getElementById("editEmployeeId");
  const editName = document.getElementById("editName");
  const editEmail = document.getElementById("editEmail");
  const editPosition = document.getElementById("editPosition");
  const editDepartment = document.getElementById("editDepartment");
  const editBaseSalary = document.getElementById("editBaseSalary");
  const editAddress = document.getElementById("editAddress");



  let currentPage = 1;
  const itemsPerPage = 10;
  let currentSearch = "";
  let currentRoleFilter = "";
  let allDepartments = [];


    const showGlobalMessage = (message, type = "success") => {
    employeeListSuccess.classList.add("hidden");
    employeeListError.classList.add("hidden");
    employeeListSuccess.textContent = "";
    employeeListError.textContent = "";

    if (type === "success") {
      employeeListSuccess.textContent = message;
      employeeListSuccess.classList.remove("hidden");
      employeeListSuccess.classList.remove("text-red-600");
      employeeListSuccess.classList.add("text-green-600");
    } else {
      employeeListError.textContent = message;
      employeeListError.classList.remove("hidden");
      employeeListError.classList.remove("text-green-600");
      employeeListError.classList.add("text-red-600");
    }
    setTimeout(() => {
      employeeListSuccess.classList.add("hidden");
      employeeListError.classList.add("hidden");
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

  const authToken = localStorage.getItem("token"); 
  if (!authToken) {
    showGlobalMessage("Anda tidak terautentikasi. Silakan login ulang.", "error");
    setTimeout(() => (window.location.href = "/src/pages/login.html"), 2000);
    return;
  }




  const loadDepartmentsToEditModal = async () => {
    try {
      const departments = await departmentService.getAllDepartments(authToken);
      allDepartments = departments;
      
      editDepartment.innerHTML = '<option value="">Pilih Departemen</option>';

      if (Array.isArray(allDepartments)) {
        allDepartments.forEach(dept => {
          const option = document.createElement("option");
          option.value = dept.name;
          option.textContent = dept.name;
          editDepartment.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Gagal memuat daftar departemen untuk modal edit:", error);
      editErrorMessageDiv.textContent = 'Gagal memuat daftar departemen. Silakan coba lagi.';
      editErrorMessageDiv.classList.remove("hidden");
      
      if (error.status === 401 || error.message.includes('token autentikasi')) {
        authService.logout();
      }
    }
  };

  const fetchEmployees = async () => {
    employeeTableBody.innerHTML = "";
    loadingMessage.classList.remove("hidden");

    try {
      const data = await userService.getAllUsers(authToken, currentPage, itemsPerPage, currentSearch, currentRoleFilter);

      loadingMessage.classList.add("hidden");

      if (data.data && data.data.length > 0) {
        renderEmployees(data.data);
        updatePagination(data.total, data.page, data.limit);
      } else {
        employeeTableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">Tidak ada data karyawan.</td></tr>'; 
        paginationInfo.textContent = "Menampilkan 0 dari 0 karyawan";
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
      }
    } catch (error) {
      console.error("Gagal memuat data karyawan:", error);
      loadingMessage.classList.add("hidden");
      let errorMessage = "Gagal memuat data karyawan. Silakan coba lagi.";
      if (error.status === 401 || error.status === 403) {
        errorMessage = "Sesi Anda telah berakhir atau Anda tidak memiliki izin. Silakan login kembali.";
        setTimeout(() => (window.location.href = "/src/pages/login.html"), 2000);
      } else if (error.message) {
        errorMessage = error.message;
      }
      showGlobalMessage(errorMessage, "error");
    }
  };

  const renderEmployees = (employees) => {
    employeeTableBody.innerHTML = "";

    employees.forEach((employee) => {
      const row = document.createElement("tr");
      row.className = "border-b border-gray-100";
      const photoUrl = employee.photo || "https://placehold.co/32x32/E2E8F0/4A5568?text=ME"; 
      
      row.innerHTML = `
                <td class="px-4 py-3">
                    <img src="${photoUrl}" alt="${employee.name}" class="profile-thumb">
                </td>
                <td class="px-4 py-3">${employee.name}</td>
                <td class="px-4 py-3">${employee.email}</td>
                <td class="px-4 py-3 capitalize">${employee.role}</td>
                <td class="px-4 py-3">${employee.position || "-"}</td>
                <td class="px-4 py-3">${employee.department || "-"}</td>
                <td class="px-4 py-3">Rp ${employee.base_salary ? employee.base_salary.toLocaleString("id-ID") : "0"}</td>
                <td class="px-4 py-3">
                    <button class="edit-btn text-blue-600 hover:text-blue-800 mr-2" title="Edit" data-id="${employee.id}">
                        <i data-feather="edit" class="w-5 h-5"></i>
                    </button>
                    <button class="delete-btn text-red-600 hover:text-red-800" title="Hapus" data-id="${employee.id}" data-name="${employee.name}">
                        <i data-feather="trash-2" class="w-5 h-5"></i>
                    </button>
                </td>
            `;
      employeeTableBody.appendChild(row);
    });
    feather.replace();

    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", (e) => openEditModal(e.currentTarget.dataset.id));
    });
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", (e) => handleDelete(e.currentTarget.dataset.id, e.currentTarget.dataset.name));
    });
  };

  const updatePagination = (total, page, limit) => {
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);
    paginationInfo.textContent = `Menampilkan ${startIndex}-${endIndex} dari ${total} karyawan`;

    prevPageBtn.disabled = page === 1;
    nextPageBtn.disabled = endIndex >= total;
  };

  const openEditModal = async (employeeId) => {
    editErrorMessageDiv.classList.add("hidden");
    editSuccessMessageDiv.classList.add("hidden");
    editErrorMessageDiv.textContent = "";
    editSuccessMessageDiv.textContent = "";

    if (allDepartments.length === 0) {
        await loadDepartmentsToEditModal();
    }

    try {
      const employee = await userService.getUserByID(employeeId, authToken);
      if (employee) {
        editEmployeeId.value = employee.id;
        editName.value = employee.name;
        editEmail.value = employee.email;
        editPosition.value = employee.position || "";
        editDepartment.value = employee.department || "";
        editBaseSalary.value = employee.base_salary || 0;
        editAddress.value = employee.address || "";
        editEmployeeModal.classList.remove("hidden");
      } else {
        showGlobalMessage("Data karyawan tidak ditemukan.", "error");
      }
    } catch (error) {
      console.error("Gagal mengambil data karyawan untuk edit:", error);
      showGlobalMessage(`Gagal memuat data edit: ${error.message || "Terjadi kesalahan"}`, "error");
    }
  };

  const closeEditModal = () => {
    editEmployeeModal.classList.add("hidden");
    editEmployeeForm.reset();
  };

  if (closeEditEmployeeModalBtn) closeEditEmployeeModalBtn.addEventListener("click", closeEditModal);
  if (cancelEditEmployeeBtn) cancelEditEmployeeBtn.addEventListener("click", closeEditModal);
  if (editEmployeeModal) {
    editEmployeeModal.addEventListener("click", (event) => {
      if (event.target === editEmployeeModal) {
        closeEditModal();
      }
    });
  }

  if (editEmployeeForm) {
    editEmployeeForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      editErrorMessageDiv.classList.add("hidden");
      editSuccessMessageDiv.classList.add("hidden");

      const employeeId = editEmployeeId.value;
      const formData = new FormData(editEmployeeForm);
      const updatedData = {};
      for (const [key, value] of formData.entries()) {
          updatedData[key] = value;
      }

      delete updatedData.id;
      delete updatedData.password; 
      delete updatedData.role; 
      delete updatedData.photo_file;


      updatedData.base_salary = parseFloat(updatedData.base_salary);
      if (isNaN(updatedData.base_salary)) {
        editErrorMessageDiv.textContent = "Gaji pokok harus berupa angka yang valid.";
        editErrorMessageDiv.classList.remove("hidden");
        return;
      }

      try {
        const dataToUpdate = {
            name: updatedData.name,
            email: updatedData.email,
            position: updatedData.position,
            department: updatedData.department,
            base_salary: updatedData.base_salary,
            address: updatedData.address,
        };

        const response = await userService.updateUser(employeeId, dataToUpdate, authToken);
        console.log("Karyawan berhasil diupdate:", response);

        editSuccessMessageDiv.textContent = "Karyawan berhasil diupdate!";
        editSuccessMessageDiv.classList.remove("hidden");

        setTimeout(() => {
          closeEditModal();
          fetchEmployees(); 
        }, 1500);
      } catch (error) {
        console.error("Gagal mengupdate karyawan:", error);
        let errorMessage = "Terjadi kesalahan saat mengupdate karyawan. Silakan coba lagi.";
        if (error.details) {
          if (Array.isArray(error.details)) {
            errorMessage = error.details.map((err) => `${err.Field || "Error"}: ${err.Msg}`).join("<br>");
          } else if (typeof error.details === "string") {
            errorMessage = error.details;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        editErrorMessageDiv.innerHTML = errorMessage;
        editErrorMessageDiv.classList.remove("hidden");
      }
    });
  }

  const handleDelete = async (employeeId, employeeName) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus karyawan "${employeeName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const response = await userService.deleteUser(employeeId, authToken);
      console.log("Karyawan berhasil dihapus:", response);
      showGlobalMessage(`Karyawan "${employeeName}" berhasil dihapus!`, "success");
      fetchEmployees();
    } catch (error) {
      console.error("Gagal menghapus karyawan:", error);
      let errorMessage = "Terjadi kesalahan saat menghapus karyawan. Silakan coba lagi.";
      if (error.status === 401 || error.status === 403) {
        errorMessage = "Anda tidak memiliki izin untuk menghapus karyawan ini.";
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
        fetchEmployees();
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => {
      currentPage++;
      fetchEmployees();
    });
  }

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = searchInput.value;
        currentPage = 1;
        fetchEmployees();
      }, 500);
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

  fetchEmployees();
});