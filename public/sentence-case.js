/**
 * Label case (first letter only) for nav/footer/UI.
 * Sentence case for body copy — excludes .hero-section.
 */
(function () {
  'use strict';

  function labelCase(str) {
    const s = String(str || '').trim();
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  function sentenceCase(str) {
    const s = String(str || '').trim();
    if (!s) return s;
    return s
      .toLowerCase()
      .replace(/(^\s*\S|[.!?…]+\s+\S|:\s+\S)/g, function (m) {
        return m.toUpperCase();
      });
  }

  function inHero(el) {
    return !!el.closest('.hero-section');
  }

  function inChrome(el) {
    return !!el.closest('.site-header, .mobile-nav, .site-footer');
  }

  const LABEL_SELECTORS = [
    '.site-header .nav-link',
    '.site-header .nav-dropdown-btn',
    '.site-header .dropdown-item',
    '.mobile-nav .mobile-nav-link',
    '.mobile-nav .mobile-nav-sub',
    '.mobile-nav .mobile-nav-label',
    '.site-footer .footer-col h4',
    '.site-footer .footer-col ul a',
    '.site-footer .footer-meta-link',
    '.field-label',
    '.control-label',
    '.tool-box label',
    '.trans-lang',
    '.tool-mode-tab',
    '.flip-lbl',
    '.example-label',
    '.ex-tag',
    '.upload-extract-block label',
    '.upload-result-block label',
    '.speech-bridge-label',
    '.adv-item label',
    '.history-item-style',
    '.upload-title',
    '.hdr-btn .hdr-label',
    '.btn-clear',
    '.btn-translate',
    '.btn-primary',
    '.comp-translate',
    '#translateBtn',
    '#imageTranslateBtn',
    '#docTranslateBtn',
    '.copy-btn',
    '.download-btn',
    '.faq-question',
    '.feat-name',
    '.benefit-name',
    '.user-title',
    '.step-title',
    '.sc-name',
    '.sc-period',
    '.badge',
    '.trust-badge',
    '.cta-btn',
  ];

  const SENTENCE_SELECTORS = [
    '.sec-sub',
    '.sec-title',
    '.info-block h2',
    '.info-block h3',
    '.info-block p',
    '.info-block li',
    '.feat-desc',
    '.step-desc',
    '.benefit-desc',
    '.user-desc',
    '.sc-desc',
    '.ex-modern',
    '.ex-old',
    '.example-text',
    '.faq-answer',
    '.faq-answer span',
    '.cta-banner p',
    '.cta p',
    '.upload-hint',
    '.upload-note',
    '.speech-bridge-hint',
    '.history-item-text',
    '.history-empty p',
    '.select option',
    '.adv-btn',
    '.advanced-toggle',
  ];

  function applyLabelCaseEl(el) {
    if (inHero(el)) return;
    if (el.closest('svg')) return;
    const t = el.textContent;
    if (!t || !t.trim()) return;
    el.textContent = labelCase(t);
  }

  function applySentenceCaseEl(el) {
    if (inHero(el) || inChrome(el)) return;
    if (el.closest('svg, script, style, .format-badge')) return;
    const t = el.textContent;
    if (!t || !t.trim()) return;
    if (el.tagName === 'BUTTON' && el.classList.contains('faq-question')) {
      const icon = el.querySelector('.faq-icon');
      const q = t.replace(/\s*\+\s*$/, '').trim();
      el.textContent = '';
      el.appendChild(document.createTextNode(sentenceCase(q) + ' '));
      if (icon) el.appendChild(icon);
      return;
    }
    el.textContent = sentenceCase(t);
  }

  function shouldApplyContent() {
    if (!document.querySelector('.page-home')) return true;
    try {
      const loc = localStorage.getItem('oe-site-locale');
      return !loc || loc === 'en';
    } catch (e) {
      return true;
    }
  }

  function applyAll() {
    LABEL_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(applyLabelCaseEl);
    });
    if (!shouldApplyContent()) return;
    SENTENCE_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(applySentenceCaseEl);
    });
    document.querySelectorAll('.faq-question').forEach(applySentenceCaseEl);
  }

  window.applySiteSentenceCase = applyAll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }
})();
