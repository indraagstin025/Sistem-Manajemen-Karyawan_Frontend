import { authService } from "../Services/AuthServices.js";
import Swal from 'sweetalert2';

/**
 * Menampilkan dialog konfirmasi logout menggunakan SweetAlert2.
 * @param {function} preLogoutCallback - Fungsi opsional yang akan dipanggil sebelum logout.
 */
const showLogoutConfirmation = async (preLogoutCallback) => {
    const result = await Swal.fire({
        title: 'Anda yakin ingin keluar?',
        text: "Sesi Anda saat ini akan diakhiri.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Keluar!',
        cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
        if (typeof preLogoutCallback === 'function') {
            preLogoutCallback();
        }

        try {
            await authService.logout(); // Tunggu logout selesai
        } catch (error) {
            console.error("Gagal logout dari server:", error);
            // Tetap hapus token agar user benar-benar keluar meskipun server error
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/src/pages/login.html';
        }
    }
};

/**
 * Menginisialisasi semua tombol logout di halaman.
 * @param {object} options - Opsi konfigurasi.
 * @param {function} options.preLogoutCallback - Fungsi yang akan dijalankan sebelum logout.
 */
export function initializeLogout(options = {}) {
    const { preLogoutCallback } = options;

    const allLogoutButtons = document.querySelectorAll(
        "#logoutButton, #dropdownLogoutButton, #mobileLogoutButton"
    );

    allLogoutButtons.forEach((button) => {
        button.addEventListener("click", async (event) => {
            event.preventDefault();
            await showLogoutConfirmation(preLogoutCallback);
        });
    });
}
