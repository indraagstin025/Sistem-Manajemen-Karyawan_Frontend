// js/Services/LeaveRequestService.js

// Pastikan ini sesuai dengan URL backend Go Anda (biasanya port 8080 untuk Go Fiber)

// Jika backend Anda berjalan di http://localhost:3000/api/v1, gunakan:
 const API_BASE_URL = 'http://localhost:3000/api/v1';

// Fungsi pembantu lokal untuk mendapatkan token dari localStorage
const getToken = () => localStorage.getItem('token');

// Fungsi pembantu lokal untuk mendapatkan objek user dari localStorage
const getUser = () => {
    try {
        const userString = localStorage.getItem('user');
        return userString ? JSON.parse(userString) : null;
    } catch (e) {
        console.error("Error parsing user from localStorage:", e);
        return null;
    }
};

export const LeaveRequestService = {
    /**
     * Mengambil semua pengajuan cuti/sakit. Hanya untuk admin.
     * @returns {Promise<Array>} Daftar pengajuan cuti/sakit.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getAllLeaveRequests: async () => {
        try {
            const token = getToken();
            if (!token) {
                const error = new Error('Token tidak ditemukan. Harap login kembali.');
                error.status = 401; // Unauthorized
                throw error;
            }

            const response = await fetch(`${API_BASE_URL}/leave-requests`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || data.message || 'Gagal mengambil pengajuan cuti/izin.');
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error di leaveRequestService.getAllLeaveRequests:', error);
            throw error;
        }
    },

    /**
     * Memperbarui status pengajuan cuti/sakit (approve/reject). Hanya untuk admin.
     * @param {string} requestId ID pengajuan cuti/sakit.
     * @param {string} status Status baru ('approved' atau 'rejected').
     * @param {string} [note=''] Catatan tambahan dari admin (opsional).
     * @returns {Promise<Object>} Respon dari server.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    updateLeaveRequestStatus: async (requestId, status, note = '') => {
        try {
            const token = getToken();
            if (!token) {
                const error = new Error('Token tidak ditemukan. Harap login kembali.');
                error.status = 401;
                throw error;
            }

            const response = await fetch(`${API_BASE_URL}/leave-requests/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, note })
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || data.message || 'Gagal memperbarui status pengajuan.');
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error di leaveRequestService.updateLeaveRequestStatus:', error);
            throw error;
        }
    },

    /**
     * Mengirim pengajuan cuti/izin/sakit baru dari karyawan.
     * @param {FormData} formData Data formulir, termasuk file lampiran jika ada.
     * @returns {Promise<Object>} Respon dari server.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    createLeaveRequest: async (formData) => { // Token diambil di dalam fungsi
        try {
            const token = getToken();
            if (!token) {
                const error = new Error('Token tidak ditemukan. Harap login kembali.');
                error.status = 401;
                throw error;
            }

            const response = await fetch(`${API_BASE_URL}/leave-requests`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    // Penting: JANGAN SET Content-Type secara manual untuk FormData
                    // Browser akan secara otomatis mengatur 'multipart/form-data' dengan boundary yang benar
                },
                body: formData, // FormData otomatis mengelola multipart/form-data
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || data.message || "Gagal mengirim pengajuan cuti/izin.");
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }
            return data;
        } catch (error) {
            console.error("Error in createLeaveRequest:", error);
            throw error;
        }
    },

    /**
     * Mendapatkan riwayat pengajuan cuti/izin/sakit untuk karyawan yang sedang login.
     * @returns {Promise<Array>} Daftar pengajuan cuti/izin/sakit karyawan.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getMyLeaveRequests: async () => { // Token diambil di dalam fungsi
        try {
            const token = getToken();
            if (!token) {
                const error = new Error('Token tidak ditemukan. Harap login kembali.');
                error.status = 401;
                throw error;
            }

            const response = await fetch(`${API_BASE_URL}/leave-requests/my-requests`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || data.message || "Gagal mengambil riwayat pengajuan.");
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }
            return data;
        } catch (error) {
            console.error("Error in getMyLeaveRequests:", error);
            throw error;
        }
    },
};

// Export sebagai default jika Anda ingin mengimpornya dengan nama apapun
// export default LeaveRequestService;

// Atau, tetap seperti ini jika Anda ingin mengimpornya dengan nama spesifik `leaveRequestService`
// import { leaveRequestService } from '../Services/LeaveRequestService.js';