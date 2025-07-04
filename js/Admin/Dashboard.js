// js/Admin/Dashboard.js

// Import authService
import { authService } from '../Services/AuthServices.js'; // Pastikan path ini benar

document.addEventListener('DOMContentLoaded', () => {
    feather.replace(); // Inisialisasi Feather Icons

    // === Elemen DOM Dashboard (sudah ada) ===
    const totalKaryawanEl = document.getElementById('totalKaryawan');
    const karyawanAktifEl = document.getElementById('karyawanAktif');
    const karyawanCutiEl = document.getElementById('karyawanCuti');
    const posisiBaruEl = document.getElementById('posisiBaru');
    const ctx = document.getElementById('departmentChart');

    // === Elemen DOM untuk Logout ===
    const logoutButton = document.getElementById('logoutButton'); // Ambil tombol logout dari sidebar
    // Jika ada tombol logout di dropdown user profile, tambahkan juga di sini:
    // const logoutDropdownButton = document.getElementById('logoutDropdownButton'); 

    // Dummy data for statistics and chart
    const dashboardData = {
        totalKaryawan: 29, 
        karyawanAktif: 25,
        karyawanCuti: 2,
        posisiBaru: 4,
        departmentDistribution: {
            labels: ['Teknik', 'Pemasaran', 'HRD', 'Keuangan', 'Operasional'],
            data: [12, 8, 4, 5, 6],
        }
    };

    // Populate statistics cards (pastikan elemen ada sebelum diakses)
    if (totalKaryawanEl) totalKaryawanEl.innerText = dashboardData.totalKaryawan;
    if (karyawanAktifEl) karyawanAktifEl.innerText = dashboardData.karyawanAktif;
    if (karyawanCutiEl) karyawanCutiEl.innerText = dashboardData.karyawanCuti;
    if (posisiBaruEl) posisiBaruEl.innerText = dashboardData.PosisiBaru; // Perbaikan typo, ini harusnya posisiBaru


    // Initialize Chart.js for department distribution
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dashboardData.departmentDistribution.labels,
                datasets: [{
                    label: 'Jumlah Karyawan',
                    data: dashboardData.departmentDistribution.data,
                    backgroundColor: [
                        'rgba(20, 184, 166, 0.8)', 
                        'rgba(34, 197, 94, 0.8)',  
                        'rgba(249, 115, 22, 0.8)', 
                        'rgba(168, 85, 247, 0.8)', 
                        'rgba(59, 130, 246, 0.8)'  
                    ],
                    borderColor: [
                        'rgba(20, 184, 166, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(249, 115, 22, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(59, 130, 246, 1)'
                    ],
                    borderWidth: 1,
                    borderRadius: 4, 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: { 
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 },
                        padding: 10,
                        boxPadding: 4,
                        displayColors: true,
                        bodyColor: '#fff',
                        titleColor: '#fff',
                    }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, color: '#6B7280' }, grid: { color: '#e5e7eb', drawBorder: false } },
                    x: { ticks: { color: '#6B7280' }, grid: { display: false } }
                }
            }
        });
    }

    // Mobile sidebar logic (tetap di sini)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
    const closeSidebar = document.getElementById('closeSidebar');

    if (sidebarToggle && mobileSidebar && mobileSidebarPanel && closeSidebar) {
        sidebarToggle.addEventListener('click', () => {
            mobileSidebar.classList.remove('hidden');
            setTimeout(() => {
                mobileSidebar.classList.add('opacity-100');
                mobileSidebarPanel.classList.remove('-translate-x-full');
            }, 10); 
        });

        const hideMobileSidebar = () => {
            mobileSidebar.classList.remove('opacity-100');
            mobileSidebarPanel.classList.add('-translate-x-full');
            setTimeout(() => {
                mobileSidebar.classList.add('hidden');
            }, 300); 
        };

        closeSidebar.addEventListener('click', hideMobileSidebar);

        mobileSidebar.addEventListener('click', (event) => {
            if (event.target === mobileSidebar) {
                hideMobileSidebar();
            }
        });
    }

    // === Event Listener untuk Tombol Logout ===
    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault(); // Mencegah browser mengikuti href="#"
            authService.logout(); // Panggil fungsi logout dari AuthServices
        });
    }

    // Jika Anda punya tombol logout di dropdown juga
    // if (logoutDropdownButton) {
    //     logoutDropdownButton.addEventListener('click', (event) => {
    //         event.preventDefault();
    //         authService.logout();
    //     });
    // }
});