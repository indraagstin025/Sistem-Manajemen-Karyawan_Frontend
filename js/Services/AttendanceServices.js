// File: js/Services/AttendanceServices.js

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Sesuaikan jika port berbeda

const getToken = () => localStorage.getItem('token');
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
        const token = getToken();
        if (!token) {
            throw new Error('Tidak ada token autentikasi ditemukan. Silakan login kembali.');
        }

        // Backend Anda sekarang menggunakan GET method untuk generate-qr, bukan POST
        // Dan tidak lagi memerlukan body/payload untuk tanggal
        const response = await fetch(`${API_BASE_URL}/attendance/generate-qr`, {
            method: 'GET', // <-- Perubahan: Dari POST menjadi GET
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json(); // Selalu coba parse JSON

        if (!response.ok) {
            // Tangani error dengan lebih baik
            const error = new Error(data.error || 'Gagal membuat QR Code');
            error.status = response.status;
            throw error;
        }
        return data; // Mengembalikan data langsung dari response
    },

    /**
     * @description Get all attendance for today (Admin only)
     * @returns {Promise<Array>}
     */
    getTodaysAttendance: async () => {
        const token = getToken();
        if (!token) {
            throw new Error('Tidak ada token autentikasi ditemukan. Silakan login kembali.');
        }

        const response = await fetch(`${API_BASE_URL}/attendance/today`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json(); // Selalu coba parse JSON

        if (!response.ok) {
            const error = new Error(data.error || 'Gagal mengambil data absensi hari ini');
            error.status = response.status;
            throw error;
        }
        return data;
    },

    /**
     * @description Scan a QR code for check-in/check-out
     * @param {string} qrCodeValue The value from the scanned QR code
     * @returns {Promise<Object>}
     */
    scanQR: async (qrCodeValue) => {
        const user = getUser();
        if (!user || !user.id) { // Pastikan user dan user.id ada
            throw new Error("User ID tidak ditemukan. Harap login kembali.");
        }
        const token = getToken();
        if (!token) {
            throw new Error('Tidak ada token autentikasi ditemukan. Silakan login kembali.');
        }

        const response = await fetch(`${API_BASE_URL}/attendance/scan`, { // Perhatikan endpoint, sebelumnya '/attendance/scan'
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                qr_code_value: qrCodeValue,
                user_id: user.id
            }),
        });
        
        const data = await response.json(); // Selalu coba parse JSON

        if (!response.ok) {
            const error = new Error(data.error || data.message || 'Gagal melakukan absensi.'); // Ambil error dari 'error' atau 'message'
            error.status = response.status;
            throw error;
        }
        return data;
    },

    /**
     * @description Get my personal attendance history
     * @returns {Promise<Array>}
     */
    getMyHistory: async () => {
        const token = getToken();
        if (!token) {
            throw new Error('Tidak ada token autentikasi ditemukan. Silakan login kembali.');
        }

        const response = await fetch(`${API_BASE_URL}/attendance/my-history`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json(); // Selalu coba parse JSON

        if (!response.ok) {
            const error = new Error(data.error || 'Gagal mengambil riwayat absensi');
            error.status = response.status;
            throw error;
        }
        return data;
    },
};

// ==========================================================
// PASTIKAN BARIS INI ADA DI PALING BAWAH
// Ini adalah baris yang menyebabkan error jika tidak ada.
// ==========================================================
export default AttendanceService;