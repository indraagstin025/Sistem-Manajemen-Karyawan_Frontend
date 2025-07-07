import AttendanceService from "../Services/AttendanceServices.js";
import { authService, dashboardService } from "../Services/AuthServices.js";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

document.addEventListener("DOMContentLoaded", () => {
  feather.replace();

  // --- Seleksi Elemen DOM ---
  const totalKaryawanEl = document.getElementById("totalKaryawan");
  const karyawanAktifEl = document.getElementById("karyawanAktif");
  const karyawanCutiEl = document.getElementById("karyawanCuti");
  const totalDepartemenEl = document.getElementById("totalDepartemen");
  const chartCanvas = document.getElementById("departmentChart");
  const generateQrMenuBtn = document.getElementById("generate-qr-menu-btn");
  const generateQrMenuBtnMobile = document.getElementById("generate-qr-menu-btn-mobile");
  const logoutButton = document.getElementById("logoutButton");
  const logoutButtonMobile = document.getElementById("logoutButtonMobile");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileSidebar = document.getElementById("mobileSidebar");
  const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
  const closeSidebar = document.getElementById("closeSidebar");
  const userAvatarNav = document.getElementById("userAvatar");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const userDropdownContainer = document.getElementById("userDropdown");
  const dropdownLogoutButton = document.getElementById("dropdownLogoutButton");

  // --- Elemen DOM MODAL QR Code ---
  const qrCodeModal = document.getElementById("qrCodeModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalQrImageEl = document.getElementById("modal-qr-code-image");
  const modalQrPlaceholderEl = document.getElementById("modal-qr-placeholder");
  const modalQrExpiresAtEl = document.getElementById("modal-qr-expires-at");
  const modalGenerateQrBtn = document.getElementById("modal-generate-qr-btn"); // Tombol Refresh di modal
  const modalCloseQrBtn = document.getElementById("modal-close-qr-btn"); // Tombol Tutup di modal

  // --- Global Variable untuk Interval QR Code di MODAL ---
  let modalQrRefreshInterval;
  let modalQrCountdownInterval;
  let isRefreshingQrCode = false;
let hasScheduledRefresh = false;


  // --- Fungsi Utilitas untuk Toastify ---
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

  // --- Logika Modal QR Code ---

const displayModalQRCode = (qrData, isAutoRefresh = false) => {
  modalQrPlaceholderEl.classList.remove("hidden");
  modalQrPlaceholderEl.textContent = "Memuat QR Code...";
  modalCloseQrBtn.classList.remove("hidden");

  const expiryTime = new Date(qrData.expires_at);

  const fadeOutOldQR = () => {
    modalQrImageEl.classList.add("opacity-0", "scale-95");

    // Tunggu transisi selesai, lalu ganti QR dan tampilkan baru
    setTimeout(() => {
      modalQrImageEl.src = qrData.qr_code_image;

      // Sembunyikan placeholder, tampilkan gambar
      modalQrPlaceholderEl.classList.add("hidden");
      modalQrImageEl.classList.remove("hidden");

      // Sedikit delay agar perubahan src selesai → baru animasi fade in
      setTimeout(() => {
        modalQrImageEl.classList.remove("opacity-0", "scale-95");
        modalQrImageEl.classList.add("opacity-100", "scale-100");

        // Mulai countdown
        startModalQRCodeCountdown(expiryTime);
      }, 50);
    }, 300); // Menunggu fade-out selesai
  };

  if (isAutoRefresh) {
    fadeOutOldQR();
  } else {
    // Transisi masuk QR pertama kali (dengan delay)
    setTimeout(fadeOutOldQR, 300);
  }
};




const startModalQRCodeCountdown = (expiresAt) => {
  if (modalQrCountdownInterval) {
    clearInterval(modalQrCountdownInterval);
  }

  modalQrCountdownInterval = setInterval(() => {
    const now = new Date();
    const timeLeftMs = expiresAt.getTime() - now.getTime();
    const secondsLeft = Math.floor(timeLeftMs / 1000);

    modalQrExpiresAtEl.textContent = `QR Code kedaluwarsa dalam ${secondsLeft} detik`;

    // Logika refresh hanya sekali saat < 2 detik
    if (timeLeftMs < 2000 && !hasScheduledRefresh) {
      hasScheduledRefresh = true;
      console.log(`[${new Date().toISOString()}] ⚠️ Countdown mendekati 0, memicu auto-refresh QR`);
      handleGenerateModalQRCode(true);
    }

    // Jika waktu habis, bersihkan countdown
    if (timeLeftMs <= 0) {
      clearInterval(modalQrCountdownInterval);
      modalQrExpiresAtEl.textContent = "QR Code telah kedaluwarsa.";
    }
  }, 1000);
  };

const handleGenerateModalQRCode = async (isAutoRefresh = false) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔄 Mulai generate QR | autoRefresh: ${isAutoRefresh}`);

  if (isRefreshingQrCode) {
    console.warn(`[${timestamp}] ⛔ Abort: Masih dalam proses generate QR!`);
    return;
  }

  isRefreshingQrCode = true;
  hasScheduledRefresh = false;

  modalQrPlaceholderEl.textContent = "Memuat QR Code...";
  modalQrPlaceholderEl.classList.remove("hidden");
  modalQrImageEl.classList.add("hidden", "opacity-0", "scale-95");
  modalQrExpiresAtEl.textContent = "";

  if (modalQrRefreshInterval) {
    clearTimeout(modalQrRefreshInterval);
    console.log(`[${timestamp}] ✅ clearTimeout: modalQrRefreshInterval dibatalkan`);
  }
  if (modalQrCountdownInterval) {
    clearInterval(modalQrCountdownInterval);
    console.log(`[${timestamp}] ✅ clearInterval: modalQrCountdownInterval dibatalkan`);
  }

  try {
    const data = await AttendanceService.generateQR();
    console.log(`[${timestamp}] ✅ QR berhasil didapatkan dari server`);

    localStorage.setItem("activeQRCode", JSON.stringify(data));
    displayModalQRCode(data, isAutoRefresh);

    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const actualDuration = expiresAt.getTime() - now.getTime();


    if (!isAutoRefresh) {
      showToast("QR Code berhasil dibuat!", "success");
    }

  } catch (error) {
    console.error(`[${timestamp}] ❌ Gagal generate QR:`, error);
    modalQrPlaceholderEl.textContent = "Gagal membuat QR. Coba lagi.";
    modalQrImageEl.src = "";
    modalQrImageEl.classList.add("hidden");
    modalQrPlaceholderEl.classList.remove("hidden");
    modalQrExpiresAtEl.textContent = "";
    modalCloseQrBtn.classList.add("hidden");
    showToast(`Error: ${error.message}`, "error");
  } finally {
    isRefreshingQrCode = false;
    console.log(`[${timestamp}] 🔚 Selesai handleGenerateModalQRCode`);
  }
};




  const openQRCodeModal = () => {
    qrCodeModal.classList.remove("hidden");
    qrCodeModal.classList.add("active");
    
    // Sembunyikan sidebar mobile jika terbuka
    mobileSidebar.classList.remove("opacity-100");
    mobileSidebar.classList.add("opacity-0");
    mobileSidebarPanel.classList.add("-translate-x-full");
    setTimeout(() => mobileSidebar.classList.add("hidden"), 300);

    handleGenerateModalQRCode(false);
  };

  const closeQRCodeModal = () => {
    qrCodeModal.classList.remove("active");
    qrCodeModal.classList.add("opacity-0");
    setTimeout(() => {
        qrCodeModal.classList.add("hidden");
        qrCodeModal.classList.remove("opacity-0");
    }, 300);

    if (modalQrRefreshInterval) clearInterval(modalQrRefreshInterval);
    if (modalQrCountdownInterval) clearInterval(modalQrCountdownInterval);
    localStorage.removeItem("activeQRCode");
    modalQrImageEl.src = "";
    modalQrImageEl.classList.add("hidden");
    modalQrPlaceholderEl.classList.remove("hidden");
    modalQrPlaceholderEl.textContent = "Memuat QR Code...";
    modalQrExpiresAtEl.textContent = "";
    modalCloseQrBtn.classList.add("hidden");
  };

  // --- Logika Dasbor Utama ---
  const loadDashboardData = async () => {
    try {
      const stats = await dashboardService.getDashboardStats();
      if (totalKaryawanEl) totalKaryawanEl.innerText = stats.total_karyawan || 0;
      if (karyawanAktifEl) karyawanAktifEl.innerText = stats.karyawan_aktif || 0;
      if (karyawanCutiEl) karyawanCutiEl.innerText = stats.karyawan_cuti || 0;
      if (totalDepartemenEl) totalDepartemenEl.innerText = stats.total_departemen || 0;

      if (chartCanvas && stats.distribusi_departemen) {
        if (window.myDepartmentChart instanceof Chart) {
          window.myDepartmentChart.destroy();
        }
        window.myDepartmentChart = new Chart(chartCanvas, {
          type: "bar",
          data: {
            labels: stats.distribusi_departemen.map((d) => d.department),
            datasets: [
              {
                label: "Jumlah Karyawan",
                data: stats.distribusi_departemen.map((d) => d.count),
                backgroundColor: ["rgba(20, 184, 166, 0.8)", "rgba(59, 130, 246, 0.8)", "rgba(249, 115, 22, 0.8)"],
                borderColor: ["#0d9488", "#2563eb", "#d97706"],
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          },
        });
      }
    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
      showToast("Gagal memuat data dashboard.", "error");
    }
  };

  // --- Logika UI (Logout & Sidebar) ---

  const handleLogout = () => {
    closeQRCodeModal();
    authService.logout();
  };

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
    const toast = Toastify({ node: toastNode, duration: -1, gravity: "top", position: "center", close: true, style: { background: "linear-gradient(to right, #4f46e5, #7c3aed)", borderRadius: "12px" } }).showToast();
    toastNode.querySelector("#confirmLogoutBtn").addEventListener("click", handleLogout);
    toastNode.querySelector("#cancelLogoutBtn").addEventListener("click", () => toast.hideToast());
  };

  const setupSidebar = () => {
    if (sidebarToggle && mobileSidebar && mobileSidebarPanel && closeSidebar) {
      const showMobileSidebar = () => {
        mobileSidebar.classList.remove("hidden");
        mobileSidebar.classList.remove("opacity-0");
        mobileSidebar.classList.add("opacity-100");

        mobileSidebarPanel.classList.remove("-translate-x-full");
      };
      const hideMobileSidebar = () => {
        mobileSidebar.classList.remove("opacity-100");
        mobileSidebar.classList.add("opacity-0");
        mobileSidebarPanel.classList.add("-translate-x-full");
        setTimeout(() => mobileSidebar.classList.add("hidden"), 300);
      };
      sidebarToggle.addEventListener("click", showMobileSidebar);
      closeSidebar.addEventListener("click", hideMobileSidebar);
      mobileSidebar.addEventListener("click", (e) => {
        if (e.target === mobileSidebar) hideMobileSidebar();
      });
    }
  };

  // --- Inisialisasi Halaman ---

  const initializePage = () => {
    // Daftarkan event listener untuk memicu modal QR Code
    if (generateQrMenuBtn) generateQrMenuBtn.addEventListener("click", openQRCodeModal);
    if (generateQrMenuBtnMobile) generateQrMenuBtnMobile.addEventListener("click", openQRCodeModal);
    // Tombol refresh di modal
    if (modalGenerateQrBtn) modalGenerateQrBtn.addEventListener("click", () => handleGenerateModalQRCode(false));
    // Tombol tutup di modal
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeQRCodeModal);
    if (modalCloseQrBtn) modalCloseQrBtn.addEventListener("click", closeQRCodeModal);

    // Event listener untuk menutup modal saat klik di luar area konten modal
    if (qrCodeModal) {
      qrCodeModal.addEventListener("click", (e) => {
        if (e.target === qrCodeModal) {
          closeQRCodeModal();
        }
      });
    }

    // Logika Logout yang dikonsolidasi
    const allLogoutButtons = document.querySelectorAll("#logoutButton, #logoutButtonMobile, #dropdownLogoutButton");
    allLogoutButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            showLogoutConfirmation();
        });
    });
    
    // Siapkan UI
    setupSidebar();
    
    // Muat data awal dari server
    loadDashboardData();
    
    // Pastikan interval dibersihkan saat admin meninggalkan halaman
    window.addEventListener('beforeunload', () => {
        closeQRCodeModal(); // Membersihkan modal dan interval saat halaman ditutup
    });
  };

  initializePage();
});