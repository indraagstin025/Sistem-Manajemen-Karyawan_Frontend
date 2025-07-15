// js/Admin/ManageWorkSchedule.js

import { Calendar } from "fullcalendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import idLocale from "@fullcalendar/core/locales/id";

// Impor service yang sudah kita sesuaikan
import WorkScheduleServices from "../Services/WorkScheduleServices.js";

// Import fungsi initializeSidebar dari sidebarHandler.js
import { initializeSidebar } from "../components/sidebarHandler.js";
// Import fungsi initializeLogout dari logoutHandler.js
import { initializeLogout } from "../components/logoutHandler.js";

document.addEventListener("DOMContentLoaded", () => {
    // --- Inisialisasi Sidebar dan Logout ---
    initializeSidebar();
    initializeLogout(); // Panggil fungsi untuk menginisialisasi semua tombol logout
    feather.replace(); // Memastikan ikon dirender, bisa dipanggil di sini atau di sidebarHandler

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

    // Elemen untuk QR Code Modal (jika ada di halaman ini)
    const generateQrMenuBtn = document.getElementById("generate-qr-menu-btn");
    const generateQrMenuBtnMobile = document.getElementById("generate-qr-menu-btn-mobile");
    const qrCodeModal = document.getElementById("qrCodeModal"); // Asumsikan modal QR ada
    const closeModalBtn = document.getElementById("closeModalBtn"); // Tombol tutup modal QR
    const modalGenerateQrBtn = document.getElementById("modal-generate-qr-btn"); // Tombol refresh QR
    const modalCloseQrBtn = document.getElementById("modal-close-qr-btn"); // Tombol tutup QR di modal
    const modalQrCodeImage = document.getElementById("modal-qr-code-image");
    const modalQrPlaceholder = document.getElementById("modal-qr-placeholder");
    const modalQrExpiresAt = document.getElementById("modal-qr-expires-at");

    // Elemen untuk Dropdown Pengguna
    const userDropdown = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const userAvatar = document.getElementById('userAvatar');
    // const dropdownLogoutButton = document.getElementById('dropdownLogoutButton'); // Tidak perlu lagi diambil di sini
    // const logoutButton = document.getElementById('logoutButton'); // Tidak perlu lagi diambil di sini
    // const logoutButtonMobile = document.getElementById('mobileLogoutButton'); // Tidak perlu lagi diambil di sini

    let calendar;
    let currentEvent = null;
    let qrCodeInterval; // Untuk menyimpan ID interval QR Code

    // --- Logika untuk Opsi Perulangan ---
    recurrenceFreqInput.addEventListener("change", () => {
        if (recurrenceFreqInput.value === "WEEKLY") {
            weeklyOptionsDiv.classList.remove("hidden");
        } else {
            weeklyOptionsDiv.classList.add("hidden");
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
                alert("Pilih minimal satu hari untuk jadwal mingguan.");
                return "";
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
    const openScheduleModal = (mode = "create", event = null) => {
        scheduleFormModal.classList.remove("hidden");
        scheduleFormModal.classList.add("active");
        deleteScheduleBtn.classList.add("hidden");

        if (mode === "create") {
            formModalTitle.textContent = "Tambah Jadwal Kerja";
            workScheduleForm.reset();
            weeklyOptionsDiv.classList.add("hidden"); // Sembunyikan opsi mingguan
            scheduleIdInput.value = "";
            scheduleDateInput.value = new Date().toISOString().split('T')[0]; // Set default date to today
            startTimeInput.value = "09:00";
            endTimeInput.value = "17:00";
            // Uncheck all weekday checkboxes for new schedule
            weekdayCheckboxes.forEach(cb => cb.checked = false);
            recurrenceFreqInput.value = "NONE";
            recurrenceUntilInput.value = "";
        } else if (mode === "edit" && event) {
            formModalTitle.textContent = "Edit Jadwal Kerja";
            scheduleIdInput.value = event.id;
            scheduleDateInput.value = event.startStr ? event.startStr.split('T')[0] : '';
            startTimeInput.value = event.startStr ? event.startStr.split('T')[1].substring(0, 5) : '';
            endTimeInput.value = event.endStr ? event.endStr.split('T')[1].substring(0, 5) : '';
            noteInput.value = event.extendedProps.note || '';

            // Handle recurrence for editing (assuming we only edit single occurrences for now)
            recurrenceFreqInput.value = "NONE";
            weeklyOptionsDiv.classList.add("hidden");
            weekdayCheckboxes.forEach(cb => cb.checked = false);
            recurrenceUntilInput.value = "";

            currentEvent = event;
            deleteScheduleBtn.classList.remove("hidden");
        }
    };
    
    const closeScheduleModal = () => {
        scheduleFormModal.classList.remove("active");
        // Beri sedikit waktu untuk transisi sebelum menyembunyikan sepenuhnya
        setTimeout(() => {
            scheduleFormModal.classList.add("hidden");
            workScheduleForm.reset();
            currentEvent = null;
        }, 300); // Sesuaikan dengan durasi transisi CSS
    };

    // --- Fungsi Modal QR Code (Disalin dari Dashboard.js) ---
    const qrCodeModalOverlay = document.getElementById("qrCodeModal");
    const qrCodeImage = document.getElementById("modal-qr-code-image");
    const qrPlaceholder = document.getElementById("modal-qr-placeholder");
    const qrExpiresAt = document.getElementById("modal-qr-expires-at");

    const openQrModal = () => {
        qrCodeModalOverlay.classList.remove("hidden");
        qrCodeModalOverlay.classList.add("active");
        generateQrCode(); // Panggil fungsi untuk generate QR saat modal dibuka
    };

    const closeQrModal = () => {
        qrCodeModalOverlay.classList.remove("active");
        clearInterval(qrCodeInterval); // Hentikan interval saat modal ditutup
        setTimeout(() => {
            qrCodeModalOverlay.classList.add("hidden");
            qrCodeImage.src = ""; // Bersihkan gambar
            qrCodeImage.classList.add("hidden", "opacity-0", "scale-95");
            qrPlaceholder.classList.remove("hidden");
            qrExpiresAt.textContent = "";
        }, 300);
    };

    const generateQrCode = async () => {
        qrCodeImage.classList.add("hidden", "opacity-0", "scale-95");
        qrPlaceholder.classList.remove("hidden");
        qrExpiresAt.textContent = "Memuat QR Code...";
        clearInterval(qrCodeInterval); // Hentikan interval sebelumnya jika ada

        try {
            // Asumsi ada layanan AttendanceServices atau serupa untuk QR Code
            // Misalnya: const response = await AttendanceServices.generateQrCode();
            // Untuk demonstrasi, kita gunakan placeholder dan timer
            const dummyQrData = "https://example.com/attendance/scan?token=ABCD123";
            const dummyExpiryTime = new Date(Date.now() + 60 * 1000); // Expire in 1 minute

            qrCodeImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(dummyQrData)}`;
            
            qrCodeImage.onload = () => {
                qrPlaceholder.classList.add("hidden");
                qrCodeImage.classList.remove("hidden", "opacity-0", "scale-95");
                qrCodeImage.classList.add("opacity-100", "scale-100");
            };

            // Update expiry time every second
            qrCodeInterval = setInterval(() => {
                const now = new Date();
                const timeLeft = dummyExpiryTime.getTime() - now.getTime();

                if (timeLeft <= 0) {
                    qrExpiresAt.textContent = "QR Code telah kedaluwarsa. Silakan refresh.";
                    clearInterval(qrCodeInterval);
                    // Mungkin juga sembunyikan gambar QR atau tampilkan pesan "kedaluwarsa" di QR nya
                    qrCodeImage.classList.add("hidden", "opacity-0", "scale-95");
                    qrPlaceholder.classList.remove("hidden");
                    return;
                }

                const minutes = Math.floor(timeLeft / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                qrExpiresAt.textContent = `Kedaluwarsa dalam: ${minutes}m ${seconds}s`;
            }, 1000);

        } catch (error) {
            console.error("Error generating QR code:", error);
            qrPlaceholder.textContent = "Gagal memuat QR Code.";
            qrExpiresAt.textContent = "Coba lagi nanti.";
        }
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
                        // Backend sudah memberikan jadwal yang bersih (tanpa hari libur)
                        return (response.data || []).map(s => ({
                            id: s.id,
                            title: `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`, // Format HH:mm
                            start: s.date, // Tanggal saja karena time sudah di title
                            extendedProps: { 
                                start_time: s.start_time,
                                end_time: s.end_time,
                                note: s.note,
                                recurrence_rule: s.recurrence_rule, // Simpan aturan perulangan
                            },
                            allDay: true, // Karena hanya menampilkan tanggal di grid bulan/minggu
                            color: '#38b2ac', // Warna jadwal kerja
                            textColor: 'white',
                            display: 'block', // Default display
                        }));
                    } catch (error) {
                        console.error("Error fetching work schedules:", error);
                        return [];
                    }
                },
                color: '#38b2ac', // Warna jadwal kerja
                textColor: 'white',
            },

            // Sumber 2: Hari Libur Nasional dari Backend
            {
                events: async (info) => {
                    try {
                        const year = info.start.getFullYear();
                        const holidays = await WorkScheduleServices.getHolidays(year);
                        return (holidays || []).map(holiday => ({
                            title: holiday.Name, // Sesuaikan dengan field dari backend
                            start: holiday.Date, // Sesuaikan dengan field dari backend
                            allDay: true,
                            display: 'background',
                            color: '#ff9f89', // Warna untuk hari libur (background)
                        }));
                    } catch (error) {
                        console.error("Error fetching holidays:", error);
                        return [];
                    }
                }
            }
        ],

        select: (info) => {
            openScheduleModal("create");
            scheduleDateInput.value = info.startStr.split("T")[0]; // Ambil hanya tanggal
            calendar.unselect();
        },
        eventClick: async (info) => {
            // Ketika event diklik, kita akan membuka modal untuk edit
            // Karena FullCalendar hanya memberikan event occurrence, kita harus fetch detail aturan dari backend
            try {
                // Asumsi info.event.id adalah ID dari aturan jadwal kerja yang sebenarnya
                const scheduleRuleId = info.event.id;
                const response = await WorkScheduleServices.getWorkScheduleById(scheduleRuleId);
                const scheduleRule = response.data; // Ini harus detail aturan dari backend

                if (scheduleRule) {
                    formModalTitle.textContent = "Edit Aturan Jadwal Kerja";
                    scheduleIdInput.value = scheduleRule.id;
                    scheduleDateInput.value = scheduleRule.date;
                    startTimeInput.value = scheduleRule.start_time.substring(0, 5);
                    endTimeInput.value = scheduleRule.end_time.substring(0, 5);
                    noteInput.value = scheduleRule.note || '';

                    // Isi ulang bagian perulangan
                    recurrenceFreqInput.value = scheduleRule.recurrence_rule.split(';')[0].replace('FREQ=', '') || 'NONE';
                    if (recurrenceFreqInput.value === 'WEEKLY') {
                        weeklyOptionsDiv.classList.remove('hidden');
                        const byDayMatch = scheduleRule.recurrence_rule.match(/BYDAY=([A-Z,]+)/);
                        const selectedDays = byDayMatch ? byDayMatch[1].split(',') : [];
                        weekdayCheckboxes.forEach(cb => {
                            cb.checked = selectedDays.includes(cb.value);
                        });
                    } else {
                        weeklyOptionsDiv.classList.add('hidden');
                        weekdayCheckboxes.forEach(cb => cb.checked = false);
                    }
                    const untilMatch = scheduleRule.recurrence_rule.match(/UNTIL=(\d{8})/);
                    recurrenceUntilInput.value = untilMatch ? `${untilMatch[1].substring(0,4)}-${untilMatch[1].substring(4,6)}-${untilMatch[1].substring(6,8)}` : '';

                    deleteScheduleBtn.classList.remove("hidden"); // Tampilkan tombol delete
                    openScheduleModal("edit", scheduleRule); // Pass the rule data
                } else {
                    alert("Detail jadwal tidak ditemukan.");
                }

            } catch (error) {
                console.error("Error fetching schedule for edit:", error);
                alert("Gagal memuat detail jadwal untuk diedit. " + (error.response?.data?.error || error.message));
            }
        },
    });

    calendar.render();

    // --- Event Listeners ---
    manualAddScheduleBtn.addEventListener("click", () => openScheduleModal("create"));
    closeScheduleModalBtn.addEventListener("click", closeScheduleModal);
    cancelScheduleBtn.addEventListener("click", closeScheduleModal);

    // Event Listener untuk tombol Generate QR Code (Desktop & Mobile)
    if (generateQrMenuBtn) {
        generateQrMenuBtn.addEventListener("click", openQrModal);
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
            openQrModal();
        });
    }

    // Event Listener untuk tombol di QR Code Modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeQrModal);
    }
    if (modalGenerateQrBtn) {
        modalGenerateQrBtn.addEventListener("click", generateQrCode);
    }
    if (modalCloseQrBtn) { // Jika ada tombol close terpisah di dalam modal QR
        modalCloseQrBtn.addEventListener("click", closeQrModal);
    }

    // Event Listener untuk Dropdown Pengguna
    if (userAvatar) {
        userAvatar.addEventListener('click', () => {
            dropdownMenu.classList.toggle('active');
        });

        // Tutup dropdown saat klik di luar
        document.addEventListener('click', (event) => {
            if (!userDropdown.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }

    // Tidak perlu lagi handleLogout di sini karena sudah ditangani oleh initializeLogout
    // dan tombol-tombol logout sudah diproses oleh querySelectorAll di logoutHandler.js

    workScheduleForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        saveScheduleBtn.disabled = true;

        const scheduleId = scheduleIdInput.value;
        const recurrenceRule = generateRecurrenceRule(); // Pastikan ini dipanggil sebelum payload

        // Validasi minimal 1 hari dipilih untuk mingguan
        if (recurrenceFreqInput.value === "WEEKLY" && generateRecurrenceRule() === "") {
             alert("Pilih minimal satu hari untuk jadwal mingguan.");
             saveScheduleBtn.disabled = false;
             return;
        }

        const payload = {
            date: scheduleDateInput.value,
            start_time: startTimeInput.value,
            end_time: endTimeInput.value,
            note: noteInput.value,
            recurrence_rule: recurrenceRule, // Sertakan aturan perulangan di payload
        };

        try {
            if (scheduleId) {
                // Jika ada scheduleId, ini adalah update
                await WorkScheduleServices.updateWorkSchedule(scheduleId, payload);
                alert("Aturan jadwal kerja berhasil diperbarui!");
            } else {
                // Jika tidak ada scheduleId, ini adalah pembuatan baru
                await WorkScheduleServices.createWorkSchedule(payload);
                alert("Aturan jadwal kerja berhasil disimpan!");
            }
            closeScheduleModal();
            calendar.refetchEvents(); // Muat ulang semua event
        } catch (error) {
            console.error("Error saving/updating work schedule:", error);
            alert("Gagal menyimpan/memperbarui jadwal kerja. " + (error.response?.data?.error || error.message));
        } finally {
            saveScheduleBtn.disabled = false;
        }
    });

    deleteScheduleBtn.addEventListener("click", async () => {
        const scheduleId = scheduleIdInput.value;
        if (scheduleId && confirm("Anda yakin ingin menghapus aturan jadwal ini? Penghapusan akan berlaku untuk semua kejadian di masa mendatang.")) {
            deleteScheduleBtn.disabled = true;
            try {
                await WorkScheduleServices.deleteWorkSchedule(scheduleId);
                alert("Aturan jadwal kerja berhasil dihapus!");
                closeScheduleModal();
                calendar.refetchEvents();
            } catch (error) {
                console.error("Error deleting work schedule:", error);
                alert("Gagal menghapus jadwal kerja. " + (error.response?.data?.error || error.message));
            } finally {
                deleteScheduleBtn.disabled = false;
            }
        }
    });
});