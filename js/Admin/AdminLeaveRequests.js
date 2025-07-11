// js/Admin/AdminLeaveRequests.js

import { LeaveRequestService } from "../Services/LeaveRequestsServices.js";
import { authService } from "../Services/AuthServices.js";
import apiClient from "../Services/apiClient.js"; // Pastikan ini benar-benar digunakan jika tidak bisa dihapus

import { userService } from "../Services/UserServices.js"; // Pastikan ini benar-benar digunakan jika tidak bisa dihapus
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

// Base URL untuk backend Anda
const BACKEND_URL = "https://sistem-manajemen-karyawanbackend-production.up.railway.app";

// === FUNGSI BANTUAN ===
// Fungsi ini bertugas membuat URL lengkap dan aman dari path relatif
const createFullUrl = (relativePath) => {
    // Jika path tidak ada atau kosong, kembalikan null
    if (!relativePath) {
        return null;
    }
    // Jika path sudah merupakan URL lengkap (misal dari S3), gunakan langsung
    if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
        return relativePath;
    }
    // Jika tidak, gabungkan dengan base URL backend
    return `${BACKEND_URL}${relativePath}`;
};

// Fungsi untuk menampilkan Toastify notification
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

// Fungsi untuk menampilkan konfirmasi logout
const showLogoutConfirmation = () => {
    const toastNode = document.createElement("div");
    toastNode.className = "flex flex-col items-center p-2";
    toastNode.innerHTML = `
        <p class="font-semibold text-white text-base mb-4">Anda yakin ingin keluar?</p>
        <div class="flex space-x-3">
            <button id="confirmActionBtn" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700">Ya, Keluar</button>
            <button id="cancelLogoutBtn" class="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600">Batal</button>
        </div>
    `;
    const toast = Toastify({ node: toastNode, duration: -1, gravity: "top", position: "center", close: true, style: { background: "linear-gradient(to right, #4f46e5, #7c3aed)", borderRadius: "12px", padding: "1rem" } }).showToast();

    toastNode.querySelector("#confirmActionBtn").addEventListener("click", () => {
        authService.logout();
        toast.hideToast();
    });
    toastNode.querySelector("#cancelLogoutBtn").addEventListener("click", () => {
        toast.hideToast();
    });
};

// --- START: DOMContentLoaded Listener ---
document.addEventListener("DOMContentLoaded", async () => {
    feather.replace();

    // === ELEMEN DOM ===
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
    const closeChangePasswordModalBtn = document.getElementById("closeChangePasswordModalBtn"); // Perbaikan di sini
    const cancelChangePasswordBtn = document.getElementById("cancelChangePasswordBtn");
    const changePasswordForm = document.getElementById("changePasswordForm");
    const oldPasswordInput = document.getElementById("oldPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
    const changePasswordErrorMessage = document.getElementById("changePasswordErrorMessage");
    const changePasswordSuccessMessage = document.getElementById("changePasswordSuccessMessage");
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

    // Mengambil data profil admin untuk header
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

    // Memuat semua pengajuan cuti/izin dari API
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

            allLeaveRequestsData = await LeaveRequestService.getAllLeaveRequests();
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

    // Fungsi untuk menangani tampilan lampiran di modal
// ... (Kode sebelumnya) ...

// Fungsi untuk menangani tampilan lampiran di modal
const handleViewAttachment = async (event) => {
    const button = event.target;
    const fullUrl = button.dataset.url;
    // Gunakan filename yang sudah bersih dari URL atau dari data-filename
    let displayFilename = button.dataset.filename;

    attachmentContent.innerHTML = ''; // Bersihkan konten sebelumnya
    attachmentErrorMessage.classList.add('hidden');
    // Atur judul modal dengan nama file yang lebih baik
    attachmentModalTitle.textContent = `Lihat Lampiran: ${displayFilename || 'Loading...'}`;

    if (!fullUrl) {
        attachmentErrorMessage.textContent = "URL lampiran tidak ditemukan.";
        attachmentErrorMessage.classList.remove('hidden');
        attachmentViewerModal.classList.remove("active");
        setTimeout(() => attachmentViewerModal.classList.add("hidden"), 300);
        showToast("URL lampiran tidak ditemukan.", "error");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        attachmentErrorMessage.textContent = "Sesi tidak valid. Harap login ulang.";
        attachmentErrorMessage.classList.remove('hidden');
        showToast("Sesi tidak valid. Harap login ulang.", "error");
        attachmentViewerModal.classList.remove("active");
        setTimeout(() => attachmentViewerModal.classList.add("hidden"), 300);
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

        // Debugging: Log the blob type and size
        console.log("Fetched Blob Type:", blob.type);
        console.log("Fetched Blob Size:", blob.size, "bytes");

        // Ambil nama file yang lebih baik dari Content-Disposition jika ada, atau gunakan yang sudah ada
        const contentDisposition = response.headers.get("Content-Disposition");
        if (contentDisposition && contentDisposition.includes("filename=")) {
            const match = contentDisposition.match(/filename="?(.+)"?/);
            if (match && match[1]) {
                displayFilename = match[1].replace(/['"]/g, ''); // Hapus tanda kutip jika ada
            }
        }
        attachmentModalTitle.textContent = `Lihat Lampiran: ${displayFilename || 'Tidak Diketahui'}`; // Update judul lagi jika nama file ditemukan dari header

        const contentType = response.headers.get("Content-Type") || blob.type;

        if (contentType.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = blobUrl;
            img.alt = displayFilename; // Gunakan nama file yang lebih baik
            img.className = "max-w-full max-h-full object-contain";
            attachmentContent.appendChild(img);
        } else if (contentType === "application/pdf") {
            const iframe = document.createElement("iframe");
            iframe.src = blobUrl;
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = "none";
            // Pastikan iframe bisa di-scroll jika kontennya panjang
            iframe.setAttribute('allowfullscreen', ''); // allow fullscreen
            iframe.setAttribute('webkitallowfullscreen', ''); // For Safari
            iframe.setAttribute('mozallowfullscreen', ''); // For Firefox
            attachmentContent.appendChild(iframe);
        } else {
            // Untuk jenis file yang tidak bisa ditampilkan langsung, berikan pesan dan tombol unduh
            attachmentErrorMessage.textContent = `Tipe file '${contentType || "tidak diketahui"}' tidak didukung untuk tampilan langsung. Silakan unduh.`;
            attachmentErrorMessage.classList.remove('hidden');

            const downloadBtn = document.createElement("button");
            downloadBtn.textContent = "Unduh File";
            downloadBtn.className = "mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600";
            downloadBtn.addEventListener("click", () => handleDownloadAttachment({ target: { dataset: { url: fullUrl, filename: displayFilename } } }));
            attachmentContent.appendChild(downloadBtn);
        }

        // Cleanup old blob URL
        attachmentViewerModal.addEventListener('transitionend', function handler() {
            if (attachmentViewerModal.classList.contains('hidden')) {
                URL.revokeObjectURL(blobUrl);
                // Penting: Hapus event listener ini setelah dijalankan sekali
                attachmentViewerModal.removeEventListener('transitionend', handler);
            }
        }, { once: true }); // Menggunakan { once: true } lebih bersih daripada removeEventListener manual

    } catch (error) {
        console.error("Gagal memuat lampiran untuk tampilan:", error);
        attachmentErrorMessage.textContent = error.message || "Terjadi kesalahan saat memuat lampiran.";
        attachmentErrorMessage.classList.remove('hidden');
        showToast(error.message || "Gagal memuat lampiran.", "error");

        // Tutup modal jika ada error parah saat loading konten
        attachmentViewerModal.classList.remove("active");
        setTimeout(() => attachmentViewerModal.classList.add("hidden"), 300);
    }
};

// ... (sisa kode lainnya, termasuk renderLeaveRequestsTable, handleDownloadAttachment, dll., harus tetap sama) ...
    // Fungsi untuk mengunduh lampiran (diperbarui)
    const handleDownloadAttachment = async (event) => {
        const button = event.target;
        const fullUrl = button.dataset.url;
        const filenameAttr = button.dataset.filename; // Ambil nama file dari data-filename

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
        button.textContent = "Mengunduh..."; // Tampilkan feedback di tombol

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
                    filename = match[1].replace(/['"]/g, ''); // Hapus tanda kutip jika ada
                }
            } else if (filenameAttr) { // Gunakan filename dari data-attribute jika ada
                filename = filenameAttr;
            } else {
                 // Fallback: Ambil nama file dari URL jika Content-Disposition & data-filename tidak ada
                 const urlParts = fullUrl.split('/');
                 filename = urlParts[urlParts.length - 1].split('?')[0];
            }


            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();

            URL.revokeObjectURL(url); // Hapus URL blob setelah digunakan
            showToast("File berhasil diunduh!", "success");
        } catch (error) {
            console.error("Gagal mengunduh file:", error);
            showToast(error.message || "Terjadi kesalahan saat mengunduh file.", "error");
        } finally {
            button.disabled = false;
            button.textContent = originalText; // Kembalikan teks asli tombol
        }
    };

    // Merender tabel pengajuan cuti/izin dengan pagination
    const renderLeaveRequestsTable = (data, page, limit) => {
        leaveRequestsTableBody.innerHTML = ""; // Bersihkan isi tabel
        const startIndex = (page - 1) * limit;
        const paginatedItems = data.slice(startIndex, startIndex + limit);

        paginatedItems.forEach((request) => {
            const row = leaveRequestsTableBody.insertRow();

            // Format tanggal
            const formattedStartDate = new Date(request.start_date + "T00:00:00").toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
            const formattedEndDate = new Date(request.end_date + "T00:00:00").toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });

            // Menentukan kelas dan teks status
            let statusClass = "";
            let statusText = "";
            if (request.status === "pending") {
                statusClass = "text-yellow-600 font-semibold";
                statusText = "Menunggu";
            } else if (request.status === "approved") {
                statusClass = "text-green-600 font-semibold";
                statusText = "Disetujui";
            } else if (request.status === "rejected") {
                statusClass = "text-red-600 font-semibold";
                statusText = "Ditolak";
            }

            // URL lampiran dan nama file dari URL
            const fileUrl = createFullUrl(request.attachment_url);
            const fileNameFromUrl = request.attachment_url ? request.attachment_url.split('/').pop().split('?')[0] : '';

            // Konten untuk kolom lampiran: tombol Lihat dan tombol Unduh (ikon)
            const attachmentLink = fileUrl
                ? `<div class="flex items-center space-x-2">
                     <button class="view-attachment-btn text-blue-600 hover:underline" data-url="${fileUrl}" data-filename="${fileNameFromUrl}">Lihat Lampiran</button>
                     <button class="download-btn text-gray-500 hover:text-gray-700" data-url="${fileUrl}" data-filename="${fileNameFromUrl}" title="Unduh Lampiran">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                     </button>
                   </div>`
                : "-";

            const employeeName = request.user_name || request.user_email || request.user_id;
            const photoUrl = createFullUrl(request.user_photo) || "https://placehold.co/40x40/E2E8F0/4A5568?text=ME";

            row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-10 w-10">
                                    <img class="h-10 w-10 rounded-full object-cover" src="${photoUrl}" alt="${employeeName}">
                                </div>
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">${employeeName}</div>
                                    <div class="text-sm text-gray-500">${request.user_email || "-"}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${request.request_type || "-"}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formattedStartDate}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formattedEndDate}</td>
                        <td class="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">${request.reason || "-"}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${attachmentLink}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">${statusText}</td>
                        <td class="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">${request.note || "-"}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            ${
                                request.status === "pending"
                                    ? `
                                    <button data-id="${request.id}" data-action="approve" class="action-btn bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md text-xs mr-2">Setujui</button>
                                    <button data-id="${request.id}" data-action="reject" class="action-btn bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs">Tolak</button>
                                `
                                    : `
                                    <span class="text-gray-500 text-xs">Selesai</span>
                                `
                            }
                        </td>
                    `;
        });

        // Tambahkan event listener untuk tombol "Lihat Lampiran" dan "Unduh"
        leaveRequestsTableBody.querySelectorAll(".view-attachment-btn").forEach((button) => {
            button.addEventListener("click", handleViewAttachment);
        });
        leaveRequestsTableBody.querySelectorAll(".download-btn").forEach((button) => {
            button.addEventListener("click", handleDownloadAttachment);
        });
    };

    // Memperbarui kontrol pagination
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

    // Handler untuk klik tombol aksi (Setujui/Tolak)
    const handleActionButtonClick = async (event) => {
        const button = event.target;
        const requestId = button.dataset.id;
        const action = button.dataset.action;
        let statusToUpdate = "";
        let confirmMessage = "";
        let successMessage = "";
        let note = "";

        if (action === "approve") {
            statusToUpdate = "approved";
            confirmMessage = "Anda yakin ingin MENYETUJUI pengajuan ini?";
            successMessage = "Pengajuan berhasil disetujui.";
        } else if (action === "reject") {
            statusToUpdate = "rejected";
            confirmMessage = "Anda yakin ingin MENOLAK pengajuan ini?";
            successMessage = "Pengajuan berhasil ditolak.";
            note = prompt("Masukkan catatan penolakan (opsional):");
            if (note === null) return; // Jika user klik 'Cancel' di prompt
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
        const toast = Toastify({ node: toastNode, duration: -1, gravity: "top", position: "center", close: true, style: { background: "linear-gradient(to right, #4f46e5, #7c3aed)", borderRadius: "12px", padding: "1rem" } }).showToast();

        toastNode.querySelector("#confirmActionBtn").addEventListener("click", async () => {
            toast.hideToast();
            try {
                button.disabled = true;
                button.textContent = "Memproses...";
                await LeaveRequestService.updateLeaveRequestStatus(requestId, statusToUpdate, note);
                showToast(successMessage, "success");
                loadLeaveRequests(); // Reload data setelah update
            } catch (error) {
                console.error("Error updating leave request status:", error);
                showToast(error.message || "Gagal memperbarui status pengajuan.", "error");
                button.disabled = false;
                button.textContent = action === "approve" ? "Setujui" : "Tolak";
            }
        });
        toastNode.querySelector("#cancelActionBtn").addEventListener("click", () => {
            toast.hideToast();
        });
    };

    // Mengatur ulang form ganti password
    const resetChangePasswordForm = () => {
        changePasswordForm.reset();
        changePasswordErrorMessage.classList.add("hidden");
        changePasswordSuccessMessage.classList.add("hidden");
        changePasswordErrorMessage.textContent = "";
        changePasswordSuccessMessage.textContent = "";
    };

    // === EVENT LISTENERS ===

    // Pagination buttons
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

    // Delegation untuk tombol aksi (approve/reject)
    // Gunakan event delegation pada tbody untuk tombol yang dinamis
    if (leaveRequestsTableBody) {
        leaveRequestsTableBody.addEventListener("click", (event) => {
            const target = event.target;
            if (target.classList.contains("action-btn")) {
                handleActionButtonClick(event);
            }
        });
    }


    // Change Password Modal
    if (openChangePasswordModalBtn) {
        openChangePasswordModalBtn.addEventListener("click", (event) => {
            event.preventDefault();
            resetChangePasswordForm();
            changePasswordModal.classList.remove("hidden");
            setTimeout(() => changePasswordModal.classList.add("active"), 10);
            if (dropdownMenu) dropdownMenu.classList.remove("active"); // Tutup dropdown jika terbuka
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

    // Submit Change Password Form
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
            if (!currentUser || !currentUser.id || !localStorage.getItem("token")) {
                showToast("Sesi tidak valid. Harap login kembali.", "error");
                setTimeout(() => authService.logout(), 2000);
                return;
            }
            const token = localStorage.getItem("token");
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

    // User Dropdown
    if (userDropdownContainer) {
        userDropdownContainer.addEventListener("click", () => {
            dropdownMenu.classList.toggle("active");
        });
        // Tutup dropdown jika klik di luar
        document.addEventListener("click", (event) => {
            if (!userDropdownContainer.contains(event.target)) {
                dropdownMenu.classList.remove("active");
            }
        });
    }

    // Logout Buttons
    allLogoutButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            showLogoutConfirmation();
        });
    });

    // Mobile Sidebar
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
        // Tutup sidebar jika klik di overlay gelap
        mobileSidebar.addEventListener("click", (event) => {
            if (event.target === mobileSidebar) hideMobileSidebar();
        });
    }

    // Event listener untuk tombol tutup modal lampiran
    if (closeAttachmentViewerModalBtn) {
        closeAttachmentViewerModalBtn.addEventListener("click", () => {
            attachmentViewerModal.classList.remove("active");
            setTimeout(() => {
                attachmentViewerModal.classList.add("hidden");
                attachmentContent.innerHTML = ''; // Bersihkan konten saat ditutup
                attachmentErrorMessage.classList.add('hidden'); // Sembunyikan pesan error
            }, 300);
        });

        // Juga tutup modal jika klik di luar area konten modal
        attachmentViewerModal.addEventListener("click", (event) => {
            // Pastikan klik di backdrop, bukan di dalam modal-content-viewer
            if (event.target === attachmentViewerModal) {
                attachmentViewerModal.classList.remove("active");
                setTimeout(() => {
                    attachmentViewerModal.classList.add("hidden");
                    attachmentContent.innerHTML = '';
                    attachmentErrorMessage.classList.add('hidden');
                }, 300);
            }
        });
    }


    // === INISIALISASI ===
    fetchAdminProfileDataForHeader();
    loadLeaveRequests();
});
// --- END: DOMContentLoaded Listener ---