import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { validateChangePasswordForm } from '../Validations/changePasswordValidation.js';
// --- [PERUBAHAN 1] --- Impor fungsi utilitas foto
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js";

document.addEventListener("DOMContentLoaded", () => {
    feather.replace(); // Memuat ikon Feather di awal

    // --- Deklarasi Variabel DOM (Tidak ada perubahan) ---
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
    const baseSalaryInput = document.getElementById("base_salary");
    const toggleSalaryVisibilityBtn = document.getElementById("toggleSalaryVisibility");
    const salaryEyeIcon = document.getElementById("salaryEyeIcon");
    let currentSalaryValue = "";
    // --- Akhir Deklarasi Variabel DOM ---

    let initialProfileData = {};

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
                addressTextarea.value = employee.address || "";
                currentSalaryValue = employee.base_salary;

                if (baseSalaryInput) {
                    baseSalaryInput.value = "••••••••••";
                    baseSalaryInput.dataset.masked = "true";
                    salaryEyeIcon.setAttribute("data-feather", "eye");
                    feather.replace();
                }

                initialProfileData = {
                    email: employee.email || "",
                    address: employee.address || ""
                };

                // --- [PERUBAHAN 2] --- Menggunakan photoUtils untuk memuat semua foto secara konsisten
                const photoUrl = await getUserPhotoBlobUrl(user.id, employee.name);
                
                // Terapkan ke foto profil utama
                if (profilePhotoPreview) {
                    profilePhotoPreview.src = photoUrl;
                }
                
                // Terapkan juga ke avatar di header
                const userAvatarHeader = document.getElementById("userAvatar");
                if (userAvatarHeader) {
                    userAvatarHeader.src = photoUrl;
                }
                // --- Akhir Perubahan 2 ---
            }
        } catch (error) {
            console.error("Error loading profile data:", error);
            showToast(error.message || "Gagal memuat data profil. Silakan coba lagi.", "error");
            if (error.message.includes("Sesi") || error.status === 401 || error.status === 403) {
                setTimeout(() => authService.logout(), 2000);
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (profileForm) {
        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const userString = localStorage.getItem("user");
            try {
                if (!userString) throw new Error("Sesi tidak valid. Harap login kembali.");
                const user = JSON.parse(userString);
                const photoFile = photoUploadInput.files[0];
                const updatedData = {};

                if (emailInput.value.trim() !== initialProfileData.email) {
                    updatedData.email = emailInput.value.trim();
                }

                if (addressTextarea.value.trim() !== initialProfileData.address) {
                    updatedData.address = addressTextarea.value.trim();
                }

                if (Object.keys(updatedData).length === 0 && !photoFile) {
                    return showToast("Tidak ada perubahan untuk disimpan.", "info");
                }

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
                    await userService.uploadProfilePhoto(user.id, photoFile);
                    // --- [PERUBAHAN 3] --- Logika setelah upload disederhanakan.
                    // Tidak perlu lagi mengambil ulang blob atau mengupdate localStorage dengan photo_url.
                    // Fungsi `loadProfileData()` di akhir akan menangani pembaruan UI secara otomatis.
                }

                showToast("Profil berhasil diupdate!", "success");
                await loadProfileData(); // Memuat ulang semua data, termasuk foto yang baru, untuk memastikan konsistensi
            } catch (error) {
                console.error("Error updating profile:", error);
                showToast(error.message || "Gagal mengupdate profil.", "error");
                if (error.status === 401 || error.status === 403) {
                    setTimeout(() => authService.logout(), 2000);
                }
            }
        });
    }

    if (cancelProfileEditBtn) {
        cancelProfileEditBtn.addEventListener("click", (event) => {
            event.preventDefault();
            profileForm.reset();
            loadProfileData(); // Muat ulang data asli
            showToast("Perubahan dibatalkan.", "info");
        });
    }

    if (toggleSalaryVisibilityBtn) {
        toggleSalaryVisibilityBtn.addEventListener("click", () => {
            if (baseSalaryInput.dataset.masked === "true") {
                baseSalaryInput.value = formatCurrency(currentSalaryValue);
                baseSalaryInput.dataset.masked = "false";
                salaryEyeIcon.setAttribute("data-feather", "eye-off");
            } else {
                baseSalaryInput.value = "••••••••••";
                baseSalaryInput.dataset.masked = "true";
                salaryEyeIcon.setAttribute("data-feather", "eye");
            }
            feather.replace();
        });
    }

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

    if (photoUploadInput) {
        photoUploadInput.addEventListener("change", function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePhotoPreview.src = e.target.result;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    logoutButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            authService.logout();
        });
    });

    loadProfileData();
});