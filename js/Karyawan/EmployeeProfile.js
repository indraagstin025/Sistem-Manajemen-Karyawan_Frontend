import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { validateChangePasswordForm } from '../Validations/changePasswordValidation.js';
import { initTheme } from "../utils/darkmode.js";

document.addEventListener("DOMContentLoaded", () => {
    feather.replace(); // Memuat ikon Feather di awal
    initTheme();

    const profilePhotoPreview = document.getElementById("profilePhotoPreview");
    const photoUploadInput = document.getElementById("photoUpload");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const positionInput = document.getElementById("position");
    const departmentInput = document.getElementById("department");
    const addressTextarea = document.getElementById("address");
    const profileForm = document.getElementById("profileForm");
    const changePasswordForm = document.getElementById("changePasswordFormProfile");
    const showPasswordCheckbox = document.getElementById("showPasswordCheckbox");
    const logoutButtons = document.querySelectorAll("#logoutButton, #dropdownLogoutButton, #mobileLogoutButton");
    const cancelProfileEditBtn = document.getElementById("cancelProfileEditBtn");

    // === Variabel baru untuk fitur gaji yang dapat di-toggle ===
    const baseSalaryInput = document.getElementById("base_salary");
    const toggleSalaryVisibilityBtn = document.getElementById("toggleSalaryVisibility");
    const salaryEyeIcon = document.getElementById("salaryEyeIcon");
    let currentSalaryValue = ""; // Untuk menyimpan nilai gaji sebenarnya
    // ==========================================================

    let initialProfileData = {}; // Untuk menyimpan data profil awal yang dimuat

    const showToast = (message, type = "success") => {
        let backgroundColor;
        if (type === "success") {
            backgroundColor = "linear-gradient(to right, #22c55e, #16a34a)";
        } else if (type === "error") {
            backgroundColor = "linear-gradient(to right, #ef4444, #dc2626)";
        } else {
            backgroundColor = "linear-gradient(to right, #3b82f6, #2563eb)";
        }

        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: backgroundColor,
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                padding: "12px 20px"
            },
        }).showToast();
    };

    const loadProfileData = async () => {
        try {
            const userString = localStorage.getItem("user");
            if (!userString) throw new Error("Sesi tidak valid. Harap login kembali.");

            const user = JSON.parse(userString);
            const employee = await userService.getUserByID(user.id);

            if (employee) {
                nameInput.value = employee.name || "";
                emailInput.value = employee.email || "";
                positionInput.value = employee.position || "";
                departmentInput.value = employee.department || "";

                // === Penyesuaian untuk Gaji: Simpan nilai asli & tampilkan masked secara default ===
                currentSalaryValue = employee.base_salary;
                if (baseSalaryInput) { // Pastikan elemen ada
                    baseSalaryInput.value = "••••••••••"; // Tampilkan masked secara default
                    baseSalaryInput.dataset.masked = "true"; // Tandai bahwa sedang masked
                    salaryEyeIcon.setAttribute("data-feather", "eye"); // Pastikan ikon awal adalah 'eye'
                    feather.replace(); // Muat ulang ikon untuk memastikan 'eye' terlihat
                }
                // =================================================================================

                addressTextarea.value = employee.address || "";

                // Simpan data profil awal yang dimuat
                initialProfileData = {
                    email: employee.email || "",
                    address: employee.address || ""
                };

                // Perbarui avatar di header jika ada
                const userAvatarHeader = document.getElementById("userAvatar");
                if (userAvatarHeader) {
                    userAvatarHeader.src = employee.photo_url || "https://placehold.co/40x40/E2E8F0/4A5568?text=ME";
                }

                // Muat foto profil utama
                try {
                    const blob = await userService.getProfilePhoto(user.id);
                    const photoUrl = URL.createObjectURL(blob);
                    profilePhotoPreview.src = photoUrl;
                } catch {
                    profilePhotoPreview.src = "https://placehold.co/128x128/E2E8F0/4A5568?text=ME";
                }
            }
        } catch (error) {
            console.error("Error loading profile data:", error);
            showToast(error.message || "Gagal memuat data profil. Silakan coba lagi.", "error");
            if (error.message.includes("Sesi") || error.status === 401 || error.status === 403) {
                setTimeout(() => authService.logout(), 2000);
            }
        }
    };

    // Fungsi helper untuk format mata uang
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Event listener untuk form profil
    if (profileForm) {
        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const userString = localStorage.getItem("user");

            try {
                if (!userString) throw new Error("Sesi tidak valid. Harap login kembali.");

                const user = JSON.parse(userString);
                const photoFile = photoUploadInput.files[0];

                const updatedData = {};

                // Cek perubahan email
                if (emailInput.value.trim() !== initialProfileData.email) {
                    updatedData.email = emailInput.value.trim();
                }

                // Cek perubahan address
                if (addressTextarea.value.trim() !== initialProfileData.address) {
                    updatedData.address = addressTextarea.value.trim();
                }

                if (Object.keys(updatedData).length === 0 && !photoFile) {
                    return showToast("Tidak ada perubahan untuk disimpan.", "info");
                }

                // Panggil updateUser hanya jika ada data yang diupdate (selain foto)
                if (Object.keys(updatedData).length > 0) {
                    await userService.updateUser(user.id, updatedData);
                    const currentUserData = authService.getCurrentUser();
                    if (currentUserData && updatedData.email) {
                        currentUserData.email = updatedData.email;
                        localStorage.setItem('user', JSON.stringify(currentUserData));
                    }
                }

                if (photoFile) {
                    const MAX_FILE_SIZE_MB = 5;
                    if (photoFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                        showToast(`Ukuran file maksimal adalah ${MAX_FILE_SIZE_MB}MB.`, "error");
                        return;
                    }

                    const uploadResponse = await userService.uploadProfilePhoto(user.id, photoFile);
                    const blob = await userService.getProfilePhoto(user.id);
                    profilePhotoPreview.src = URL.createObjectURL(blob);

                    const currentUserData = authService.getCurrentUser();
                    if (currentUserData) {
                        currentUserData.photo_url = uploadResponse.photo_url;
                        localStorage.setItem('user', JSON.stringify(currentUserData));
                    }
                }

                showToast("Profil berhasil diupdate!", "success");
                loadProfileData();
            } catch (error) {
                console.error("Error updating profile:", error);
                showToast(error.message || "Gagal mengupdate profil.", "error");
                if (error.status === 401 || error.status === 403) {
                    setTimeout(() => authService.logout(), 2000);
                }
            }
        });
    }

    // Event listener untuk tombol batal
    if (cancelProfileEditBtn) {
        cancelProfileEditBtn.addEventListener("click", (event) => {
            event.preventDefault();
            profileForm.reset();
            loadProfileData();
            showToast("Perubahan dibatalkan.", "info");
        });
    }

    // === Event listener untuk toggle visibilitas gaji ===
    if (toggleSalaryVisibilityBtn) {
        toggleSalaryVisibilityBtn.addEventListener("click", () => {
            if (baseSalaryInput.dataset.masked === "true") {
                baseSalaryInput.value = formatCurrency(currentSalaryValue); // Tampilkan nilai asli
                baseSalaryInput.dataset.masked = "false";
                salaryEyeIcon.setAttribute("data-feather", "eye-off"); // Ganti ikon menjadi eye-off
            } else {
                baseSalaryInput.value = "••••••••••"; // Sembunyikan nilai
                baseSalaryInput.dataset.masked = "true";
                salaryEyeIcon.setAttribute("data-feather", "eye"); // Ganti ikon menjadi eye
            }
            feather.replace(); // Memuat ulang ikon Feather untuk memastikan ikon baru muncul
        });
    }
    // ==================================================

    // Event listener untuk form ganti password
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const oldPassword = document.getElementById("oldPasswordProfile").value;
            const newPassword = document.getElementById("newPasswordProfile").value;
            const confirmNewPassword = document.getElementById("confirmNewPasswordProfile").value;

            const validationResult = validateChangePasswordForm(oldPassword, newPassword, confirmNewPassword);
            if (!validationResult.isValid) {
                return showToast(validationResult.message, "error");
            }

            try {
                await authService.changePassword(oldPassword, newPassword);
                showToast("Password berhasil diubah!", "success");
                changePasswordForm.reset();
            } catch (error) {
                console.error("Error changing password:", error);
                showToast(error.message || "Gagal mengubah password.", "error");
            }
        });
    }

    // Event listener untuk checkbox tampilkan/sembunyikan password
    if (showPasswordCheckbox) {
        showPasswordCheckbox.addEventListener("change", () => {
            const isChecked = showPasswordCheckbox.checked;
            const fields = [
                document.getElementById("oldPasswordProfile"),
                document.getElementById("newPasswordProfile"),
                document.getElementById("confirmNewPasswordProfile"),
            ];
            fields.forEach(field => {
                if (field) field.type = isChecked ? "text" : "password";
            });
        });
    }

    // Event listener untuk input foto profil (ketika file dipilih)
    if (photoUploadInput) {
        photoUploadInput.addEventListener("change", function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePhotoPreview.src = e.target.result;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Event listeners untuk tombol logout
    logoutButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            authService.logout();
        });
    });

    // Panggil saat halaman dimuat
    loadProfileData();
});