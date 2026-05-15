/**
 * Shared behaviour for translator / tool pages
 */
(function () {
  'use strict';

  function getInputs() {
    return {
      inp: document.getElementById('input-text') || document.querySelector('.comp-input'),
      out: document.getElementById('output-text') || document.querySelector('.comp-output'),
      charEl: document.getElementById('charCount') || document.querySelector('.comp-char'),
      copyBtn: document.getElementById('copyBtn') || document.querySelector('.comp-copy'),
      downloadBtn: document.getElementById('downloadBtn') || document.querySelector('.comp-download'),
    };
  }

  function showOutActions(copyBtn, downloadBtn) {
    [copyBtn, downloadBtn].forEach(function (btn) {
      if (!btn) return;
      btn.style.opacity = '1';
      btn.classList.add('show');
    });
  }

  function loadExample(input, output) {
    const els = getInputs();
    if (els.inp) {
      els.inp.value = input;
      els.inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (els.out) {
      els.out.value = output;
      els.out.removeAttribute('placeholder');
    }
    if (els.charEl) els.charEl.textContent = String(input.length);
    showOutActions(els.copyBtn, els.downloadBtn);
    const tool = document.getElementById('tool-area');
    if (tool) tool.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function initExamples() {
    document.querySelectorAll('.ex-card[data-input]').forEach(function (card) {
      function activate() {
        loadExample(
          card.getAttribute('data-input') || '',
          card.getAttribute('data-output') || ''
        );
      }
      card.addEventListener('click', activate);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  function initMobileScroll() {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    requestAnimationFrame(function () {
      const tool = document.getElementById('tool-area');
      if (!tool) return;
      if (tool.getBoundingClientRect().top > window.innerHeight * 0.25) {
        tool.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function init() {
    initExamples();
    initMobileScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
