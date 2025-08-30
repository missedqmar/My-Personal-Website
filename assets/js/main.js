// Main UI interactions (v6)

// Mobile menu
const navToggle = document.getElementById("navToggle");
const siteMenu = document.getElementById("siteMenu");

if (navToggle && siteMenu) {
  navToggle.addEventListener("click", () => {
    const open = siteMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

// Theme toggle (persist)
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

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Scroll shadow for navbar contrast
(function initScrollShadow() {
  function onScroll() {
    if (window.scrollY > 8) {
      document.body.classList.add("scrolled");
    } else {
      document.body.classList.remove("scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// Project filters
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

// Slideshow (cross-fade every 10s)
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

// Tilt (motion-safe)
(function initTilt() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const frame = document.querySelector(".slideshow");
  if (!frame) return;

  const maxTilt = 6; // degrees

  const reset = () => {
    frame.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
  };

  frame.addEventListener("pointermove", (e) => {
    const rect = frame.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    const rx = (dy * -maxTilt).toFixed(2);
    const ry = (dx *  maxTilt).toFixed(2);

    frame.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  frame.addEventListener("pointerleave", reset);
  reset();
})();

// Reveal-on-scroll (motion-safe)
(function initReveal() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.transform = "translateY(0)";
        entry.target.style.opacity = "1";
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".card").forEach((card) => {
    card.style.transform = "translateY(8px)";
    card.style.opacity = "0";
    card.style.transition = "transform 360ms ease, opacity 360ms ease";
    observer.observe(card);
  });
})();

// Spotlight (motion-safe)
(function initSpotlight() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const root = document.documentElement;

  function update(x, y) {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    const px = Math.round((x / vw) * 10000) / 100 + "%";
    const py = Math.round((y / vh) * 10000) / 100 + "%";

    root.style.setProperty("--spot-x", px);
    root.style.setProperty("--spot-y", py);
  }

  window.addEventListener("pointermove", (e) => {
    update(e.clientX, e.clientY);
  });

  update(window.innerWidth * 0.5, window.innerHeight * 0.2);
})();