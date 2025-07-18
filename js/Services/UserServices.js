
import apiClient from './apiClient'; 


export const userService = {
    /**
     * Mendaftarkan user baru (karyawan/admin).
     * Membutuhkan token autentikasi admin di header 'Authorization' (ditangani interceptor).
     * @param {Object} userData - Objek data user yang akan didaftarkan.
     * @returns {Promise<Object>} Respon data dari API.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    registerUser: async (userData) => { // Parameter 'token' dihapus
        try {
            const response = await apiClient.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            console.error('Error di userService.registerUser:', error);
            throw error;
        }
    },

    /**
     * Mendapatkan daftar semua user/karyawan.
     * Membutuhkan token autentikasi admin di header 'Authorization' (ditangani interceptor).
     * @param {number} page - Nomor halaman yang diminta (default 1).
     * @param {number} limit - Jumlah item per halaman (default 10).
     * @param {string} search - Kata kunci pencarian nama atau email (opsional).
     * @param {string} role - Filter berdasarkan role (misal: 'karyawan', 'admin') (opsional).
     * @returns {Promise<Object>} Respon data dari API (misal: { data: [], total: 0, page: 1, limit: 10 }).
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getAllUsers: async (page = 1, limit = 10, search = '', role = '') => { // Parameter 'token' dihapus
        try {
            const params = { page, limit, search, role }; // Axios bisa mengirim query params dari objek
            const response = await apiClient.get('/admin/users', { params });
            return response.data;
        } catch (error) {
            console.error('Error di userService.getAllUsers:', error);
            throw error;
        }
    },

    /**
     * Mendapatkan detail user berdasarkan ID.
     * Membutuhkan token autentikasi (ditangani interceptor).
     * @param {string} id - ID user (MongoDB ObjectID string).
     * @returns {Promise<Object>} Objek user.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getUserByID: async (id) => { // Parameter 'token' dihapus
        try {
            const response = await apiClient.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error di userService.getUserByID (${id}):`, error);
            throw error;
        }
    },

    /**
     * Mengupdate data user.
     * Membutuhkan token autentikasi (ditangani interceptor).
     * @param {string} id - ID user yang akan diupdate.
     * @param {Object} userData - Objek data user yang akan diupdate.
     * @returns {Promise<Object>} Respon dari API.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    updateUser: async (id, userData) => { // Parameter 'token' dihapus
        try {
            const response = await apiClient.put(`/users/${id}`, userData);
            return response.data;
        } catch (error) {
            console.error(`Error di userService.updateUser (${id}):`, error);
            throw error;
        }
    },

    /**
     * Menghapus user.
     * Membutuhkan token autentikasi admin (ditangani interceptor).
     * @param {string} id - ID user yang akan dihapus.
     * @returns {Promise<Object>} Respon dari API.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    deleteUser: async (id) => { // Parameter 'token' dihapus
        try {
            const response = await apiClient.delete(`/admin/users/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error di userService.deleteUser (${id}):`, error);
            throw error;
        }
    },

    /**
     * Mengunggah foto profil untuk user tertentu.
     * @param {string} id - ID user yang akan diupdate fotonya.
     * @param {File} photoFile - Objek File dari input type="file".
     * @returns {Promise<Object>} Respon dari API (berhasil/gagal) dengan URL foto baru.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    uploadProfilePhoto: async (id, photoFile) => { // Parameter 'token' dihapus
        try {
            const formData = new FormData();
            formData.append('photo', photoFile); 

            const response = await apiClient.post(`/users/${id}/upload-photo`, formData);
            return response.data;
        } catch (error) {
            console.error(`Error di userService.uploadProfilePhoto (${id}):`, error);
            throw error;
        }
    },



getProfilePhoto: async (userId) => {
  try {
    const token = localStorage.getItem("token"); // Ambil token secara langsung

    const response = await apiClient.get(`/users/${userId}/photo`, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`, // Set manual di sini
      },
      validateStatus: (status) => {
        return (status >= 200 && status < 300) || status === 404;
      },
    });

    if (response.status === 404) {
      return null;
    }

    return response.data;
  } catch (error) {
    console.error(`Gagal memuat foto user ${userId}:`, error);
    return null;
  }
}
};



