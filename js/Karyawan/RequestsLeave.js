// js/Karyawan/request_leave.js

import { authService } from '../Services/AuthServices.js';
import { userService } from "../Services/UserServices.js";
import { LeaveRequestService } from '../Services/LeaveRequestsServices.js'; // Kita akan buat ini
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace(); // Inisialisasi ikon Feather

    // --- Seleksi Elemen DOM ---
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
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
    const changePasswordErrorMessage = document.getElementById("changePasswordErrorMessage");
    const changePasswordSuccessMessage = document.getElementById("changePasswordSuccessMessage");

    // Elemen Formulir Pengajuan Cuti/Izin
    const leaveRequestForm = document.getElementById("leaveRequestForm");
    const requestTypeInput = document.getElementById("requestType");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const reasonInput = document.getElementById("reason");
    const attachmentSection = document.getElementById("attachmentSection");
    const attachmentInput = document.getElementById("attachment");
    const formMessage = document.getElementById("formMessage"); // Untuk pesan sukses/error formulir

    // Elemen Riwayat Pengajuan
    const leaveHistoryTableBody = document.getElementById("leaveHistoryTableBody");
    const leaveHistoryMessage = document.getElementById("leaveHistoryMessage");
    const paginationControls = document.getElementById('paginationControls');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageInfo = document.getElementById('currentPageInfo');

    let currentPage = 1;
    const itemsPerPage = 5; // Lebih sedikit untuk riwayat pengajuan
    let allLeaveRequestsData = []; // Untuk menyimpan seluruh data pengajuan

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

    // --- Fungsi untuk memuat data profil karyawan (untuk avatar di header) ---
    const fetchEmployeeProfileDataForHeader = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                return null;
            }
            let user = authService.getCurrentUser();
            if (!user) {
                return null;
            }
            const employeeData = await userService.getUserByID(user.id, token);
            if (employeeData && userAvatarNav) {
                userAvatarNav.src = employeeData.photo || "https://placehold.co/40x40/E2E8F0/4A5568?text=ME";
                userAvatarNav.alt = employeeData.name;
            }
            return employeeData;
        } catch (error) {
            console.error("Error fetching employee profile data for header:", error);
            return null;
        }
    };

    // --- Fungsi untuk memuat dan menampilkan riwayat pengajuan cuti/izin ---
const loadLeaveHistory = async () => {
    leaveHistoryTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">Memuat riwayat pengajuan...</td>
        </tr>
    `;
    leaveHistoryMessage.classList.add('hidden');
    paginationControls.classList.add('hidden');

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            showToast("Sesi tidak valid. Mengarahkan ke halaman login...", "error");
            setTimeout(() => authService.logout(), 2000);
            return;
        }

        const currentUser = authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'karyawan') {
            showToast("Akses ditolak. Anda tidak memiliki izin untuk melihat halaman ini.", "error");
            setTimeout(() => authService.logout(), 2000);
            return;
        }
        
        let fetchedData = await LeaveRequestService.getMyLeaveRequests(); // Panggil service

        // >>>>>> TAMBAHKAN BLOK INI <<<<<<
        // Pastikan fetchedData adalah array. Jika bukan, set menjadi array kosong.
        if (!Array.isArray(fetchedData)) {
            console.warn("Peringatan: API /leave-requests/my-requests tidak mengembalikan array. Menerima:", fetchedData);
            fetchedData = []; // Set menjadi array kosong untuk mencegah error sort
            showToast("Peringatan: Format data riwayat pengajuan tidak valid dari server.", "info"); // Informasikan user
        }
        // >>>>>> AKHIR BLOK TAMBAHAN <<<<<<

        allLeaveRequestsData = fetchedData; // Assign ke variabel global
        allLeaveRequestsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Baris 132

        if (allLeaveRequestsData.length === 0) {
            leaveHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">Tidak ada riwayat pengajuan cuti/izin.</td>
                </tr>
            `;
            leaveHistoryMessage.textContent = 'Anda belum memiliki riwayat pengajuan cuti atau izin.';
            leaveHistoryMessage.classList.remove('hidden');
            leaveHistoryMessage.classList.add('info');
        } else {
            renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
            updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
            if (allLeaveRequestsData.length > itemsPerPage) {
                paginationControls.classList.remove('hidden');
            }
        }

    } catch (error) {
        console.error("Error loading leave history:", error); // Baris 152
        leaveHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-red-500">Gagal memuat riwayat pengajuan: ${error.message}</td>
            </tr>
        `;
        showToast(error.message || "Gagal memuat riwayat pengajuan.", "error");
        if (error.message.includes('token') || error.message.includes('sesi') || error.message.includes('Akses ditolak')) {
            setTimeout(() => authService.logout(), 2000);
        }
    }
};

    // --- Fungsi untuk merender tabel riwayat pengajuan per halaman ---
    const renderLeaveHistoryTable = (data, page, limit) => {
        leaveHistoryTableBody.innerHTML = '';
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = data.slice(startIndex, endIndex);

        paginatedItems.forEach(request => {
            const row = leaveHistoryTableBody.insertRow();
            
            const startDate = new Date(request.start_date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
            const endDate = new Date(request.end_date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

            let statusClass = '';
            let statusText = request.status;
            switch (request.status) {
                case 'pending':
                    statusClass = 'text-yellow-600';
                    statusText = 'Menunggu';
                    break;
                case 'approved':
                    statusClass = 'text-green-600';
                    statusText = 'Disetujui';
                    break;
                case 'rejected':
                    statusClass = 'text-red-600';
                    statusText = 'Ditolak';
                    break;
                default:
                    statusClass = 'text-gray-600';
                    break;
            }

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${startDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${endDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${request.request_type || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis">${request.reason || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass} font-semibold">${statusText}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ${request.attachment_url ? `<a href="${request.attachment_url}" target="_blank" class="text-teal-600 hover:underline">Lihat Lampiran</a>` : '-'}
                </td>
            `;
        });
    };

    // --- Fungsi untuk memperbarui kontrol paginasi ---
    const updatePaginationControls = (totalItems, currentPage, itemsPerPage) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        currentPageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;

        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

        if (totalItems > itemsPerPage) {
            paginationControls.classList.remove('hidden');
        } else {
            paginationControls.classList.add('hidden');
        }
    };

    // --- Event Listener Paginasi ---
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allLeaveRequestsData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
            }
        });
    }

    // --- Logika untuk menampilkan/menyembunyikan bagian lampiran ---
    requestTypeInput.addEventListener('change', () => {
        if (requestTypeInput.value === 'Sakit') { // Hanya tampilkan jika jenisnya 'Sakit'
            attachmentSection.classList.remove('hidden');
            attachmentInput.setAttribute('required', 'required'); // Lampiran wajib jika sakit
        } else {
            attachmentSection.classList.add('hidden');
            attachmentInput.removeAttribute('required');
            attachmentInput.value = ''; // Kosongkan file yang dipilih jika disembunyikan
        }
    });

    // --- Event Listener Submit Formulir Pengajuan Cuti/Izin ---
    leaveRequestForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        formMessage.classList.add("hidden");
        formMessage.textContent = '';

        const formData = new FormData();
        formData.append("request_type", requestTypeInput.value);
        formData.append("start_date", startDateInput.value);
        formData.append("end_date", endDateInput.value);
        formData.append("reason", reasonInput.value);

        const file = attachmentInput.files[0];
        if (file) {
            // Validasi ukuran file
            if (file.size > 2 * 1024 * 1024) { // 2MB
                showToast("Ukuran file terlalu besar! Maksimal 2MB.", "error");
                formMessage.textContent = "Ukuran file terlalu besar! Maksimal 2MB.";
                formMessage.classList.remove("hidden");
                formMessage.classList.add("error");
                return;
            }
            formData.append("attachment", file); // Tambahkan file ke FormData
        } else if (requestTypeInput.value === 'Sakit' && attachmentInput.hasAttribute('required')) {
            showToast("Lampiran (surat dokter) wajib untuk pengajuan Sakit.", "error");
            formMessage.textContent = "Lampiran (surat dokter) wajib untuk pengajuan Sakit.";
            formMessage.classList.remove("hidden");
            formMessage.classList.add("error");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                showToast("Sesi tidak valid. Harap login kembali.", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }

            // Panggil service untuk mengirim pengajuan
            const response = await LeaveRequestService.createLeaveRequest(formData, token);
            
            showToast(response.message || "Pengajuan berhasil dikirim!", "success");
            formMessage.textContent = "Pengajuan berhasil dikirim dan menunggu persetujuan admin.";
            formMessage.classList.remove("hidden");
            formMessage.classList.remove("error");
            formMessage.classList.add("success");
            
            leaveRequestForm.reset(); // Reset form setelah berhasil
            attachmentSection.classList.add('hidden'); // Sembunyikan lagi lampiran
            attachmentInput.removeAttribute('required');

            // Muat ulang riwayat pengajuan setelah berhasil
            loadLeaveHistory();

        } catch (error) {
            console.error("Error submitting leave request:", error);
            const errorMessage = error.message || "Gagal mengirim pengajuan. Silakan coba lagi.";
            showToast(errorMessage, "error");
            formMessage.textContent = errorMessage;
            formMessage.classList.remove("hidden");
            formMessage.classList.remove("success");
            formMessage.classList.add("error");
        }
    });


    // --- Change Password Modal Logic (disalin dari EmployeeDashboard.js) ---
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
            const token = localStorage.getItem('token');

            try {
                const response = await authService.changePassword(oldPassword, newPassword, token);
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
    fetchEmployeeProfileDataForHeader();
    loadLeaveHistory(); // Muat riwayat pengajuan saat halaman dimuat
});