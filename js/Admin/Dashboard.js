import { authService, dashboardService } from "../Services/AuthServices.js";
import { userService } from "../Services/UserServices.js"; // PASTIKAN INI ADA DAN JALURNYA BENAR
import { QRCodeManager } from "../components/qrCodeHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js";

import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

document.addEventListener("DOMContentLoaded", () => {
    feather.replace();

    // Inisialisasi sidebar mobile
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
            }, 10); // Small delay to allow CSS transition
        });

        closeSidebar.addEventListener("click", () => {
            mobileSidebarPanel.classList.add("-translate-x-full");
            mobileSidebar.classList.remove("opacity-100");
            setTimeout(() => {
                mobileSidebar.classList.add("hidden");
            }, 300); // Match transition duration
        });

        // Close sidebar when clicking outside the panel
        mobileSidebar.addEventListener("click", (e) => {
            if (e.target === mobileSidebar) {
                mobileSidebarPanel.classList.add("-translate-x-full");
                mobileSidebar.classList.remove("opacity-100");
                setTimeout(() => {
                    mobileSidebar.classList.add("hidden");
                }, 300); // Match transition duration
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
    // 1. Mendapatkan Referensi Elemen HTML
    const userAvatarNav = document.getElementById("userAvatar"); // Elemen <img> di header
    const adminProfilePhoto = document.getElementById("adminProfilePhoto"); // Elemen <img> di kartu profil
    const adminName = document.getElementById("adminName"); // Elemen <p> untuk nama
    const adminRole = document.getElementById("adminRole"); // Elemen <p> untuk peran/role
    const adminEmail = document.getElementById("adminEmail"); // Elemen <p> untuk email

    try {
        // 2. Mendapatkan Sesi Pengguna Saat Ini
        // authService.getCurrentUser() biasanya mengambil data dasar pengguna dari penyimpanan lokal (misalnya, localStorage)
        // yang tersimpan saat login. Data ini biasanya hanya berisi ID dan nama dasar.
        const currentUserSession = authService.getCurrentUser();
        console.log("DEBUG: currentUserSession dari authService:", currentUserSession); // Untuk debugging

        // 3. Penanganan Jika Sesi Tidak Valid
        // Jika tidak ada sesi pengguna atau ID pengguna tidak ditemukan,
        // fungsi akan langsung menampilkan avatar default dan informasi "Guest".
        if (!currentUserSession || !currentUserSession.id) {
            console.warn("DEBUG: Sesi pengguna tidak valid atau tidak ada ID. Menggunakan fallback avatar.");
            if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
            if (adminProfilePhoto) adminProfilePhoto.src = "/assets/default-avatar.png";
            if (adminName) adminName.textContent = "Guest";
            if (adminRole) adminRole.textContent = "N/A";
            if (adminEmail) adminEmail.textContent = "N/A";
            return; // Menghentikan eksekusi fungsi
        }

        // 4. Mengambil Detail Profil Lengkap dari Backend
        // Ini adalah perubahan utama. Fungsi userService.getUserByID(id)
        // melakukan panggilan API ke backend untuk mendapatkan data profil lengkap pengguna
        // berdasarkan ID yang diambil dari sesi. Data ini diharapkan lebih kaya,
        // mencakup role, email, dan ID yang lebih pasti (_id).
        const adminData = await userService.getUserByID(currentUserSession.id);
        console.log("DEBUG: adminData dari userService.getUserByID:", adminData); // Untuk debugging

        // 5. Memproses dan Menampilkan Data Profil
        if (adminData) {
            // Menentukan ID dan nama yang akan digunakan untuk mengambil foto.
            // Digunakan operator OR (||) sebagai fallback jika properti _id tidak ada, akan menggunakan id.
            const userIdForPhoto = adminData._id || adminData.id;
            const userNameForPhoto = adminData.name || "Admin";

            console.log("DEBUG: ID pengguna untuk foto:", userIdForPhoto);
            console.log("DEBUG: Nama pengguna untuk foto:", userNameForPhoto);

            // 5a. Memuat Foto untuk Avatar Navigasi (Ukuran Kecil)
            // Memanggil getUserPhotoBlobUrl untuk mendapatkan URL gambar (blob URL atau default).
            const photoUrlNav = await getUserPhotoBlobUrl(userIdForPhoto, userNameForPhoto, 40);
            console.log("DEBUG: URL Foto Navigasi:", photoUrlNav); // Untuk debugging
            if (userAvatarNav) {
                // Menetapkan src img. Jika photoUrlNav kosong, fallback ke default avatar.
                userAvatarNav.src = photoUrlNav || "/assets/default-avatar.png";
                userAvatarNav.alt = userNameForPhoto; // Menetapkan alt text untuk aksesibilitas
            }

            // 5b. Memuat Foto dan Data untuk Kartu Profil Utama (Ukuran Besar)
            // Proses serupa untuk foto di kartu profil, dengan ukuran yang berbeda (96px).
            const photoUrlProfileCard = await getUserPhotoBlobUrl(userIdForPhoto, userNameForPhoto, 96);
            console.log("DEBUG: URL Foto Kartu Profil:", photoUrlProfileCard); // Untuk debugging
            if (adminProfilePhoto) {
                adminProfilePhoto.src = photoUrlProfileCard || "/assets/default-avatar.png";
                adminProfilePhoto.alt = userNameForPhoto + " Photo";
            }

            // Menetapkan teks untuk nama, peran, dan email.
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
            // 6. Penanganan Jika Data Admin Tidak Ditemukan dari Backend
            // Ini terjadi jika userService.getUserByID() tidak mengembalikan data,
            // meskipun currentUserSession.id ada.
            console.warn("DEBUG: Data profil admin tidak ditemukan dari userService. Menggunakan fallback.");
            if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
            if (adminProfilePhoto) adminProfilePhoto.src = "/assets/default-avatar.png";
            if (adminName) adminName.textContent = "Guest";
            if (adminRole) adminRole.textContent = "N/A";
            if (adminEmail) adminEmail.textContent = "N/A";
            showToast("Data profil admin tidak ditemukan.", "error");
        }
    } catch (error) {
        // 7. Penanganan Error Umum
        // Menangkap kesalahan yang terjadi selama proses pengambilan data (misalnya, masalah jaringan).
        console.error("DEBUG: Gagal memuat profil pengguna:", error);
        // Mengatur fallback ke avatar dan teks error.
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

            // Update statistik elements
            if (totalKaryawanEl) totalKaryawanEl.innerText = stats.total_karyawan || 0;
            if (karyawanAktifEl) karyawanAktifEl.innerText = stats.karyawan_aktif || 0;
            if (totalDepartemenEl) totalDepartemenEl.innerText = stats.total_departemen || 0;
            if (pendingLeavesCountEl) pendingLeavesCountEl.innerText = stats.pending_leave_requests_count || 0;

            // Update Aktivitas Terbaru
            if (latestActivitiesList && stats.aktivitas_terbaru) {
                latestActivitiesList.innerHTML = ''; // Clear existing list
                if (stats.aktivitas_terbaru.length > 0) {
                    stats.aktivitas_terbaru.forEach(activity => {
                        const li = document.createElement('li');
                        li.className = 'flex items-center text-sm text-gray-700 py-2';
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
                feather.replace(); // Render new Feather icons
            } else if (latestActivitiesList) { // Fallback if no data or element
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

        if (userDropdownContainer && dropdownMenu) {
            userDropdownContainer.addEventListener("click", (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle("active");
                if (dropdownMenu.classList.contains("active")) {
                    dropdownMenu.classList.remove("hidden");
                } else {
                    // Delay adding 'hidden' class to allow transition to complete
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
        
        // Ensure initializeLogout and QRCodeManager.initialize are called after DOM is ready
        initializeLogout({
            preLogoutCallback: () => {
                // Ensure QR modal is closed before logout
                if (QRCodeManager.close) {
                    QRCodeManager.close(); 
                }
            }
        });

        // Initialize QR Code Modal handlers
        QRCodeManager.initialize({
            qrModalId: "qrCodeModal",
            closeModalBtnId: "closeModalBtn",
            modalQrCodeImageId: "modal-qr-code-image",
            modalQrPlaceholderId: "modal-qr-placeholder",
            modalQrExpiresAtId: "modal-qr-expires-at",
            modalGenerateQrBtnId: "modal-generate-qr-btn",
            modalCloseQrBtnId: "modal-close-qr-btn",
            generateQrMenuBtnId: "generate-qr-menu-btn", // desktop sidebar
            generateQrMenuBtnMobileId: "generate-qr-menu-btn-mobile", // mobile sidebar
            toastCallback: showToast,
        });
    };

    const initializePage = () => {
        loadUserProfile(); // Load user profile data first
        loadDashboardData(); // Then load general dashboard stats
        setupEventListeners(); // Set up all event listeners
    };

    initializePage();
});
