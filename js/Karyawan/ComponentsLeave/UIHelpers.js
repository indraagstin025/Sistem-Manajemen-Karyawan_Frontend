import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import Swal from "sweetalert2";

const BACKEND_URL = "https://sistem-manajemen-karyawanbackend-production.up.railway.app";

/**
 * Membuat URL lengkap dari jalur relatif dengan menambahkan base URL backend.
 * @param {string} relativePath - Jalur relatif file.
 * @returns {string|null} URL lengkap atau null jika jalur tidak valid.
 */
export const createFullUrl = (relativePath) => {
    if (!relativePath) {
        return null;
    }
    if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
        return relativePath;
    }
    return `${BACKEND_URL}${relativePath}`;
};

/**
 * Menampilkan notifikasi toast.
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {'success'|'error'|'info'} [type='success'] - Tipe notifikasi untuk menentukan warna.
 */
export const showToast = (message, type = "success") => {
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

/**
 * Menampilkan SweetAlert sederhana.
 * @param {string} title - Judul alert.
 * @param {string} message - Pesan alert.
 * @param {'success'|'error'|'warning'|'info'|'question'} [icon='success'] - Ikon alert.
 * @param {boolean} [showConfirmButton=false] - Menampilkan tombol konfirmasi atau tidak.
 * @param {number} [timer=2000] - Durasi alert akan ditampilkan dalam ms.
 */
export function showSweetAlert(title, message, icon = "success", showConfirmButton = false, timer = 2000) {
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