// js/Karyawan/EmployeeDashboard.js

import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import AttendanceService from '../Services/AttendanceServices.js';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import Swal from 'sweetalert2';

// Import komponen modular untuk sidebar dan logout
import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js"; // Pastikan path ini benar

document.addEventListener("DOMContentLoaded", async () => {
    // Inisialisasi Feather Icons
    feather.replace();

    // --- Inisialisasi Komponen Global ---
    initializeSidebar(); // Mengelola sidebar mobile
    initializeLogout(); // Mengelola semua tombol logout dengan SweetAlert2

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

    // QR Scanner elements
    const qrScannerContainer = document.getElementById('reader');
    const qrScanResult = document.getElementById('qr-scan-result');
    const cameraSelect = document.getElementById('camera-select'); // Akan disembunyikan

    let html5QrCodeInstance = null;
    let isProcessingScan = false;
    let isScannerInitialized = false;
    let isScannerActivelyScanning = false;

    const currentDateSpan = document.getElementById('current-date');
    const checkInTimeSpan = document.getElementById('check-in-time');
    const attendanceStatusSpan = document.getElementById('attendance-status');
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

    // Fungsi showToast untuk notifikasi kamera berhasil dibuka (posisi tengah)
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
            gravity: "top", // top, bottom
            position: "center", // left, center, right
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

    function updateAttendanceStatusUI(attendance) {
        const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        currentDateSpan.textContent = today;
        attendanceStatusSpan.className = '';
        todayAttendanceStatusSummary.className = 'text-lg font-bold';

        if (attendance) {
            const displayStatus = attendance.status;
            todayAttendanceStatusSummary.textContent = displayStatus;

            if (displayStatus === 'Tepat Waktu') {
                todayAttendanceStatusSummary.classList.add('text-green-600');
                attendanceStatusSpan.classList.add('text-green-600', 'font-semibold');
            } else if (displayStatus === 'Terlambat') {
                todayAttendanceStatusSummary.classList.add('text-orange-500');
                attendanceStatusSpan.classList.add('text-orange-500', 'font-semibold');
            } else if (['Sakit', 'Cuti', 'Izin'].includes(displayStatus)) {
                todayAttendanceStatusSummary.classList.add('text-blue-600');
                attendanceStatusSpan.classList.add('text-blue-600', 'font-semibold');
                checkInTimeSpan.textContent = '-';
            } else {
                todayAttendanceStatusSummary.classList.add('text-red-600');
                attendanceStatusSpan.classList.add('text-red-600', 'font-semibold');
                checkInTimeSpan.textContent = '-';
            }
            
            if (attendance.check_in) {
                 checkInTimeSpan.textContent = formatTime(attendance.check_in);
            }

            attendanceStatusSpan.textContent = displayStatus;

        } else {
            todayAttendanceStatusSummary.textContent = "Belum Absen";
            todayAttendanceStatusSummary.classList.add('text-red-600');

            checkInTimeSpan.textContent = '-';
            attendanceStatusSpan.textContent = 'Belum Absen';
            attendanceStatusSpan.classList.add('text-red-600', 'font-semibold');
        }
    }

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
        cameraSelect.classList.add('hidden'); // Sembunyikan select kamera
        isScannerInitialized = false;
        html5QrCodeInstance = null;
    }

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
            showSweetAlert('Error Autentikasi', 'User tidak terautentikasi. Silakan login kembali.', 'error', true);
            qrScanResult.textContent = 'Error: User tidak terautentikasi.';
            await stopAndClearScanner();
            isProcessingScan = false;
            return;
        }

        try {
            const response = await AttendanceService.scanQR(decodedText);

            Swal.fire({
                title: 'Absensi Berhasil!',
                text: response.message,
                icon: 'success',
                confirmButtonText: 'Oke',
                allowOutsideClick: false,
                backdrop: `
                    rgba(0,0,123,0.4)
                    url("/images/nyan-cat.gif")
                    left top
                    no-repeat
                `
            });

            qrScanResult.textContent = response.message;
            await stopAndClearScanner();
            qrScannerContainer.innerHTML = '<p class="text-gray-500 mt-8">Absensi berhasil!</p>';
            loadMyTodayAttendance();

        } catch (error) {
            console.error('Error saat memindai QR Code:', error);

            const message = error?.response?.data?.error || error.message || 'Terjadi kesalahan saat absen.';
            let icon = 'error';

            if (error.response?.status === 409) {
                icon = 'info';
            }
            
            Swal.fire({
                title: 'Absensi Gagal!',
                text: message,
                icon: icon,
                confirmButtonText: 'Oke',
                allowOutsideClick: false,
                backdrop: `
                    rgba(255,0,0,0.4)
                    url("/images/error-cat.gif")
                    center
                    no-repeat
                `
            });

            qrScanResult.textContent = `Gagal Absen: ${message}.`;
            await stopAndClearScanner();
            qrScannerContainer.innerHTML = `<p class="text-${icon === 'info' ? 'blue' : 'red'}-600 mt-8">Absensi gagal: ${message}. Harap coba lagi atau hubungi admin.</p>`;
            loadMyTodayAttendance();

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
                showSweetAlert('Error Inisialisasi', 'Elemen scanner tidak ditemukan di halaman.', 'error', true);
                return;
            }

            await stopAndClearScanner();

            if (typeof Html5Qrcode === 'undefined' || !Html5Qrcode.getCameras) {
                qrScanResult.textContent = "Browser tidak mendukung akses kamera atau Html5Qrcode tidak dimuat dengan benar.";
                qrScannerContainer.innerHTML = '<p class="text-red-600 mt-8">Browser Anda tidak mendukung akses kamera atau izin ditolak.</p>';
                showSweetAlert('Error Kamera', 'Browser Anda tidak mendukung akses kamera atau izin ditolak.', 'error', true);
                return;
            }

            const cameras = await Html5Qrcode.getCameras();
            if (cameras.length === 0) {
                qrScanResult.textContent = "Tidak ada kamera tersedia.";
                qrScannerContainer.innerHTML = '<p class="text-red-600 mt-8">Tidak ada kamera yang ditemukan di perangkat Anda.</p>';
                showSweetAlert('Kamera Tidak Ditemukan', 'Tidak ada kamera yang ditemukan di perangkat Anda.', 'error', true);
                return;
            }

            // Pilih kamera belakang (environment) secara default
            const rearCamera = cameras.find(camera => camera.facingMode === 'environment') || cameras[0];
            const cameraIdToUse = rearCamera.id;
            
            // Sembunyikan elemen cameraSelect
            cameraSelect.classList.add("hidden");

            html5QrCodeInstance = new Html5Qrcode("reader");

            await html5QrCodeInstance.start(
                {
                    deviceId: {
                        exact: cameraIdToUse
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
            showToast('Kamera Berhasil Dibuka!', 'success'); // Toastify di tengah untuk notifikasi kamera

        } catch (err) {
            console.error("Gagal memulai scanner:", err);
            qrScanResult.textContent = `Gagal memulai scanner: ${err.message}`;
            qrScannerContainer.innerHTML = `<p class="text-red-600 mt-8">Gagal memuat scanner: ${err.message}. Pastikan kamera diizinkan.</p>`;
            cameraSelect.classList.add("hidden");
            isScannerInitialized = false;
            isScannerActivelyScanning = false;
            showSweetAlert('Gagal Membuka Kamera', `Gagal memulai scanner: ${err.message}. Pastikan kamera diizinkan dan tidak sedang digunakan aplikasi lain.`, 'error', true);
        }
    }


    async function loadMyTodayAttendance() {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            showSweetAlert('Gagal Memuat Data', 'Sesi tidak valid. Harap login kembali.', 'error', true);
            await stopAndClearScanner();
            return;
        }

        try {
            const todayAttendance = await AttendanceService.getMyTodayAttendance();
            updateAttendanceStatusUI(todayAttendance);

            const shouldStopScanner = todayAttendance &&
                ['Tepat Waktu', 'Terlambat', 'Sakit', 'Cuti', 'Izin'].includes(todayAttendance.status);

            if (shouldStopScanner) {
                await stopAndClearScanner();
                let messageText = '';
                if (todayAttendance.status === 'Tepat Waktu' || todayAttendance.status === 'Terlambat') {
                    messageText = `Anda sudah absen masuk hari ini (${todayAttendance.status}).`;
                } else {
                    messageText = `Anda memiliki status hari ini: ${todayAttendance.status}.`;
                }
                qrScannerContainer.innerHTML = `<p class="text-gray-500 mt-8">${messageText}</p>`;
                showSweetAlert('Status Absensi', messageText, 'info');
            } else {
                startScanner();
            }

        } catch (error) {
            console.error('Error loading my today attendance:', error);
            showSweetAlert('Error Memuat Status Absensi', `Gagal memuat status absensi: ${error.message}.`, 'error', true);
            updateAttendanceStatusUI(null);
            startScanner();
        }
    }

    const fetchEmployeeProfileData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                showSweetAlert("Sesi Tidak Valid", "Sesi tidak valid. Mengarahkan ke halaman login...", "error");
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
                showSweetAlert("Akses Ditolak", "Akses ditolak. Peran tidak sesuai untuk halaman ini.", "error");
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
            showSweetAlert("Gagal Memuat Profil", error.message || "Gagal memuat data profil.", "error");
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

    // Memuat data profil dan absensi saat halaman dimuat
    const currentUser = await fetchEmployeeProfileData();
    if (currentUser) {
        loadMyTodayAttendance();
    }
});