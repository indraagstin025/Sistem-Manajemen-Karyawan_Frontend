document.addEventListener("DOMContentLoaded", () => {
  feather.replace();

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".reveal").forEach((element) => {
    revealObserver.observe(element);
  });

  const navbar = document.getElementById("navbar");
  const navLogo = document.getElementById("nav-logo");
  const navLinks = navbar.querySelectorAll("nav a");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("bg-white/95", "shadow-lg", "navbar-scrolled");
      navLogo.classList.remove("text-white");
      navLogo.classList.add("text-gray-900");
      navLinks.forEach((link) => {
        link.classList.remove("text-gray-300");
        link.classList.add("text-gray-700");
      });
    } else {
      navbar.classList.remove("bg-white/95", "shadow-lg", "navbar-scrolled");
      navLogo.classList.remove("text-gray-900");
      navLogo.classList.add("text-white");
      navLinks.forEach((link) => {
        link.classList.remove("text-gray-700");
        link.classList.add("text-gray-300");
      });
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      });
    });
  });
});

feather.replace(); // Menginisialisasi Feather Icons

const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

if (togglePassword && password) {
  // Memastikan elemen ada sebelum menambahkan event listener
  togglePassword.addEventListener("click", function (e) {
    // Toggle type atribut
    const type = password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);
    // Toggle ikon
    const icon = this.querySelector("i");
    if (type === "password") {
      icon.setAttribute("data-feather", "eye-off");
    } else {
      icon.setAttribute("data-feather", "eye");
    }
    feather.replace(); // Perbarui ikon
  });
}

feather.replace(); // Initialize Feather Icons
// Mobile sidebar logic (Anda bisa tempatkan ini di sebuah file JS terpisah jika digunakan di banyak halaman)
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileSidebar = document.getElementById("mobileSidebar");
const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
const closeSidebar = document.getElementById("closeSidebar");

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
