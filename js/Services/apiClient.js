// src/js/Services/apiClient.js

import axios from 'axios';

// Pastikan ini sesuai dengan URL backend Go Anda (port dan prefix /api/v1)
const API_BASE_URL = 'https://sistem-manajemen-karyawanbackend-production.up.railway.app/api/v1'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
   
  },
});

// Interceptor Request: Secara otomatis menambahkan token otorisasi ke setiap request
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor Response: Menangani error respons HTTP secara global
apiClient.interceptors.response.use(
  response => response, // Jika respons sukses, teruskan
  error => {
    // Tangani error HTTP
    if (error.response) {
      console.error('Axios Response Error:', error.response.status, error.response.data);
      const errorMessage = error.response.data.error || error.response.data.message || `Terjadi kesalahan ${error.response.status}.`;
      const customError = new Error(errorMessage);
      customError.status = error.response.status;
      customError.details = error.response.data.details || error.response.data.errors;
      // Jika status 401 atau 403, mungkin perlu logout otomatis atau redirect ke login
      if (error.response.status === 401 || error.response.status === 403) {
        console.warn('Unauthorized or Forbidden access, attempting logout.');
        // Contoh sederhana untuk logout. Sesuaikan jika Anda punya authService.logout()
        // window.location.href = '/src/pages/login.html'; 
        // Atau panggil logout dari authService jika sudah di-import/akses
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // window.location.href = '/src/pages/login.html'; // Bisa redirect di sini atau di tempat error di handle
      }
      return Promise.reject(customError);
    } else if (error.request) {
      // Request dibuat tapi tidak ada respons diterima
      console.error('Axios Request Error (No response):', error.request);
      return Promise.reject(new Error('Tidak ada respons dari server. Periksa koneksi internet Anda atau status server.'));
    } else {
      // Kesalahan lain saat setup request
      console.error('Axios Error (Request setup):', error.message);
      return Promise.reject(new Error(`Terjadi kesalahan: ${error.message}`));
    }
  }
);

export default apiClient; // Ekspor apiClient agar bisa diimpor di service lain