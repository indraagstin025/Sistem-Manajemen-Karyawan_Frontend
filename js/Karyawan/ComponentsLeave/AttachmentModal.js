import { showToast } from "./UIHelpers.js";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs";

export const initializeAttachmentModal = () => {
  const attachmentViewerModal = document.getElementById("attachmentViewerModal");
  const closeAttachmentViewerModalBtn = document.getElementById("closeAttachmentViewerModalBtn");
  const attachmentContent = document.getElementById("attachmentContent");
  const attachmentErrorMessage = document.getElementById("attachmentErrorMessage");
  const attachmentModalTitle = document.getElementById("attachmentModalTitle");
  const downloadAttachmentFromModalBtn = document.getElementById("downloadAttachmentFromModalBtn");
  const attachmentModalContent = document.getElementById("attachmentModalContent");

  const handleViewAttachment = async (event) => {
    const button = event.target.closest(".view-attachment-btn");
    if (!button) return;

    const fullUrl = button.dataset.url;

    attachmentContent.innerHTML = "Memuat lampiran...";
    attachmentErrorMessage.classList.add("hidden");
    downloadAttachmentFromModalBtn.classList.add("hidden");
    attachmentModalTitle.textContent = "Lihat Lampiran: Memuat...";

    attachmentViewerModal.classList.remove("hidden");
    setTimeout(() => {
      attachmentViewerModal.classList.add("active");
      if (attachmentModalContent) {
        attachmentModalContent.classList.add("active");
      }
    }, 10);

    if (!fullUrl) {
      attachmentModalTitle.textContent = "Lihat Lampiran: Gagal";
      attachmentErrorMessage.textContent = "URL lampiran tidak ditemukan.";
      attachmentErrorMessage.classList.remove("hidden");
      showToast("URL lampiran tidak ditemukan.", "error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      attachmentModalTitle.textContent = "Lihat Lampiran: Gagal";
      attachmentErrorMessage.textContent = "Sesi tidak valid. Harap login ulang.";
      attachmentErrorMessage.classList.remove("hidden");
      showToast("Sesi tidak valid. Harap login ulang.", "error");
      return;
    }

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Gagal memuat lampiran: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      let finalFilename = "File Lampiran";
      const contentDisposition = response.headers.get("Content-Disposition");
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match && match[1]) {
          finalFilename = match[1].replace(/['"]/g, "");
        }
      } else {
        const urlParts = fullUrl.split("/");
        finalFilename = urlParts[urlParts.length - 1].split("?")[0] || "file";
      }
      attachmentModalTitle.textContent = `Lihat Lampiran: ${finalFilename}`;

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const contentType = response.headers.get("Content-Type") || blob.type;

      attachmentContent.innerHTML = "";

      if (contentType.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = blobUrl;
        img.alt = finalFilename;
        img.className = "max-w-full max-h-full object-contain mx-auto";
        attachmentContent.appendChild(img);
      } else if (contentType === "application/pdf") {
        const loadingTask = pdfjsLib.getDocument({ url: blobUrl });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const devicePixelRatio = window.devicePixelRatio || 1;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1 });

          const containerWidth = attachmentContent.clientWidth;
          let scale = 1;
          if (containerWidth > 0) {
            const padding = 20;
            scale = (containerWidth - padding) / viewport.width;
          }
          const scaledViewport = page.getViewport({ scale: scale });

          const canvas = document.createElement("canvas");
          const canvasContext = canvas.getContext("2d");
          canvas.width = scaledViewport.width * devicePixelRatio;
          canvas.height = scaledViewport.height * devicePixelRatio;
          canvas.style.width = `${scaledViewport.width}px`;
          canvas.style.height = `${scaledViewport.height}px`;
          canvas.className = "pdf-page-canvas w-full h-auto mb-4 border border-gray-200 shadow-sm";
          attachmentContent.appendChild(canvas);

          const renderContext = {
            canvasContext: canvasContext,
            viewport: scaledViewport,
            transform: [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0],
          };
          await page.render(renderContext).promise;
        }
      } else {
        attachmentErrorMessage.textContent = `Tipe file '${contentType || "tidak diketahui"}' tidak didukung untuk tampilan langsung. Silakan unduh.`;
        attachmentErrorMessage.classList.remove("hidden");
      }

      downloadAttachmentFromModalBtn.classList.remove("hidden");
      downloadAttachmentFromModalBtn.onclick = () => handleDownloadAttachment({ target: { dataset: { url: fullUrl, filename: finalFilename } } });

      attachmentViewerModal.addEventListener(
        "transitionend",
        function handler() {
          if (attachmentViewerModal.classList.contains("hidden")) {
            URL.revokeObjectURL(blobUrl);
            attachmentViewerModal.removeEventListener("transitionend", handler);
          }
        },
        { once: true }
      );
    } catch (error) {
      attachmentModalTitle.textContent = "Lihat Lampiran: Gagal";
      console.error("Gagal memuat lampiran untuk tampilan:", error);
      attachmentContent.innerHTML = "";
      attachmentErrorMessage.textContent = error.message || "Terjadi kesalahan saat memuat lampiran.";
      attachmentErrorMessage.classList.remove("hidden");
      downloadAttachmentFromModalBtn.classList.add("hidden");
      showToast(error.message || "Gagal memuat lampiran.", "error");

      attachmentViewerModal.classList.remove("active");
      if (attachmentModalContent) {
        attachmentModalContent.classList.remove("active");
      }
      setTimeout(() => attachmentViewerModal.classList.add("hidden"), 300);
    }
  };

  const handleDownloadAttachment = async (event) => {
    const button = event.target.closest(".download-btn") || document.getElementById("downloadAttachmentFromModalBtn");
    const fullUrl = button.dataset.url;
    const filenameAttr = button.dataset.filename;

    if (!fullUrl) {
      showToast("URL lampiran tidak ditemukan.", "error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Sesi tidak valid. Silakan login ulang.", "error");
      return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Mengunduh...";

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Gagal mengunduh file: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "file";
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, "");
        }
      } else if (filenameAttr) {
        filename = filenameAttr;
      } else {
        const urlParts = fullUrl.split("/");
        filename = urlParts[urlParts.length - 1].split("?")[0];
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
      showToast("File berhasil diunduh!", "success");
    } catch (error) {
      console.error("Gagal mengunduh file:", error);
      showToast(error.message || "Terjadi kesalahan saat mengunduh file.", "error");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  };

  closeAttachmentViewerModalBtn?.addEventListener("click", () => {
    attachmentViewerModal.classList.remove("active");
    if (attachmentModalContent) {
      attachmentModalContent.classList.remove("active");
    }
    setTimeout(() => {
      attachmentViewerModal.classList.add("hidden");
      attachmentContent.innerHTML = "";
      attachmentErrorMessage.classList.add("hidden");
      downloadAttachmentFromModalBtn.classList.add("hidden");
    }, 300);
  });

  attachmentViewerModal?.addEventListener("click", (event) => {
    if (event.target === attachmentViewerModal) {
      attachmentViewerModal.classList.remove("active");
      if (attachmentModalContent) {
        attachmentModalContent.classList.remove("active");
      }
      setTimeout(() => {
        attachmentViewerModal.classList.add("hidden");
        attachmentContent.innerHTML = "";
        attachmentErrorMessage.classList.add("hidden");
        downloadAttachmentFromModalBtn.classList.add("hidden");
      }, 300);
    }
  });

  return { handleViewAttachment, handleDownloadAttachment };
};

let viewAttachmentHandler = null;
let downloadAttachmentHandler = null;

export const setAttachmentHandlers = (viewHandler, downloadHandler) => {
  viewAttachmentHandler = viewHandler;
  downloadAttachmentHandler = downloadHandler;
};
