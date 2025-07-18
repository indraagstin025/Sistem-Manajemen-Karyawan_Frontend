// js/Karyawan/RequestsLeave.js

// --- IMPORTS ---
import { authService } from '../Services/AuthServices.js';
import { userService } from "../Services/UserServices.js";
import { LeaveRequestService } from '../Services/LeaveRequestsServices.js';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { initializeLogout } from '../components/logoutHandler.js';
import { getUserPhotoBlobUrl } from '../utils/photoUtils.js'; // Pastikan path benar

document.addEventListener("DOMContentLoaded", () => {
    feather.replace();

    // --- SELEKSI ELEMEN DOM ---
    const userAvatarNav = document.getElementById("userAvatar");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userDropdownContainer = document.getElementById("userDropdown");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const mobileSidebar = document.getElementById("mobileSidebar");
    const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
    const closeSidebar = document.getElementById("closeSidebar");
    const leaveRequestForm = document.getElementById("leaveRequestForm");
    const requestTypeInput = document.getElementById("requestType");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const endDateField = document.getElementById("endDateField");
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
    const leaveLimitSummaryElement = document.getElementById("leaveLimitSummary");

    // --- STATE MANAGEMENT ---
    let currentPage = 1;
    const itemsPerPage = 5;
    let allLeaveRequestsData = [];
    let isSubmitting = false;

    // --- FUNGSI UTILITAS ---
    const showToast = (message, type = "success") => {
        let backgroundColor;
        if (type === "success") backgroundColor = "linear-gradient(to right, #22c55e, #16a34a)";
        else if (type === "error") backgroundColor = "linear-gradient(to right, #ef4444, #dc2626)";
        else backgroundColor = "linear-gradient(to right, #3b82f6, #2563eb)";
        Toastify({ text: message, duration: 3000, close: true, gravity: "top", position: "right", stopOnFocus: true, style: { background: backgroundColor, borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", padding: "12px 20px" } }).showToast();
    };
    
    // --- FUNGSI RENDER UI ---
    const renderLeaveHistoryTable = (data, page, limit) => {
        leaveHistoryTableBody.innerHTML = '';
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = data.slice(startIndex, endIndex);

        if (paginatedItems.length === 0 && page === 1) {
            leaveHistoryTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Tidak ada riwayat pengajuan.</td></tr>`;
            leaveHistoryMessage.textContent = 'Anda belum memiliki riwayat pengajuan cuti atau sakit.';
            leaveHistoryMessage.classList.remove('hidden', 'info');
            paginationControls.classList.add('hidden');
            return;
        }

        paginatedItems.forEach(request => {
            const row = leaveHistoryTableBody.insertRow();
            let dateDisplay = new Date(request.start_date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
            if (request.start_date !== request.end_date) {
                const endDate = new Date(request.end_date + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                dateDisplay = `${dateDisplay} - ${endDate}`;
            }

            let statusClass = '', statusText = request.status;
            switch (request.status) {
                case 'pending': statusClass = 'text-yellow-600'; statusText = 'Menunggu'; break;
                case 'approved': statusClass = 'text-green-600'; statusText = 'Disetujui'; break;
                case 'rejected': statusClass = 'text-red-600'; statusText = 'Ditolak'; break;
                default: statusClass = 'text-gray-600'; break;
            }
            row.innerHTML = `<td class="px-6 py-4 text-sm text-gray-900">${dateDisplay}</td><td class="px-6 py-4 text-sm text-gray-700">${request.request_type || '-'}</td><td class="px-6 py-4 text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis">${request.reason || '-'}</td><td class="px-6 py-4 text-sm ${statusClass} font-semibold">${statusText}</td><td class="px-6 py-4 text-sm text-gray-700">${request.attachment_url ? `<a href="${request.attachment_url}" target="_blank" class="text-teal-600 hover:underline">Lihat Lampiran</a>` : '-'}</td>`;
        });
    };

    const updatePaginationControls = (totalItems, page, limit) => {
        const totalPages = Math.ceil(totalItems / limit);
        if (totalPages <= 1) {
            paginationControls.classList.add('hidden');
            return;
        }
        paginationControls.classList.remove('hidden');
        currentPageInfo.textContent = `Halaman ${page} dari ${totalPages}`;
        prevPageBtn.disabled = page === 1;
        nextPageBtn.disabled = page === totalPages;
    };

    const updateLeaveLimitSummaryUI = (summary) => {
        if (!leaveLimitSummaryElement || !summary) return;
        const currentYear = new Date().getFullYear();
        let annualMessage = `Anda sudah mengajukan <span class="font-bold">${summary.annual_leave_count}</span> kali cuti di tahun ${currentYear}. (Batas: 12 kali)`;
        let annualClass = 'text-gray-700';
        if (summary.annual_leave_count >= 12) {
            annualMessage = `<span class="font-bold text-red-600">Anda telah mencapai batas maksimal 12 kali pengajuan cuti untuk tahun ${currentYear}.</span>`;
            annualClass = 'text-red-600';
        } else if (summary.annual_leave_count >= 10) {
            annualClass = 'text-orange-500';
        }
        leaveLimitSummaryElement.innerHTML = `<p class="${annualClass}">📅 ${annualMessage}</p><p class="text-sm text-gray-500 mt-2">Catatan: Pengajuan cuti dapat dilakukan berkali-kali dalam sebulan selama kuota tahunan masih ada.</p>`;
        leaveLimitSummaryElement.classList.remove('hidden');
    };

    // --- EVENT LISTENERS ---
    const setupEventListeners = () => {
        // Pagination
        prevPageBtn?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
            }
        });
        nextPageBtn?.addEventListener('click', () => {
            const totalPages = Math.ceil(allLeaveRequestsData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
            }
        });

        // Form Logic
        requestTypeInput?.addEventListener('change', () => {
            if (requestTypeInput.value === 'Sakit') {
                attachmentSection.classList.remove('hidden');
                attachmentInput.setAttribute('required', 'required');
            } else {
                attachmentSection.classList.add('hidden');
                attachmentInput.removeAttribute('required');
                attachmentInput.value = '';
            }
        });

        leaveRequestForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (isSubmitting) return;
            isSubmitting = true;
            formMessage.classList.add("hidden");

            const requestType = requestTypeInput.value;
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            if (new Date(startDate) > new Date(endDate)) {
                showToast("Tanggal selesai tidak boleh sebelum tanggal mulai.", "error");
                isSubmitting = false;
                return;
            }

            const formData = new FormData(leaveRequestForm);
            try {
                const response = await LeaveRequestService.createLeaveRequest(formData);
                showToast(response.message || "Pengajuan berhasil dikirim!", "success");
                leaveRequestForm.reset();
                requestTypeInput.dispatchEvent(new Event('change'));
                await initializePage(); // Muat ulang semua data setelah berhasil submit
            } catch (error) {
                const errorMessage = error.message || "Gagal mengirim pengajuan.";
                showToast(errorMessage, "error");
            } finally {
                isSubmitting = false;
            }
        });

        // UI Interactions
        userDropdownContainer?.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle("active");
        });
        document.addEventListener("click", () => dropdownMenu?.classList.remove("active"));
        initializeLogout();

        if (sidebarToggle && mobileSidebar && mobileSidebarPanel && closeSidebar) {
            const showMobileSidebar = () => { mobileSidebar.classList.remove("hidden"); setTimeout(() => { mobileSidebar.classList.add("opacity-100"); mobileSidebarPanel.classList.remove("-translate-x-full"); }, 10); };
            const hideMobileSidebar = () => { mobileSidebar.classList.remove("opacity-100"); mobileSidebarPanel.classList.add("-translate-x-full"); setTimeout(() => mobileSidebar.classList.add("hidden"), 300); };
            sidebarToggle.addEventListener("click", showMobileSidebar);
            closeSidebar.addEventListener("click", hideMobileSidebar);
            mobileSidebar.addEventListener("click", (e) => { if (e.target === mobileSidebar) hideMobileSidebar(); });
        }
    };

    // --- [PERUBAHAN UTAMA] --- FUNGSI INISIALISASI HALAMAN ---
    const initializePage = async () => {
        // Tampilkan loading state
        leaveHistoryTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Memuat data...</td></tr>`;
        leaveLimitSummaryElement.innerHTML = `<p class="text-gray-500">Memuat info...</p>`;

        try {
            const user = authService.getCurrentUser();
            if (!user || user.role !== 'karyawan') {
                showToast("Akses ditolak atau sesi tidak valid.", "error");
                authService.logout();
                return;
            }

            // Jalankan semua permintaan data secara paralel untuk performa lebih cepat
            const [leaveHistory, leaveSummary, photoUrl] = await Promise.all([
                LeaveRequestService.getMyLeaveRequests(),
                LeaveRequestService.getLeaveSummary(),
                getUserPhotoBlobUrl(user.id, user.name || 'User')
            ]);
            
            // 1. Set Avatar Pengguna
            if (userAvatarNav) {
                userAvatarNav.src = photoUrl;
                userAvatarNav.alt = user.name || "User Avatar";
            }

            // 2. Tampilkan Ringkasan Jatah Cuti
            updateLeaveLimitSummaryUI(leaveSummary);

            // 3. Render Tabel Riwayat Cuti
            allLeaveRequestsData = Array.isArray(leaveHistory) ? leaveHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
            currentPage = 1; // Selalu reset ke halaman pertama saat memuat ulang
            renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
            updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);

        } catch (error) {
            console.error("Error initializing page:", error);
            showToast(error.message || "Gagal memuat data halaman.", "error");
            leaveHistoryTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Gagal memuat data: ${error.message}</td></tr>`;
            if (error.status === 401 || error.status === 403) {
                authService.logout();
            }
        }
    };

    // --- EKSEKUSI AWAL ---
    setupEventListeners();
    initializePage();
    requestTypeInput.dispatchEvent(new Event('change'));
});