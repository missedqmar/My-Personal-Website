// ===== Nav: mobile toggle =====
const navToggle = document.getElementById("navToggle");
const siteMenu = document.getElementById("siteMenu");

if (navToggle && siteMenu) {
  navToggle.addEventListener("click", () => {
    const open = siteMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

// ===== Theme toggle (persists) =====
const root = document.documentElement;
const stored = localStorage.getItem("theme");

if (stored) {
  root.classList.toggle("light", stored === "light");
} else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
  root.classList.add("light");
}

const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    root.classList.toggle("light");
    localStorage.setItem("theme", root.classList.contains("light") ? "light" : "dark");
  });
}

// ===== Footer year =====
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Project filters =====
const chips = document.querySelectorAll(".chip");
const cards = document.querySelectorAll(".project");

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");

    const f = chip.dataset.filter;
    cards.forEach((card) => {
      if (!f || f === "all") {
        card.style.display = "";
      } else {
        const tags = (card.dataset.tags || "").split(/\s+/);
        card.style.display = tags.includes(f) ? "" : "none";
      }
    });
  });
});

// ===== Slideshow (cross-fade every 10s) =====
(function initSlideshow() {
  const frame = document.querySelector(".slideshow");
  if (!frame) return;

  const slides = Array.from(frame.querySelectorAll(".slide"));
  if (slides.length < 2) return;

  let idx = 0;
  setInterval(() => {
    const prev = slides[idx];
    idx = (idx + 1) % slides.length;
    const next = slides[idx];

    prev.classList.remove("is-active");
    next.classList.add("is-active");
  }, 10000);
})();
