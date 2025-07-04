// src/js/Karyawan/EmployeeDashboard.js

import { userService } from "../Services/UserServices.js";
import { authService } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", async () => {
  feather.replace(); // Initialize Feather icons

  // Existing elements
  const employeeDashboardError = document.getElementById("employeeDashboardError");
  const employeeDashboardSuccess = document.getElementById("employeeDashboardSuccess");

  // User Profile Card elements (assuming they are dynamically filled)
  const profilePhoto = document.getElementById("profilePhoto");
  const employeeName = document.getElementById("employeeName");
  const employeePosition = document.getElementById("employeePosition");
  const employeeDepartment = document.getElementById("employeeDepartment");
  const todayAttendanceStatus = document.getElementById("todayAttendanceStatus");
  const remainingLeave = document.getElementById("remainingLeave");
  const employeeActivityList = document.getElementById("employeeActivityList");

  // NEW: Elemen untuk dropdown user di navbar
  const userDropdownContainer = document.getElementById("userDropdown"); // Kontainer untuk avatar dan dropdown
  const userAvatarNav = document.getElementById("userAvatar"); // Avatar yang bisa diklik
  const dropdownMenu = document.getElementById("dropdownMenu"); // Menu dropdown itu sendiri
  const dropdownLogoutButton = document.getElementById("dropdownLogoutButton"); // Tombol logout di dropdown

  // Mobile sidebar elements
  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileSidebar = document.getElementById("mobileSidebar");
  const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
  const closeSidebar = document.getElementById("closeSidebar");
  const mobileLogoutButton = document.getElementById("mobileLogoutButton");

  // --- Utility Functions (Keep as is or adapt from previous versions) ---
  const showGlobalMessage = (message, type = "success") => {
    employeeDashboardSuccess.classList.add("hidden");
    employeeDashboardError.classList.add("hidden");
    employeeDashboardSuccess.textContent = "";
    employeeDashboardError.textContent = "";

    if (type === "success") {
      employeeDashboardSuccess.textContent = message;
      employeeDashboardSuccess.classList.remove("hidden");
      employeeDashboardSuccess.classList.remove("text-red-600");
      employeeDashboardSuccess.classList.add("text-green-600");
    } else {
      employeeDashboardError.textContent = message;
      employeeDashboardError.classList.remove("hidden");
      employeeDashboardError.classList.remove("text-green-600");
      employeeDashboardError.classList.add("text-red-600");
    }
    setTimeout(() => {
      employeeDashboardSuccess.classList.add("hidden");
      employeeDashboardError.classList.add("hidden");
    }, 3000);
  };

  // showModalMessage function is no longer needed in Dashboard since modal is moved
  // const showModalMessage = (message, type = "success", targetErrorDiv, targetSuccessDiv) => {
  //     // ... (removed)
  // };

  // --- User Authentication and Data Loading (Example, adjust based on your actual services) ---
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    showGlobalMessage("Anda tidak terautentikasi. Silakan login ulang.", "error");
    setTimeout(() => (window.location.href = "/src/pages/login.html"), 2000);
    return;
  }

  // Example function to fetch employee data (replace with your actual API calls)
  const fetchEmployeeData = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");

      if (!userId || userRole !== 'karyawan') {
        showGlobalMessage("Data pengguna tidak lengkap atau peran tidak sesuai.", "error");
        return;
      }
      
      const employee = await userService.getUserByID(userId, authToken);
      console.log("Data Karyawan:", employee);

      // For now, using mock data if actual data is not fetched (REMOVE THIS IN PRODUCTION)
      const mockEmployeeData = {
        name: "Nama Karyawan",
        position: "Software Engineer",
        department: "IT",
        photo: "https://via.placeholder.com/80/4A5568/E2E8F0?text=NP", // Example profile picture
        attendanceStatus: "Hadir",
        remainingLeaveDays: 12,
      };

      profilePhoto.src = employee.photo || mockEmployeeData.photo;
      employeeName.textContent = employee.name || mockEmployeeData.name;
      employeePosition.textContent = employee.position || mockEmployeeData.position;
      employeeDepartment.textContent = employee.department || mockEmployeeData.department;
      todayAttendanceStatus.textContent = mockEmployeeData.attendanceStatus;
      remainingLeave.textContent = `${mockEmployeeData.remainingLeaveDays} Hari`;
      userAvatarNav.src = employee.photo || mockEmployeeData.photo; // Update navbar avatar too
      userAvatarNav.alt = employee.name || mockEmployeeData.name;

    } catch (error) {
      console.error("Error fetching employee data:", error);
      showGlobalMessage("Gagal memuat data profil. Silakan coba lagi.", "error");
      // Handle unauthorized or token expiry
      if (error.status === 401 || error.message.includes('token')) {
        authService.logout();
      }
    }
  };

  fetchEmployeeData(); // Load initial employee data

  // --- Dropdown User Navbar Logic ---
  if (userAvatarNav && dropdownMenu && userDropdownContainer) {
    // Toggle dropdown visibility
    userAvatarNav.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent click from immediately closing dropdown
      dropdownMenu.classList.toggle("active"); // Toggle 'active' class
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
      if (!userDropdownContainer.contains(event.target)) {
        dropdownMenu.classList.remove("active");
      }
    });

    // Prevent dropdown from closing when clicking inside it
    dropdownMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }


  // --- Change Password Modal Logic (REMOVED from this file) ---
  // All modal-related elements and logic have been removed from here.

  // --- Logout Logic ---
  const handleLogout = async (event) => {
    event.preventDefault();
    try {
      authService.logout(); // This service should handle token clearing and redirection
    } catch (error) {
      console.error("Logout failed:", error);
      showGlobalMessage("Gagal logout. Silakan coba lagi.", "error");
    }
  };

  if (document.getElementById("logoutButton")) {
    document.getElementById("logoutButton").addEventListener("click", handleLogout);
  }
  if (dropdownLogoutButton) {
    dropdownLogoutButton.addEventListener("click", handleLogout);
  }
  if (mobileLogoutButton) {
    mobileLogoutButton.addEventListener("click", handleLogout);
  }

  // --- Mobile Sidebar Logic ---
  if (sidebarToggle && mobileSidebar && mobileSidebarPanel && closeSidebar) {
    sidebarToggle.addEventListener("click", () => {
      mobileSidebar.classList.remove("hidden");
      setTimeout(() => {
        mobileSidebar.classList.add("opacity-100");
        mobileSidebarPanel.classList.remove("-translate-x-full");
      }, 10);
    });

    const hideMobileSidebar = () => {
      mobileSidebar.classList.remove("opacity-100");
      mobileSidebarPanel.classList.add("-translate-x-full");
      setTimeout(() => {
        mobileSidebar.classList.add("hidden");
      }, 300);
    };

    closeSidebar.addEventListener("click", hideMobileSidebar);

    mobileSidebar.addEventListener("click", (event) => {
      if (event.target === mobileSidebar) {
        hideMobileSidebar();
      }
    });
  }
});