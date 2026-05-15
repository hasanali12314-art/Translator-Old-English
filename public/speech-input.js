/**
 * Web Speech API — voice-to-text for translator inputs
 */
(function () {
  'use strict';

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function getTextarea(btn) {
    const id = btn.getAttribute('data-speech-for');
    if (id) return document.getElementById(id);
    const wrap = btn.closest('.textarea-wrap');
    return wrap ? wrap.querySelector('textarea') : null;
  }

  function bindMic(btn) {
    const textarea = getTextarea(btn);
    if (!textarea) return;

    if (!SpeechRecognition) {
      btn.disabled = true;
      btn.title = 'Voice input is not supported in this browser. Try Chrome or Edge.';
      return;
    }

    let recognition = null;
    let listening = false;
    let baseText = '';

    btn.addEventListener('click', function () {
      if (listening && recognition) {
        recognition.stop();
        return;
      }

      baseText = textarea.value.trim();
      if (baseText && !baseText.endsWith(' ')) baseText += ' ';

      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = btn.getAttribute('data-speech-lang') || 'en-US';

      recognition.onresult = function (e) {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const piece = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += piece;
          else interim += piece;
        }
        const combined = (baseText + final + interim).trim();
        const max = textarea.maxLength > 0 ? textarea.maxLength : 5000;
        textarea.value = combined.slice(0, max);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      };

      recognition.onend = function () {
        listening = false;
        btn.classList.remove('listening');
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Start voice input');
      };

      recognition.onerror = function (ev) {
        listening = false;
        btn.classList.remove('listening');
        btn.setAttribute('aria-pressed', 'false');
        if (ev.error === 'not-allowed') {
          alert('Microphone access was denied. Allow the mic in your browser settings and try again.');
        }
      };

      try {
        recognition.start();
        listening = true;
        btn.classList.add('listening');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Stop voice input');
      } catch (err) {
        listening = false;
      }
    });
  }

  window.fillMainTextInput = function (text, stack) {
    const inp = document.getElementById('input-text') || document.querySelector('.comp-input');
    if (inp) {
      const max = inp.maxLength > 0 ? inp.maxLength : 5000;
      inp.value = String(text || '').trim().slice(0, max);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.focus();
    }
    if (stack) {
      const tab = stack.querySelector('.tool-mode-tab[data-mode="text"]');
      if (tab) tab.click();
    } else {
      document.querySelectorAll('[data-tool-modes]').forEach(function (s) {
        const tab = s.querySelector('.tool-mode-tab[data-mode="text"]');
        if (tab) tab.click();
      });
    }
  };

  function init() {
    document.querySelectorAll('[data-speech-btn]').forEach(bindMic);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
