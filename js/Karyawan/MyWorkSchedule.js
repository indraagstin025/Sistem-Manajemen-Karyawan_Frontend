// js/Karyawan/MyWorkSchedules.js
import { Calendar } from 'fullcalendar'; // Mengimpor Calendar utama dari package fullcalendar
import dayGridPlugin from '@fullcalendar/daygrid'; // Plugin untuk tampilan month/dayGridMonth
import timeGridPlugin from '@fullcalendar/timegrid'; // Plugin untuk tampilan week/day
import idLocale from '@fullcalendar/core/locales/id'; // Locale bahasa Indonesia

import WorkScheduleServices from '../Services/WorkScheduleServices.js';


document.addEventListener('DOMContentLoaded', () => {
    let calendar; // Variabel untuk menyimpan instance kalender

    // Fungsi untuk Mengambil dan Merender Event ke FullCalendar
    const fetchMySchedules = async (info = null) => {
        try {
            // FullCalendar secara otomatis memberikan range tanggal yang terlihat
            // Saat ini, endpoint GetMyWorkSchedules tidak mendukung filter tanggal dari FE.
            // Jika backend diubah untuk mendukung filter tanggal, Anda bisa passing info.startStr dan info.endStr.
            // Untuk saat ini, kita hanya akan memanggil getMyWorkSchedules tanpa filter tambahan.
            const response = await WorkScheduleServices.getMyWorkSchedules();
            const schedules = response.data;

            // Bersihkan event yang ada di kalender
            if (calendar) {
                calendar.removeAllEvents();
            }

            // Tambahkan event baru dari data backend
            const events = schedules.map(s => ({
                id: s.id, // ID event
                title: `${s.start_time}-${s.end_time}`, // Judul event di kalender
                start: `${s.date}T${s.start_time}`,
                end: `${s.date}T${s.end_time}`,
                extendedProps: { // Data tambahan yang ingin disimpan dengan event (opsional)
                    note: s.note
                },
                // Atur warna event, dll.
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

    // Inisialisasi FullCalendar
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
        
        // Panggil fetchMySchedules setiap kali view berubah atau navigasi
        datesSet: (info) => {
            fetchMySchedules(info);
        },

        // Opsional: Untuk menampilkan detail event ketika diklik (hanya display)
        eventClick: (info) => {
            const event = info.event;
            const eventDetails = `
                **Jadwal:** ${event.start.toLocaleDateString('id-ID')}
                **Waktu:** ${event.start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${event.end ? event.end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Tidak ada waktu selesai'}
                **Catatan:** ${event.extendedProps.note || '-'}
            `;
            showAlert(eventDetails, 'info', 5000); // Tampilkan detail sebagai alert sementara
        },
        
        // Anda bisa menambahkan tooltip pada event untuk detail lebih lanjut
        eventDidMount: function(info) {
            // Contoh sederhana: menambah title tooltip
            info.el.title = `${info.event.title}\nCatatan: ${info.event.extendedProps.note || '-'}`;
        }
    });

    calendar.render(); // Render kalender setelah inisialisasi
});