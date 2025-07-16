import { Calendar } from "fullcalendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import idLocale from "@fullcalendar/core/locales/id";

import WorkScheduleServices from "../Services/WorkScheduleServices.js";
import Swal from "sweetalert2";

document.addEventListener("DOMContentLoaded", () => {
  let calendar;

  const fetchMySchedules = async () => {
    try {
      const response = await WorkScheduleServices.getMyWorkSchedules();
      const schedules = response.data;

      if (calendar) {
        calendar.removeAllEvents();
      }

      const grouped = {};
      schedules.forEach((s) => {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
      });

      const events = Object.entries(grouped).map(([date, items]) => ({
        id: date,
        title: "",
        start: `${date}T${items[0].start_time}`,
        end: `${date}T${items[0].end_time}`,
        extendedProps: {
          items,
        },
        backgroundColor: "#e53e3e",
        borderColor: "#e53e3e",
        allDay: false,
      }));

      calendar.addEventSource(events);
    } catch (error) {
      console.error("Error fetching my work schedules:", error);
      Swal.fire("Gagal memuat jadwal kerja", error.response?.data?.error || error.message, "error");
    }
  };

  // Fungsi helper untuk format waktu ke AM/PM
  const formatTimeWithAmPm = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // Ini yang membuat format AM/PM
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeString; // Fallback jika gagal format
    }
  };

  const calendarEl = document.getElementById("my-calendar");
  calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, timeGridPlugin],
    initialView: "dayGridMonth",
    locale: idLocale,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    editable: false,
    selectable: false,

    eventContent: () => {
      return {
        html: `<div style="width: 10px; height: 10px; border-radius: 50%; background-color: red; margin: auto;"></div>`,
      };
    },

    datesSet: () => {
      fetchMySchedules();
    },

    // 🟢 Klik titik = tampilkan semua jadwal hari itu
    eventClick: (info) => {
      const { start, extendedProps } = info.event;
      const dateStr = start.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // === Bagian ini yang diubah ===
      let scheduleListHtml = '';
      if (extendedProps.items && extendedProps.items.length > 0) {
        scheduleListHtml = extendedProps.items
          .map(
            (item) => `
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <p style="margin: 5px 0;"><strong>Jam:</strong> ${formatTimeWithAmPm(item.start_time)} - ${formatTimeWithAmPm(item.end_time)}</p>
                <p style="margin: 5px 0;"><strong>Catatan:</strong> ${item.note || "Tanpa catatan"}</p>
            </div>
            `
          )
          .join("");
      } else {
          scheduleListHtml = "<p>Tidak ada jadwal untuk hari ini.</p>";
      }
      // ===========================

      Swal.fire({
        title: "Detail Jadwal Kerja",
        html: `
          <div style="text-align: left; max-height: 300px; overflow-y: auto; padding-right: 10px;">
            <p style="margin-bottom: 15px;"><b>Tanggal:</b> ${dateStr}</p>
            ${scheduleListHtml}
          </div>
        `,
        icon: "info",
        confirmButtonText: "Tutup",
        customClass: {
          popup: "rounded-lg",
          confirmButton: "bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded",
        },
        buttonsStyling: false,
      });
    },

    eventDidMount: function (info) {
      const count = info.event.extendedProps.items?.length || 1;
      info.el.title = `${count} jadwal pada hari ini`;
    },
  });

  calendar.render();
});