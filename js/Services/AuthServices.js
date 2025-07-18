
import apiClient from './apiClient';



export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password }); 
      
      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data; 

    } catch (error) {
      console.error('Error di authService.login:', error);
      throw error; 
    }
  },

logout: async () => {
  try {
    await apiClient.post('/auth/logout'); 
  } catch (error) {
    console.warn('Logout di server gagal (tidak masalah jika token sudah kadaluarsa)', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/src/pages/login.html';
  }
},


  /**
   * Mengambil data user yang sedang login dari localStorage.
   * @returns {Object|null} Objek user jika ada, null jika tidak.
   */
  getCurrentUser: () => {
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
   * @returns {Promise<Object>} Respon dari API (berhasil/gagal).
   */
  changePassword: async (oldPassword, newPassword) => { 
    try {
      const response = await apiClient.post('/users/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      return response.data;

    } catch (error) {
      console.error('Error di authService.changePassword:', error);
      throw error;
    }
  }
};

export const dashboardService = {
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get('/admin/dashboard-stats'); 
      return response.data;

    } catch (error) {
      console.error('Error di dashboardService.getDashboardStats:', error);
      throw error;
    }
  }
};