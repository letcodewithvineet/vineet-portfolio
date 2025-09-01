// Minimal JS for animations, theme toggle, mobile nav, carousel, and contact form
document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     AOS (Animate On Scroll)
  ========================== */
  if (typeof AOS !== "undefined") {
    AOS.init({ duration: 800, once: true });
  }

  /* =========================
     THEME TOGGLE (sun/moon)
     Expects:
       - Button:  #themeToggleBtn
       - Path:    #themeIconPath  (the <path> inside the SVG)
  ========================== */
  const body = document.body;
  const themeBtn = document.getElementById("themeToggleBtn");
  const themeIconPath = document.getElementById("themeIconPath");

  const SUN =
    "M12 3v1m0 16v1m8.66-8.66h-1M4.34 12H3m15.07 6.07l-.7-.7M6.34 6.34l-.7-.7m12.02 12.02l-.7-.7M6.34 17.66l-.7-.7M12 5a7 7 0 100 14 7 7 0 000-14z";
  const MOON = "M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z";

  function applyTheme(isDark) {
    body.classList.toggle("dark", isDark);
    body.classList.toggle("light", !isDark); // used by gradient fades
    if (themeIconPath) themeIconPath.setAttribute("d", isDark ? SUN : MOON);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  // Decide initial theme: saved -> system -> current class
  (() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initialDark = saved
      ? saved === "dark"
      : body.classList.contains("dark") || prefersDark;
    applyTheme(initialDark);
  })();

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      applyTheme(!body.classList.contains("dark"));
    });
  }

  /* =========================
     MOBILE MENU
     Expects:
       - #menuBtn, #mobileMenu
  ========================== */
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => mobileMenu.classList.add("hidden"));
    });
  }

  /* =========================
     PHOTO CAROUSEL
     Expects:
       - Rail:  #photoRail
       - Arrows: #railLeft, #railRight
  ========================== */
  const rail = document.getElementById("photoRail");
  const leftBtn = document.getElementById("railLeft");
  const rightBtn = document.getElementById("railRight");

  if (rail && leftBtn && rightBtn) {
    const step = () => Math.min(rail.clientWidth * 0.9, 600);

    function updateArrows() {
      const atStart = rail.scrollLeft <= 5;
      const atEnd =
        Math.ceil(rail.scrollLeft + rail.clientWidth) >= rail.scrollWidth - 5;
      leftBtn.classList.toggle("opacity-30", atStart);
      rightBtn.classList.toggle("opacity-30", atEnd);
      leftBtn.disabled = atStart;
      rightBtn.disabled = atEnd;
    }

    leftBtn.addEventListener("click", () =>
      rail.scrollBy({ left: -step(), behavior: "smooth" })
    );
    rightBtn.addEventListener("click", () =>
      rail.scrollBy({ left: step(), behavior: "smooth" })
    );

    /* =========================
   TOUCH SWIPE for carousel (iOS/Android)
========================== */
    if (rail) {
      let startX = 0,
        lastX = 0,
        isTouching = false;

      rail.addEventListener(
        "touchstart",
        (e) => {
          if (!e.touches || !e.touches.length) return;
          isTouching = true;
          startX = lastX = e.touches[0].clientX;
        },
        { passive: true }
      );

      rail.addEventListener(
        "touchmove",
        (e) => {
          if (!isTouching || !e.touches || !e.touches.length) return;
          const x = e.touches[0].clientX;
          const dx = lastX - x;
          lastX = x;
          rail.scrollLeft += dx; // smooth follow-the-finger
        },
        { passive: true }
      );

      rail.addEventListener("touchend", () => {
        isTouching = false;
        // snap a bit by nudging ~half a card if swipe was big
        const threshold = 40;
        const delta = startX - lastX;
        if (Math.abs(delta) > threshold) {
          const step = Math.min(rail.clientWidth * 0.9, 600);
          rail.scrollBy({ left: delta > 0 ? step : -step, behavior: "smooth" });
        }
      });
    }

    // allow vertical mouse wheel to scroll horizontally
    rail.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          rail.scrollBy({ left: e.deltaY, behavior: "auto" });
        }
      },
      { passive: false }
    );

    // keyboard support when rail is focused
    rail.setAttribute("tabindex", "0");
    rail.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight")
        rail.scrollBy({ left: step(), behavior: "smooth" });
      if (e.key === "ArrowLeft")
        rail.scrollBy({ left: -step(), behavior: "smooth" });
    });

    rail.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);
    updateArrows();
  }

  /* =========================
     CONTACT FORM (Formspree)
     Expects:
       - Form: #contactForm
       - Status element: #form-status
       - Endpoint:
           * body[data-form-endpoint]  OR
           * hard-coded fallback below
  ========================== */
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("form-status");
  const ENDPOINT =
    body.dataset.formEndpoint || "https://formspree.io/f/mnnbnjlo";

  if (form && statusEl) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      statusEl.textContent = "Sending…";
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          statusEl.textContent = "Thanks! I’ll get back to you soon.";
          form.reset();
        } else {
          const data = await res.json().catch(() => ({}));
          const msg =
            data && data.errors
              ? data.errors.map((err) => err.message).join(", ")
              : "Oops, something went wrong.";
          statusEl.textContent = msg;
        }
      } catch (err) {
        statusEl.textContent = "Network error. Please try again.";
      }
    });
  }
});
