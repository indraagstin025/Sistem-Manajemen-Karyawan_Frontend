import { userService } from "../Services/UserServices.js";
import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeSidebar } from "../components/sidebarHandler.js"; 
import { initializeLogout } from "../components/logoutHandler.js";
import { QRCodeManager } from "../components/qrCodeHandler.js"; 
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js";

import Swal from 'sweetalert2'; 
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

document.addEventListener("DOMContentLoaded", async () => {
   
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
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            }
        });
    };

    const loadUserProfile = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user && user.photo_url && userAvatarNav) {
                userAvatarNav.src = user.photo_url;
            } else if (userAvatarNav) {
                userAvatarNav.src = "/assets/default-avatar.png"; 
            }
        } catch (error) {
            console.error("Gagal memuat profil pengguna:", error);
            if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
        }
    };

    const loadDepartmentsToEditModal = async () => {
        try {
            const departments = await departmentService.getAllDepartments();
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
            showSweetAlert('Error', 'Gagal memuat daftar departemen. Silakan coba lagi.', 'error', true);
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
                setTimeout(() => authService.logout(), 2000);
            } else if (error.message) {
                errorMessage = error.message;
            }
            showSweetAlert('Error Data', errorMessage, 'error', true);
        }
    };

    const renderEmployees = async (employees) => {
        employeeTableBody.innerHTML = "";

        for (const employee of employees) {
            const row = document.createElement("tr");
            row.className = "border-b border-gray-100 hover:bg-gray-50";

            let photoUrl = "/assets/default-avatar.png";
            try {
                photoUrl = await getUserPhotoBlobUrl(employee.id, employee.name, 48);
            } catch (error) {
                console.warn(`Gagal memuat foto untuk user ${employee.name}:`, error);
                const initial = employee.name ? employee.name.charAt(0).toUpperCase() : '?';
                photoUrl = `https://placehold.co/48x48/E2E8F0/4A5568?text=${initial}`;
            }

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
        
        paginationInfo.textContent = `Menampilkan ${startIndex}-${endIndex} dari ${total} karyawan`;

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
                showSweetAlert("Data Tidak Ditemukan", "Data karyawan tidak ditemukan.", "error");
            }
        } catch (error) {
            console.error("Gagal mengambil data karyawan untuk edit:", error);
            showSweetAlert(`Gagal Memuat Data`, `Gagal memuat data edit: ${error.message || "Terjadi kesalahan"}`, "error", true);
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
                showModalMessage("Gaji pokok harus berupa angka yang valid.", "error", editErrorMessageDiv, editSuccessMessageDiv);
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
                console.log("Karyawan berhasil diupdate:", response);

                showSweetAlert("Berhasil!", "Karyawan berhasil diupdate!", "success", false, 1500);

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
                showSweetAlert("Gagal Update", errorMessage, "error", true);
                if (error.status === 401 || error.status === 403) {
                    setTimeout(() => authService.logout(), 2000);
                }
            }
        });
    }

    const handleDelete = async (employeeId, employeeName) => {
        Swal.fire({
            title: `Hapus ${employeeName}?`,
            text: "Tindakan ini tidak dapat dibatalkan! Data karyawan akan dihapus secara permanen.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, hapus!",
            cancelButtonText: "Batal"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await userService.deleteUser(employeeId);
                    console.log("Karyawan berhasil dihapus:", response);

                    Swal.fire({
                        title: "Terhapus!",
                        text: `Karyawan "${employeeName}" berhasil dihapus.`,
                        icon: "success",
                        timer: 2000,
                        showConfirmButton: false
                    });

                    fetchEmployees();
                } catch (error) {
                    console.error("Gagal menghapus karyawan:", error);
                    let errorMessage = "Terjadi kesalahan saat menghapus karyawan. Silakan coba lagi.";
                    if (error.status === 401 || error.status === 403) {
                        errorMessage = "Anda tidak memiliki izin untuk menghapus karyawan ini.";
                        setTimeout(() => authService.logout(), 2000);
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    Swal.fire({
                        title: "Gagal",
                        text: errorMessage,
                        icon: "error",
                        confirmButtonText: "OK"
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