// js/Admin/AdminProfile.js

import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { getUserPhotoBlobUrl } from '../utils/photoUtils.js'; // Import fungsi photoUtils

document.addEventListener("DOMContentLoaded", () => {
    feather.replace(); // Memuat ikon Feather di awal

    const profilePhotoPreview = document.getElementById("adminProfilePhotoPreview");
    const photoUploadInput = document.getElementById("adminPhotoUpload");
    const nameInput = document.getElementById("adminName");
    const emailInput = document.getElementById("adminEmail");
    const positionInput = document.getElementById("adminPosition");
    const departmentInput = document.getElementById("adminDepartment");
    const addressTextarea = document.getElementById("adminAddress");
    const profileForm = document.getElementById("adminProfileForm");
    const cancelProfileEditBtn = document.getElementById("adminCancelProfileEditBtn");

    // Variabel untuk fitur gaji yang dapat di-toggle
    const baseSalaryInput = document.getElementById("adminBaseSalary");
    const toggleSalaryVisibilityBtn = document.getElementById("adminToggleSalaryVisibility");
    const salaryEyeIcon = document.getElementById("adminSalaryEyeIcon");
    let currentSalaryValue = ""; // Untuk menyimpan nilai gaji sebenarnya

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
            // Periksa role untuk memastikan yang login adalah admin
            if (user.role !== 'admin') {
                showToast("Akses ditolak. Halaman ini hanya untuk Admin.", "error");
                setTimeout(() => authService.logout(), 1500); // Logout jika bukan admin
                return;
            }

            const adminData = await userService.getUserByID(user.id);

            if (adminData) {
                nameInput.value = adminData.name || "";
                emailInput.value = adminData.email || "";
                positionInput.value = adminData.position || "";
                departmentInput.value = adminData.department || "";
                addressTextarea.value = adminData.address || "";

                // Penyesuaian untuk Gaji: Simpan nilai asli & tampilkan masked secara default
                currentSalaryValue = adminData.base_salary;
                if (baseSalaryInput) {
                    baseSalaryInput.value = "••••••••••"; // Tampilkan masked secara default
                    baseSalaryInput.dataset.masked = "true"; // Tandai bahwa sedang masked
                    salaryEyeIcon.setAttribute("data-feather", "eye"); // Pastikan ikon awal adalah 'eye'
                    feather.replace(); // Muat ulang ikon untuk memastikan 'eye' terlihat
                }

                // Simpan data profil awal yang dimuat
                initialProfileData = {
                    name: adminData.name || "",
                    email: adminData.email || "",
                    position: adminData.position || "",
                    department: adminData.department || "",
                    base_salary: adminData.base_salary || 0,
                    address: adminData.address || ""
                };

                // Perbarui avatar di header jika ada
                const userAvatarHeader = document.getElementById("userAvatar");
                if (userAvatarHeader) {
                    // Gunakan getUserPhotoBlobUrl untuk avatar header juga
                    userAvatarHeader.src = await getUserPhotoBlobUrl(user.id, adminData.name, 40); // Ukuran 40x40 untuk header
                }

                // Muat foto profil utama menggunakan getUserPhotoBlobUrl
                profilePhotoPreview.src = await getUserPhotoBlobUrl(user.id, adminData.name, 128); // Ukuran 128x128 untuk profil utama
            }
        } catch (error) {
            console.error("Error loading admin profile data:", error);
            showToast(error.message || "Gagal memuat data profil admin. Silakan coba lagi.", "error");
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
                // Pastikan yang update adalah admin
                if (user.role !== 'admin') {
                    showToast("Akses ditolak. Anda tidak diizinkan mengubah data ini.", "error");
                    return;
                }

                const photoFile = photoUploadInput.files[0];
                const updatedData = {};

                // Cek perubahan nama
                if (nameInput.value.trim() !== initialProfileData.name) {
                    updatedData.name = nameInput.value.trim();
                }

                // Cek perubahan email
                if (emailInput.value.trim() !== initialProfileData.email) {
                    updatedData.email = emailInput.value.trim();
                }

                // Cek perubahan posisi
                if (positionInput.value.trim() !== initialProfileData.position) {
                    updatedData.position = positionInput.value.trim();
                }

                // Cek perubahan departemen
                if (departmentInput.value.trim() !== initialProfileData.department) {
                    updatedData.department = departmentInput.value.trim();
                }

                // Cek perubahan gaji pokok
                const newBaseSalary = parseFloat(baseSalaryInput.value.replace(/[^0-9,-]+/g,"").replace(",",".")); // Hapus format mata uang
                if (newBaseSalary !== initialProfileData.base_salary && !isNaN(newBaseSalary)) {
                    updatedData.base_salary = newBaseSalary;
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
                    // Perbarui data di localStorage jika ada perubahan email atau nama (opsional)
                    const currentUserData = authService.getCurrentUser();
                    if (currentUserData) {
                        if (updatedData.email) currentUserData.email = updatedData.email;
                        if (updatedData.name) currentUserData.name = updatedData.name;
                        localStorage.setItem('user', JSON.stringify(currentUserData));
                    }
                }

                if (photoFile) {
                    const MAX_FILE_SIZE_MB = 5;
                    if (photoFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                        showToast(`Ukuran file maksimal adalah ${MAX_FILE_SIZE_MB}MB.`, "error");
                        return;
                    }

                    // Unggah foto
                    await userService.uploadProfilePhoto(user.id, photoFile);
                    
                    // Setelah sukses upload, muat ulang foto profil menggunakan getUserPhotoBlobUrl
                    profilePhotoPreview.src = await getUserPhotoBlobUrl(user.id, initialProfileData.name, 128);

                    // Perbarui juga foto di header jika user avatar adalah yang diupdate
                    const userAvatarHeader = document.getElementById("userAvatar");
                    if (userAvatarHeader) {
                        userAvatarHeader.src = await getUserPhotoBlobUrl(user.id, initialProfileData.name, 40);
                    }
                }

                showToast("Profil admin berhasil diupdate!", "success");
                loadProfileData(); // Muat ulang data setelah update
            } catch (error) {
                console.error("Error updating admin profile:", error);
                const errorMessage = error.response && error.response.data && error.response.data.error
                                     ? error.response.data.error
                                     : error.message || "Gagal mengupdate profil admin.";
                showToast(errorMessage, "error");
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
            loadProfileData(); // Muat ulang data awal
            showToast("Perubahan dibatalkan.", "info");
        });
    }

    // Event listener untuk toggle visibilitas gaji
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
    document.querySelectorAll("#logoutButton, #dropdownLogoutButton, #mobileLogoutButton").forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            authService.logout();
        });
    });

    // Panggil saat halaman dimuat
    loadProfileData();
});