// js/Admin/AttendanceList.js

import { authService } from '../Services/AuthServices.js';
import AttendanceService from '../Services/AttendanceServices.js';

document.addEventListener('DOMContentLoaded', async () => {
    feather.replace(); // Inisialisasi ikon Feather

    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const logoutButton = document.getElementById('logoutButton');
    const dropdownLogoutButton = document.getElementById('dropdownLogoutButton');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
    const closeSidebar = document.getElementById('closeSidebar');

    // QR Code Modal Elements (tetap di sini karena modal bisa dipanggil dari sidebar)
    const generateQrMenuBtn = document.getElementById('generate-qr-menu-btn');
    const generateQrMenuBtnMobile = document.getElementById('generate-qr-menu-btn-mobile');
    const qrCodeModal = document.getElementById('qrCodeModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalQrCodeImage = document.getElementById('modal-qr-code-image');
    const modalQrPlaceholder = document.getElementById('modal-qr-placeholder');
    const modalQrExpiresAt = document.getElementById('modal-qr-expires-at');
    const modalGenerateQrBtn = document.getElementById('modal-generate-qr-btn');
    let qrCodeRefreshInterval; // Untuk menyimpan ID interval

    // Attendance List Elements
    const attendanceListBody = document.getElementById('attendance-list-body');
    const attendanceEmptyState = document.getElementById('attendance-empty-state');

    // --- Fungsi Helper untuk Format Tanggal dan Waktu ---
    const formatTime = (timeString) => {
        if (!timeString) return '-';
        // Asumsi format 'HH:MM'
        return timeString;
    };

    // --- Fungsi untuk Memuat Daftar Kehadiran Hari Ini ---
    const loadTodaysAttendance = async () => {
        attendanceListBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Memuat data kehadiran...</td></tr>`;
        attendanceEmptyState.classList.add('hidden');

        try {
            const attendanceData = await AttendanceService.getTodaysAttendance();
            
            if (attendanceData && attendanceData.length > 0) {
                attendanceListBody.innerHTML = ''; // Kosongkan placeholder
                attendanceData.forEach(attendance => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                ${attendance.user_photo ? `<img class="h-10 w-10 rounded-full mr-3 object-cover" src="${attendance.user_photo}" alt="${attendance.user_name}">` : `<div class="h-10 w-10 rounded-full mr-3 bg-teal-200 flex items-center justify-center text-teal-800 font-semibold">${attendance.user_name ? attendance.user_name.charAt(0).toUpperCase() : '?' }</div>`}
                                <div class="text-sm font-medium text-gray-900">${attendance.user_name || 'N/A'}</div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${attendance.user_department || 'N/A'}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${attendance.user_position || 'N/A'}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${formatTime(attendance.check_in)}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${formatTime(attendance.check_out)}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                attendance.status === 'Hadir' ? 'bg-green-100 text-green-800' :
                                attendance.status === 'Telat' ? 'bg-yellow-100 text-yellow-800' :
                                attendance.status === 'Izin' || attendance.status === 'Sakit' || attendance.status === 'Cuti' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }">
                                ${attendance.status}
                            </span>
                        </td>
                    `;
                    attendanceListBody.appendChild(row);
                });
            } else {
                attendanceListBody.innerHTML = ''; // Kosongkan tabel
                attendanceEmptyState.classList.remove('hidden'); // Tampilkan pesan kosong
            }
        } catch (error) {
            console.error('Error loading today\'s attendance:', error);
            attendanceListBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-500">Gagal memuat data kehadiran. ${error.message || ''}</td></tr>`;
            attendanceEmptyState.classList.add('hidden'); // Sembunyikan pesan kosong jika ada error
        }
    };

    // --- Inisialisasi User dan Auth ---
    const initializeAuth = () => {
        const user = authService.getCurrentUser();
        if (!user) {
            window.location.href = '/src/pages/Auth/login.html'; // Redirect ke login jika tidak ada user
            return;
        }
        if (user.role !== 'admin') {
            alert('Akses ditolak. Anda tidak memiliki izin sebagai admin.');
            window.location.href = '/src/pages/Auth/login.html'; // Atau ke halaman lain yang sesuai
            return;
        }

        // Set avatar (jika user.photo tersedia)
        if (user.photo) {
            userAvatar.src = user.photo;
        } else {
            // Jika tidak ada foto, tampilkan inisial atau placeholder
            userAvatar.src = `https://placehold.co/40x40/E2E8F0/4A5568?text=${user.name ? user.name.charAt(0).toUpperCase() : 'AD'}`;
        }
    };

    // --- Event Listeners ---
    if (userDropdown) {
        userDropdown.addEventListener('click', () => {
            dropdownMenu.classList.toggle('active');
        });
        document.addEventListener('click', (event) => {
            if (!userDropdown.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            authService.logout();
            window.location.href = '/src/pages/Auth/login.html';
        });
    }
    if (dropdownLogoutButton) {
        dropdownLogoutButton.addEventListener('click', () => {
            authService.logout();
            window.location.href = '/src/pages/Auth/login.html';
        });
    }

    // Sidebar Toggle for Mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            mobileSidebar.classList.remove('hidden');
            setTimeout(() => {
                mobileSidebar.classList.add('opacity-100');
                mobileSidebarPanel.classList.remove('-translate-x-full');
            }, 10); // Memberi sedikit delay agar transisi terlihat
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            mobileSidebar.classList.remove('opacity-100');
            mobileSidebarPanel.classList.add('-translate-x-full');
            setTimeout(() => {
                mobileSidebar.classList.add('hidden');
            }, 300); // Sesuaikan dengan durasi transisi
        });
    }

    // QR Code Generation Logic (tetap di sini karena modal QR bisa dipanggil dari sidebar halaman ini)
    const generateAndDisplayQR = async () => {
        modalQrCodeImage.classList.add('hidden');
        modalQrCodeImage.classList.remove('opacity-100', 'scale-100');
        modalQrPlaceholder.classList.remove('hidden');
        modalQrExpiresAt.textContent = 'Memuat...';

        try {
            const data = await AttendanceService.generateQR();
            modalQrCodeImage.src = data.qr_code_image;
            modalQrCodeImage.classList.remove('hidden');
            modalQrCodeImage.classList.add('opacity-100', 'scale-100');
            modalQrPlaceholder.classList.add('hidden');

            const expiresDate = new Date(data.expires_at);
            modalQrExpiresAt.textContent = `QR akan kadaluarsa pada: ${expiresDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

            clearInterval(qrCodeRefreshInterval); 
            const timeLeft = expiresDate.getTime() - Date.now();
            if (timeLeft > 0) {
                qrCodeRefreshInterval = setTimeout(generateAndDisplayQR, timeLeft + 1000); 
            }

        } catch (error) {
            console.error('Error generating QR Code:', error);
            modalQrPlaceholder.textContent = `Gagal memuat QR Code: ${error.message}`;
            modalQrExpiresAt.textContent = '';
            clearInterval(qrCodeRefreshInterval); 
            alert('Gagal membuat QR Code: ' + error.message);
        }
    };

    if (generateQrMenuBtn) {
        generateQrMenuBtn.addEventListener('click', () => {
            qrCodeModal.classList.remove('hidden');
            setTimeout(() => {
                qrCodeModal.classList.add('active');
            }, 10);
            generateAndDisplayQR(); 
        });
    }

    if (generateQrMenuBtnMobile) {
        generateQrMenuBtnMobile.addEventListener('click', () => {
            mobileSidebar.classList.remove('opacity-100');
            mobileSidebarPanel.classList.add('-translate-x-full');
            setTimeout(() => {
                mobileSidebar.classList.add('hidden');
                qrCodeModal.classList.remove('hidden');
                setTimeout(() => {
                    qrCodeModal.classList.add('active');
                }, 10);
                generateAndDisplayQR();
            }, 300);
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            qrCodeModal.classList.remove('active');
            clearInterval(qrCodeRefreshInterval); 
            setTimeout(() => {
                qrCodeModal.classList.add('hidden');
            }, 300);
        });
    }

    if (modalGenerateQrBtn) {
        modalGenerateQrBtn.addEventListener('click', generateAndDisplayQR);
    }

    // --- Inisialisasi Saat Halaman Dimuat ---
    initializeAuth();
    loadTodaysAttendance(); // Memuat daftar kehadiran
});