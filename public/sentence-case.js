/**
 * Site-wide visible-text casing.
 * Rule: only the first word's first letter is capitalized; everything else is lowercase.
 */
(function () {
  'use strict';

  var running = false;
  var pending = false;
  var processedNodes = new WeakSet();

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

  var BLOCK_TEXT_SELECTOR = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'button',
    'label',
    'option',
    'summary',
    'figcaption',
    'blockquote',
    'th',
    'td',
    'legend',
    'caption'
  ].join(',');

  var COMPACT_LINK_BLOCKERS = 'h1,h2,h3,h4,h5,h6,p,div,section,article,ul,ol,li,table';
  var ATTRIBUTES = ['placeholder', 'title', 'aria-label'];

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

  function canTouchElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.tagName === 'OPTION') return true;
    return !el.closest(SKIP_SELECTOR);
  }

  function transformWithState(value, state) {
    var out = '';
    Array.from(String(value || '')).forEach(function (raw) {
      var ch = raw.toLowerCase();
      if (isLatinLetter(ch)) {
        if (!state.seenStart) {
          out += ch.toUpperCase();
          state.seenStart = true;
        } else {
          out += ch;
        }
        return;
      }

      out += ch;
      if (isDigit(ch)) state.seenStart = true;
    });
    return out;
  }

  function transformString(value) {
    return transformWithState(value, { seenStart: false });
  }

  function textNodeFilter(node) {
    var parent = node.parentElement;
    if (!parent || !canTouchElement(parent)) return NodeFilter.FILTER_REJECT;
    if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
    return NodeFilter.FILTER_ACCEPT;
  }

  function applyGroupedElement(el) {
    if (!canTouchElement(el)) return;
    var nodes = [];
    var state = { seenStart: false };
    var walker = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      { acceptNode: textNodeFilter }
    );

    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var next = transformWithState(node.nodeValue, state);
      processedNodes.add(node);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function applyBlockText() {
    document.querySelectorAll(BLOCK_TEXT_SELECTOR).forEach(function (el) {
      if (!canTouchElement(el)) return;
      if (el.parentElement && el.parentElement.closest(BLOCK_TEXT_SELECTOR)) return;
      applyGroupedElement(el);
    });

    document.querySelectorAll('a').forEach(function (el) {
      if (!canTouchElement(el)) return;
      if (el.closest(BLOCK_TEXT_SELECTOR)) return;
      if (el.querySelector(COMPACT_LINK_BLOCKERS)) return;
      applyGroupedElement(el);
    });
  }

  function applyLooseTextNodes() {
    var nodes = [];
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      { acceptNode: textNodeFilter }
    );

    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (processedNodes.has(node)) return;
      var next = transformString(node.nodeValue);
      processedNodes.add(node);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function applyAttributes() {
    ATTRIBUTES.forEach(function (attr) {
      document.querySelectorAll('[' + attr + ']').forEach(function (el) {
        if (!el || !el.hasAttribute(attr)) return;
        var value = el.getAttribute(attr);
        if (!value || !value.trim()) return;
        var next = transformString(value);
        if (next !== value) el.setAttribute(attr, next);
      });
    });
  }

  function applyDocumentTitle() {
    if (!document.title || !document.title.trim()) return;
    var next = transformString(document.title);
    if (next !== document.title) document.title = next;
  }

  function applyAll() {
    if (running) return;
    if (!isEnglishDocument()) return;
    running = true;
    processedNodes = new WeakSet();
    try {
      applyBlockText();
      applyLooseTextNodes();
      applyAttributes();
      applyDocumentTitle();
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
        if (m.type === 'attributes') return ATTRIBUTES.indexOf(m.attributeName) >= 0;
        return Array.from(m.addedNodes || []).some(function (node) {
          return node.nodeType === Node.TEXT_NODE ||
            (node.nodeType === Node.ELEMENT_NODE && !node.matches(SKIP_SELECTOR));
        });
      });
      if (shouldRun) scheduleApply();
    });
    window.__siteSentenceCaseObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ATTRIBUTES,
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
