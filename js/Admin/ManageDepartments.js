// js/Admin/ManageDepartments.js

import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { QRCodeManager } from "../components/qrCodeHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js"; // Import getUserPhotoBlobUrl
import Swal from 'sweetalert2';
import Toastify from 'toastify-js';


document.addEventListener("DOMContentLoaded", async () => {
    // Initialize global components
    feather.replace();
    initializeSidebar();
    initializeLogout({
        preLogoutCallback: () => {
            if (typeof QRCodeManager !== 'undefined' && QRCodeManager.close) {
                QRCodeManager.close();
            }
        }
    });

    QRCodeManager.initialize({
        toastCallback: (message, type) => {
            let backgroundColor;
            if (type === "success") {
                backgroundColor = "linear-gradient(to right, #22c55e, #16a34a)";
            } else if (type === "error") {
                backgroundColor = "linear-gradient(to right, #ef4444, #dc2626)";
            } else { // info
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

    // --- DOM Element Selection ---
    const departmentTableBody = document.getElementById("departmentTableBody");
    const loadingMessage = document.getElementById("loadingMessage");
    const departmentListError = document.getElementById("departmentListError");
    const departmentListSuccess = document.getElementById("departmentListSuccess");
    const paginationInfo = document.getElementById("paginationInfo");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const searchInput = document.getElementById("searchInput");

    // Edit modal elements
    const editDepartmentModal = document.getElementById("editDepartmentModal");
    const closeEditDepartmentModalBtn = document.getElementById("closeEditDepartmentModalBtn");
    const cancelEditDepartmentBtn = document.getElementById("cancelEditDepartmentBtn");
    const editDepartmentForm = document.getElementById("editDepartmentForm");
    const editDepartmentErrorMessage = document.getElementById("editDepartmentErrorMessage");
    const editDepartmentSuccessMessage = document.getElementById("editDepartmentSuccessMessage");

    // Edit form inputs
    const editDepartmentId = document.getElementById("editDepartmentId");
    const editDepartmentName = document.getElementById("editDepartmentName");

    // User dropdown in header (for displaying profile photo)
    const userAvatarNav = document.getElementById("userAvatar");
    const userNameNav = document.getElementById("userNameNav"); // Assuming this ID exists in your header
    const userDropdownContainer = document.getElementById("userDropdown");
    const dropdownMenu = document.getElementById("dropdownMenu");

    let currentPage = 1;
    const itemsPerPage = 10;
    let allDepartmentsData = [];
    let filteredDepartmentsData = [];
    let currentSearchQuery = "";

    // --- Notification Function (SweetAlert2 for important messages) ---
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
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            }
        });
    };

    // Function to load admin profile photo in the header
    const loadAdminProfileForHeader = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user && user.role === 'admin') {
                const photoUrl = await getUserPhotoBlobUrl(user.id, user.name, 40); // 40x40 for header avatar
                if (userAvatarNav) {
                    userAvatarNav.src = photoUrl;
                    userAvatarNav.alt = user.name || "Admin";
                }
                if (userNameNav) { // Update username in header as well
                    userNameNav.textContent = user.name || "Admin";
                }
            } else {
                // Fallback for non-admin or no user
                if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
                if (userNameNav) userNameNav.textContent = "Guest";
            }
        } catch (error) {
            console.error("Failed to load admin profile for header:", error);
            if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
            if (userNameNav) userNameNav.textContent = "Error";
            // No toast here as it's not a critical error
        }
    };


    const fetchDepartments = async () => {
        departmentTableBody.innerHTML = "";
        loadingMessage.classList.remove("hidden");
        departmentListError.classList.add("hidden");
        departmentListSuccess.classList.add("hidden");

        try {
            const departments = await departmentService.getAllDepartments();
            loadingMessage.classList.add("hidden");

            if (!Array.isArray(departments)) {
                console.warn("Warning: API did not return an array of departments. Received:", departments);
                allDepartmentsData = [];
            } else {
                allDepartmentsData = departments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }

            applyFilterAndRender();

        } catch (error) {
            loadingMessage.classList.add("hidden");
            let errorMessage = "Failed to load department data.";
            if (error.status === 401 || error.status === 403) {
                errorMessage = "Your session has expired or you do not have permission. Please log in again.";
                setTimeout(() => authService.logout(), 2000);
            } else if (error.message) {
                errorMessage = error.message;
            }
            showSweetAlert('Data Error', errorMessage, 'error', true);
        }
    };

    const applyFilterAndRender = () => {
        filteredDepartmentsData = allDepartmentsData.filter(dept =>
            dept.name.toLowerCase().includes(currentSearchQuery.toLowerCase())
        );

        if (filteredDepartmentsData.length === 0) {
            departmentTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">No department data found.</td></tr>';
            paginationInfo.textContent = "Displaying 0 of 0 departments";
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
        } else {
            renderDepartments(filteredDepartmentsData);
            updatePaginationControls(filteredDepartmentsData.length);
        }
    };


    const renderDepartments = (departmentsToRender) => {
        departmentTableBody.innerHTML = "";
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedDepartments = departmentsToRender.slice(startIndex, endIndex);

        if (paginatedDepartments.length === 0 && currentPage > 1) {
            currentPage--;
            applyFilterAndRender();
            return;
        }


        paginatedDepartments.forEach((dept) => {
            const row = document.createElement("tr");
            row.className = "border-b border-gray-100 hover:bg-gray-50";
            const createdAt = new Date(dept.created_at).toLocaleDateString("id-ID", {
                year: "numeric", month: "long", day: "numeric",
            });
            row.innerHTML = `
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${dept.name}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${createdAt}</td>
                <td class="px-4 py-3 text-sm flex items-center space-x-2">
                    <button class="edit-btn text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1 rounded-md hover:bg-blue-50" title="Edit" data-id="${dept.id}" data-name="${dept.name}">
                        <i data-feather="edit" class="w-5 h-5"></i>
                    </button>
                    <button class="delete-btn text-red-600 hover:text-red-800 transition-colors duration-200 p-1 rounded-md hover:bg-red-50" title="Hapus" data-id="${dept.id}" data-name="${dept.name}">
                        <i data-feather="trash-2" class="w-5 h-5"></i>
                    </button>
                </td>
            `;
            departmentTableBody.appendChild(row);
        });
        feather.replace();
        document.querySelectorAll(".edit-btn").forEach((button) => {
            button.addEventListener("click", (e) => openEditModal(e.currentTarget.dataset.id, e.currentTarget.dataset.name));
        });
        document.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", (e) => handleDelete(e.currentTarget.dataset.id, e.currentTarget.dataset.name));
        });
    };

    const updatePaginationControls = (totalFilteredItems) => {
        const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(currentPage * itemsPerPage, totalFilteredItems);

        paginationInfo.textContent = `Displaying ${startIndex}-${endIndex} of ${totalFilteredItems} departments`;

        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    };


    const openEditModal = (departmentId, departmentName) => {
        editDepartmentErrorMessage.classList.add("hidden");
        editDepartmentSuccessMessage.classList.add("hidden");
        editDepartmentId.value = departmentId;
        editDepartmentName.value = departmentName;
        editDepartmentModal.classList.remove("hidden");
        setTimeout(() => editDepartmentModal.classList.add("active"), 10);
    };

    const closeEditModal = () => {
        editDepartmentModal.classList.remove("active");
        setTimeout(() => {
            editDepartmentModal.classList.add("hidden");
            editDepartmentForm.reset();
        }, 300);
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

    const handleDelete = async (departmentId, departmentName) => {
        Swal.fire({
            title: `Delete ${departmentName}?`,
            text: "This action cannot be undone! This department will be permanently deleted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete!",
            cancelButtonText: "Cancel"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await departmentService.deleteDepartment(departmentId);

                    Swal.fire({
                        title: "Deleted!",
                        text: `Department "${departmentName}" successfully deleted.`,
                        icon: "success",
                        timer: 2000,
                        showConfirmButton: false
                    });

                    fetchDepartments();
                } catch (error) {
                    console.error("Failed to delete department:", error);
                    let errorMessage = "An error occurred while deleting the department. Please try again.";
                    if (error.status === 401 || error.status === 403) {
                        errorMessage = "You do not have permission to delete this department.";
                        setTimeout(() => authService.logout(), 2000);
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    Swal.fire({
                        title: "Failed",
                        text: errorMessage,
                        icon: "error",
                        confirmButtonText: "OK"
                    });
                }
            }
        });
    };

    if (editDepartmentForm) {
        editDepartmentForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            editDepartmentErrorMessage.classList.add("hidden");
            editDepartmentSuccessMessage.classList.add("hidden");

            const departmentId = editDepartmentId.value;
            const updatedName = editDepartmentName.value.trim();

            if (!updatedName) {
                showSweetAlert("Validation Failed", "Department name cannot be empty.", "error");
                return;
            }
            try {
                await departmentService.updateDepartment(departmentId, { name: updatedName });
                showSweetAlert("Success!", "Department successfully updated!", "success", false, 1500);
                setTimeout(() => {
                    closeEditModal();
                    fetchDepartments();
                }, 1500);
            } catch (error) {
                console.error("Failed to update department:", error);
                let errorMessage = "An error occurred while updating the department. Please try again.";
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

    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                applyFilterAndRender();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            const totalPages = Math.ceil(filteredDepartmentsData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                applyFilterAndRender();
            }
        });
    }

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearchQuery = searchInput.value;
                currentPage = 1;
                applyFilterAndRender();
            }, 500);
        });
    }

    // Call the function to load admin profile photo in the header
    await loadAdminProfileForHeader(); // Changed to async await
    fetchDepartments();
});