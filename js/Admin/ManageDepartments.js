import { departmentService } from "../Services/DepartemenServices.js";
import { authService } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", () => {
  // Panggil Feather Icons untuk merender ikon
  feather.replace();

  // --- Seleksi Elemen DOM ---
  const departmentTableBody = document.getElementById("departmentTableBody");
  const loadingMessage = document.getElementById("loadingMessage");
  const departmentListError = document.getElementById("departmentListError");
  const departmentListSuccess = document.getElementById("departmentListSuccess");
  const paginationInfo = document.getElementById("paginationInfo");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const searchInput = document.getElementById("searchInput");
  const editDepartmentModal = document.getElementById("editDepartmentModal");
  const closeEditDepartmentModalBtn = document.getElementById("closeEditDepartmentModalBtn");
  const cancelEditDepartmentBtn = document.getElementById("cancelEditDepartmentBtn");
  const editDepartmentForm = document.getElementById("editDepartmentForm");
  const editDepartmentErrorMessage = document.getElementById("editDepartmentErrorMessage");
  const editDepartmentSuccessMessage = document.getElementById("editDepartmentSuccessMessage");
  const editDepartmentId = document.getElementById("editDepartmentId");
  const editDepartmentName = document.getElementById("editDepartmentName");

  // --- Variabel State ---
  let currentPage = 1;

  // ======================================================
  // PERBAIKAN 1: Deklarasi fungsi utilitas dipindahkan ke atas
  // ======================================================
  const showGlobalMessage = (message, type = "success") => {
    departmentListSuccess.classList.add("hidden");
    departmentListError.classList.add("hidden");
    if (type === "success") {
      departmentListSuccess.textContent = message;
      departmentListSuccess.classList.remove("hidden");
    } else {
      departmentListError.textContent = message;
      departmentListError.classList.remove("hidden");
    }
    setTimeout(() => {
      departmentListSuccess.classList.add("hidden");
      departmentListError.classList.add("hidden");
    }, 3000);
  };

  const showModalMessage = (message, type = "success") => {
    editDepartmentErrorMessage.classList.add("hidden");
    editDepartmentSuccessMessage.classList.add("hidden");
    if (type === "success") {
        editDepartmentSuccessMessage.textContent = message;
        editDepartmentSuccessMessage.classList.remove("hidden");
    } else {
        editDepartmentErrorMessage.textContent = message;
        editDepartmentErrorMessage.classList.remove("hidden");
    }
  };
  
  // ======================================================
  // PERBAIKAN 2: Gunakan kunci 'token' yang konsisten
  // ======================================================
  const authToken = localStorage.getItem("token");
  if (!authToken) {
    showGlobalMessage("Anda tidak terautentikasi. Silakan login ulang.", "error");
    setTimeout(() => (window.location.href = "/src/pages/login.html"), 2000);
    return;
  }

  // --- Logika Utama ---

  const fetchDepartments = async () => {
    departmentTableBody.innerHTML = "";
    loadingMessage.classList.remove("hidden");
    try {
      const departments = await departmentService.getAllDepartments(authToken);
      loadingMessage.classList.add("hidden");

      if (departments && departments.length > 0) {
        renderDepartments(departments);
        // Logika paginasi sederhana karena departemen biasanya tidak terlalu banyak
        paginationInfo.textContent = `Menampilkan ${departments.length} dari ${departments.length} departemen`;
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
      } else {
        departmentTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">Tidak ada data departemen.</td></tr>';
        paginationInfo.textContent = "Menampilkan 0 dari 0 departemen";
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
      }
    } catch (error) {
      loadingMessage.classList.add("hidden");
      let errorMessage = "Gagal memuat data departemen.";
      if (error.status === 401 || error.status === 403) {
        errorMessage = "Sesi Anda berakhir. Silakan login kembali.";
        setTimeout(() => authService.logout(), 2000);
      }
      showGlobalMessage(errorMessage, "error");
    }
  };

  const renderDepartments = (departments) => {
    departmentTableBody.innerHTML = "";
    departments.forEach((dept) => {
      const row = document.createElement("tr");
      row.className = "border-b border-gray-100";
      const createdAt = new Date(dept.created_at).toLocaleDateString("id-ID", {
        year: "numeric", month: "long", day: "numeric",
      });
      row.innerHTML = `
        <td class="px-4 py-3">${dept.name}</td>
        <td class="px-4 py-3">${createdAt}</td>
        <td class="px-4 py-3">
          <button class="edit-btn text-blue-600 hover:text-blue-800 mr-2" title="Edit" data-id="${dept.id}" data-name="${dept.name}">
            <i data-feather="edit" class="w-5 h-5"></i>
          </button>
          <button class="delete-btn text-red-600 hover:text-red-800" title="Hapus" data-id="${dept.id}" data-name="${dept.name}">
            <i data-feather="trash-2" class="w-5 h-5"></i>
          </button>
        </td>
      `;
      departmentTableBody.appendChild(row);
    });
    feather.replace();

    // Daftarkan event listener setelah elemen dibuat
    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", (e) => openEditModal(e.currentTarget.dataset.id, e.currentTarget.dataset.name));
    });
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", (e) => handleDelete(e.currentTarget.dataset.id, e.currentTarget.dataset.name));
    });
  };

  const openEditModal = (departmentId, departmentName) => {
    editDepartmentErrorMessage.classList.add("hidden");
    editDepartmentSuccessMessage.classList.add("hidden");
    editDepartmentId.value = departmentId;
    editDepartmentName.value = departmentName;
    editDepartmentModal.classList.remove("hidden");
  };

  const closeEditModal = () => {
    editDepartmentModal.classList.add("hidden");
    editDepartmentForm.reset();
  };

  const handleDelete = async (departmentId, departmentName) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus departemen "${departmentName}"?`)) {
      return;
    }
    try {
      await departmentService.deleteDepartment(departmentId, authToken);
      showGlobalMessage(`Departemen "${departmentName}" berhasil dihapus!`, "success");
      fetchDepartments(); // Muat ulang data
    } catch (error) {
      showGlobalMessage(error.message || "Gagal menghapus departemen.", "error");
    }
  };

  // --- Pendaftaran Event Listener ---

  if (closeEditDepartmentModalBtn) closeEditDepartmentModalBtn.addEventListener("click", closeEditModal);
  if (cancelEditDepartmentBtn) cancelEditDepartmentBtn.addEventListener("click", closeEditModal);
  if (editDepartmentModal) {
    editDepartmentModal.addEventListener("click", (e) => {
      if (e.target === editDepartmentModal) closeEditModal();
    });
  }

  if (editDepartmentForm) {
    editDepartmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const departmentId = editDepartmentId.value;
      const updatedName = editDepartmentName.value.trim();

      if (!updatedName) {
        showModalMessage("Nama departemen tidak boleh kosong.", "error");
        return;
      }
      try {
        await departmentService.updateDepartment(departmentId, { name: updatedName }, authToken);
        showModalMessage("Departemen berhasil diupdate!", "success");
        setTimeout(() => {
          closeEditModal();
          fetchDepartments();
        }, 1500);
      } catch (error) {
        showModalMessage(error.message || "Gagal mengupdate departemen.", "error");
      }
    });
  }

  // --- Inisialisasi Halaman ---
  fetchDepartments();
});