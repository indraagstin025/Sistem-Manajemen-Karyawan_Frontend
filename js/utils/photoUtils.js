import { userService } from "../Services/UserServices.js";

/**
 * Mendapatkan URL foto profil user (GridFS atau placeholder)
 * 
 * @param {string} userId - ID pengguna
 * @param {string} userName - Nama pengguna untuk inisial
 * @param {number} size - Ukuran foto dalam px (default 48)
 * @returns {Promise<string>} - URL foto profil (ObjectURL atau placeholder)
 */
export async function getUserPhotoBlobUrl(userId, userName, size = 48) {
    const initial = userName ? userName.charAt(0).toUpperCase() : '?';
    let photoUrl = `https://placehold.co/${size}x${size}/E2E8F0/4A5568?text=${initial}`;

    if (!userId) return photoUrl;

    try {
        const blob = await userService.getProfilePhoto(userId);
        if (blob && blob.size > 0) {
            photoUrl = URL.createObjectURL(blob);
        }
    } catch (error) {
        console.warn(`Gagal memuat foto untuk user ${userName}: ${error.message}`);
    }

    return photoUrl;
}
