export function initializeSidebar() {
  if (typeof feather !== "undefined" && feather.replace) {
    feather.replace();
  }

  const sidebarToggle = document.getElementById("sidebarToggle");
  const mobileSidebar = document.getElementById("mobileSidebar");
  const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
  const closeSidebar = document.getElementById("closeSidebar");

  if (sidebarToggle && mobileSidebar && mobileSidebarPanel && closeSidebar) {
    const showMobileSidebar = () => {
      mobileSidebar.classList.remove("hidden");

      requestAnimationFrame(() => {
        mobileSidebar.classList.add("opacity-100");
        mobileSidebarPanel.classList.remove("-translate-x-full");
      });
    };

    const hideMobileSidebar = () => {
      mobileSidebar.classList.remove("opacity-100");
      mobileSidebarPanel.classList.add("-translate-x-full");

      requestAnimationFrame(() => {
        setTimeout(() => {
          mobileSidebar.classList.add("hidden");
        }, 300);
      });
    };

    sidebarToggle.addEventListener("click", showMobileSidebar);
    closeSidebar.addEventListener("click", hideMobileSidebar);

    mobileSidebar.addEventListener("click", (event) => {
      if (event.target === mobileSidebar) {
        hideMobileSidebar();
      }
    });
  } else {
  }
}
