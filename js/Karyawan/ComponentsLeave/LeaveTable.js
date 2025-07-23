import { createFullUrl } from "./UIHelpers.js";

let currentPage = 1;
const itemsPerPage = 5;
let allLeaveRequestsData = [];
let viewAttachmentHandlerInternal = null; // Handler internal untuk tombol "Lihat"
let downloadAttachmentHandlerInternal = null; // Handler internal untuk tombol "Unduh"

/**
 * Menyimpan handler tampilan dan unduh lampiran dari AttachmentModal.
 * Dipanggil oleh file utama (RequestsLeave.js) untuk "menyuntikkan" dependensi.
 * @param {Function} viewHandler - Fungsi untuk menampilkan lampiran.
 * @param {Function} downloadHandler - Fungsi untuk mengunduh lampiran.
 */
export const setAttachmentHandlers = (viewHandler, downloadHandler) => {
    viewAttachmentHandlerInternal = viewHandler;
    downloadAttachmentHandlerInternal = downloadHandler;
};

/**
 * Merender data riwayat pengajuan cuti ke dalam tabel HTML.
 * @param {Array<Object>} data - Array data pengajuan cuti.
 * @param {number} page - Halaman saat ini yang akan dirender.
 * @param {number} limit - Jumlah item per halaman.
 */
export const renderLeaveHistoryTable = (data, page, limit) => {
    const leaveHistoryTableBody = document.getElementById("leaveHistoryTableBody");
    if (!leaveHistoryTableBody) {
        console.error("Elemen leaveHistoryTableBody tidak ditemukan!");
        return;
    }

    allLeaveRequestsData = Array.isArray(data) ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
    currentPage = page; // Set currentPage dari parameter

    leaveHistoryTableBody.innerHTML = "";
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = allLeaveRequestsData.slice(startIndex, endIndex);

    const headers = ["Tanggal Mulai", "Tanggal Selesai", "Tipe", "Alasan", "Status", "Lampiran"];

    if (paginatedItems.length === 0) {
        leaveHistoryTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Tidak ada riwayat pengajuan.</td></tr>`;
        return;
    }

    paginatedItems.forEach((request) => {
        const row = leaveHistoryTableBody.insertRow();

        const formattedStartDate = new Date(request.start_date + "T00:00:00").toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const formattedEndDate =
            request.start_date !== request.end_date
                ? new Date(request.end_date + "T00:00:00").toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })
                : "-";

        let statusClass = "";
        let statusText = request.status;
        switch (request.status) {
            case "pending":
                statusClass = "text-yellow-600";
                statusText = "Menunggu";
                break;
            case "approved":
                statusClass = "text-green-600";
                statusText = "Disetujui";
                break;
            case "rejected":
                statusClass = "text-red-600";
                statusText = "Ditolak";
                break;
                case "completed":
                statusClass = "text-blue-600";
                statusText = "Selesai";
                break;
            default:
                statusClass = "text-gray-600";
                break;
        }

        const fileUrl = createFullUrl(request.attachment_url);
        const fileNameFromUrl = request.attachment_url ? request.attachment_url.split("/").pop().split("?")[0] : "";

        const attachmentDisplay = fileUrl
            ? `<div class="flex items-center space-x-2">
                <button class="view-attachment-btn text-teal-600 hover:underline focus:outline-none" data-url="${fileUrl}" data-filename="${fileNameFromUrl}">Lihat</button>
                <button class="download-btn text-gray-500 hover:text-gray-700" data-url="${fileUrl}" data-filename="${fileNameFromUrl}" title="Unduh Lampiran">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-4.5-4.5 3 3m0 0L12 21m-4.5-4.5 3-3m0 0L7.5 12m4.5 4.5V3" /></svg>
                </button>
            </div>`
            : "-";

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-label="${headers[0]}">${formattedStartDate}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="${headers[1]}">${formattedEndDate}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="${headers[2]}">${request.request_type || "-"}</td>
            <td class="px-6 py-4 text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis" data-label="${headers[3]}">${request.reason || "-"}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass} font-semibold" data-label="${headers[4]}">${statusText}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700" data-label="${headers[5]}">
                ${attachmentDisplay}
            </td>
        `;
    });
    updatePaginationControls(allLeaveRequestsData.length);
};

/**
 * Memperbarui status kontrol paginasi (tombol prev/next dan info halaman).
 * @param {number} totalItems - Total item yang tersedia (bukan hanya yang ditampilkan).
 */
export const updatePaginationControls = (totalItems) => {
    const paginationControls = document.getElementById("paginationControls");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const currentPageInfo = document.getElementById("currentPageInfo");

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
        paginationControls.classList.add("hidden");
        return;
    }
    paginationControls.classList.remove("hidden");
    currentPageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
};

/**
 * Menginisialisasi event listener untuk tabel riwayat cuti dan kontrol paginasi.
 */
export const initializeLeaveTable = () => {
    const leaveHistoryTableBody = document.getElementById("leaveHistoryTableBody");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");

    // Event listener untuk tombol paginasi
    prevPageBtn?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
        }
    });

    nextPageBtn?.addEventListener("click", () => {
        const totalPages = Math.ceil(allLeaveRequestsData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
        }
    });

    // Event listener untuk tombol "Lihat" dan "Unduh" di dalam tabel
    if (leaveHistoryTableBody) {
        leaveHistoryTableBody.addEventListener("click", (event) => {
            const target = event.target;
            if (target.classList.contains("view-attachment-btn")) {
                if (viewAttachmentHandlerInternal) {
                    viewAttachmentHandlerInternal(event);
                } else {
                    console.warn("Attachment view handler not set for table.");
                }
            } else if (target.classList.contains("download-btn")) {
                if (downloadAttachmentHandlerInternal) {
                    downloadAttachmentHandlerInternal(event);
                } else {
                    console.warn("Attachment download handler not set for table.");
                }
            }
        });
    }
};