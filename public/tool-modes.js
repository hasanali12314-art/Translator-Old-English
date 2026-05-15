/**
 * Text / Images / Documents mode tabs — OCR & document text extraction
 */
(function () {
  'use strict';

  const MAX_BYTES = 10 * 1024 * 1024;
  const TESSERACT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  const PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const MAMMOTH_SRC = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';

  const scriptCache = {};

  function loadScript(src, globalName) {
    if (globalName && window[globalName]) return Promise.resolve();
    if (scriptCache[src]) return scriptCache[src];
    scriptCache[src] = new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-upload-src="' + src + '"]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', reject);
        if (globalName && window[globalName]) resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.dataset.uploadSrc = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
    return scriptCache[src];
  }

  function assignFileToInput(input, file) {
    if (!input || !file) return;
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
    } catch (e) {
      /* DataTransfer unsupported — rely on currentFile fallback */
    }
  }

  function getActiveFile(input, currentFile) {
    if (currentFile) return currentFile;
    return input && input.files && input.files[0] ? input.files[0] : null;
  }

  function extOf(file) {
    const name = file && file.name ? file.name : '';
    return ('.' + (name.split('.').pop() || '')).toLowerCase();
  }

  function showNote(note, text, color) {
    if (!note) return;
    note.hidden = false;
    note.textContent = text;
    note.style.color = color || 'var(--muted)';
  }

  function setModeText(stack) {
    const tab = stack.querySelector('.tool-mode-tab[data-mode="text"]');
    if (tab) tab.click();
  }

  async function extractImageText(file) {
    await loadScript(TESSERACT_SRC, 'Tesseract');
    if (!window.Tesseract || !window.Tesseract.createWorker) {
      throw new Error('OCR library failed to load. Check your connection and try again.');
    }
    const worker = await window.Tesseract.createWorker('eng');
    try {
      const result = await worker.recognize(file);
      return String(result && result.data && result.data.text ? result.data.text : '').trim();
    } finally {
      await worker.terminate();
    }
  }

  async function extractPdfText(file) {
    await loadScript(PDFJS_SRC, 'pdfjsLib');
    if (!window.pdfjsLib) throw new Error('PDF reader failed to load.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    const data = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: data }).promise;
    const parts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      parts.push(content.items.map(function (item) { return item.str; }).join(' '));
    }
    return parts.join('\n').trim();
  }

  async function extractDocxText(file) {
    await loadScript(MAMMOTH_SRC, 'mammoth');
    if (!window.mammoth) throw new Error('Document reader failed to load.');
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return String(result && result.value ? result.value : '').trim();
  }

  async function extractDocumentText(file) {
    const ext = extOf(file);
    if (ext === '.txt' || ext === '.md' || ext === '.srt') {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () { resolve(String(reader.result || '').trim()); };
        reader.onerror = function () { reject(new Error('Could not read file.')); };
        reader.readAsText(file);
      });
    }
    if (ext === '.pdf') {
      const text = await extractPdfText(file);
      if (text) return text;
      throw new Error('No selectable text in this PDF. Try a scan as an image (Images tab) for OCR.');
    }
    if (ext === '.docx') return extractDocxText(file);
    if (ext === '.doc') {
      throw new Error('Legacy .DOC files are not supported. Save as .DOCX or .TXT and try again.');
    }
    throw new Error('Unsupported document type.');
  }

  async function processUpload(stack, file, opts) {
    const extractTa = opts.extractTa;
    const extractBlock = opts.extractBlock;
    const note = opts.note;
    const btn = opts.btn;
    const btnDefault = opts.btnDefault;

    if (!file) throw new Error('No file selected.');

    if (btn) {
      btn.disabled = true;
      btn.textContent = opts.processingLabel || 'Processing…';
    }
    showNote(note, opts.processingNote || 'Reading file…', 'var(--gold)');

    try {
      const text = await opts.extract(file);
      if (!text) throw new Error('No text found. Use a clearer image or a text-based document.');

      if (extractTa) extractTa.value = text.slice(0, 5000);
      if (extractBlock) extractBlock.hidden = false;

      if (window.fillMainTextInput) window.fillMainTextInput(text, stack);

      showNote(note, 'Text extracted. Translating…', 'var(--gold)');

      if (window.runHomeTranslate) {
        await window.runHomeTranslate(text);
        showNote(note, 'Done! Translation is in the Text tab.', 'var(--gold-lt)');
      } else {
        setModeText(stack);
        showNote(note, 'Text loaded. Open the Text tab and click Translate.', 'var(--gold-lt)');
      }
      return text;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = btnDefault;
      }
    }
  }

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
    const ext = extOf(file);
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
    const extractBlock = stack.querySelector('#imageExtractBlock');
    const extractTa = stack.querySelector('#imageExtractedText');
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const btnDefault = btn ? btn.textContent : '✦ Translate Image';
    let currentFile = null;

    function clear() {
      if (input) input.value = '';
      currentFile = null;
      if (fileDl) fileDl.hidden = true;
      if (nameEl) { nameEl.hidden = true; nameEl.textContent = ''; }
      if (preview) { preview.hidden = true; preview.src = ''; }
      if (note) { note.hidden = true; note.textContent = ''; }
      if (extractBlock) extractBlock.hidden = true;
      if (extractTa) extractTa.value = '';
    }

    function onFile(file) {
      const err = validateFile(file, allowed);
      if (err) {
        showNote(note, err, '#c04040');
        return;
      }
      assignFileToInput(input, file);
      currentFile = file;
      if (nameEl) {
        nameEl.hidden = false;
        nameEl.textContent = file.name;
      }
      if (note) note.hidden = true;
      if (fileDl) fileDl.hidden = false;
      if (extractBlock) extractBlock.hidden = true;
      if (extractTa) extractTa.value = '';
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
      const file = getActiveFile(input, currentFile);
      const err = validateFile(file, allowed);
      if (err) {
        showNote(note, err, '#c04040');
        return;
      }
      processUpload(stack, file, {
        extract: extractImageText,
        extractTa: extractTa,
        extractBlock: extractBlock,
        note: note,
        btn: btn,
        btnDefault: btnDefault,
        processingLabel: 'Running OCR…',
        processingNote: 'Extracting text from image (OCR). This may take a moment…',
      }).catch(function (e) {
        showNote(note, (e && e.message) || 'OCR failed.', '#c04040');
      });
    });

    const speechTa = stack.querySelector('#imageSpeechText');
    const speechApply = stack.querySelector('#imageSpeechApply');
    speechApply?.addEventListener('click', function () {
      const text = speechTa && speechTa.value.trim();
      if (!text) {
        showNote(note, 'Speak or type some text first, then tap “Use in Text Translator”.', '#c04040');
        return;
      }
      if (window.fillMainTextInput) window.fillMainTextInput(text, stack);
      showNote(note, 'Text loaded. Click Translate in Text mode.', 'var(--gold)');
    });
  }

  function setupDocUpload(stack) {
    const input = stack.querySelector('#docFileInput');
    const zone = stack.querySelector('#docUploadZone');
    const nameEl = stack.querySelector('#docFileName');
    const note = stack.querySelector('#docUploadNote');
    const btn = stack.querySelector('#docTranslateBtn');
    const fileDl = stack.querySelector('#docFileDownload');
    const extractBlock = stack.querySelector('#docExtractBlock');
    const extractTa = stack.querySelector('#docExtractedText');
    const allowed = ['.pdf', '.doc', '.docx', '.txt', '.md', '.srt'];
    const btnDefault = btn ? btn.textContent : '✦ Translate Document';
    let currentFile = null;

    function clear() {
      if (input) input.value = '';
      currentFile = null;
      if (fileDl) fileDl.hidden = true;
      if (nameEl) { nameEl.hidden = true; nameEl.textContent = ''; }
      if (note) { note.hidden = true; note.textContent = ''; }
      if (extractBlock) extractBlock.hidden = true;
      if (extractTa) extractTa.value = '';
    }

    function onFile(file) {
      const err = validateFile(file, allowed);
      if (err) {
        showNote(note, err, '#c04040');
        return;
      }
      assignFileToInput(input, file);
      currentFile = file;
      if (nameEl) {
        nameEl.hidden = false;
        nameEl.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
      }
      if (note) note.hidden = true;
      if (fileDl) fileDl.hidden = false;
      if (extractBlock) extractBlock.hidden = true;
      if (extractTa) extractTa.value = '';
    }

    setupDropZone(zone, input, onFile);

    stack.querySelector('[data-clear-upload="documents"]')?.addEventListener('click', clear);

    fileDl?.addEventListener('click', function () {
      if (!currentFile) return;
      downloadFile(currentFile);
    });

    btn?.addEventListener('click', function () {
      const file = getActiveFile(input, currentFile);
      const err = validateFile(file, allowed);
      if (err) {
        showNote(note, err, '#c04040');
        return;
      }
      processUpload(stack, file, {
        extract: extractDocumentText,
        extractTa: extractTa,
        extractBlock: extractBlock,
        note: note,
        btn: btn,
        btnDefault: btnDefault,
        processingLabel: 'Reading document…',
        processingNote: 'Extracting text from document…',
      }).catch(function (e) {
        showNote(note, (e && e.message) || 'Could not read document.', '#c04040');
      });
    });
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
