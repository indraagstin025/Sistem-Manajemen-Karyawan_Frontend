import { userService } from "../Services/UserServices.js";
import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeFormValidation, isFormValid } from "../Validations/addEmployeeValidation.js";
import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { QRCodeManager } from "../components/qrCodeHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js"; // Import fungsi photoUtils

import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";


document.addEventListener("DOMContentLoaded", async () => {

    feather.replace(); // Memuat ikon Feather di awal
    initializeSidebar();
    initializeFormValidation();


    // Initialize QR Code Manager
    QRCodeManager.initialize({
        toastCallback: (message, type) => {
            showAlert(message, type);
        },
    });

    // Initialize logout functionality
    initializeLogout({
        preLogoutCallback: () => {
            if (typeof QRCodeManager !== 'undefined' && QRCodeManager.close) {
                QRCodeManager.close();
            }
        }
    });

    const addEmployeeForm = document.getElementById("addEmployeeForm");
    const departmentSelect = document.getElementById("department");
    const cancelButton = document.getElementById("cancelButton");
    const logoutButtons = document.querySelectorAll("#logoutButton");
    const passwordInput = document.getElementById("password");
    const togglePasswordButton = document.getElementById("togglePassword");

    // Elemen untuk foto profil admin di header
    const userAvatarNav = document.getElementById("userAvatar"); // ID elemen img di header
    const userNameNav = document.getElementById("userNameNav");   // ID elemen span/div untuk nama user di header


    if (togglePasswordButton && passwordInput) {
        togglePasswordButton.addEventListener("click", () => {

            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);

            const icon = togglePasswordButton.querySelector("i");
            if (type === "password") {
                icon.setAttribute("data-feather", "eye-off");
            } else {
                icon.setAttribute("data-feather", "eye");
            }
            feather.replace();
        });
    }

    function showAlert(message, type = "success") {
        const colorConfig = {
            success: "linear-gradient(to right, #10b981, #14b8a6)",
            error: "linear-gradient(to right, #ef4444, #dc2626)",
            warning: "linear-gradient(to right, #f97316, #ea580c)",
        };

        const backgroundColor = colorConfig[type] || colorConfig.error;

        Toastify({
            text: message,
            duration: type === "success" ? 3000 : -1,
            close: true,
            gravity: "top",
            position: "center",
            stopOnFocus: true,
            style: {
                background: backgroundColor,
                borderRadius: "8px",
                padding: "20px 24px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
                maxWidth: "400px",
                textAlign: "center",
            },
            modal: true,
        }).showToast();
    }

    // Fungsi untuk memuat data profil admin untuk header
    const fetchAdminProfileDataForHeader = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                // Jangan langsung redirect di sini, biar loadDepartments atau AddEmployeeForm yang handle
                return;
            }
            let user = authService.getCurrentUser();
            if (!user || user.role !== "admin") {
                // Jangan langsung redirect di sini
                return;
            }

            // Menggunakan getUserPhotoBlobUrl untuk avatar di header
            const userPhotoUrl = await getUserPhotoBlobUrl(user.id, user.name, 40); // Ukuran 40x40

            if (userAvatarNav) {
                userAvatarNav.src = userPhotoUrl;
                userAvatarNav.alt = user.name || "Admin"; // Fallback text
            }
            if (userNameNav) {
                userNameNav.textContent = user.name || "Admin"; // Fallback text
            }
        } catch (error) {
            console.error("Error fetching admin profile data for header:", error);
            // Error di sini tidak fatal untuk fungsi utama halaman, jadi tidak perlu showToast atau logout
        }
    };


    const loadDepartments = async () => {
        try {
            const departments = await departmentService.getAllDepartments();
            departmentSelect.innerHTML = '<option value="">Pilih Departemen</option>';
            departments.forEach((dept) => {
                const option = document.createElement("option");
                option.value = dept.name;
                option.textContent = dept.name;
                departmentSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Gagal memuat daftar departemen:", error);
            showAlert("Gagal memuat daftar departemen.", "error");
            if (error.status === 401) authService.logout();
        }
    };

    // Panggil fungsi-fungsi inisialisasi
    await loadDepartments();
    await fetchAdminProfileDataForHeader(); // Panggil fungsi ini saat DOM siap

    addEmployeeForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!isFormValid()) {
            showAlert("Harap perbaiki semua kesalahan pada form.", "error");
            return;
        }

        const formData = new FormData(addEmployeeForm);
        const userData = Object.fromEntries(formData.entries());
        userData.role = "karyawan";
        userData.base_salary = parseFloat(userData.base_salary);
        const token = localStorage.getItem("token");

        if (!token) {
            authService.logout();
            return;
        }

        try {
            await userService.registerUser(userData, token);
            showAlert("Karyawan baru berhasil didaftarkan!", "success");

            addEmployeeForm.reset();
            initializeFormValidation(); // Re-initialize validation to clear error messages

            setTimeout(() => {
                window.location.href = "/src/pages/Admin/manage_employees.html";
            }, 2000);
        } catch (error) {
            console.error("Gagal mendaftarkan karyawan:", error);
            const errorMessage = error.details?.error || error.message || "Terjadi kesalahan server.";
            showAlert(errorMessage, "error");
        }
    });

    cancelButton?.addEventListener("click", () => {
        if (confirm("Anda yakin ingin membatalkan? Perubahan tidak akan disimpan.")) {
            window.location.href = "/src/pages/Admin/manage_employees.html";
        }
    });

    logoutButtons.forEach((button) => {
        button?.addEventListener("click", (event) => {
            event.preventDefault();
            authService.logout();
        });
    });

});