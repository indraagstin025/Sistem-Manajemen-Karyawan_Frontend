// js/Admin/ManageWorkSchedules.js
import { Calendar } from 'fullcalendar'; // Mengimpor Calendar utama dari package fullcalendar
import dayGridPlugin from '@fullcalendar/daygrid'; // Plugin untuk tampilan month/dayGridMonth
import timeGridPlugin from '@fullcalendar/timegrid'; // Plugin untuk tampilan week/day
import interactionPlugin from '@fullcalendar/interaction'; // Plugin untuk drag-and-drop, selection, dll.
import idLocale from '@fullcalendar/core/locales/id'; // Locale bahasa Indonesia

import WorkScheduleServices from '../Services/WorkScheduleServices.js';


document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen Modal dan Form ---
    const scheduleFormModal = document.getElementById('scheduleFormModal');
    const closeScheduleModalBtn = document.getElementById('closeScheduleModalBtn');
    const workScheduleForm = document.getElementById('workScheduleForm');
    const formModalTitle = document.getElementById('form-modal-title');
    const scheduleIdInput = document.getElementById('schedule-id');
    const userIdInput = document.getElementById('user-id');
    const scheduleDateInput = document.getElementById('schedule-date');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const noteInput = document.getElementById('note');
    const saveScheduleBtn = document.getElementById('save-schedule-btn');
    const cancelScheduleBtn = document.getElementById('cancel-schedule-btn');
    const deleteScheduleBtn = document.getElementById('delete-schedule-btn');

    let calendar; // Variabel untuk menyimpan instance kalender
    let currentEvent = null; // Untuk menyimpan event yang sedang diedit/dihapus

    // --- Fungsi Buka/Tutup Modal ---
    const openScheduleModal = (mode = 'create', event = null, dateInfo = null) => {
        scheduleFormModal.classList.add('active'); // Tampilkan overlay dan modal
        userIdInput.readOnly = false; // Defaultnya bisa diisi
        scheduleDateInput.readOnly = false; // Defaultnya bisa diisi
        deleteScheduleBtn.classList.add('hidden'); // Sembunyikan tombol delete default

        if (mode === 'create') {
            formModalTitle.textContent = 'Tambah Jadwal Kerja Baru';
            scheduleIdInput.value = '';
            userIdInput.value = '';
            noteInput.value = '';
            // Set tanggal dari klik tanggal di kalender
            if (dateInfo) {
                scheduleDateInput.value = dateInfo.dateStr;
                startTimeInput.value = '09:00'; // Default jam mulai
                endTimeInput.value = '17:00'; // Default jam selesai
            } else {
                scheduleDateInput.value = '';
                startTimeInput.value = '';
                endTimeInput.value = '';
            }
        } else if (mode === 'edit' && event) {
            formModalTitle.textContent = 'Edit Jadwal Kerja';
            scheduleIdInput.value = event.id;
            userIdInput.value = event.extendedProps.userId;
            userIdInput.readOnly = true; // User ID tidak bisa diubah saat edit
            scheduleDateInput.value = event.start.toISOString().split('T')[0]; // Tanggal dari event
            scheduleDateInput.readOnly = true; // Tanggal tidak bisa diubah saat edit
            startTimeInput.value = event.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            endTimeInput.value = event.end ? event.end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
            noteInput.value = event.extendedProps.note || '';
            currentEvent = event; // Simpan event yang sedang diedit
            deleteScheduleBtn.classList.remove('hidden'); // Tampilkan tombol delete
        }
    };

    const closeScheduleModal = () => {
        scheduleFormModal.classList.remove('active');
        workScheduleForm.reset(); // Reset form
        currentEvent = null;
        feather.replace(); // Refresh ikon di modal setelah dibuka/tutup
    };

    // --- Event Listeners Modal ---
    closeScheduleModalBtn.addEventListener('click', closeScheduleModal);
    cancelScheduleBtn.addEventListener('click', closeScheduleModal);
    scheduleFormModal.addEventListener('click', (e) => {
        if (e.target === scheduleFormModal) { // Klik di luar modal content
            closeScheduleModal();
        }
    });

    // --- Fungsi untuk Mengambil dan Merender Event ke FullCalendar ---
    const fetchAndRenderSchedules = async (info = null) => {
        try {
            let filters = {};
            if (info) { // FullCalendar secara otomatis memberikan range tanggal yang terlihat
                filters.start_date = info.startStr.split('T')[0];
                filters.end_date = info.endStr.split('T')[0];
            } else {
                // Untuk inisialisasi awal atau refresh tanpa info spesifik dari kalender
                // Gunakan rentang default jika kalender belum diinisialisasi
                // atau rentang aktif dari kalender jika sudah ada.
                if (calendar) {
                    const currentView = calendar.view;
                    filters.start_date = currentView.activeStart.toISOString().split('T')[0];
                    filters.end_date = currentView.activeEnd.toISOString().split('T')[0];
                } else {
                    // Default untuk kasus awal tanpa info dari FullCalendar
                    const today = new Date();
                    filters.start_date = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    filters.end_date = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                }
            }
            // Tambahkan filter User ID jika ada inputnya
            const filterUserIdVal = document.getElementById('filter-user-id') ? document.getElementById('filter-user-id').value : '';
            if (filterUserIdVal) {
                filters.user_id = filterUserIdVal;
            }


            const response = await WorkScheduleServices.getAllWorkSchedules(filters);
            const schedules = response.data;

            // Bersihkan event yang ada di kalender
            if (calendar) { // Pastikan kalender sudah diinisialisasi
                calendar.removeAllEvents();
            }


            // Tambahkan event baru dari data backend
            const events = schedules.map(s => ({
                id: s.id,
                title: `${s.start_time}-${s.end_time} (${s.user_id})`, // Judul event di kalender
                start: `${s.date}T${s.start_time}`,
                end: `${s.date}T${s.end_time}`,
                extendedProps: { // Data tambahan yang ingin disimpan dengan event
                    userId: s.user_id,
                    note: s.note
                },
                // Atur warna event, dll.
                backgroundColor: '#38b2ac', // Warna teal
                borderColor: '#38b2ac'
            }));
            if (calendar) {
                calendar.addEventSource(events); // Tambahkan semua event ke kalender
            }
        } catch (error) {
            console.error('Error fetching work schedules:', error);
            showAlert('Gagal memuat jadwal kerja.', 'error');
        }
    };

    // --- Inisialisasi FullCalendar ---
    const calendarEl = document.getElementById('calendar');
    calendar = new Calendar(calendarEl, {
        plugins: [ dayGridPlugin, timeGridPlugin, interactionPlugin ], // Daftarkan plugin
        initialView: 'dayGridMonth', // Tampilan awal: bulan
        locale: idLocale, // Set bahasa ke Indonesia dari modul impor
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        editable: true, // Memungkinkan event bisa di-drag & resize
        selectable: true, // Memungkinkan seleksi tanggal
        eventDisplay: 'block', // Event selalu ditampilkan sebagai block
        
        // Panggil fetchAndRenderSchedules setiap kali view berubah atau navigasi
        datesSet: (info) => {
            fetchAndRenderSchedules(info);
        },

        // --- Callback untuk interaksi pengguna ---

        // Ketika tanggal dipilih (klik-drag)
        select: (info) => {
            const selectedDate = info.startStr.split('T')[0];
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const currentDay = currentDate.getDate().toString().padStart(2, '0');
            const today = `${currentYear}-${currentMonth}-${currentDay}`;

            if (selectedDate < today) {
                showAlert('Tidak bisa membuat jadwal di tanggal yang sudah lewat!', 'warning');
                calendar.unselect();
                return;
            }
            openScheduleModal('create', null, info);
            calendar.unselect(); // Clear the selection
        },

        // Ketika event diklik
        eventClick: (info) => {
            // info.event adalah objek Event dari FullCalendar
            openScheduleModal('edit', info.event); // Buka modal untuk edit jadwal
        },

        // Ketika event di-drag dan di-drop (berubah tanggal/waktu)
        eventDrop: async (info) => {
            const event = info.event;
            const newDate = event.start.toISOString().split('T')[0];
            const newStartTime = event.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const newEndTime = event.end ? event.end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : newStartTime; // Jika end null

            const scheduleData = {
                user_id: event.extendedProps.userId, // User ID tidak berubah
                date: newDate,
                start_time: newStartTime,
                end_time: newEndTime,
                note: event.extendedProps.note || ''
            };

            try {
                await WorkScheduleServices.updateWorkSchedule(event.id, scheduleData);
                showAlert('Jadwal berhasil diperbarui!', 'success');
            } catch (error) {
                console.error('Error updating work schedule via drag-and-drop:', error);
                showAlert('Gagal memperbarui jadwal: ' + (error.response?.data?.error || error.message), 'error');
                info.revert(); // Kembalikan event ke posisi semula jika gagal
            }
        },

        // Ketika event di-resize (berubah durasi)
        eventResize: async (info) => {
            const event = info.event;
            const newStartTime = event.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const newEndTime = event.end ? event.end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : newStartTime;

            const scheduleData = {
                user_id: event.extendedProps.userId, // User ID tidak berubah
                date: event.start.toISOString().split('T')[0], // Tanggal tidak berubah
                start_time: newStartTime,
                end_time: newEndTime,
                note: event.extendedProps.note || ''
            };

            try {
                await WorkScheduleServices.updateWorkSchedule(event.id, scheduleData);
                showAlert('Durasi jadwal berhasil diperbarui!', 'success');
            } catch (error) {
                console.error('Error updating work schedule via resize:', error);
                showAlert('Gagal memperbarui durasi jadwal: ' + (error.response?.data?.error || error.message), 'error');
                info.revert(); // Kembalikan event ke ukuran semula jika gagal
            }
        }
    });

    calendar.render(); // Render kalender setelah inisialisasi

    // --- Event Listener untuk Submit Form Modal ---
    workScheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const scheduleData = {
            user_id: userIdInput.value,
            date: scheduleDateInput.value,
            start_time: startTimeInput.value,
            end_time: endTimeInput.value,
            note: noteInput.value,
        };

        try {
            if (scheduleIdInput.value) { // Mode Edit
                await WorkScheduleServices.updateWorkSchedule(scheduleIdInput.value, scheduleData);
                showAlert('Jadwal kerja berhasil diperbarui!', 'success');
            } else { // Mode Create
                const createdSchedule = await WorkScheduleServices.createWorkSchedule(scheduleData);
                showAlert('Jadwal kerja berhasil ditambahkan!', 'success');
                // Tambahkan event baru ke kalender secara langsung setelah berhasil dibuat
                calendar.addEvent({
                    id: createdSchedule.data.id,
                    title: `${createdSchedule.data.start_time}-${createdSchedule.data.end_time} (${createdSchedule.data.user_id})`,
                    start: `${createdSchedule.data.date}T${createdSchedule.data.start_time}`,
                    end: `${createdSchedule.data.date}T${createdSchedule.data.end_time}`,
                    extendedProps: {
                        userId: createdSchedule.data.user_id,
                        note: createdSchedule.data.note
                    },
                    backgroundColor: '#38b2ac',
                    borderColor: '#38b2ac'
                });
            }
            closeScheduleModal();
            // fetchAndRenderSchedules(); // Tidak perlu panggil di sini, addEvent sudah cukup atau datesSet akan memanggilnya
        } catch (error) {
            console.error('Error saving work schedule:', error);
            showAlert('Gagal menyimpan jadwal kerja. ' + (error.response?.data?.error || error.message), 'error');
        }
    });

    // --- Event Listener untuk Tombol Hapus di Modal ---
    deleteScheduleBtn.addEventListener('click', async () => {
        if (currentEvent && confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
            try {
                await WorkScheduleServices.deleteWorkSchedule(currentEvent.id);
                currentEvent.remove(); // Hapus event dari kalender
                showAlert('Jadwal kerja berhasil dihapus!', 'success');
                closeScheduleModal();
            } catch (error) {
                console.error('Error deleting work schedule:', error);
                showAlert('Gagal menghapus jadwal kerja. ' + (error.response?.data?.error || error.message), 'error');
            }
        }
    });

    // --- Event Listener untuk Tombol "Tambah Jadwal Baru" (di luar kalender) ---
    // Tombol ini tidak lagi ada di HTML yang baru, tetapi jika Anda tambahkan lagi di masa depan,
    // ini adalah cara mengaktifkannya.
    // const addScheduleBtn = document.getElementById('add-schedule-btn');
    // if (addScheduleBtn) {
    //     addScheduleBtn.addEventListener('click', () => openScheduleModal('create'));
    // }

    // --- Event Listener untuk Filter User ID ---
    const filterUserIdInput = document.getElementById('filter-user-id'); // Pastikan ini ada di HTML jika ingin filter
    const applyFilterBtn = document.getElementById('apply-filter'); // Pastikan ini ada di HTML jika ingin filter

    // Jika filterUserIdInput dan applyFilterBtn ada di HTML
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            // Panggil refetchEvents() dari instance kalender agar FullCalendar meminta ulang event
            // dan secara otomatis akan memicu datesSet, yang memanggil fetchAndRenderSchedules.
            calendar.refetchEvents();
        });
    } else {
        // Jika filterUserIdInput dan applyFilterBtn tidak ada di halaman ini,
        // hapus section filter di manage_work_schedules.html atau tambahkan kembali.
        // Saat ini, di HTML yang saya berikan di atas, bagian filter User ID sudah saya hapus
        // agar fokus ke tampilan kalender utama. Jika Anda ingin mengembalikan filter,
        // pastikan elemen input dan tombolnya ada di HTML.
    }
});