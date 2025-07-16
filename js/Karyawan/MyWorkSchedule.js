import { Calendar } from "fullcalendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import idLocale from "@fullcalendar/core/locales/id";

import WorkScheduleServices from "../Services/WorkScheduleServices.js";
import Swal from "sweetalert2";

document.addEventListener("DOMContentLoaded", () => {
  let calendar;

  const fetchMySchedules = async (info = null) => {
    try {
      const response = await WorkScheduleServices.getMyWorkSchedules();
      const schedules = response.data;

      if (calendar) {
        calendar.removeAllEvents();
      }

      const events = schedules.map((s) => ({
        id: s._id,
        title: "", // kosong karena hanya titik
        start: `${s.date}T${s.start_time}`,
        end: `${s.date}T${s.end_time}`,
        extendedProps: {
          description: s.note || "Tanpa catatan",
          note: s.note || "Tanpa catatan",
          start_time: s.start_time,
          end_time: s.end_time,
        },
        backgroundColor: "#e53e3e", // warna merah tua
        borderColor: "#e53e3e",
        allDay: false,
      }));

      console.log("Jadwal yang diterima:", schedules);

      if (calendar) {
        calendar.addEventSource(events);
      }
    } catch (error) {
      console.error("Error fetching my work schedules:", error);
      showAlert("Gagal memuat jadwal kerja Anda. " + (error.response?.data?.error || error.message), "error");
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

    // 🔴 Ganti tampilan event menjadi titik merah
    eventContent: function (arg) {
      return {
        html: `<div style="width: 10px; height: 10px; border-radius: 50%; background-color: red; margin: auto;"></div>`,
      };
    },

    datesSet: (info) => {
      fetchMySchedules(info);
    },

    eventClick: (info) => {
      const { start, end, extendedProps } = info.event;

      const dateStr = start.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timeStr = `${start.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${
        end
          ? end.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"
      }`;
      const noteStr = extendedProps.description || "-";

      Swal.fire({
        title: "Detail Jadwal Kerja",
        html: `
        <pre style="text-align:left; white-space: pre-wrap;">
<b>Tanggal:</b> ${dateStr}
<b>Waktu:</b>   ${timeStr}
<b>Catatan:</b> ${noteStr}
        </pre>
        `,
        icon: "info",
        confirmButtonText: "Tutup",
        customClass: {
          popup: "rounded-lg",
        },
      });
    },

    eventDidMount: function (info) {
      const note = info.event.extendedProps.description || "-";
      info.el.title = `Catatan: ${note}`;
    },
  });

  calendar.render();
});
