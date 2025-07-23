import { authService } from "../Services/AuthServices.js";
import { LeaveRequestService } from "../Services/LeaveRequestsServices.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { initializeSidebar } from "../components/sidebarHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js";

// Import modul yang baru dibuat
import { showToast } from "./ComponentsLeave/UIHelpers.js";
import { initializeAttachmentModal, setAttachmentHandlers as setAttachmentModalHandlers } from "./ComponentsLeave/AttachmentModal.js";
import { initializeLeaveTable, renderLeaveHistoryTable, setAttachmentHandlers as setLeaveTableHandlers } from "./ComponentsLeave/LeaveTable.js";
import { initializeLeaveForm, setInitializePageCallback } from "./ComponentsLeave/LeaveForm.js";

document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi Sidebar
    initializeSidebar();

    // Dapatkan referensi elemen DOM yang masih diperlukan di file utama
    const userAvatarNav = document.getElementById("userAvatar");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userDropdownContainer = document.getElementById("userDropdown");
    const leaveLimitSummaryElement = document.getElementById("leaveLimitSummary");
    const leaveHistoryTableBody = document.getElementById("leaveHistoryTableBody");
    const requestTypeInput = document.getElementById("requestType");

    // Inisialisasi modal lampiran dan dapatkan handler-nya
    const { handleViewAttachment, handleDownloadAttachment } = initializeAttachmentModal();

    // Suntikkan handler ke modul LeaveTable agar tombol "Lihat" dan "Unduh" berfungsi
    setAttachmentModalHandlers(handleViewAttachment, handleDownloadAttachment);
    setLeaveTableHandlers(handleViewAttachment, handleDownloadAttachment);

    // Inisialisasi fitur tabel dan form
    initializeLeaveTable();
    initializeLeaveForm();

    /**
     * Memperbarui tampilan ringkasan batas cuti tahunan.
     * @param {object} summary - Objek ringkasan cuti.
     */
    const updateLeaveLimitSummaryUI = (summary) => {
        if (!leaveLimitSummaryElement || !summary) return;
        const currentYear = new Date().getFullYear();
        let annualMessage = `Anda sudah mengajukan <span class="font-bold">${summary.annual_leave_count}</span> kali cuti di tahun ${currentYear}. (Batas: 12 kali)`;
        let annualClass = "text-gray-700";
        if (summary.annual_leave_count >= 12) {
            annualMessage = `<span class="font-bold text-red-600">Anda telah mencapai batas maksimal 12 kali pengajuan cuti untuk tahun ${currentYear}.</span>`;
            annualClass = "text-red-600";
        } else if (summary.annual_leave_count >= 10) {
            annualClass = "text-orange-500";
        }
        leaveLimitSummaryElement.innerHTML = `<p class="${annualClass}">📅 ${annualMessage}</p><p class="text-sm text-gray-500 mt-2">Catatan: Pengajuan cuti dapat dilakukan berkali-kali dalam sebulan selama kuota tahunan masih ada.</p>`;
        leaveLimitSummaryElement.classList.remove("hidden");
    };

    /**
     * Fungsi inisialisasi halaman utama yang memuat data dan memperbarui UI.
     */
    const initializePage = async () => {
        if (leaveHistoryTableBody) {
            leaveHistoryTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Memuat data...</td></tr>`;
        }
        if (leaveLimitSummaryElement) {
            leaveLimitSummaryElement.innerHTML = `<p class="text-gray-500">Memuat info...</p>`;
        }

        try {
            const user = authService.getCurrentUser();
            if (!user || user.role !== "karyawan") {
                showToast("Akses ditolak atau sesi tidak valid.", "error");
                authService.logout();
                return;
            }

            const [leaveHistory, leaveSummary, photoUrl] = await Promise.all([
                LeaveRequestService.getMyLeaveRequests(),
                LeaveRequestService.getLeaveSummary(),
                getUserPhotoBlobUrl(user.id, user.name || "User")
            ]);

            if (userAvatarNav) {
                userAvatarNav.src = photoUrl;
                userAvatarNav.alt = user.name || "User Avatar";
            }

            updateLeaveLimitSummaryUI(leaveSummary);

            // Render tabel menggunakan fungsi dari modul LeaveTable
            renderLeaveHistoryTable(leaveHistory, 1, 5); // Mulai dari halaman 1, 5 item per halaman
        } catch (error) {
            console.error("Error initializing page:", error);
            showToast(error.message || "Gagal memuat data halaman.", "error");
            if (leaveHistoryTableBody) {
                leaveHistoryTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Gagal memuat data: ${error.message}</td></tr>`;
            }
            if (error.status === 401 || error.status === 403) {
                authService.logout();
            }
        }
    };

    // Set callback untuk me-refresh halaman setelah form submit (digunakan di LeaveForm.js)
    setInitializePageCallback(initializePage);

    // Event listener untuk dropdown user (profil)
    userDropdownContainer?.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("active");
    });
    document.addEventListener("click", () => dropdownMenu?.classList.remove("active"));

    // Inisialisasi tombol logout
    initializeLogout({});

    // Panggil event change pada requestTypeInput untuk inisialisasi tampilan form (misal: menyembunyikan/menampilkan attachment)
    if (requestTypeInput) {
        requestTypeInput.dispatchEvent(new Event("change"));
    }

    // Panggil fungsi inisialisasi halaman saat DOM sudah siap
    initializePage();
});