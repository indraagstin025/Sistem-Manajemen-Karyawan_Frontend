// src/js/Admin/ManageEmployees.js 
// Asumsi path ini adalah yang benar, bukan js/Karyawan/ManageEmployees.js

import { userService } from "../Services/UserServices.js";
import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeSidebar } from "../components/sidebarHandler.js"; 
import { initializeLogout } from "../components/logoutHandler.js";
import { QRCodeManager } from "../components/qrCodeHandler.js"; // Import QRCodeManager
// import { getUserPhotoBlobUrl } from "../utils/photoUtils.js"; // Sepertinya logic ini sudah ada di renderEmployees
// Import SweetAlert2 (sudah ada)
import Swal from 'sweetalert2'; 
// Import Toastify jika masih ingin menggunakannya untuk notifikasi spesifik
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

document.addEventListener("DOMContentLoaded", async () => {
    // Inisialisasi komponen global
    initializeSidebar(); 
    // Inisialisasi logout dengan callback untuk menutup modal QR jika terbuka
    initializeLogout({
        preLogoutCallback: () => {
            // Asumsi QRCodeManager memiliki method close()
            if (typeof QRCodeManager !== 'undefined' && QRCodeManager.close) {
                QRCodeManager.close();
            }
        }
    });

    // Inisialisasi QRCodeManager jika tombol generate QR ada di halaman ini
    QRCodeManager.initialize({
        toastCallback: (message, type) => {
            // Gunakan Toastify untuk pesan QR code jika diinginkan, atau SweetAlert2
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
                position: "right", // Atau "center" jika ingin di tengah
                style: { background: backgroundColor, borderRadius: "8px" },
            }).showToast();
        },
    });

    // feather.replace(); // Umumnya dipanggil di initializeSidebar, tapi bisa juga di sini jika ada ikon di luar sidebar/header

    // --- Seleksi Elemen DOM ---
    const employeeTableBody = document.getElementById("employeeTableBody");
    const loadingMessage = document.getElementById("loadingMessage");
    const employeeListError = document.getElementById("employeeListError");
    const employeeListSuccess = document.getElementById("employeeListSuccess");
    const paginationInfo = document.getElementById("paginationInfo");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const searchInput = document.getElementById("searchInput");

    // Elemen modal edit
    const editEmployeeModal = document.getElementById("editEmployeeModal");
    const closeEditEmployeeModalBtn = document.getElementById("closeEditEmployeeModalBtn");
    const cancelEditEmployeeBtn = document.getElementById("cancelEditEmployeeBtn");
    const editEmployeeForm = document.getElementById("editEmployeeForm");
    const editErrorMessageDiv = document.getElementById("editErrorMessage");
    const editSuccessMessageDiv = document.getElementById("editSuccessMessage");

    // Input form edit
    const editEmployeeId = document.getElementById("editEmployeeId");
    const editName = document.getElementById("editName");
    const editEmail = document.getElementById("editEmail");
    const editPosition = document.getElementById("editPosition");
    const editDepartment = document.getElementById("editDepartment");
    const editBaseSalary = document.getElementById("editBaseSalary");
    const editAddress = document.getElementById("editAddress");

    // Dropdown pengguna di header (untuk menampilkan foto profil)
    const userAvatarNav = document.getElementById("userAvatar");
    const userDropdownContainer = document.getElementById("userDropdown"); // Container dropdown (untuk click event)
    const dropdownMenu = document.getElementById("dropdownMenu"); // Menu dropdown itu sendiri

    let currentPage = 1;
    const itemsPerPage = 10;
    let currentSearch = "";
    let currentRoleFilter = ""; // Jika ada filter role di masa depan, ini bisa digunakan
    let allDepartments = []; // Cache departemen

    // --- Fungsi Notifikasi (SweetAlert2 untuk pesan penting) ---
    // Mengganti showGlobalMessage dan showModalMessage dengan satu fungsi SweetAlert2 yang fleksibel
    const showSweetAlert = (title, message, icon = "success", showConfirmButton = false, timer = 2000) => {
        Swal.fire({
            title: title,
            html: message, // Gunakan html agar bisa menerima <br>
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
                // Gunakan default avatar yang sudah ada di HTML
                userAvatarNav.src = "/assets/default-avatar.png"; 
            }
        } catch (error) {
            console.error("Gagal memuat profil pengguna:", error);
            if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
        }
    };

    // Fungsi untuk memuat daftar departemen ke modal edit
    const loadDepartmentsToEditModal = async () => {
        try {
            const departments = await departmentService.getAllDepartments();
            allDepartments = departments; // Cache departemen

            editDepartment.innerHTML = '<option value="">Pilih Departemen</option>';

            if (Array.isArray(allDepartments)) {
                allDepartments.forEach(dept => {
                    const option = document.createElement("option");
                    option.value = dept.name; // Asumsi value adalah nama departemen
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

    // Fungsi untuk memuat data karyawan
    const fetchEmployees = async () => {
        employeeTableBody.innerHTML = "";
        loadingMessage.classList.remove("hidden");
        employeeListError.classList.add("hidden"); // Sembunyikan pesan error sebelumnya
        employeeListSuccess.classList.add("hidden"); // Sembunyikan pesan sukses sebelumnya

        try {
            const data = await userService.getAllUsers(currentPage, itemsPerPage, currentSearch, currentRoleFilter);

            loadingMessage.classList.add("hidden");

            if (data.data && data.data.length > 0) {
                await renderEmployees(data.data); // Gunakan await di sini
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

    // Fungsi untuk merender baris karyawan
    const renderEmployees = async (employees) => {
        employeeTableBody.innerHTML = "";

        for (const employee of employees) {
            const row = document.createElement("tr");
            row.className = "border-b border-gray-100 hover:bg-gray-50"; // Tambahkan hover effect

            // Handle photo URL
            let photoUrl = "/assets/default-avatar.png"; // Default placeholder
            try {
                // Asumsi getUserPhotoBlobUrl mengembalikan URL objek blob atau null jika gagal/tidak ada
                const userPhotoBlobUrl = await userService.getProfilePhoto(employee.id); 
                if (userPhotoBlobUrl) {
                    photoUrl = userPhotoBlobUrl;
                } else {
                    // Fallback to placeholder if no photo or error
                    const initial = employee.name ? employee.name.charAt(0).toUpperCase() : '?';
                    photoUrl = `https://placehold.co/48x48/E2E8F0/4A5568?text=${initial}`;
                }
            } catch (error) {
                console.warn(`Gagal memuat foto untuk user ${employee.name}:`, error, `menggunakan placeholder.`);
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

        // Pastikan feather.replace() dipanggil setelah semua ikon baru ditambahkan
        feather.replace();

        document.querySelectorAll(".edit-btn").forEach((button) => {
            button.addEventListener("click", (e) => openEditModal(e.currentTarget.dataset.id));
        });
        document.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", (e) => handleDelete(e.currentTarget.dataset.id, e.currentTarget.dataset.name));
        });
    };

    // Fungsi untuk memperbarui paginasi
    const updatePagination = (total, page, limit) => {
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit + 1;
        const endIndex = Math.min(page * limit, total);
        
        paginationInfo.textContent = `Menampilkan ${startIndex}-${endIndex} dari ${total} karyawan`;

        prevPageBtn.disabled = page === 1;
        nextPageBtn.disabled = page >= totalPages; // Gunakan totalPages untuk nextPageBtn
    };

    // Fungsi untuk membuka modal edit
    const openEditModal = async (employeeId) => {
        // Reset pesan error/sukses di modal
        editErrorMessageDiv.classList.add("hidden");
        editSuccessMessageDiv.classList.add("hidden");
        editErrorMessageDiv.textContent = "";
        editSuccessMessageDiv.textContent = "";

        // Muat departemen jika belum dimuat
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
                
                // Tampilkan modal dengan class "active" untuk transisi CSS
                editEmployeeModal.classList.remove("hidden");
                setTimeout(() => editEmployeeModal.classList.add("active"), 10); // Memberi waktu agar transisi bekerja
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

    // Fungsi untuk menutup modal edit
    const closeEditModal = () => {
        editEmployeeModal.classList.remove("active");
        setTimeout(() => {
            editEmployeeModal.classList.add("hidden");
            editEmployeeForm.reset();
        }, 300); // Sesuaikan dengan durasi transisi CSS
    };

    // Event listeners untuk tombol tutup modal edit dan overlay
    if (closeEditEmployeeModalBtn) closeEditEmployeeModalBtn.addEventListener("click", closeEditModal);
    if (cancelEditEmployeeBtn) cancelEditEmployeeBtn.addEventListener("click", closeEditModal);
    if (editEmployeeModal) {
        editEmployeeModal.addEventListener("click", (event) => {
            if (event.target === editEmployeeModal) { // Jika klik pada overlay
                closeEditModal();
            }
        });
    }

    // Event listener untuk submit form edit
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

            // Hapus field yang tidak relevan untuk update
            delete updatedData.id;
            // delete updatedData.password; // Password tidak diupdate dari sini
            // delete updatedData.role; // Role tidak diupdate dari sini
            // delete updatedData.photo_file; // Photo tidak diupdate dari sini

            updatedData.base_salary = parseFloat(updatedData.base_salary);
            if (isNaN(updatedData.base_salary)) {
                showModalMessage("Gaji pokok harus berupa angka yang valid.", "error", editErrorMessageDiv, editSuccessMessageDiv);
                return;
            }
            
            // Perbaikan: Hapus atribut `name` dari `editEmail` jika backend hanya menerima `email`
            // dan tidak ada validasi email di frontend.
            // Jika backend memvalidasi, pastikan `email` dikirim dengan benar.
            // Untuk memastikan hanya data yang valid dan relevan yang dikirim
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
                    fetchEmployees(); // Muat ulang daftar karyawan setelah update
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

    // Fungsi untuk menghapus karyawan
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

                    fetchEmployees(); // Muat ulang daftar karyawan setelah penghapusan
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

    // Event listeners untuk paginasi
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

    // Event listener untuk search input
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = searchInput.value;
                currentPage = 1; // Reset halaman ke 1 saat pencarian baru
                fetchEmployees();
            }, 500); // Debounce 500ms
        });
    }

    // --- Inisialisasi Halaman ---
    // Memuat foto profil pengguna di header
    loadUserProfile();
    // Memuat daftar karyawan pertama kali
    fetchEmployees();
});