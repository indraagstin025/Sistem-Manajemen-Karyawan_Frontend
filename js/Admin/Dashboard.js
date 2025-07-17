import { authService, dashboardService } from "../Services/AuthServices.js";
import { QRCodeManager } from "../components/qrCodeHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import Toastify from 'toastify-js'; 
import 'toastify-js/src/toastify.css'; 

document.addEventListener("DOMContentLoaded", () => {
  feather.replace();


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

  const loadUserProfile = async () => {
    const userAvatarNav = document.getElementById("userAvatar");
    try {
      const user = await authService.getCurrentUser();
      if (user && user.photo_url && userAvatarNav) {
        userAvatarNav.src = user.photo_url;
      } else if (userAvatarNav) {
        userAvatarNav.src = "/assets/default-avatar.png";
      }
    } catch (error) {
      console.error("Gagal memuat profil pengguna:", error);
      if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
    }
  };

  const loadDashboardData = async () => {
    const totalKaryawanEl = document.getElementById("totalKaryawan");
    const karyawanAktifEl = document.getElementById("karyawanAktif");
    const totalDepartemenEl = document.getElementById("totalDepartemen");
    const chartCanvas = document.getElementById("departmentChart");
    try {
      const stats = await dashboardService.getDashboardStats();
      if (totalKaryawanEl) totalKaryawanEl.innerText = stats.total_karyawan || 0;
      if (karyawanAktifEl) karyawanAktifEl.innerText = stats.karyawan_aktif || 0;
      if (totalDepartemenEl) totalDepartemenEl.innerText = stats.total_departemen || 0;

      if (chartCanvas && stats.distribusi_departemen) {
        if (window.myDepartmentChart) window.myDepartmentChart.destroy();
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


  const setupEventListeners = () => {

    const userDropdownContainer = document.getElementById("userDropdown");
    const dropdownMenu = document.getElementById("dropdownMenu");
    userDropdownContainer?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("active");
    });
    document.addEventListener("click", () => {
      dropdownMenu?.classList.remove("active");
    });

    QRCodeManager.initialize({
      toastCallback: showToast,
    });

    initializeLogout({
        preLogoutCallback: QRCodeManager.close,
    });
  };

  const initializePage = () => {
    setupEventListeners();
    loadDashboardData();
    loadUserProfile();
  };

  initializePage();
});
