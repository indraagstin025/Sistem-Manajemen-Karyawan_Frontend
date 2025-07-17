// js/utils/darkmode.js

/**
 * Menerapkan tema terang atau gelap ke halaman berdasarkan waktu saat ini.
 * Tema gelap diterapkan antara jam 18:00 (6 PM) hingga 06:00 (6 AM).
 * Mode ini juga menyimpan preferensi mode (dark/light) ke localStorage
 * jika pengguna mengubahnya secara manual melalui toggle button.
 */

// Konstanta untuk waktu mulai dan berakhir dark mode
const DARK_MODE_START_HOUR = 18; // 6 PM
const DARK_MODE_END_HOUR = 6;    // 6 AM

/**
 * Menentukan apakah saat ini seharusnya dark mode aktif berdasarkan waktu.
 * @returns {boolean} True jika dark mode harus aktif, false jika tidak.
 */
function shouldApplyDarkModeByTime() {
  const now = new Date();
  const currentHour = now.getHours();

  // Dark mode aktif jika jam saat ini antara waktu mulai dark mode
  // dan waktu berakhir dark mode (misal: 18, 19, ..., 23, 0, 1, ..., 5)
  if (DARK_MODE_START_HOUR > DARK_MODE_END_HOUR) {
    // Jika rentang dark mode melewati tengah malam (contoh 18:00 - 06:00)
    return currentHour >= DARK_MODE_START_HOUR || currentHour < DARK_MODE_END_HOUR;
  } else {
    // Jika rentang dark mode tidak melewati tengah malam (contoh 08:00 - 17:00, meskipun ini untuk light mode)
    return currentHour >= DARK_MODE_START_HOUR && currentHour < DARK_MODE_END_HOUR;
  }
}

/**
 * Menerapkan tema gelap atau terang ke elemen root HTML.
 * @param {boolean} isDark - True untuk dark mode, false untuk light mode.
 */
function applyTheme(isDark) {
  const htmlElement = document.documentElement; // Mengambil elemen <html>
  if (isDark) {
    htmlElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
  }
}

/**
 * Menginisialisasi mode tema saat halaman dimuat.
 * Prioritas:
 * 1. Preferensi pengguna yang disimpan di localStorage.
 * 2. Mode berdasarkan waktu saat ini.
 */
function initTheme() {
  const storedTheme = localStorage.getItem('theme');

  if (storedTheme) {
    // Jika ada preferensi pengguna di localStorage, gunakan itu
    applyTheme(storedTheme === 'dark');
  } else {
    // Jika tidak ada preferensi, tentukan berdasarkan waktu
    applyTheme(shouldApplyDarkModeByTime());
  }
}

/**
 * Mengubah tema secara manual (misal: dari tombol toggle).
 * Ini juga akan menyimpan preferensi pengguna ke localStorage.
 */
function toggleTheme() {
  const htmlElement = document.documentElement;
  const isCurrentlyDark = htmlElement.classList.contains('dark');

  if (isCurrentlyDark) {
    htmlElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    htmlElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}

// Ekspor fungsi yang dibutuhkan agar bisa diakses dari file lain
export { initTheme, toggleTheme, applyTheme, shouldApplyDarkModeByTime };