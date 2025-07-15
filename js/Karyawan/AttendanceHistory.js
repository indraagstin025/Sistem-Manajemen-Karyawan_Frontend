// js/Karyawan/AttendanceHistory.js

import AttendanceService from '../Services/AttendanceServices.js';
import { authService } from "../Services/AuthServices.js";
import { userService } from "../Services/UserServices.js"; 
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

// Import komponen modular untuk sidebar dan logout
import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js"; 

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace(); // Inisialisasi ikon Feather

    // --- Inisialisasi Komponen Global ---
    initializeSidebar(); // Mengelola sidebar mobile
    initializeLogout(); // Mengelola semua tombol logout dengan SweetAlert2

    // --- Seleksi Elemen DOM ---
    const attendanceHistoryTableBody = document.getElementById("attendanceHistoryTableBody");
    const attendanceHistoryMessage = document.getElementById("attendanceHistoryMessage");
    const userAvatarNav = document.getElementById("userAvatar");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userDropdownContainer = document.getElementById("userDropdown");

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
            let user = authService.getCurrentUser();
            if (!user || !user.id) {
                return null;
            }
            
            const employeeData = await userService.getUserByID(user.id); 
            if (employeeData && userAvatarNav) {
               userAvatarNav.src = employeeData.photo || "https://via.placeholder.com/40x40/E2E8F0/4A5568?text=ME";
                userAvatarNav.alt = employeeData.name;
            }
            return employeeData;
        } catch (error) {
            console.error("Error fetching employee profile data for header:", error);
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
            const currentUser = authService.getCurrentUser();
            if (!currentUser || currentUser.role !== 'karyawan') {
                showToast("Akses ditolak. Anda tidak memiliki izin untuk melihat halaman ini.", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }
            
            let fetchedData = await AttendanceService.getMyHistory(); 
            if (!Array.isArray(fetchedData)) {
                console.warn("Peringatan: API /attendance/my-history tidak mengembalikan array. Menerima:", fetchedData);
                fetchedData = []; 
                showToast("Peringatan: Format data riwayat absensi tidak valid dari server.", "info"); 
            }
            allAttendanceData = fetchedData;
            allAttendanceData.sort((a, b) => new Date(b.date) - new Date(a.date)); 

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
            if (error.status === 401 || error.status === 403) {
                setTimeout(() => authService.logout(), 2000);
            }
        }
    };

    // --- Fungsi untuk merender tabel absensi per halaman ---
    const renderAttendanceTable = (data, page, limit) => {
        attendanceHistoryTableBody.innerHTML = ''; 
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = data.slice(startIndex, endIndex);

        paginatedItems.forEach(attendance => {
            const row = attendanceHistoryTableBody.insertRow();
            
            const date = new Date(attendance.date + 'T00:00:00'); 
            const formattedDate = date.toLocaleDateString('id-ID', { 
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

    // --- Event Listeners UI Umum (Dropdown Navigasi Pengguna) ---
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

    // --- Inisialisasi Halaman ---
    fetchEmployeeProfileDataForHeader(); // Muat data profil untuk avatar di header
    loadAttendanceHistory(); // Muat riwayat absensi
});