/**
 * Site-wide English casing.
 * Rule: first visible word starts with a capital letter; the rest is lowercase.
 */
(function () {
  'use strict';

  var running = false;
  var pending = false;

  var SKIP_SELECTOR = [
    'script',
    'style',
    'noscript',
    'template',
    'input',
    'textarea',
    'select',
    'svg',
    'code',
    'pre',
    'kbd',
    'samp',
    '.visually-hidden',
    '.format-icon',
    '.format-badge',
    '.footer-locale-select'
  ].join(',');

  var LABEL_SELECTORS = [
    '.site-header a.nav-link',
    '.site-header .logo-main',
    '.site-header .logo-sub',
    '.site-header .nav-dropdown-btn',
    '.site-header .dropdown-item',
    '.mobile-nav .mobile-nav-link',
    '.mobile-nav .mobile-nav-sub',
    '.mobile-nav .mobile-nav-label',
    '.site-footer .footer-col-title',
    '.site-footer .logo-main',
    '.site-footer .footer-col ul a',
    '.site-footer .footer-social a',
    '.site-footer .footer-meta-row a',
    '.site-footer .footer-meta-link',
    '.hdr-btn .hdr-label',
    '.breadcrumb a',
    '.breadcrumb span:not([aria-hidden])',
    '.tool-page-back',
    '.field-label',
    '.control-label',
    '.tool-box label',
    '.upload-extract-block label',
    '.upload-result-block label',
    '.trans-lang',
    '.flip-lbl',
    '.tool-mode-tab',
    '.speech-bridge-label',
    '.advanced-toggle',
    '.adv-btn',
    '.adv-item label',
    '.range-labels span',
    '.example-label',
    '.ex-tag',
    '.sc-name',
    '.sc-period',
    '.feat-name',
    '.benefit-name',
    '.user-title',
    '.step-title',
    '.badge',
    '.btn',
    '.btn-clear',
    '.btn-translate',
    '.copy-btn',
    '.download-btn',
    '.upload-download-btn',
    '.cta-btn',
    '.related-card',
    '.history-panel-title',
    '.history-item-style',
    'main .card > div:last-child',
    'main .card footer',
    'main .card span:not(.format-badge):not(.gold-text)',
    'select option'
  ];
  var CHROME_LABEL_COUNT = 15;

  var SENTENCE_SELECTORS = [
    'main h1',
    'main h2',
    'main h3',
    'main h4',
    'main h5',
    'main h6',
    'main p',
    'main li',
    '.hero-tag',
    '.hero-sub',
    '.sec-title',
    '.sec-sub',
    '.section-heading h2',
    '.section-heading h3',
    '.info-block h2',
    '.info-block h3',
    '.info-block p',
    '.info-block li',
    '.page-seo-heading',
    '.page-seo-section h3',
    '.example-text',
    '.ex-modern',
    '.ex-old',
    '.sc-desc',
    '.feat-desc',
    '.benefit-desc',
    '.user-desc',
    '.step-desc',
    '.faq-question',
    '.faq-answer',
    '.faq-answer span',
    '.upload-title',
    '.upload-hint',
    '.speech-bridge-hint',
    '.blog-related-title',
    '.related-card-title',
    '.cta h2',
    '.cta h3',
    '.cta-title',
    '.cta p',
    '.footer-tagline',
    '.footer-copy',
    '.history-empty p',
    '.comp-error',
    '.upload-note',
    '.locale-toast',
    '.site-search-results h2',
    '.site-search-results p',
    '.site-search-results li'
  ];

  var ATTRIBUTE_SELECTORS = [
    '[placeholder]',
    '[title]',
    '[aria-label]'
  ];

  function isLatinLetter(ch) {
    return /[A-Za-z\u00C0-\u024F]/.test(ch);
  }

  function isDigit(ch) {
    return /[0-9]/.test(ch);
  }

  function isEnglishDocument() {
    var lang = document.documentElement.getAttribute('lang') || 'en';
    return !lang || /^en\b/i.test(lang);
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

  function canTouchElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.tagName === 'OPTION') return true;
    return !el.closest(SKIP_SELECTOR);
  }

  function transformString(value, mode) {
    var state = mode === 'sentence'
      ? { capitalizeNext: true }
      : { seenStart: false };
    return transformText(value, mode, state);
  }

  function transformText(value, mode, state) {
    var out = '';
    Array.from(String(value || '')).forEach(function (raw) {
      var ch = raw.toLowerCase();
      if (isLatinLetter(ch)) {
        if (mode === 'sentence') {
          if (state.capitalizeNext) {
            out += ch.toUpperCase();
            state.capitalizeNext = false;
          } else {
            out += ch;
          }
        } else if (!state.seenStart) {
          out += ch.toUpperCase();
          state.seenStart = true;
        } else {
          out += ch;
        }
        return;
      }

      out += ch;
      if (isDigit(ch)) {
        if (mode === 'sentence' && state.capitalizeNext) state.capitalizeNext = false;
        if (mode !== 'sentence') state.seenStart = true;
      }
      if (mode === 'sentence' && /[.!?…]/.test(raw)) {
        state.capitalizeNext = true;
      }
    });
    return out;
  }

  function textNodeFilter(node) {
    var parent = node.parentElement;
    if (!parent || !canTouchElement(parent)) return NodeFilter.FILTER_REJECT;
    if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
    return NodeFilter.FILTER_ACCEPT;
  }

  function applyElementCase(el, mode) {
    if (!canTouchElement(el)) return;

    var state = mode === 'sentence'
      ? { capitalizeNext: true }
      : { seenStart: false };
    var nodes = [];
    var walker = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      { acceptNode: textNodeFilter }
    );

    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var next = transformText(node.nodeValue, mode, state);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function applyAttributeCase(el, attr) {
    if (!el || !el.hasAttribute(attr)) return;
    var value = el.getAttribute(attr);
    if (!value || !value.trim()) return;
    var next = transformString(value, 'label');
    if (next !== value) el.setAttribute(attr, next);
  }

  function applySelectorList(selectors, mode) {
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        applyElementCase(el, mode);
      });
    });
  }

  function applyChrome() {
    applySelectorList(LABEL_SELECTORS.slice(0, CHROME_LABEL_COUNT), 'label');
  }

  function applyEnglishContent() {
    if (!isEnglishDocument() || !isEnglishHome()) return;
    applySelectorList(SENTENCE_SELECTORS, 'sentence');
    applySelectorList(LABEL_SELECTORS, 'label');
    ATTRIBUTE_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        applyAttributeCase(el, 'placeholder');
        applyAttributeCase(el, 'title');
        applyAttributeCase(el, 'aria-label');
      });
    });
  }

  function applyAll() {
    if (running) return;
    running = true;
    try {
      applyChrome();
      applyEnglishContent();
    } finally {
      running = false;
    }
  }

  function scheduleApply() {
    if (running || pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      applyAll();
    });
  }

  window.applySiteSentenceCase = applyAll;

  function boot() {
    applyAll();
    if (window.__siteSentenceCaseObserver) return;
    window.__siteSentenceCaseObserver = new MutationObserver(function (mutations) {
      if (running) return;
      var shouldRun = mutations.some(function (m) {
        if (m.type === 'characterData') return true;
        return Array.from(m.addedNodes || []).some(function (node) {
          return node.nodeType === Node.TEXT_NODE ||
            (node.nodeType === Node.ELEMENT_NODE && !node.matches(SKIP_SELECTOR));
        });
      });
      if (shouldRun) scheduleApply();
    });
    window.__siteSentenceCaseObserver.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('load', applyAll);
})();
