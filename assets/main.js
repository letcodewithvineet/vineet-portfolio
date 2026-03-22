document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const doc = document.documentElement;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const themeBtn = document.getElementById("themeToggleBtn");
  const themeIconPath = document.getElementById("themeIconPath");
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const rail = document.getElementById("photoRail");
  const leftBtn = document.getElementById("railLeft");
  const rightBtn = document.getElementById("railRight");
  const resumeFab = document.getElementById("resumeFab");
  const resumeSection = document.getElementById("resume");
  const visitBadge = document.getElementById("visitBadge");
  const visitCount = document.getElementById("visitCount");
  const passionButtons = [...document.querySelectorAll(".passion-filter")];
  const passionCards = [...document.querySelectorAll("#passionGrid [data-tags]")];
  const SUN = "M12 3v1m0 16v1m8.66-8.66h-1M4.34 12H3m15.07 6.07l-.7-.7M6.34 6.34l-.7-.7m12.02 12.02l-.7-.7M6.34 17.66l-.7-.7M12 5a7 7 0 100 14 7 7 0 000-14z";
  const MOON = "M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z";

  const applyTheme = (isDark) => {
    body.classList.toggle("dark", isDark);
    body.classList.toggle("light", !isDark);
    doc.classList.toggle("dark", isDark);
    doc.classList.toggle("light", !isDark);
    if (themeIconPath) themeIconPath.setAttribute("d", isDark ? SUN : MOON);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const savedTheme = localStorage.getItem("theme");
  applyTheme(savedTheme ? savedTheme === "dark" : true);

  themeBtn?.addEventListener("click", () => {
    applyTheme(!body.classList.contains("dark"));
  });

  menuBtn?.addEventListener("click", () => mobileMenu?.classList.toggle("hidden"));
  mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => mobileMenu.classList.add("hidden")));

  if (rail && leftBtn && rightBtn) {
    const step = () => Math.min(rail.clientWidth * 0.9, 500);
    const updateArrows = () => {
      const atStart = rail.scrollLeft <= 4;
      const atEnd = Math.ceil(rail.scrollLeft + rail.clientWidth) >= rail.scrollWidth - 4;
      leftBtn.disabled = atStart;
      rightBtn.disabled = atEnd;
      leftBtn.classList.toggle("opacity-40", atStart);
      rightBtn.classList.toggle("opacity-40", atEnd);
    };
    leftBtn.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
    rightBtn.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
    rail.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    updateArrows();
  }

  resumeFab?.addEventListener("click", () => {
    resumeSection?.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  });

  const form = document.getElementById("contactForm");
  const formStatus = document.getElementById("form-status");
  if (form && formStatus) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      formStatus.textContent = "Sending...";
      try {
        const response = await fetch(body.dataset.formEndpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (response.ok) {
          formStatus.textContent = "Thanks. I will get back to you soon.";
          form.reset();
        } else {
          const data = await response.json().catch(() => ({}));
          formStatus.textContent = data?.errors?.map((item) => item.message).join(", ") || "Something went wrong. Please try again.";
        }
      } catch {
        formStatus.textContent = "Network error. Please try again.";
      }
    });
  }

  const resumeForm = document.getElementById("resumeForm");
  const resumeEmail = document.getElementById("resumeEmail");
  const resumeStatus = document.getElementById("resumeStatus");
  const scriptUrl = "https://script.google.com/macros/s/AKfycbw8yujOPYFkuy5B1eW9hNNE77IXSHg1U4yUrpRP3-1TtfnvVRc2swVuQB6FX9QdPxqLsA/exec";
  const secret = "1f6mZI-rCYKjtji2_bcfzgXWydgiggTtauZZdJxktxCZZOjQ7sCzYfoU7";
  if (resumeForm && resumeEmail && resumeStatus) {
    resumeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = resumeEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        resumeStatus.textContent = "Please enter a valid email address.";
        return;
      }
      const submitButton = resumeForm.querySelector('button[type="submit"]');
      submitButton?.setAttribute("disabled", "true");
      resumeStatus.textContent = "Sending...";
      try {
        const response = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ email, secret }),
        });
        const data = await response.json().catch(() => ({}));
        resumeStatus.textContent = data?.ok ? "Thanks. Please check your inbox for my resume." : data?.error || "Something went wrong. Please try again.";
        if (data?.ok) resumeForm.reset();
      } catch {
        resumeStatus.textContent = "Network error. Please try again.";
      } finally {
        submitButton?.removeAttribute("disabled");
      }
    });
  }

  passionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag || "all";
      passionButtons.forEach((item) => item.classList.remove("bg-sky-500", "text-slate-950", "border-sky-400"));
      button.classList.add("bg-sky-500", "text-slate-950", "border-sky-400");
      passionCards.forEach((card) => {
        const tags = (card.dataset.tags || "").split(" ");
        const visible = tag === "all" || tags.includes(tag);
        card.classList.toggle("hidden", !visible);
      });
    });
  });
  passionButtons[0]?.click();

  if (!prefersReduced) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
  } else {
    document.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
  }

  const fetchWithTimeout = async (resource, ms) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(resource, { cache: "no-store", signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  };

  const animateCount = (end) => {
    if (!visitCount) return;
    const start = performance.now();
    const duration = 1200;
    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      visitCount.textContent = Math.floor(end * progress).toLocaleString();
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  (async () => {
    if (!visitBadge || !visitCount) return;

    const namespace = "letcodewithvineet-portfolio";
    const key = "home";
    const sessionKey = `visit-counted:${namespace}:${key}`;
    const endpoint = sessionStorage.getItem(sessionKey)
      ? `https://api.countapi.xyz/get/${namespace}/${key}`
      : `https://api.countapi.xyz/hit/${namespace}/${key}`;

    try {
      const response = await fetchWithTimeout(endpoint, 3500);
      if (!response.ok) throw new Error("bad status");
      const data = await response.json().catch(() => ({}));
      const count = Number.parseInt(data?.value, 10);
      if (!Number.isFinite(count)) throw new Error("bad payload");
      sessionStorage.setItem(sessionKey, "1");
      visitBadge.classList.remove("hidden");
      animateCount(count);
    } catch {
      visitCount.textContent = "Live";
      visitBadge.classList.remove("hidden");
    }
  })();
});
