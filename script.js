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
   Site geneli arama (header) — makale başlıklarında arama yapar
   ============================================================ */

function initSiteSearch() {
  const toggle = document.querySelector('.site-search-toggle');
  const panel = document.getElementById('site-search-panel');
  const input = document.getElementById('site-search-input');
  const results = document.getElementById('site-search-results');
  if (!toggle || !panel || !input || !results) return;

  function currentLang() {
    return document.documentElement.getAttribute('lang') || DEFAULT_LANG;
  }

  function openPanel() {
    panel.classList.add('is-open');
    toggle.classList.add('is-active');
    toggle.setAttribute('aria-expanded', 'true');
    input.focus();
  }

  function closePanel() {
    panel.classList.remove('is-open');
    toggle.classList.remove('is-active');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (panel.classList.contains('is-open')) {
      closePanel();
    } else {
      openPanel();
    }
  });

  panel.addEventListener('click', (event) => event.stopPropagation());

  document.addEventListener('click', () => closePanel());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePanel();
  });

  function renderResults(query) {
    const dict = translations[currentLang()];
    const posts = (dict && dict.blog && dict.blog.posts) || [];
    results.innerHTML = '';

    const q = query.trim().toLowerCase();
    if (!q) return;

    const matches = posts.filter((post) =>
      post.title.toLowerCase().includes(q) ||
      (post.description || '').toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'site-search-empty';
      empty.textContent = (dict && dict.header && dict.header.searchNoResults) || 'No results found.';
      results.appendChild(empty);
      return;
    }

    matches.forEach((post) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = post.href;

      const title = document.createElement('span');
      title.className = 'result-title';
      title.textContent = post.title;

      const date = document.createElement('span');
      date.className = 'result-date';
      date.textContent = post.date;

      a.appendChild(title);
      a.appendChild(date);
      li.appendChild(a);
      results.appendChild(li);
    });
  }

  input.addEventListener('input', () => renderResults(input.value));
}

/* ============================================================
   Genel sayfa etkileşimleri
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Footer yılı
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobil navigasyon aç/kapa
  const toggle = document.querySelector('.menu-toggle');
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
  initSiteSearch();

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
