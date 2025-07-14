import apiClient from './apiClient'; 

export const LeaveRequestService = { 
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

