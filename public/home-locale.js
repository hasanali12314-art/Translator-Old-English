/**
 * Homepage UI language switcher — loads public/locales/home.{code}.json
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'oe-site-locale';
  const CACHE_VER = '1';
  const BASE = (document.querySelector('script[src*="home-locale"]')?.getAttribute('src') || '/home-locale.js').replace(/home-locale\.js.*$/, '');
  const LOCALES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'es', label: 'Spanish' },
    { code: 'ru', label: 'Russian' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'bn', label: 'Bengali' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'ms', label: 'Malay' },
    { code: 'pl', label: 'Polish' },
    { code: 'id', label: 'Indonesian' },
    { code: 'ar', label: 'Arabic' },
    { code: 'bg', label: 'Bulgarian' },
    { code: 'tr', label: 'Turkish' },
    { code: 'sv', label: 'Swedish' },
    { code: 'ur', label: 'Urdu' },
  ];

  const MYMEMORY = 'https://api.mymemory.translated.net/get';
  let enStrings = null;
  let applying = false;

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  }

  function setLang(code) {
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code === 'en' ? 'en' : code;
    if (code === 'ar' || code === 'ur') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.removeAttribute('dir');
    }
  }

  function localePath(code) {
    return BASE + 'locales/home.' + code + '.json';
  }

  function cacheKey(code) {
    return 'oe-home-locale-cache-' + CACHE_VER + '-' + code;
  }

  async function loadJson(code) {
    const res = await fetch(localePath(code), { cache: 'no-cache' });
    if (!res.ok) throw new Error('Locale file missing: ' + code);
    return res.json();
  }

  async function translateChunk(text, target) {
    const q = encodeURIComponent(String(text).slice(0, 450));
    const url = MYMEMORY + '?q=' + q + '&langpair=en|' + encodeURIComponent(target);
    const res = await fetch(url);
    const data = await res.json();
    const out = data && data.responseData && data.responseData.translatedText;
    if (!out || out === '-' || String(out).includes('MYMEMORY WARNING')) return text;
    return out;
  }

  async function buildLocaleRuntime(target, onProgress) {
    if (!enStrings) enStrings = await loadJson('en');
    const cached = localStorage.getItem(cacheKey(target));
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { /* rebuild */ }
    }
    const keys = Object.keys(enStrings);
    const out = {};
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      out[k] = await translateChunk(enStrings[k], target);
      if (onProgress) onProgress(i + 1, keys.length);
      if (i % 4 === 3) await new Promise(function (r) { setTimeout(r, 320); });
    }
    try {
      localStorage.setItem(cacheKey(target), JSON.stringify(out));
    } catch (e) { /* quota */ }
    return out;
  }

  function collectDefaults() {
    document.querySelectorAll('.page-home [data-i18n]').forEach(function (el) {
      if (el.dataset.i18nDefault) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.dataset.i18nDefault = el.placeholder || '';
      } else if (el.tagName === 'OPTION') {
        el.dataset.i18nDefault = el.textContent || '';
      } else {
        el.dataset.i18nDefault = el.textContent || '';
      }
    });
  }

  function applyStrings(strings) {
    document.querySelectorAll('.page-home [data-i18n]').forEach(function (el) {
      const key = el.dataset.i18n;
      if (!key || strings[key] == null) return;
      const val = strings[key];
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else if (el.tagName === 'OPTION') {
        el.textContent = val;
      } else if (el.querySelector('span, em')) {
        const span = el.querySelector('span, em');
        if (span && el.childNodes.length <= 3) {
          const prefix = el.textContent.replace(span.textContent, '').trim();
          if (prefix && val.startsWith(prefix.slice(0, 2))) {
            span.textContent = val;
          } else {
            el.textContent = val;
          }
        } else {
          el.textContent = val;
        }
      } else {
        el.textContent = val;
      }
    });
  }

  function restoreEnglish() {
    document.querySelectorAll('.page-home [data-i18n]').forEach(function (el) {
      const def = el.dataset.i18nDefault;
      if (def == null) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = def;
      } else if (el.tagName === 'OPTION') {
        el.textContent = def;
      } else {
        el.textContent = def;
      }
    });
  }

  function showToast(msg) {
    let t = document.getElementById('localeToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'localeToast';
      t.className = 'locale-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }

  async function applyLocale(code) {
    if (applying) return;
    applying = true;
    const select = document.getElementById('siteLocaleSelect');
    const btn = document.getElementById('siteLocaleBtn');
    if (select) select.disabled = true;
    if (btn) btn.setAttribute('aria-busy', 'true');

    try {
      collectDefaults();
      setLang(code);
      if (select) select.value = code;

      if (code === 'en') {
        restoreEnglish();
        showToast('English');
        return;
      }

      showToast('Translating page…');
      let strings;
      try {
        strings = await loadJson(code);
      } catch (e) {
        strings = await buildLocaleRuntime(code, function (done, total) {
          if (done % 8 === 0) showToast('Translating… ' + done + '/' + total);
        });
      }
      applyStrings(strings);
      const label = LOCALES.find(function (l) { return l.code === code; });
      showToast((label && label.label) || code);
    } catch (err) {
      console.error(err);
      showToast('Could not load language. Try again.');
    } finally {
      applying = false;
      if (select) select.disabled = false;
      if (btn) btn.removeAttribute('aria-busy');
    }
  }

  function initSwitcher() {
    const select = document.getElementById('siteLocaleSelect');
    const globeBtn = document.getElementById('siteLocaleBtn');
    if (!select) return;
    globeBtn?.addEventListener('click', function () {
      select.focus();
      if (typeof select.showPicker === 'function') {
        try { select.showPicker(); } catch (e) { /* unsupported */ }
      }
    });
    select.addEventListener('change', function () {
      applyLocale(select.value);
    });
    const saved = getLang();
    if (saved && saved !== 'en') {
      select.value = saved;
      applyLocale(saved);
    } else {
      select.value = 'en';
      collectDefaults();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitcher);
  } else {
    initSwitcher();
  }

  window.applyHomeLocale = applyLocale;
})();
