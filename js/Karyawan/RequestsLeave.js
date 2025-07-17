// js/Karyawan/request_leave.js

import { authService } from '../Services/AuthServices.js';
import { userService } from "../Services/UserServices.js";
import { LeaveRequestService } from '../Services/LeaveRequestsServices.js'; // Menggunakan export const
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

    // ✨ Elemen baru untuk menampilkan ringkasan batasan cuti ✨
    const leaveLimitSummaryElement = document.getElementById("leaveLimitSummary");


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
                leaveHistoryMessage.textContent = 'Anda belum memiliki riwayat pengajuan cuti atau sakit.';
                leaveHistoryMessage.classList.remove('hidden');
                leaveHistoryMessage.classList.add('info');
            } else {
                renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
                if (allLeaveRequestsData.length > itemsPerPage) {
                    paginationControls.classList.remove('hidden');
                }
            }

            // ✨ Panggil fungsi baru untuk memuat ringkasan cuti setelah riwayat dimuat ✨
            await updateLeaveLimitSummary();

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

    // ✨ FUNGSI BARU: Untuk memperbarui ringkasan batasan cuti di UI ✨
    const updateLeaveLimitSummary = async () => {
        if (!leaveLimitSummaryElement) return; // Pastikan elemen ada

        leaveLimitSummaryElement.innerHTML = `<p class="text-gray-500">Memuat informasi batasan cuti...</p>`;
        leaveLimitSummaryElement.classList.remove('hidden');

        try {
            // Panggil service untuk mendapatkan ringkasan cuti dari backend
            const summary = await LeaveRequestService.getLeaveSummary();
            const currentYear = new Date().getFullYear();
            const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long' });

            let annualMessage = `Anda sudah mengajukan <span class="font-bold">${summary.annual_leave_count}</span> kali cuti di tahun ${currentYear}. (Batas: 12 kali)`;
            let annualClass = 'text-gray-700';
            if (summary.annual_leave_count >= 12) {
                annualMessage = `<span class="font-bold text-red-600">Anda telah mencapai batas maksimal 12 kali pengajuan cuti untuk tahun ${currentYear}.</span>`;
                annualClass = 'text-red-600';
            } else if (summary.annual_leave_count >= 10) { // Contoh: mendekati batas
                annualClass = 'text-orange-500';
            }

            let monthlyMessage = `Di bulan ${currentMonthName}, Anda sudah mengajukan <span class="font-bold">${summary.current_month_leave_count}</span> kali cuti. (Batas: 1 kali)`;
            let monthlyClass = 'text-gray-700';
            if (summary.current_month_leave_count > 0) {
                monthlyMessage = `<span class="font-bold text-red-600">Anda sudah mengajukan cuti di bulan ${currentMonthName} ini.</span>`;
                monthlyClass = 'text-red-600';
            }

            leaveLimitSummaryElement.innerHTML = `
                <p class="${annualClass}">📅 ${annualMessage}</p>
                <p class="${monthlyClass}">🗓️ ${monthlyMessage}</p>
            `;
            leaveLimitSummaryElement.classList.remove('hidden');

        } catch (error) {
            console.error("Error updating leave limit summary:", error);
            leaveLimitSummaryElement.innerHTML = `<p class="text-red-500">Gagal memuat informasi batasan cuti.</p>`;
            leaveLimitSummaryElement.classList.remove('hidden');
            // Jika error adalah Unauthorized/Forbidden, arahkan ke login
            if (error.status === 401 || error.status === 403) {
                showToast("Sesi tidak valid. Mengarahkan ke halaman login...", "error");
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
        // ✨ Pastikan juga update summary saat tipe berubah, karena batas cuti hanya untuk 'Cuti' ✨
        updateLeaveLimitSummary(); 
        if (requestTypeInput.value === 'Sakit') {
            attachmentSection.classList.remove('hidden');
            attachmentInput.setAttribute('required', 'required');
        } else {
            attachmentSection.classList.add('hidden');
            attachmentInput.removeAttribute('required');
            attachmentInput.value = '';
        }
    });

    // --- Event Listener Submit Formulir Pengajuan Cuti/Izin ---
    let isSubmitting = false;

    leaveRequestForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isSubmitting) return;
        isSubmitting = true;

        formMessage.classList.add("hidden");
        formMessage.textContent = '';

        const requestType = requestTypeInput.value;
        const startDate = startDateInput.value;
        // const endDate = endDateInput.value; // Tidak digunakan langsung dalam formData
        const reason = reasonInput.value;
        const file = attachmentInput.files[0];

        // ✨ PENGECEKAN BATASAN CUTI DI FRONTEND ✨
        if (requestType === 'Cuti') {
            try {
                const summary = await LeaveRequestService.getLeaveSummary();
                const selectedStartDate = new Date(startDate);
                const currentYear = new Date().getFullYear();

                // Cek batasan tahunan
                if (summary.annual_leave_count >= 12) {
                    showToast(`Anda telah mencapai batas maksimal 12 kali pengajuan Cuti untuk tahun ${currentYear}.`, "error");
                    formMessage.textContent = `Anda telah mencapai batas maksimal 12 kali pengajuan Cuti untuk tahun ${currentYear}.`;
                    formMessage.classList.remove("hidden");
                    formMessage.classList.add("error");
                    isSubmitting = false;
                    return; // Hentikan proses submit
                }

                // Cek batasan bulanan (gunakan data dari summary API yang lebih akurat)
                // Kita perlu membandingkan bulan yang diajukan dengan bulan sekarang
                const submittedMonth = selectedStartDate.getMonth(); // 0-11
                const submittedYear = selectedStartDate.getFullYear();

                const today = new Date();
                const currentMonth = today.getMonth();
                const currentMonthName = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });


                // Jika tanggal mulai pengajuan ada di bulan yang sama dengan bulan sekarang DAN summary menunjukkan sudah ada pengajuan di bulan ini
                if (submittedMonth === currentMonth && submittedYear === currentYear && summary.current_month_leave_count > 0) {
                     showToast(`Anda hanya dapat mengajukan Cuti satu kali dalam bulan ${currentMonthName}. Anda sudah memiliki pengajuan cuti di bulan ini.`, "error");
                     formMessage.textContent = `Anda hanya dapat mengajukan Cuti satu kali dalam bulan ${currentMonthName}. Anda sudah memiliki pengajuan cuti di bulan ini.`;
                     formMessage.classList.remove("hidden");
                     formMessage.classList.add("error");
                     isSubmitting = false;
                     return; // Hentikan proses submit
                }

            } catch (error) {
                console.error("Error saat memeriksa batasan cuti di frontend:", error);
                showToast("Gagal memeriksa batasan cuti. Silakan coba lagi.", "error");
                formMessage.textContent = "Gagal memeriksa batasan cuti. Silakan coba lagi.";
                formMessage.classList.remove("hidden");
                formMessage.classList.add("error");
                isSubmitting = false;
                return;
            }
        }
        // ✨ AKHIR PENGECEKAN BATASAN CUTI ✨

        // Validasi file attachment dan buat FormData
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast("Ukuran file terlalu besar! Maksimal 2MB.", "error");
                formMessage.textContent = "Ukuran file terlalu besar! Maksimal 2MB.";
                formMessage.classList.remove("hidden");
                formMessage.classList.add("error");
                isSubmitting = false;
                return;
            }
        } else if (requestTypeInput.value === 'Sakit' && attachmentInput.hasAttribute('required')) {
            showToast("Lampiran (surat dokter) wajib untuk pengajuan Sakit.", "error");
            formMessage.textContent = "Lampiran (surat dokter) wajib untuk pengajuan Sakit.";
            formMessage.classList.remove("hidden");
            formMessage.classList.add("error");
            isSubmitting = false;
            return;
        }

        const formData = new FormData();
        formData.append("request_type", requestType);
        formData.append("start_date", startDate);
        formData.append("end_date", endDateInput.value); // Pastikan endDate juga ditambahkan
        formData.append("reason", reason);
        if (file) {
            formData.append("attachment", file);
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
            attachmentInput.value = ''; // Penting untuk mereset input file
            await loadLeaveHistory(); // Muat ulang riwayat dan ringkasan setelah submit
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
            if (!currentUser || !currentUser.id) {
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
    fetchEmployeeProfileDataForHeader(); // Muat data profil untuk avatar di header
    loadLeaveHistory(); // Muat riwayat pengajuan saat halaman dimuat (akan memicu updateLeaveLimitSummary juga)
});