// js/Admin/ManageDepartments.js

import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeSidebar } from "../components/sidebarHandler.js"; // Import fungsi sidebar
import { initializeLogout } from "../components/logoutHandler.js"; // Import fungsi logout
import { QRCodeManager } from "../components/qrCodeHandler.js"; // Import QRCodeManager
import { initTheme } from "../utils/darkmode.js";
import Swal from 'sweetalert2'; // Import SweetAlert2
import Toastify from 'toastify-js'; // Import Toastify jika masih digunakan oleh QRCodeManager


document.addEventListener("DOMContentLoaded", async () => {
    // Inisialisasi komponen global
    feather.replace(); // Memastikan Feather Icons dirender di seluruh halaman
    initializeSidebar(); // Menginisialisasi fungsionalitas sidebar mobile
    initTheme();
    initializeLogout({ // Menginisialisasi semua tombol logout
    
        preLogoutCallback: () => {
            // Callback opsional untuk menutup modal QR sebelum logout
            if (typeof QRCodeManager !== 'undefined' && QRCodeManager.close) {
                QRCodeManager.close();
            }
        }
    });

    // Menginisialisasi QRCodeManager jika tombol generate QR ada di halaman ini
    QRCodeManager.initialize({
        toastCallback: (message, type) => {
            // Fungsi callback untuk menampilkan notifikasi dari QRCodeManager menggunakan Toastify
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
                position: "right", // Posisi notifikasi Toastify
                style: { background: backgroundColor, borderRadius: "8px" },
            }).showToast();
        },
    });

    // --- Seleksi Elemen DOM ---
    const departmentTableBody = document.getElementById("departmentTableBody");
    const loadingMessage = document.getElementById("loadingMessage");
    const departmentListError = document.getElementById("departmentListError");
    const departmentListSuccess = document.getElementById("departmentListSuccess");
    const paginationInfo = document.getElementById("paginationInfo");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const searchInput = document.getElementById("searchInput");

    // Elemen modal edit
    const editDepartmentModal = document.getElementById("editDepartmentModal");
    const closeEditDepartmentModalBtn = document.getElementById("closeEditDepartmentModalBtn");
    const cancelEditDepartmentBtn = document.getElementById("cancelEditDepartmentBtn");
    const editDepartmentForm = document.getElementById("editDepartmentForm");
    const editDepartmentErrorMessage = document.getElementById("editDepartmentErrorMessage");
    const editDepartmentSuccessMessage = document.getElementById("editDepartmentSuccessMessage");

    // Input form edit
    const editDepartmentId = document.getElementById("editDepartmentId");
    const editDepartmentName = document.getElementById("editDepartmentName");

    // Dropdown pengguna di header (untuk menampilkan foto profil) - ID yang sama dengan admin_dashboard
    const userAvatarNav = document.getElementById("userAvatar");
    const userDropdownContainer = document.getElementById("userDropdown"); 
    const dropdownMenu = document.getElementById("dropdownMenu"); 

    let currentPage = 1;
    const itemsPerPage = 10; // Mendefinisikan item per halaman untuk paginasi sisi klien
    let allDepartmentsData = []; // Untuk menyimpan semua data departemen yang diambil
    let filteredDepartmentsData = []; // Untuk menyimpan data departemen yang sudah difilter/dicari
    let currentSearchQuery = ""; // Menyimpan query pencarian saat ini


    // --- Fungsi Notifikasi (SweetAlert2 untuk pesan penting) ---
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

    // Fungsi untuk memuat foto profil admin di header
    const loadUserProfile = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user && user.photo_url && userAvatarNav) {
                userAvatarNav.src = user.photo_url;
            } else if (userAvatarNav) {
                // Menggunakan default avatar yang sudah ada di HTML
                userAvatarNav.src = "/assets/default-avatar.png"; 
            }
        } catch (error) {
            console.error("Gagal memuat profil pengguna:", error);
            if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
        }
    };


    const fetchDepartments = async () => {
        departmentTableBody.innerHTML = "";
        loadingMessage.classList.remove("hidden");
        departmentListError.classList.add("hidden"); 
        departmentListSuccess.classList.add("hidden"); 

        try {
            // Memanggil getAllDepartments tanpa token, asumsikan authService/interceptor mengelola
            const departments = await departmentService.getAllDepartments(); 
            loadingMessage.classList.add("hidden");

            if (!Array.isArray(departments)) {
                console.warn("Peringatan: API tidak mengembalikan array departemen. Menerima:", departments);
                allDepartmentsData = []; // Pastikan ini adalah array
            } else {
                allDepartmentsData = departments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Urutkan
            }
            
            applyFilterAndRender(); // Terapkan filter dan render

        } catch (error) {
            loadingMessage.classList.add("hidden");
            let errorMessage = "Gagal memuat data departemen.";
            if (error.status === 401 || error.status === 403) {
                errorMessage = "Sesi Anda berakhir atau Anda tidak memiliki izin. Silakan login kembali.";
                setTimeout(() => authService.logout(), 2000);
            } else if (error.message) {
                errorMessage = error.message;
            }
            showSweetAlert('Error Data', errorMessage, 'error', true);
        }
    };

    const applyFilterAndRender = () => {
        // Filter berdasarkan pencarian
        filteredDepartmentsData = allDepartmentsData.filter(dept => 
            dept.name.toLowerCase().includes(currentSearchQuery.toLowerCase())
        );

        // Jika tidak ada hasil setelah filter
        if (filteredDepartmentsData.length === 0) {
            departmentTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">Tidak ada data departemen yang ditemukan.</td></tr>';
            paginationInfo.textContent = "Menampilkan 0 dari 0 departemen";
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
        
        paginationInfo.textContent = `Menampilkan ${startIndex}-${endIndex} dari ${totalFilteredItems} departemen`;

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
            title: `Hapus ${departmentName}?`,
            text: "Tindakan ini tidak dapat dibatalkan! Departemen ini akan dihapus secara permanen.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, hapus!",
            cancelButtonText: "Batal"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await departmentService.deleteDepartment(departmentId); 
                    
                    Swal.fire({
                        title: "Terhapus!",
                        text: `Departemen "${departmentName}" berhasil dihapus.`,
                        icon: "success",
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    fetchDepartments(); 
                } catch (error) {
                    console.error("Gagal menghapus departemen:", error);
                    let errorMessage = "Terjadi kesalahan saat menghapus departemen. Silakan coba lagi.";
                    if (error.status === 401 || error.status === 403) {
                        errorMessage = "Anda tidak memiliki izin untuk menghapus departemen ini.";
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

    if (editDepartmentForm) {
        editDepartmentForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            editDepartmentErrorMessage.classList.add("hidden");
            editDepartmentSuccessMessage.classList.add("hidden");

            const departmentId = editDepartmentId.value;
            const updatedName = editDepartmentName.value.trim();

            if (!updatedName) {
                showSweetAlert("Validasi Gagal", "Nama departemen tidak boleh kosong.", "error");
                return;
            }
            try {
                await departmentService.updateDepartment(departmentId, { name: updatedName });
                showSweetAlert("Berhasil!", "Departemen berhasil diupdate!", "success", false, 1500);
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
                showSweetAlert("Gagal Update", errorMessage, "error", true);
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

    loadUserProfile();
    fetchDepartments();
});