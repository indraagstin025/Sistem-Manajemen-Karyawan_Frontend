
import apiClient from './apiClient'; // Import apiClient yang sudah dibuat


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
            const response = await apiClient.get('/attendance/generate-qr');
            return response.data; 

        } catch (error) {
            console.error('Error di AttendanceService.generateQR:', error);
            throw error; 
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

    getMyTodayAttendance: async () => {
    try {
        const response = await apiClient.get('/attendance/my-today');
        return response.data;
    } catch (error) {
        throw error;
    }
},

    /**
     * @description Scan a QR code for check-in/check-out
     * @param {string} qrCodeValue The value from the scanned QR code
     * @returns {Promise<Object>}
     */
scanQR: async (qrCodeValue) => {
    const user = getUser();
    if (!user || !user.id) {
        const customError = new Error("User ID tidak ditemukan. Harap login kembali.");
        customError.status = 401;
        throw customError;
    }

    let timezone = "Asia/Jakarta"; 
    try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
    } catch (e) {
        console.warn("Gagal mendeteksi zona waktu, menggunakan default Asia/Jakarta");
    }

    try {
        const response = await apiClient.post('/attendance/scan', {
            qr_code_value: qrCodeValue,
            user_id: user.id,
            timezone: timezone, 
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
            const response = await apiClient.get('/attendance/my-history');
            return response.data;

        } catch (error) {
            console.error('Error di AttendanceService.getMyHistory:', error);
            throw error;
        }
    },
};

export default AttendanceService;