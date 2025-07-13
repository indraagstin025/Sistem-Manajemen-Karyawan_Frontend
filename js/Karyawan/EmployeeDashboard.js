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
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword"); // Perbaikan typo: hapus duplikat document =
    const changePasswordErrorMessage = document.getElementById("changePasswordErrorMessage");
    const changePasswordSuccessMessage = document.getElementById("changePasswordSuccessMessage");

    // QR Scanner elements
    const qrScannerContainer = document.getElementById('reader');
    const qrScanResult = document.getElementById('qr-scan-result');
    const cameraSelect = document.getElementById('camera-select');

    let html5QrCodeInstance = null;
    let isProcessingScan = false;
    let isScannerInitialized = false;

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


    // --- Helper Functions untuk Absensi ---
    const formatTime = (timeString) => {
        return timeString || '-';
    };

    const updateAttendanceStatusUI = (attendance) => {
        const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
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
                checkOutDisplay.classList.add('hidden');
            } else {
                attendanceStatusSpan.classList.add('text-gray-600', 'font-semibold');
            }

            if (attendance.check_out) {
                checkOutDisplay.classList.remove('hidden');
                checkOutTimeSpan.textContent = formatTime(attendance.check_out);
            } else {
                checkOutDisplay.classList.add('hidden');
                checkOutTimeSpan.textContent = '';
            }

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
            checkOutDisplay.classList.add('hidden');
            attendanceNoteDisplay.classList.add('hidden');
        }
    };

    // Fungsi helper untuk menghentikan dan membersihkan scanner
// GANTIKAN fungsi onScanSuccess yang lama di EmployeeDashboard.js dengan yang ini

const onScanSuccess = async (decodedText, decodedResult) => {
    // 1. Abaikan scan baru jika yang lama masih diproses
    if (isProcessingScan) {
        console.log("Pemindaian sebelumnya masih diproses, scan baru diabaikan.");
        return;
    }
    isProcessingScan = true;

    // 2. Jeda pemindai (seperti pada demo scanapp.org)
    // Ini menghentikan kamera sementara tanpa harus me-restart-nya.
    if (html5QrCodeInstance && html5QrCodeInstance.isScanning) {
        try {
            await html5QrCodeInstance.pause(true); // 'true' akan membekukan frame video
            console.log("Scanner dijeda.");
        } catch(e) {
            console.warn("Gagal menjeda scanner, mungkin sudah tidak aktif.", e);
        }
    }

    qrScanResult.textContent = `Memproses QR Code...`;
    
    // 3. Ambil informasi pengguna saat ini
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
        showToast('Sesi tidak valid. Silakan login kembali.', 'error');
        qrScannerContainer.innerHTML = `<p class="text-red-600 font-semibold mt-8">Error: Sesi pengguna tidak ditemukan.</p>`;
        isProcessingScan = false;
        return;
    }

    try {
        // 4. Kirim data QR ke server
        const response = await AttendanceService.scanQR(decodedText, currentUser.id);
        const attendanceData = response.data; // Asumsi API mengembalikan detail di 'data'

        showToast(response.message, 'success');

        // 5. Tampilkan hasil yang kaya informasi (Mirip Demo)
        qrScannerContainer.innerHTML = `
            <div class="text-center p-4 bg-white rounded-lg">
                <i data-feather="check-circle" class="w-16 h-16 text-green-500 mx-auto mb-3"></i>
                <h3 class="text-xl font-bold text-gray-800">${attendanceData?.employee_name || ''}</h3>
                <p class="text-lg text-green-600 font-semibold">${response.message}</p>
                <div class="text-left mt-4 mx-auto max-w-xs border-t pt-3">
                    <p class="text-gray-600"><strong>Status:</strong> ${attendanceData?.status || 'N/A'}</p>
                    <p class="text-gray-600"><strong>Waktu:</strong> ${attendanceData?.check_in_time || 'N/A'}</p>
                </div>
                <p class="text-xs text-gray-400 mt-4">Scanner akan dinonaktifkan.</p>
            </div>
        `;
        feather.replace(); // Penting untuk merender ikon baru

        // 6. Matikan scanner secara permanen karena tugas selesai
        // Anda bisa memanggil `stopAndClearScanner()` di sini jika ingin mematikan total.
        // Karena status sudah berhasil, kita tidak perlu scan lagi hari ini.
        // Fungsi `loadMyTodayAttendance` akan menangani logika untuk tidak memulai scanner lagi.
        await stopAndClearScanner();
        loadMyTodayAttendance(); // Refresh UI utama dengan data baru

    } catch (error) {
        const message = error?.response?.data?.error || error.message || 'Terjadi kesalahan.';
        
        // Buat tombol untuk memulai ulang scanner secara manual
        const retryButtonHTML = `
            <button id="retryScanBtn" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all">
                Pindai Ulang
            </button>
        `;

        if (error.response?.status === 409) {
            // Jika sudah absen (Conflict)
            showToast(message, 'info');
            qrScannerContainer.innerHTML = `
                <div class="text-center p-4">
                    <i data-feather="alert-triangle" class="w-16 h-16 text-orange-500 mx-auto mb-3"></i>
                    <p class="text-orange-600 font-semibold">${message}</p>
                    <p class="text-xs text-gray-400 mt-2">Anda sudah melakukan absensi sebelumnya.</p>
                </div>
            `;
            await stopAndClearScanner(); // Matikan scanner karena sudah ada data
            loadMyTodayAttendance();
        } else {
            // Jika error lain (koneksi, server error, dll)
            showToast(`Absensi gagal: ${message}`, 'error');
            qrScannerContainer.innerHTML = `
                <div class="text-center p-4">
                    <i data-feather="x-octagon" class="w-16 h-16 text-red-500 mx-auto mb-3"></i>
                    <p class="text-red-600 font-semibold">Gagal Absen: ${message}</p>
                    ${retryButtonHTML}
                </div>
            `;
            // Tambahkan event listener ke tombol baru
            document.getElementById('retryScanBtn').addEventListener('click', startScanner);
        }
        feather.replace(); // Render ikon error
    } finally {
        // 7. Reset flag agar scan lain bisa diproses jika diperlukan
        isProcessingScan = false;
    }
};

    const onScanFailure = (error) => {
        // Biarkan kosong untuk menghindari log yang berlebihan di console
    };

    async function startScanner() {
        if (isScannerInitialized || isProcessingScan) {
            console.log("Scanner sudah berjalan atau sedang memproses.");
            return;
        }
        
        await stopAndClearScanner(); // Pastikan state bersih sebelum memulai
        isScannerInitialized = true; // Set flag di awal untuk mencegah pemanggilan ganda

        try {
            if (!qrScannerContainer) {
                console.error("Elemen 'reader' tidak ditemukan di DOM.");
                isScannerInitialized = false;
                return;
            }
            
            const cameras = await Html5Qrcode.getCameras();
            if (cameras.length === 0) {
                qrScannerContainer.innerHTML = '<p class="text-red-600 mt-8">Tidak ada kamera yang ditemukan.</p>';
                isScannerInitialized = false;
                return;
            }

            const defaultCameraId = cameras[0].id;

            cameraSelect.innerHTML = "";
            cameras.forEach((cam) => {
                const option = document.createElement("option");
                option.value = cam.id;
                option.text = cam.label || `Kamera ${cameras.indexOf(cam) + 1}`;
                cameraSelect.appendChild(option);
            });
            cameraSelect.classList.remove("hidden");
            cameraSelect.value = defaultCameraId;

            cameraSelect.removeEventListener("change", handleCameraChange);
            cameraSelect.addEventListener("change", handleCameraChange);

            html5QrCodeInstance = new Html5Qrcode("reader", { verbose: false });

            await html5QrCodeInstance.start(
                { deviceId: { exact: defaultCameraId } },
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                onScanSuccess,
                onScanFailure
            );
            qrScanResult.textContent = "Pindai QR Code untuk Absen...";

        } catch (err) {
            console.error("Gagal memulai scanner:", err);
            qrScannerContainer.innerHTML = `<p class="text-red-600 mt-8">Gagal memuat scanner. Pastikan izin kamera diberikan.</p>`;
            cameraSelect.classList.add("hidden");
            isScannerInitialized = false;
        }
    }

    async function handleCameraChange(e) {
        const selectedCameraId = e.target.value;
        await restartScanner(selectedCameraId);
    }

    async function restartScanner(cameraId) {
        isScannerInitialized = false; // Reset flag untuk memulai ulang
        await startScanner(); // Cukup panggil startScanner lagi, ia akan menangani pembersihan
    }

    // --- Change Password Modal Logic --- (Kode ini tidak diubah, jadi saya lipat)
    // [ ... Kode Change Password Anda di sini ... ]
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


    // --- Event Listeners UI Umum --- (Kode ini tidak diubah, jadi saya lipat)
    // [ ... Kode UI Listeners Anda di sini ... ]
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