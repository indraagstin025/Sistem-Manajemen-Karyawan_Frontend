// file: RequestLeave.js

import { authService } from "../Services/AuthServices.js";
import { userService } from "../Services/UserServices.js";
import { LeaveRequestService } from "../Services/LeaveRequestsServices.js";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import { initializeLogout } from "../components/logoutHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js";
import Swal from "sweetalert2";
import * as pdfjsLib from 'pdfjs-dist';
import * as pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs';

// --- START: Konstanta dan Fungsi Helper Global ---
const BACKEND_URL = "https://sistem-manajemen-karyawanbackend-production.up.railway.app"; // Pastikan URL ini sesuai dengan backend Anda

const createFullUrl = (relativePath) => {
  if (!relativePath) {
    return null;
  }
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  return `${BACKEND_URL}${relativePath}`;
};

const showToast = (message, type = "success") => {
  let backgroundColor;
  if (type === "success") backgroundColor = "linear-gradient(to right, #22c55e, #16a34a)";
  else if (type === "error") backgroundColor = "linear-gradient(to right, #ef4444, #dc2626)";
  else backgroundColor = "linear-gradient(to right, #3b82f6, #2563eb)";
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    style: { background: backgroundColor, borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", padding: "12px 20px" },
  }).showToast();
};

function showSweetAlert(title, message, icon = "success", showConfirmButton = false, timer = 2000) {
  Swal.fire({
    title: title,
    text: message,
    icon: icon,
    showConfirmButton: showConfirmButton,
    timer: timer,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
}

const showLogoutConfirmation = () => {
  Swal.fire({
    title: "Anda yakin ingin keluar?",
    text: "Anda akan diarahkan ke halaman login.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626", // bg-red-600
    cancelButtonColor: "#6b7280", // bg-gray-500
    confirmButtonText: "Ya, Keluar",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (result.isConfirmed) {
      authService.logout();
    }
  });
};
// --- END: Konstanta dan Fungsi Helper Global ---

document.addEventListener("DOMContentLoaded", () => {
  feather.replace();

  // --- START: Ambil elemen modal baru ---
  const attachmentViewerModal = document.getElementById("attachmentViewerModal");
  const closeAttachmentViewerModalBtn = document.getElementById("closeAttachmentViewerModalBtn");
  const attachmentContent = document.getElementById("attachmentContent");
  const attachmentErrorMessage = document.getElementById("attachmentErrorMessage");
  const attachmentModalTitle = document.getElementById("attachmentModalTitle");
  const downloadAttachmentFromModalBtn = document.getElementById("downloadAttachmentFromModalBtn");
  // Tambahkan referensi ke elemen konten modal yang memiliki kelas 'active' dan transisi
  const attachmentModalContent = document.getElementById("attachmentModalContent");
  // --- END: Ambil elemen modal baru ---

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
  // PERBAIKAN: Pastikan ID ini ada di HTML Anda (div pembungkus input endDate)
  const endDateField = document.getElementById("endDateField"); 
  const reasonInput = document.getElementById("reason");
  const attachmentSection = document.getElementById("attachmentSection");
  const attachmentInput = document.getElementById("attachment");
  const formMessage = document.getElementById("formMessage");
  const leaveHistoryTableBody = document.getElementById("leaveHistoryTableBody");
  const leaveHistoryMessage = document.getElementById("leaveHistoryMessage");
  const paginationControls = document.getElementById("paginationControls");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const currentPageInfo = document.getElementById("currentPageInfo");
  const leaveLimitSummaryElement = document.getElementById("leaveLimitSummary");

  let currentPage = 1;
  const itemsPerPage = 5;
  let allLeaveRequestsData = [];
  let isSubmitting = false;

  // --- START: Fungsi untuk menangani tampilan lampiran di modal ---
    const handleViewAttachment = async (event) => {
        const button = event.target.closest(".view-attachment-btn");
        if (!button) {
            return;
        }

        const fullUrl = button.dataset.url;

        // Bersihkan dan siapkan modal dengan status "Memuat..."
        attachmentContent.innerHTML = "Memuat lampiran..."; // Tampilkan loading text
        attachmentErrorMessage.classList.add("hidden");
        downloadAttachmentFromModalBtn.classList.add("hidden");
        attachmentModalTitle.textContent = "Lihat Lampiran: Memuat...";

        // Tampilkan modal overlay
        attachmentViewerModal.classList.remove("hidden");
        setTimeout(() => {
            attachmentViewerModal.classList.add("active");
            if (attachmentModalContent) {
                attachmentModalContent.classList.add("active");
            }
        }, 10);

        // Validasi awal (URL & Token)
        if (!fullUrl) {
            attachmentModalTitle.textContent = "Lihat Lampiran: Gagal";
            attachmentErrorMessage.textContent = "URL lampiran tidak ditemukan.";
            attachmentErrorMessage.classList.remove("hidden");
            showToast("URL lampiran tidak ditemukan.", "error");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            attachmentModalTitle.textContent = "Lihat Lampiran: Gagal";
            attachmentErrorMessage.textContent = "Sesi tidak valid. Harap login ulang.";
            attachmentErrorMessage.classList.remove("hidden");
            showToast("Sesi tidak valid. Harap login ulang.", "error");
            return;
        }

        try {
            const response = await fetch(fullUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Gagal memuat lampiran: ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (e) {
                    errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`;
                }
                throw new Error(errorMessage);
            }

            let finalFilename = "File Lampiran";
            const contentDisposition = response.headers.get("Content-Disposition");
            if (contentDisposition && contentDisposition.includes("filename=")) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match && match[1]) {
                    finalFilename = match[1].replace(/['"]/g, "");
                }
            } else {
                const urlParts = fullUrl.split("/");
                finalFilename = urlParts[urlParts.length - 1].split("?")[0] || "file";
            }
            attachmentModalTitle.textContent = `Lihat Lampiran: ${finalFilename}`;

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const contentType = response.headers.get("Content-Type") || blob.type;

            attachmentContent.innerHTML = ""; // Clear content here BEFORE rendering anything

            if (contentType.startsWith("image/")) {
                const img = document.createElement("img");
                img.src = blobUrl;
                img.alt = finalFilename;
                img.className = "max-w-full max-h-full object-contain mx-auto";
                attachmentContent.appendChild(img);
                // ... (download button logic) ...
            } else if (contentType === "application/pdf") {
                try {
                    const loadingTask = pdfjsLib.getDocument({ url: blobUrl });
                    const pdf = await loadingTask.promise;
                    const numPages = pdf.numPages;

                    // Loop melalui setiap halaman untuk dirender
                    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const viewport = page.getViewport({ scale: 1 });

                        const canvas = document.createElement("canvas");
                        const canvasContext = canvas.getContext('2d');
                        // Apply the new combined CSS class
                        canvas.className = "pdf-page-canvas"; 
                        attachmentContent.appendChild(canvas);

                        // Calculate scale to fit width
                        const desiredWidth = attachmentContent.clientWidth;
                        // Important: Ensure desiredWidth is not 0, otherwise scale will be NaN/Infinity
                        // Also, consider a slight padding/margin for the canvas within the attachmentContent
                        const scale = desiredWidth > 0 ? (desiredWidth - 20) / viewport.width : 1; // Subtract 20px for padding if needed
                        const scaledViewport = page.getViewport({ scale: scale });

                        canvas.height = scaledViewport.height;
                        canvas.width = scaledViewport.width;

                        const renderContext = {
                            canvasContext: canvasContext,
                            viewport: scaledViewport,
                        };
                        await page.render(renderContext).promise;
                    }

                    downloadAttachmentFromModalBtn.classList.remove("hidden");
                    downloadAttachmentFromModalBtn.onclick = () =>
                        handleDownloadAttachment({
                            target: { dataset: { url: fullUrl, filename: finalFilename } },
                        });

                } catch (pdfError) {
                    console.error("Error rendering PDF with PDF.js:", pdfError);
                    attachmentContent.innerHTML = ""; // Bersihkan konten jika gagal render
                    attachmentErrorMessage.textContent = "Gagal memuat atau merender PDF. " + (pdfError.message || "Pastikan file PDF tidak rusak.");
                    attachmentErrorMessage.classList.remove("hidden");
                    downloadAttachmentFromModalBtn.classList.remove("hidden");
                    downloadAttachmentFromModalBtn.onclick = () =>
                        handleDownloadAttachment({
                            target: { dataset: { url: fullUrl, filename: finalFilename } },
                        });
                    showToast("Gagal merender PDF: " + (pdfError.message || "File rusak atau tidak valid."), "error");
                    return; // Hentikan eksekusi selanjutnya jika ada error
                }
                // === AKHIR BLOK PDF.JS ===
            } else {
                attachmentErrorMessage.textContent = `Tipe file '${contentType || "tidak diketahui"}' tidak didukung untuk tampilan langsung. Silakan unduh.`;
                attachmentErrorMessage.classList.remove("hidden");
                downloadAttachmentFromModalBtn.classList.remove("hidden");
                downloadAttachmentFromModalBtn.onclick = () =>
                    handleDownloadAttachment({
                        target: { dataset: { url: fullUrl, filename: finalFilename } },
                    });
            }

            // Listener untuk membersihkan blob URL setelah modal ditutup
            attachmentViewerModal.addEventListener(
                "transitionend",
                function handler() {
                    if (attachmentViewerModal.classList.contains("hidden")) {
                        URL.revokeObjectURL(blobUrl);
                        attachmentViewerModal.removeEventListener("transitionend", handler);
                    }
                },
                { once: true }
            );
        } catch (error) {
            attachmentModalTitle.textContent = "Lihat Lampiran: Gagal";
            console.error("Gagal memuat lampiran untuk tampilan:", error);
            attachmentContent.innerHTML = "";
            attachmentErrorMessage.textContent = error.message || "Terjadi kesalahan saat memuat lampiran.";
            attachmentErrorMessage.classList.remove("hidden");
            downloadAttachmentFromModalBtn.classList.add("hidden");
            showToast(error.message || "Gagal memuat lampiran.", "error");

            attachmentViewerModal.classList.remove("active");
            if (attachmentModalContent) {
                attachmentModalContent.classList.remove("active");
            }
            setTimeout(() => attachmentViewerModal.classList.add("hidden"), 300);
        }
    };

  const handleDownloadAttachment = async (event) => {
    // Tombol bisa dari tabel atau dari modal
    const button = event.target.closest(".download-btn") || document.getElementById("downloadAttachmentFromModalBtn");

    const fullUrl = button.dataset.url;
    const filenameAttr = button.dataset.filename;

    if (!fullUrl) {
      showToast("URL lampiran tidak ditemukan.", "error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Sesi tidak valid. Silakan login ulang.", "error");
      return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Mengunduh...";

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Gagal mengunduh file: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "file";
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, "");
        }
      } else if (filenameAttr) {
        filename = filenameAttr;
      } else {
        const urlParts = fullUrl.split("/");
        filename = urlParts[urlParts.length - 1].split("?")[0];
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
      showToast("File berhasil diunduh!", "success");
    } catch (error) {
      console.error("Gagal mengunduh file:", error);
      showToast(error.message || "Terjadi kesalahan saat mengunduh file.", "error");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  };
  // --- END: Fungsi untuk menangani tampilan lampiran di modal ---

  // --- START: renderLeaveHistoryTable yang sudah dimodifikasi untuk tombol modal dan data-label ---
  const renderLeaveHistoryTable = (data, page, limit) => {
    const leaveHistoryTableBody = document.getElementById("leaveHistoryTableBody");
    if (!leaveHistoryTableBody) {
      console.error("Elemen leaveHistoryTableBody tidak ditemukan!");
      return;
    }

    leaveHistoryTableBody.innerHTML = "";
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = data.slice(startIndex, endIndex);

    // BARU: Definisi header untuk data-label, urutan harus sesuai dengan kolom tabel
    const headers = [
      "Tanggal Mulai",
      "Tanggal Selesai",
      "Tipe",
      "Alasan",
      "Status",
      "Lampiran"
    ];

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

      // PERUBAHAN UTAMA DI SINI: Tambahkan atribut data-label ke setiap <td>
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
  };
  // --- END: renderLeaveHistoryTable yang sudah dimodifikasi untuk tombol modal dan data-label ---

  const updatePaginationControls = (totalItems, page, limit) => {
    const totalPages = Math.ceil(totalItems / limit);
    if (totalPages <= 1) {
      paginationControls.classList.add("hidden");
      return;
    }
    paginationControls.classList.remove("hidden");
    currentPageInfo.textContent = `Halaman ${page} dari ${totalPages}`;
    prevPageBtn.disabled = page === 1;
    nextPageBtn.disabled = page === totalPages;
  };

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

  const setupEventListeners = () => {
    prevPageBtn?.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
        updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
      }
    });
    nextPageBtn?.addEventListener("click", () => {
      const totalPages = Math.ceil(allLeaveRequestsData.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderLeaveHistoryTable(allLeaveRequestsData, currentPage, itemsPerPage);
        updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
      }
    });

    requestTypeInput?.addEventListener("change", () => {
      const requestType = requestTypeInput.value;

      if (requestType === "Sakit") {
        attachmentSection.classList.remove("hidden");
        attachmentInput.setAttribute("required", "required"); // Lampiran wajib untuk sakit

        // PERBAIKAN: Tambahkan pengecekan null sebelum mengakses classList
        if (endDateField) { 
          endDateField.classList.remove("hidden");
        }
        endDateInput.removeAttribute("disabled");
      } else if (requestType === "Cuti") {
        attachmentSection.classList.add("hidden");
        attachmentInput.removeAttribute("required");
        attachmentInput.value = ""; // Bersihkan nilai file jika berubah tipe

        // PERBAIKAN: Tambahkan pengecekan null sebelum mengakses classList
        if (endDateField) {
          endDateField.classList.add("hidden");
        }
        endDateInput.setAttribute("disabled", "disabled");

        if (startDateInput.value) {
          endDateInput.value = startDateInput.value;
        }
      } else {
        // Jenis pengajuan lain atau default
        attachmentSection.classList.add("hidden");
        attachmentInput.removeAttribute("required");
        attachmentInput.value = "";
        // PERBAIKAN: Tambahkan pengecekan null sebelum mengakses classList
        if (endDateField) {
          endDateField.classList.remove("hidden");
        }
        endDateInput.removeAttribute("disabled");
      }
    });

    startDateInput?.addEventListener("change", () => {
      if (requestTypeInput.value === "Cuti") {
        endDateInput.value = startDateInput.value;
      }
    });

    leaveRequestForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting) return;
      isSubmitting = true;
      formMessage.classList.add("hidden");

      const requestType = requestTypeInput.value;
      const startDate = startDateInput.value;
      let endDate = endDateInput.value;

      if (requestType === "Cuti") {
        endDate = startDate;
        endDateInput.value = startDate;
      }

      if (new Date(startDate) > new Date(endDate)) {
        showToast("Tanggal selesai tidak boleh sebelum tanggal mulai.", "error");
        isSubmitting = false;
        return;
      }

      if (!requestType || !startDate || !endDate || (requestType === "Sakit" && !attachmentInput.files[0])) {
        showToast("Mohon lengkapi semua field yang diperlukan, termasuk lampiran untuk Sakit.", "error");
        isSubmitting = false;
        return;
      }

      const formData = new FormData(leaveRequestForm);
      formData.set("end_date", endDate); // Pastikan end_date disetel dengan benar

      try {
        const response = await LeaveRequestService.createLeaveRequest(formData);
        showToast(response.message || "Pengajuan berhasil dikirim!", "success");
        leaveRequestForm.reset();
        requestTypeInput.dispatchEvent(new Event("change")); // Reset tampilan lampiran/tanggal selesai
        await initializePage();
      } catch (error) {
        const errorMessage = error.message || "Gagal mengirim pengajuan.";
        showToast(errorMessage, "error");
      } finally {
        isSubmitting = false;
      }
    });

    userDropdownContainer?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("active");
    });
    document.addEventListener("click", () => dropdownMenu?.classList.remove("active"));
    initializeLogout({ preLogoutCallback: showLogoutConfirmation });

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
      mobileSidebar.addEventListener("click", (e) => {
        if (e.target === mobileSidebar) hideMobileSidebar();
      });
    }

    // --- START: Event listeners untuk modal lampiran ---
    if (leaveHistoryTableBody) {
      leaveHistoryTableBody.addEventListener("click", (event) => {
        const target = event.target;
        if (target.classList.contains("view-attachment-btn")) {
          handleViewAttachment(event);
        } else if (target.classList.contains("download-btn")) {
          handleDownloadAttachment(event);
        }
      });
    }

    if (closeAttachmentViewerModalBtn) {
      closeAttachmentViewerModalBtn.addEventListener("click", () => {
        attachmentViewerModal.classList.remove("active");
        if (attachmentModalContent) {
          // Pastikan elemen ada
          attachmentModalContent.classList.remove("active");
        }
        setTimeout(() => {
          attachmentViewerModal.classList.add("hidden");
          attachmentContent.innerHTML = "";
          attachmentErrorMessage.classList.add("hidden");
          downloadAttachmentFromModalBtn.classList.add("hidden");
        }, 300);
      });

      attachmentViewerModal.addEventListener("click", (event) => {
        if (event.target === attachmentViewerModal) {
          attachmentViewerModal.classList.remove("active");
          if (attachmentModalContent) {
            // Pastikan elemen ada
            attachmentModalContent.classList.remove("active");
          }
          setTimeout(() => {
            attachmentViewerModal.classList.add("hidden");
            attachmentContent.innerHTML = "";
            attachmentErrorMessage.classList.add("hidden");
            downloadAttachmentFromModalBtn.classList.add("hidden");
          }, 300);
        }
      });
    }
    // --- END: Event listeners untuk modal lampiran ---
  };

  const initializePage = async () => {
    leaveHistoryTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Memuat data...</td></tr>`;
    leaveLimitSummaryElement.innerHTML = `<p class="text-gray-500">Memuat info...</p>`;

    try {
      const user = authService.getCurrentUser();
      if (!user || user.role !== "karyawan") {
        showToast("Akses ditolak atau sesi tidak valid.", "error");
        authService.logout();
        return;
      }

      const [leaveHistory, leaveSummary, photoUrl] = await Promise.all([LeaveRequestService.getMyLeaveRequests(), LeaveRequestService.getLeaveSummary(), getUserPhotoBlobUrl(user.id, user.name || "User")]);

      if (userAvatarNav) {
        userAvatarNav.src = photoUrl;
        userAvatarNav.alt = user.name || "User Avatar";
      }

      updateLeaveLimitSummaryUI(leaveSummary);

      allLeaveRequestsData = Array.isArray(leaveHistory) ? leaveHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
      currentPage = 1;
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

  setupEventListeners();
  initializePage();
  // PENTING: Pastikan endDateField ada di HTML sebelum baris ini dipanggil.
  // Pengecekan `if (endDateField)` sudah ditambahkan di `setupEventListeners`.
  requestTypeInput.dispatchEvent(new Event("change")); 
});