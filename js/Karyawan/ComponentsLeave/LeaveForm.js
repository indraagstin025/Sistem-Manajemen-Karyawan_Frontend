import { LeaveRequestService } from "../../Services/LeaveRequestsServices.js";
import { showToast } from "./UIHelpers.js";

let isSubmitting = false;
let initializePageCallback = null; // Callback untuk me-refresh tabel setelah submit

/**
 * Menyimpan callback untuk me-refresh halaman setelah form submit.
 * Dipanggil oleh file utama (RequestsLeave.js) untuk "menyuntikkan" dependensi.
 * @param {Function} callback - Fungsi yang akan dipanggil untuk menginisialisasi ulang halaman.
 */
export const setInitializePageCallback = (callback) => {
    initializePageCallback = callback;
};

/**
 * Menginisialisasi event listener dan logika untuk formulir pengajuan cuti.
 */
export const initializeLeaveForm = () => {
    const leaveRequestForm = document.getElementById("leaveRequestForm");
    const requestTypeInput = document.getElementById("requestType");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const endDateField = document.getElementById("endDateField");
    const reasonInput = document.getElementById("reason");
    const attachmentSection = document.getElementById("attachmentSection");
    const attachmentInput = document.getElementById("attachment");
    const formMessage = document.getElementById("formMessage");

    // Event listener untuk perubahan jenis pengajuan (Cuti/Sakit)
    requestTypeInput?.addEventListener("change", () => {
        const requestType = requestTypeInput.value;

        if (requestType === "Sakit") {
            attachmentSection.classList.remove("hidden");
            attachmentInput.setAttribute("required", "required"); // Lampiran wajib untuk sakit
            if (endDateField) {
                endDateField.classList.remove("hidden");
            }
            endDateInput.removeAttribute("disabled");
        } else if (requestType === "Cuti") {
            attachmentSection.classList.add("hidden");
            attachmentInput.removeAttribute("required");
            attachmentInput.value = ""; // Bersihkan nilai file jika berubah tipe
            if (endDateField) {
                endDateField.classList.add("hidden");
            }
            endDateInput.setAttribute("disabled", "disabled"); // Tanggal selesai sama dengan tanggal mulai untuk cuti
            if (startDateInput.value) {
                endDateInput.value = startDateInput.value;
            }
        } else {
            // Jenis pengajuan lain atau default
            attachmentSection.classList.add("hidden");
            attachmentInput.removeAttribute("required");
            attachmentInput.value = "";
            if (endDateField) {
                endDateField.classList.remove("hidden");
            }
            endDateInput.removeAttribute("disabled");
        }
    });

    // Event listener untuk memastikan tanggal selesai sama dengan tanggal mulai jika jenisnya "Cuti"
    startDateInput?.addEventListener("change", () => {
        if (requestTypeInput.value === "Cuti") {
            endDateInput.value = startDateInput.value;
        }
    });

    // Event listener untuk submit form pengajuan cuti
    leaveRequestForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (isSubmitting) return; // Mencegah submit ganda
        isSubmitting = true;
        formMessage.classList.add("hidden");

        const requestType = requestTypeInput.value;
        const startDate = startDateInput.value;
        let endDate = endDateInput.value;

        if (requestType === "Cuti") {
            endDate = startDate; // Pastikan endDate sama dengan startDate untuk Cuti
            endDateInput.value = startDate;
        }

        // Validasi tanggal
        if (new Date(startDate) > new Date(endDate)) {
            showToast("Tanggal selesai tidak boleh sebelum tanggal mulai.", "error");
            isSubmitting = false;
            return;
        }

        // Validasi field yang diperlukan
        if (!requestType || !startDate || !endDate || (requestType === "Sakit" && !attachmentInput.files[0])) {
            showToast("Mohon lengkapi semua field yang diperlukan, termasuk lampiran untuk Sakit.", "error");
            isSubmitting = false;
            return;
        }

        const formData = new FormData(leaveRequestForm);
        formData.set("end_date", endDate); // Pastikan end_date disetel dengan benar di FormData

        try {
            const response = await LeaveRequestService.createLeaveRequest(formData);
            showToast(response.message || "Pengajuan berhasil dikirim!", "success");
            leaveRequestForm.reset(); // Reset form
            requestTypeInput.dispatchEvent(new Event("change")); // Reset tampilan lampiran/tanggal selesai
            if (initializePageCallback) {
                await initializePageCallback(); // Panggil callback untuk me-refresh data tabel
            }
        } catch (error) {
            const errorMessage = error.message || "Gagal mengirim pengajuan.";
            showToast(errorMessage, "error");
        } finally {
            isSubmitting = false; // Set kembali status submit
        }
    });
};