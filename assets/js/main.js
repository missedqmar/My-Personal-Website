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
    const ry = (dx * maxTilt).toFixed(2);

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

// Project showcase
(function initProjectShowcase() {
  // Get DOM elements
  const projectData = document.getElementById('projectData');
  const currentProject = document.getElementById('currentProject');
  const projectVideo = document.getElementById('projectVideo');
  const projectImages = document.querySelectorAll('.project-image');
  const prevButton = document.querySelector('.project-nav.prev');
  const nextButton = document.querySelector('.project-nav.next');
  const projectTitles = document.querySelector('.project-titles');

  // Image navigation buttons
  const imagePrevButton = document.querySelector('.image-nav.prev');
  const imageNextButton = document.querySelector('.image-nav.next');

  // Get all projects from the hidden data
  const allProjects = Array.from(projectData.querySelectorAll('.project'));
  let currentIndex = 0;
  let filteredProjects = [...allProjects];

  // Media control
  let imageIndex = 0;
  let imageTimer = null;
  let videoEnded = false;

  // Initialize
  function init() {
    if (allProjects.length === 0) return;

    // Create project title list
    createProjectTitles();

    // Find the "We're Ducked" project as default
    let defaultIndex = 0; // Fallback to first project
    const wereDuckedProject = allProjects.findIndex(project => project.dataset.id === 'were-ducked');

    if (wereDuckedProject !== -1) {
      defaultIndex = wereDuckedProject;
    }

    // Show default project
    showProject(defaultIndex);

    // Set up navigation
    if (prevButton && nextButton) {
      prevButton.addEventListener('click', showPreviousProject);
      nextButton.addEventListener('click', showNextProject);
    }

    // Set up image navigation
    if (imagePrevButton && imageNextButton) {
      imagePrevButton.addEventListener('click', showPreviousImage);
      imageNextButton.addEventListener('click', showNextImage);
    }

    // Hook into existing filter system
    updateFilteringSystem();

    // Handle video end event
    projectVideo.addEventListener('ended', () => {
      videoEnded = true;
      projectVideo.style.display = 'none';
      showImageSequence();
    });
  }

  function createProjectTitles() {
    // Clear existing titles
    projectTitles.innerHTML = '';

    // Create list items for each project
    filteredProjects.forEach((project, index) => {
      const title = project.querySelector('h3').textContent;
      const li = document.createElement('li');
      li.textContent = title;
      li.dataset.index = index;

      // Set active class for first project
      if (index === 0) {
        li.classList.add('active');
      }

      // Add click event
      li.addEventListener('click', () => {
        showProject(index);
      });

      projectTitles.appendChild(li);
    });
  }

  function showProject(index) {
    // Reset media state
    clearTimeout(imageTimer);
    videoEnded = false;

    // Make sure index is valid
    if (index < 0 || index >= filteredProjects.length) return;

    currentIndex = index;
    const project = filteredProjects[index];

    // Update project info
    currentProject.innerHTML = project.innerHTML;

    // Update active title
    const titleItems = projectTitles.querySelectorAll('li');
    titleItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Load media for this project
    loadProjectMedia(project);
  }

  function showPreviousProject() {
    let newIndex = currentIndex - 1;
    if (newIndex < 0) newIndex = filteredProjects.length - 1;
    showProject(newIndex);
  }

  function showNextProject() {
    let newIndex = currentIndex + 1;
    if (newIndex >= filteredProjects.length) newIndex = 0;
    showProject(newIndex);
  }

  function showPreviousImage() {
    // Prevent automatic cycling
    clearTimeout(imageTimer);

    // Hide all images
    projectImages.forEach(img => {
      img.style.opacity = '0';
    });

    // Calculate previous index with wraparound
    imageIndex = (imageIndex - 1 + projectImages.length) % projectImages.length;

    // Show current image
    if (projectImages[imageIndex] && projectImages[imageIndex].src) {
      projectImages[imageIndex].style.opacity = '1';
    }
  }

  function showNextImage() {
    // Prevent automatic cycling
    clearTimeout(imageTimer);

    // Hide all images
    projectImages.forEach(img => {
      img.style.opacity = '0';
    });

    // Calculate next index with wraparound
    imageIndex = (imageIndex + 1) % projectImages.length;

    // Show current image
    if (projectImages[imageIndex] && projectImages[imageIndex].src) {
      projectImages[imageIndex].style.opacity = '1';
    }
  }

  function showImageSequence() {
    // Reset image sequence
    imageIndex = 0;

    // Hide all images first
    projectImages.forEach(img => {
      img.style.opacity = '0';
    });

    // Show the first image immediately (no automatic cycling)
    if (projectImages[imageIndex] && projectImages[imageIndex].src) {
      projectImages[imageIndex].style.opacity = '1';
    }
  }

  function loadProjectMedia(project) {
    // Get media paths from data attributes
    const videoSrc = project.dataset.video || '';
    const img1Src = project.dataset.img1 || '';
    const img2Src = project.dataset.img2 || '';
    const img3Src = project.dataset.img3 || '';

    // Update video source
    if (videoSrc) {
      projectVideo.src = videoSrc;
      projectVideo.style.display = 'block';
      projectVideo.load(); // Important to reload the video

      // Don't autoplay - just show first frame
      projectVideo.pause();

      // Since we're not auto-playing, show the images instead
      videoEnded = true;
      showImageSequence();
    } else {
      // No video, show images immediately
      projectVideo.style.display = 'none';
      videoEnded = true;
      showImageSequence();
    }

    // Update image sources
    if (projectImages.length >= 3) {
      projectImages[0].src = img1Src || 'assets/img/placeholder.svg';
      projectImages[1].src = img2Src || 'assets/img/placeholder.svg';
      projectImages[2].src = img3Src || 'assets/img/placeholder.svg';
    }

    // Show first image (no automatic cycling)
    showImageSequence();
  }

  function updateFilteringSystem() {
    // Get all filter chips
    const chips = document.querySelectorAll('.chip');

    // Override the click behavior to work with our showcase
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        // Reset active state
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');

        const filter = chip.dataset.filter;

        // Filter projects
        if (!filter || filter === 'all') {
          filteredProjects = [...allProjects];
        } else {
          filteredProjects = allProjects.filter(project => {
            const tags = (project.dataset.tags || '').split(/\s+/);
            return tags.includes(filter);
          });
        }

        // Recreate project titles
        createProjectTitles();

        // Show first project in filtered list
        if (filteredProjects.length > 0) {
          showProject(0);
        } else {
          // Handle no matches
          currentProject.innerHTML = '<h3>No projects found</h3><p>No projects match the selected filter.</p>';
          projectVideo.style.display = 'none';
          projectImages.forEach(img => { img.style.opacity = '0'; });
        }
      });
    });
  }

  // Start when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();