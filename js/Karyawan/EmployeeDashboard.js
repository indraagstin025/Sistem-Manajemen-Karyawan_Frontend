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
    const qrScanResult = document.getElementById('qr-scan-result'); // ✅ Ini yang ditambahkan ke HTML

    // Elemen untuk detail absensi hari ini
    const currentDateSpan = document.getElementById('current-date');
    const checkInTimeSpan = document.getElementById('check-in-time');
    const attendanceStatusSpan = document.getElementById('attendance-status');
    const attendanceNoteDisplay = document.getElementById('attendance-note-display');
    const attendanceNoteSpan = document.getElementById('attendance-note');

    let html5QrCodeInstance = null; // Instance untuk scanner utama (jika ada, saat ini tidak digunakan)
    let html5QrCodeFullInstance = null; // Instance khusus untuk fullscreen scanner
    let isProcessingScan = false;
    let isScannerActivelyScanning = false;


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
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
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
        if (currentDateSpan) currentDateSpan.textContent = today;
        if (attendanceStatusSpan) attendanceStatusSpan.className = '';
        if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.className = 'text-lg font-bold';

        if (attendance) {
            const displayStatus = attendance.status;
            if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.textContent = displayStatus;

            if (displayStatus === 'Tepat Waktu') {
                if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.classList.add('text-green-600');
                if (attendanceStatusSpan) attendanceStatusSpan.classList.add('text-green-600', 'font-semibold');
            } else if (displayStatus === 'Terlambat') {
                if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.classList.add('text-orange-500');
                if (attendanceStatusSpan) attendanceStatusSpan.classList.add('text-orange-500', 'font-semibold');
            } else if (['Sakit', 'Cuti', 'Izin'].includes(displayStatus)) {
                if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.classList.add('text-blue-600');
                if (attendanceStatusSpan) attendanceStatusSpan.classList.add('text-blue-600', 'font-semibold');
                if (checkInTimeSpan) checkInTimeSpan.textContent = '-';
            } else {
                if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.classList.add('text-red-600');
                if (attendanceStatusSpan) attendanceStatusSpan.classList.add('text-red-600', 'font-semibold');
                if (checkInTimeSpan) checkInTimeSpan.textContent = '-';
            }
            
            if (attendance.check_in) {
                 if (checkInTimeSpan) checkInTimeSpan.textContent = formatTime(attendance.check_in);
            }

            if (attendanceStatusSpan) attendanceStatusSpan.textContent = displayStatus;

        } else {
            if (todayAttendanceStatusSummary) {
                todayAttendanceStatusSummary.textContent = "Belum Absen";
                todayAttendanceStatusSummary.classList.add('text-red-600');
            }

            if (checkInTimeSpan) checkInTimeSpan.textContent = '-';
            if (attendanceStatusSpan) {
                attendanceStatusSpan.textContent = 'Belum Absen';
                attendanceStatusSpan.classList.add('text-red-600', 'font-semibold');
            }
        }
    }

    async function stopAndClearScanner() {
        if (html5QrCodeFullInstance && html5QrCodeFullInstance.isScanning) { // ✅ Pastikan 'isScanning' adalah properti yang benar
            try {
                await html5QrCodeFullInstance.stop();
                await html5QrCodeFullInstance.clear(); // Clear juga diperlukan untuk membersihkan elemen internal
                console.log("Scanner dihentikan dan dibersihkan.");
            } catch (err) {
                console.warn("Gagal menghentikan/membersihkan scanner:", err);
            }
            isScannerActivelyScanning = false;
        }
        const readerFullDiv = document.getElementById('readerFull');
        if (readerFullDiv) readerFullDiv.innerHTML = '';
        if (qrScanResult) qrScanResult.textContent = '';
        isScannerInitialized = false; // Ini mungkin tidak perlu jika hanya untuk full screen
        html5QrCodeFullInstance = null;
    }

    async function onScanSuccess(decodedText, decodedResult) {
        if (isProcessingScan) {
            console.warn("Scan diabaikan karena sedang memproses scan sebelumnya.");
            return;
        }
        isProcessingScan = true;

        console.log(`QR Code terdeteksi: ${decodedText}`);
        if (qrScanResult) qrScanResult.textContent = `Memproses...`;

        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            showSweetAlert('Error Autentikasi', 'User tidak terautentikasi. Silakan login kembali.', 'error', true);
            if (qrScanResult) qrScanResult.textContent = 'Error: User tidak terautentikasi.';
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

            if (qrScanResult) qrScanResult.textContent = response.message;
            await stopAndClearScanner();
            const readerFullDiv = document.getElementById('readerFull');
            if (readerFullDiv) readerFullDiv.innerHTML = '<p class="text-gray-500 mt-8">Absensi berhasil!</p>';
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

            if (qrScanResult) qrScanResult.textContent = `Gagal Absen: ${message}.`;
            await stopAndClearScanner();
            const readerFullDiv = document.getElementById('readerFull');
            if (readerFullDiv) readerFullDiv.innerHTML = `<p class="text-${icon === 'info' ? 'blue' : 'red'}-600 mt-8">Absensi gagal: ${message}. Harap coba lagi atau hubungi admin.</p>`;

            loadMyTodayAttendance();

        } finally {
            isProcessingScan = false;
        }
    }

    function onScanFailure(error) {
        // Ini adalah fungsi callback untuk setiap frame yang gagal mendeteksi QR.
        // Sebaiknya tidak menampilkan toast atau SweetAlert di sini, karena akan terlalu sering.
        // console.warn(`Scan gagal: ${error}`);
    }

    // Fungsi startScanner asli yang tidak digunakan karena sekarang ada openFullscreenScanner
    // Komentar ini mengindikasikan bahwa ini tidak aktif.
    /*
    async function startScanner() {
        // ... (kode lama) ...
    }
    */


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
                const readerFullDiv = document.getElementById('readerFull');
                if (readerFullDiv) readerFullDiv.innerHTML = `<p class="text-gray-500 mt-8">${messageText}</p>`;
                showSweetAlert('Status Absensi', messageText, 'info');
            } else {
                console.log("Belum absen, scanner akan dimulai saat tombol 'Scan QR Code' diklik.");
            }

        } catch (error) {
            console.error('Error loading my today attendance:', error);
            showSweetAlert('Error Memuat Status Absensi', `Gagal memuat status absensi: ${error.message}.`, 'error', true);
            updateAttendanceStatusUI(null);
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
                    if (profilePhoto) profilePhoto.src = photoUrl;
                    if (userAvatarNav) {
                        userAvatarNav.src = photoUrl;
                        userAvatarNav.alt = employeeData.name;
                    }
                } catch (e) {
                    console.error("Error fetching profile photo:", e);
                    const fallback = "https://via.placeholder.com/96x96/E2E8F0/4A5568?text=ME";
                    if (profilePhoto) profilePhoto.src = fallback;
                    if (userAvatarNav) {
                        userAvatarNav.src = fallback;
                        userAvatarNav.alt = employeeData.name;
                    }
                }

                if (employeeName) employeeName.textContent = employeeData.name;
                if (employeePosition) employeePosition.textContent = employeeData.position || "-";
                if (employeeDepartment) employeeDepartment.textContent = employeeData.department || "-";

                if (employeeData.annual_leave_balance !== undefined && employeeData.annual_leave_balance !== null) {
                    if (remainingLeave) remainingLeave.textContent = `${employeeData.annual_leave_balance} Hari`;
                } else {
                    if (remainingLeave) remainingLeave.textContent = `N/A`;
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


    // === FULLSCREEN QR SCANNER HANDLING (Updated and Cleaned) ===
    window.openFullscreenScanner = async function () {
        const fullscreenContainer = document.getElementById('qrFullscreenContainer');
        const readerFullDiv = document.getElementById('readerFull');
        const closeButton = document.getElementById('closeScannerBtn');
        const qrScanResultText = document.getElementById('qr-scan-result');

        // Pastikan semua elemen penting ditemukan
        if (!readerFullDiv || !closeButton || !fullscreenContainer || !qrScanResultText) {
            console.error("Salah satu elemen penting untuk fullscreen scanner tidak ditemukan.");
            showSweetAlert('Error Inisialisasi', 'Elemen scanner tidak lengkap di halaman. Pastikan ID HTML sudah benar.', 'error', true);
            return;
        }

        // Tampilkan modal dan reset kontennya
        fullscreenContainer.classList.remove('hidden');
        readerFullDiv.innerHTML = ''; // Kosongkan div readerFull
        qrScanResultText.textContent = "Memulai kamera..."; // Pesan awal

        // Pastikan tidak ada instance scanner lama yang aktif dan menghentikannya
        if (html5QrCodeFullInstance && html5QrCodeFullInstance.isScanning) {
            try {
                await html5QrCodeFullInstance.stop();
                console.log("Scanner sebelumnya dihentikan sebelum memulai yang baru.");
            } catch (e) {
                console.warn("Gagal menghentikan scanner sebelumnya:", e);
            }
        }
        
        // Buat instance baru setiap kali modal dibuka
        html5QrCodeFullInstance = new Html5Qrcode(readerFullDiv.id);

        try {
            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                qrScanResultText.textContent = `Tidak ada kamera tersedia.`;
                showSweetAlert('Kamera Tidak Ditemukan', 'Tidak ada kamera yang ditemukan di perangkat Anda.', 'error', true);
                fullscreenContainer.classList.add('hidden');
                return;
            }

            let cameraIdToUse = null;

            // PRIORITAS 1: Cari kamera dengan facingMode 'environment' (kamera belakang)
            const rearCamera = cameras.find(camera => camera.facingMode === 'environment');
            if (rearCamera) {
                cameraIdToUse = rearCamera.id;
                console.log("[Fullscreen Scanner] Kamera belakang 'environment' ditemukan:", rearCamera.label || rearCamera.id);
            } else {
                // PRIORITAS 2: Jika 'environment' tidak ditemukan, cari kamera yang BUKAN 'user' (kamera depan)
                const nonUserCamera = cameras.find(camera => camera.facingMode !== 'user');
                if (nonUserCamera) {
                    cameraIdToUse = nonUserCamera.id;
                    console.log("[Fullscreen Scanner] Kamera non-'user' ditemukan (kemungkinan belakang):", nonUserCamera.label || nonUserCamera.id);
                } else {
                    // PRIORITAS 3: Jika semua di atas gagal, gunakan kamera pertama yang tersedia
                    cameraIdToUse = cameras[0].id;
                    console.warn("[Fullscreen Scanner] Tidak dapat menentukan kamera belakang. Menggunakan kamera pertama yang tersedia:", cameras[0].label || cameras[0].id);
                }
            }

            await html5QrCodeFullInstance.start(
                { deviceId: { exact: cameraIdToUse } },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                async (decodedText) => {
                    showToast("QR Code terdeteksi. Memproses absensi...", "info");
                    // Hentikan scanner segera setelah deteksi berhasil
                    await html5QrCodeFullInstance.stop();
                    // Sembunyikan modal setelah scan
                    fullscreenContainer.classList.add('hidden');
                    // Panggil fungsi utama absensi
                    await onScanSuccess(decodedText, null);
                },
                (err) => {
                    // onScanFailure bisa diabaikan atau log jika perlu
                    // console.warn("[Fullscreen Scanner] Scan gagal:", err);
                }
            );
            isScannerActivelyScanning = true;
            qrScanResultText.textContent = "Pindai QR Code untuk Absen...";
            console.log("[Fullscreen Scanner] Scanner berhasil dimulai.");
            showToast('Kamera Berhasil Dibuka!', 'success');

        } catch (err) {
            console.error("[Fullscreen Scanner] Gagal memulai scanner:", err);
            qrScanResultText.textContent = `Gagal memuat scanner: ${err.message}.`;
            readerFullDiv.innerHTML = `<p class="text-red-600 mt-8">Gagal memuat scanner: ${err.message}. Pastikan kamera diizinkan.</p>`;
            showSweetAlert('Gagal Membuka Kamera', `Gagal memulai scanner: ${err.message}. Pastikan kamera diizinkan dan tidak sedang digunakan aplikasi lain.`, 'error', true);
            fullscreenContainer.classList.add('hidden');
            isScannerActivelyScanning = false;
        }
    };


    // --- Event Listeners UI Umum ---
    if (userDropdownContainer) {
        userDropdownContainer.addEventListener("click", (e) => {
            e.stopPropagation();
            if (dropdownMenu) dropdownMenu.classList.toggle("active");
        });
        document.addEventListener("click", (event) => {
            if (dropdownMenu && userDropdownContainer && !userDropdownContainer.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove("active");
            }
        });
    }

    // Event listener untuk tombol tutup scanner fullscreen
    const closeScannerBtn = document.getElementById('closeScannerBtn');
    if (closeScannerBtn) {
        closeScannerBtn.addEventListener("click", async () => {
            const fullscreenContainer = document.getElementById('qrFullscreenContainer');
            if (html5QrCodeFullInstance) {
                try {
                    await html5QrCodeFullInstance.stop();
                    console.log("Scanner fullscreen dihentikan via tombol tutup.");
                } catch (e) {
                    console.warn("Gagal menghentikan scanner fullscreen via tombol tutup:", e);
                }
            }
            if (fullscreenContainer) fullscreenContainer.classList.add('hidden');
            const readerFullDiv = document.getElementById('readerFull');
            if (readerFullDiv) readerFullDiv.innerHTML = '';
            if (qrScanResult) qrScanResult.textContent = '';
            isScannerActivelyScanning = false;
            html5QrCodeFullInstance = null;
        });
    }

    // Memuat data profil dan absensi saat halaman dimuat
    const currentUser = await fetchEmployeeProfileData();
    if (currentUser) {
        loadMyTodayAttendance();
    }
});