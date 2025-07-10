// src/js/Services/DepartemenServices.js

import apiClient from './apiClient'; // Import apiClient yang sudah dibuat

// Hapus API_BASE_URL dan getToken karena apiClient dan interceptor menanganinya
// const API_BASE_URL = 'http://localhost:3000/api/v1';
// const getToken = () => { /* ... */ };

export const departmentService = {
    /**
     * Mengambil daftar semua departemen dari backend.
     */
    getAllDepartments: async () => {
        try {
            // apiClient otomatis menambahkan Authorization header dan menangani response.json()
            const response = await apiClient.get('/departments');
            return response.data; // Axios otomatis mengembalikan data respons

        } catch (error) {
            console.error('Error di departmentService.getAllDepartments:', error);
            throw error; // Interceptor sudah menangani error respons
        }
    },

    /**
     * Menambahkan departemen baru ke backend.
     */
    createDepartment: async (departmentData) => {
        try {
            // apiClient otomatis menambahkan Authorization header dan Content-Type
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
            // apiClient otomatis menambahkan Authorization header
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
            // apiClient otomatis menambahkan Authorization header
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
            // apiClient otomatis menambahkan Authorization header
            const response = await apiClient.delete(`/admin/departments/${id}`);
            return response.data;

        } catch (error) {
            console.error(`Error di departmentService.deleteDepartment (${id}):`, error);
            throw error;
        }
    },
};