import apiClient from './apiClient'; 

export const LeaveRequestService = { 
    /**
     * Mengambil semua pengajuan cuti/sakit. Hanya untuk admin.
     * @returns {Promise<Array>} Daftar pengajuan cuti/sakit.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getAllLeaveRequests: async () => {
        try {
            const response = await apiClient.get('/leave-requests');
            return response.data; 
        } catch (error) {
            console.error('Error di LeaveRequestService.getAllLeaveRequests:', error);
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
            const response = await apiClient.get('/leave-requests/my-requests');
            return response.data;

        } catch (error) {
            console.error("Error di LeaveRequestService.getMyLeaveRequests:", error);
            throw error;
        }
    },


        /**
     * Mengambil ringkasan jumlah pengajuan cuti (per bulan dan per tahun) untuk pengguna saat ini.
     * Endpoint ini memanggil /api/v1/leave-requests/summary di backend Go.
     * @returns {Promise<Object>} Objek berisi { current_month_leave_count: number, annual_leave_count: number }.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getLeaveSummary: async () => {
        try {
            const response = await apiClient.get('/leave-requests/summary');
            return response.data; // Backend diharapkan mengembalikan { "current_month_leave_count": N, "annual_leave_count": M }
        } catch (error) {
            console.error("Error di LeaveRequestService.getLeaveSummary:", error);
            // Tambahkan penanganan error spesifik jika diperlukan
            throw error;
        }
    },
};


