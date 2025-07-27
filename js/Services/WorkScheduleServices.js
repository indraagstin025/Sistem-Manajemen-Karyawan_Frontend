import apiClient from './apiClient.js';

const WorkScheduleServices = {
    /**
     * Membuat aturan jadwal kerja baru (hanya Admin).
     */
    createWorkSchedule: async (scheduleData) => {
        try {
            const response = await apiClient.post('/work-schedules', scheduleData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Mendapatkan daftar jadwal kerja yang sudah diproses dan bersih dari hari libur.
     * Digunakan oleh Admin dan Karyawan.
     * @param {object} filters - Wajib berisi { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }.
     */
    getAllWorkSchedules: async (filters = {}) => {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const response = await apiClient.get(`/work-schedules?${queryString}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * **Fungsi baru**: Mendapatkan detail satu aturan jadwal kerja berdasarkan ID.
     * Digunakan oleh Admin untuk mengisi form edit.
     * @param {string} scheduleId - ID dari aturan jadwal kerja yang ingin diambil.
     */
    getWorkScheduleById: async (scheduleId) => {
        try {
            const response = await apiClient.get(`/work-schedules/${scheduleId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Memperbarui aturan jadwal kerja (hanya Admin).
     */
    updateWorkSchedule: async (scheduleId, scheduleData) => {
        try {
            const response = await apiClient.put(`/work-schedules/${scheduleId}`, scheduleData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Menghapus aturan jadwal kerja (hanya Admin).
     */
    deleteWorkSchedule: async (scheduleId) => {
        try {
            const response = await apiClient.delete(`/work-schedules/${scheduleId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },


// ---------------- Kode Baru (Sudah Benar) -----------------
getMyWorkSchedules: async (startDate, endDate) => {
    try {
        // Buat objek filter dari parameter yang diterima
        const filters = {
            start_date: startDate,
            end_date: endDate
        };

        // Buat query string dan panggil API
        const queryString = new URLSearchParams(filters).toString();
        const response = await apiClient.get(`/work-schedules?${queryString}`);
        return response.data;
    } catch (error) {
        throw error;
    }
},


    /**
     * Fungsi untuk mendapatkan daftar hari libur dari backend.
     * @param {string} year - Tahun yang ingin dicari.
     */
    getHolidays: async (year) => {
        try {
            const response = await apiClient.get(`/holidays?year=${year}`);
            return response.data; 
        } catch (error) {
            throw error;
        }
    }
};

export default WorkScheduleServices;