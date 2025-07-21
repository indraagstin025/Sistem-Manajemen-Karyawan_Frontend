import { authService, dashboardService } from "../Services/AuthServices.js";
import { userService } from "../Services/UserServices.js";
import { QRCodeManager } from "../components/qrCodeHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

document.addEventListener("DOMContentLoaded", () => {
  feather.replace();

  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileSidebar = document.getElementById("mobileSidebar");
  const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
  const closeSidebar = document.getElementById("closeSidebar");

  if (sidebarToggle && mobileSidebar && mobileSidebarPanel && closeSidebar) {
    sidebarToggle.addEventListener("click", () => {
      mobileSidebar.classList.remove("hidden");
      setTimeout(() => {
        mobileSidebar.classList.add("opacity-100");
        mobileSidebarPanel.classList.remove("-translate-x-full");
      }, 10);
    });

    closeSidebar.addEventListener("click", () => {
      mobileSidebarPanel.classList.add("-translate-x-full");
      mobileSidebar.classList.remove("opacity-100");
      setTimeout(() => {
        mobileSidebar.classList.add("hidden");
      }, 300);
    });

    mobileSidebar.addEventListener("click", (e) => {
      if (e.target === mobileSidebar) {
        mobileSidebarPanel.classList.add("-translate-x-full");
        mobileSidebar.classList.remove("opacity-100");
        setTimeout(() => {
          mobileSidebar.classList.add("hidden");
        }, 300);
      }
    });
  }

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
    const adminProfilePhoto = document.getElementById("adminProfilePhoto");
    const adminName = document.getElementById("adminName");
    const adminRole = document.getElementById("adminRole");
    const adminEmail = document.getElementById("adminEmail");

    try {
      const currentUserSession = authService.getCurrentUser();

      if (!currentUserSession || !currentUserSession.id) {
        if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
        if (adminProfilePhoto) adminProfilePhoto.src = "/assets/default-avatar.png";
        if (adminName) adminName.textContent = "Guest";
        if (adminRole) adminRole.textContent = "N/A";
        if (adminEmail) adminEmail.textContent = "N/A";
        return;
      }

      const adminData = await userService.getUserByID(currentUserSession.id);

      if (adminData) {
        const userIdForPhoto = adminData._id || adminData.id;
        const userNameForPhoto = adminData.name || "Admin";

        const photoUrlNav = await getUserPhotoBlobUrl(userIdForPhoto, userNameForPhoto, 40);
        if (userAvatarNav) {
          userAvatarNav.src = photoUrlNav || "/assets/default-avatar.png";
          userAvatarNav.alt = userNameForPhoto;
        }

        const photoUrlProfileCard = await getUserPhotoBlobUrl(userIdForPhoto, userNameForPhoto, 96);

        if (adminProfilePhoto) {
          adminProfilePhoto.src = photoUrlProfileCard || "/assets/default-avatar.png";
          adminProfilePhoto.alt = userNameForPhoto + " Photo";
        }

        if (adminName) {
          adminName.textContent = adminData.name || "Admin";
        }
        if (adminRole) {
          adminRole.textContent = adminData.role || "Administrator";
        }
        if (adminEmail) {
          adminEmail.textContent = adminData.email || "admin@hrsystem.com";
        }
      } else {
        if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
        if (adminProfilePhoto) adminProfilePhoto.src = "/assets/default-avatar.png";
        if (adminName) adminName.textContent = "Guest";
        if (adminRole) adminRole.textContent = "N/A";
        if (adminEmail) adminEmail.textContent = "N/A";
        showToast("Data profil admin tidak ditemukan.", "error");
      }
    } catch (error) {
      console.error("DEBUG: Gagal memuat profil pengguna:", error);

      if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
      if (adminProfilePhoto) adminProfilePhoto.src = "/assets/default-avatar.png";
      if (adminName) adminName.textContent = "Error";
      if (adminRole) adminRole.textContent = "Error";
      if (adminEmail) adminEmail.textContent = "Error";
      showToast("Gagal memuat data profil pengguna.", "error");
    }
  };

  const loadDashboardData = async () => {
    const totalKaryawanEl = document.getElementById("totalKaryawan");
    const karyawanAktifEl = document.getElementById("karyawanAktif");
    const totalDepartemenEl = document.getElementById("totalDepartemen");
    const pendingLeavesCountEl = document.getElementById("pendingLeavesCount");
    const latestActivitiesList = document.getElementById("latestActivitiesList");

    const chartCanvas = document.getElementById("departmentChart");
    try {
      const stats = await dashboardService.getDashboardStats();

      if (totalKaryawanEl) totalKaryawanEl.innerText = stats.total_karyawan || 0;
      if (karyawanAktifEl) karyawanAktifEl.innerText = stats.karyawan_aktif || 0;
      if (totalDepartemenEl) totalDepartemenEl.innerText = stats.total_departemen || 0;
      if (pendingLeavesCountEl) pendingLeavesCountEl.innerText = stats.pending_leave_requests_count || 0;

      if (latestActivitiesList && stats.aktivitas_terbaru) {
        latestActivitiesList.innerHTML = "";
        if (stats.aktivitas_terbaru.length > 0) {
          stats.aktivitas_terbaru.forEach((activity) => {
            const li = document.createElement("li");
            li.className = "flex items-center text-sm text-gray-700 py-2";
            li.innerHTML = `<i data-feather="activity" class="w-4 h-4 mr-2 text-blue-500"></i><span>${activity}</span>`;
            latestActivitiesList.appendChild(li);
          });
        } else {
          latestActivitiesList.innerHTML = `
                        <li class="flex items-center text-sm text-gray-700 py-2">
                            <i data-feather="info" class="w-4 h-4 mr-2 text-gray-400"></i>
                            <span>Belum ada aktivitas terbaru.</span>
                        </li>
                    `;
        }
        feather.replace();
      } else if (latestActivitiesList) {
        latestActivitiesList.innerHTML = `
                    <li class="flex items-center text-sm text-gray-700 py-2">
                        <i data-feather="info" class="w-4 h-4 mr-2 text-gray-400"></i>
                        <span>Belum ada aktivitas terbaru.</span>
                    </li>
                `;
        feather.replace();
      }

      if (chartCanvas && stats.distribusi_departemen && stats.distribusi_departemen.length > 0) {
        if (window.myDepartmentChart) window.myDepartmentChart.destroy();
        window.myDepartmentChart = new Chart(chartCanvas, {
          type: "bar",
          data: {
            labels: stats.distribusi_departemen.map((d) => d.department),
            datasets: [
              {
                label: "Jumlah Karyawan",
                data: stats.distribusi_departemen.map((d) => d.count),
                backgroundColor: ["rgba(20, 184, 166, 0.8)", "rgba(59, 130, 246, 0.8)", "rgba(249, 115, 22, 0.8)", "rgba(139, 92, 246, 0.8)", "rgba(239, 68, 68, 0.8)", "rgba(16, 185, 129, 0.8)", "rgba(234, 179, 8, 0.8)"],
                borderColor: ["#0d9488", "#2563eb", "#d97706", "#7c3aed", "#b91c1c", "#059669", "#a16207"],
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
      } else if (chartCanvas) {
        const ctx = chartCanvas.getContext("2d");
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        ctx.font = "16px Inter";
        ctx.fillStyle = "#6b7280";
        ctx.textAlign = "center";
        ctx.fillText("Tidak ada data departemen untuk ditampilkan.", chartCanvas.width / 2, chartCanvas.height / 2);
      }
    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
      showToast("Gagal memuat data dashboard.", "error");
    }
  };

  const setupEventListeners = () => {
    const userDropdownContainer = document.getElementById("userDropdown");
    const dropdownMenu = document.getElementById("dropdownMenu");

    if (userDropdownContainer && dropdownMenu) {
      userDropdownContainer.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("active");
        if (dropdownMenu.classList.contains("active")) {
          dropdownMenu.classList.remove("hidden");
        } else {
          setTimeout(() => {
            dropdownMenu.classList.add("hidden");
          }, 200);
        }
      });

      document.addEventListener("click", (event) => {
        if (dropdownMenu && !userDropdownContainer.contains(event.target) && !dropdownMenu.contains(event.target)) {
          dropdownMenu.classList.remove("active");
          setTimeout(() => {
            dropdownMenu.classList.add("hidden");
          }, 200);
        }
      });
    }

    initializeLogout({
      preLogoutCallback: () => {
        if (QRCodeManager.close) {
          QRCodeManager.close();
        }
      },
    });

    QRCodeManager.initialize({
      qrModalId: "qrCodeModal",
      closeModalBtnId: "closeModalBtn",
      modalQrCodeImageId: "modal-qr-code-image",
      modalQrPlaceholderId: "modal-qr-placeholder",
      modalQrExpiresAtId: "modal-qr-expires-at",
      modalGenerateQrBtnId: "modal-generate-qr-btn",
      modalCloseQrBtnId: "modal-close-qr-btn",
      generateQrMenuBtnId: "generate-qr-menu-btn",
      generateQrMenuBtnMobileId: "generate-qr-menu-btn-mobile",
      toastCallback: showToast,
    });
  };

  const initializePage = () => {
    loadUserProfile();
    loadDashboardData();
    setupEventListeners();
  };

  initializePage();
});
