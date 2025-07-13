// js/Admin/AdminLeaveRequests.js

import { LeaveRequestService } from "../Services/LeaveRequestsServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeSidebar } from "../components/sidebarHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js";

import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import Swal from 'sweetalert2'; // Import SweetAlert2

// Base URL untuk backend Anda
const BACKEND_URL = "https://sistem-manajemen-karyawanbackend-production.up.railway.app";

// === FUNGSI BANTUAN ===
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
            padding: "12px 20px",
        },
    }).showToast();
};

// Fungsi showSweetAlert untuk notifikasi umum (jika belum ada)
function showSweetAlert(title, message, icon = "success", showConfirmButton = false, timer = 2000) {
    Swal.fire({
        title: title,
        text: message,
        icon: icon,
        showConfirmButton: showConfirmButton,
        timer: timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}


const showLogoutConfirmation = () => {
    // Menggunakan SweetAlert2 untuk konfirmasi logout
    Swal.fire({
        title: 'Anda yakin ingin keluar?',
        text: "Anda akan diarahkan ke halaman login.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626', // bg-red-600
        cancelButtonColor: '#6b7280',  // bg-gray-500
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            authService.logout();
        }
    });
};

// --- START: DOMContentLoaded Listener ---
document.addEventListener("DOMContentLoaded", async () => {
    feather.replace(); // Pastikan feather.replace() dipanggil di sini
    initializeSidebar(); // Panggil fungsi sidebar yang sudah diimpor

    const leaveRequestsTableBody = document.getElementById("leaveRequestsTableBody");
    const leaveRequestsMessage = document.getElementById("leaveRequestsMessage");
    const userAvatarNav = document.getElementById("userAvatar");
    const userNameNav = document.getElementById("userNameNav");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const allLogoutButtons = document.querySelectorAll("#logoutButton, #dropdownLogoutButton, #mobileLogoutButton");
    const paginationControls = document.getElementById("paginationControls");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const currentPageInfo = document.getElementById("currentPageInfo");

    // === ELEMEN DOM UNTUK MODAL VIEWER BARU ===
    const attachmentViewerModal = document.getElementById("attachmentViewerModal");
    const closeAttachmentViewerModalBtn = document.getElementById("closeAttachmentViewerModalBtn");
    const attachmentContent = document.getElementById("attachmentContent");
    const attachmentErrorMessage = document.getElementById("attachmentErrorMessage");
    const attachmentModalTitle = document.getElementById("attachmentModalTitle");

    // === VARIABEL GLOBAL / STATE ===
    let currentPage = 1;
    const itemsPerPage = 10;
    let allLeaveRequestsData = [];

    // === FUNGSI UTAMA / HANDLER ===

    const fetchAdminProfileDataForHeader = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                return null;
            }
            let user = authService.getCurrentUser();
            if (!user || user.role !== "admin") {
                return null;
            }
            const userPhotoUrl = createFullUrl(user.photo) || "https://placehold.co/40x40/E2E8F0/4A5568?text=AD";

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
        leaveRequestsMessage.classList.add("hidden");
        paginationControls.classList.add("hidden");

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                showToast("Sesi tidak valid. Mengarahkan ke halaman login...", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }

            const currentUser = authService.getCurrentUser();
            if (!currentUser || currentUser.role !== "admin") {
                showToast("Akses ditolak. Anda tidak memiliki izin untuk melihat halaman ini.", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }

            const fetchedData = await LeaveRequestService.getAllLeaveRequests();
            allLeaveRequestsData = fetchedData || [];
            
            allLeaveRequestsData.sort((a, b) => {
                if (a.status === "pending" && b.status !== "pending") return -1;
                if (a.status !== "pending" && b.status === "pending") return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            if (allLeaveRequestsData.length === 0) {
                leaveRequestsTableBody.innerHTML = `
                                <tr>
                                    <td colspan="9" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">Tidak ada pengajuan cuti/izin yang ditemukan.</td>
                                </tr>
                            `;
                leaveRequestsMessage.textContent = "Tidak ada pengajuan cuti atau izin yang perlu ditinjau.";
                leaveRequestsMessage.classList.remove("hidden");
            } else {
                renderLeaveRequestsTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
            }
        } catch (error) {
            console.error("Error loading leave requests:", error);
            leaveRequestsTableBody.innerHTML = `
                        <tr>
                            <td colspan="9" class="px-6 py-4 whitespace-nowrap text-center text-red-500">Gagal memuat pengajuan: ${error.message}</td>
                        </tr>
                    `;
            showToast(error.message || "Gagal memuat pengajuan cuti/izin.", "error");
            if (error.message.includes("token") || error.message.includes("sesi") || error.message.includes("Akses ditolak")) {
                setTimeout(() => authService.logout(), 2000);
            }
        }
    };

    const handleViewAttachment = async (event) => {
        const button = event.currentTarget;
        const fullUrl = button.dataset.url;
        let displayFilename = button.dataset.filename;

        attachmentViewerModal.classList.remove("active");
        attachmentViewerModal.classList.add("hidden");
        attachmentContent.innerHTML = "";
        attachmentErrorMessage.classList.add("hidden");
        attachmentModalTitle.textContent = `Lihat Lampiran: ${displayFilename || "Memuat..."}`;


        if (!fullUrl) {
            attachmentErrorMessage.textContent = "URL lampiran tidak ditemukan.";
            attachmentErrorMessage.classList.remove("hidden");
            showToast("URL lampiran tidak ditemukan.", "error");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            attachmentErrorMessage.textContent = "Sesi tidak valid. Harap login ulang.";
            attachmentErrorMessage.classList.remove("hidden");
            showToast("Sesi tidak valid. Harap login ulang.", "error");
            return;
        }

        attachmentViewerModal.classList.remove("hidden");
        setTimeout(() => attachmentViewerModal.classList.add("active"), 10);

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

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const contentDisposition = response.headers.get("Content-Disposition");
            if (contentDisposition && contentDisposition.includes("filename=")) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match && match[1]) {
                    displayFilename = match[1].replace(/['"]/g, "");
                }
            }
            attachmentModalTitle.textContent = `Lihat Lampiran: ${displayFilename || "Tidak Diketahui"}`;

            const contentType = response.headers.get("Content-Type") || blob.type;

            if (contentType.startsWith("image/")) {
                const img = document.createElement("img");
                img.src = blobUrl;
                img.alt = displayFilename;
                img.className = "max-w-full max-h-full object-contain";
                attachmentContent.appendChild(img);
            } else if (contentType === "application/pdf") {
                const iframe = document.createElement("iframe");
                iframe.src = blobUrl;
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.border = "none";
                iframe.setAttribute("allowfullscreen", "");
                iframe.setAttribute("webkitallowfullscreen", "");
                iframe.setAttribute("mozallowfullscreen", "");
                attachmentContent.appendChild(iframe);
            } else {
                attachmentErrorMessage.textContent = `Tipe file '${contentType || "tidak diketahui"}' tidak didukung untuk tampilan langsung. Silakan unduh.`;
                attachmentErrorMessage.classList.remove("hidden");

                const downloadBtn = document.createElement("button");
                downloadBtn.textContent = "Unduh File";
                downloadBtn.className = "mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600";
                downloadBtn.addEventListener("click", () => handleDownloadAttachment({ target: { dataset: { url: fullUrl, filename: displayFilename } } }));
                attachmentContent.appendChild(downloadBtn);
            }

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
            console.error("Gagal memuat lampiran untuk tampilan:", error);
            attachmentErrorMessage.textContent = error.message || "Terjadi kesalahan saat memuat lampiran.";
            attachmentErrorMessage.classList.remove("hidden");
            showToast(error.message || "Gagal memuat lampiran.", "error");

            attachmentViewerModal.classList.remove("active");
            setTimeout(() => attachmentViewerModal.classList.add("hidden"), 300);
        }
    };

    const handleDownloadAttachment = async (event) => {
        const button = event.target;
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

    const renderLeaveRequestsTable = (data, page, limit) => {
        const leaveRequestsTableBody = document.getElementById('leaveRequestsTableBody');
        if (!leaveRequestsTableBody) {
            return;
        }

        leaveRequestsTableBody.innerHTML = "";
        const startIndex = (page - 1) * limit;
        const paginatedItems = data.slice(startIndex, startIndex + limit);

        if (paginatedItems.length === 0) {
            leaveRequestsTableBody.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-gray-500">Tidak ada data pengajuan.</td></tr>`;
            return;
        }

        paginatedItems.forEach((request) => {
            const row = leaveRequestsTableBody.insertRow();

            const formattedStartDate = new Date(request.start_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
            const formattedEndDate = new Date(request.end_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

            let statusClass = "pending";
            let statusText = "Menunggu";
            if (request.status === "approved") {
                statusClass = "approved";
                statusText = "Disetujui";
            } else if (request.status === "rejected") {
                statusClass = "rejected";
                statusText = "Ditolak";
            } else if (request.status === "completed") {
                statusClass = "completed";
                statusText = "Selesai";
            }

            const fileUrl = createFullUrl(request.attachment_url);
            const fileNameFromUrl = request.attachment_url ? request.attachment_url.split("/").pop().split("?")[0] : "";
            const attachmentLink = fileUrl
                ? `<div class="flex items-center space-x-2">
                            <button class="view-attachment-btn text-teal-600 hover:underline focus:outline-none" data-url="${fileUrl}" data-filename="${fileNameFromUrl}">Lihat</button>
                            <button class="download-btn text-gray-500 hover:text-gray-700" data-url="${fileUrl}" data-filename="${fileNameFromUrl}" title="Unduh Lampiran">
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            </button>
                        </div>`
                : "-";

            const employeeName = request.user_name || request.user_email || request.user_id;
            const initial = employeeName ? employeeName.charAt(0).toUpperCase() : "?";
            const placeholderPhoto = `https://placehold.co/36x36/E2E8F0/4A5568?text=${initial}`;
            const photoElementId = `photo-${request.id}`;

            row.innerHTML = `
                <td>
                    <div class="employee-info">
                        <img id="${photoElementId}" class="profile-thumb" src="${placeholderPhoto}" alt="${employeeName}">
                        <div>
                            <div class="name">${employeeName}</div>
                            <div class="email">${request.user_email || "-"}</div>
                        </div>
                    </div>
                </td>
                <td>${request.request_type || "-"}</td>
                <td>${formattedStartDate}</td>
                <td>${formattedEndDate}</td>
                <td title="${request.reason || ""}">${request.reason || "-"}</td>
                <td class="text-center">${attachmentLink}</td>
                <td class="text-center">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td title="${request.note || ""}">${request.note || "-"}</td>
                <td>
                    ${
                        request.status === "pending"
                            ? `
                            <div class="action-buttons">
                                <button data-id="${request.id}" data-action="approve" class="action-btn bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors duration-200">Setujui</button>
                                <button data-id="${request.id}" data-action="reject" class="action-btn bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors duration-200">Tolak</button>
                            </div>
                            `
                            : `<span class="text-gray-500 text-sm">Selesai</span>`
                    }
                </td>
            `;

            getUserPhotoBlobUrl(request.user_id, employeeName, 36).then((photoUrl) => {
                const photoEl = document.getElementById(photoElementId);
                if (photoEl) {
                    photoEl.src = photoUrl;
                }
            });
        });

        // Re-bind event listeners to prevent duplication
        leaveRequestsTableBody.querySelectorAll(".view-attachment-btn").forEach(button => {
            button.removeEventListener("click", handleViewAttachment);
            button.addEventListener("click", handleViewAttachment);
        });
        leaveRequestsTableBody.querySelectorAll(".download-btn").forEach(button => {
            button.removeEventListener("click", handleDownloadAttachment);
            button.addEventListener("click", handleDownloadAttachment);
        });
        leaveRequestsTableBody.querySelectorAll(".action-btn").forEach(button => {
            button.removeEventListener("click", handleActionButtonClick);
            button.addEventListener("click", handleActionButtonClick);
        });
    };


    const updatePaginationControls = (totalItems, currentPage, itemsPerPage) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        currentPageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        const isLastPage = totalItems === 0 || currentPage === totalPages;
        nextPageBtn.disabled = isLastPage;

        if (totalItems > itemsPerPage) {
            paginationControls.classList.remove("hidden");
        } else {
            paginationControls.classList.add("hidden");
        }
    };

    const handleActionButtonClick = async (event) => {
        const button = event.target;
        const requestId = button.dataset.id;
        const action = button.dataset.action;
        let statusToUpdate = "";
        let confirmTitle = "";
        let confirmText = "";
        let inputPlaceholder = "";
        let inputLabel = "";
        let iconType = "question";

        if (action === "approve") {
            statusToUpdate = "approved";
            confirmTitle = "Setujui Pengajuan Ini?";
            confirmText = "Anda akan menyetujui pengajuan cuti/izin ini.";
            inputPlaceholder = "Catatan persetujuan (wajib)";
            inputLabel = "Catatan Persetujuan:";
            iconType = "success"; // Atau 'info' / 'question'
        } else if (action === "reject") {
            statusToUpdate = "rejected";
            confirmTitle = "Tolak Pengajuan Ini?";
            confirmText = "Anda akan menolak pengajuan cuti/izin ini.";
            inputPlaceholder = "Catatan penolakan (wajib)";
            inputLabel = "Catatan Penolakan:";
            iconType = "error"; // Atau 'warning'
        } else {
            return;
        }

        // Tampilkan SweetAlert dengan input teks
        const { value: note } = await Swal.fire({
            title: confirmTitle,
            text: confirmText,
            icon: iconType,
            input: 'textarea', // Gunakan textarea untuk input catatan yang lebih panjang
            inputLabel: inputLabel,
            inputPlaceholder: inputPlaceholder,
            inputValidator: (value) => {
                if (!value || value.trim() === '') {
                    return 'Catatan wajib diisi!';
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Ya, Proses',
            cancelButtonText: 'Batal',
            confirmButtonColor: action === "approve" ? '#10b981' : '#dc2626', // Teal untuk approve, Red untuk reject
            cancelButtonColor: '#6b7280',
            reverseButtons: true // Agar tombol "Batal" di kiri
        });

        // Jika user tidak memasukkan catatan atau membatalkan SweetAlert
        if (note === undefined || note === null || note.trim() === "") {
            showToast("Proses dibatalkan: Catatan tidak diisi.", "info"); // Mengubah ini menjadi 'info'
            return;
        }

        // Lanjutkan dengan konfirmasi terakhir (jika diperlukan, atau langsung proses)
        // Saat ini, SweetAlert input sudah berfungsi sebagai konfirmasi.
        // Jika Anda ingin konfirmasi terpisah setelah input, Anda bisa menambahkannya di sini.
        // Namun, biasanya SweetAlert input sudah cukup sebagai satu langkah interaksi.

        try {
            button.disabled = true;
            button.textContent = "Memproses...";
            await LeaveRequestService.updateLeaveRequestStatus(requestId, statusToUpdate, note);
            showToast(`Pengajuan berhasil ${action === "approve" ? "disetujui" : "ditolak"}.`, "success"); // Pesan sukses yang dinamis
            loadLeaveRequests();
        } catch (error) {
            console.error("Error updating leave request status:", error);
            showToast(error.message || "Gagal memperbarui status pengajuan.", "error");
            button.disabled = false;
            button.textContent = action === "approve" ? "Setujui" : "Tolak";
        }
    };


    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderLeaveRequestsTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            const totalPages = Math.ceil(allLeaveRequestsData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderLeaveRequestsTable(allLeaveRequestsData, currentPage, itemsPerPage);
                updatePaginationControls(allLeaveRequestsData.length, currentPage, itemsPerPage);
            }
        });
    }

    if (leaveRequestsTableBody) {
        leaveRequestsTableBody.addEventListener("click", (event) => {
            const target = event.target;
            if (target.classList.contains("action-btn")) {
                handleActionButtonClick(event);
            }
        });
    }

    // Dropdown User in Header (Adjusted to work with group-hover CSS but also provide click toggle)
    const userDropdownGroup = document.querySelector('.header .relative.group');
    if (userDropdownGroup) {
        userDropdownGroup.addEventListener("click", (event) => {
            const dropdown = userDropdownGroup.querySelector('#dropdownMenu');
            if (event.target.closest('#dropdownMenu a')) {
                return;
            }

            if (dropdown) {
                dropdown.classList.toggle("hidden");
                dropdown.classList.toggle("active");
            }
        });
        // Close dropdown if clicking outside the entire group
        document.addEventListener("click", (event) => {
            const dropdown = userDropdownGroup.querySelector('#dropdownMenu');
            if (dropdown && !userDropdownGroup.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.remove("active");
                setTimeout(() => {
                    dropdown.classList.add("hidden");
                }, 200);
            }
        }, true);
    }


    allLogoutButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            showLogoutConfirmation();
        });
    });

    if (closeAttachmentViewerModalBtn) {
        closeAttachmentViewerModalBtn.addEventListener("click", () => {
            attachmentViewerModal.classList.remove("active");
            setTimeout(() => {
                attachmentViewerModal.classList.add("hidden");
                attachmentContent.innerHTML = "";
                attachmentErrorMessage.classList.add("hidden");
            }, 300);
        });

        // Pastikan klik di luar modal-content menutup modal
        attachmentViewerModal.addEventListener("click", (event) => {
            if (event.target === attachmentViewerModal) {
                attachmentViewerModal.classList.remove("active");
                setTimeout(() => {
                    attachmentViewerModal.classList.add("hidden");
                    attachmentContent.innerHTML = "";
                    attachmentErrorMessage.classList.add("hidden");
                }, 300);
            }
        });
    }

    // === INISIALISASI ===
    fetchAdminProfileDataForHeader();
    loadLeaveRequests();
});