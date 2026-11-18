// Ayberk Ceyran — language switch (EN/TR) and footer year.
// English is written into the pages; Turkish comes from /tr.json.
// Essay pages exist in both languages as separate pages (data-fixed-lang).

const SUPPORTED_LANGS = ['en', 'tr'];
const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'site-lang';
const I18N_ATTRS = ['aria-label', 'href', 'content'];
const translations = {};

// Site root, so the same pages also work from a preview copy in a sub-folder.
const ROOT = document.documentElement.getAttribute('data-root') || '/';
const INDEX = document.documentElement.getAttribute('data-index') || '';

function localHref(value) {
  if (!value.startsWith('/')) return value;
  let v = ROOT + value.slice(1);
  if (INDEX && v.endsWith('/')) v += INDEX;
  return v;
}

function getStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch (err) { /* storage unavailable */ }
  return DEFAULT_LANG;
}

function storeLang(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (err) { /* ignore */ }
}

function resolveKey(dict, path) {
  return path.split('.').reduce((v, k) => (v && v[k] !== undefined ? v[k] : undefined), dict);
}

async function loadLang(lang) {
  if (translations[lang]) return translations[lang];
  const res = await fetch(`${ROOT}${lang}.json`);
  if (!res.ok) throw new Error(`Could not load ${lang}.json`);
  translations[lang] = await res.json();
  return translations[lang];
}

function markActive(lang) {
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const on = btn.getAttribute('data-lang') === lang;
    btn.classList.toggle('is-active', on);
    if (btn.tagName === 'BUTTON') btn.setAttribute('aria-pressed', String(on));
  });
}

function apply(dict, lang) {
  document.documentElement.setAttribute('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = resolveKey(dict, el.getAttribute('data-i18n'));
    if (typeof value === 'string') el.textContent = value;
  });
  I18N_ATTRS.forEach((attr) => {
    document.querySelectorAll(`[data-i18n-${attr}]`).forEach((el) => {
      const value = resolveKey(dict, el.getAttribute(`data-i18n-${attr}`));
      if (typeof value === 'string') el.setAttribute(attr, attr === 'href' ? localHref(value) : value);
    });
  });
}

async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  try {
    apply(await loadLang(lang), lang);
    storeLang(lang);
    markActive(lang);
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.year').forEach((el) => { el.textContent = new Date().getFullYear(); });

  const fixed = document.documentElement.getAttribute('data-fixed-lang');
  if (fixed) {
    // The page itself is in one language; only the shared header and footer need translating.
    storeLang(fixed);
    markActive(fixed);
    if (fixed !== DEFAULT_LANG) setLanguage(fixed);
    document.querySelectorAll('a.lang-btn').forEach((a) => {
      a.addEventListener('click', () => storeLang(a.getAttribute('data-lang')));
    });
    return;
  }

  const lang = getStoredLang();
  markActive(lang);
  if (lang !== DEFAULT_LANG) setLanguage(lang);
  document.querySelectorAll('button.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.getAttribute('data-lang')));
  });
});
