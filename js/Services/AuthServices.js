// src/js/Services/AuthServices.js

const API_BASE_URL = 'http://localhost:3000/api/v1';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat login.');
      }

      if (data.token && data.user) {
        // MENYIMPAN dengan kunci 'token'
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;

    } catch (error) {
      console.error('Error di authService.login:', error);
      throw error;
    }
  },

  logout: () => {
    // MENGHAPUS dengan kunci 'token'
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/src/pages/login.html';
  },


   /**
   * Mengambil data user yang sedang login dari localStorage.
   * @returns {Object|null} Objek user jika ada, null jika tidak.
   */
  getCurrentUser: () => { // <--- TAMBAHKAN FUNGSI INI
    try {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      return null;
    }
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

export const dashboardService = {
  getDashboardStats: async () => {
    try {
      // ======================================================
      // PERUBAHAN UTAMA DI SINI
      // Ganti 'authToken' menjadi 'token' agar konsisten
      // ======================================================
      const authToken = localStorage.getItem('token');

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
        throw new Error(data.error || 'Gagal mengambil statistik dashboard.');
      }
      return data;
      
    } catch (error) {
      console.error('Error di dashboardService.getDashboardStats:', error);
      throw error;
    }
  }
};