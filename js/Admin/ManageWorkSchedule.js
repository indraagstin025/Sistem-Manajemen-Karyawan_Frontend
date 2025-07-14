// js/Admin/ManageWorkSchedule.js

import { Calendar } from "fullcalendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import idLocale from "@fullcalendar/core/locales/id";

// Impor service yang sudah kita sesuaikan
import WorkScheduleServices from "../Services/WorkScheduleServices.js";

document.addEventListener("DOMContentLoaded", () => {
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

    let calendar;
    let currentEvent = null;

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
            if (selectedDays.length === 0) return ""; // Butuh minimal 1 hari
            rule += `;BYDAY=${selectedDays.join(",")}`;
        }
        if (recurrenceUntilInput.value) {
            const untilDate = recurrenceUntilInput.value.replace(/-/g, "");
            rule += `;UNTIL=${untilDate}T235959Z`;
        }
        return rule;
    };
    
    // --- Fungsi Modal ---
    const openScheduleModal = (mode = "create", event = null) => {
        scheduleFormModal.classList.remove("hidden");
        scheduleFormModal.classList.add("active");
        deleteScheduleBtn.classList.add("hidden");

        if (mode === "create") {
            formModalTitle.textContent = "Tambah Jadwal Kerja";
            workScheduleForm.reset();
            weeklyOptionsDiv.classList.add("hidden"); // Sembunyikan opsi mingguan
            scheduleIdInput.value = "";
            startTimeInput.value = "09:00";
            endTimeInput.value = "17:00";
        } else if (mode === "edit" && event) {
            // Note: Mode edit sekarang hanya untuk jadwal tunggal, bukan seri berulang.
            // Untuk mengedit seri, lebih mudah untuk menghapus dan membuat baru.
            formModalTitle.textContent = "Edit Jadwal Kerja";
            scheduleIdInput.value = event.id; // Ini adalah ID dari aturan
            // ... (logika untuk mengisi form edit jika diperlukan) ...
            currentEvent = event;
            deleteScheduleBtn.classList.remove("hidden");
        }
    };
    
    const closeScheduleModal = () => {
        scheduleFormModal.classList.remove("active");
        scheduleFormModal.classList.add("hidden");
        workScheduleForm.reset();
        currentEvent = null;
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
                            title: `${s.start_time} - ${s.end_time}`,
                            start: `${s.date}T${s.start_time}`,
                            end: `${s.date}T${s.end_time}`,
                            extendedProps: { note: s.note },
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
                            color: '#ff9f89',
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
            scheduleDateInput.value = info.startStr;
            calendar.unselect();
        },
    });

    calendar.render();

    // --- Event Listeners ---
    manualAddScheduleBtn.addEventListener("click", () => openScheduleModal("create"));
    closeScheduleModalBtn.addEventListener("click", closeScheduleModal);
    cancelScheduleBtn.addEventListener("click", closeScheduleModal);

    workScheduleForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        saveScheduleBtn.disabled = true;

        const recurrenceRule = generateRecurrenceRule();
        const payload = {
            date: scheduleDateInput.value,
            start_time: startTimeInput.value,
            end_time: endTimeInput.value,
            note: noteInput.value,
            recurrence_rule: recurrenceRule,
        };

        try {
            await WorkScheduleServices.createWorkSchedule(payload);
            alert("Aturan jadwal kerja berhasil disimpan!");
            closeScheduleModal();
            calendar.refetchEvents(); // Muat ulang semua event
        } catch (error) {
            console.error("Error saving work schedule:", error);
            alert("Gagal menyimpan jadwal kerja. " + (error.response?.data?.error || error.message));
        } finally {
            saveScheduleBtn.disabled = false;
        }
    });
    
    // (Listener untuk delete bisa disesuaikan jika ingin menghapus seluruh aturan)
});