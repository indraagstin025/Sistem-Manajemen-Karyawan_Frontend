import { authService } from '../Services/AuthServices.js';
import AttendanceService from '../Services/AttendanceServices.js';
import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from '../components/logoutHandler.js';
import { QRCodeManager } from '../components/qrCodeHandler.js';
import { getUserPhotoBlobUrl } from '../utils/photoUtils.js';
import { initTheme } from '../utils/darkmode.js';
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

document.addEventListener('DOMContentLoaded', async () => {
    const showToast = (message, type = "success") => {
        const backgroundColor = {
            success: "linear-gradient(to right, #22c55e, #16a34a)",
            error: "linear-gradient(to right, #ef4444, #dc2626)",
            info: "linear-gradient(to right, #3b82f6, #2563eb)",
        }[type];
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            style: { background: backgroundColor, borderRadius: "8px" },
        }).showToast();
    };

    initializeSidebar();
    initTheme()
    QRCodeManager.initialize({ toastCallback: showToast });
    initializeLogout({ preLogoutCallback: QRCodeManager.close });

    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const attendanceListBody = document.getElementById('attendance-list-body');
    const attendanceEmptyState = document.getElementById('attendance-empty-state');

    const formatTime = (timeString) => {
        return timeString || '-';
    };

    const getStatusClass = (status) => {
    switch (status) {
        case 'Hadir':
            return 'bg-green-100 text-green-800';
        case 'Terlambat':
            return 'bg-yellow-100 text-yellow-800';
        case 'Sakit':
            return 'bg-blue-100 text-blue-800';
        case 'Cuti':
            return 'bg-purple-100 text-purple-800';
        case 'Alpha':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

// file: AttendanceList.js

const loadTodaysAttendance = async () => {
    attendanceListBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Memuat data kehadiran...</td></tr>`;
    attendanceEmptyState.classList.add('hidden');

    try {
        const attendanceData = await AttendanceService.getTodaysAttendance();
        
        if (attendanceData && attendanceData.length > 0) {
            attendanceListBody.innerHTML = '';

            for (const attendance of attendanceData) {
                const row = document.createElement('tr');
                const photoUrl = await getUserPhotoBlobUrl(attendance.user_id, attendance.user_name, 40);

                // Perubahan ada di baris 'span' di bawah ini
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <img class="h-10 w-10 rounded-full mr-3 object-cover" src="${photoUrl}" alt="${attendance.user_name}">
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
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            // DIUBAH: Memanggil fungsi helper baru kita
                            getStatusClass(attendance.status)
                        }">
                            ${attendance.status}
                        </span>
                    </td>
                `;
                attendanceListBody.appendChild(row);
            }
        } else {
            attendanceListBody.innerHTML = '';
            attendanceEmptyState.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading today\'s attendance:', error);
        attendanceListBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-500">Gagal memuat data kehadiran. ${error.message || ''}</td></tr>`;
        attendanceEmptyState.classList.add('hidden');
    }
};


    const initializeAuth = () => {
        const user = authService.getCurrentUser();
        if (!user) {
            window.location.href = '/src/pages/Auth/login.html';
            return;
        }
        if (user.role !== 'admin') { 
            alert('Akses ditolak. Anda tidak memiliki izin sebagai admin.');
            window.location.href = '/src/pages/Auth/login.html';
            return;
        }

        if (user.photo) {
            userAvatar.src = user.photo;
        } else {
            const initial = user.name ? user.name.charAt(0).toUpperCase() : 'AD';
            userAvatar.src = `https://placehold.co/40x40/E2E8F0/4A5568?text=${initial}`;
        }
    };

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

    initializeAuth();
    loadTodaysAttendance();
});