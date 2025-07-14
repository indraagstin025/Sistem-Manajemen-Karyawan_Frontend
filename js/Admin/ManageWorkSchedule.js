import { Calendar } from "fullcalendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import idLocale from "@fullcalendar/core/locales/id";

import WorkScheduleServices from "../Services/WorkScheduleServices.js";

document.addEventListener("DOMContentLoaded", () => {
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

  let calendar;
  let currentEvent = null;

  const openScheduleModal = (mode = "create", event = null, dateInfo = null) => {
    scheduleFormModal.classList.add("active");
    userIdInput.readOnly = false;
    scheduleDateInput.readOnly = false;
    deleteScheduleBtn.classList.add("hidden");

    if (mode === "create") {
      formModalTitle.textContent = "Tambah Jadwal Kerja Baru";
      scheduleIdInput.value = "";
      userIdInput.value = "";
      noteInput.value = "";

      if (dateInfo) {
        scheduleDateInput.value = dateInfo.dateStr;
        startTimeInput.value = "09:00";
        endTimeInput.value = "17:00";
      } else {
        scheduleDateInput.value = "";
        startTimeInput.value = "";
        endTimeInput.value = "";
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
    workScheduleForm.reset();
    currentEvent = null;
    feather.replace();
  };

  closeScheduleModalBtn.addEventListener("click", closeScheduleModal);
  cancelScheduleBtn.addEventListener("click", closeScheduleModal);
  scheduleFormModal.addEventListener("click", (e) => {
    if (e.target === scheduleFormModal) {
      closeScheduleModal();
    }
  });

  const fetchAndRenderSchedules = async (info = null) => {
    try {
      let filters = {};
      if (info) {
        filters.start_date = info.startStr.split("T")[0];
        filters.end_date = info.endStr.split("T")[0];
      } else {
        if (calendar) {
          const currentView = calendar.view;
          filters.start_date = currentView.activeStart.toISOString().split("T")[0];
          filters.end_date = currentView.activeEnd.toISOString().split("T")[0];
        } else {
          const today = new Date();
          filters.start_date = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
          filters.end_date = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
        }
      }

      const filterUserIdVal = document.getElementById("filter-user-id") ? document.getElementById("filter-user-id").value : "";
      if (filterUserIdVal) {
        filters.user_id = filterUserIdVal;
      }

      const response = await WorkScheduleServices.getAllWorkSchedules(filters);
      const schedules = response.data;

      if (calendar) {
        calendar.removeAllEvents();
      }

      const events = schedules.map((s) => ({
        id: s.id,
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
      if (calendar) {
        calendar.addEventSource(events);
      }
    } catch (error) {
      console.error("Error fetching work schedules:", error);
      showAlert("Gagal memuat jadwal kerja.", "error");
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

    datesSet: (info) => {
      fetchAndRenderSchedules(info);
    },

    select: (info) => {
      const selectedDate = info.startStr.split("T")[0];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const currentDay = currentDate.getDate().toString().padStart(2, "0");
      const today = `${currentYear}-${currentMonth}-${currentDay}`;

      if (selectedDate < today) {
        showAlert("Tidak bisa membuat jadwal di tanggal yang sudah lewat!", "warning");
        calendar.unselect();
        return;
      }
      openScheduleModal("create", null, info);
      calendar.unselect();
    },

    eventClick: (info) => {
      openScheduleModal("edit", info.event);
    },

    eventDrop: async (info) => {
      const event = info.event;
      const newDate = event.start.toISOString().split("T")[0];
      const newStartTime = event.start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const newEndTime = event.end ? event.end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : newStartTime;

      const scheduleData = {
        user_id: event.extendedProps.userId,
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        note: event.extendedProps.note || "",
      };

      try {
        await WorkScheduleServices.updateWorkSchedule(event.id, scheduleData);
        showAlert("Jadwal berhasil diperbarui!", "success");
      } catch (error) {
        console.error("Error updating work schedule via drag-and-drop:", error);
        showAlert("Gagal memperbarui jadwal: " + (error.response?.data?.error || error.message), "error");
        info.revert();
      }
    },

    eventResize: async (info) => {
      const event = info.event;
      const newStartTime = event.start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const newEndTime = event.end ? event.end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : newStartTime;

      const scheduleData = {
        user_id: event.extendedProps.userId,
        date: event.start.toISOString().split("T")[0],
        start_time: newStartTime,
        end_time: newEndTime,
        note: event.extendedProps.note || "",
      };

      try {
        await WorkScheduleServices.updateWorkSchedule(event.id, scheduleData);
        showAlert("Durasi jadwal berhasil diperbarui!", "success");
      } catch (error) {
        console.error("Error updating work schedule via resize:", error);
        showAlert("Gagal memperbarui durasi jadwal: " + (error.response?.data?.error || error.message), "error");
        info.revert();
      }
    },
  });

  calendar.render();

  workScheduleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const scheduleData = {
      user_id: userIdInput.value,
      date: scheduleDateInput.value,
      start_time: startTimeInput.value,
      end_time: endTimeInput.value,
      note: noteInput.value,
    };

    try {
      if (scheduleIdInput.value) {
        await WorkScheduleServices.updateWorkSchedule(scheduleIdInput.value, scheduleData);
        showAlert("Jadwal kerja berhasil diperbarui!", "success");
      } else {
        const createdSchedule = await WorkScheduleServices.createWorkSchedule(scheduleData);
        showAlert("Jadwal kerja berhasil ditambahkan!", "success");

        calendar.addEvent({
          id: createdSchedule.data.id,
          title: `${createdSchedule.data.start_time}-${createdSchedule.data.end_time} (${createdSchedule.data.user_id})`,
          start: `${createdSchedule.data.date}T${createdSchedule.data.start_time}`,
          end: `${createdSchedule.data.date}T${createdSchedule.data.end_time}`,
          extendedProps: {
            userId: createdSchedule.data.user_id,
            note: createdSchedule.data.note,
          },
          backgroundColor: "#38b2ac",
          borderColor: "#38b2ac",
        });
      }
      closeScheduleModal();
    } catch (error) {
      console.error("Error saving work schedule:", error);
      showAlert("Gagal menyimpan jadwal kerja. " + (error.response?.data?.error || error.message), "error");
    }
  });

  deleteScheduleBtn.addEventListener("click", async () => {
    if (currentEvent && confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      try {
        await WorkScheduleServices.deleteWorkSchedule(currentEvent.id);
        currentEvent.remove();
        showAlert("Jadwal kerja berhasil dihapus!", "success");
        closeScheduleModal();
      } catch (error) {
        console.error("Error deleting work schedule:", error);
        showAlert("Gagal menghapus jadwal kerja. " + (error.response?.data?.error || error.message), "error");
      }
    }
  });

  const filterUserIdInput = document.getElementById("filter-user-id");
  const applyFilterBtn = document.getElementById("apply-filter");

  if (applyFilterBtn) {
    applyFilterBtn.addEventListener("click", () => {
      calendar.refetchEvents();
    });
  } else {
  }
});
