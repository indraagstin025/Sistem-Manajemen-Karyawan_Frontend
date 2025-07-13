// js/Karyawan/EmployeeDashboard.js

import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import AttendanceService from '../Services/AttendanceServices.js';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import Swal from 'sweetalert2'; // Import SweetAlert2

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace();

    // --- Seleksi Elemen DOM ---
    const profilePhoto = document.getElementById("profilePhoto");
    const employeeName = document.getElementById("employeeName");
    const employeePosition = document.getElementById("employeePosition");
    const employeeDepartment = document.getElementById("employeeDepartment");
    const todayAttendanceStatusSummary = document.getElementById("todayAttendanceStatus");
    const remainingLeave = document.getElementById("remainingLeave");
    const userAvatarNav = document.getElementById("userAvatar");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userDropdownContainer = document.getElementById("userDropdown");

    const allLogoutButtons = document.querySelectorAll("#logoutButton, #dropdownLogoutButton, #mobileLogoutButton");

    const sidebarToggle = document.getElementById("sidebarToggle");
    const mobileSidebar = document.getElementById("mobileSidebar");
    const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
    const closeSidebar = document.getElementById("closeSidebar");

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

    // QR Scanner elements
    const qrScannerContainer = document.getElementById('reader');
    const qrScanResult = document.getElementById('qr-scan-result');
    const notificationMessage = document.getElementById('notification-message'); // Ini tidak digunakan di kode yang disediakan, bisa dihapus jika tidak ada.
    const cameraSelect = document.getElementById('camera-select');

    let html5QrCodeInstance = null;
    let isProcessingScan = false;
    let isScannerInitialized = false; // Flag untuk melacak inisialisasi scanner
    let isScannerActivelyScanning = false; // Flag tambahan untuk status aktif scanning

    const currentDateSpan = document.getElementById('current-date');
    const checkInTimeSpan = document.getElementById('check-in-time');
    const attendanceStatusSpan = document.getElementById('attendance-status');
    // HAPUS ATAU KOMENTARI BARIS INI: checkOutDisplay dan checkOutTimeSpan TIDAK ADA LAGI di HTML
    // const checkOutDisplay = document.getElementById('check-out-display');
    // const checkOutTimeSpan = document.getElementById('check-out-time');
    const attendanceNoteDisplay = document.getElementById('attendance-note-display');
    const attendanceNoteSpan = document.getElementById('attendance-note');


    // --- Fungsi Utilitas ---

    // Fungsi untuk menampilkan notifikasi SweetAlert2
    function showSweetAlert(title, message, icon = "success", showConfirmButton = false, timer = 2000) {
        Swal.fire({
            title: title,
            text: message,
            icon: icon,
            showConfirmButton: showConfirmButton,
            timer: timer,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });
    }

    // Fungsi Utilitas (showToast) - Pertahankan untuk error/info jika perlu
    function showToast(message, type = "success") {
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
    }

    // --- Helper Functions untuk Absensi ---
    function formatTime(timeString) {
        return timeString || '-';
    }

    // Menyesuaikan fungsi updateAttendanceStatusUI untuk hanya fokus pada Check-in
    function updateAttendanceStatusUI(attendance) {
        const today = new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        currentDateSpan.textContent = today;
        attendanceStatusSpan.className = '';
        todayAttendanceStatusSummary.classList.remove('text-gray-900', 'text-green-600', 'text-red-600', 'text-orange-600', 'text-blue-600');

        if (attendance) {
            todayAttendanceStatusSummary.textContent = attendance.status;
            if (attendance.status === 'Hadir') {
                todayAttendanceStatusSummary.classList.add('text-green-600');
            } else if (attendance.status === 'Telat') {
                todayAttendanceStatusSummary.classList.add('text-orange-600');
            } else if (attendance.status === 'Sakit' || attendance.status === 'Cuti' || attendance.status === 'Izin') {
                todayAttendanceStatusSummary.classList.add('text-blue-600');
            } else {
                todayAttendanceStatusSummary.classList.add('text-gray-900');
            }

            checkInTimeSpan.textContent = formatTime(attendance.check_in);
            attendanceStatusSpan.textContent = attendance.status;

            if (attendance.status === 'Hadir') {
                attendanceStatusSpan.classList.add('text-green-600', 'font-semibold');
            } else if (attendance.status === 'Telat') {
                attendanceStatusSpan.classList.add('text-orange-600', 'font-semibold');
            } else if (attendance.status === 'Sakit' || attendance.status === 'Cuti' || attendance.status === 'Izin') {
                checkInTimeSpan.textContent = '-';
                attendanceStatusSpan.classList.add('text-blue-600', 'font-semibold');
            } else {
                attendanceStatusSpan.classList.add('text-gray-600', 'font-semibold');
            }

            // HAPUS ATAU KOMENTARI BARIS INI: checkOutDisplay dan checkOutTimeSpan TIDAK ADA LAGI
            // checkOutDisplay.classList.add('hidden');
            // checkOutTimeSpan.textContent = '';

            if (attendance.note) {
                attendanceNoteDisplay.classList.remove('hidden');
                attendanceNoteSpan.textContent = attendance.note;
            } else {
                attendanceNoteDisplay.classList.add('hidden');
                attendanceNoteSpan.textContent = '';
            }
        } else {
            todayAttendanceStatusSummary.textContent = "Belum Absen";
            todayAttendanceStatusSummary.classList.add('text-red-600');

            checkInTimeSpan.textContent = '-';
            attendanceStatusSpan.textContent = 'Belum Absen';
            attendanceStatusSpan.classList.add('text-red-600', 'font-semibold');
            // HAPUS ATAU KOMENTARI BARIS INI: checkOutDisplay TIDAK ADA LAGI
            // checkOutDisplay.classList.add('hidden');
            attendanceNoteDisplay.classList.add('hidden');
        }
    }

    // Fungsi helper untuk menghentikan dan membersihkan scanner
    async function stopAndClearScanner() {
        if (html5QrCodeInstance && isScannerActivelyScanning) {
            try {
                await html5QrCodeInstance.stop();
                await html5QrCodeInstance.clear();
                console.log("Scanner dihentikan dan dibersihkan.");
            } catch (err) {
                console.warn("Gagal menghentikan/membersihkan scanner:", err);
            }
            isScannerActivelyScanning = false;
        }
        qrScannerContainer.innerHTML = '';
        qrScanResult.textContent = '';
        cameraSelect.classList.add('hidden');
        isScannerInitialized = false;
        html5QrCodeInstance = null;
    }

    // --- Fungsi QR Scanner (HTML5-Qrcode Manual) ---
    async function onScanSuccess(decodedText, decodedResult) {
        if (isProcessingScan) {
            console.warn("Scan diabaikan karena sedang memproses scan sebelumnya.");
            return;
        }
        isProcessingScan = true;

        console.log(`QR Code terdeteksi: ${decodedText}`);
        qrScanResult.textContent = `Memproses...`;

        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            showToast('User tidak terautentikasi. Silakan login kembali.', 'error');
            qrScanResult.textContent = 'Error: User tidak terautentikasi.';
            await stopAndClearScanner();
            isProcessingScan = false;
            return;
        }

        try {
            const response = await AttendanceService.scanQR(decodedText, currentUser.id);

            showSweetAlert('Absensi Berhasil!', response.message, 'success');

            qrScanResult.textContent = response.message;

            await stopAndClearScanner();
            qrScannerContainer.innerHTML = '<p class="text-gray-500 mt-8">Absensi berhasil!</p>';
            loadMyTodayAttendance();

        } catch (error) {
            console.error('Error saat memindai QR Code:', error);

            const message = error?.response?.data?.error || error.message || 'Terjadi kesalahan saat absen.';

            if (error.response?.status === 409) {
                showSweetAlert('Info Absensi', message, 'info');

                qrScanResult.textContent = message;
                await stopAndClearScanner();
                qrScannerContainer.innerHTML = `<p class="text-gray-500 mt-8">${message}</p>`;
                loadMyTodayAttendance();
            } else {
                showToast(`Absensi gagal: ${message}`, 'error');
                qrScanResult.textContent = `Gagal Absen: ${message}.`;

                await stopAndClearScanner();
                qrScannerContainer.innerHTML = `<p class="text-red-600 mt-8">Gagal absen: ${message}. Harap coba lagi atau hubungi admin.</p>`;
            }
        } finally {
            isProcessingScan = false;
        }
    }

    function onScanFailure(error) {
        // console.warn(`Scan gagal: ${error}`);
    }

    async function startScanner() {
        if (html5QrCodeInstance && isScannerActivelyScanning) {
            console.log("Scanner sudah berjalan.");
            return;
        }

        try {
            if (!qrScannerContainer) {
                console.error("Elemen 'reader' tidak ditemukan di DOM.");
                qrScanResult.textContent = "Error: Elemen scanner tidak ditemukan.";
                return;
            }

            await stopAndClearScanner();

            if (typeof Html5Qrcode === 'undefined' || !Html5Qrcode.getCameras) {
                qrScanResult.textContent = "Browser tidak mendukung akses kamera atau Html5Qrcode tidak dimuat dengan benar.";
                qrScannerContainer.innerHTML = '<p class="text-red-600 mt-8">Browser Anda tidak mendukung akses kamera atau izin ditolak.</p>';
                return;
            }

            const cameras = await Html5Qrcode.getCameras();
            if (cameras.length === 0) {
                qrScanResult.textContent = "Tidak ada kamera tersedia.";
                qrScannerContainer.innerHTML = '<p class="text-red-600 mt-8">Tidak ada kamera yang ditemukan di perangkat Anda.</p>';
                return;
            }

            const defaultCameraId = cameras[0].id;

            cameraSelect.innerHTML = "";
            cameras.forEach((cam) => {
                const option = document.createElement("option");
                option.value = cam.id;
                option.text = cam.label || `Kamera ${cam.id}`;
                cameraSelect.appendChild(option);
            });
            cameraSelect.classList.remove("hidden");
            cameraSelect.value = defaultCameraId;

            cameraSelect.removeEventListener("change", handleCameraChange);
            cameraSelect.addEventListener("change", handleCameraChange);

            html5QrCodeInstance = new Html5Qrcode("reader");

            await html5QrCodeInstance.start(
                {
                    deviceId: {
                        exact: defaultCameraId
                    }
                }, {
                    fps: 10,
                    qrbox: {
                        width: 250,
                        height: 250
                    },
                    aspectRatio: 1.0
                },
                onScanSuccess,
                onScanFailure
            );
            qrScanResult.textContent = "Pindai QR Code untuk Absen...";
            isScannerInitialized = true;
            isScannerActivelyScanning = true;
            console.log("Scanner berhasil dimulai.");

        } catch (err) {
            console.error("Gagal memulai scanner:", err);
            qrScanResult.textContent = `Gagal memulai scanner: ${err.message}`;
            qrScannerContainer.innerHTML = `<p class="text-red-600 mt-8">Gagal memuat scanner: ${err.message}. Pastikan kamera diizinkan.</p>`;
            cameraSelect.classList.add("hidden");
            isScannerInitialized = false;
            isScannerActivelyScanning = false;
        }
    }

    async function handleCameraChange(e) {
        const selectedCameraId = e.target.value;
        await restartScanner(selectedCameraId);
    }

    async function restartScanner(cameraId) {
        try {
            await stopAndClearScanner();

            html5QrCodeInstance = new Html5Qrcode("reader");

            await html5QrCodeInstance.start(
                {
                    deviceId: {
                        exact: cameraId
                    }
                }, {
                    fps: 10,
                    qrbox: {
                        width: 250,
                        height: 250
                    },
                    aspectRatio: 1.0
                },
                onScanSuccess,
                onScanFailure
            );
            qrScanResult.textContent = "Pindai QR Code untuk Absen...";
            showToast("Kamera berhasil diganti.", "info");
            isScannerInitialized = true;
            isScannerActivelyScanning = true;
            console.log("Scanner berhasil di-restart dengan kamera baru.");

        } catch (err) {
            console.error("Gagal restart scanner:", err);
            qrScanResult.textContent = `Gagal mengganti kamera: ${err.message}`;
            qrScannerContainer.innerHTML = `<p class="text-red-600 mt-8">Gagal mengganti kamera: ${err.message}</p>`;
            isScannerInitialized = false;
            isScannerActivelyScanning = false;
        }
    }


    async function loadMyTodayAttendance() {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            showToast('Gagal memuat status absensi: User tidak terautentikasi.', 'error');
            await stopAndClearScanner();
            return;
        }

        try {
            const history = await AttendanceService.getMyHistory();
            const today = new Date().toISOString().slice(0, 10);
            const todayAttendance = history.find(att => att.date === today);

            updateAttendanceStatusUI(todayAttendance);

            // Logika untuk scanner QR
            // Scanner HARUS berhenti jika sudah ada record absensi untuk hari ini
            const shouldStopScanner = todayAttendance &&
                (todayAttendance.status === 'Hadir' ||
                 todayAttendance.status === 'Telat' ||
                 todayAttendance.status === 'Sakit' ||
                 todayAttendance.status === 'Cuti' ||
                 todayAttendance.status === 'Izin');

            if (shouldStopScanner) {
                await stopAndClearScanner();
                let messageText = '';
                // Pesan disederhanakan karena tidak ada check-out di sini
                if (todayAttendance.status === 'Hadir' || todayAttendance.status === 'Telat') {
                    messageText = `Anda sudah absen masuk hari ini (${todayAttendance.status}).`;
                } else {
                    messageText = `Anda memiliki status hari ini: ${todayAttendance.status}.`;
                }
                qrScannerContainer.innerHTML = `<p class="text-gray-500 mt-8">${messageText}</p>`;
                showToast(messageText, 'info');
            } else {
                // Jika belum ada absensi yang lengkap, aktifkan scanner
                startScanner();
            }

        } catch (error) {
            console.error('Error loading my today attendance:', error);
            showToast(`Gagal memuat status absensi: ${error.message}`, 'error');
            currentDateSpan.textContent = new Date().toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            checkInTimeSpan.textContent = 'Gagal memuat';
            attendanceStatusSpan.textContent = 'Error';
            attendanceStatusSpan.classList.add('text-red-600', 'font-semibold');
            startScanner();
        }
    }

    const fetchEmployeeProfileData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                showToast("Sesi tidak valid. Mengarahkan ke halaman login...", "error");
                setTimeout(() => authService.logout(), 2000);
                return null;
            }

            let user;
            try {
                user = authService.getCurrentUser();
                if (!user) {
                    throw new Error("Data pengguna tidak ditemukan di sesi.");
                }
            } catch (e) {
                console.error("Error parsing user from localStorage:", e);
                throw new Error("Data pengguna di sesi rusak.");
            }

            if (user.role !== 'karyawan') {
                showToast("Akses ditolak. Peran tidak sesuai untuk halaman ini.", "error");
                setTimeout(() => authService.logout(), 2000);
                return null;
            }

            const employeeData = await userService.getUserByID(user.id);

            if (employeeData) {
                try {
                    const blob = await userService.getProfilePhoto(user.id);
                    const photoUrl = URL.createObjectURL(blob);
                    profilePhoto.src = photoUrl;
                    if (userAvatarNav) {
                        userAvatarNav.src = photoUrl;
                        userAvatarNav.alt = employeeData.name;
                    }
                } catch {
                    const fallback = "https://via.placeholder.com/80/4A5568/E2E8F0?text=ME";
                    profilePhoto.src = fallback;
                    if (userAvatarNav) {
                        userAvatarNav.src = fallback;
                        userAvatarNav.alt = employeeData.name;
                    }
                }

                employeeName.textContent = employeeData.name;
                employeePosition.textContent = employeeData.position || "-";
                employeeDepartment.textContent = employeeData.department || "-";

                if (employeeData.annual_leave_balance !== undefined && employeeData.annual_leave_balance !== null) {
                    remainingLeave.textContent = `${employeeData.annual_leave_balance} Hari`;
                } else {
                    remainingLeave.textContent = `N/A`;
                }
            }
            return employeeData;

        } catch (error) {
            console.error("Error fetching employee profile data:", error);
            showToast(error.message || "Gagal memuat data profil.", "error");
            if (
                error.status === 401 ||
                (error.message &&
                    (error.message.includes('token') ||
                        error.message.includes('sesi') ||
                        error.message.includes('Peran tidak sesuai') ||
                        error.message.includes('Data pengguna di sesi rusak')))
            ) {
                setTimeout(() => authService.logout(), 2000);
            }
            return null;
        }
    };


    // --- Change Password Modal Logic ---
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
            if (!currentUser || !currentUser.id || !localStorage.getItem('token')) {
                showToast("Sesi tidak valid. Harap login kembali.", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }

            try {
                const response = await authService.changePassword(oldPassword, newPassword);
                changePasswordSuccessMessage.textContent = response.message || "Password berhasil diubah!";
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


    const currentUser = await fetchEmployeeProfileData();
    if (currentUser) {
        loadMyTodayAttendance();
    }
});