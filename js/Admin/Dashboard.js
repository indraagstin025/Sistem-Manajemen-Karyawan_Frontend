import { authService, dashboardService } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", async () => {
  feather.replace();

  const totalKaryawanEl = document.getElementById("totalKaryawan");
  const karyawanAktifEl = document.getElementById("karyawanAktif");
  const karyawanCutiEl = document.getElementById("karyawanCuti");
  const posisiBaruEl = document.getElementById("posisiBaru");
  const ctx = document.getElementById("departmentChart");
  const latestActivitiesList = document.getElementById("latestActivitiesList");

  const logoutButton = document.getElementById("logoutButton");

  const loadDashboardData = async () => {
    try {
      const stats = await dashboardService.getDashboardStats();
      console.log("Data Dashboard dari API:", stats);

      if (totalKaryawanEl) totalKaryawanEl.innerText = stats.total_karyawan;
      if (karyawanAktifEl) karyawanAktifEl.innerText = stats.karyawan_aktif;
      if (karyawanCutiEl) {
        posisiBaruEl.innerText = stats.karyawan_cuti;
      }
      if (posisiBaruEl) {
        posisiBaruEl.innerText = stats.posisi_baru;
      }

      if (ctx) {
        if (window.myDepartmentChart instanceof Chart) {
          window.myDepartmentChart.destroy();
        }

        const labels = stats.distribusi_departemen.map((d) => d.department);
        const dataValues = stats.distribusi_departemen.map((d) => d.count);

        window.myDepartmentChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Jumlah Karyawan",
                data: dataValues,
                backgroundColor: ["rgba(20, 184, 166, 0.8)", "rgba(34, 197, 94, 0.8)", "rgba(249, 115, 22, 0.8)", "rgba(168, 85, 247, 0.8)", "rgba(59, 130, 246, 0.8)", "rgba(244, 63, 94, 0.8)", "rgba(14, 165, 233, 0.8)"],
                borderColor: ["rgba(20, 184, 166, 1)", "rgba(34, 197, 94, 1)", "rgba(249, 115, 22, 1)", "rgba(168, 85, 247, 1)", "rgba(59, 130, 246, 1)", "rgba(244, 63, 94, 1)", "rgba(14, 165, 233, 1)"],
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: false },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                titleFont: { size: 14, weight: "bold" },
                bodyFont: { size: 12 },
                padding: 10,
                boxPadding: 4,
                displayColors: true,
                bodyColor: "#fff",
                titleColor: "#fff",
              },
            },
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1, color: "#6B7280" }, grid: { color: "#e5e7eb", drawBorder: false } },
              x: { ticks: { color: "#6B7280" }, grid: { display: false } },
            },
          },
        });
      }

      if (latestActivitiesList) {
        latestActivitiesList.innerHTML = "";
        stats.aktivitas_terbaru.forEach((activity) => {
          const listItem = document.createElement("li");
          listItem.className = "flex items-start";
          listItem.innerHTML = `
            <div class="bg-blue-100 text-blue-600 rounded-full p-2 mr-4">
              <i data-feather="activity" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="text-sm font-medium">${activity}</p>
              <p class="text-xs text-gray-500">Baru saja</p> <!-- Anda bisa menambahkan timestamp jika API menyediakan -->
            </div>
          `;
          latestActivitiesList.appendChild(listItem);
        });
        feather.replace();
      }
    } catch (error) {
      console.error("Gagal memuat dashboard:", error);

      if (error.status === 401 || error.message.includes("token autentikasi")) {
        alert("Sesi Anda telah berakhir atau Anda tidak memiliki akses. Silakan login kembali.");
        authService.logout();
      }
    }
  };

  loadDashboardData();

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

    const hideMobileSidebar = () => {
      mobileSidebar.classList.remove("opacity-100");
      mobileSidebarPanel.classList.add("-translate-x-full");
      setTimeout(() => {
        mobileSidebar.classList.add("hidden");
      }, 300);
    };

    closeSidebar.addEventListener("click", hideMobileSidebar);

    mobileSidebar.addEventListener("click", (event) => {
      if (event.target === mobileSidebar) {
        hideMobileSidebar();
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      authService.logout();
    });
  }
});
