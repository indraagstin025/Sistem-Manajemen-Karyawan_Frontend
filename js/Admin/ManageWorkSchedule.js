import { Calendar } from "fullcalendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import idLocale from "@fullcalendar/core/locales/id";
import WorkScheduleServices from "../Services/WorkScheduleServices.js";
import { authService } from "../Services/AuthServices.js";
import { initializeSidebar } from "../components/sidebarHandler.js";
import { initializeLogout } from "../components/logoutHandler.js";
import { QRCodeManager } from "../components/qrCodeHandler.js";
import { getUserPhotoBlobUrl } from "../utils/photoUtils.js"; // Import getUserPhotoBlobUrl
import Swal from 'sweetalert2';
import Toastify from 'toastify-js';

document.addEventListener("DOMContentLoaded", async () => {
    feather.replace();
    initializeSidebar();
    initializeLogout({
        preLogoutCallback: () => {
            if (typeof QRCodeManager !== 'undefined' && QRCodeManager.close) {
                QRCodeManager.close();
            }
        }
    });

    QRCodeManager.initialize({
        toastCallback: (message, type) => {
            let backgroundColor;
            if (type === "success") {
                backgroundColor = "linear-gradient(to right, #22c55e, #16a34a)";
            } else if (type === "error") {
                backgroundColor = "linear-gradient(to right, #ef4444, #dc2626)";
            } else {
                backgroundColor = "linear-gradient(to right, #3b82f6, #2563eb)";
            }

            Toastify({
                text: message,
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                style: { background: backgroundColor, borderRadius: "8px" },
            }).showToast();
        },
    });

    const scheduleFormModal = document.getElementById("scheduleFormModal");
    const closeScheduleModalBtn = document.getElementById("closeScheduleModalBtn");
    const workScheduleForm = document.getElementById("workScheduleForm");
    const formModalTitle = document.getElementById("form-modal-title");
    const scheduleIdInput = document.getElementById("schedule-id");
    const scheduleDateInput = document.getElementById("schedule-date");
    const startTimeInput = document.getElementById("start-time");
    const endTimeInput = document.getElementById("end-time");
    const noteInput = document.getElementById("note");
    const saveScheduleBtn = document.getElementById("save-schedule-btn");
    const cancelScheduleBtn = document.getElementById("cancel-schedule-btn");
    const deleteScheduleBtn = document.getElementById("delete-schedule-btn");
    const manualAddScheduleBtn = document.getElementById("manualAddScheduleBtn");

    const recurrenceFreqInput = document.getElementById("recurrence-freq");
    const weeklyOptionsDiv = document.getElementById("weekly-options");
    const weekdayCheckboxes = document.querySelectorAll(".weekday-checkbox");
    const recurrenceUntilInput = document.getElementById("recurrence-until");

    const userAvatarNav = document.getElementById('userAvatar');
    const userNameNav = document.getElementById('userNameNav'); // Make sure this element exists in your HTML
    const userDropdownContainer = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');

    let calendar;

    const showSweetAlert = (title, message, icon = "success", showConfirmButton = false, timer = 2000) => {
        Swal.fire({
            title: title,
            html: message,
            icon: icon,
            showConfirmButton: showConfirmButton,
            timer: timer,
            timerProgressBar: true,
            didOpen: (toast) => {
                if (timer > 0) {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            }
        });
    };

    // --- Updated loadUserProfile to use getUserPhotoBlobUrl ---
    const loadUserProfile = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user && user.role === 'admin') { // Ensure it's an admin
                // Use getUserPhotoBlobUrl for the admin's header avatar
                const photoUrl = await getUserPhotoBlobUrl(user.id, user.name, 40); // 40x40 for header avatar
                if (userAvatarNav) {
                    userAvatarNav.src = photoUrl;
                    userAvatarNav.alt = user.name || "Admin";
                }
                if (userNameNav) { // Update username in header as well
                    userNameNav.textContent = user.name || "Admin";
                }
            } else {
                // Fallback for non-admin or no user
                if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png"; // Or a generic admin placeholder
                if (userNameNav) userNameNav.textContent = "Guest";
            }
        } catch (error) {
            console.error("Failed to load admin profile for header:", error);
            if (userAvatarNav) userAvatarNav.src = "/assets/default-avatar.png";
            if (userNameNav) userNameNav.textContent = "Error";
        }
    };
    // --- End loadUserProfile update ---


    recurrenceFreqInput.addEventListener("change", () => {
        if (recurrenceFreqInput.value === "WEEKLY") {
            weeklyOptionsDiv.classList.remove("hidden");
        } else {
            weeklyOptionsDiv.classList.add("hidden");
            weekdayCheckboxes.forEach(cb => cb.checked = false);
        }
    });

    const generateRecurrenceRule = () => {
        const freq = recurrenceFreqInput.value;
        if (freq === "NONE") return "";

        let rule = `FREQ=${freq}`;
        if (freq === "WEEKLY") {
            const selectedDays = Array.from(weekdayCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            if (selectedDays.length === 0) {
                showSweetAlert("Validation Failed", "Please select at least one day for weekly schedule.", "warning");
                return "";
            }
            rule += `;BYDAY=${selectedDays.join(",")}`;
        }
        if (recurrenceUntilInput.value) {
            const untilDate = recurrenceUntilInput.value.replace(/-/g, "");
            rule += `;UNTIL=${untilDate}T235959Z`;
        }
        return rule;
    };

    const openScheduleModal = (mode = "create", scheduleRule = null) => {
        scheduleFormModal.classList.remove("hidden");
        setTimeout(() => scheduleFormModal.classList.add("active"), 10);

        deleteScheduleBtn.classList.add("hidden");

        if (mode === "create") {
            formModalTitle.textContent = "Add Work Schedule";
            workScheduleForm.reset();
            weeklyOptionsDiv.classList.add("hidden");
            scheduleIdInput.value = "";
            scheduleDateInput.value = new Date().toISOString().split('T')[0];
            startTimeInput.value = "09:00";
            endTimeInput.value = "17:00";
            weekdayCheckboxes.forEach(cb => cb.checked = false);
            recurrenceFreqInput.value = "NONE";
            recurrenceUntilInput.value = "";
        } else if (mode === "edit" && scheduleRule) {
            formModalTitle.textContent = "Edit Work Schedule Rule";
            scheduleIdInput.value = scheduleRule.id;
            scheduleDateInput.value = scheduleRule.date;
            startTimeInput.value = scheduleRule.start_time.substring(0, 5);
            endTimeInput.value = scheduleRule.end_time.substring(0, 5);
            noteInput.value = scheduleRule.note || '';

            const ruleParts = scheduleRule.recurrence_rule ? scheduleRule.recurrence_rule.split(';') : [];
            let freq = 'NONE';
            let byDay = [];
            let until = '';

            ruleParts.forEach(part => {
                if (part.startsWith('FREQ=')) {
                    freq = part.replace('FREQ=', '');
                } else if (part.startsWith('BYDAY=')) {
                    byDay = part.replace('BYDAY=', '').split(',');
                } else if (part.startsWith('UNTIL=')) {
                    until = part.replace('UNTIL=', '').substring(0, 8);
                }
            });

            recurrenceFreqInput.value = freq;
            if (freq === 'WEEKLY') {
                weeklyOptionsDiv.classList.remove('hidden');
                weekdayCheckboxes.forEach(cb => {
                    cb.checked = byDay.includes(cb.value);
                });
            } else {
                weeklyOptionsDiv.classList.add('hidden');
                weekdayCheckboxes.forEach(cb => cb.checked = false);
            }
            recurrenceUntilInput.value = until ? `${until.substring(0,4)}-${until.substring(4,6)}-${until.substring(6,8)}` : '';

            deleteScheduleBtn.classList.remove("hidden");
        }
    };

    const closeScheduleModal = () => {
        scheduleFormModal.classList.remove("active");
        setTimeout(() => {
            scheduleFormModal.classList.add("hidden");
            workScheduleForm.reset();
        }, 300);
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
        displayEventTime: false,
        eventSources: [
            {
                events: async (info) => {
                    try {
                        const filters = {
                            start_date: info.startStr.split("T")[0],
                            end_date: info.endStr.split("T")[0],
                        };
                        const response = await WorkScheduleServices.getAllWorkSchedules(filters);

                        return (response.data || []).map(s => ({
                            id: s.id,
                            title: `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`,
                            start: s.date,
                            extendedProps: {
                                start_time: s.start_time,
                                end_time: s.end_time,
                                note: s.note,
                                recurrence_rule: s.recurrence_rule,
                            },
                            allDay: true,
                            color: '#38b2ac',
                            textColor: 'white',
                            display: 'block',
                        }));
                    } catch (error) {
                        console.error("Error fetching work schedules:", error);
                        showSweetAlert('Error Fetching Schedules', `Failed to load work schedules: ${error.message || "An error occurred."}`, 'error', true);
                        if (error.status === 401 || error.status === 403) {
                            setTimeout(() => authService.logout(), 2000);
                        }
                        return [];
                    }
                },
                color: '#38b2ac',
                textColor: 'white',
            },

            {
                events: async (info) => {
                    try {
                        const year = info.start.getFullYear();
                        const holidays = await WorkScheduleServices.getHolidays(year);
                        return (holidays || []).map(holiday => ({
                            title: holiday.Name,
                            start: holiday.Date,
                            allDay: true,
                            display: 'background',
                            color: '#ff9f89',
                        }));
                    } catch (error) {
                        console.error("Error fetching holidays:", error);
                        showSweetAlert('Error Fetching Holidays', `Failed to load holidays: ${error.message || "An error occurred."}`, 'error', true);
                        return [];
                    }
                }
            }
        ],

        select: (info) => {
            openScheduleModal("create");
            scheduleDateInput.value = info.startStr.split("T")[0];
            calendar.unselect();
        },
        eventClick: async (info) => {
            const scheduleRuleId = info.event.id;

            if (info.event.display === 'background') {
                showSweetAlert('Holiday Info', `Holiday: ${info.event.title}`, 'info');
                return;
            }

            try {
                const response = await WorkScheduleServices.getWorkScheduleById(scheduleRuleId);
                const scheduleRule = response.data;

                if (scheduleRule) {
                    openScheduleModal("edit", scheduleRule);
                } else {
                    showSweetAlert("Data Not Found", "Schedule details not found.", "error");
                }

            } catch (error) {
                console.error("Error fetching schedule for edit:", error);
                showSweetAlert("Failed to Load Schedule", `Failed to load schedule details for editing: ${error.message || "An error occurred."}`, "error", true);
                if (error.status === 401 || error.status === 403) {
                    setTimeout(() => authService.logout(), 2000);
                }
            }
        },
    });

    calendar.render();

    manualAddScheduleBtn.addEventListener("click", () => openScheduleModal("create"));
    closeScheduleModalBtn.addEventListener("click", closeScheduleModal);
    cancelScheduleBtn.addEventListener("click", closeScheduleModal);

    const generateQrMenuBtn = document.getElementById("generate-qr-menu-btn");
    const generateQrMenuBtnMobile = document.getElementById("generate-qr-menu-btn-mobile");

    if (generateQrMenuBtn) {
        generateQrMenuBtn.addEventListener("click", () => QRCodeManager.open());
    }
    if (generateQrMenuBtnMobile) {
        generateQrMenuBtnMobile.addEventListener("click", () => {
            const mobileSidebar = document.getElementById("mobileSidebar");
            const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
            if (mobileSidebar && mobileSidebarPanel) {
                mobileSidebar.classList.remove("opacity-100");
                mobileSidebarPanel.classList.add("-translate-x-full");
                setTimeout(() => {
                    mobileSidebar.classList.add("hidden");
                }, 300);
            }
            QRCodeManager.open();
        });
    }

    if (userDropdownContainer) {
        userDropdownContainer.addEventListener("click", (event) => {
            event.stopPropagation();
            dropdownMenu.classList.toggle("active");
        });

        document.addEventListener("click", (event) => {
            if (!userDropdownContainer.contains(event.target)) {
                dropdownMenu.classList.remove("active");
            }
        });
    }

    workScheduleForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        saveScheduleBtn.disabled = true;

        const scheduleId = scheduleIdInput.value;
        const recurrenceRule = generateRecurrenceRule();

        if (recurrenceFreqInput.value === "WEEKLY" && !recurrenceRule) {
            saveScheduleBtn.disabled = false;
            return;
        }

        const payload = {
            date: scheduleDateInput.value,
            start_time: startTimeInput.value,
            end_time: endTimeInput.value,
            note: noteInput.value,
            recurrence_rule: recurrenceRule,
        };

        try {
            if (scheduleId) {
                await WorkScheduleServices.updateWorkSchedule(scheduleId, payload);
                showSweetAlert("Success!", "Work schedule rule successfully updated!", "success", false, 1500);
            } else {
                await WorkScheduleServices.createWorkSchedule(payload);
                showSweetAlert("Success!", "Work schedule rule successfully saved!", "success", false, 1500);
            }
            closeScheduleModal();
            calendar.refetchEvents(); // Refresh calendar events
        } catch (error) {
            console.error("Error saving/updating work schedule:", error);
            const errorMessage = error.response?.data?.error || error.message || "An error occurred while saving/updating the schedule.";
            showSweetAlert("Failed!", errorMessage, "error", true);
            if (error.status === 401 || error.status === 403) {
                setTimeout(() => authService.logout(), 2000);
            }
        } finally {
            saveScheduleBtn.disabled = false;
        }
    });

    deleteScheduleBtn.addEventListener("click", async () => {
        const scheduleId = scheduleIdInput.value;
        if (!scheduleId) return;

        Swal.fire({
            title: "Are you sure you want to delete?",
            text: "This schedule rule will be permanently deleted, including all future occurrences.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, Delete!",
            cancelButtonText: "Cancel"
        }).then(async (result) => {
            if (result.isConfirmed) {
                deleteScheduleBtn.disabled = true;
                try {
                    await WorkScheduleServices.deleteWorkSchedule(scheduleId);
                    showSweetAlert("Deleted!", "Work schedule rule successfully deleted!", "success", false, 1500);
                    closeScheduleModal();
                    calendar.refetchEvents(); // Refresh calendar events
                } catch (error) {
                    console.error("Error deleting work schedule:", error);
                    const errorMessage = error.response?.data?.error || error.message || "An error occurred while deleting the schedule.";
                    showSweetAlert("Failed!", errorMessage, "error", true);
                    if (error.status === 401 || error.status === 403) {
                        setTimeout(() => authService.logout(), 2000);
                    }
                } finally {
                    deleteScheduleBtn.disabled = false;
                }
            }
        });
    });

    // Call the function to load admin profile photo in the header
    loadUserProfile(); // Make sure this is called after DOMContentLoaded for all elements to be ready.
});