
import apiClient from './apiClient'; // Import apiClient yang sudah dibuat


export const departmentService = {
    /**
     * Mengambil daftar semua departemen dari backend.
     */
    getAllDepartments: async () => {
        try {
            const response = await apiClient.get('/departments');
            return response.data; 
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
            const response = await apiClient.post('/admin/departments', departmentData);
            return response.data;
            
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
            const response = await apiClient.get(`/departments/${id}`);
            return response.data;

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
            const response = await apiClient.put(`/admin/departments/${id}`, departmentData);
            return response.data;

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
            const response = await apiClient.delete(`/admin/departments/${id}`);
            return response.data;

        } catch (error) {
            console.error(`Error di departmentService.deleteDepartment (${id}):`, error);
            throw error;
        }
    },
};