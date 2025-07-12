// File: js/components/logoutHandler.js

import { authService } from "../Services/AuthServices.js"; // PASTIKAN ADA KURUNG KURAWAL {}
import Swal from 'sweetalert2';

/**
 * Menampilkan dialog konfirmasi logout menggunakan SweetAlert2.
 * @param {function} preLogoutCallback - Fungsi opsional yang akan dipanggil sebelum logout.
 */
const showLogoutConfirmation = (preLogoutCallback) => {
    Swal.fire({
        title: 'Anda yakin ingin keluar?',
        text: "Sesi Anda saat ini akan diakhiri.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Keluar!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            // Jalankan callback jika ada, sebelum proses logout
            if (preLogoutCallback && typeof preLogoutCallback === 'function') {
                preLogoutCallback();
            }
            // Lakukan proses logout
            authService.logout();
        }
    });
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
        button.addEventListener("click", (event) => {
            event.preventDefault();
            showLogoutConfirmation(preLogoutCallback);
        });
    });
}