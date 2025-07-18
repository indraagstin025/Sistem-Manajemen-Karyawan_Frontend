import { authService, dashboardService } from "../Services/AuthServices.js";
import { QRCodeManager } from "../components/qrCodeHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js"; // Import fungsi photoUtils

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
        const userNameNav = document.getElementById("userNameNav"); // Pastikan elemen ini ada di HTML Anda
        try {
            const user = await authService.getCurrentUser();
            if (user) {
                // Gunakan getUserPhotoBlobUrl untuk memuat foto profil admin di header
                const photoUrl = await getUserPhotoBlobUrl(user.id, user.name, 40); // Ukuran 40x40 untuk header
                if (userAvatarNav) {
                    userAvatarNav.src = photoUrl;
                    userAvatarNav.alt = user.name || "Admin"; // Fallback text
                }
                if (userNameNav) { // Perbarui juga nama pengguna jika ada elemennya
                    userNameNav.textContent = user.name || "Admin";
                }
            } else {
                // Fallback jika user tidak ditemukan (mungkin belum login)
                if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
                if (userNameNav) userNameNav.textContent = "Guest";
            }
        } catch (error) {
            console.error("Gagal memuat profil pengguna:", error);
            if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
            if (userNameNav) userNameNav.textContent = "Error";
            showToast("Gagal memuat data profil pengguna.", "error"); // Tampilkan toast jika gagal
        }
    };

    const loadDashboardData = async () => {
        const totalKaryawanEl = document.getElementById("totalKaryawan");
        const karyawanAktifEl = document.getElementById("karyawanAktif");
        const totalDepartemenEl = document.getElementById("totalDepartemen");
        // Tambahkan elemen untuk Karyawan Cuti, Pending Leave Requests, Posisi Baru (jika ada di HTML dashboard)
        const karyawanCutiEl = document.getElementById("karyawanCuti");
        const pendingLeavesCountEl = document.getElementById("pendingLeavesCount");
        const posisiBaruEl = document.getElementById("posisiBaru");
        const latestActivitiesList = document.getElementById("latestActivitiesList"); // Untuk daftar aktivitas terbaru

        const chartCanvas = document.getElementById("departmentChart");
        try {
            const stats = await dashboardService.getDashboardStats();

            // Update elemen statistik
            if (totalKaryawanEl) totalKaryawanEl.innerText = stats.total_karyawan || 0;
            if (karyawanAktifEl) karyawanAktifEl.innerText = stats.karyawan_aktif || 0;
            if (karyawanCutiEl) karyawanCutiEl.innerText = stats.karyawan_cuti || 0; // Pastikan ID ini ada di HTML
            if (pendingLeavesCountEl) pendingLeavesCountEl.innerText = stats.pending_leave_requests_count || 0; // Pastikan ID ini ada di HTML
            if (posisiBaruEl) posisiBaruEl.innerText = stats.posisi_baru || 0; // Pastikan ID ini ada di HTML
            if (totalDepartemenEl) totalDepartemenEl.innerText = stats.total_departemen || 0;


            // Update Aktivitas Terbaru
            if (latestActivitiesList && stats.aktivitas_terbaru) {
                latestActivitiesList.innerHTML = ''; // Bersihkan daftar yang ada
                stats.aktivitas_terbaru.forEach(activity => {
                    const li = document.createElement('li');
                    li.className = 'flex items-center text-sm text-gray-700 mb-2';
                    li.innerHTML = `<i data-feather="activity" class="w-4 h-4 mr-2 text-blue-500"></i><span>${activity}</span>`;
                    latestActivitiesList.appendChild(li);
                });
                feather.replace(); // Render ikon Feather yang baru ditambahkan
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
                                backgroundColor: [
                                    "rgba(20, 184, 166, 0.8)", // Teal
                                    "rgba(59, 130, 246, 0.8)", // Blue
                                    "rgba(249, 115, 22, 0.8)", // Orange
                                    "rgba(139, 92, 246, 0.8)", // Purple (new color)
                                    "rgba(239, 68, 68, 0.8)",   // Red (new color)
                                    "rgba(16, 185, 129, 0.8)",  // Green (new color)
                                    "rgba(234, 179, 8, 0.8)"    // Yellow (new color)
                                ],
                                borderColor: [
                                    "#0d9488",
                                    "#2563eb",
                                    "#d97706",
                                    "#7c3aed", // Darker purple
                                    "#b91c1c", // Darker red
                                    "#059669", // Darker green
                                    "#a16207"  // Darker yellow
                                ],
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
                // Jika tidak ada data distribusi departemen, tampilkan pesan di canvas
                const ctx = chartCanvas.getContext('2d');
                ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
                ctx.font = '16px Inter';
                ctx.fillStyle = '#6b7280';
                ctx.textAlign = 'center';
                ctx.fillText('Tidak ada data departemen untuk ditampilkan.', chartCanvas.width / 2, chartCanvas.height / 2);
            }
        } catch (error) {
            console.error("Gagal memuat data dashboard:", error);
            showToast("Gagal memuat data dashboard.", "error");
        }
    };


    const setupEventListeners = () => {
        const userDropdownContainer = document.getElementById("userDropdown");
        const dropdownMenu = document.getElementById("dropdownMenu");

        // Pastikan elemen ditemukan sebelum menambahkan event listener
        if (userDropdownContainer && dropdownMenu) {
            userDropdownContainer.addEventListener("click", (e) => {
                e.stopPropagation(); // Mencegah event mencapai document click handler
                dropdownMenu.classList.toggle("active");
                // Tambahkan timeout untuk memastikan hidden/active berjalan beriringan
                if (dropdownMenu.classList.contains("active")) {
                    dropdownMenu.classList.remove("hidden");
                } else {
                    setTimeout(() => {
                        dropdownMenu.classList.add("hidden");
                    }, 200); // Sesuaikan dengan durasi transisi CSS
                }
            });

            // Menutup dropdown ketika klik di luar area dropdown
            document.addEventListener("click", (event) => {
                // Pastikan klik tidak di dalam container dropdown atau dropdown menu itu sendiri
                if (dropdownMenu && !userDropdownContainer.contains(event.target) && !dropdownMenu.contains(event.target)) {
                    dropdownMenu.classList.remove("active");
                    setTimeout(() => {
                        dropdownMenu.classList.add("hidden");
                    }, 200);
                }
            });
        }

        QRCodeManager.initialize({
            toastCallback: showToast,
        });

        initializeLogout({
            preLogoutCallback: QRCodeManager.close,
        });
    };

    const initializePage = () => {
        // Panggil setupEventListeners lebih dulu untuk memastikan dropdown berfungsi
        setupEventListeners();
        // Kemudian load data
        loadDashboardData();
        loadUserProfile();
    };

    initializePage();
});