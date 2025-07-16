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
                id: s.id, // ID event
                title: `${s.start_time}-${s.end_time}`, // Judul event di kalender
                start: `${s.date}T${s.start_time}`,
                end: `${s.date}T${s.end_time}`,
                extendedProps: { // Data tambahan yang ingin disimpan dengan event (opsional)
                    note: s.note
                },
                backgroundColor: '#38b2ac', // Warna teal
                borderColor: '#38b2ac',
                allDay: false // Event memiliki waktu spesifik
            }));

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
            const event = info.event;
            const eventDetails = `
                **Jadwal:** ${event.start.toLocaleDateString('id-ID')}
                **Waktu:** ${event.start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${event.end ? event.end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Tidak ada waktu selesai'}
                **Catatan:** ${event.extendedProps.note || '-'}
            `;
            showAlert(eventDetails, 'info', 5000); // Tampilkan detail sebagai alert sementara
        },
        
        eventDidMount: function(info) {
            info.el.title = `${info.event.title}\nCatatan: ${info.event.extendedProps.note || '-'}`;
        }
    });

    calendar.render(); // Render kalender setelah inisialisasi
});