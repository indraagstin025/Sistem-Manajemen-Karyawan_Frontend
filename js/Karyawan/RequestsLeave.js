// js/Karyawan/RequestsLeave.js (Pastikan nama file fisik Anda benar: RequestsLeave.js)

import { authService } from '../Services/AuthServices.js';
import { userService } from "../Services/UserServices.js";
import { LeaveRequestService } from '../Services/LeaveRequestsServices.js';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

// ✨ IMPOR BARU ✨
import { initializeLogout } from '../components/logoutHandler.js'; // Pastikan path benar
import { getUserPhotoBlobUrl } from '../utils/photoUtils.js';     // Pastikan path benar
import { initTheme } from '../utils/darkmode.js';

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace(); // Inisialisasi ikon Feather
    initTheme();

    // --- Seleksi Elemen DOM ---
    const userAvatarNav = document.getElementById("userAvatar");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userDropdownContainer = document.getElementById("userDropdown");
    // const allLogoutButtons = document.querySelectorAll("#logoutButton, #dropdownLogoutButton, #mobileLogoutButton"); // ✨ DIHAPUS - Dikelola oleh logoutHandler.js ✨
    const sidebarToggle = document.getElementById("sidebarToggle");
    const mobileSidebar = document.getElementById("mobileSidebar");
    const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
    const closeSidebar = document.getElementById("closeSidebar");

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
            const user = authService.getCurrentUser();
            if (!user || !user.id) {
                return null;
            }
            // ✨ GUNAKAN getUserPhotoBlobUrl dari photoUtils.js ✨
            const photoUrl = await getUserPhotoBlobUrl(user.id, user.name || ''); 
            if (userAvatarNav) {
                userAvatarNav.src = photoUrl;
                userAvatarNav.alt = user.name || "User Avatar"; // Gunakan user.name jika ada
            }
            return user; // Cukup kembalikan objek user dari sesi
        } catch (error) {
            console.error("Error fetching employee profile data for header:", error);
            if (error.status === 401 || error.status === 403) {
                showToast("Sesi tidak valid. Mengarahkan ke halaman login...", "error");
                authService.logout(); // Langsung panggil logout
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
                authService.logout(); 
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
                authService.logout();
            }
        }
    };

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
                authService.logout();
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

    requestTypeInput.addEventListener('change', () => {
        updateLeaveLimitSummary(); 
        if (requestTypeInput.value === 'Sakit') {
            attachmentSection.classList.remove('hidden');
            attachmentInput.setAttribute('required', 'required');
        } else {
            attachmentSection.classList.add('hidden');
            attachmentInput.removeAttribute('required');
            attachmentInput.value = '';
        }

        if (requestTypeInput.value === 'Cuti') {
            endDateField.classList.add('hidden'); 
            endDateInput.removeAttribute('required'); 
            endDateInput.value = startDateInput.value; 

            startDateInput.setAttribute('max', startDateInput.value); 
            startDateInput.setAttribute('min', startDateInput.value); 
        } else { 
            endDateField.classList.remove('hidden'); 
            endDateInput.setAttribute('required', 'required'); 
            startDateInput.removeAttribute('max'); 
            startDateInput.removeAttribute('min'); 
        }
    });

    startDateInput.addEventListener('change', () => {
        if (requestTypeInput.value === 'Cuti') {
            endDateInput.value = startDateInput.value;
            startDateInput.setAttribute('max', startDateInput.value); 
            startDateInput.setAttribute('min', startDateInput.value); 
        }
    });

    let isSubmitting = false;

    leaveRequestForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isSubmitting) return;
        isSubmitting = true;

        formMessage.classList.add("hidden");
        formMessage.textContent = '';

        const requestType = requestTypeInput.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value; 
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
            if (startDate !== endDate) {
                showToast("Untuk pengajuan 'Cuti', tanggal mulai dan tanggal selesai harus sama.", "error");
                formMessage.textContent = "Untuk pengajuan 'Cuti', tanggal mulai dan tanggal selesai harus sama.";
                formMessage.classList.remove("hidden");
                formMessage.classList.add("error");
                isSubmitting = false;
                return;
            }

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
        formData.append("end_date", endDate); 
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
                authService.logout();
            }
        } finally {
            isSubmitting = false;
        }
    });

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
    initializeLogout({

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

    fetchEmployeeProfileDataForHeader();
    await loadLeaveHistory();

    requestTypeInput.dispatchEvent(new Event('change'));
});