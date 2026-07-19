// Ayberk Ceyran — küçük etkileşim betiği + i18n (dil) sistemi

/* ============================================================
   i18n (uluslararasılaştırma)
   - Çeviri metinleri /i18n/en.json ve /i18n/tr.json dosyalarında tutulur.
   - Yeni bir dil eklemek için: SUPPORTED_LANGS listesine dil kodunu ekle,
     /i18n/<kod>.json dosyasını oluştur ve HTML'deki dil seçiciye
     ilgili butonu ekle. Bileşenlerin kendisinde metin değişikliği gerekmez.
   ============================================================ */

const SUPPORTED_LANGS = ['en', 'tr'];
const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'site-lang';

// Metin dışında güncellenmesi gereken öznitelikler (attribute).
// Yeni bir öznitelik türü gerekirse buraya eklemek yeterli
// (örn. 'placeholder', 'title').
const I18N_ATTRS = ['alt', 'aria-label', 'content', 'href', 'placeholder'];

const translations = {};

function getStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch (err) {
    // localStorage erişilemez olabilir (gizli sekme vb.) — sessizce yoksay
  }
  return DEFAULT_LANG;
}

function storeLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (err) {
    // depolanamazsa sorun değil, sadece sayfa yenilenince varsayılana döner
  }
}

// "projects.items.0.title" gibi noktalı bir yolu nesne içinde çözer
function resolveKey(dict, path) {
  return path.split('.').reduce(
    (value, key) => (value && value[key] !== undefined ? value[key] : undefined),
    dict
  );
}

async function loadTranslations() {
  const entries = await Promise.all(
    SUPPORTED_LANGS.map(async (lang) => {
      const res = await fetch(`/${lang}.json`);
      if (!res.ok) throw new Error(`Çeviri dosyası yüklenemedi: ${lang}.json`);
      return [lang, await res.json()];
    })
  );
  entries.forEach(([lang, dict]) => {
    translations[lang] = dict;
  });
}

function applyTranslations(lang) {
  const dict = translations[lang];
  if (!dict) return;

  document.documentElement.setAttribute('lang', lang);

  // Metin içerikleri
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = resolveKey(dict, el.getAttribute('data-i18n'));
    if (value !== undefined) el.textContent = value;
  });

  // Öznitelikler (alt, aria-label, content, ...)
  I18N_ATTRS.forEach((attr) => {
    document.querySelectorAll(`[data-i18n-${attr}]`).forEach((el) => {
      const value = resolveKey(dict, el.getAttribute(`data-i18n-${attr}`));
      if (value !== undefined) el.setAttribute(attr, value);
    });
  });

  // Dil seçici üzerinde aktif dili işaretle
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-lang') === lang);
  });
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang) || !translations[lang]) return;
  applyTranslations(lang);
  storeLang(lang);
}

async function initI18n() {
  try {
    await loadTranslations();
    setLanguage(getStoredLang());
  } catch (err) {
    console.error(err);
  }

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.getAttribute('data-lang')));
  });
}

/* ============================================================
   Genel sayfa etkileşimleri
   ============================================================ */

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

  initI18n();

  // Projeler sayfası — sekme filtresi ve arama kutusu
  const projectGrid = document.getElementById('project-grid');
  if (projectGrid) {
    const cards = Array.from(projectGrid.querySelectorAll('.project-card'));
    const tabs = document.querySelectorAll('.project-tab');
    const searchInput = document.getElementById('project-search-input');
    let activeFilter = 'all';

    function applyFilters() {
      const query = (searchInput && searchInput.value || '').trim().toLowerCase();
      cards.forEach((card) => {
        const matchesFilter = activeFilter === 'all' || card.getAttribute('data-category') === activeFilter;
        const text = card.textContent.toLowerCase();
        const matchesSearch = query === '' || text.includes(query);
        card.classList.toggle('is-hidden', !(matchesFilter && matchesSearch));
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        activeFilter = tab.getAttribute('data-filter');
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }
  }
});
