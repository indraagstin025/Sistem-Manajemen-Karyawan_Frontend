// js/Admin/ManageWorkSchedule.js

import { Calendar } from "fullcalendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import idLocale from "@fullcalendar/core/locales/id";

// Impor service yang sudah kita sesuaikan
import WorkScheduleServices from "../Services/WorkScheduleServices.js";
import { authService } from "../Services/AuthServices.js"; // Diperlukan untuk loadUserProfile

// Import komponen modular untuk sidebar, logout, dan QR Code
import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { QRCodeManager } from "../components/qrCodeHandler.js"; // Import QRCodeManager
import Swal from 'sweetalert2'; // Import SweetAlert2
import Toastify from 'toastify-js'; // Import Toastify jika masih ingin menggunakannya untuk notifikasi spesifik

document.addEventListener("DOMContentLoaded", async () => { // Gunakan async karena ada await di loadUserProfile
    // --- Inisialisasi Komponen Global ---
    feather.replace(); // Memastikan ikon dirender di seluruh halaman
    initializeSidebar(); // Menginisialisasi fungsionalitas sidebar mobile
    initializeLogout({ // Menginisialisasi semua tombol logout
        preLogoutCallback: () => {
            // Callback opsional untuk menutup modal QR sebelum logout
            if (typeof QRCodeManager !== 'undefined' && QRCodeManager.close) {
                QRCodeManager.close();
            }
        }
    });

    // Menginisialisasi QRCodeManager
    QRCodeManager.initialize({
        toastCallback: (message, type) => {
            // Fungsi callback untuk menampilkan notifikasi dari QRCodeManager menggunakan Toastify
            let backgroundColor;
            if (type === "success") {
                backgroundColor = "linear-gradient(to right, #22c55e, #16a34a)";
            } else if (type === "error") {
                backgroundColor = "linear-gradient(to right, #ef4444, #dc2626)";
            } else { // info
                backgroundColor = "linear-gradient(to right, #3b82f6, #2563eb)";
            }
        
            Toastify({
                text: message,
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right", // Posisi notifikasi Toastify
                style: { background: backgroundColor, borderRadius: "8px" },
            }).showToast();
        },
    });

    // --- Pengambilan Elemen DOM ---
    const scheduleFormModal = document.getElementById("scheduleFormModal");
    const closeScheduleModalBtn = document.getElementById("closeScheduleModalBtn");
    const workScheduleForm = document.getElementById("workScheduleForm");
    const formModalTitle = document.getElementById("form-modal-title");
    const scheduleIdInput = document.getElementById("schedule-id");
    const scheduleDateInput = document.getElementById("schedule-date");
    const startTimeInput = document.getElementById("start-time");
    const endTimeInput = document.getElementById("end-time");
    const noteInput = document.getElementById("note");
    const saveScheduleBtn = document.getElementById("save-schedule-btn");
    const cancelScheduleBtn = document.getElementById("cancel-schedule-btn");
    const deleteScheduleBtn = document.getElementById("delete-schedule-btn");
    const manualAddScheduleBtn = document.getElementById("manualAddScheduleBtn");

    // Elemen baru untuk form perulangan
    const recurrenceFreqInput = document.getElementById("recurrence-freq");
    const weeklyOptionsDiv = document.getElementById("weekly-options");
    const weekdayCheckboxes = document.querySelectorAll(".weekday-checkbox");
    const recurrenceUntilInput = document.getElementById("recurrence-until");

    // Elemen untuk Dropdown Pengguna di header
    const userAvatarNav = document.getElementById('userAvatar'); // Pastikan ada ID ini
    const userDropdownContainer = document.getElementById('userDropdown'); // Container utama dropdown
    const dropdownMenu = document.getElementById('dropdownMenu'); // Elemen menu dropdown

    let calendar;
    // currentEvent tidak lagi dibutuhkan secara langsung karena kita akan fetch detail rule.

    // --- Fungsi Notifikasi (SweetAlert2 untuk pesan penting) ---
    const showSweetAlert = (title, message, icon = "success", showConfirmButton = false, timer = 2000) => {
        Swal.fire({
            title: title,
            html: message, 
            icon: icon,
            showConfirmButton: showConfirmButton,
            timer: timer,
            timerProgressBar: true,
            didOpen: (toast) => {
                if (timer > 0) {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            }
        });
    };

    // Fungsi untuk memuat foto profil admin di header
    const loadUserProfile = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user && user.photo_url && userAvatarNav) {
                userAvatarNav.src = user.photo_url;
            } else if (userAvatarNav) {
                userAvatarNav.src = "/assets/default-avatar.png"; 
            }
        } catch (error) {
            console.error("Gagal memuat profil pengguna:", error);
            if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
        }
    };

    // --- Logika untuk Opsi Perulangan ---
    recurrenceFreqInput.addEventListener("change", () => {
        if (recurrenceFreqInput.value === "WEEKLY") {
            weeklyOptionsDiv.classList.remove("hidden");
        } else {
            weeklyOptionsDiv.classList.add("hidden");
            // Uncheck semua checkbox hari saat beralih dari WEEKLY
            weekdayCheckboxes.forEach(cb => cb.checked = false);
        }
    });

    const generateRecurrenceRule = () => {
        const freq = recurrenceFreqInput.value;
        if (freq === "NONE") return "";

        let rule = `FREQ=${freq}`;
        if (freq === "WEEKLY") {
            const selectedDays = Array.from(weekdayCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            if (selectedDays.length === 0) {
                showSweetAlert("Validasi Gagal", "Pilih minimal satu hari untuk jadwal mingguan.", "warning");
                return ""; // Mengembalikan string kosong untuk menghentikan proses
            }
            rule += `;BYDAY=${selectedDays.join(",")}`;
        }
        if (recurrenceUntilInput.value) {
            const untilDate = recurrenceUntilInput.value.replace(/-/g, "");
            rule += `;UNTIL=${untilDate}T235959Z`;
        }
        return rule;
    };
    
    // --- Fungsi Modal Jadwal Kerja ---
    const openScheduleModal = (mode = "create", scheduleRule = null) => { // Mengubah event menjadi scheduleRule untuk kejelasan
        scheduleFormModal.classList.remove("hidden");
        // Memberi sedikit waktu agar transisi CSS bekerja dengan baik
        setTimeout(() => scheduleFormModal.classList.add("active"), 10); 
        
        deleteScheduleBtn.classList.add("hidden"); // Sembunyikan tombol delete secara default

        if (mode === "create") {
            formModalTitle.textContent = "Tambah Jadwal Kerja";
            workScheduleForm.reset();
            weeklyOptionsDiv.classList.add("hidden"); // Sembunyikan opsi mingguan
            scheduleIdInput.value = "";
            scheduleDateInput.value = new Date().toISOString().split('T')[0]; // Set default date to today
            startTimeInput.value = "09:00";
            endTimeInput.value = "17:00";
            weekdayCheckboxes.forEach(cb => cb.checked = false);
            recurrenceFreqInput.value = "NONE";
            recurrenceUntilInput.value = "";
        } else if (mode === "edit" && scheduleRule) {
            formModalTitle.textContent = "Edit Aturan Jadwal Kerja";
            scheduleIdInput.value = scheduleRule.id;
            scheduleDateInput.value = scheduleRule.date;
            startTimeInput.value = scheduleRule.start_time.substring(0, 5);
            endTimeInput.value = scheduleRule.end_time.substring(0, 5);
            noteInput.value = scheduleRule.note || '';

            // Isi ulang bagian perulangan berdasarkan recurrence_rule
            const ruleParts = scheduleRule.recurrence_rule ? scheduleRule.recurrence_rule.split(';') : [];
            let freq = 'NONE';
            let byDay = [];
            let until = '';

            ruleParts.forEach(part => {
                if (part.startsWith('FREQ=')) {
                    freq = part.replace('FREQ=', '');
                } else if (part.startsWith('BYDAY=')) {
                    byDay = part.replace('BYDAY=', '').split(',');
                } else if (part.startsWith('UNTIL=')) {
                    until = part.replace('UNTIL=', '').substring(0, 8); // YYYYMMDD
                }
            });

            recurrenceFreqInput.value = freq;
            if (freq === 'WEEKLY') {
                weeklyOptionsDiv.classList.remove('hidden');
                weekdayCheckboxes.forEach(cb => {
                    cb.checked = byDay.includes(cb.value);
                });
            } else {
                weeklyOptionsDiv.classList.add('hidden');
                weekdayCheckboxes.forEach(cb => cb.checked = false);
            }
            recurrenceUntilInput.value = until ? `${until.substring(0,4)}-${until.substring(4,6)}-${until.substring(6,8)}` : '';

            deleteScheduleBtn.classList.remove("hidden"); // Tampilkan tombol delete untuk mode edit
        }
    };
    
    const closeScheduleModal = () => {
        scheduleFormModal.classList.remove("active");
        setTimeout(() => {
            scheduleFormModal.classList.add("hidden");
            workScheduleForm.reset();
            // currentEvent = null; // Tidak perlu reset currentEvent jika tidak lagi di-cache
        }, 300); // Sesuaikan dengan durasi transisi CSS
    };

    // --- Inisialisasi Kalender dengan eventSources ---
    const calendarEl = document.getElementById("calendar");
    calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: "dayGridMonth",
        locale: idLocale,
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
        },
        editable: true,
        selectable: true,
        displayEventTime: false,
        eventSources: [
            // Sumber 1: Jadwal Kerja dari Backend
            {
                events: async (info) => {
                    try {
                        const filters = {
                            start_date: info.startStr.split("T")[0],
                            end_date: info.endStr.split("T")[0],
                        };
                        const response = await WorkScheduleServices.getAllWorkSchedules(filters);
                        
                        return (response.data || []).map(s => ({
                            id: s.id, // Ini adalah ID dari aturan jadwal
                            title: `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`, // Format HH:mm
                            start: s.date, // Tanggal saja karena time sudah di title
                            extendedProps: { 
                                start_time: s.start_time,
                                end_time: s.end_time,
                                note: s.note,
                                recurrence_rule: s.recurrence_rule, 
                            },
                            allDay: true, // Untuk tampil di dayGridMonth/Week
                            color: '#38b2ac', // Warna jadwal kerja
                            textColor: 'white',
                            display: 'block', 
                        }));
                    } catch (error) {
                        console.error("Error fetching work schedules:", error);
                        // Tampilkan SweetAlert untuk error fetching schedules
                        showSweetAlert('Error Fetching Schedules', `Gagal memuat jadwal kerja: ${error.message || "Terjadi kesalahan."}`, 'error', true);
                        if (error.status === 401 || error.status === 403) {
                            // Cek jika error autentikasi, langsung logout
                            setTimeout(() => authService.logout(), 2000);
                        }
                        return [];
                    }
                },
                color: '#38b2ac', // Warna jadwal kerja default
                textColor: 'white',
            },

            // Sumber 2: Hari Libur Nasional dari Backend
            {
                events: async (info) => {
                    try {
                        const year = info.start.getFullYear();
                        const holidays = await WorkScheduleServices.getHolidays(year);
                        return (holidays || []).map(holiday => ({
                            title: holiday.Name, 
                            start: holiday.Date, 
                            allDay: true,
                            display: 'background', // Tampilkan sebagai background event
                            color: '#ff9f89', // Warna untuk hari libur (background)
                        }));
                    } catch (error) {
                        console.error("Error fetching holidays:", error);
                        // Tampilkan SweetAlert untuk error fetching holidays
                        showSweetAlert('Error Fetching Holidays', `Gagal memuat hari libur: ${error.message || "Terjadi kesalahan."}`, 'error', true);
                        return [];
                    }
                }
            }
        ],

        select: (info) => {
            // Ketika user memilih rentang tanggal di kalender
            openScheduleModal("create");
            scheduleDateInput.value = info.startStr.split("T")[0]; // Ambil hanya tanggal
            calendar.unselect(); // Batalkan seleksi di kalender
        },
        eventClick: async (info) => {
            // Ketika event jadwal kerja diklik
            // Ambil ID aturan dari event FullCalendar
            const scheduleRuleId = info.event.id;

            if (info.event.display === 'background') { // Jangan buka modal untuk hari libur (background events)
                showSweetAlert('Info Hari Libur', `Hari libur: ${info.event.title}`, 'info');
                return;
            }

            try {
                // Panggil service untuk mendapatkan detail aturan jadwal dari backend
                const response = await WorkScheduleServices.getWorkScheduleById(scheduleRuleId);
                const scheduleRule = response.data; // Ini harus detail aturan dari backend

                if (scheduleRule) {
                    openScheduleModal("edit", scheduleRule); // Buka modal dengan mode edit dan data aturan
                } else {
                    showSweetAlert("Data Tidak Ditemukan", "Detail jadwal tidak ditemukan.", "error");
                }

            } catch (error) {
                console.error("Error fetching schedule for edit:", error);
                showSweetAlert("Gagal Memuat Jadwal", `Gagal memuat detail jadwal untuk diedit: ${error.message || "Terjadi kesalahan."}`, "error", true);
                if (error.status === 401 || error.status === 403) {
                    setTimeout(() => authService.logout(), 2000);
                }
            }
        },
    });

    calendar.render();

    // --- Event Listeners ---
    manualAddScheduleBtn.addEventListener("click", () => openScheduleModal("create"));
    closeScheduleModalBtn.addEventListener("click", closeScheduleModal);
    cancelScheduleBtn.addEventListener("click", closeScheduleModal);

    // Event Listener untuk tombol Generate QR Code (Desktop & Mobile)
    const generateQrMenuBtn = document.getElementById("generate-qr-menu-btn");
    const generateQrMenuBtnMobile = document.getElementById("generate-qr-menu-btn-mobile");

    if (generateQrMenuBtn) {
        generateQrMenuBtn.addEventListener("click", () => QRCodeManager.open());
    }
    if (generateQrMenuBtnMobile) {
        generateQrMenuBtnMobile.addEventListener("click", () => {
            // Tutup sidebar mobile sebelum membuka modal QR
            const mobileSidebar = document.getElementById("mobileSidebar");
            const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
            if (mobileSidebar && mobileSidebarPanel) {
                mobileSidebar.classList.remove("opacity-100");
                mobileSidebarPanel.classList.add("-translate-x-full");
                setTimeout(() => {
                    mobileSidebar.classList.add("hidden");
                }, 300);
            }
            QRCodeManager.open();
        });
    }

    // Event Listener untuk tombol di QR Code Modal (dikelola oleh QRCodeManager)
    // ID tombol closeModalBtn, modalGenerateQrBtn, modalCloseQrBtn otomatis dikelola oleh QRCodeManager
    // kita hanya perlu memastikan ID tersebut ada di HTML

    // Event Listener untuk Dropdown Pengguna di Header
    if (userDropdownContainer) {
        userDropdownContainer.addEventListener("click", (event) => {
            // Hentikan propagasi event untuk mencegah document.click menutupnya
            event.stopPropagation(); 
            dropdownMenu.classList.toggle("active");
        });

        // Tutup dropdown saat klik di luar area dropdown
        document.addEventListener("click", (event) => {
            if (!userDropdownContainer.contains(event.target)) {
                dropdownMenu.classList.remove("active");
            }
        });
    }

    // --- Submit Form Jadwal Kerja ---
    workScheduleForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        saveScheduleBtn.disabled = true;

        const scheduleId = scheduleIdInput.value;
        const recurrenceRule = generateRecurrenceRule(); 
        
        // Penting: Pastikan generateRecurrenceRule tidak mengembalikan string kosong jika WEEKLY dan tidak ada hari dipilih
        // generateRecurrenceRule sudah menampilkan SweetAlert, jadi kita hanya perlu cek hasilnya
        if (recurrenceFreqInput.value === "WEEKLY" && !recurrenceRule) {
             saveScheduleBtn.disabled = false;
             return; 
        }


        const payload = {
            date: scheduleDateInput.value,
            start_time: startTimeInput.value,
            end_time: endTimeInput.value,
            note: noteInput.value,
            recurrence_rule: recurrenceRule, 
        };

        try {
            if (scheduleId) {
                // Update jadwal
                await WorkScheduleServices.updateWorkSchedule(scheduleId, payload);
                showSweetAlert("Berhasil!", "Aturan jadwal kerja berhasil diperbarui!", "success", false, 1500);
            } else {
                // Buat jadwal baru
                await WorkScheduleServices.createWorkSchedule(payload);
                showSweetAlert("Berhasil!", "Aturan jadwal kerja berhasil disimpan!", "success", false, 1500);
            }
            closeScheduleModal();
            calendar.refetchEvents(); // Muat ulang semua event di kalender
        } catch (error) {
            console.error("Error saving/updating work schedule:", error);
            const errorMessage = error.response?.data?.error || error.message || "Terjadi kesalahan saat menyimpan/memperbarui jadwal.";
            showSweetAlert("Gagal!", errorMessage, "error", true);
            if (error.status === 401 || error.status === 403) {
                setTimeout(() => authService.logout(), 2000);
            }
        } finally {
            saveScheduleBtn.disabled = false;
        }
    });

    // --- Delete Jadwal Kerja ---
    deleteScheduleBtn.addEventListener("click", async () => {
        const scheduleId = scheduleIdInput.value;
        if (!scheduleId) return; // Pastikan ada ID

        Swal.fire({
            title: "Anda yakin ingin menghapus?",
            text: "Aturan jadwal ini akan dihapus secara permanen, termasuk semua kejadian di masa mendatang.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, Hapus!",
            cancelButtonText: "Batal"
        }).then(async (result) => {
            if (result.isConfirmed) {
                deleteScheduleBtn.disabled = true;
                try {
                    await WorkScheduleServices.deleteWorkSchedule(scheduleId);
                    showSweetAlert("Terhapus!", "Aturan jadwal kerja berhasil dihapus!", "success", false, 1500);
                    closeScheduleModal();
                    calendar.refetchEvents(); // Muat ulang event di kalender
                } catch (error) {
                    console.error("Error deleting work schedule:", error);
                    const errorMessage = error.response?.data?.error || error.message || "Terjadi kesalahan saat menghapus jadwal.";
                    showSweetAlert("Gagal!", errorMessage, "error", true);
                    if (error.status === 401 || error.status === 403) {
                        setTimeout(() => authService.logout(), 2000);
                    }
                } finally {
                    deleteScheduleBtn.disabled = false;
                }
            }
        });
    });

    // --- Inisialisasi Halaman ---
    loadUserProfile(); // Muat foto profil pengguna di header
});