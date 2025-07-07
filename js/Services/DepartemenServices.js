// src/Services/DepartemenServices.js

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Buat satu fungsi helper untuk mengambil token agar konsisten
const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Tidak ada token autentikasi ditemukan. Silakan login.');
    }
    return token;
};

export const departmentService = {
    /**
     * Mengambil daftar semua departemen dari backend.
     */
    getAllDepartments: async () => {
        try {
            const authToken = getToken(); // Panggil helper

            const response = await fetch(`${API_BASE_URL}/departments`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            // ... (sisa logika tetap sama)
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Gagal mengambil daftar departemen.');
            return data;

        } catch (error) {
            console.error('Error di departmentService.getAllDepartments:', error);
            throw error;
        }
    },

    /**
     * Menambahkan departemen baru ke backend.
     */
    createDepartment: async (departmentData) => {
        try {
            const authToken = getToken(); // Panggil helper

            const response = await fetch(`${API_BASE_URL}/admin/departments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(departmentData),
            });
            // ... (sisa logika tetap sama)
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Gagal menambahkan departemen.');
            return data;
            
        } catch (error) {
            console.error('Error di departmentService.createDepartment:', error);
            throw error;
        }
    },

    /**
     * Mengambil detail departemen berdasarkan ID.
     */
    getDepartmentByID: async (id) => {
        try {
            const authToken = getToken(); // Panggil helper

            const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` },
            });
            // ... (sisa logika tetap sama)
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Gagal mendapatkan detail departemen.`);
            return data;

        } catch (error) {
            console.error(`Error di departmentService.getDepartmentByID (${id}):`, error);
            throw error;
        }
    },

    /**
     * Mengupdate data departemen.
     */
    updateDepartment: async (id, departmentData) => {
        try {
            const authToken = getToken(); // Panggil helper

            const response = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(departmentData),
            });
            // ... (sisa logika tetap sama)
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Gagal mengupdate departemen.`);
            return data;

        } catch (error) {
            console.error(`Error di departmentService.updateDepartment (${id}):`, error);
            throw error;
        }
    },

    /**
     * Menghapus departemen.
     */
    deleteDepartment: async (id) => {
        try {
            const authToken = getToken(); // Panggil helper
            
            const response = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` },
            });
            // ... (sisa logika tetap sama)
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Gagal menghapus departemen.`);
            return data;

        } catch (error) {
            console.error(`Error di departmentService.deleteDepartment (${id}):`, error);
            throw error;
        }
    },
};