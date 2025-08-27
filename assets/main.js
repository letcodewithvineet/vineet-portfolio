// JavaScript to handle the mobile menu and initialize AOS (Animate On Scroll).
// Keeping the JavaScript light maintains a minimalist feel by loading only
// what is necessary.
document.addEventListener('DOMContentLoaded', () => {
  // Initialise scroll animations with a reasonable duration and only once per element.
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true
    });
  }

  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  // Toggle mobile navigation menu visibility
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
    // Hide the mobile menu when a navigation link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
});