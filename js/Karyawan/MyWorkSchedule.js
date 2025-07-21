import { Calendar } from "fullcalendar";
import WorkScheduleServices from "../Services/WorkScheduleServices.js";
import { authService } from "../Services/AuthServices.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { initializeSidebar } from "../components/sidebarHandler.js";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import idLocale from "@fullcalendar/core/locales/id";
import Swal from "sweetalert2";

document.addEventListener("DOMContentLoaded", () => {
    const calendarEl = document.getElementById("my-calendar");
    const userAvatarNav = document.getElementById("userAvatar");
    let calendar;

    // Fungsi untuk memuat foto header sekali di awal
    const loadHeaderData = async () => {
        try {
            const user = authService.getCurrentUser();
            if (!user) return;
            const photoUrl = await getUserPhotoBlobUrl(user.id, user.name);
            if (userAvatarNav) {
                userAvatarNav.src = photoUrl;
                userAvatarNav.alt = user.name;
            }
        } catch (e) {
            console.error("Gagal memuat foto header", e);
        }
    };

    calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin],
        initialView: "dayGridMonth",
        locale: idLocale,
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
        },
        editable: false,
        selectable: false,

        // Menggunakan eventSources untuk mengambil jadwal kerja DAN hari libur
        eventSources: [
            // Sumber 1: Jadwal Kerja dari endpoint getMyWorkSchedules
            {
                events: async (fetchInfo) => {
                    try {
                        const response = await WorkScheduleServices.getMyWorkSchedules();
                        const schedules = response.data || [];
                        const grouped = {};
                        schedules.forEach((s) => {
                            if (!grouped[s.date]) grouped[s.date] = [];
                            grouped[s.date].push(s);
                        });
                        return Object.entries(grouped).map(([date, items]) => ({
                            id: `schedule-${date}`,
                            title: `Jadwal Kerja: ${items[0].start_time} - ${items[0].end_time}`, // Title untuk tooltip
                            start: `${date}T${items[0].start_time}`,
                            end: `${date}T${items[0].end_time}`,
                            extendedProps: { items, type: 'schedule' },
                            display: 'block',
                            className: 'fc-event-work-schedule' // Class untuk styling titik merah
                        }));
                    } catch (error) {
                        console.error("Error fetching work schedules:", error);
                        Swal.fire("Gagal memuat jadwal kerja", error.message, "error");
                        return [];
                    }
                }
            },
            // Sumber 2: Hari Libur dari endpoint getHolidays (seperti di halaman admin)
            {
                events: async (fetchInfo) => {
                    try {
                        const year = fetchInfo.start.getFullYear();
                        const holidays = await WorkScheduleServices.getHolidays(year);
                        return (holidays || []).map(holiday => ({
                            id: `holiday-${holiday.Date}`,
                            title: holiday.Name,
                            start: holiday.Date,
                            allDay: true,
                            display: 'block', // Tampilkan sebagai event biasa
                            className: 'fc-event-holiday', // Class untuk styling teks merah
                            extendedProps: { type: 'holiday' }
                        }));
                    } catch (error) {
                        console.error("Error fetching holidays:", error);
                        return [];
                    }
                }
            }
        ],

        eventContent: (arg) => {
            if (arg.event.extendedProps.type === 'schedule') {
                return { html: `<div class="fc-event-dot"></div>` };
            }
            if (arg.event.extendedProps.type === 'holiday') {
                return { html: `<div class="fc-event-title-holiday">${arg.event.title}</div>` };
            }
        },

eventClick: (info) => {
    const eventType = info.event.extendedProps.type;

    // Jika yang diklik adalah HARI LIBUR
    if (eventType === 'holiday') {
        Swal.fire({
            title: "Informasi Hari Libur",
            html: `<p style="font-size: 1.1rem;">${info.event.title}</p>`, // Tampilkan nama lengkap hari libur
            icon: "info",
            confirmButtonText: "Tutup",
        });
        return; // Hentikan eksekusi
    }

    // Jika yang diklik adalah JADWAL KERJA (logika lama Anda)
    if (eventType === 'schedule') {
        const { start, extendedProps } = info.event;
        const dateStr = start.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

        const scheduleListHtml = extendedProps.items.map((item, i) => `
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <p style="margin: 0; font-weight: bold;">Jadwal ${i + 1}:</p>
                <p style="margin: 5px 0;"><strong>Jam:</strong> ${item.start_time} - ${item.end_time}</p>
                <p style="margin: 5px 0;"><strong>Catatan:</strong> ${item.note || "Tanpa catatan"}</p>
            </div>
        `).join("");

        Swal.fire({
            title: "Detail Jadwal Kerja",
            html: `<div style="text-align: left; max-height: 300px; overflow-y: auto; padding-right: 10px;"><p style="margin-bottom: 15px;"><b>Tanggal:</b> ${dateStr}</p>${scheduleListHtml}</div>`,
            icon: "info",
            confirmButtonText: "Tutup",
        });
    }
},
        
        eventMouseEnter: (info) => {
            info.el.title = info.event.title; // Tooltip akan menampilkan nama libur atau info jadwal
        }
    });

    // Inisialisasi komponen UI dan render kalender
    initializeSidebar();
    initializeLogout();
    loadHeaderData();
    calendar.render();
});