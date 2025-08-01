import { LeaveRequestService } from "../Services/LeaveRequestsServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { QRCodeManager } from "../components/qrCodeHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js"; 
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import Swal from 'sweetalert2';

const BACKEND_URL = "https://sistem-manajemen-karyawanbackend-production.up.railway.app";

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

    Swal.fire({
        title: 'Anda yakin ingin keluar?',
        text: "Anda akan diarahkan ke halaman login.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626', 
        cancelButtonColor: '#6b7280',  
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            authService.logout();
        }
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace();
    initializeSidebar();

    
    QRCodeManager.initialize({
        toastCallback: showToast,
    });

    
    initializeLogout({
        preLogoutCallback: () => {
            if (typeof QRCodeManager !== 'undefined' && QRCodeManager.close) {
                QRCodeManager.close();
            }
        }
    });

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


    const attachmentViewerModal = document.getElementById("attachmentViewerModal");
    const closeAttachmentViewerModalBtn = document.getElementById("closeAttachmentViewerModalBtn");
    const attachmentContent = document.getElementById("attachmentContent");
    const attachmentErrorMessage = document.getElementById("attachmentErrorMessage");
    const attachmentModalTitle = document.getElementById("attachmentModalTitle");

    let currentPage = 1;
    const itemsPerPage = 10;
    let allLeaveRequestsData = [];


    const fetchAdminProfileDataForHeader = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                
                return;
            }
            let user = authService.getCurrentUser();
            if (!user || user.role !== "admin") {
                
                return;
            }
            
            
            const userPhotoUrl = await getUserPhotoBlobUrl(user.id, user.name, 40); 

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
            console.log("Data mentah dari API:", fetchedData); 
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
    
    const button = event.target.closest(".view-attachment-btn");
    if (!button) {
        return;
    }

    const fullUrl = button.dataset.url;

    
    attachmentContent.innerHTML = "";
    attachmentErrorMessage.classList.add("hidden");
    attachmentModalTitle.textContent = "Lihat Lampiran: Memuat..."; 

    
    attachmentViewerModal.classList.remove("hidden");
    setTimeout(() => attachmentViewerModal.classList.add("active"), 10);

    
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
        }

        
        attachmentModalTitle.textContent = `Lihat Lampiran: ${finalFilename}`;

        

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const contentType = response.headers.get("Content-Type") || blob.type;

        
        if (contentType.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = blobUrl;
            img.alt = finalFilename; 
            img.className = "max-w-full max-h-full object-contain";
            attachmentContent.appendChild(img);
        } else if (contentType === "application/pdf") {
            const iframe = document.createElement("iframe");
            iframe.src = blobUrl;
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = "none";
            iframe.setAttribute("allowfullscreen", "");
            attachmentContent.appendChild(iframe);
        } else {
            attachmentErrorMessage.textContent = `Tipe file '${contentType || "tidak diketahui"}' tidak didukung untuk tampilan langsung. Silakan unduh.`;
            attachmentErrorMessage.classList.remove("hidden");
            const downloadBtn = document.createElement("button");
            downloadBtn.textContent = "Unduh File";
            downloadBtn.className = "mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600";
            downloadBtn.addEventListener("click", () => handleDownloadAttachment({
                target: {
                    dataset: {
                        url: fullUrl,
                        filename: finalFilename 
                    }
                }
            }));
            attachmentContent.appendChild(downloadBtn);
        }

        
        attachmentViewerModal.addEventListener("transitionend", function handler() {
            if (attachmentViewerModal.classList.contains("hidden")) {
                URL.revokeObjectURL(blobUrl);
                attachmentViewerModal.removeEventListener("transitionend", handler);
            }
        }, { once: true });

    } catch (error) {
        attachmentModalTitle.textContent = "Lihat Lampiran: Gagal"; 
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

    leaveRequestsTableBody.innerHTML = ""; // Kosongkan tabel sebelum mengisi
    const startIndex = (page - 1) * limit;
    const paginatedItems = data.slice(startIndex, startIndex + limit);

if (paginatedItems.length === 0) {
    // Tentukan colspan sesuai jumlah kolom di thead (5 kolom utama)
    leaveRequestsTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">Tidak ada data pengajuan.</td></tr>`;
    return;
}

    paginatedItems.forEach((request) => {
        // --- 1. Siapkan semua variabel data ---
        const formattedStartDate = new Date(request.start_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long" });
        const formattedEndDate = new Date(request.end_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        const dateRange = formattedStartDate === formattedEndDate.split(' ')[0] + ' ' + formattedEndDate.split(' ')[1] ? formattedEndDate : `${formattedStartDate} - ${formattedEndDate}`;

        let statusClass = "pending";
        let statusText = "Menunggu";
        if (request.status === "approved") {
            statusClass = "approved";
            statusText = "Disetujui";
        } else if (request.status === "rejected") {
            statusClass = "rejected";
            statusText = "Ditolak";
        }
        const statusHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;

        const fileUrl = createFullUrl(request.attachment_url);
        const fileNameFromUrl = request.attachment_url ? request.attachment_url.split("/").pop().split("?")[0] : "";
        const attachmentHTML = fileUrl
            ? `<div class="flex items-center space-x-2">
                   <button class="view-attachment-btn text-teal-600 hover:underline focus:outline-none" data-url="${fileUrl}" data-filename="${fileNameFromUrl}">Lihat</button>
                   <button class="download-btn text-gray-500 hover:text-gray-700" data-url="${fileUrl}" data-filename="${fileNameFromUrl}" title="Unduh Lampiran">
                       <i data-feather="download" class="w-4 h-4"></i>
                   </button>
               </div>`
            : "-";
            
        const actionButtonsHTML = request.status === "pending"
            ? `<div class="action-buttons flex space-x-2 justify-end">
                   <button data-id="${request.id}" data-action="approve" class="action-btn px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors duration-200">Setujui</button>
                   <button data-id="${request.id}" data-action="reject" class="action-btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors duration-200">Tolak</button>
               </div>`
            : `<span class="text-gray-500 text-xs">Selesai</span>`;

        const employeeName = request.user_name || request.user_email || "Pengguna Tidak Dikenal";
        const photoElementId = `photo-${request.id}`;

        // --- 2. Buat HTML untuk main row dan detail row ---
        const tableRowsHTML = `
            <tr class="main-row">
                <td data-label="Karyawan">
                    <div class="employee-info">
                        <img id="${photoElementId}" class="h-9 w-9 rounded-full object-cover" src="https://placehold.co/36x36/E2E8F0/4A5568?text=AV" alt="Avatar">
                        <div>
                            <div class="text-sm font-medium text-gray-900">${employeeName}</div>
                            <div class="text-sm text-gray-500 email">${request.user_email || "-"}</div>
                        </div>
                    </div>
                </td>
                <td data-label="Tipe">${request.request_type || "-"}</td>
                <td data-label="Tanggal">${dateRange}</td>
                <td data-label="Status">${statusHTML}</td>
                <td data-label="Aksi">
                    <div class="action-buttons-wrapper">
                        ${actionButtonsHTML}
                        <button class="toggle-details-btn" title="Lihat Detail">
                           <i data-feather="chevron-down" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
            <tr class="detail-row hidden">
                <td colspan="5">
                    <div class="details-content">
                        <div><strong>Alasan:</strong><p>${request.reason || "-"}</p></div>
                        <div><strong>Lampiran:</strong><p>${attachmentHTML}</p></div>
                        <div><strong>Catatan Admin:</strong><p>${request.note || "-"}</p></div>
                    </div>
                </td>
            </tr>
        `;

        // --- 3. Masukkan HTML ke dalam tabel ---
        leaveRequestsTableBody.insertAdjacentHTML('beforeend', tableRowsHTML);

        // --- 4. Ambil foto pengguna secara asinkron ---
        getUserPhotoBlobUrl(request.user_id, employeeName, 36).then((photoUrl) => {
            const photoEl = document.getElementById(photoElementId);
            if (photoEl) {
                photoEl.src = photoUrl;
            }
        });
    });
    
    // --- 5. Render semua ikon Feather baru setelah loop selesai ---
    feather.replace();
};

// TARUH KODE INI DI JS ANDA
// Pastikan ia berjalan setelah tabel terisi data

function setupToggleListeners() {
    const tableBody = document.getElementById('leaveRequestsTableBody');

    tableBody.addEventListener('click', function(event) {
        // Cari tombol yang di-klik atau parent-nya yang merupakan tombol toggle
        const toggleButton = event.target.closest('.toggle-details-btn');
        
        if (toggleButton) {
            const mainRow = toggleButton.closest('.main-row');
            const detailRow = mainRow.nextElementSibling;

            if (mainRow && detailRow && detailRow.classList.contains('detail-row')) {
                // Toggle class 'hidden' pada baris detail
                detailRow.classList.toggle('hidden');
                // Toggle class 'is-expanded' pada baris utama untuk animasi tombol
                mainRow.classList.toggle('is-expanded');
            }
        }
    });
}

// Panggil fungsi ini setelah Anda selesai memuat data ke tabel
setupToggleListeners();


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
            iconType = "success";
        } else if (action === "reject") {
            statusToUpdate = "rejected";
            confirmTitle = "Tolak Pengajuan Ini?";
            confirmText = "Anda akan menolak pengajuan cuti/izin ini.";
            inputPlaceholder = "Catatan penolakan (wajib)";
            inputLabel = "Catatan Penolakan:";
            iconType = "error";
        } else {
            return;
        }

        const { value: note } = await Swal.fire({
            title: confirmTitle,
            text: confirmText,
            icon: iconType,
            input: 'textarea',
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
            confirmButtonColor: action === "approve" ? '#10b981' : '#dc2626',
            cancelButtonColor: '#6b7280',
            reverseButtons: true
        });

        if (note === undefined || note === null || note.trim() === "") {
            showToast("Proses dibatalkan: Catatan tidak diisi.", "info");
            return;
        }


        try {
            button.disabled = true;
            button.textContent = "Memproses...";
            await LeaveRequestService.updateLeaveRequestStatus(requestId, statusToUpdate, note);
            showToast(`Pengajuan berhasil ${action === "approve" ? "disetujui" : "ditolak"}.`, "success"); 
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
            } else if (target.classList.contains("view-attachment-btn")) {
                handleViewAttachment(event);
            } else if (target.classList.contains("download-btn")) {
                handleDownloadAttachment(event);
            }
        });
    }

    
    
    
    const userDropdownGroup = document.getElementById('userDropdown'); 
    if (userDropdownGroup && dropdownMenu) { 
        userDropdownGroup.addEventListener("click", (event) => {
            
            if (!dropdownMenu.contains(event.target) && event.target.closest('#userAvatar')) {
                dropdownMenu.classList.toggle("hidden");
                dropdownMenu.classList.toggle("active");
            }
        });

        
        document.addEventListener("click", (event) => {
            if (dropdownMenu && !userDropdownGroup.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove("active");
                setTimeout(() => {
                    dropdownMenu.classList.add("hidden");
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

    
    fetchAdminProfileDataForHeader();
    loadLeaveRequests();
});