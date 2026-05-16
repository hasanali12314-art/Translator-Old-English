/**
 * English typography: label case (nav/footer/UI) and sentence case (body).
 * Hero section is excluded.
 */
(function () {
  'use strict';

  var HERO = '.hero-section';
  var CHROME = '.site-header, .mobile-nav, .site-footer';

  function firstLetterIndex(str) {
    var m = str.match(/[a-zA-Z\u00C0-\u024F]/);
    return m ? m.index : -1;
  }

  function labelCase(str) {
    var s = String(str || '').replace(/\s+/g, ' ').trim();
    if (!s) return s;
    var i = firstLetterIndex(s);
    if (i < 0) return s;
    return s.slice(0, i) + s.charAt(i).toUpperCase() + s.slice(i + 1).toLowerCase();
  }

  function sentenceCase(str) {
    var s = String(str || '').replace(/\s+/g, ' ').trim();
    if (!s) return s;
    return s
      .toLowerCase()
      .replace(/(^\s*\S|[.!?…]+\s+\S|:\s+\S)/g, function (m) {
        return m.toUpperCase();
      });
  }

  function isEnglishHome() {
    if (!document.querySelector('.page-home')) return true;
    try {
      var loc = localStorage.getItem('oe-site-locale');
      return !loc || loc === 'en';
    } catch (e) {
      return true;
    }
  }

  function setVisibleText(el, text) {
    if (!el) return;
    var icon = el.querySelector('.faq-icon, .nav-arrow, .adv-chevron, .tab-icon');
    if (icon && (el.tagName === 'BUTTON' || el.classList.contains('faq-question'))) {
      el.childNodes.forEach(function (n) {
        if (n.nodeType === Node.TEXT_NODE) el.removeChild(n);
      });
      var lead = el.querySelector('.nav-label');
      if (lead) {
        lead.textContent = text;
      } else {
        var first = el.firstChild;
        if (first && first.nodeType === Node.TEXT_NODE) first.textContent = text;
        else el.insertBefore(document.createTextNode(text), icon);
      }
      return;
    }
    var badgeIcon = el.querySelector(':scope > span');
    if (badgeIcon && el.classList.contains('badge')) {
      el.childNodes.forEach(function (n) {
        if (n.nodeType === Node.TEXT_NODE) el.removeChild(n);
      });
      el.appendChild(document.createTextNode(' ' + text.replace(/^\S+\s*/, '').trim()));
      return;
    }
    var btnIcon = el.querySelector(':scope > span');
    if (btnIcon && (el.classList.contains('btn-clear') || el.classList.contains('btn-translate') || el.classList.contains('copy-btn') || el.classList.contains('download-btn'))) {
      var sym = btnIcon.textContent.trim();
      el.textContent = sym + ' ' + labelCase(text.replace(sym, '').trim());
      return;
    }
    el.textContent = text;
  }

  var CHROME_SELECTORS = [
    '.site-header a.nav-link',
    '.site-header .nav-dropdown-btn',
    '.site-header .dropdown-item',
    '.mobile-nav .mobile-nav-link',
    '.mobile-nav .mobile-nav-sub',
    '.mobile-nav .mobile-nav-label',
    '.site-footer .footer-col h4',
    '.site-footer .footer-col ul a',
    '.site-footer .footer-meta-link',
    '.hdr-btn .hdr-label',
  ];

  var LABEL_SELECTORS = [
    '.page-home .field-label',
    '.page-home .tool-box label',
    '.page-home .trans-lang',
    '.page-home .tool-mode-tab span',
    '.page-home .flip-lbl',
    '.page-home .example-label',
    '.page-home .ex-tag',
    '.page-home .speech-bridge-label',
    '.page-home .adv-item label',
    '.page-home .feat-name',
    '.page-home .benefit-name',
    '.page-home .user-title',
    '.page-home .step-title',
    '.page-home .sc-name',
    '.page-home .sc-period',
    '.page-home .btn-clear',
    '.page-home .btn-translate',
    '.page-home .copy-btn',
    '.page-home .download-btn',
    '.page-home .cta-btn',
    '.page-home .badge',
    '.page-home .advanced-toggle',
    '.page-home .adv-btn',
    '.page-home select option',
  ];

  var SENTENCE_SELECTORS = [
    '.page-home .sec-title',
    '.page-home .sec-sub',
    '.page-home .info-block h2',
    '.page-home .info-block h3',
    '.page-home .info-block p',
    '.page-home .info-block li',
    '.page-home .feat-desc',
    '.page-home .step-desc',
    '.page-home .benefit-desc',
    '.page-home .user-desc',
    '.page-home .sc-desc',
    '.page-home .ex-modern',
    '.page-home .ex-old',
    '.page-home .faq-question',
    '.page-home .faq-answer',
    '.page-home .faq-answer span',
    '.page-home .cta-banner p',
    '.page-home .cta p',
    '.page-home .cta h2',
    '.page-home .upload-hint',
    '.page-home .upload-title',
    '.page-home .speech-bridge-hint',
  ];

  function applyLabel(el) {
    if (el.closest(HERO)) return;
    var t = el.textContent;
    if (!t || !t.trim()) return;
    setVisibleText(el, labelCase(t));
  }

  function applySentence(el) {
    if (el.closest(HERO) || el.closest(CHROME)) return;
    var t = el.textContent;
    if (!t || !t.trim()) return;
    if (el.classList.contains('faq-question')) {
      var q = t.replace(/\s*\+\s*$/, '').trim();
      setVisibleText(el, sentenceCase(q) + ' ');
      return;
    }
    setVisibleText(el, sentenceCase(t));
  }

  function applyAll() {
    CHROME_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(applyLabel);
    });
  }

  function applyEnglishContent() {
    if (!isEnglishHome()) return;
    LABEL_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(applyLabel);
    });
    SENTENCE_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(applySentence);
    });
  }

  window.applySiteSentenceCase = function () {
    applyAll();
    applyEnglishContent();
  };

  function boot() {
    window.applySiteSentenceCase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('load', boot);
})();
