// src/Services/UserServices.js

const API_BASE_URL = 'http://localhost:3000/api/v1'; 

export const userService = {
    /**
     * Mendaftarkan user baru (karyawan/admin).
     * Membutuhkan token autentikasi admin di header 'Authorization'.
     * @param {Object} userData - Objek data user yang akan didaftarkan.
     * @param {string} token - Token JWT dari sesi admin yang sedang login.
     * @returns {Promise<Object>} Respon data dari API.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    registerUser: async (userData, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || data.error || 'Terjadi kesalahan saat mendaftarkan user.');
                error.status = response.status;
                error.details = data.details || data.errors; 
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error di userService.registerUser:', error);
            throw error; 
        }
    },

    /**
     * Mendapatkan daftar semua user/karyawan.
     * Membutuhkan token autentikasi admin di header 'Authorization'.
     * @param {string} token - Token JWT dari sesi admin yang sedang login.
     * @param {number} page - Nomor halaman yang diminta (default 1).
     * @param {number} limit - Jumlah item per halaman (default 10).
     * @param {string} search - Kata kunci pencarian nama atau email (opsional).
     * @param {string} role - Filter berdasarkan role (misal: 'karyawan', 'admin') (opsional).
     * @returns {Promise<Object>} Respon data dari API (misal: { data: [], total: 0, page: 1, limit: 10 }).
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getAllUsers: async (token, page = 1, limit = 10, search = '', role = '') => {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: search,
                role: role
            }).toString();

            const url = `${API_BASE_URL}/admin/users?${queryParams}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || 'Gagal mendapatkan daftar karyawan.');
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error di userService.getAllUsers:', error);
            throw error;
        }
    },

    /**
     * Mendapatkan detail user berdasarkan ID.
     * Membutuhkan token autentikasi.
     * @param {string} id - ID user (MongoDB ObjectID string).
     * @param {string} token - Token JWT dari user yang terautentikasi (admin atau user itu sendiri).
     * @returns {Promise<Object>} Objek user.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getUserByID: async (id, token) => { 
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}`, { 
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || `Gagal mendapatkan detail user dengan ID ${id}.`);
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }
            return data;
        } catch (error) {
            console.error(`Error di userService.getUserByID (${id}):`, error);
            throw error;
        }
    },

    /**
     * Mengupdate data user.
     * Membutuhkan token autentikasi. Admin bisa update semua field, karyawan hanya bisa update beberapa.
     * @param {string} id - ID user yang akan diupdate.
     * @param {Object} userData - Objek data user yang akan diupdate.
     * @param {string} token - Token JWT dari user yang terautentikasi (admin atau user itu sendiri).
     * @returns {Promise<Object>} Respon dari API.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    updateUser: async (id, userData, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}`, { 
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json', // Tetap application/json untuk update data non-file
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || data.error || `Gagal mengupdate user dengan ID ${id}.`);
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }
            return data;
        } catch (error) {
            console.error(`Error di userService.updateUser (${id}):`, error);
            throw error;
        }
    },

    /**
     * Menghapus user.
     * Membutuhkan token autentikasi admin.
     * @param {string} id - ID user yang akan dihapus.
     * @param {string} token - Token JWT dari admin yang terautentikasi.
     * @returns {Promise<Object>} Respon dari API.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    deleteUser: async (id, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || data.error || `Gagal menghapus user dengan ID ${id}.`);
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }
            return data;
        } catch (error) {
            console.error(`Error di userService.deleteUser (${id}):`, error);
            throw error;
        }
    },

    /**
     * Mengunggah foto profil untuk user tertentu.
     * @param {string} id - ID user yang akan diupdate fotonya.
     * @param {File} photoFile - Objek File dari input type="file".
     * @param {string} token - Token autentikasi user.
     * @returns {Promise<Object>} Respon dari API (berhasil/gagal) dengan URL foto baru.
     */
    uploadProfilePhoto: async (id, photoFile, token) => {
        try {
            const formData = new FormData();
            formData.append('photo', photoFile); // 'photo' harus sesuai dengan nama field di backend (c.FormFile("photo"))

            const response = await fetch(`${API_BASE_URL}/users/${id}/upload-photo`, {
                method: 'POST', // Menggunakan POST untuk upload file
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Penting: Jangan set Content-Type untuk FormData, browser akan mengaturnya secara otomatis
                },
                body: formData, // Kirim FormData langsung
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || data.error || 'Gagal mengunggah foto profil.');
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`Error di userService.uploadProfilePhoto (${id}):`, error);
            throw error;
        }
    },
};
