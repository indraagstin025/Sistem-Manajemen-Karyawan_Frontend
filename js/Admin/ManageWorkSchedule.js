// /js/Admin/ManageWorkSchedule.js

import { Calendar } from "fullcalendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import idLocale from "@fullcalendar/core/locales/id";

import WorkScheduleServices from "../Services/WorkScheduleServices.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- Pengambilan Elemen DOM ---
  const scheduleFormModal = document.getElementById("scheduleFormModal");
  const closeScheduleModalBtn = document.getElementById("closeScheduleModalBtn");
  const workScheduleForm = document.getElementById("workScheduleForm");
  const formModalTitle = document.getElementById("form-modal-title");
  const scheduleIdInput = document.getElementById("schedule-id");
  const userIdInput = document.getElementById("user-id");
  const scheduleDateInput = document.getElementById("schedule-date");
  const startTimeInput = document.getElementById("start-time");
  const endTimeInput = document.getElementById("end-time");
  const noteInput = document.getElementById("note");
  const saveScheduleBtn = document.getElementById("save-schedule-btn");
  const cancelScheduleBtn = document.getElementById("cancel-schedule-btn");
  const deleteScheduleBtn = document.getElementById("delete-schedule-btn");
  const manualAddScheduleBtn = document.getElementById("manualAddScheduleBtn"); // Tombol baru

  let calendar;
  let currentEvent = null;

  // --- Fungsi Modal ---
  const openScheduleModal = (mode = "create", event = null, dateInfo = null) => {
    scheduleFormModal.classList.remove("hidden");
    scheduleFormModal.classList.add("active");
    userIdInput.readOnly = false;
    scheduleDateInput.readOnly = false;
    deleteScheduleBtn.classList.add("hidden");

    if (mode === "create") {
      formModalTitle.textContent = "Tambah Jadwal Kerja Baru";
      workScheduleForm.reset(); // Cara lebih simpel untuk membersihkan form
      scheduleIdInput.value = ""; // Pastikan ID kosong
      startTimeInput.value = "09:00";
      endTimeInput.value = "17:00";
      if (dateInfo) {
        scheduleDateInput.value = dateInfo.dateStr;
      }
    } else if (mode === "edit" && event) {
      formModalTitle.textContent = "Edit Jadwal Kerja";
      scheduleIdInput.value = event.id;
      userIdInput.value = event.extendedProps.userId;
      userIdInput.readOnly = true;
      scheduleDateInput.value = event.start.toISOString().split("T")[0];
      scheduleDateInput.readOnly = true;
      startTimeInput.value = event.start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      endTimeInput.value = event.end ? event.end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
      noteInput.value = event.extendedProps.note || "";
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

  // --- Logika Kalender ---
  const fetchAndRenderSchedules = async (info) => {
    try {
      const filters = {
        start_date: info.startStr.split("T")[0],
        end_date: info.endStr.split("T")[0],
      };

      const response = await WorkScheduleServices.getAllWorkSchedules(filters);
      const schedules = response.data || []; // Pastikan response.data tidak null

      return schedules.map((s) => ({
        id: s.ID, // Pastikan menggunakan 'ID' (sesuai struct Go)
        title: `${s.start_time}-${s.end_time} (${s.user_id})`,
        start: `${s.date}T${s.start_time}`,
        end: `${s.date}T${s.end_time}`,
        extendedProps: {
          userId: s.user_id,
          note: s.note,
        },
        backgroundColor: "#38b2ac",
        borderColor: "#38b2ac",
      }));
    } catch (error) {
      console.error("Error fetching work schedules:", error);
      alert("Gagal memuat jadwal kerja.");
      return []; // Kembalikan array kosong jika gagal
    }
  };

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
    eventDisplay: "block",
    events: fetchAndRenderSchedules, // Gunakan 'events' sebagai fungsi

    select: (info) => {
      // Izinkan admin membuat jadwal dengan mengklik tanggal
      openScheduleModal("create", null, info);
      calendar.unselect();
    },

    eventClick: (info) => {
      openScheduleModal("edit", info.event);
    },

    eventDrop: async (info) => {
      // Update via Drag & Drop
      const event = info.event;
      const updatePayload = {
        start_time: event.start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        end_time: event.end ? event.end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "",
        note: event.extendedProps.note || "",
      };

      try {
        await WorkScheduleServices.updateWorkSchedule(event.id, updatePayload);
        alert("Jadwal berhasil diperbarui!");
      } catch (error) {
        console.error("Error updating schedule via drag:", error);
        alert("Gagal memperbarui jadwal: " + (error.response?.data?.error || error.message));
        info.revert(); // Kembalikan event ke posisi semula jika gagal
      }
    },
    
    // Anda bisa menambahkan eventResize di sini dengan logika yang sama seperti eventDrop
  });

  calendar.render();

  // --- Event Listeners untuk Tombol & Form ---
  
  // ✅ Pemicu untuk Tombol "Tambah Jadwal Kerja"
  manualAddScheduleBtn.addEventListener("click", () => {
    openScheduleModal("create");
  });

  closeScheduleModalBtn.addEventListener("click", closeScheduleModal);
  cancelScheduleBtn.addEventListener("click", closeScheduleModal);
  scheduleFormModal.addEventListener("click", (e) => {
    if (e.target === scheduleFormModal) {
      closeScheduleModal();
    }
  });

  // ✅ Logika SUBMIT FORM yang sudah diperbaiki
  workScheduleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveScheduleBtn.disabled = true; // Nonaktifkan tombol

    try {
      if (scheduleIdInput.value) {
        // --- LOGIKA UPDATE ---
        const updatePayload = {
          start_time: startTimeInput.value,
          end_time: endTimeInput.value,
          note: noteInput.value,
        };
        await WorkScheduleServices.updateWorkSchedule(scheduleIdInput.value, updatePayload);
        alert("Jadwal kerja berhasil diperbarui!");
      } else {
        // --- LOGIKA CREATE ---
        const scheduleData = {
          user_id: userIdInput.value,
          date: scheduleDateInput.value,
          start_time: startTimeInput.value,
          end_time: endTimeInput.value,
          note: noteInput.value,
        };
        await WorkScheduleServices.createWorkSchedule(scheduleData);
        alert("Jadwal kerja berhasil ditambahkan!");
      }
      
      closeScheduleModal();
      calendar.refetchEvents(); // ✨ Muat ulang data kalender setelah sukses!
      
    } catch (error) {
      console.error("Error saving work schedule:", error);
      alert("Gagal menyimpan jadwal kerja. " + (error.response?.data?.error || error.message));
    } finally {
      saveScheduleBtn.disabled = false; // Aktifkan kembali tombol
    }
  });
  
  // --- LOGIKA DELETE ---
  deleteScheduleBtn.addEventListener("click", async () => {
    if (currentEvent && confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      deleteScheduleBtn.disabled = true;
      try {
        await WorkScheduleServices.deleteWorkSchedule(currentEvent.id);
        currentEvent.remove(); // Optimistic UI update
        alert("Jadwal kerja berhasil dihapus!");
        closeScheduleModal();
      } catch (error) {
        console.error("Error deleting work schedule:", error);
        alert("Gagal menghapus jadwal kerja. " + (error.response?.data?.error || error.message));
      } finally {
        deleteScheduleBtn.disabled = false;
      }
    }
  });
});