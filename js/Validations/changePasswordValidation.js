/**
 * Memvalidasi input form ganti password.
 * @param {string} oldPassword - Nilai password lama.
 * @param {string} newPassword - Nilai password baru.
 * @param {string} confirmNewPassword - Nilai konfirmasi password baru.
 * @returns {{isValid: boolean, message: string}} Objek yang menunjukkan apakah valid dan pesan error jika tidak.
 */
export const validateChangePasswordForm = (oldPassword, newPassword, confirmNewPassword) => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
        return {
            isValid: false,
            message: "Semua kolom password wajib diisi."
        };
    }

    if (newPassword !== confirmNewPassword) {
        return {
            isValid: false,
            message: "Password baru dan konfirmasi tidak cocok."
        };
    }

    // --- Validasi Baru: Panjang Minimum Password ---
    if (newPassword.length < 8) {
        return {
            isValid: false,
            message: "Password baru minimal 8 karakter."
        };
    }

    // --- Validasi Baru: Harus Mengandung Huruf Kapital ---
    // Menggunakan regex untuk memeriksa keberadaan setidaknya satu huruf kapital (A-Z)
    if (!/[A-Z]/.test(newPassword)) {
        return {
            isValid: false,
            message: "Password baru harus mengandung setidaknya satu huruf kapital."
        };
    }



    return {
        isValid: true,
        message: "Validasi berhasil."
    };
};