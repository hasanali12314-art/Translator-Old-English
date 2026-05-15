/**
 * Text / Images / Documents mode tabs above translator tool
 */
(function () {
  'use strict';

  const MAX_BYTES = 10 * 1024 * 1024;

  function initStack(stack) {
    const tabs = stack.querySelectorAll('.tool-mode-tab');
    const panels = stack.querySelectorAll('.tool-mode-panel');

    function setMode(mode) {
      tabs.forEach(function (tab) {
        const on = tab.dataset.mode === mode;
        tab.classList.toggle('active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(function (panel) {
        const on = panel.dataset.panel === mode;
        panel.classList.toggle('active', on);
        if (on) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        setMode(tab.dataset.mode || 'text');
      });
    });

    setupImageUpload(stack);
    setupDocUpload(stack);
  }

  function validateFile(file, allowedExt) {
    if (!file) return 'No file selected.';
    if (file.size > MAX_BYTES) return 'File exceeds 10 MB limit.';
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (allowedExt.indexOf(ext) === -1) return 'File type not supported.';
    return null;
  }

  function setupDropZone(zone, input, onFile) {
    if (!zone || !input) return;
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('dragover');
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) onFile(file);
    });
    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (file) onFile(file);
    });
  }

  function downloadFile(file) {
    if (!file) return;
    if (window.downloadBlob) {
      window.downloadBlob(file, file.name);
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function setupImageUpload(stack) {
    const input = stack.querySelector('#imageFileInput');
    const zone = stack.querySelector('#imageUploadZone');
    const nameEl = stack.querySelector('#imageFileName');
    const preview = stack.querySelector('#imagePreview');
    const note = stack.querySelector('#imageUploadNote');
    const btn = stack.querySelector('#imageTranslateBtn');
    const fileDl = stack.querySelector('#imageFileDownload');
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    let currentFile = null;

    function clear() {
      if (input) input.value = '';
      currentFile = null;
      if (fileDl) fileDl.hidden = true;
      if (nameEl) { nameEl.hidden = true; nameEl.textContent = ''; }
      if (preview) { preview.hidden = true; preview.src = ''; }
      if (note) { note.hidden = true; note.textContent = ''; }
    }

    function onFile(file) {
      const err = validateFile(file, allowed);
      if (err) {
        if (note) { note.hidden = false; note.textContent = err; note.style.color = '#c04040'; }
        return;
      }
      if (nameEl) {
        nameEl.hidden = false;
        nameEl.textContent = file.name;
      }
      if (note) note.hidden = true;
      currentFile = file;
      if (fileDl) fileDl.hidden = false;
      if (preview && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function () {
          preview.src = reader.result;
          preview.hidden = false;
        };
        reader.readAsDataURL(file);
      }
    }

    setupDropZone(zone, input, onFile);

    stack.querySelector('[data-clear-upload="images"]')?.addEventListener('click', clear);

    fileDl?.addEventListener('click', function () {
      if (!currentFile) return;
      downloadFile(currentFile);
    });

    btn?.addEventListener('click', function () {
      const file = input && input.files && input.files[0];
      const err = validateFile(file, allowed);
      if (err) {
        if (note) { note.hidden = false; note.textContent = err; note.style.color = '#c04040'; }
        return;
      }
      if (note) {
        note.hidden = false;
        note.style.color = 'var(--muted)';
        note.textContent = 'Image received: “' + file.name + '”. Switch to Text mode to paste extracted text, or full image OCR translation is coming soon.';
      }
    });

    const speechTa = stack.querySelector('#imageSpeechText');
    const speechApply = stack.querySelector('#imageSpeechApply');
    speechApply?.addEventListener('click', function () {
      const text = speechTa && speechTa.value.trim();
      if (!text) {
        if (note) {
          note.hidden = false;
          note.style.color = '#c04040';
          note.textContent = 'Speak or type some text first, then tap “Use in Text Translator”.';
        }
        return;
      }
      if (window.fillMainTextInput) window.fillMainTextInput(text, stack);
      if (note) {
        note.hidden = false;
        note.style.color = 'var(--gold)';
        note.textContent = 'Text loaded. Click Translate in Text mode.';
      }
    });
  }

  function setupDocUpload(stack) {
    const input = stack.querySelector('#docFileInput');
    const zone = stack.querySelector('#docUploadZone');
    const nameEl = stack.querySelector('#docFileName');
    const note = stack.querySelector('#docUploadNote');
    const btn = stack.querySelector('#docTranslateBtn');
    const fileDl = stack.querySelector('#docFileDownload');
    const allowed = ['.pdf', '.doc', '.docx', '.txt', '.md', '.srt'];
    let currentFile = null;

    function clear() {
      if (input) input.value = '';
      currentFile = null;
      if (fileDl) fileDl.hidden = true;
      if (nameEl) { nameEl.hidden = true; nameEl.textContent = ''; }
      if (note) { note.hidden = true; note.textContent = ''; }
    }

    function onFile(file) {
      const err = validateFile(file, allowed);
      if (err) {
        if (note) { note.hidden = false; note.textContent = err; note.style.color = '#c04040'; }
        return;
      }
      if (nameEl) {
        nameEl.hidden = false;
        nameEl.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
      }
      if (note) note.hidden = true;
      currentFile = file;
      if (fileDl) fileDl.hidden = false;
    }

    setupDropZone(zone, input, onFile);

    stack.querySelector('[data-clear-upload="documents"]')?.addEventListener('click', clear);

    fileDl?.addEventListener('click', function () {
      if (!currentFile) return;
      downloadFile(currentFile);
    });

    btn?.addEventListener('click', function () {
      const file = input && input.files && input.files[0];
      const err = validateFile(file, allowed);
      if (err) {
        if (note) { note.hidden = false; note.textContent = err; note.style.color = '#c04040'; }
        return;
      }
      if (file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.srt')) {
        const reader = new FileReader();
        reader.onload = function () {
          const text = String(reader.result || '').trim();
          setModeText(stack);
          const inp = document.getElementById('input-text') || document.querySelector('.comp-input');
          if (inp) {
            inp.value = text.slice(0, 5000);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (note) {
            note.hidden = false;
            note.style.color = 'var(--gold)';
            note.textContent = 'Text loaded into translator. Click Translate in Text mode.';
          }
        };
        reader.readAsText(file);
        return;
      }
      if (note) {
        note.hidden = false;
        note.style.color = 'var(--muted)';
        note.textContent = 'Document “' + file.name + '” ready. PDF/DOCX parsing coming soon — use .TXT, .MD, or .SRT for instant load.';
      }
    });
  }

  function setModeText(stack) {
    const tab = stack.querySelector('.tool-mode-tab[data-mode="text"]');
    if (tab) tab.click();
  }

  function init() {
    document.querySelectorAll('[data-tool-modes]').forEach(initStack);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
