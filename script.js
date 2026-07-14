// Ayberk Ceyran — küçük etkileşim betiği

document.addEventListener('DOMContentLoaded', () => {
  // Footer yılı
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobil navigasyon aç/kapa
  const toggle = document.querySelector('.nav-toggle');
  const navList = document.getElementById('nav-list');

  if (toggle && navList) {
    toggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    navList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});
