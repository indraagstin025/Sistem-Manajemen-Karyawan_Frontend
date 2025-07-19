import { userService } from "../Services/UserServices.js";

/**
 * Mendapatkan URL foto profil user (GridFS atau placeholder)
 * 
 * @param {string} userId - ID pengguna
 * @param {string} userName - Nama pengguna untuk inisial
 * @param {number} size - Ukuran foto dalam px (default 48)
 * @returns {Promise<string>} - URL foto profil (ObjectURL atau placeholder)
 */
// Dalam photoUtils.js
// ...
export async function getUserPhotoBlobUrl(userId, userName, size = 48) {
    const initial = userName ? userName.charAt(0).toUpperCase() : '?';
    // Ganti ini dengan path ke default avatar lokal Anda di frontend
    // Pastikan ini adalah PATH yang benar ke file JPG/PNG default di folder assets frontend Anda
    let photoUrl = `/assets/default-avatar.jpg`; // <--- UBAH DI SINI

    if (!userId) return photoUrl; 

    try {
        const blob = await userService.getProfilePhoto(userId);
        if (blob && blob.size > 0) {
            photoUrl = URL.createObjectURL(blob);
        } else {
            // Opsional: Jika backend mengembalikan respons kosong atau tidak valid (tapi 200 OK),
            // kita tetap bisa fallback ke avatar lokal
            console.warn(`Backend mengembalikan respons kosong atau tidak valid untuk user ${userName}. Menggunakan default avatar lokal.`);
        }
    } catch (error) {
        console.warn(`Gagal memuat foto untuk user ${userName}: ${error.message}. Menggunakan default avatar lokal.`);
        // `photoUrl` sudah diset ke default avatar lokal di awal fungsi
    }

    return photoUrl;
}
