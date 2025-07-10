// js/Karyawan/EmployeeDashboard.js

import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import AttendanceService from '../Services/AttendanceServices.js';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace();

    // --- Seleksi Elemen DOM ---
    const profilePhoto = document.getElementById("profilePhoto");
    const employeeName = document.getElementById("employeeName");
    const employeePosition = document.getElementById("employeePosition");
    const employeeDepartment = document.getElementById("employeeDepartment");
    // Diperbarui: todayAttendanceStatusSummary untuk kartu ringkasan
    const todayAttendanceStatusSummary = document.getElementById("todayAttendanceStatus");
    const remainingLeave = document.getElementById("remainingLeave"); // Elemen untuk sisa cuti
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

    // Change Password Modal elements
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

    // QR Scanner elements (Pastikan ID ini ada di HTML terbaru Anda)
    const qrScannerContainer = document.getElementById('reader'); // Ini adalah container tempat video feed akan dirender
    const qrScanResult = document.getElementById('qr-scan-result');
    const notificationMessage = document.getElementById('notification-message');
    const cameraSelect = document.getElementById('camera-select'); // Elemen dropdown kamera

    let html5QrCodeScanner; // Variabel untuk instance Html5QrcodeScanner

    // Today's Attendance Status detail elements (Pastikan ID ini ada di HTML terbaru Anda)
    const currentDateSpan = document.getElementById('current-date');
    const checkInTimeSpan = document.getElementById('check-in-time');
    const attendanceStatusSpan = document.getElementById('attendance-status');
    const checkOutDisplay = document.getElementById('check-out-display');
    const checkOutTimeSpan = document.getElementById('check-out-time');
    const attendanceNoteDisplay = document.getElementById('attendance-note-display');
    const attendanceNoteSpan = document.getElementById('attendance-note');


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

    // --- Fungsi untuk memuat data profil karyawan ---
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

            if (user.role !== 'karyawan') { // Sesuaikan dengan role karyawan di database Anda
                showToast("Akses ditolak. Peran tidak sesuai untuk halaman ini.", "error");
                setTimeout(() => authService.logout(), 2000);
                return null;
            }

            // authToken sudah ditangani oleh interceptor di userService, jadi tidak perlu diteruskan di sini.
            // Pastikan getUserByID di UserService.js tidak lagi menerima parameter token
            const employeeData = await userService.getUserByID(user.id);

            if (employeeData) {
                profilePhoto.src = employeeData.photo || "https://via.placeholder.com/80/4A5568/E2E8F0?text=ME";
                employeeName.textContent = employeeData.name;
                employeePosition.textContent = employeeData.position || "-";
                employeeDepartment.textContent = employeeData.department || "-";

                // --- KOREKSI: Tampilkan sisa cuti dari data karyawan ---
                if (employeeData.annual_leave_balance !== undefined && employeeData.annual_leave_balance !== null) {
                    remainingLeave.textContent = `${employeeData.annual_leave_balance} Hari`;
                } else {
                    remainingLeave.textContent = `N/A`; // Atau default lain jika data tidak ada
                }

                if (userAvatarNav) {
                    userAvatarNav.src = employeeData.photo || "https://via.placeholder.co/40x40/E2E8F0/4A5568?text=ME";
                    userAvatarNav.alt = employeeData.name;
                }
            }
            return employeeData;
        } catch (error) {
            console.error("Error fetching employee profile data:", error);
            showToast(error.message || "Gagal memuat data profil.", "error");
            if (error.status === 401 || (error.message && (error.message.includes('token') || error.message.includes('sesi') || error.message.includes('Peran tidak sesuai') || error.message.includes('Data pengguna di sesi rusak')))) {
                setTimeout(() => authService.logout(), 2000);
            }
            return null;
        }
    };

    // --- Helper Functions untuk Absensi ---
    const formatTime = (timeString) => {
        return timeString || '-';
    };

    const updateAttendanceStatusUI = (attendance) => {
        const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        currentDateSpan.textContent = today;
        attendanceStatusSpan.className = ''; // Reset class sebelum menambahkan yang baru
        todayAttendanceStatusSummary.classList.remove('text-gray-900', 'text-green-600', 'text-red-600', 'text-orange-600'); // Reset warna summary

        if (attendance) {
            // Set status dan warna untuk ringkasan
            todayAttendanceStatusSummary.textContent = attendance.status; // Gunakan status dari data absensi
            if (attendance.status === 'Hadir') {
                todayAttendanceStatusSummary.classList.add('text-green-600');
            } else if (attendance.status === 'Telat') {
                todayAttendanceStatusSummary.classList.add('text-orange-600');
            } else if (attendance.status === 'Sakit' || attendance.status === 'Cuti') {
                todayAttendanceStatusSummary.classList.add('text-blue-600'); // Atau warna lain untuk non-hadir
            } else {
                todayAttendanceStatusSummary.classList.add('text-gray-900'); // Default
            }

            // Perbarui detail absensi
            checkInTimeSpan.textContent = formatTime(attendance.check_in);
            attendanceStatusSpan.textContent = attendance.status;

            if (attendance.status === 'Hadir') {
                attendanceStatusSpan.classList.add('text-green-600', 'font-semibold');
            } else if (attendance.status === 'Telat') {
                attendanceStatusSpan.classList.add('text-orange-600', 'font-semibold');
            } else if (attendance.status === 'Sakit' || attendance.status === 'Cuti') {
                // Untuk status Sakit/Cuti, mungkin tidak ada check-in/out, tapi statusnya penting
                checkInTimeSpan.textContent = '-'; // Tidak ada check-in time
                attendanceStatusSpan.classList.add('text-blue-600', 'font-semibold'); // Warna untuk cuti/sakit
                // Sembunyikan bagian check-out jika statusnya Sakit/Cuti
                checkOutDisplay.classList.add('hidden');
            } else {
                attendanceStatusSpan.classList.add('text-gray-600', 'font-semibold');
            }

            // Tampilkan atau sembunyikan waktu check-out
            if (attendance.check_out) {
                checkOutDisplay.classList.remove('hidden');
                checkOutTimeSpan.textContent = formatTime(attendance.check_out);
            } else {
                checkOutDisplay.classList.add('hidden');
                checkOutTimeSpan.textContent = '';
            }

            // Tampilkan atau sembunyikan catatan
            if (attendance.note) {
                attendanceNoteDisplay.classList.remove('hidden');
                attendanceNoteSpan.textContent = attendance.note;
            } else {
                attendanceNoteDisplay.classList.add('hidden');
                attendanceNoteSpan.textContent = '';
            }
        } else {
            // Jika tidak ada data absensi untuk hari ini
            todayAttendanceStatusSummary.textContent = "Belum Absen";
            todayAttendanceStatusSummary.classList.add('text-red-600');

            checkInTimeSpan.textContent = '-';
            attendanceStatusSpan.textContent = 'Belum Absen';
            attendanceStatusSpan.classList.add('text-red-600', 'font-semibold');
            checkOutDisplay.classList.add('hidden');
            attendanceNoteDisplay.classList.add('hidden');
        }
    };

    const loadMyTodayAttendance = async () => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            showToast('Gagal memuat status absensi: User tidak terautentikasi.', 'error');
            return;
        }

        try {
            // Pastikan getMyHistory di AttendanceService tidak membutuhkan token di parameternya
            const history = await AttendanceService.getMyHistory();
            const today = new Date().toISOString().slice(0, 10);
            // Mencari absensi untuk hari ini
            const todayAttendance = history.find(att => att.date === today);

            updateAttendanceStatusUI(todayAttendance);

            // Logic untuk scanner QR
            if (todayAttendance && (todayAttendance.status === 'Hadir' || todayAttendance.status === 'Telat')) {
                // Jika sudah hadir/telat, hentikan scanner
                if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
                    await html5QrCodeScanner.stop();
                    showToast('Anda sudah check-in hari ini.', 'info');
                }
                if (qrScannerContainer) {
                    qrScannerContainer.innerHTML = '<p class="text-gray-500 mt-8">Anda sudah absen hari ini.</p>';
                    qrScanResult.textContent = '';
                }
                if (cameraSelect) cameraSelect.classList.add('hidden');
            } else if (todayAttendance && (todayAttendance.status === 'Sakit' || todayAttendance.status === 'Cuti')) {
                // Jika statusnya Sakit atau Cuti, tidak perlu scanner
                if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
                    await html5QrCodeScanner.stop();
                    showToast(`Status Anda hari ini: ${todayAttendance.status}.`, 'info');
                }
                if (qrScannerContainer) {
                    qrScannerContainer.innerHTML = `<p class="text-gray-500 mt-8">Status Anda hari ini: ${todayAttendance.status}.</p>`;
                    qrScanResult.textContent = '';
                }
                if (cameraSelect) cameraSelect.classList.add('hidden');
            }
            else {
                // Jika belum ada absensi atau statusnya belum Hadir/Telat/Sakit/Cuti (misal: "Izin")
                startScanner();
            }

        } catch (error) {
            console.error('Error loading my today attendance:', error);
            showToast(`Gagal memuat status absensi: ${error.message}`, 'error');
            currentDateSpan.textContent = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
            checkInTimeSpan.textContent = 'Gagal memuat';
            attendanceStatusSpan.textContent = 'Error';
            attendanceStatusSpan.classList.add('text-red-600', 'font-semibold');
            // Tetap coba mulai scanner jika ada error dan belum ada status yang jelas
            startScanner();
        }
    };


    // --- QR Scanner Logic ---
    const onScanSuccess = async (decodedText, decodedResult) => {
        console.log(`QR Code terdeteksi: ${decodedText}`);
        qrScanResult.textContent = `Memindai: ${decodedText}`;

        if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
            await html5QrCodeScanner.stop();
        }

        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            showToast('User tidak terautentikasi. Silakan login kembali.', 'error');
            qrScanResult.textContent = 'Error: User tidak terautentikasi.';
            startScanner(); // Coba restart scanner jika gagal
            return;
        }

        try {
            // Pastikan scanQR di AttendanceService tidak membutuhkan token di parameternya
            const response = await AttendanceService.scanQR(decodedText, currentUser.id);
            showToast(response.message, 'success');
            qrScanResult.textContent = response.message;
            loadMyTodayAttendance(); // Muat ulang status setelah absensi berhasil
        } catch (error) {
            console.error('Error saat memindai QR Code:', error);
            showToast(`Absensi gagal: ${error.message}`, 'error');
            qrScanResult.textContent = `Gagal Absen: ${error.message}`;
            startScanner(); // Coba restart scanner jika gagal
        }
    };

    const onScanError = (errorMessage) => {
        // console.warn(`QR Code error: ${errorMessage}`); // Biasanya terlalu berisik, bisa dikomentari
    };

    const startScanner = async () => {
        if (!qrScannerContainer) {
            console.error("QR scanner container #reader not found.");
            showToast("Gagal memulai scanner: Elemen HTML tidak ditemukan.", "error");
            return;
        }

        // Hapus konten lama untuk mencegah tumpang tindih
        qrScannerContainer.innerHTML = '';
        qrScanResult.textContent = '';


        try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
                let cameraIdToUse = cameras[0].id; // Default: kamera pertama

                if (cameras.length > 1) {
                    if (cameraSelect) cameraSelect.classList.remove('hidden');
                    if (cameraSelect) cameraSelect.innerHTML = '';
                    cameras.forEach(camera => {
                        const option = document.createElement('option');
                        option.value = camera.id;
                        option.textContent = camera.label || `Kamera ${camera.id}`;
                        if (cameraSelect) cameraSelect.appendChild(option);
                    });

                    const backCamera = cameras.find(camera =>
                        camera.label.toLowerCase().includes('back') ||
                        camera.label.toLowerCase().includes('environment')
                    );
                    if (cameraSelect) cameraSelect.value = backCamera ? backCamera.id : cameras[0].id;
                    cameraIdToUse = (cameraSelect && cameraSelect.value) ? cameraSelect.value : cameras[0].id;
                } else {
                    if (cameraSelect) cameraSelect.classList.add('hidden');
                }

                if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
                    await html5QrCodeScanner.stop();
                }

                // Re-initialize Html5QrcodeScanner with specific camera constraints
                html5QrCodeScanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: 250,
                        aspectRatio: 1.333333,
                        disableFlip: false,
                        videoConstraints: {
                            deviceId: { exact: cameraIdToUse }
                        }
                    },
                    /* verbose= */ false
                );

                await html5QrCodeScanner.render(onScanSuccess, onScanError);

                qrScanResult.textContent = 'Siap memindai QR Code...';

            } else {
                showToast("Tidak ada kamera yang ditemukan.", "error");
                qrScanResult.textContent = 'Tidak ada kamera yang ditemukan.';
                qrScannerContainer.innerHTML = '<p class="text-red-500 mt-8">Gagal mengakses kamera. Pastikan browser memiliki izin dan kamera terhubung.</p>';
                if (cameraSelect) cameraSelect.classList.add('hidden');
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            showToast(`Gagal mengakses kamera: ${err.message}`, "error");
            qrScanResult.textContent = 'Gagal mengakses kamera.';
            qrScannerContainer.innerHTML = '<p class="text-red-500 mt-8">Gagal mengakses kamera. Pastikan browser memiliki izin dan kamera terhubung.</p>';
            if (cameraSelect) cameraSelect.classList.add('hidden');
        }
    };

    // Event listener untuk perubahan pilihan kamera
    if (cameraSelect) {
        cameraSelect.addEventListener('change', async () => {
            if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
                await html5QrCodeScanner.stop();
            }
            startScanner();
        });
    }


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
            // authToken sudah ditangani oleh interceptor di authService, jadi tidak perlu diteruskan di sini.
            // const token = localStorage.getItem('token'); // Tidak perlu variabel ini jika tidak digunakan

            try {
                // Hapus parameter 'token' jika authService.changePassword sudah menggunakan apiClient dengan interceptor
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

    // --- Inisialisasi Halaman ---
    const currentUser = await fetchEmployeeProfileData();
    if (currentUser) {
        loadMyTodayAttendance();
    }
});