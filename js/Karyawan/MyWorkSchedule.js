import { Calendar } from 'fullcalendar'; 
import dayGridPlugin from '@fullcalendar/daygrid'; 
import timeGridPlugin from '@fullcalendar/timegrid';
import idLocale from '@fullcalendar/core/locales/id';

import WorkScheduleServices from '../Services/WorkScheduleServices.js';


document.addEventListener('DOMContentLoaded', () => {
    let calendar; 

    const fetchMySchedules = async (info = null) => {
        try {
            const response = await WorkScheduleServices.getMyWorkSchedules();
            const schedules = response.data;

            if (calendar) {
                calendar.removeAllEvents();
            }

const events = schedules.map(s => ({
    id: s._id,                                           // pakai _id
    title: `Jadwal: ${s.start_time.substring(0,5)} - ${s.end_time.substring(0,5)}`,
    start: `${s.date}T${s.start_time}`,
    end:   `${s.date}T${s.end_time}`,
    // ‼️ semua properti kustom sebaiknya disimpan di extendedProps
    extendedProps: {
        description: s.note || "Tanpa catatan",
        note:        s.note || "Tanpa catatan",
        start_time:  s.start_time,
        end_time:    s.end_time,
    },
    backgroundColor: '#38b2ac',
    borderColor:     '#38b2ac',
    allDay: false,
}));

            console.log("Jadwal yang diterima:", schedules);


            if (calendar) {
                calendar.addEventSource(events); // Tambahkan semua event ke kalender
            }
        } catch (error) {
            console.error('Error fetching my work schedules:', error);
            showAlert('Gagal memuat jadwal kerja Anda. ' + (error.response?.data?.error || error.message), 'error');
        }
    };

    const calendarEl = document.getElementById('my-calendar'); // ID baru untuk container kalender karyawan
calendar = new Calendar(calendarEl, {
    plugins: [ dayGridPlugin, timeGridPlugin ], // Plugin yang dibutuhkan (tanpa interaction karena tidak ada CRUD)
    initialView: 'dayGridMonth', // Tampilan awal: bulan
    locale: idLocale, // Set bahasa ke Indonesia
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable: false, // Karyawan tidak bisa drag & drop atau resize
    selectable: false, // Karyawan tidak bisa select tanggal
    eventDisplay: 'block',
    
    datesSet: (info) => {
        fetchMySchedules(info);
    },

    eventClick: (info) => {
        const { start, end, extendedProps } = info.event;

        const dateStr = start.toLocaleDateString('id-ID');
        const timeStr = `${start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${
            end ? end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
        }`;
        const noteStr = extendedProps.description || '-';

        const content = `
            <b>Tanggal&nbsp;&nbsp;:</b> ${dateStr}<br>
            <b>Waktu&nbsp;&nbsp;&nbsp;:</b> ${timeStr}<br>
            <b>Catatan&nbsp;:</b> ${noteStr}
        `;

        showAlert(content, 'info', 6000); // Ganti dengan SweetAlert2 jika ingin modal
    },

    eventDidMount: function(info) {
        const note = info.event.extendedProps.description || '-';
        info.el.title = `${info.event.title}\nCatatan: ${note}`;
    }
});


    calendar.render(); // Render kalender setelah inisialisasi
});