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
  submitButton.disabled = !allValid;

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
    if (this.value.length < 6) {
      validationState.password = false;
      errorDiv.textContent = "Password minimal 6 karakter.";
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
