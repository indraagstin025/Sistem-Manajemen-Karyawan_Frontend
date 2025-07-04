// src/js/Services/AuthServices.js

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Pastikan URL ini benar

export const authService = {
    /**
     * Mengirim permintaan login ke backend.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>} Respon dari API (berhasil/gagal)
     */
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                const error = new Error(data.error || 'Terjadi kesalahan saat login.');
                error.status = response.status;
                error.details = data.details || data.errors; 
                throw error;
            }

            return data; 
        } catch (error) {
            console.error('Error di authService.login:', error);
            throw error; 
        }
    },

    /**
     * Melakukan proses logout.
     * Menghapus token dan data user dari local storage dan mengarahkan ke halaman login.
     */
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isFirstLogin'); 
        
        window.location.href = '/src/pages/login.html'; 
    },

    /**
     * Mengubah password user yang sedang login.
     * @param {string} oldPassword - Password lama user.
     * @param {string} newPassword - Password baru user.
     * @param {string} authToken - Token autentikasi user.
     * @returns {Promise<Object>} Respon dari API (berhasil/gagal).
     */
    changePassword: async (oldPassword, newPassword, authToken) => {
        try {
            if (!authToken) {
                throw new Error('Tidak ada token autentikasi ditemukan. Silakan login.');
            }

            const response = await fetch(`${API_BASE_URL}/users/change-password`, {
                method: 'POST', // Endpoint ini adalah POST di backend Anda
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || 'Gagal mengubah password.');
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error di authService.changePassword:', error);
            throw error;
        }
    }
};

// Pastikan dashboardService tidak lagi memiliki changePassword
export const dashboardService = {
    /**
     * Mengambil statistik dashboard dari backend.
     * Membutuhkan token autentikasi admin.
     * @returns {Promise<Object>} Data statistik dashboard
     */
    getDashboardStats: async () => {
        try {
            const authToken = localStorage.getItem('authToken');

            if (!authToken) {
                throw new Error('Tidak ada token autentikasi ditemukan. Silakan login.');
            }

            const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || 'Gagal mengambil statistik dashboard.');
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error di dashboardService.getDashboardStats:', error);
            throw error;
        }
    }
};