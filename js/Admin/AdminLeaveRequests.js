// js/Admin/AdminLeaveRequests.js

import { LeaveRequestService } from '../Services/LeaveRequestsServices.js';
import { authService } from "../Services/AuthServices.js";
import { userService } from "../Services/UserServices.js"; 
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

const BACKEND_STATIC_BASE_URL = 'http://localhost:3000'; 


document.addEventListener("DOMContentLoaded", async () => {
    feather.replace();

    const leaveRequestsTableBody = document.getElementById("leaveRequestsTableBody");
    const leaveRequestsMessage = document.getElementById("leaveRequestsMessage");
    const userAvatarNav = document.getElementById("userAvatar");
    const userNameNav = document.getElementById("userNameNav");
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

    const paginationControls = document.getElementById('paginationControls');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageInfo = document.getElementById('currentPageInfo');

    let currentPage = 1;
    const itemsPerPage = 10;
    let allLeaveRequestsData = [];

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

    const fetchAdminProfileDataForHeader = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                return null;
            }
            let user = authService.getCurrentUser();
            if (!user || user.role !== 'admin') {
                return null;
            }
            const userPhotoUrl = user.photo ? `${BACKEND_STATIC_BASE_URL}${user.photo}` : "https://placehold.co/40x40/E2E8F0/4A5568?text=AD";
            if (userAvatarNav) {
                userAvatarNav.src = userPhotoUrl;
                userAvatarNav.alt = user.name || "Admin";
            }
            if (userNameNav) {
                userNameNav.textContent = user.name || "Admin";
            }
        } catch (error) {
            console.error("Error fetching admin profile data for header:", error);
        }
    };

    const loadLeaveRequests = async () => {
        leaveRequestsTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">Memuat pengajuan...</td>
            </tr>
        `;
        leaveRequestsMessage.classList.add('hidden');
        paginationControls.classList.add('hidden');

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                showToast("Sesi tidak valid. Mengarahkan ke halaman login...", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }

            const currentUser = authService.getCurrentUser();
            if (!currentUser || currentUser.role !== 'admin') {
                showToast("Akses ditolak. Anda tidak memiliki izin untuk melihat halaman ini.", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }

            allLeaveRequestsData = await LeaveRequestService.getAllLeaveRequests(); 
            allLeaveRequestsData.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            if (allLeaveRequestsData.length === 0) {
                leaveRequestsTableBody.innerHTML = `
                    <tr>
                        <td colspan="9" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">Tidak ada pengajuan cuti/izin yang ditemukan.</td>
                    </tr>
                `;
                leaveRequestsMessage.textContent = 'Tidak ada pengajuan cuti atau izin yang perlu ditinjau.';
                leaveRequestsMessage.classList.remove('hidden');
                leaveRequestsMessage.classList.add('info');
            } else {
                renderLeaveRequestsTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
                if (allLeaveRequestsData.length > itemsPerPage) {
                    paginationControls.classList.remove('hidden');
                }
            }

        } catch (error) {
            console.error("Error loading leave requests:", error);
            leaveRequestsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-6 py-4 whitespace-nowrap text-center text-red-500">Gagal memuat pengajuan: ${error.message}</td>
                </tr>
            `;
            showToast(error.message || "Gagal memuat pengajuan cuti/izin.", "error");
            if (error.message.includes('token') || error.message.includes('sesi') || error.message.includes('Akses ditolak')) {
                setTimeout(() => authService.logout(), 2000);
            }
        }
    };

    // --- Fungsi untuk merender tabel pengajuan per halaman ---
    const renderLeaveRequestsTable = (data, page, limit) => {
        leaveRequestsTableBody.innerHTML = '';
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = data.slice(startIndex, endIndex);

        paginatedItems.forEach(request => {
            const row = leaveRequestsTableBody.insertRow();
            
            const formattedStartDate = new Date(request.start_date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
            const formattedEndDate = new Date(request.end_date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

            let statusClass = '';
            let statusText = '';
            if (request.status === 'pending') {
                statusClass = 'text-yellow-600 font-semibold';
                statusText = 'Menunggu';
            } else if (request.status === 'approved') {
                statusClass = 'text-green-600 font-semibold';
                statusText = 'Disetujui';
            } else if (request.status === 'rejected') {
                statusClass = 'text-red-600 font-semibold';
                statusText = 'Ditolak';
            }

            const attachmentLink = request.attachment_url ? 
                `<a href="${BACKEND_STATIC_BASE_URL}${request.attachment_url}" target="_blank" class="text-blue-600 hover:underline">Lihat Lampiran</a>` : 
                '-';
            
            const employeeName = request.user_name || request.user_email || request.user_id;

            // BARU: Tentukan URL foto atau placeholder
            const photoUrl = request.user_photo ? 
                             (request.user_photo.startsWith('http://') || request.user_photo.startsWith('https://') ? 
                                request.user_photo : // Jika sudah URL absolut (dari API), gunakan langsung
                                `${BACKEND_STATIC_BASE_URL}${request.user_photo}`) : // Jika relatif, tambahkan base URL
                             'https://placehold.co/40x40/E2E8F0/4A5568?text=ME'; // Placeholder jika kosong
            
            // Log debug yang sudah ada, ini akan menunjukkan URL yang benar setelah perbaikan
            console.log(`DEBUG: employeeName: ${employeeName}, user_photo dari API: ${request.user_photo}, Final photoUrl: ${photoUrl}`);

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full object-cover" src="${photoUrl}" alt="${employeeName}">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${employeeName}</div>
                            <div class="text-sm text-gray-500">${request.user_email || '-'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${request.request_type || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formattedStartDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formattedEndDate}</td>
                <td class="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">${request.reason || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${attachmentLink}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">${statusText}</td>
                <td class="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">${request.note || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${request.status === 'pending' ? `
                        <button data-id="${request.id}" data-action="approve" class="action-btn bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md text-xs mr-2">Setujui</button>
                        <button data-id="${request.id}" data-action="reject" class="action-btn bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs">Tolak</button>
                    ` : `
                        <span class="text-gray-500 text-xs">Selesai</span>
                    `}
                </td>
            `;
        });

        leaveRequestsTableBody.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', handleActionButtonClick);
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
                renderLeaveRequestsTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allLeaveRequestsData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderLeaveRequestsTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
            }
        });
    }

    // --- Handler untuk tombol Approve/Reject ---
    const handleActionButtonClick = async (event) => {
        const button = event.target;
        const requestId = button.dataset.id;
        const action = button.dataset.action;

        let statusToUpdate = '';
        let confirmMessage = '';
        let successMessage = '';
        let note = '';

        if (action === 'approve') {
            statusToUpdate = 'approved';
            confirmMessage = 'Anda yakin ingin MENYETUJUI pengajuan ini?';
            successMessage = 'Pengajuan berhasil disetujui.';
        } else if (action === 'reject') {
            statusToUpdate = 'rejected';
            confirmMessage = 'Anda yakin ingin MENOLAK pengajuan ini?';
            successMessage = 'Pengajuan berhasil ditolak.';
            note = prompt("Masukkan catatan penolakan (opsional):");
            if (note === null) return;
        } else {
            return;
        }

        const toastNode = document.createElement("div");
        toastNode.className = "flex flex-col items-center p-2";
        toastNode.innerHTML = `
            <p class="font-semibold text-white text-base mb-4">${confirmMessage}</p>
            <div class="flex space-x-3">
                <button id="confirmActionBtn" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">Ya</button>
                <button id="cancelActionBtn" class="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600">Batal</button>
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

        toastNode.querySelector("#confirmActionBtn").addEventListener("click", async () => {
            toast.hideToast();
            try {
                button.disabled = true;
                button.textContent = 'Memproses...';

                await LeaveRequestService.updateLeaveRequestStatus(requestId, statusToUpdate, note);
                showToast(successMessage, "success");
                loadLeaveRequests();
            }
            catch (error) {
                console.error("Error updating leave request status:", error);
                showToast(error.message || "Gagal memperbarui status pengajuan.", "error");
                button.disabled = false;
                button.textContent = action === 'approve' ? 'Setujui' : 'Tolak';
            }
        });
        toastNode.querySelector("#cancelActionBtn").addEventListener("click", () => {
            toast.hideToast();
        });
    };


    // --- Change Password Modal Logic ---
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

        toastNode.querySelector("#confirmActionBtn").addEventListener("click", () => {
            authService.logout();
            toast.hideToast();
        });
        toastNode.querySelector("#cancelActionBtn").addEventListener("click", () => {
            toast.hideToast();
        });
    };

    // --- Inisialisasi Halaman ---
    fetchAdminProfileDataForHeader();
    loadLeaveRequests();
});