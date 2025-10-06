// main.js
// Minimal JS for animations, theme toggle, mobile nav, carousel, contact form,
// and AI Voice Intro (About-only, with system-voice fallback)

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

  const initializeTheme = () => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initialDark = saved ? saved === "dark" : prefersDark;
    applyTheme(initialDark);
  };
  initializeTheme();

  if (themeBtn && themeIconPath) {
    themeBtn.addEventListener("click", () => {
      applyTheme(!body.classList.contains("dark"));
    });

    // Listen for system theme changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) applyTheme(e.matches);
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
       - Rail:   #photoRail
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

    // TOUCH SWIPE (iOS/Android)
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
        rail.scrollLeft += dx;
      },
      { passive: true }
    );
    rail.addEventListener("touchend", () => {
      isTouching = false;
      const threshold = 40;
      const delta = startX - lastX;
      if (Math.abs(delta) > threshold) {
        rail.scrollBy({
          left: delta > 0 ? step() : -step(),
          behavior: "smooth",
        });
      }
    });

    // Mouse wheel (vertical -> horizontal)
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

    // Keyboard
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
           * fallback below
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

  // === Resume email (Apps Script) ===
  // Your deployed Web App "exec" URL:
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbw8yujOPYFkuy5B1eW9hNNE77IXSHg1U4yUrpRP3-1TtfnvVRc2swVuQB6FX9QdPxqLsA/exec";

  // IMPORTANT: use your own long random string here AND in Apps Script
  const SECRET = "1f6mZI-rCYKjtji2_bcfzgXWydgiggTtauZZdJxktxCZZOjQ7sCzYfoU7";

  const resumeForm = document.getElementById("resumeForm");
  const resumeStatusEl = document.getElementById("resumeStatus");
  const resumeEmailInput = document.getElementById("resumeEmail");

  if (resumeForm && resumeStatusEl && resumeEmailInput) {
    resumeForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = (resumeEmailInput.value || "").trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        resumeStatusEl.textContent = "Please enter a valid email address.";
        return;
      }

      const submitBtn = resumeForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("opacity-70", "cursor-not-allowed");
      }
      resumeStatusEl.textContent = "Sending…";

      try {
        // text/plain => no CORS preflight
        const res = await fetch(SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ email, secret: SECRET }),
        });

        const data = await res.json().catch(() => ({}));
        if (data && data.ok) {
          resumeStatusEl.textContent =
            "Thanks! Please check your inbox for my resume.";
          resumeForm.reset();
        } else {
          resumeStatusEl.textContent =
            data && data.error
              ? `Error: ${data.error}`
              : "Oops, something went wrong.";
          console.error("Apps Script error:", data);
        }
      } catch (err) {
        console.error(err);
        resumeStatusEl.textContent = "Network error. Please try again.";
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
        }
      }
    });
  }

  /* =========================
   AI Voice Intro — About-only + system-voice fallback
========================= */
  let hasSpeech =
    "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let currentUtterance = null;
  let voices = [];

  // Elements (support both old + new IDs)
  const fabBtn = document.getElementById("aiIntroFab");
  const panelEl = document.getElementById("aiIntroPanel");
  const panelClose = document.getElementById("aiIntroClose");
  const textArea = document.getElementById("aiIntroText");

  const voiceSel =
    document.getElementById("aiVoiceSelect") ||
    document.getElementById("aiIntroVoice");
  const rateEl =
    document.getElementById("aiVoiceRate") ||
    document.getElementById("aiIntroRate");
  const pitchEl =
    document.getElementById("aiVoicePitch") ||
    document.getElementById("aiIntroPitch");

  const playBtn = document.getElementById("aiIntroPlay");
  const stopBtn = document.getElementById("aiIntroStop");
  // (Optional future) const videoBtn = document.getElementById("aiIntroVideo");

  // Read only the About section
  function getAboutText() {
    const about = document.getElementById("about");
    if (!about) return "";
    const heading = about.querySelector("h2")?.innerText?.trim() || "";
    const paras = [...about.querySelectorAll("p")]
      .map((p) => p.innerText.trim())
      .filter(Boolean)
      .join(" ");
    return [heading, paras].filter(Boolean).join(". ");
  }

  // Voice loading (handles Chrome/Safari quirks)
  function populateVoices() {
    voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      setTimeout(populateVoices, 250);
      return;
    }
    if (voiceSel) {
      const savedName = localStorage.getItem("aiIntroVoiceName");
      voiceSel.innerHTML = "";
      voices.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang})`;
        voiceSel.appendChild(opt);
      });
      const preferred =
        (savedName && voices.find((v) => v.name === savedName)?.name) ||
        voices.find((v) => /en/i.test(v.lang))?.name ||
        voices[0]?.name ||
        "";
      if (preferred) voiceSel.value = preferred;
    }
  }
  if (hasSpeech) {
    populateVoices();
    window.speechSynthesis.onvoiceschanged = () => populateVoices();
  }

  function stopSpeaking() {
    if (!hasSpeech) return;
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }

  function speak(text) {
    if (!hasSpeech || !text) return;

    stopSpeaking();
    const u = new SpeechSynthesisUtterance(text);

    // Choose voice: selected -> first English -> first available -> system default
    let chosen = null;
    if (voiceSel && voiceSel.value)
      chosen = voices.find((v) => v.name === voiceSel.value) || null;
    if (!chosen) chosen = voices.find((v) => /en/i.test(v.lang)) || null;
    if (!chosen) chosen = voices[0] || null;
    if (chosen) u.voice = chosen;

    u.rate = (rateEl && parseFloat(rateEl.value)) || 1;
    u.pitch = (pitchEl && parseFloat(pitchEl.value)) || 1;
    u.volume = 1;
    u.lang = chosen?.lang || "en-US";

    if (voiceSel && voiceSel.value) {
      localStorage.setItem("aiIntroVoiceName", voiceSel.value);
    }

    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    window.speechSynthesis.speak(u);
    currentUtterance = u;
  }

  // Prefill panel textarea with About text
  function prefillPanel() {
    const aboutTxt = getAboutText();
    if (textArea && aboutTxt) textArea.value = aboutTxt;
  }

  /* --- UI wiring --- */
  // FAB: open panel + quick toggle speak/stop
  if (fabBtn && hasSpeech) {
    fabBtn.addEventListener("click", () => {
      // Quick toggle speak/stop if already speaking
      if (window.speechSynthesis.speaking) {
        stopSpeaking();
        return;
      }
      // Warm-up voices then open panel & prefill
      if (!voices.length) populateVoices();
      prefillPanel();
      if (panelEl) panelEl.classList.remove("hidden");
    });
  }

  // Close panel
  if (panelClose && panelEl) {
    panelClose.addEventListener("click", () => {
      panelEl.classList.add("hidden");
    });
  }

  // Play/Stop in the panel
  if (playBtn && hasSpeech) {
    playBtn.addEventListener("click", () => {
      const txt = (textArea && textArea.value.trim()) || getAboutText().trim();
      if (!voices.length) {
        populateVoices();
        setTimeout(() => speak(txt), 150);
      } else {
        speak(txt);
      }
    });
  }
  if (stopBtn && hasSpeech) {
    stopBtn.addEventListener("click", () => stopSpeaking());
  }
});
