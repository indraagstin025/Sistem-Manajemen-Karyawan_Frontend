// src/js/Services/LeaveRequestsServices.js

import apiClient from './apiClient'; // Import apiClient yang sudah dibuat

// Hapus API_BASE_URL dan getToken karena apiClient dan interceptor menanganinya
// Hapus juga getUser jika tidak ada fungsi yang secara eksplisit membutuhkannya di sini
// const API_BASE_URL = 'http://localhost:3000/api/v1';
// const getToken = () => localStorage.getItem('token');
// const getUser = () => { /* ... */ };


export const LeaveRequestService = { // Tetap gunakan export const untuk konsistensi
    /**
     * Mengambil semua pengajuan cuti/sakit. Hanya untuk admin.
     * @returns {Promise<Array>} Daftar pengajuan cuti/sakit.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getAllLeaveRequests: async () => {
        try {
            // apiClient otomatis menambahkan Authorization header dan menangani response.json()
            const response = await apiClient.get('/leave-requests');
            return response.data; // Axios otomatis mengembalikan data respons

        } catch (error) {
            console.error('Error di LeaveRequestService.getAllLeaveRequests:', error);
            throw error; // Interceptor sudah menangani error respons
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
            // apiClient otomatis menambahkan Authorization header dan Content-Type
            const response = await apiClient.put(`/leave-requests/${requestId}/status`, { status, note });
            return response.data;

        } catch (error) {
            console.error('Error di LeaveRequestService.updateLeaveRequestStatus:', error);
            throw error;
        }
    },

    /**
     * Mengirim pengajuan cuti/izin/sakit baru dari karyawan.
     * @param {FormData} formData Data formulir, termasuk file lampiran jika ada.
     * @returns {Promise<Object>} Respon dari server.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    createLeaveRequest: async (formData) => {
        try {
            // Untuk FormData, Axios akan otomatis mengatur Content-Type: multipart/form-data
            const response = await apiClient.post('/leave-requests', formData);
            return response.data;

        } catch (error) {
            console.error("Error di LeaveRequestService.createLeaveRequest:", error);
            throw error;
        }
    },

    /**
     * Mendapatkan riwayat pengajuan cuti/izin/sakit untuk karyawan yang sedang login.
     * @returns {Promise<Array>} Daftar pengajuan cuti/izin/sakit karyawan.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getMyLeaveRequests: async () => {
        try {
            // apiClient otomatis menambahkan Authorization header
            const response = await apiClient.get('/leave-requests/my-requests');
            return response.data;

        } catch (error) {
            console.error("Error di LeaveRequestService.getMyLeaveRequests:", error);
            throw error;
        }
    },
};

// Pertahankan export const untuk konsistensi
// Jika `export default` diperlukan oleh kode Anda, pastikan sesuai.
// export default LeaveRequestService;