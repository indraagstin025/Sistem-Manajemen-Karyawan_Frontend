// js/Karyawan/request_leave.js (atau RequestsLeave.js, pastikan namanya konsisten!)

import { authService } from '../Services/AuthServices.js';
import { userService } from "../Services/UserServices.js";
import { LeaveRequestService } from '../Services/LeaveRequestsServices.js';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

document.addEventListener("DOMContentLoaded", async () => {
    // Pastikan Feather Icons sudah dimuat di <head> atau sebelum script ini.
    // Jika masih ada error 'feather is not defined', cek urutan script di HTML Anda.
    feather.replace(); 

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
    // ✨ PERBAIKAN PENTING DI SINI ✨
    const changePasswordSuccessMessage = document.getElementById("changePasswordSuccessMessage"); 

    // Elemen Formulir Pengajuan Cuti/Izin
    const leaveRequestForm = document.getElementById("leaveRequestForm");
    const requestTypeInput = document.getElementById("requestType");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate"); 
    const endDateField = document.getElementById("endDateField"); // Referensi ke div pembungkus endDate
    const reasonInput = document.getElementById("reason");
    const attachmentSection = document.getElementById("attachmentSection");
    const attachmentInput = document.getElementById("attachment");
    const formMessage = document.getElementById("formMessage"); 

    // Elemen Riwayat Pengajuan
    const leaveHistoryTableBody = document.getElementById("leaveHistoryTableBody");
    const leaveHistoryMessage = document.getElementById("leaveHistoryMessage");
    const paginationControls = document.getElementById('paginationControls');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageInfo = document.getElementById('currentPageInfo');

    // Elemen untuk menampilkan ringkasan batasan cuti
    const leaveLimitSummaryElement = document.getElementById("leaveLimitSummary");

    let currentPage = 1;
    const itemsPerPage = 5; 
    let allLeaveRequestsData = []; 

    // --- Fungsi Utilitas (showToast) ---
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

    // --- Fungsi untuk memperbarui ringkasan batasan cuti di UI ---
    const updateLeaveLimitSummary = async () => {
        if (!leaveLimitSummaryElement) return;

        leaveLimitSummaryElement.innerHTML = `<p class="text-gray-500">Memuat informasi batasan cuti...</p>`;
        leaveLimitSummaryElement.classList.remove('hidden');

        try {
            const summary = await LeaveRequestService.getLeaveSummary();
            const currentYear = new Date().getFullYear();

            let annualMessage = `Anda sudah mengajukan <span class="font-bold">${summary.annual_leave_count}</span> kali cuti di tahun ${currentYear}. (Batas: 12 kali)`;
            let annualClass = 'text-gray-700';
            if (summary.annual_leave_count >= 12) {
                annualMessage = `<span class="font-bold text-red-600">Anda telah mencapai batas maksimal 12 kali pengajuan cuti untuk tahun ${currentYear}.</span>`;
                annualClass = 'text-red-600';
            } else if (summary.annual_leave_count >= 10) {
                annualClass = 'text-orange-500';
            }

            leaveLimitSummaryElement.innerHTML = `
                <p class="${annualClass}">📅 ${annualMessage}</p>
                <p class="text-sm text-gray-500 mt-2">Catatan: Pengajuan cuti dapat dilakukan berkali-kali dalam sebulan selama kuota tahunan masih ada.</p>
            `;
            leaveLimitSummaryElement.classList.remove('hidden');

        } catch (error) {
            console.error("Error updating leave limit summary:", error);
            leaveLimitSummaryElement.innerHTML = `<p class="text-red-500">Gagal memuat informasi batasan cuti.</p>`;
            leaveLimitSummaryElement.classList.remove('hidden');
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
            
            let dateDisplay = new Date(request.start_date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
            if (request.start_date !== request.end_date) {
                const endDate = new Date(request.end_date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                dateDisplay = `${dateDisplay} - ${endDate}`;
            }

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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${dateDisplay}</td>
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

    // --- Logika untuk menampilkan/menyembunyikan bagian lampiran dan mengontrol input EndDate ---
    requestTypeInput.addEventListener('change', () => {
        updateLeaveLimitSummary(); // Selalu update summary saat tipe berubah

        // Kontrol visibilitas dan persyaratan input attachment
        if (requestTypeInput.value === 'Sakit') {
            attachmentSection.classList.remove('hidden');
            attachmentInput.setAttribute('required', 'required');
        } else {
            attachmentSection.classList.add('hidden');
            attachmentInput.removeAttribute('required');
            attachmentInput.value = ''; // Kosongkan file jika tidak diperlukan
        }

        // Kontrol visibilitas dan persyaratan input endDate
        if (requestTypeInput.value === 'Cuti') {
            endDateField.classList.add('hidden'); // Sembunyikan div parent dari endDateInput
            endDateInput.removeAttribute('required'); // Hapus atribut required
            endDateInput.value = startDateInput.value; // Atur endDate sama dengan startDate

            // Set min dan max date untuk startDate agar pengguna tidak bisa memilih rentang tanggal
            startDateInput.setAttribute('max', startDateInput.value); 
            startDateInput.setAttribute('min', startDateInput.value); 
        } else { // Jika Sakit atau jenis lain
            endDateField.classList.remove('hidden'); // Tampilkan endDate
            endDateInput.setAttribute('required', 'required'); // Wajibkan endDate
            startDateInput.removeAttribute('max'); // Hapus batasan max dari startDate
            startDateInput.removeAttribute('min'); // Hapus batasan min dari startDate
        }
    });

    // Event listener tambahan untuk memastikan endDate tetap sama dengan startDate jika type adalah Cuti
    startDateInput.addEventListener('change', () => {
        if (requestTypeInput.value === 'Cuti') {
            endDateInput.value = startDateInput.value;
            // Pastikan juga max/min date diperbarui jika startDate berubah,
            // ini penting agar input date HTML membatasi pilihan pengguna
            startDateInput.setAttribute('max', startDateInput.value); 
            startDateInput.setAttribute('min', startDateInput.value); 
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
        const endDate = endDateInput.value; // Ambil nilai endDate
        const reason = reasonInput.value;
        const file = attachmentInput.files[0];

        // Validasi Tanggal Umum (StartDate tidak boleh setelah EndDate)
        if (new Date(startDate) > new Date(endDate)) {
            showToast("Tanggal selesai tidak boleh sebelum tanggal mulai.", "error");
            formMessage.textContent = "Tanggal selesai tidak boleh sebelum tanggal mulai.";
            formMessage.classList.remove("hidden");
            formMessage.classList.add("error");
            isSubmitting = false;
            return;
        }

        // --- PENGECEKAN BATASAN KHUSUS BERDASARKAN TIPE PENGAJUAN ---
        if (requestType === 'Cuti') {
            // Validasi Frontend: Tanggal mulai dan selesai harus sama untuk Cuti
            if (startDate !== endDate) {
                showToast("Untuk pengajuan 'Cuti', tanggal mulai dan tanggal selesai harus sama.", "error");
                formMessage.textContent = "Untuk pengajuan 'Cuti', tanggal mulai dan tanggal selesai harus sama.";
                formMessage.classList.remove("hidden");
                formMessage.classList.add("error");
                isSubmitting = false;
                return;
            }

            // Cek Batasan Tahunan Cuti
            try {
                const summary = await LeaveRequestService.getLeaveSummary();
                const currentYear = new Date().getFullYear();

                if (summary.annual_leave_count >= 12) {
                    showToast(`Anda telah mencapai batas maksimal 12 kali pengajuan Cuti untuk tahun ${currentYear}.`, "error");
                    formMessage.textContent = `Anda telah mencapai batas maksimal 12 kali pengajuan Cuti untuk tahun ${currentYear}.`;
                    formMessage.classList.remove("hidden");
                    formMessage.classList.add("error");
                    isSubmitting = false;
                    return;
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
        // Tidak ada validasi khusus untuk Sakit di sini selain lampiran,
        // karena tumpang tindih akan ditangani oleh backend untuk rentang tanggal.

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
        } else if (requestType === 'Sakit' && attachmentInput.hasAttribute('required')) {
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
        formData.append("end_date", endDate); // Pastikan endDate dikirim
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
            attachmentInput.value = '';
            // Panggil event change secara manual untuk mereset tampilan input tanggal setelah reset form
            requestTypeInput.dispatchEvent(new Event('change')); 
            await loadLeaveHistory();
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
    fetchEmployeeProfileDataForHeader();
    await loadLeaveHistory(); // Memuat riwayat dan summary

    // Panggil event change secara manual saat DOM dimuat untuk inisialisasi tampilan input tanggal yang benar
    // Ini penting agar endDateField diatur sembunyi/tampil berdasarkan nilai default requestTypeInput
    requestTypeInput.dispatchEvent(new Event('change'));
});