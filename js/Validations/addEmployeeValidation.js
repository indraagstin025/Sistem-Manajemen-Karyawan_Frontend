let validationState = {
  name: false,
  email: false,
  password: false,
  position: false,
  department: false,
  salary: false,
};

/**
 * Fungsi untuk memformat angka menjadi format rupiah (dengan titik pemisah ribuan).
 * @param {number|string} angka - Angka yang akan diformat.
 * @returns {string} - Angka yang diformat sebagai string.
 */
function formatRupiah(angka) {
  let num = typeof angka === "string" ? parseFloat(angka.replace(/\D/g, "")) : angka;

  if (isNaN(num)) return "";

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Fungsi untuk membersihkan string dari format (titik, koma, dll.) menjadi angka murni.
 * @param {string} rupiahString - String yang akan dibersihkan.
 * @returns {number} - Angka murni (float).
 */
function parseRupiah(rupiahString) {
  const cleanedString = rupiahString.replace(/\D/g, "");
  return parseFloat(cleanedString);
}

function updateSubmitButton() {
  const submitButton = document.getElementById("submitButton");
  if (!submitButton) return;

  const allValid = Object.values(validationState).every((valid) => valid);

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

    let value = parseRupiah(this.value);

    if (isNaN(value) || value < 1) {
      validationState.salary = false;
      errorDiv.textContent = "Gaji harus angka positif.";
      errorDiv.classList.remove("hidden");
    } else {
      validationState.salary = true;
      errorDiv.classList.add("hidden");
    }

    const cursorPosition = this.selectionStart;
    const originalLength = this.value.length;

    const rawValue = this.value.replace(/\D/g, "");

    if (rawValue) {
      this.value = formatRupiah(parseFloat(rawValue));
    } else {
      this.value = "";
    }

    const newLength = this.value.length;

    this.selectionStart = this.selectionEnd = cursorPosition + (newLength - originalLength);

    updateSubmitButton();
  });

  salaryInput?.addEventListener("blur", function () {
    let value = parseRupiah(this.value);
    if (!isNaN(value) && value >= 1) {
      this.value = formatRupiah(value);
    } else if (this.value !== "") {
      this.value = "";
    }
    updateSubmitButton();
  });

  nameInput && (validationState.name = validateName(nameInput.value));
  emailInput && (validationState.email = validateEmail(emailInput.value));
  passwordInput && (validationState.password = validatePassword(passwordInput.value));
  positionInput && (validationState.position = positionInput.value.trim().length >= 2);
  departmentSelect && (validationState.department = !!departmentSelect.value);

  if (salaryInput) {
    const initialSalaryValue = parseRupiah(salaryInput.value || "");
    validationState.salary = !isNaN(initialSalaryValue) && initialSalaryValue >= 1;

    if (salaryInput.value && !isNaN(initialSalaryValue) && initialSalaryValue >= 1) {
      salaryInput.value = formatRupiah(initialSalaryValue);
    } else if (salaryInput.value) {
      salaryInput.value = "";
    }
  }

  updateSubmitButton();
}

/**
 * Fungsi ini diekspor untuk memeriksa apakah seluruh form sudah valid.
 * Akan digunakan oleh AddEmployee.js sebelum mengirim data ke API.
 * @returns {boolean} - true jika semua valid, false jika ada yang tidak valid.
 */
export function isFormValid() {
  getValidationErrors();
  return Object.values(validationState).every((valid) => valid);
}

/**
 * Fungsi ini diekspor untuk mendapatkan pesan error dari setiap field yang tidak valid.
 * Pesan error ini dapat ditampilkan di UI sesuai kebutuhan.
 * @returns {string[]} - Array yang berisi pesan-pesan error.
 */
export function getValidationErrors() {
  const errors = [];

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const positionInput = document.getElementById("position");
  const departmentSelect = document.getElementById("department");
  const salaryInput = document.getElementById("base_salary");

  if (!nameInput || !validateName(nameInput.value || "")) {
    errors.push("Nama harus minimal 2 karakter dan hanya huruf.");
    validationState.name = false;
  } else {
    validationState.name = true;
  }

  if (!emailInput || !validateEmail(emailInput.value || "")) {
    errors.push("Format email tidak valid.");
    validationState.email = false;
  } else {
    validationState.email = true;
  }

  if (!passwordInput || !validatePassword(passwordInput.value || "")) {
    errors.push("Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.");
    validationState.password = false;
  } else {
    validationState.password = true;
  }

  if (!positionInput || (positionInput.value || "").trim().length < 2) {
    errors.push("Posisi wajib diisi.");
    validationState.position = false;
  } else {
    validationState.position = true;
  }

  if (!departmentSelect || !departmentSelect.value) {
    errors.push("Departemen wajib dipilih.");
    validationState.department = false;
  } else {
    validationState.department = true;
  }

  const salaryValueParsed = parseRupiah(salaryInput?.value || "");
  if (!salaryInput || isNaN(salaryValueParsed) || salaryValueParsed < 1) {
    errors.push("Gaji harus angka positif.");
    validationState.salary = false;
  } else {
    validationState.salary = true;
  }

  updateSubmitButton();

  return errors;
}
