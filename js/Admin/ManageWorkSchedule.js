import { Calendar } from "fullcalendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import idLocale from "@fullcalendar/core/locales/id";

import WorkScheduleServices from "../Services/WorkScheduleServices.js";
import { authService } from "../Services/AuthServices.js";

import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { QRCodeManager } from "../components/qrCodeHandler.js";
import Swal from 'sweetalert2';
import Toastify from 'toastify-js';

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace();
    initializeSidebar();
    initializeLogout({
        preLogoutCallback: () => {
            if (typeof QRCodeManager !== 'undefined' && QRCodeManager.close) {
                QRCodeManager.close();
            }
        }
    });

    QRCodeManager.initialize({
        toastCallback: (message, type) => {
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
                style: { background: backgroundColor, borderRadius: "8px" },
            }).showToast();
        },
    });

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

    const recurrenceFreqInput = document.getElementById("recurrence-freq");
    const weeklyOptionsDiv = document.getElementById("weekly-options");
    const weekdayCheckboxes = document.querySelectorAll(".weekday-checkbox");
    const recurrenceUntilInput = document.getElementById("recurrence-until");

    const userAvatarNav = document.getElementById('userAvatar');
    const userDropdownContainer = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');

    let calendar; // Deklarasi variabel calendar

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

    recurrenceFreqInput.addEventListener("change", () => {
        if (recurrenceFreqInput.value === "WEEKLY") {
            weeklyOptionsDiv.classList.remove("hidden");
        } else {
            weeklyOptionsDiv.classList.add("hidden");
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
                return ""; // Mengembalikan string kosong jika tidak ada hari yang dipilih
            }
            rule += `;BYDAY=${selectedDays.join(",")}`;
        }
        if (recurrenceUntilInput.value) {
            // Format tanggal UNTIL untuk RRule (YYYYMMDDTHHMMSSZ)
            // Asumsi input date adalah YYYY-MM-DD
            const untilDate = new Date(recurrenceUntilInput.value);
            // FullCalendar dan RRule biasanya mengharapkan UTC untuk UNTIL
            // Untuk memastikan ini bekerja dengan baik, kita bisa mengatur waktu ke akhir hari di UTC
            untilDate.setUTCHours(23, 59, 59, 999); 
            const untilFormatted = untilDate.toISOString().replace(/[:-]|\.\d{3}Z$/g, ""); // Remove separators and milliseconds
            rule += `;UNTIL=${untilFormatted}`;
        }
        return rule;
    };
    
    const openScheduleModal = (mode = "create", scheduleRule = null) => {
        scheduleFormModal.classList.remove("hidden");
        setTimeout(() => scheduleFormModal.classList.add("active"), 10); 
        
        deleteScheduleBtn.classList.add("hidden");

        if (mode === "create") {
            formModalTitle.textContent = "Tambah Aturan Jadwal Kerja"; // Perbaiki judul
            workScheduleForm.reset();
            weeklyOptionsDiv.classList.add("hidden");
            scheduleIdInput.value = "";
            scheduleDateInput.value = new Date().toISOString().split('T')[0];
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
                    // Konversi UNTIL dari format RRule ke YYYY-MM-DD
                    until = part.replace('UNTIL=', '').substring(0, 8); // Ambil YYYYMMDD
                    until = `${until.substring(0,4)}-${until.substring(4,6)}-${until.substring(6,8)}`;
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
            recurrenceUntilInput.value = until; // Set value untuk input date
            deleteScheduleBtn.classList.remove("hidden");
        }
    };
    
    const closeScheduleModal = () => {
        scheduleFormModal.classList.remove("active");
        setTimeout(() => {
            scheduleFormModal.classList.add("hidden");
            workScheduleForm.reset();
        }, 300);
    };

    // 💡 SOLUSI UTAMA: Dapatkan elemen kalender setelah DOM siap
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
        editable: true, // Izinkan event bisa di-drag atau diubah ukurannya
        selectable: true, // Izinkan pemilihan rentang tanggal
        displayEventTime: false, // Untuk event titik merah, tidak perlu tampilkan waktu

        // ✅ Tampilkan hanya titik merah kecil
        eventContent: function (info) {
            // Kita bisa menggunakan warna toska untuk titiknya
            const dotColor = info.event.display === 'background' ? '#ff9f89' : '#1aae9f'; // Libur: peach, Jadwal: toska
            return {
                html: `<div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${dotColor}; margin: auto;"></div>`,
            };
        },
        
        // 💡 Perbaiki eventSources agar menggunakan properti event sebagai function
        eventSources: [
            {
                events: async (info, successCallback, failureCallback) => {
                    try {
                        const filters = {
                            start_date: info.startStr.split("T")[0],
                            end_date: info.endStr.split("T")[0],
                        };
                        const response = await WorkScheduleServices.getAllWorkSchedules(filters);
                        
                        // Perhatikan mapping event untuk FullCalendar
                        const events = (response.data || []).map((s) => ({
                            id: s.id, // ID penting untuk edit/hapus
                            title: "", // Kosongkan title agar hanya titik yang ditampilkan
                            start: s.date, // Tanggal start untuk event
                            // Jika ada end_time, mungkin bisa digunakan untuk durasi event di timeGrid views,
                            // tapi karena eventContent hanya menampilkan titik, allDay: true lebih cocok.
                            // Jika Anda ingin menampilkan durasi di timeGrid, set allDay: false dan end: s.date + s.end_time
                            extendedProps: {
                                date: s.date, // Simpan tanggal asli untuk modal
                                start_time: s.start_time,
                                end_time: s.end_time,
                                note: s.note,
                                recurrence_rule: s.recurrence_rule,
                            },
                            allDay: true, // Event ini menandai keberadaan jadwal pada hari itu
                            backgroundColor: '#1aae9f', // Warna toska untuk titik jadwal
                            borderColor: '#1aae9f',
                            display: "block", // Pastikan titik terlihat
                        }));
                        successCallback(events);
                    } catch (error) {
                        console.error("Error fetching work schedules:", error);
                        showSweetAlert("Error Fetching Schedules", `Gagal memuat jadwal kerja: ${error.response?.data?.error || error.message || "Terjadi kesalahan."}`, "error", true);
                        if (error.response?.status === 401 || error.response?.status === 403) {
                            setTimeout(() => authService.logout(), 2000);
                        }
                        failureCallback(error); // Laporkan kegagalan ke FullCalendar
                    }
                },
            },
            {
                events: async (info, successCallback, failureCallback) => {
                    try {
                        const year = info.start.getFullYear();
                        const holidays = await WorkScheduleServices.getHolidays(year);
                        const holidayEvents = (holidays || []).map((holiday) => ({
                            title: holiday.Name,
                            start: holiday.Date,
                            allDay: true,
                            display: "background", // Menampilkan sebagai background
                            color: "#ff9f89", // Warna peach/merah muda untuk libur
                            extendedProps: {
                                isHoliday: true // Tambahkan properti untuk identifikasi
                            }
                        }));
                        successCallback(holidayEvents);
                    } catch (error) {
                        console.error("Error fetching holidays:", error);
                        showSweetAlert("Error Fetching Holidays", `Gagal memuat hari libur: ${error.response?.data?.error || error.message || "Terjadi kesalahan."}`, "error", true);
                        failureCallback(error); // Laporkan kegagalan ke FullCalendar
                    }
                },
            },
        ],
        
        // 💡 Tambahkan eventResize dan eventDrop untuk fungsionalitas editable
        eventResize: async (info) => {
            const { event } = info;
            // Di sini Anda perlu memanggil API untuk memperbarui jadwal
            // Karena Anda hanya menampilkan titik, eventResize mungkin tidak relevan
            // jika jadwal tidak memiliki durasi yang bisa diubah via drag.
            // Jika jadwal Anda hanya berdasarkan tanggal, Anda bisa mengabaikan ini atau
            // menonaktifkan editable: true jika tidak diperlukan.
            console.log("Event Resized:", event.id, event.start, event.end);
            // Contoh: Panggil API update
            // try {
            //     await WorkScheduleServices.updateWorkSchedule(event.id, {
            //         date: moment(event.start).format('YYYY-MM-DD'),
            //         // Anda perlu menentukan bagaimana start_time dan end_time diubah
            //         // Jika hanya tanggal yang diubah, sesuaikan payload
            //     });
            //     showSweetAlert("Berhasil!", "Jadwal berhasil diperbarui!", "success", false, 1500);
            // } catch (error) {
            //     showSweetAlert("Gagal!", "Gagal memperbarui jadwal.", "error", true);
            //     event.revert(); // Kembalikan event ke posisi semula jika gagal
            // }
        },
        eventDrop: async (info) => {
            const { event } = info;
            // Di sini Anda perlu memanggil API untuk memindahkan jadwal
            console.log("Event Dropped:", event.id, event.start);
            try {
                // Perbarui hanya tanggal jika itu yang diubah
                await WorkScheduleServices.updateWorkSchedule(event.id, {
                    date: event.start.toISOString().split("T")[0], // Dapatkan tanggal baru
                    start_time: event.extendedProps.start_time, // Pertahankan waktu asli
                    end_time: event.extendedProps.end_time, // Pertahankan waktu asli
                    note: event.extendedProps.note,
                    recurrence_rule: event.extendedProps.recurrence_rule,
                });
                showSweetAlert("Berhasil!", "Jadwal berhasil dipindahkan!", "success", false, 1500);
            } catch (error) {
                console.error("Error updating work schedule on drag:", error);
                showSweetAlert("Gagal!", `Gagal memindahkan jadwal: ${error.response?.data?.error || error.message || "Terjadi kesalahan."}`, "error", true);
                info.revert(); // Kembalikan event ke posisi semula jika gagal
            }
        },

        select: (info) => {
            openScheduleModal("create");
            scheduleDateInput.value = info.startStr.split("T")[0];
            calendar.unselect();
        },

        eventClick: async (info) => {
            const scheduleRuleId = info.event.id;

            if (info.event.extendedProps.isHoliday) { // Cek apakah ini event hari libur
                showSweetAlert("Info Hari Libur", `Hari libur: ${info.event.title}`, "info");
                return;
            }

            try {
                // Jika event berasal dari data jadwal kerja
                const response = await WorkScheduleServices.getWorkScheduleById(scheduleRuleId);
                const scheduleRule = response.data;

                if (scheduleRule) {
                    openScheduleModal("edit", scheduleRule);
                } else {
                    showSweetAlert("Data Tidak Ditemukan", "Detail jadwal tidak ditemukan.", "error");
                }
            } catch (error) {
                console.error("Error fetching schedule for edit:", error);
                showSweetAlert("Gagal Memuat Jadwal", `Gagal memuat detail jadwal untuk diedit: ${error.response?.data?.error || error.message || "Terjadi kesalahan."}`, "error", true);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    setTimeout(() => authService.logout(), 2000);
                }
            }
        },
    });

    // 💡 PENTING: Panggil calendar.render() setelah inisialisasi
    calendar.render();

    // Pastikan `loadUserProfile()` dipanggil di awal
    loadUserProfile();

    manualAddScheduleBtn.addEventListener("click", () => openScheduleModal("create"));
    closeScheduleModalBtn.addEventListener("click", closeScheduleModal);
    cancelScheduleBtn.addEventListener("click", closeScheduleModal);

    const generateQrMenuBtn = document.getElementById("generate-qr-menu-btn");
    const generateQrMenuBtnMobile = document.getElementById("generate-qr-menu-btn-mobile");

    if (generateQrMenuBtn) {
        generateQrMenuBtn.addEventListener("click", () => QRCodeManager.open());
    }
    if (generateQrMenuBtnMobile) {
        generateQrMenuBtnMobile.addEventListener("click", () => {
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

    if (userDropdownContainer) {
        userDropdownContainer.addEventListener("click", (event) => {
            event.stopPropagation(); 
            dropdownMenu.classList.toggle("active");
        });

        document.addEventListener("click", (event) => {
            if (!userDropdownContainer.contains(event.target)) {
                dropdownMenu.classList.remove("active");
            }
        });
    }

    workScheduleForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        saveScheduleBtn.disabled = true;

        const scheduleId = scheduleIdInput.value;
        const recurrenceRule = generateRecurrenceRule(); 
        
        // Perbaiki validasi untuk recurrenceRule jika WEEKLY
        if (recurrenceFreqInput.value === "WEEKLY" && recurrenceRule === "") {
            saveScheduleBtn.disabled = false;
            return; // Hentikan proses submit jika validasi gagal
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
                await WorkScheduleServices.updateWorkSchedule(scheduleId, payload);
                showSweetAlert("Berhasil!", "Aturan jadwal kerja berhasil diperbarui!", "success", false, 1500);
            } else {
                await WorkScheduleServices.createWorkSchedule(payload);
                showSweetAlert("Berhasil!", "Aturan jadwal kerja berhasil disimpan!", "success", false, 1500);
            }
            closeScheduleModal();
            calendar.refetchEvents(); // Perbarui event di kalender
        } catch (error) {
            console.error("Error saving/updating work schedule:", error);
            const errorMessage = error.response?.data?.error || error.message || "Terjadi kesalahan saat menyimpan/memperbarui jadwal.";
            showSweetAlert("Gagal!", errorMessage, "error", true);
            if (error.response?.status === 401 || error.response?.status === 403) {
                setTimeout(() => authService.logout(), 2000);
            }
        } finally {
            saveScheduleBtn.disabled = false;
        }
    });

    deleteScheduleBtn.addEventListener("click", async () => {
        const scheduleId = scheduleIdInput.value;
        if (!scheduleId) return;

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
                    calendar.refetchEvents(); // Perbarui event di kalender
                } catch (error) {
                    console.error("Error deleting work schedule:", error);
                    const errorMessage = error.response?.data?.error || error.message || "Terjadi kesalahan saat menghapus jadwal.";
                    showSweetAlert("Gagal!", errorMessage, "error", true);
                    if (error.response?.status === 401 || error.response?.status === 403) {
                        setTimeout(() => authService.logout(), 2000);
                    }
                } finally {
                    deleteScheduleBtn.disabled = false;
                }
            }
        });
    });
});