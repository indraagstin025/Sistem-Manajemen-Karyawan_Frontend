// src/Services/DepartmentService.js

// Sesuaikan URL base API Anda
const API_BASE_URL = 'http://localhost:3000/api/v1';

export const departmentService = {
    /**
     * Mengambil daftar semua departemen dari backend.
     * Membutuhkan token autentikasi.
     * @returns {Promise<Array<Object>>} Array objek departemen (misal: [{ id: '...', name: 'Teknik' }])
     */
    getAllDepartments: async () => {
        try {
            const authToken = localStorage.getItem('authToken');

            if (!authToken) {
                throw new Error('Tidak ada token autentikasi ditemukan. Silakan login.');
            }

            const response = await fetch(`${API_BASE_URL}/departments`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || 'Gagal mengambil daftar departemen.');
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error di departmentService.getAllDepartments:', error);
            throw error;
        }
    },

    /**
     * Menambahkan departemen baru ke backend.
     * Membutuhkan token autentikasi admin.
     * @param {Object} departmentData - Objek data departemen (misal: { name: 'Nama Departemen' }).
     * @param {string} authToken - Token autentikasi admin.
     * @returns {Promise<Object>} Respon dari API (berhasil/gagal).
     */
    createDepartment: async (departmentData, authToken) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/departments`, { // Endpoint POST untuk admin
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(departmentData),
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || 'Gagal menambahkan departemen.');
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error di departmentService.createDepartment:', error);
            throw error;
        }
    },

    /**
     * Mengambil detail departemen berdasarkan ID.
     * Membutuhkan token autentikasi.
     * @param {string} id - ID departemen (MongoDB ObjectID string).
     * @param {string} authToken - Token autentikasi.
     * @returns {Promise<Object>} Objek departemen.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    getDepartmentByID: async (id, authToken) => {
        try {
            if (!authToken) {
                throw new Error('Tidak ada token autentikasi ditemukan. Silakan login.');
            }
            const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
            });
            const data = await response.json();
            if (!response.ok) {
                const error = new Error(data.error || `Gagal mendapatkan detail departemen dengan ID ${id}.`);
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }
            return data;
        } catch (error) {
            console.error(`Error di departmentService.getDepartmentByID (${id}):`, error);
            throw error;
        }
    },

    /**
     * Mengupdate data departemen.
     * Membutuhkan token autentikasi admin.
     * @param {string} id - ID departemen yang akan diupdate.
     * @param {Object} departmentData - Objek data departemen yang akan diupdate (misal: { name: 'Nama Baru' }).
     * @param {string} authToken - Token autentikasi admin.
     * @returns {Promise<Object>} Respon dari API.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    updateDepartment: async (id, departmentData, authToken) => {
        try {
            if (!authToken) {
                throw new Error('Tidak ada token autentikasi ditemukan. Silakan login.');
            }
            const response = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(departmentData),
            });
            const data = await response.json();
            if (!response.ok) {
                const error = new Error(data.error || `Gagal mengupdate departemen dengan ID ${id}.`);
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }
            return data;
        } catch (error) {
            console.error(`Error di departmentService.updateDepartment (${id}):`, error);
            throw error;
        }
    },

    /**
     * Menghapus departemen.
     * Membutuhkan token autentikasi admin.
     * @param {string} id - ID departemen yang akan dihapus.
     * @param {string} authToken - Token autentikasi admin.
     * @returns {Promise<Object>} Respon dari API.
     * @throws {Error} Jika respons API bukan 2xx.
     */
    deleteDepartment: async (id, authToken) => {
        try {
            if (!authToken) {
                throw new Error('Tidak ada token autentikasi ditemukan. Silakan login.');
            }
            const response = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
            });
            const data = await response.json();
            if (!response.ok) {
                const error = new Error(data.error || `Gagal menghapus departemen dengan ID ${id}.`);
                error.status = response.status;
                error.details = data.details || data.errors;
                throw error;
            }
            return data;
        } catch (error) {
            console.error(`Error di departmentService.deleteDepartment (${id}):`, error);
            throw error;
        }
    },
};
