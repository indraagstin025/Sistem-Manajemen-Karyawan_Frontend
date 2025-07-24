let validationState = {
  name: false,
  email: false,
  password: false,
  position: false,
  department: false,
  salary: false,
};

function updateSubmitButton() {
  const submitButton = document.getElementById("submitButton");
  if (!submitButton) return;

  const allValid = Object.values(validationState).every((valid) => valid);

  // Hapus logika yang menonaktifkan tombol
  if (!allValid) {
    submitButton.classList.add("bg-gray-400", "cursor-not-allowed");
    submitButton.classList.remove("bg-teal-600", "hover:bg-teal-700");
  } else {
    submitButton.classList.remove("bg-gray-400", "cursor-not-allowed");
    submitButton.classList.add("bg-teal-600", "hover:bg-teal-700");
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateName(name) {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
}

function validatePassword(password) {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return password.length >= minLength && hasUppercase && hasLowercase && hasNumber;
}

/**
 * Fungsi ini diekspor untuk menginisialisasi semua event listener validasi.
 * Panggil fungsi ini sekali saat halaman dimuat.
 */
export function initializeFormValidation() {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const positionInput = document.getElementById("position");
  const departmentSelect = document.getElementById("department");
  const salaryInput = document.getElementById("base_salary");

  nameInput?.addEventListener("input", function () {
    const errorDiv = document.getElementById("nameError");
    if (!validateName(this.value)) {
      validationState.name = false;
      errorDiv.textContent = "Nama harus minimal 2 karakter dan hanya huruf.";
      errorDiv.classList.remove("hidden");
    } else {
      validationState.name = true;
      errorDiv.classList.add("hidden");
    }
    updateSubmitButton();
  });

  emailInput?.addEventListener("input", function () {
    const errorDiv = document.getElementById("emailError");
    if (!validateEmail(this.value)) {
      validationState.email = false;
      errorDiv.textContent = "Format email tidak valid.";
      errorDiv.classList.remove("hidden");
    } else {
      validationState.email = true;
      errorDiv.classList.add("hidden");
    }
    updateSubmitButton();
  });

  passwordInput?.addEventListener("input", function () {
    const errorDiv = document.getElementById("passwordError");
    if (!validatePassword(this.value)) {
      validationState.password = false;
      errorDiv.textContent = "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.";
      errorDiv.classList.remove("hidden");
    } else {
      validationState.password = true;
      errorDiv.classList.add("hidden");
    }
    updateSubmitButton();
  });

  positionInput?.addEventListener("input", function () {
    const errorDiv = document.getElementById("positionError");
    if (this.value.trim().length < 2) {
      validationState.position = false;
      errorDiv.textContent = "Posisi wajib diisi.";
      errorDiv.classList.remove("hidden");
    } else {
      validationState.position = true;
      errorDiv.classList.add("hidden");
    }
    updateSubmitButton();
  });

  departmentSelect?.addEventListener("change", function () {
    const errorDiv = document.getElementById("departmentError");
    if (!this.value) {
      validationState.department = false;
      errorDiv.textContent = "Departemen wajib dipilih.";
      errorDiv.classList.remove("hidden");
    } else {
      validationState.department = true;
      errorDiv.classList.add("hidden");
    }
    updateSubmitButton();
  });

  salaryInput?.addEventListener("input", function () {
    const errorDiv = document.getElementById("salaryError");
    const salary = parseFloat(this.value);
    if (isNaN(salary) || salary < 1) {
      validationState.salary = false;
      errorDiv.textContent = "Gaji harus angka positif.";
      errorDiv.classList.remove("hidden");
    } else {
      validationState.salary = true;
      errorDiv.classList.add("hidden");
    }
    updateSubmitButton();
  });

  updateSubmitButton();
}

/**
 * Fungsi ini diekspor untuk memeriksa apakah seluruh form sudah valid.
 * Akan digunakan oleh AddEmployee.js sebelum mengirim data ke API.
 * @returns {boolean} - true jika semua valid, false jika ada yang tidak valid.
 */
export function isFormValid() {
  return Object.values(validationState).every((valid) => valid);
}

/**
 * Fungsi ini diekspor untuk mendapatkan pesan error dari setiap field yang tidak valid.
 * Pesan error ini dapat ditampilkan di UI sesuai kebutuhan.
 * @returns {string[]} - Array yang berisi pesan-pesan error.
 */
export function getValidationErrors() {
  const errors = [];
  if (!validationState.name) errors.push("Nama harus minimal 2 karakter dan hanya huruf.");
  if (!validationState.email) errors.push("Format email tidak valid.");
  if (!validationState.password) errors.push("Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.");
  if (!validationState.position) errors.push("Posisi wajib diisi.");
  if (!validationState.department) errors.push("Departemen wajib dipilih.");
  if (!validationState.salary) errors.push("Gaji harus angka positif.");
  return errors;
}
