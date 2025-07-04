import { authService } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMessageDiv = document.getElementById("errorMessage");

  if (!loginForm) {
    console.error('Login form tidak ditemukan. Pastikan ID "loginForm" benar.');
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    errorMessageDiv.textContent = "";
    errorMessageDiv.classList.add("hidden");

    try {
      const data = await authService.login(email, password);

      console.log("Login berhasil:", data);

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.user_id);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("isFirstLogin", data.is_first_login);

      if (data.role === "admin") {
        window.location.href = "/src/pages/Admin/admin_dashboard.html";
      } else {
        window.location.href = "/src/pages/Karyawan/employee_dashboard.html";
      }
    } catch (error) {
      console.error("Login gagal:", error);

      if (error.status === 400 && error.details) {
        const validationErrors = Array.isArray(error.details) ? error.details.map((err) => err.field + ": " + err.message).join("<br>") : error.details;
        errorMessageDiv.innerHTML = validationErrors || "Input tidak valid.";
      } else {
        errorMessageDiv.textContent = error.message || "Login gagal. Silakan coba lagi.";
      }
      errorMessageDiv.classList.remove("hidden");
    }
  });
});
