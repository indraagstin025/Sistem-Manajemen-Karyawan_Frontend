// js/Admin/AddDepartmen.js
import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeSidebar } from "../components/sidebarHandler.js"; 
import { initializeLogout } from "../components/logoutHandler.js";


document.addEventListener("DOMContentLoaded", async () => {
    // feather.replace(); // Pindahkan ini jika Anda memusatkannya di initializeSidebar()
    initializeSidebar(); // Panggil fungsi sidebar yang sudah diimpor
    initializeLogout();

    const addDepartmentForm = document.getElementById("addDepartmentForm");
    const departmentNameInput = document.getElementById("departmentName");
    const departmentNameError = document.getElementById("departmentNameError");
    const departmentErrorMessageDiv = document.getElementById("departmentErrorMessage");
    const departmentSuccessMessageDiv = document.getElementById("departmentSuccessMessage");
    const cancelButton = document.getElementById("cancelButton");
    const submitButton = document.getElementById('submitButton');
    const submitText = document.getElementById('submitText');
    const loadingText = document.getElementById('loadingText');

    let isValidDepartmentName = false;

    function validateDepartmentName(name) {
        const trimmedName = name.trim();
        return trimmedName.length >= 2 && trimmedName.length <= 50 && /^[a-zA-Z0-9\s&-]+$/.test(trimmedName);
    }

    function updateSubmitButton() {
        submitButton.disabled = !isValidDepartmentName;
        if (!isValidDepartmentName) {
            submitButton.classList.add('bg-gray-400', 'cursor-not-allowed');
            submitButton.classList.remove('bg-teal-600', 'hover:bg-teal-700');
        } else {
            submitButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
            submitButton.classList.add('bg-teal-600', 'hover:bg-teal-700');
        }
    }

    departmentNameInput.addEventListener('blur', function() {
        const name = this.value.trim();
        if (!name) {
            isValidDepartmentName = false;
            departmentNameError.textContent = 'Nama departemen wajib diisi.';
            departmentNameError.classList.remove('hidden');
            this.classList.add('border-red-500');
        } else if (!validateDepartmentName(name)) {
            isValidDepartmentName = false;
            if (name.length < 2) {
                departmentNameError.textContent = 'Nama departemen minimal 2 karakter.';
            } else if (name.length > 50) {
                departmentNameError.textContent = 'Nama departemen maksimal 50 karakter.';
            } else {
                departmentNameError.textContent = 'Nama departemen hanya boleh huruf, angka, spasi, &, dan -.';
            }
            departmentNameError.classList.remove('hidden');
            this.classList.add('border-red-500');
        } else {
            isValidDepartmentName = true;
            departmentNameError.classList.add('hidden');
            this.classList.remove('border-red-500');
        }
        updateSubmitButton();
    });

    departmentNameInput.addEventListener('input', function() {
        this.value = this.value.replace(/\s+/g, ' ');
        const name = this.value.trim();
        if (validateDepartmentName(name)) {
            isValidDepartmentName = true;
            departmentNameError.classList.add('hidden');
            this.classList.remove('border-red-500');
        } else if (name.length > 0) {
             if (name.length < 2) {
                departmentNameError.textContent = 'Nama departemen minimal 2 karakter.';
            } else if (name.length > 50) {
                departmentNameError.textContent = 'Nama departemen maksimal 50 karakter.';
            } else {
                departmentNameError.textContent = 'Nama departemen hanya boleh huruf, angka, spasi, &, dan -.';
            }
            departmentNameError.classList.remove('hidden');
            this.classList.add('border-red-500');
            isValidDepartmentName = false;
        } else {
            isValidDepartmentName = false;
            departmentNameError.classList.add('hidden');
            this.classList.remove('border-red-500');
        }
        updateSubmitButton();
    });

    updateSubmitButton();

    const showMessage = (message, type = "success", targetDiv) => {
        targetDiv.classList.add("hidden");
        targetDiv.innerHTML = "";

        if (type === "success") {
            targetDiv.innerHTML = message;
            targetDiv.classList.remove("hidden", "text-red-600");
            targetDiv.classList.add("text-green-600");
        } else {
            targetDiv.innerHTML = message;
            targetDiv.classList.remove("hidden", "text-green-600");
            targetDiv.classList.add("text-red-600");
        }

        setTimeout(() => {
            targetDiv.classList.add("hidden");
            targetDiv.innerHTML = "";
        }, 5000);
    };

    if (!addDepartmentForm) {
        console.error('Formulir tambah departemen tidak ditemukan. Pastikan ID "addDepartmentForm" benar.');
        return;
    }

    addDepartmentForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        departmentNameInput.dispatchEvent(new Event('blur'));

        if (!isValidDepartmentName) {
            showMessage("Harap perbaiki kesalahan pada form sebelum melanjutkan.", "error", departmentErrorMessageDiv);
            departmentNameInput.focus();
            return;
        }

        departmentErrorMessageDiv.classList.add("hidden");
        departmentSuccessMessageDiv.classList.add("hidden");
        departmentErrorMessageDiv.textContent = "";
        departmentSuccessMessageDiv.textContent = "";

        const departmentName = departmentNameInput.value.trim();

        const commonDepartments = ['HR', 'IT', 'Finance', 'Marketing', 'Sales', 'Operations', 'Admin'];
        const inputNameLower = departmentName.toLowerCase();
        if (commonDepartments.some(dept => dept.toLowerCase() === inputNameLower)) {
            showMessage('Departemen ini mungkin sudah ada. Silakan gunakan nama yang lebih spesifik.', 'error', departmentErrorMessageDiv);
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            showMessage("Anda tidak terautentikasi. Silakan login ulang.", "error", departmentErrorMessageDiv);
            authService.logout();
            return;
        }

        submitButton.disabled = true;
        submitText.classList.add('hidden');
        loadingText.classList.remove('hidden');
        submitButton.classList.add('bg-gray-400', 'cursor-not-allowed');

        try {
            const response = await departmentService.createDepartment({ name: departmentName }, token);
            console.log("Departemen berhasil ditambahkan:", response);

            showMessage("Departemen berhasil ditambahkan!", "success", departmentSuccessMessageDiv);
            addDepartmentForm.reset();
            isValidDepartmentName = false;
            departmentNameInput.classList.remove('border-red-500');
            departmentNameError.classList.add('hidden');

            setTimeout(() => {
                window.location.href = "/src/pages/Admin/manage_departments.html";
            }, 2000);
        } catch (error) {
            console.error("Gagal menambahkan departemen:", error);
            let errorMessage = "Terjadi kesalahan saat menambahkan departemen. Silakan coba lagi.";

            if (error.details) {
                if (Array.isArray(error.details)) {
                    errorMessage = error.details.map((err) => `${err.Field || "Error"}: ${err.Msg}`).join("<br>");
                } else if (typeof error.details === "string") {
                    errorMessage = error.details;
                } else if (error.details.error) {
                    errorMessage = error.details.error;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, "error", departmentErrorMessageDiv);
        } finally {
            submitButton.disabled = false;
            submitText.classList.remove('hidden');
            loadingText.classList.add('hidden');
            updateSubmitButton();
        }
    });

    if (cancelButton) {
        cancelButton.addEventListener("click", () => {
            if (confirm('Apakah Anda yakin ingin membatalkan? Data yang sudah diisi akan hilang.')) {
                addDepartmentForm.reset();
                isValidDepartmentName = false;
                updateSubmitButton();
                departmentNameError.classList.add('hidden');
                departmentErrorMessageDiv.classList.add('hidden');
                departmentNameInput.classList.remove('border-red-500');
                departmentSuccessMessageDiv.classList.add('hidden');
                window.location.href = "/src/pages/Admin/admin_dashboard.html";
            }
        });
    }
});