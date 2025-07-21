import { userService } from "../Services/UserServices.js";
import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { QRCodeManager } from "../components/qrCodeHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js";
import Swal from "sweetalert2";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

document.addEventListener("DOMContentLoaded", async () => {
  feather.replace();
  initializeSidebar();
  initializeLogout({
    preLogoutCallback: () => {
      if (typeof QRCodeManager !== "undefined" && QRCodeManager.close) {
        QRCodeManager.close();
      }
    },
  });

  QRCodeManager.initialize({
    toastCallback: (message, type) => {
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
        style: { background: backgroundColor, borderRadius: "8px" },
      }).showToast();
    },
  });

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

  const userAvatarNav = document.getElementById("userAvatar");
  const userNameNav = document.getElementById("userNameNav");
  const userDropdownContainer = document.getElementById("userDropdown");
  const dropdownMenu = document.getElementById("dropdownMenu");

  let currentPage = 1;
  const itemsPerPage = 10;
  let currentSearch = "";
  let currentRoleFilter = "";
  let allDepartments = [];

  const showSweetAlert = (title, message, icon = "success", showConfirmButton = false, timer = 2000) => {
    Swal.fire({
      title: title,
      html: message,
      icon: icon,
      showConfirmButton: showConfirmButton,
      timer: timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        if (timer > 0) {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        }
      },
    });
  };

  const loadUserProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user && user.role === "admin") {
        const photoUrl = await getUserPhotoBlobUrl(user.id, user.name, 40);
        if (userAvatarNav) {
          userAvatarNav.src = photoUrl;
          userAvatarNav.alt = user.name || "Admin";
        }
        if (userNameNav) {
          userNameNav.textContent = user.name || "Admin";
        }
      } else {
        if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
        if (userNameNav) userNameNav.textContent = "Guest";
      }
    } catch (error) {
      console.error("Failed to load admin profile for header:", error);
      if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
      if (userNameNav) userNameNav.textContent = "Error";
    }
  };

  const loadDepartmentsToEditModal = async () => {
    try {
      const departments = await departmentService.getAllDepartments();
      allDepartments = departments;

      editDepartment.innerHTML = '<option value="">Pilih Departemen</option>';

      if (Array.isArray(allDepartments)) {
        allDepartments.forEach((dept) => {
          const option = document.createElement("option");
          option.value = dept.name;
          option.textContent = dept.name;
          editDepartment.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Failed to load department list for edit modal:", error);
      showSweetAlert("Error", "Failed to load department list. Please try again.", "error", true);
      if (error.status === 401 || error.status === 403) {
        setTimeout(() => authService.logout(), 2000);
      }
    }
  };

  const fetchEmployees = async () => {
    employeeTableBody.innerHTML = "";
    loadingMessage.classList.remove("hidden");
    employeeListError.classList.add("hidden");
    employeeListSuccess.classList.add("hidden");

    try {
      const data = await userService.getAllUsers(currentPage, itemsPerPage, currentSearch, currentRoleFilter);

      loadingMessage.classList.add("hidden");

      if (data.data && data.data.length > 0) {
        await renderEmployees(data.data);
        updatePagination(data.total, data.page, data.limit);
      } else {
        employeeTableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No employee data found.</td></tr>';
        paginationInfo.textContent = "Displaying 0 of 0 employees";
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
      }
    } catch (error) {
      console.error("Failed to load employee data:", error);
      loadingMessage.classList.add("hidden");
      let errorMessage = "Failed to load employee data. Please try again.";
      if (error.status === 401 || error.status === 403) {
        errorMessage = "Your session has expired or you do not have permission. Please log in again.";
        setTimeout(() => authService.logout(), 2000);
      } else if (error.message) {
        errorMessage = error.message;
      }
      showSweetAlert("Data Error", errorMessage, "error", true);
    }
  };

  const renderEmployees = async (employees) => {
    employeeTableBody.innerHTML = "";

    for (const employee of employees) {
      const row = document.createElement("tr");
      row.className = "border-b border-gray-100 hover:bg-gray-50";

      const photoUrl = await getUserPhotoBlobUrl(employee.id, employee.name, 48);

      row.innerHTML = `
                <td class="px-4 py-3">
                    <img src="${photoUrl}" alt="${employee.name}" class="h-10 w-10 rounded-full object-cover profile-thumb">
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${employee.name}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${employee.email}</td>
                <td class="px-4 py-3 text-sm text-gray-700 capitalize">${employee.role}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${employee.position || "-"}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${employee.department || "-"}</td>
                <td class="px-4 py-3 text-sm text-gray-700">Rp ${employee.base_salary ? employee.base_salary.toLocaleString("id-ID") : "0"}</td>
                <td class="px-4 py-3 text-sm flex items-center space-x-2">
                    <button class="edit-btn text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1 rounded-md hover:bg-blue-50" title="Edit" data-id="${employee.id}">
                        <i data-feather="edit" class="w-5 h-5"></i>
                    </button>
                    <button class="delete-btn text-red-600 hover:text-red-800 transition-colors duration-200 p-1 rounded-md hover:bg-red-50" title="Hapus" data-id="${employee.id}" data-name="${employee.name}">
                        <i data-feather="trash-2" class="w-5 h-5"></i>
                    </button>
                </td>
            `;
      employeeTableBody.appendChild(row);
    }

    feather.replace();

    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", (e) => openEditModal(e.currentTarget.dataset.id));
    });
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", (e) => handleDelete(e.currentTarget.dataset.id, e.currentTarget.dataset.name));
    });
  };

  const updatePagination = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);

    paginationInfo.textContent = `Displaying ${startIndex}-${endIndex} of ${total} employees`;

    prevPageBtn.disabled = page === 1;
    nextPageBtn.disabled = page >= totalPages;
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
      const employee = await userService.getUserByID(employeeId);
      if (employee) {
        editEmployeeId.value = employee.id;
        editName.value = employee.name;
        editEmail.value = employee.email;
        editPosition.value = employee.position || "";
        editDepartment.value = employee.department || "";
        editBaseSalary.value = employee.base_salary || 0;
        editAddress.value = employee.address || "";

        editEmployeeModal.classList.remove("hidden");
        setTimeout(() => editEmployeeModal.classList.add("active"), 10);
      } else {
        showSweetAlert("Data Not Found", "Employee data not found.", "error");
      }
    } catch (error) {
      console.error("Failed to fetch employee data for edit:", error);
      showSweetAlert(`Failed to Load Data`, `Failed to load edit data: ${error.message || "An error occurred"}`, "error", true);
      if (error.status === 401 || error.status === 403) {
        setTimeout(() => authService.logout(), 2000);
      }
    }
  };

  const closeEditModal = () => {
    editEmployeeModal.classList.remove("active");
    setTimeout(() => {
      editEmployeeModal.classList.add("hidden");
      editEmployeeForm.reset();
    }, 300);
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

      updatedData.base_salary = parseFloat(updatedData.base_salary);
      if (isNaN(updatedData.base_salary)) {
        showSweetAlert("Invalid Input", "Base salary must be a valid number.", "error", true);
        return;
      }

      const dataToUpdate = {
        name: updatedData.name,
        email: updatedData.email,
        position: updatedData.position,
        department: updatedData.department,
        base_salary: updatedData.base_salary,
        address: updatedData.address,
      };

      try {
        const response = await userService.updateUser(employeeId, dataToUpdate);
        console.log("Employee successfully updated:", response);

        showSweetAlert("Success!", "Employee successfully updated!", "success", false, 1500);

        setTimeout(() => {
          closeEditModal();
          fetchEmployees();
        }, 1500);
      } catch (error) {
        console.error("Failed to update employee:", error);
        let errorMessage = "An error occurred while updating the employee. Please try again.";
        if (error.details) {
          if (Array.isArray(error.details)) {
            errorMessage = error.details.map((err) => `${err.Field || "Error"}: ${err.Msg}`).join("<br>");
          } else if (typeof error.details === "string") {
            errorMessage = error.details;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        showSweetAlert("Update Failed", errorMessage, "error", true);
        if (error.status === 401 || error.status === 403) {
          setTimeout(() => authService.logout(), 2000);
        }
      }
    });
  }

  const handleDelete = async (employeeId, employeeName) => {
    Swal.fire({
      title: `Delete ${employeeName}?`,
      text: "This action cannot be undone! Employee data will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await userService.deleteUser(employeeId);
          console.log("Employee successfully deleted:", response);

          Swal.fire({
            title: "Deleted!",
            text: `Employee "${employeeName}" successfully deleted.`,
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });

          fetchEmployees();
        } catch (error) {
          console.error("Failed to delete employee:", error);
          let errorMessage = "An error occurred while deleting the employee. Please try again.";
          if (error.status === 401 || error.status === 403) {
            errorMessage = "You do not have permission to delete this employee.";
            setTimeout(() => authService.logout(), 2000);
          } else if (error.message) {
            errorMessage = error.message;
          }

          Swal.fire({
            title: "Failed",
            text: errorMessage,
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      }
    });
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

  loadUserProfile();
  fetchEmployees();
});
