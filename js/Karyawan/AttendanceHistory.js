// js/Karyawan/AttendanceHistory.js

import AttendanceService from '../Services/AttendanceServices.js';
import { authService } from "../Services/AuthServices.js";
import { userService } from "../Services/UserServices.js"; // Diperlukan untuk profil avatar di header
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace(); // Inisialisasi ikon Feather

    // --- Seleksi Elemen DOM ---
    const attendanceHistoryTableBody = document.getElementById("attendanceHistoryTableBody");
    const attendanceHistoryMessage = document.getElementById("attendanceHistoryMessage");
    const userAvatarNav = document.getElementById("userAvatar");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userDropdownContainer = document.getElementById("userDropdown");

    // Tombol Logout
    const allLogoutButtons = document.querySelectorAll("#logoutButton, #dropdownLogoutButton, #mobileLogoutButton");

    // Sidebar Mobile
    const sidebarToggle = document.getElementById("sidebarToggle");
    const mobileSidebar = document.getElementById("mobileSidebar");
    const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
    const closeSidebar = document.getElementById("closeSidebar");

    // Change Password Modal elements (disalin dari EmployeeDashboard.js)
    const changePasswordModal = document.getElementById("changePasswordModal");
    const openChangePasswordModalBtn = document.getElementById("openChangePasswordModalBtn");
    const closeChangePasswordModalBtn = document.getElementById("closeChangePasswordModalBtn");
    const cancelChangePasswordBtn = document.getElementById("cancelChangePasswordBtn");
    const changePasswordForm = document.getElementById("changePasswordForm");
    const oldPasswordInput = document.getElementById("oldPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
    const changePasswordErrorMessage = document.getElementById("changePasswordErrorMessage");
    const changePasswordSuccessMessage = document.getElementById("changePasswordSuccessMessage");

    // Elemen Paginasi
    const paginationControls = document.getElementById('paginationControls');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageInfo = document.getElementById('currentPageInfo');

    let currentPage = 1;
    const itemsPerPage = 10; // Jumlah item per halaman
    let allAttendanceData = []; // Untuk menyimpan seluruh data absensi

    // --- Fungsi Utilitas (showToast) ---
    const showToast = (message, type = "success") => {
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
            stopOnFocus: true,
            style: {
                background: backgroundColor,
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                padding: "12px 20px"
            },
        }).showToast();
    };

    // --- Fungsi untuk memuat data profil karyawan (untuk avatar di header) ---
    const fetchEmployeeProfileDataForHeader = async () => {
        try {
            // Tidak perlu mendapatkan 'token' secara terpisah lagi di sini
            let user = authService.getCurrentUser();
            if (!user || !user.id) { // Pastikan user ada dan memiliki ID
                // Jika tidak ada user atau ID, ini akan ditangani oleh loadAttendanceHistory
                // atau redirect oleh interceptor jika token expired
                return null;
            }
            // Parameter 'token' dihapus karena sudah di-handle oleh interceptor apiClient
            const employeeData = await userService.getUserByID(user.id); 
            if (employeeData && userAvatarNav) {
                // Ganti placehold.co dengan via.placeholder.com atau URL lokal yang valid
               userAvatarNav.src = employeeData.photo || "https://via.placeholder.com/40x40/E2E8F0/4A5568?text=ME";
                userAvatarNav.alt = employeeData.name;
            }
            return employeeData;
        } catch (error) {
            console.error("Error fetching employee profile data for header:", error);
            // Tangani error Unauthorized/Forbidden dari interceptor
            if (error.status === 401 || error.status === 403) {
                showToast("Sesi tidak valid. Mengarahkan ke halaman login...", "error");
                setTimeout(() => authService.logout(), 2000);
            } else {
                showToast(error.message || "Gagal memuat data profil header.", "error");
            }
            return null;
        }
    };


    // --- Fungsi untuk memuat dan menampilkan riwayat absensi ---
    const loadAttendanceHistory = async () => {
        attendanceHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">Memuat riwayat absensi...</td>
            </tr>
        `;
        attendanceHistoryMessage.classList.add('hidden');
        paginationControls.classList.add('hidden'); // Sembunyikan paginasi saat memuat

        try {
            // Pengecekan user dan token yang lebih ringkas
            const currentUser = authService.getCurrentUser();
            if (!currentUser || currentUser.role !== 'karyawan') {
                showToast("Akses ditolak. Anda tidak memiliki izin untuk melihat halaman ini.", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }

            // allAttendanceData = await AttendanceService.getMyHistory(); // Ini sudah benar
            // allAttendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));

            // >>>>>> KODE UNTUK MENGATASI ERROR NULL/SORT (SAMA SEPERTI REQUEST_LEAVE.JS) <<<<<<
            let fetchedData = await AttendanceService.getMyHistory(); 
            // Pastikan fetchedData adalah array. Jika bukan, set menjadi array kosong.
            if (!Array.isArray(fetchedData)) {
                console.warn("Peringatan: API /attendance/my-history tidak mengembalikan array. Menerima:", fetchedData);
                fetchedData = []; // Set menjadi array kosong untuk mencegah error sort
                showToast("Peringatan: Format data riwayat absensi tidak valid dari server.", "info"); 
            }
            allAttendanceData = fetchedData;
            allAttendanceData.sort((a, b) => new Date(b.date) - new Date(a.date)); // Urutkan dari terbaru
            // >>>>>> AKHIR KODE UNTUK MENGATASI ERROR NULL/SORT <<<<<<


            if (allAttendanceData.length === 0) {
                attendanceHistoryTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">Tidak ada riwayat absensi yang ditemukan.</td>
                    </tr>
                `;
                attendanceHistoryMessage.textContent = 'Anda belum memiliki riwayat absensi.';
                attendanceHistoryMessage.classList.remove('hidden');
                attendanceHistoryMessage.classList.add('info');
            } else {
                renderAttendanceTable(allAttendanceData, currentPage, itemsPerPage);
                updatePaginationControls(allAttendanceData.length, currentPage, itemsPerPage);
                if (allAttendanceData.length > itemsPerPage) {
                    paginationControls.classList.remove('hidden');
                }
            }

        } catch (error) {
            console.error("Error loading attendance history:", error);
            attendanceHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-red-500">Gagal memuat riwayat absensi: ${error.message}</td>
                </tr>
            `;
            showToast(error.message || "Gagal memuat riwayat absensi.", "error");
            // Perbarui kondisi error untuk redirect logout (gunakan error.status dari interceptor)
            if (error.status === 401 || error.status === 403) {
                setTimeout(() => authService.logout(), 2000);
            }
        }
    };

    // --- Fungsi untuk merender tabel absensi per halaman ---
    const renderAttendanceTable = (data, page, limit) => {
        attendanceHistoryTableBody.innerHTML = ''; // Kosongkan tabel
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = data.slice(startIndex, endIndex);

        paginatedItems.forEach(attendance => {
            const row = attendanceHistoryTableBody.insertRow();
            
        const date = new Date(attendance.date + 'T00:00:00'); 
        const formattedDate = date.toLocaleDateString('id-ID', { // <-- PASTIKAN BARIS INI ADA DAN TIDAK DIKOMENTARI
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let statusDisplayText = attendance.status || '-';
        let statusClass = 'text-gray-700';


            switch (attendance.status) {
                case 'Hadir':
                    statusClass = 'text-green-600 font-semibold';
                    break;
                case 'Telat':
                    statusClass = 'text-orange-600 font-semibold';
                    break;
                case 'Izin':
                    statusClass = 'text-purple-600 font-semibold';
                    if (attendance.note) { statusDisplayText = `Izin (${attendance.note})`; }
                    break;
                case 'Sakit':
                    statusClass = 'text-red-600 font-semibold';
                    if (attendance.note) { statusDisplayText = `Sakit (${attendance.note})`; }
                    break;
                case 'Cuti':
                    statusClass = 'text-blue-600 font-semibold';
                    if (attendance.note) { statusDisplayText = `Cuti (${attendance.note})`; }
                    break;
                case 'Alpha':
                    statusClass = 'text-gray-500 font-semibold';
                    if (attendance.note) { statusDisplayText = `Alpha (${attendance.note})`; }
                    break;
                default:
                    statusClass = 'text-gray-900';
            }

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formattedDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${attendance.check_in || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${attendance.check_out || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">${statusDisplayText}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${attendance.note || '-'}</td>
            `;
        });
    };

    // --- Fungsi untuk memperbarui kontrol paginasi ---
    const updatePaginationControls = (totalItems, currentPage, itemsPerPage) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        currentPageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;

        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

        if (totalItems > itemsPerPage) {
            paginationControls.classList.remove('hidden');
        } else {
            paginationControls.classList.add('hidden');
        }
    };

    // --- Event Listener Paginasi ---
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderAttendanceTable(allAttendanceData, currentPage, itemsPerPage);
                updatePaginationControls(allAttendanceData.length, currentPage, itemsPerPage);
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allAttendanceData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderAttendanceTable(allAttendanceData, currentPage, itemsPerPage);
                updatePaginationControls(allAttendanceData.length, currentPage, itemsPerPage);
            }
        });
    }


    // --- Change Password Modal Logic (disalin dari EmployeeDashboard.js) ---
    const resetChangePasswordForm = () => {
        changePasswordForm.reset();
        changePasswordErrorMessage.classList.add("hidden");
        changePasswordSuccessMessage.classList.add("hidden");
        changePasswordErrorMessage.textContent = "";
        changePasswordSuccessMessage.textContent = "";
    };

    if (openChangePasswordModalBtn) {
        openChangePasswordModalBtn.addEventListener("click", (event) => {
            event.preventDefault();
            resetChangePasswordForm();
            changePasswordModal.classList.remove("hidden");
            setTimeout(() => changePasswordModal.classList.add("active"), 10);
            if (dropdownMenu) dropdownMenu.classList.remove("active");
        });
    }

    if (closeChangePasswordModalBtn) {
        closeChangePasswordModalBtn.addEventListener("click", () => {
            changePasswordModal.classList.remove("active");
            setTimeout(() => changePasswordModal.classList.add("hidden"), 300);
        });
    }

    if (cancelChangePasswordBtn) {
        cancelChangePasswordBtn.addEventListener("click", () => {
            changePasswordModal.classList.remove("active");
            setTimeout(() => changePasswordModal.classList.add("hidden"), 300);
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            changePasswordErrorMessage.classList.add("hidden");
            changePasswordSuccessMessage.classList.add("hidden");
            changePasswordErrorMessage.textContent = "";
            changePasswordSuccessMessage.textContent = "";

            const oldPassword = oldPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;

            if (newPassword !== confirmNewPassword) {
                changePasswordErrorMessage.textContent = "Password baru dan konfirmasi password tidak cocok.";
                changePasswordErrorMessage.classList.remove("hidden");
                return;
            }

            if (newPassword.length < 6) {
                changePasswordErrorMessage.textContent = "Password baru minimal 6 karakter.";
                changePasswordErrorMessage.classList.remove("hidden");
                return;
            }

            const currentUser = authService.getCurrentUser();
            if (!currentUser || !currentUser.id) { // Tidak perlu lagi cek localStorage.getItem('token')
                showToast("Sesi tidak valid. Harap login kembali.", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }
            // const token = localStorage.getItem('token'); // <<-- Hapus ini, tidak lagi diperlukan

            try {
                // Parameter 'token' dihapus
                await authService.changePassword(oldPassword, newPassword); 
                changePasswordSuccessMessage.textContent = "Password berhasil diubah!";
                changePasswordSuccessMessage.classList.remove("hidden");
                showToast("Password berhasil diubah!", "success");

                setTimeout(() => {
                    changePasswordModal.classList.remove("active");
                    setTimeout(() => changePasswordModal.classList.add("hidden"), 300);
                }, 1500);

            } catch (error) {
                console.error("Error changing password:", error);
                const errorMessage = error.message || "Gagal mengubah password. Silakan coba lagi.";
                changePasswordErrorMessage.textContent = errorMessage;
                changePasswordErrorMessage.classList.remove("hidden");
                showToast(errorMessage, "error");
            }
        });
    }


    // --- Event Listeners UI Umum ---
    if (userDropdownContainer) {
        userDropdownContainer.addEventListener("click", () => {
            dropdownMenu.classList.toggle("active");
        });
        document.addEventListener("click", (event) => {
            if (!userDropdownContainer.contains(event.target)) {
                dropdownMenu.classList.remove("active");
            }
        });
    }

    allLogoutButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            showLogoutConfirmation();
        });
    });

    // Logika Sidebar Mobile
    if (sidebarToggle && mobileSidebar && mobileSidebarPanel && closeSidebar) {
        const showMobileSidebar = () => {
            mobileSidebar.classList.remove("hidden");
            setTimeout(() => {
                mobileSidebar.classList.add("opacity-100");
                mobileSidebarPanel.classList.remove("-translate-x-full");
            }, 10);
        };
        const hideMobileSidebar = () => {
            mobileSidebar.classList.remove("opacity-100");
            mobileSidebarPanel.classList.add("-translate-x-full");
            setTimeout(() => mobileSidebar.classList.add("hidden"), 300);
        };
        sidebarToggle.addEventListener("click", showMobileSidebar);
        closeSidebar.addEventListener("click", hideMobileSidebar);
        mobileSidebar.addEventListener("click", (event) => {
            if (event.target === mobileSidebar) hideMobileSidebar();
        });
    }

    const showLogoutConfirmation = () => {
        const toastNode = document.createElement("div");
        toastNode.className = "flex flex-col items-center p-2";
        toastNode.innerHTML = `
            <p class="font-semibold text-white text-base mb-4">Anda yakin ingin keluar?</p>
            <div class="flex space-x-3">
                <button id="confirmLogoutBtn" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700">Ya, Keluar</button>
                <button id="cancelLogoutBtn" class="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600">Batal</button>
            </div>
        `;
        const toast = Toastify({ 
            node: toastNode, 
            duration: -1, 
            gravity: "top", 
            position: "center", 
            close: true, 
            style: { 
                background: "linear-gradient(to right, #4f46e5, #7c3aed)", 
                borderRadius: "12px",
                padding: "1rem" 
            } 
        }).showToast();

        toastNode.querySelector("#confirmLogoutBtn").addEventListener("click", () => {
            authService.logout();
            toast.hideToast();
        });
        toastNode.querySelector("#cancelLogoutBtn").addEventListener("click", () => {
            toast.hideToast();
        });
    };

    // --- Inisialisasi Halaman ---
    fetchEmployeeProfileDataForHeader(); // Muat data profil untuk avatar di header
    loadAttendanceHistory(); // Muat riwayat absensi
});