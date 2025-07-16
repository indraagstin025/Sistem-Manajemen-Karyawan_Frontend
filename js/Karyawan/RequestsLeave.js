import { Calendar } from "fullcalendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import idLocale from "@fullcalendar/core/locales/id";

import WorkScheduleServices from "../Services/WorkScheduleServices.js";
import Swal from "sweetalert2";

document.addEventListener("DOMContentLoaded", () => {
  const calendarEl = document.getElementById("my-calendar");

  // Pastikan elemen kalender ada sebelum melanjutkan
  if (!calendarEl) {
    console.error("Elemen kalender dengan ID 'my-calendar' tidak ditemukan.");
    return;
  }

  // Fungsi helper untuk format waktu ke AM/PM (sudah bagus, tidak perlu diubah)
  const formatTimeWithAmPm = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeString;
    }
  };

  const calendar = new Calendar(calendarEl, {
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

    // ✅ Pola yang lebih baik untuk memuat event
    events: async function (fetchInfo, successCallback, failureCallback) {
      try {
        const schedules = await WorkScheduleServices.getMyWorkSchedules();

        if (!Array.isArray(schedules)) {
          throw new Error("Format data jadwal tidak valid.");
        }

        // Kelompokkan jadwal berdasarkan tanggal
        const grouped = {};
        schedules.forEach((s) => {
          if (!grouped[s.date]) grouped[s.date] = [];
          grouped[s.date].push(s);
        });

        // Ubah data yang sudah dikelompokkan menjadi format event FullCalendar
        const events = Object.entries(grouped).map(([date, items]) => ({
          id: date,
          start: date, // Cukup tanggalnya saja untuk event seharian
          display: 'background', // Tampilkan sebagai background dot
          backgroundColor: '#e53e3e', // Warna dot
          extendedProps: {
            items, // Simpan semua jadwal di hari itu
          },
        }));

        successCallback(events);
      } catch (error) {
        console.error("Error fetching my work schedules:", error);
        Swal.fire("Gagal Memuat Jadwal", error.message || "Terjadi kesalahan pada server", "error");
        failureCallback(error);
      }
    },
    
    // ✅ Klik pada hari manapun yang ada jadwalnya
    eventClick: (info) => {
      const { start, extendedProps } = info.event;
      const dateStr = start.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let scheduleListHtml = '';
      if (extendedProps.items && extendedProps.items.length > 0) {
        scheduleListHtml = extendedProps.items
          .map(item => `
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
              <p style="margin: 5px 0;"><strong>Jam:</strong> ${formatTimeWithAmPm(item.start_time)} - ${formatTimeWithAmPm(item.end_time)}</p>
              <p style="margin: 5px 0;"><strong>Catatan:</strong> ${item.note || "Tanpa catatan"}</p>
            </div>
          `)
          .join("");
      } else {
        scheduleListHtml = "<p>Tidak ada detail jadwal untuk hari ini.</p>";
      }

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
    
    // Tooltip saat hover (sudah bagus)
    eventDidMount: function (info) {
      const count = info.event.extendedProps.items?.length || 0;
      if (count > 0) {
        info.el.title = `${count} jadwal pada hari ini`;
        info.el.style.cursor = 'pointer';
      }
    },
  });

  calendar.render();
});