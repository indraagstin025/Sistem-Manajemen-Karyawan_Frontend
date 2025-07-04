// js/Admin/AddEmployee.js

import { userService } from '../Services/UserServices.js';

document.addEventListener('DOMContentLoaded', () => {
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    const registerErrorMessageDiv = document.getElementById('registerErrorMessage');
    const registerSuccessMessageDiv = document.getElementById('registerSuccessMessage');

    feather.replace();

    if (!addEmployeeForm) {
        console.error('Formulir tambah karyawan tidak ditemukan. Pastikan ID "addEmployeeForm" benar.');
        return;
    }

    addEmployeeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        registerErrorMessageDiv.classList.add('hidden');
        registerSuccessMessageDiv.classList.add('hidden');
        registerErrorMessageDiv.textContent = '';
        registerSuccessMessageDiv.textContent = '';

        const formData = new FormData(addEmployeeForm);
        const userData = Object.fromEntries(formData.entries());

        // --- Perubahan dimulai di sini ---
        // Tetapkan role secara default ke 'karyawan'
        userData.role = 'karyawan'; 
        // --- Perubahan berakhir di sini ---

        // Pastikan base_salary adalah angka
        userData.base_salary = parseFloat(userData.base_salary);
        if (isNaN(userData.base_salary)) {
            registerErrorMessageDiv.textContent = 'Gaji pokok harus berupa angka yang valid.';
            registerErrorMessageDiv.classList.remove('hidden');
            return;
        }

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            registerErrorMessageDiv.textContent = 'Anda tidak terautentikasi. Silakan login ulang.';
            registerErrorMessageDiv.classList.remove('hidden');
            return;
        }

        try {
            const response = await userService.registerUser(userData, authToken);
            console.log('Karyawan berhasil didaftarkan:', response);
            
            registerSuccessMessageDiv.textContent = 'Karyawan berhasil didaftarkan! Mengarahkan kembali ke dashboard...';
            registerSuccessMessageDiv.classList.remove('hidden');
            addEmployeeForm.reset(); 

            setTimeout(() => {
                window.location.href = '/src/pages/Admin/admin_dashboard.html'; 
            }, 2000); 

        } catch (error) {
            console.error('Gagal mendaftarkan karyawan:', error);
            let errorMessage = 'Terjadi kesalahan saat mendaftarkan karyawan. Silakan coba lagi.';
            if (error.details) {
                if (Array.isArray(error.details)) {
                    errorMessage = error.details.map(err => `${err.field || 'Error'}: ${err.message}`).join('<br>');
                } else if (typeof error.details === 'string') {
                    errorMessage = error.details;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            registerErrorMessageDiv.innerHTML = errorMessage;
            registerErrorMessageDiv.classList.remove('hidden');
        }
    });

    // ... (sisa logika sidebar mobile jika ada) ...
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
    const closeSidebar = document.getElementById('closeSidebar');

    if (sidebarToggle && mobileSidebar && mobileSidebarPanel && closeSidebar) {
        sidebarToggle.addEventListener('click', () => {
            mobileSidebar.classList.remove('hidden');
            setTimeout(() => {
                mobileSidebar.classList.add('opacity-100');
                mobileSidebarPanel.classList.remove('-translate-x-full');
            }, 10);
        });

        const hideMobileSidebar = () => {
            mobileSidebar.classList.remove('opacity-100');
            mobileSidebarPanel.classList.add('-translate-x-full');
            setTimeout(() => {
                mobileSidebar.classList.add('hidden');
            }, 300);
        };

        closeSidebar.addEventListener('click', hideMobileSidebar);

        mobileSidebar.addEventListener('click', (event) => {
            if (event.target === mobileSidebar) {
                hideMobileSidebar();
            }
        });
    }
});