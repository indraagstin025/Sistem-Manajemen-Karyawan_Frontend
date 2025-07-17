import AttendanceService from '../Services/AttendanceServices.js';
import { authService } from "../Services/AuthServices.js";
import { userService } from "../Services/UserServices.js"; 
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js"; 
// ✨ IMPORT BARU ✨
import { getUserPhotoBlobUrl } from '../utils/photoUtils.js';

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace();

    initializeSidebar();
    initializeLogout();

    const attendanceHistoryTableBody = document.getElementById("attendanceHistoryTableBody");
    const attendanceHistoryMessage = document.getElementById("attendanceHistoryMessage");
    const userAvatarNav = document.getElementById("userAvatar");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userDropdownContainer = document.getElementById("userDropdown");

    const paginationControls = document.getElementById('paginationControls');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageInfo = document.getElementById('currentPageInfo');

    let currentPage = 1;
    const itemsPerPage = 10;
    let allAttendanceData = [];

    const showToast = (message, type = "success") => {
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
            stopOnFocus: true,
            style: {
                background: backgroundColor,
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                padding: "12px 20px"
            },
        }).showToast();
    };

    // ✨ FUNGSI fetchEmployeeProfileDataForHeader Disesuaikan untuk menggunakan photoUtils.js ✨
    const fetchEmployeeProfileDataForHeader = async () => {
        try {
            let user = authService.getCurrentUser();
            if (!user || !user.id) {
                return null;
            }
            // Gunakan getUserPhotoBlobUrl dari photoUtils.js
            const photoUrl = await getUserPhotoBlobUrl(user.id, user.name || ''); 
            if (userAvatarNav) {
                userAvatarNav.src = photoUrl;
                userAvatarNav.alt = user.name || "User Avatar";
            }
            // Tidak perlu lagi memanggil userService.getUserByID di sini jika hanya untuk foto & nama
            // Jika Anda memerlukan data lain seperti 'position' atau 'department' di header, 
            // Anda harus memanggil userService.getUserByID dan mengambil data tersebut.
            return user; // Cukup kembalikan objek user dari sesi
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

    const loadAttendanceHistory = async () => {
        // Kolom colspan disesuaikan dari 5 menjadi 4 karena Check-Out akan dihapus
        attendanceHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">Memuat riwayat absensi...</td>
            </tr>
        `;
        attendanceHistoryMessage.classList.add('hidden');
        paginationControls.classList.add('hidden');

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
                // Kolom colspan disesuaikan dari 5 menjadi 4
                attendanceHistoryTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">Tidak ada riwayat absensi yang ditemukan.</td>
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
                    <td colspan="4" class="px-6 py-4 whitespace-nowrap text-center text-red-500">Gagal memuat riwayat absensi: ${error.message}</td>
                </tr>
            `;
            showToast(error.message || "Gagal memuat riwayat absensi.", "error");
            if (error.status === 401 || error.status === 403) {
                setTimeout(() => authService.logout(), 2000);
            }
        }
    };

const renderAttendanceTable = (data, page, limit) => {
    attendanceHistoryTableBody.innerHTML = ''; 
    const startIndex = (page - 1) * limit;
    const paginatedItems = data.slice(startIndex, startIndex + limit); // Menggunakan startIndex + limit untuk endIndex

    paginatedItems.forEach((attendance, index) => { // ✨ Tambahkan 'index' ✨
        const row = attendanceHistoryTableBody.insertRow();
        
        const formattedDate = new Date(attendance.date + 'T00:00:00').toLocaleDateString('id-ID', { 
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
            case 'Terlambat':
                statusClass = 'text-orange-600 font-semibold';
                break;
            case 'Sakit':
                statusClass = 'text-blue-600 font-semibold';
                statusDisplayText = 'Sakit';
                break;
            case 'Cuti':
                statusClass = 'text-purple-600 font-semibold';
                statusDisplayText = 'Cuti';
                break;
            case 'Tidak Absen': 
                statusClass = 'text-red-600 font-semibold';
                statusDisplayText = 'Tidak Absen';
                break;
            default:
                statusClass = 'text-gray-900';
                break;
        }

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${startIndex + index + 1}</td> <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formattedDate}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${attendance.check_in || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">${statusDisplayText}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${attendance.note || '-'}</td>
        `;
    });
};

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

    fetchEmployeeProfileDataForHeader();
    loadAttendanceHistory();
});