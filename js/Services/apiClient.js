import axios from "axios";
import { authService } from './AuthServices.js'; // Perbaiki path import yang benar

const API_BASE_URL = "https://sistem-manajemen-karyawanbackend-production.up.railway.app/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {},
});

// Request interceptor untuk menambahkan token
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    console.log('Request interceptor - Token check:', token ? 'Token tersedia' : 'Token TIDAK tersedia');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header berhasil ditambahkan');
    } else {
      console.warn("Token tidak ditemukan di localStorage. User mungkin belum login atau token expired.");
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor untuk menangani error secara global
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("Axios Response Error:", error.response.status, error.response.data);
      const errorMessage = error.response.data.error || error.response.data.message || `Terjadi kesalahan ${error.response.status}.`;
      const customError = new Error(errorMessage);
      customError.status = error.response.status;
      customError.details = error.response.data.details || error.response.data.errors;

      // PERBAIKAN: Hanya lakukan logout otomatis jika status adalah 401 (Unauthorized).
      // JANGAN logout untuk status 403 (Forbidden), karena itu adalah validation error.
      if (error.response.status === 401) {
        console.warn("Unauthorized access (401). Sesi tidak valid, melakukan logout.");
        authService.logout();
      } else if (error.response.status === 403) {
        console.warn("Forbidden access (403). Validation error atau akses ditolak:", errorMessage);
        // Jangan logout, hanya tampilkan error
      }

      return Promise.reject(customError);
    } else if (error.request) {
      console.error("Axios Request Error (No response):", error.request);
      return Promise.reject(new Error("Tidak ada respons dari server. Periksa koneksi internet Anda atau status server."));
    } else {
      console.error("Axios Error (Request setup):", error.message);
      return Promise.reject(new Error(`Terjadi kesalahan: ${error.message}`));
    }
  }
);

export default apiClient;
