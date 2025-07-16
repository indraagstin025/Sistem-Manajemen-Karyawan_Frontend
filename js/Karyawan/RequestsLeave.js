
import { authService } from '../Services/AuthServices.js';
import { userService } from "../Services/UserServices.js";
import { LeaveRequestService } from '../Services/LeaveRequestsServices.js'; // Menggunakan export const
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace(); // Inisialisasi ikon Feather

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

    const leaveRequestForm = document.getElementById("leaveRequestForm");
    const requestTypeInput = document.getElementById("requestType");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const reasonInput = document.getElementById("reason");
    const attachmentSection = document.getElementById("attachmentSection");
    const attachmentInput = document.getElementById("attachment");
    const formMessage = document.getElementById("formMessage"); 

    const leaveHistoryTableBody = document.getElementById("leaveHistoryTableBody");
    const leaveHistoryMessage = document.getElementById("leaveHistoryMessage");
    const paginationControls = document.getElementById('paginationControls');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageInfo = document.getElementById('currentPageInfo');

    let currentPage = 1;
    const itemsPerPage = 5; 
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

    const fetchEmployeeProfileDataForHeader = async () => {
        try {
            let user = authService.getCurrentUser();
            if (!user || !user.id) { 
                return null;
            }
            const employeeData = await userService.getUserByID(user.id); 
            if (employeeData && userAvatarNav) {
                userAvatarNav.src = employeeData.photo || "https://via.placeholder.com/40x40/E2E8F0/4A5568?text=ME";
                userAvatarNav.alt = employeeData.name;
            }
            return employeeData;
        } catch (error) {
            console.error("Error fetching employee profile data for header:", error);
            if (error.status === 401 || error.status === 403) {
                showToast("Sesi tidak valid. Mengarahkan ke halaman login...", "error");
                setTimeout(() => authService.logout(), 2000);
            } else {
                showToast(error.message || "Gagal memuat data profil header.", "error");
            }
            return null;
        }
    };

    const loadLeaveHistory = async () => {
        leaveHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">Memuat riwayat pengajuan...</td>
            </tr>
        `;
        leaveHistoryMessage.classList.add('hidden');
        paginationControls.classList.add('hidden');

        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser || currentUser.role !== 'karyawan') {
                showToast("Akses ditolak. Anda tidak memiliki izin untuk melihat halaman ini.", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }
            
            let fetchedData = await LeaveRequestService.getMyLeaveRequests(); 

            if (!Array.isArray(fetchedData)) {
                console.warn("Peringatan: API /leave-requests/my-requests tidak mengembalikan array. Menerima:", fetchedData);
                fetchedData = []; 
                showToast("Peringatan: Format data riwayat pengajuan tidak valid dari server.", "info"); 
            }

            allLeaveRequestsData = fetchedData;
            allLeaveRequestsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); 

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
            console.error("Error loading leave history:", error);
            leaveHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 whitespace-nowrap text-center text-red-500">Gagal memuat riwayat pengajuan: ${error.message}</td>
                </tr>
            `;
            showToast(error.message || "Gagal memuat riwayat pengajuan.", "error");
            if (error.status === 401 || error.status === 403) {
                setTimeout(() => authService.logout(), 2000);
            }
        }
    };

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

    requestTypeInput.addEventListener('change', () => {
        if (requestTypeInput.value === 'Sakit') { 
            attachmentSection.classList.remove('hidden');
            attachmentInput.setAttribute('required', 'required'); 
        } else {
            attachmentSection.classList.add('hidden');
            attachmentInput.removeAttribute('required');
            attachmentInput.value = ''; 
        }
    });

let isSubmitting = false;

leaveRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) return; 
    isSubmitting = true;

    formMessage.classList.add("hidden");
    formMessage.textContent = '';

    const formData = new FormData();
    formData.append("request_type", requestTypeInput.value);
    formData.append("start_date", startDateInput.value);
    formData.append("end_date", endDateInput.value);
    formData.append("reason", reasonInput.value);

    const file = attachmentInput.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            showToast("Ukuran file terlalu besar! Maksimal 2MB.", "error");
            formMessage.textContent = "Ukuran file terlalu besar! Maksimal 2MB.";
            formMessage.classList.remove("hidden");
            formMessage.classList.add("error");
            isSubmitting = false; 
            return;
        }
        formData.append("attachment", file);
    } else if (requestTypeInput.value === 'Sakit' && attachmentInput.hasAttribute('required')) {
        showToast("Lampiran (surat dokter) wajib untuk pengajuan Sakit.", "error");
        formMessage.textContent = "Lampiran (surat dokter) wajib untuk pengajuan Sakit.";
        formMessage.classList.remove("hidden");
        formMessage.classList.add("error");
        isSubmitting = false;
        return;
    }

    try {
        const response = await LeaveRequestService.createLeaveRequest(formData);
        showToast(response.message || "Pengajuan berhasil dikirim!", "success");

        formMessage.textContent = "Pengajuan berhasil dikirim dan menunggu persetujuan admin.";
        formMessage.classList.remove("hidden", "error");
        formMessage.classList.add("success");

        leaveRequestForm.reset();
        attachmentSection.classList.add('hidden');
        attachmentInput.removeAttribute('required');
        loadLeaveHistory();
    } catch (error) {
        console.error("Error submitting leave request:", error);
        const errorMessage = error.message || "Gagal mengirim pengajuan. Silakan coba lagi.";
        showToast(errorMessage, "error");
        formMessage.textContent = errorMessage;
        formMessage.classList.remove("hidden", "success");
        formMessage.classList.add("error");

        if (error.status === 401 || error.status === 403) {
            setTimeout(() => authService.logout(), 2000);
        }
    } finally {
        isSubmitting = false; 
    }
});



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
            if (!currentUser || !currentUser.id) { // Tidak perlu lagi cek localStorage.getItem('token')
                showToast("Sesi tidak valid. Harap login kembali.", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }

            try {
                await authService.changePassword(oldPassword, newPassword); 
                changePasswordSuccessMessage.textContent = "Password berhasil diubah!";
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

    fetchEmployeeProfileDataForHeader();
    loadLeaveHistory();
});