// js/Karyawan/EmployeeDashboard.js

import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import AttendanceService from "../Services/AttendanceServices.js";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import Swal from "sweetalert2";

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
  const qrScanResult = document.getElementById("qr-scan-result"); // ✅ Ini yang ditambahkan ke HTML

  // Elemen untuk detail absensi hari ini
  const currentDateSpan = document.getElementById("current-date");
  const checkInTimeSpan = document.getElementById("check-in-time");
  const attendanceStatusSpan = document.getElementById("attendance-status");
  const attendanceNoteDisplay = document.getElementById("attendance-note-display");
  const attendanceNoteSpan = document.getElementById("attendance-note");

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
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });
  }

  // Fungsi showToast untuk notifikasi kamera berhasil dibuka (posisi tengah)
  function showToast(message, type = "success") {
    let backgroundColor;
    if (type === "success") {
      backgroundColor = "linear-gradient(to right, #22c55e, #16a34a)";
    } else if (type === "error") {
      backgroundColor = "linear-gradient(to right, #ef4444, #dc2626)";
    } else {
      // info
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
        padding: "12px 20px",
      },
    }).showToast();
  }

  // --- Helper Functions untuk Absensi ---
  function formatTime(timeString) {
    return timeString || "-";
  }

  function updateAttendanceStatusUI(attendance) {
    const today = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
    if (currentDateSpan) currentDateSpan.textContent = today;
    if (attendanceStatusSpan) attendanceStatusSpan.className = "";
    if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.className = "text-lg font-bold";

    if (attendance) {
      const displayStatus = attendance.status;
      if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.textContent = displayStatus;

      if (displayStatus === "Tepat Waktu") {
        if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.classList.add("text-green-600");
        if (attendanceStatusSpan) attendanceStatusSpan.classList.add("text-green-600", "font-semibold");
      } else if (displayStatus === "Terlambat") {
        if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.classList.add("text-orange-500");
        if (attendanceStatusSpan) attendanceStatusSpan.classList.add("text-orange-500", "font-semibold");
      } else if (["Sakit", "Cuti", "Izin"].includes(displayStatus)) {
        if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.classList.add("text-blue-600");
        if (attendanceStatusSpan) attendanceStatusSpan.classList.add("text-blue-600", "font-semibold");
        if (checkInTimeSpan) checkInTimeSpan.textContent = "-";
      } else {
        if (todayAttendanceStatusSummary) todayAttendanceStatusSummary.classList.add("text-red-600");
        if (attendanceStatusSpan) attendanceStatusSpan.classList.add("text-red-600", "font-semibold");
        if (checkInTimeSpan) checkInTimeSpan.textContent = "-";
      }

      if (attendance.check_in) {
        if (checkInTimeSpan) checkInTimeSpan.textContent = formatTime(attendance.check_in);
      }

      if (attendanceStatusSpan) attendanceStatusSpan.textContent = displayStatus;
    } else {
      if (todayAttendanceStatusSummary) {
        todayAttendanceStatusSummary.textContent = "Belum Absen";
        todayAttendanceStatusSummary.classList.add("text-red-600");
      }

      if (checkInTimeSpan) checkInTimeSpan.textContent = "-";
      if (attendanceStatusSpan) {
        attendanceStatusSpan.textContent = "Belum Absen";
        attendanceStatusSpan.classList.add("text-red-600", "font-semibold");
      }
    }
  }

  async function stopAndClearScanner() {
    if (html5QrCodeFullInstance && html5QrCodeFullInstance.isScanning) {
      // ✅ Pastikan 'isScanning' adalah properti yang benar
      try {
        await html5QrCodeFullInstance.stop();
        await html5QrCodeFullInstance.clear(); // Clear juga diperlukan untuk membersihkan elemen internal
        console.log("Scanner dihentikan dan dibersihkan.");
      } catch (err) {
        console.warn("Gagal menghentikan/membersihkan scanner:", err);
      }
      isScannerActivelyScanning = false;
    }
    const readerFullDiv = document.getElementById("readerFull");
    if (readerFullDiv) readerFullDiv.innerHTML = "";
    if (qrScanResult) qrScanResult.textContent = "";
    isScannerInitialized = false; // Ini mungkin tidak perlu jika hanya untuk full screen
    html5QrCodeFullInstance = null;
  }

/**
 * ✅ FUNGSI UTAMA UNTUK MEMPROSES DATA ABSENSI KE SERVER
 * Menggunakan logika asli Anda untuk memastikan kompatibilitas dengan backend.
 */
async function onScanSuccess(decodedText) {
    console.log(`INFO: QR Code terdeteksi, data: ${decodedText}. Memulai proses absensi.`);

    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
        showSweetAlert("Error Autentikasi", "Sesi pengguna tidak valid. Silakan login kembali.", "error");
        isProcessingScan = false; // Penting untuk mereset flag
        return;
    }

    try {
        // PENTING: Memanggil service dengan 'decodedText' dan 'currentUser.id'
        const response = await AttendanceService.scanQR(decodedText, currentUser.id);

        Swal.fire({
            title: "Absensi Berhasil!",
            text: response.message,
            icon: "success",
            confirmButtonText: "Selesai",
        });

        // Muat ulang data untuk memperbarui UI (misal: status jadi 'Hadir')
        loadMyTodayAttendance();

    } catch (error) {
        console.error("ERROR: Gagal saat memproses absensi di server:", error);
        const message = error?.response?.data?.error || error.message || "Terjadi kesalahan saat menghubungi server.";
        const icon = error.response?.status === 409 ? "info" : "error";
        const title = icon === "info" ? "Info Absensi" : "Absensi Gagal!";
        showSweetAlert(title, message, icon);
    } finally {
        // Reset flag agar pengguna bisa mencoba scan lagi jika terjadi error.
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

/**
 * ✅ FUNGSI UNTUK MENGONTROL UI BERDASARKAN STATUS ABSENSI
 * Tugasnya hanya mengelola tampilan, terutama tombol scan.
 */
async function loadMyTodayAttendance() {
    try {

        const history = await AttendanceService.getMyHistory();
        const today = new Date().toISOString().slice(0, 10);
        const todayAttendance = history.find(att => att.date === today);

        updateAttendanceStatusUI(todayAttendance);

        // Kondisi di mana pengguna dianggap sudah selesai absen hari ini
        const sudahAbsenLengkap = todayAttendance && ['Hadir', 'Telat', 'Sakit', 'Cuti', 'Izin'].includes(todayAttendance.status);

        if (scanQrButton) {
            if (sudahAbsenLengkap) {
                scanQrButton.disabled = true;
                scanQrButton.classList.add("bg-gray-400", "cursor-not-allowed");
                scanQrButton.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
                scanQrButton.innerText = "Anda Sudah Absen Hari Ini";
            } else {
                scanQrButton.disabled = false;
                scanQrButton.classList.remove("bg-gray-400", "cursor-not-allowed");
                scanQrButton.classList.add("bg-indigo-600", "hover:bg-indigo-700");
                scanQrButton.innerText = "Scan QR Code Absensi";
            }
        }

    } catch (error) {
        console.error("ERROR: Gagal memuat riwayat absensi:", error);
        updateAttendanceStatusUI(null);
        if (scanQrButton) scanQrButton.disabled = false;
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

      if (user.role !== "karyawan") {
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
      if (error.status === 401 || (error.message && (error.message.includes("token") || error.message.includes("sesi") || error.message.includes("Peran tidak sesuai") || error.message.includes("Data pengguna di sesi rusak")))) {
        setTimeout(() => authService.logout(), 2000);
      }
      return null;
    }
  };

/**
 * ✅ FUNGSI UNTUK MEMBUKA DAN MENGELOLA SCANNER FULLSCREEN
 * Tugasnya hanya mengurus kamera, lalu menyerahkan data ke 'onScanSuccess'.
 */
window.openFullscreenScanner = async function () {
    if (!qrFullscreenContainer || !readerFullDiv || !closeScannerBtn) {
        return console.error("ERROR: Elemen HTML untuk scanner fullscreen tidak ditemukan.");
    }

    isProcessingScan = false; // Selalu reset status saat membuka scanner
    qrFullscreenContainer.classList.remove("hidden");
    readerFullDiv.innerHTML = "";
    qrScanResultText.textContent = "Memulai kamera...";

    html5QrCodeFullInstance = new Html5Qrcode(readerFullDiv.id);

    try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) throw new Error("Kamera tidak ditemukan di perangkat ini.");

        const rearCamera = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1];
        console.log("INFO: Menggunakan kamera:", rearCamera.label);

        await html5QrCodeFullInstance.start(
            rearCamera.id, 
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            async (decodedText, decodedResult) => {
                if (isProcessingScan) return; // Mencegah pemanggilan ganda (race condition)
                isProcessingScan = true;

                if (html5QrCodeFullInstance?.isScanning) {
                    await html5QrCodeFullInstance.stop(); // Hentikan kamera SEGERA
                }
                
                qrFullscreenContainer.classList.add("hidden"); // Tutup modal
                showToast("QR Code terbaca, memproses...", "info");

                onScanSuccess(decodedText); // Serahkan data ke fungsi logika
            },
            (errorMessage) => { /* Abaikan error per frame */ }
        );
        qrScanResultText.textContent = "Arahkan kamera ke QR Code Absensi";

    } catch (err) {
        console.error("ERROR: Gagal memulai scanner:", err);
        showSweetAlert("Gagal Membuka Kamera", err.message, "error");
        qrFullscreenContainer.classList.add("hidden");
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
  const closeScannerBtn = document.getElementById("closeScannerBtn");
  if (closeScannerBtn) {
    closeScannerBtn.addEventListener("click", async () => {
      const fullscreenContainer = document.getElementById("qrFullscreenContainer");
      if (html5QrCodeFullInstance) {
        try {
          await html5QrCodeFullInstance.stop();
          console.log("Scanner fullscreen dihentikan via tombol tutup.");
        } catch (e) {
          console.warn("Gagal menghentikan scanner fullscreen via tombol tutup:", e);
        }
      }
      if (fullscreenContainer) fullscreenContainer.classList.add("hidden");
      const readerFullDiv = document.getElementById("readerFull");
      if (readerFullDiv) readerFullDiv.innerHTML = "";
      if (qrScanResult) qrScanResult.textContent = "";
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
