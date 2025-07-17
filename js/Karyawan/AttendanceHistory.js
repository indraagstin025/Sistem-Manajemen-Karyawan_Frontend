import AttendanceService from '../Services/AttendanceServices.js';
import { authService } from "../Services/AuthServices.js";
import { userService } from "../Services/UserServices.js"; 
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js"; 
import { getUserPhotoBlobUrl } from '../utils/photoUtils.js';

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace();

    initializeSidebar();
    initializeLogout();

    const attendanceCardsContainer = document.getElementById("attendanceCardsContainer");
    const attendanceHistoryMessage = document.getElementById("attendanceHistoryMessage");
    const userAvatarNav = document.getElementById("userAvatar");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userDropdownContainer = document.getElementById("userDropdown");

    const paginationControls = document.getElementById('paginationControls');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn'); 
    const currentPageInfo = document.getElementById('currentPageInfo');

    const attendanceSearchInput = document.getElementById('attendanceSearchInput'); 

    let currentPage = 1;
    const itemsPerPage = 10;
    let allAttendanceData = []; 
    let filteredAttendanceData = []; 

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

    const fetchEmployeeProfileDataForHeader = async () => {
        try {
            let user = authService.getCurrentUser();
            if (!user || !user.id) {
                return null;
            }
            const photoUrl = await getUserPhotoBlobUrl(user.id, user.name || ''); 
            if (userAvatarNav) {
                userAvatarNav.src = photoUrl;
                userAvatarNav.alt = user.name || "User Avatar";
            }
            return user;
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
        attendanceCardsContainer.innerHTML = `
            <div class="text-center text-gray-500 py-4">Memuat riwayat absensi...</div>
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
            
            filteredAttendanceData = [...allAttendanceData];

            if (filteredAttendanceData.length === 0) {
                attendanceCardsContainer.innerHTML = `
                    <div class="text-center text-gray-500 py-4">Tidak ada riwayat absensi yang ditemukan.</div>
                `;
                attendanceHistoryMessage.textContent = 'Anda belum memiliki riwayat absensi.';
                attendanceHistoryMessage.classList.remove('hidden');
                attendanceHistoryMessage.classList.add('info');
            } else {
                renderAttendanceCards(filteredAttendanceData, currentPage, itemsPerPage); 
                updatePaginationControls(filteredAttendanceData.length, currentPage, itemsPerPage); 
                if (filteredAttendanceData.length > itemsPerPage) {
                    paginationControls.classList.remove('hidden');
                }
            }

        } catch (error) {
            console.error("Error loading attendance history:", error);
            attendanceCardsContainer.innerHTML = `
                <div class="text-center text-red-500 py-4">Gagal memuat riwayat absensi: ${error.message}</div>
            `;
            showToast(error.message || "Gagal memuat riwayat absensi.", "error");
            if (error.status === 401 || error.status === 403) {
                setTimeout(() => authService.logout(), 2000);
            }
        }
    };

    // ✨ FUNGSI UTAMA: renderAttendanceCards ✨
    const renderAttendanceCards = (data, page, limit) => {
        attendanceCardsContainer.innerHTML = ''; 
        const startIndex = (page - 1) * limit;
        const paginatedItems = data.slice(startIndex, startIndex + limit);

        if (paginatedItems.length === 0) {
             attendanceCardsContainer.innerHTML = `
                 <div class="text-center text-gray-500 py-4">Tidak ada riwayat absensi untuk halaman ini.</div>
             `;
             return;
        }

        paginatedItems.forEach((attendance, indexInPage) => { 
            const date = new Date(attendance.date + 'T00:00:00'); 
            const formattedDate = date.toLocaleDateString('id-ID', { 
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // ✨ PERUBAHAN DI SINI: getStatusBadgeClass untuk 'alpha' dan 'sakit' ✨
            const getStatusBadgeClass = (status) => {
                switch (status.toLowerCase()) {
                    case 'hadir': return 'hadir';
                    case 'terlambat': return 'terlambat';
                    case 'izin': return 'izin';
                    case 'sakit': return 'terlambat'; // Menggunakan kelas 'terlambat' untuk warna oranye
                    case 'cuti': return 'cuti';
                    case 'libur': return 'libur';
                    case 'tidak absen': return 'tidak-absen';
                    case 'alpha': return 'alpha'; // Menambahkan pemetaan untuk status 'alpha'
                    default: return '';
                }
            };

            const statusClass = getStatusBadgeClass(attendance.status || '');
            const checkInDisplay = attendance.check_in && attendance.check_in.trim() !== '' 
                                 ? attendance.check_in 
                                 : `<span class="empty-note">-</span>`;
            
            let noteDisplayText = ''; 

            if (attendance.status === 'Sakit' || attendance.status === 'Cuti') {
                if (attendance.reason && attendance.note && attendance.note.startsWith('Disetujui:')) {
                    noteDisplayText = `Alasan: ${attendance.reason}. Catatan Admin: ${attendance.note.replace('Disetujui: ', '')}`;
                } else if (attendance.reason) {
                    noteDisplayText = `Alasan: ${attendance.reason}`;
                    if (attendance.note && attendance.note.trim() !== '' && attendance.note !== '-') {
                        noteDisplayText += `. Catatan Admin: ${attendance.note}`;
                    }
                } else if (attendance.note && attendance.note.trim() !== '' && attendance.note !== '-') {
                    noteDisplayText = attendance.note;
                }
            } else if (attendance.status === 'Tidak Absen' || attendance.status === 'Alpha') { // Tambahkan 'Alpha' di sini
                if (attendance.note && attendance.note.includes('Pengajuan ditolak:')) {
                    const match = attendance.note.match(/Pengajuan ditolak: (.*?)\. Catatan admin: (.*)/);
                    if (match) {
                        noteDisplayText = `Ditolak. Alasan: ${match[1]}. Catatan Admin: ${match[2]}`;
                    } else if (attendance.reason && attendance.reason.trim() !== '') {
                        noteDisplayText = `Ditolak. Alasan: ${attendance.reason}. Catatan Admin: ${attendance.note}`;
                    } else if (attendance.note && attendance.note.trim() !== '' && attendance.note !== '-') {
                         noteDisplayText = attendance.note;
                    }
                } else if (attendance.note && attendance.note.trim() !== '' && attendance.note !== '-') {
                    noteDisplayText = attendance.note;
                }
            } else if (attendance.note && attendance.note.trim() !== '' && attendance.note !== '-') {
                noteDisplayText = attendance.note;
            }
            
            const finalNoteDisplay = (!noteDisplayText.trim() || noteDisplayText === '-') 
                                     ? `<span class="empty-note">Tidak ada catatan</span>` 
                                     : `<span>${noteDisplayText}</span>`;

            const cardHtml = `
                <div class="attendance-card">
                    <div class="card-no-col">
                        <span class="no-label">No</span>
                        <span class="no-value">${startIndex + indexInPage + 1}</span>
                    </div>
                    <div class="card-details-col">
                        <div class="attendance-data-item">
                            <span class="data-label">Tanggal</span>
                            <span class="data-value">${formattedDate}</span>
                        </div>
                        <div class="attendance-data-item">
                            <span class="data-label">Masuk Jam</span>
                            <span class="data-value">${checkInDisplay}</span>
                        </div>
                        <div class="attendance-data-item">
                            <span class="data-label">Status</span>
                            <span class="data-value">
                                <span class="status-badge ${statusClass}">
                                    ${attendance.status || '-'}
                                </span>
                            </span>
                        </div>
                        <div class="attendance-data-item note-item">
                            <span class="data-label">Catatan</span>
                            <span class="data-value">${finalNoteDisplay}</span>
                        </div>
                    </div>
                </div>
            `;
            attendanceCardsContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
        feather.replace(); 
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

    const performSearch = () => {
        const searchTerm = attendanceSearchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredAttendanceData = [...allAttendanceData]; 
        } else {
            filteredAttendanceData = allAttendanceData.filter(attendance => {
                const date = new Date(attendance.date + 'T00:00:00').toLocaleDateString('id-ID', { 
                    year: 'numeric', month: 'long', day: 'numeric'
                }).toLowerCase();
                const checkIn = (attendance.check_in || '').toLowerCase();
                const status = (attendance.status || '').toLowerCase();
                const note = (attendance.note || '').toLowerCase();
                const reason = (attendance.reason || '').toLowerCase();

                return date.includes(searchTerm) ||
                       checkIn.includes(searchTerm) ||
                       status.includes(searchTerm) ||
                       note.includes(searchTerm) ||
                       reason.includes(searchTerm);
            });
        }

        currentPage = 1; 
        renderAttendanceCards(filteredAttendanceData, currentPage, itemsPerPage);
        updatePaginationControls(filteredAttendanceData.length, currentPage, itemsPerPage);

        if (filteredAttendanceData.length === 0 && searchTerm !== '') {
            attendanceCardsContainer.innerHTML = `
                <div class="text-center text-gray-500 py-4">Tidak ada riwayat absensi yang cocok dengan pencarian Anda.</div>
            `;
        }
    };

    if (attendanceSearchInput) {
        attendanceSearchInput.addEventListener('input', performSearch);
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderAttendanceCards(filteredAttendanceData, currentPage, itemsPerPage);
                updatePaginationControls(filteredAttendanceData.length, currentPage, itemsPerPage);
            }
        });
    }

    if (nextPageBtn) { 
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredAttendanceData.length / itemsPerPage); 
            if (currentPage < totalPages) {
                currentPage++;
                renderAttendanceCards(filteredAttendanceData, currentPage, itemsPerPage); 
                updatePaginationControls(filteredAttendanceData.length, currentPage, itemsPerPage); 
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