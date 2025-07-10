// src/js/Services/AttendanceServices.js

import apiClient from './apiClient'; // Import apiClient yang sudah dibuat

// Hapus API_BASE_URL, getToken, dan getUser karena apiClient dan interceptor menanganinya
// const API_BASE_URL = 'http://localhost:3000/api/v1';
// const getToken = () => localStorage.getItem('token');
// const getUser = () => { /* ... */ };

// Fungsi pembantu lokal untuk mendapatkan objek user dari localStorage
// Tetap pertahankan ini karena tidak semua request memerlukan token,
// tapi beberapa mungkin memerlukan user ID secara langsung (misal: scanQR)
const getUser = () => {
    try {
        const userString = localStorage.getItem('user');
        return userString ? JSON.parse(userString) : null;
    } catch (e) {
        console.error("Error parsing user from localStorage:", e);
        return null;
    }
};


const AttendanceService = {
    /**
     * @description Generate QR Code for today (Admin only)
     * @returns {Promise<Object>} Respon dari API yang berisi qr_code_image, expires_at, qr_code_value
     */
    generateQR: async () => {
        try {
            // apiClient otomatis menambahkan Authorization header dan menangani response.json()
            const response = await apiClient.get('/attendance/generate-qr');
            return response.data; // Axios otomatis mengembalikan data respons

        } catch (error) {
            console.error('Error di AttendanceService.generateQR:', error);
            throw error; // Interceptor sudah menangani error respons
        }
    },

    /**
     * @description Get all attendance for today (Admin only)
     * @returns {Promise<Array>}
     */
    getTodaysAttendance: async () => {
        try {
            const response = await apiClient.get('/attendance/today');
            return response.data;

        } catch (error) {
            console.error('Error di AttendanceService.getTodaysAttendance:', error);
            throw error;
        }
    },

    /**
     * @description Scan a QR code for check-in/check-out
     * @param {string} qrCodeValue The value from the scanned QR code
     * @returns {Promise<Object>}
     */
    scanQR: async (qrCodeValue) => {
        const user = getUser(); // Masih perlu getUser karena user.id diperlukan di body
        if (!user || !user.id) {
            // Ini akan ditangkap oleh interceptor jika tidak ada token,
            // tapi validasi awal di sini juga baik
            const customError = new Error("User ID tidak ditemukan. Harap login kembali.");
            customError.status = 401; // Unauthorized
            throw customError;
        }

        try {
            // apiClient otomatis menambahkan Authorization header
            const response = await apiClient.post('/attendance/scan', { // Perhatikan endpoint, sebelumnya '/attendance/scan'
                qr_code_value: qrCodeValue,
                user_id: user.id
            });
            return response.data;

        } catch (error) {
            console.error('Error di AttendanceService.scanQR:', error);
            throw error;
        }
    },

    /**
     * @description Get my personal attendance history
     * @returns {Promise<Array>}
     */
    getMyHistory: async () => {
        try {
            // apiClient otomatis menambahkan Authorization header
            const response = await apiClient.get('/attendance/my-history');
            return response.data;

        } catch (error) {
            console.error('Error di AttendanceService.getMyHistory:', error);
            throw error;
        }
    },
};

export default AttendanceService;