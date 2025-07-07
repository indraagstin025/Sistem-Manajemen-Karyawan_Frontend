import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";
import Toastify from 'toastify-js'; // Tambahkan ini
import 'toastify-js/src/toastify.css'; // Tambahkan ini

document.addEventListener("DOMContentLoaded", () => {
  // Panggil Feather Icons untuk merender ikon
  feather.replace();

  // --- Seleksi Elemen DOM ---
  // Hapus seleksi elemen pesan lama karena kita akan pakai Toastify
  // const employeeDashboardError = document.getElementById("employeeDashboardError");
  // const employeeDashboardSuccess = document.getElementById("employeeDashboardSuccess");
  const profilePhoto = document.getElementById("profilePhoto");
  const employeeName = document.getElementById("employeeName");
  const employeePosition = document.getElementById("employeePosition");
  const employeeDepartment = document.getElementById("employeeDepartment");
  const todayAttendanceStatus = document.getElementById("todayAttendanceStatus");
  const remainingLeave = document.getElementById("remainingLeave");
  const userAvatarNav = document.getElementById("userAvatar"); // Avatar di header
  const dropdownMenu = document.getElementById("dropdownMenu"); // Dropdown menu itu sendiri
  const userDropdownContainer = document.getElementById("userDropdown"); // Container yang membungkus avatar dan dropdown
  const logoutButtons = document.querySelectorAll(".logout-button, #dropdownLogoutButton"); // Target semua tombol logout (sidebar dan dropdown)
  // Tambahkan seleksi tombol logout di sidebar jika ada ID unik
  const sidebarLogoutButton = document.getElementById("logoutButton"); // Asumsi ada ID 'logoutButton' di sidebar
  const mobileSidebarLogoutButton = document.getElementById("mobileLogoutButton"); // Asumsi ada ID 'mobileLogoutButton' di sidebar mobile

  // --- Fungsi Utilitas (Ganti showGlobalMessage dengan showToast) ---
  const showToast = (message, type = "success") => {
    let backgroundColor;
    if (type === "success") {
      backgroundColor = "linear-gradient(to right, #22c55e, #16a34a)"; // Tailwind green-500 ke green-700
    } else if (type === "error") {
      backgroundColor = "linear-gradient(to right, #ef4444, #dc2626)"; // Tailwind red-500 ke red-700
    } else {
      backgroundColor = "linear-gradient(to right, #3b82f6, #2563eb)"; // Tailwind blue-500 ke blue-700
    }

    Toastify({
      text: message,
      duration: 3000,
      close: true,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
      style: {
        background: backgroundColor,
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding: "12px 20px"
      },
    }).showToast();
  };

  // --- Logika Utama ---

  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Sesi tidak valid. Mengarahkan ke halaman login...", "error"); // Ganti showGlobalMessage
        setTimeout(() => authService.logout(), 2000);
        return;
      }

      // 1. Ambil objek 'user' dari localStorage
      const userString = localStorage.getItem("user");
      if (!userString) {
        throw new Error("Data pengguna tidak ditemukan di sesi.");
      }
      
      // 2. Parse string JSON menjadi objek, tambahkan try-catch untuk parsing
      let user;
      try {
          user = JSON.parse(userString);
      } catch (e) {
          console.error("Error parsing user from localStorage:", e);
          throw new Error("Data pengguna di sesi rusak.");
      }
      
      // 3. Cek peran dari objek yang sudah di-parse
      if (user.role !== 'karyawan') {
        throw new Error("Peran tidak sesuai untuk mengakses halaman ini.");
      }
      
      // 4. Gunakan 'user.id' dari objek untuk mengambil data detail
      const employeeData = await userService.getUserByID(user.id, token);
      
      if (employeeData) {
        // Tampilkan data ke elemen HTML
        profilePhoto.src = employeeData.photo || "https://via.placeholder.com/80/4A5568/E2E8F0?text=ME";
        employeeName.textContent = employeeData.name;
        employeePosition.textContent = employeeData.position || "-";
        employeeDepartment.textContent = employeeData.department || "-";
        
        // Update avatar di navigasi juga
        if (userAvatarNav) {
            userAvatarNav.src = employeeData.photo || "https://via.placeholder.com/80/4A5568/E2E8F0?text=ME";
            userAvatarNav.alt = employeeData.name;
        }

        // Catatan: Data untuk status absensi dan sisa cuti perlu endpoint API sendiri
        todayAttendanceStatus.textContent = "Belum ada data"; // Ini perlu di-fetch dari API
        remainingLeave.textContent = `12 Hari`; // Contoh data statis, ini juga perlu di-fetch
      }

    } catch (error) {
      console.error("Error fetching employee data:", error);
      showToast(error.message || "Gagal memuat data profil.", "error"); // Ganti showGlobalMessage
      // Jika error terkait sesi/token, otomatis logout setelah 2 detik
      if (error.message.includes('token') || error.message.includes('sesi') || error.message.includes('Peran tidak sesuai') || error.message.includes('Data pengguna di sesi rusak')) {
        setTimeout(() => authService.logout(), 2000);
      }
    }
  };

  const setupUIEventListeners = () => {
    // Logika Dropdown User
    if (userAvatarNav && dropdownMenu && userDropdownContainer) {
      userAvatarNav.addEventListener("click", () => dropdownMenu.classList.toggle("active"));
      document.addEventListener("click", (event) => {
        if (!userDropdownContainer.contains(event.target)) {
          dropdownMenu.classList.remove("active");
        }
      });
    }

    // Logika Logout - Konsolidasi semua tombol logout
    // Pastikan ID atau kelas ini ada di HTML Anda
    const allLogoutButtons = document.querySelectorAll(".logout-button, #dropdownLogoutButton, #logoutButton, #mobileLogoutButton");

    allLogoutButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            event.preventDefault(); // Mencegah navigasi default link/button
            // Tampilkan konfirmasi logout
            showLogoutConfirmation();
        });
    });

    // Logika Sidebar Mobile (jika ada)
    const sidebarToggle = document.getElementById("sidebarToggle");
    const mobileSidebar = document.getElementById("mobileSidebar");
    const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
    const closeSidebar = document.getElementById("closeSidebar");

    if (sidebarToggle && mobileSidebar && mobileSidebarPanel && closeSidebar) {
        const showMobileSidebar = () => {
            mobileSidebar.classList.remove("hidden");
            setTimeout(() => {
                mobileSidebar.classList.add("opacity-100");
                mobileSidebarPanel.classList.remove("-translate-x-full");
            }, 10);
        };
        const hideMobileSidebar = () => {
            mobileSidebar.classList.remove("opacity-100");
            mobileSidebarPanel.classList.add("-translate-x-full");
            setTimeout(() => mobileSidebar.classList.add("hidden"), 300);
        };
        sidebarToggle.addEventListener("click", showMobileSidebar);
        closeSidebar.addEventListener("click", hideMobileSidebar);
        mobileSidebar.addEventListener("click", (event) => {
            if (event.target === mobileSidebar) hideMobileSidebar();
        });
    }
  };

  // Fungsi untuk menampilkan konfirmasi logout menggunakan Toastify (Baru)
  const showLogoutConfirmation = () => {
    const toastNode = document.createElement("div");
    toastNode.className = "flex flex-col items-center p-2";
    toastNode.innerHTML = `
      <p class="font-semibold text-white text-base mb-4">Anda yakin ingin keluar?</p>
      <div class="flex space-x-3">
        <button id="confirmLogoutBtn" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700">Ya, Keluar</button>
        <button id="cancelLogoutBtn" class="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600">Batal</button>
      </div>
    `;
    const toast = Toastify({ 
        node: toastNode, 
        duration: -1, // Durasi tak terbatas sampai ditutup manual
        gravity: "top", 
        position: "center", 
        close: true, // Ada tombol close otomatis
        style: { 
            background: "linear-gradient(to right, #4f46e5, #7c3aed)", 
            borderRadius: "12px",
            padding: "1rem" // Tambah padding biar lebih bagus
        } 
    }).showToast();

    // Event listener untuk tombol di dalam toast
    toastNode.querySelector("#confirmLogoutBtn").addEventListener("click", () => {
        authService.logout(); // Panggil logout dari authService
        toast.hideToast(); // Sembunyikan toast setelah konfirmasi
    });
    toastNode.querySelector("#cancelLogoutBtn").addEventListener("click", () => {
        toast.hideToast(); // Sembunyikan toast
    });
  };
  
  // --- Inisialisasi Halaman ---
  setupUIEventListeners();
  fetchEmployeeData();
});