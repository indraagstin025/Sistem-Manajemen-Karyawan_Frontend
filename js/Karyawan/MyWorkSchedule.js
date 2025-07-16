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

      // 🔁 Gabungkan jadwal berdasarkan tanggal
      const grouped = {};
      schedules.forEach((s) => {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
      });

      // 🔴 Satu event per hari dengan titik merah
      const events = Object.entries(grouped).map(([date, items]) => ({
        id: date,
        title: "",
        start: `${date}T${items[0].start_time}`,
        end: `${date}T${items[0].end_time}`,
        extendedProps: {
          items, // kirim semua item per hari
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

    // 🔴 Tampilkan hanya titik merah kecil
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

      const list = extendedProps.items
        .map(
          (item, i) =>
            `<b>${i + 1}. ${item.start_time} - ${item.end_time}</b><br>${item.note || "Tanpa catatan"}<br><br>`
        )
        .join("");

      Swal.fire({
        title: "Detail Jadwal Kerja",
        html: `
          <div style="text-align: left;">
            <b>Tanggal:</b> ${dateStr}<br><br>
            ${list}
          </div>
        `,
        icon: "info",
        confirmButtonText: "Tutup",
        customClass: {
          popup: "rounded-lg",
        },
      });
    },

    // Tooltip title jika hover
    eventDidMount: function (info) {
      const count = info.event.extendedProps.items?.length || 1;
      info.el.title = `${count} jadwal pada hari ini`;
    },
  });

  calendar.render();
});
