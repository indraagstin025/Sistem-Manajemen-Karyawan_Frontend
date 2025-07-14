// js/Services/WorkScheduleServices.js
import apiClient from './apiClient.js';

const WorkScheduleServices = {
    // Admin: Buat Jadwal Kerja Baru
    createWorkSchedule: async (scheduleData) => {
        try {
            const response = await apiClient.post('/work-schedules', scheduleData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Admin: Dapatkan Semua Jadwal Kerja (dengan filter opsional)
    getAllWorkSchedules: async (filters = {}) => {
        try {
            // Contoh penggunaan filters: { user_id: 'someId', start_date: '2025-01-01', end_date: '2025-01-31' }
            const queryString = new URLSearchParams(filters).toString();
            const url = queryString ? `/work-schedules?${queryString}` : '/work-schedules';
            const response = await apiClient.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Admin: Perbarui Jadwal Kerja
    updateWorkSchedule: async (scheduleId, scheduleData) => {
        try {
            const response = await apiClient.put(`/work-schedules/${scheduleId}`, scheduleData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Admin: Hapus Jadwal Kerja
    deleteWorkSchedule: async (scheduleId) => {
        try {
            const response = await apiClient.delete(`/work-schedules/${scheduleId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Karyawan: Dapatkan Jadwal Kerja Saya
    getMyWorkSchedules: async () => {
        try {
            const response = await apiClient.get('/work-schedules/my');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default WorkScheduleServices;