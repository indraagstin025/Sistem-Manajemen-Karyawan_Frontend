// utils/photoUtils.js
import { userService } from "../Services/UserServices.js";

/**
 * Mengambil URL foto profil pengguna (dari backend atau fallback avatar lokal)
 * @param {string} userId - ID pengguna
 * @param {string} userName - Nama pengguna, digunakan untuk inisial jika perlu
 * @param {number} size - Ukuran avatar dalam piksel (default: 48)
 * @returns {Promise<string>} - URL ke foto profil (Blob URL atau default avatar)
 */
export async function getUserPhotoBlobUrl(userId, userName, size = 48) {
    const defaultAvatarPath = "/assets/default-avatar.png"; // Pastikan ini path yang benar di folder frontend public

    // Jika tidak ada userId, langsung kembalikan avatar default
    if (!userId) return defaultAvatarPath;

    try {
        const blob = await userService.getProfilePhoto(userId);

        // Jika blob valid dan memiliki isi
        if (blob instanceof Blob && blob.size > 0) {
            return URL.createObjectURL(blob);
        } else {
            console.warn(
                `[PhotoUtils] Foto untuk user "${userName}" kosong atau tidak valid. Menggunakan default avatar.`
            );
        }
    } catch (error) {
        console.warn(
            `[PhotoUtils] Gagal mengambil foto profil untuk "${userName}" (${userId}): ${error.message}. Gunakan default avatar.`
        );
    }

    return defaultAvatarPath;
}
