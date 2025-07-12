import axios from "axios";

const API_BASE_URL = "https://sistem-manajemen-karyawanbackend-production.up.railway.app/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
  headers: {},
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("Token tidak ditemukan di localStorage.");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("Axios Response Error:", error.response.status, error.response.data);
      const errorMessage = error.response.data.error || error.response.data.message || `Terjadi kesalahan ${error.response.status}.`;
      const customError = new Error(errorMessage);
      customError.status = error.response.status;
      customError.details = error.response.data.details || error.response.data.errors;

      if (error.response.status === 401 || error.response.status === 403) {
        console.warn("Unauthorized or Forbidden access, attempting logout.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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
