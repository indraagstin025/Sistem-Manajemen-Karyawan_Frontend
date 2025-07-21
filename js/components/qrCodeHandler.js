import AttendanceService from "../Services/AttendanceServices.js";

let qrRefreshScheduler;
let qrCountdownTimer;
let isGenerating = false;
let showToastCallback;

/**
 * Fungsi ini HANYA bertanggung jawab untuk menampilkan hitungan mundur di UI.
 */
const startModalQRCodeCountdown = (expiresAt) => {
  const modalQrExpiresAtEl = document.getElementById("modal-qr-expires-at");
  if (qrCountdownTimer) clearInterval(qrCountdownTimer);

  const updateCountdown = () => {
    if (!modalQrExpiresAtEl) return;
    const now = new Date();
    const timeLeftMs = expiresAt.getTime() - now.getTime();

    if (timeLeftMs <= 0) {
      clearInterval(qrCountdownTimer);
      modalQrExpiresAtEl.textContent = "Kedaluwarsa, menunggu refresh...";
      return;
    }

    const secondsLeft = Math.floor(timeLeftMs / 1000);
    modalQrExpiresAtEl.textContent = `Refresh otomatis dalam: ${secondsLeft} detik`;
  };

  updateCountdown();
  qrCountdownTimer = setInterval(updateCountdown, 1000);
};

/**
 * Fungsi ini HANYA bertanggung jawab untuk memperbarui gambar QR di UI dengan animasi.
 */
const displayModalQRCode = (qrData) => {
  const modalQrImageEl = document.getElementById("modal-qr-code-image");
  const modalQrPlaceholderEl = document.getElementById("modal-qr-placeholder");

  if (!modalQrImageEl || !modalQrPlaceholderEl) return;

  const action = () => {
    modalQrPlaceholderEl.classList.add("hidden");
    modalQrImageEl.src = qrData.qr_code_image;
    modalQrImageEl.classList.remove("hidden", "opacity-0", "scale-95");
  };

  if (modalQrImageEl.src && !modalQrImageEl.classList.contains("hidden")) {
    modalQrImageEl.classList.add("opacity-0", "scale-95");
    setTimeout(action, 300);
  } else {
    action();
  }
};

/**
 * Fungsi inti dari semua logika QR Code.
 */
const handleGenerateModalQRCode = async (isAutoRefresh = false) => {
  const modalQrPlaceholderEl = document.getElementById("modal-qr-placeholder");
  if (isGenerating) {
    console.warn("Proses generate QR sudah berjalan.");
    return;
  }

  isGenerating = true;
  if (qrRefreshScheduler) clearTimeout(qrRefreshScheduler);

  if (!isAutoRefresh) {
    if (modalQrPlaceholderEl) {
      modalQrPlaceholderEl.textContent = "Membuat QR Code...";
      modalQrPlaceholderEl.classList.remove("hidden");
      document.getElementById("modal-qr-code-image")?.classList.add("hidden");
    }
  }

  try {
    const data = await AttendanceService.generateQR();
    displayModalQRCode(data);
    startModalQRCodeCountdown(new Date(data.expires_at));

    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const refreshDelayMs = expiresAt.getTime() - now.getTime() - 5000;

    qrRefreshScheduler = setTimeout(() => {
      handleGenerateModalQRCode(true);
    }, Math.max(refreshDelayMs, 1000));

    if (!isAutoRefresh && showToastCallback) {
      showToastCallback("QR Code berhasil dibuat!", "success");
    }
  } catch (error) {
    console.error("Gagal men-generate QR Code:", error);
    if (showToastCallback) showToastCallback(error.message || "Gagal membuat QR Code.", "error");
    if (modalQrPlaceholderEl) modalQrPlaceholderEl.textContent = "Gagal membuat QR. Coba lagi.";
  } finally {
    isGenerating = false;
  }
};

const openModal = () => {
  const qrCodeModal = document.getElementById("qrCodeModal");
  if (qrCodeModal) {
    qrCodeModal.classList.remove("hidden");
    setTimeout(() => qrCodeModal.classList.add("active"), 10);
    handleGenerateModalQRCode(false);
  }
};

const closeModal = () => {
  const qrCodeModal = document.getElementById("qrCodeModal");
  if (qrCodeModal) {
    qrCodeModal.classList.remove("active");
    setTimeout(() => qrCodeModal.classList.add("hidden"), 300);
  }

  if (qrRefreshScheduler) clearTimeout(qrRefreshScheduler);
  if (qrCountdownTimer) clearInterval(qrCountdownTimer);

  isGenerating = false;
  const modalQrImageEl = document.getElementById("modal-qr-code-image");
  if (modalQrImageEl) {
    modalQrImageEl.src = "";
    modalQrImageEl.classList.add("hidden", "opacity-0", "scale-95");
  }
  const modalQrPlaceholderEl = document.getElementById("modal-qr-placeholder");
  if (modalQrPlaceholderEl) {
    modalQrPlaceholderEl.classList.remove("hidden");
    modalQrPlaceholderEl.textContent = "Memuat QR Code...";
  }
  const modalQrExpiresAtEl = document.getElementById("modal-qr-expires-at");
  if (modalQrExpiresAtEl) modalQrExpiresAtEl.textContent = "";
};

/**
 * Fungsi yang akan diekspor untuk diinisialisasi dari luar.
 * Ia menerima callback untuk menampilkan toast.
 */
function initialize(options) {
  showToastCallback = options.toastCallback;

  const generateQrMenuBtn = document.getElementById("generate-qr-menu-btn");
  const generateQrMenuBtnMobile = document.getElementById("generate-qr-menu-btn-mobile");
  const modalGenerateQrBtn = document.getElementById("modal-generate-qr-btn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalCloseQrBtn = document.getElementById("modal-close-qr-btn");
  const qrCodeModal = document.getElementById("qrCodeModal");

  generateQrMenuBtn?.addEventListener("click", openModal);
  generateQrMenuBtnMobile?.addEventListener("click", openModal);
  modalGenerateQrBtn?.addEventListener("click", () => handleGenerateModalQRCode(false));
  closeModalBtn?.addEventListener("click", closeModal);
  modalCloseQrBtn?.addEventListener("click", closeModal);
  qrCodeModal?.addEventListener("click", (e) => {
    if (e.target === qrCodeModal) closeModal();
  });

  window.addEventListener("beforeunload", closeModal);
}

export const QRCodeManager = {
  initialize,
  close: closeModal,
};
