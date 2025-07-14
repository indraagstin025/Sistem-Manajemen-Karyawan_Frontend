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
  // const userIdInput = document.getElementById("user-id"); // <-- DIHAPUS
  const scheduleDateInput = document.getElementById("schedule-date");
  const startTimeInput = document.getElementById("start-time");
  const endTimeInput = document.getElementById("end-time");
  const noteInput = document.getElementById("note");
  const saveScheduleBtn = document.getElementById("save-schedule-btn");
  const cancelScheduleBtn = document.getElementById("cancel-schedule-btn");
  const deleteScheduleBtn = document.getElementById("delete-schedule-btn");
  const manualAddScheduleBtn = document.getElementById("manualAddScheduleBtn");

  let calendar;
  let currentEvent = null;

  // --- Fungsi Modal ---
  const openScheduleModal = (mode = "create", event = null, dateInfo = null) => {
    scheduleFormModal.classList.remove("hidden");
    scheduleFormModal.classList.add("active");
    deleteScheduleBtn.classList.add("hidden");
    scheduleDateInput.readOnly = false; // Selalu bisa diubah saat create

    if (mode === "create") {
      formModalTitle.textContent = "Tambah Jadwal Kerja Umum";
      workScheduleForm.reset();
      scheduleIdInput.value = "";
      startTimeInput.value = "09:00";
      endTimeInput.value = "17:00";
      if (dateInfo) {
        scheduleDateInput.value = dateInfo.dateStr;
      }
    } else if (mode === "edit" && event) {
      formModalTitle.textContent = "Edit Jadwal Kerja";
      scheduleIdInput.value = event.id;
      // Logika untuk User ID DIHAPUS
      scheduleDateInput.value = event.start.toISOString().split("T")[0];
      scheduleDateInput.readOnly = true; // Tanggal tidak bisa diubah saat edit
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
      // Tidak ada lagi filter user_id
      const response = await WorkScheduleServices.getAllWorkSchedules(filters);
      const schedules = response.data || [];

      // Judul event tidak lagi menampilkan User ID
      return schedules.map((s) => ({
        id: s.id, // Pastikan 'id' (lowercase) sesuai respons JSON dari Go
        title: `${s.start_time} - ${s.end_time}`,
        start: `${s.date}T${s.start_time}`,
        end: `${s.date}T${s.end_time}`,
        extendedProps: {
          note: s.note,
          // Tidak ada lagi userId
        },
        backgroundColor: "#38b2ac",
        borderColor: "#38b2ac",
      }));
    } catch (error) {
      console.error("Error fetching work schedules:", error);
      alert("Gagal memuat jadwal kerja.");
      return [];
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
    events: fetchAndRenderSchedules,

    select: (info) => {
      openScheduleModal("create", null, info);
      calendar.unselect();
    },

    eventClick: (info) => {
      openScheduleModal("edit", info.event);
    },

    eventDrop: async (info) => {
      const event = info.event;
      const updatePayload = {
        date: event.start.toISOString().split("T")[0], // Tanggal mungkin perlu diupdate
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
        info.revert();
      }
    },
  });

  calendar.render();

  // --- Event Listeners untuk Tombol & Form ---
  manualAddScheduleBtn.addEventListener("click", () => openScheduleModal("create"));
  closeScheduleModalBtn.addEventListener("click", closeScheduleModal);
  cancelScheduleBtn.addEventListener("click", closeScheduleModal);
  scheduleFormModal.addEventListener("click", (e) => {
    if (e.target === scheduleFormModal) closeScheduleModal();
  });

  workScheduleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveScheduleBtn.disabled = true;

    // Payload tidak lagi berisi user_id
    const payload = {
      date: scheduleDateInput.value,
      start_time: startTimeInput.value,
      end_time: endTimeInput.value,
      note: noteInput.value,
    };

    try {
      if (scheduleIdInput.value) {
        await WorkScheduleServices.updateWorkSchedule(scheduleIdInput.value, payload);
        alert("Jadwal kerja berhasil diperbarui!");
      } else {
        await WorkScheduleServices.createWorkSchedule(payload);
        alert("Jadwal kerja berhasil ditambahkan!");
      }
      
      closeScheduleModal();
      calendar.refetchEvents();
      
    } catch (error) {
      console.error("Error saving work schedule:", error);
      alert("Gagal menyimpan jadwal kerja. " + (error.response?.data?.error || error.message));
    } finally {
      saveScheduleBtn.disabled = false;
    }
  });
  
  deleteScheduleBtn.addEventListener("click", async () => {
    if (currentEvent && confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      deleteScheduleBtn.disabled = true;
      try {
        await WorkScheduleServices.deleteWorkSchedule(currentEvent.id);
        currentEvent.remove();
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