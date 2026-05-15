/**
 * Text / Images / Documents — OCR, overlay translation, file downloads
 */
(function () {
  'use strict';

  const MAX_BYTES = 10 * 1024 * 1024;
  const TESSERACT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  const PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const MAMMOTH_SRC = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
  const PDFLIB_SRC = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';

  const scriptCache = {};

  function loadScript(src, globalName) {
    if (globalName && window[globalName]) return Promise.resolve();
    if (scriptCache[src]) return scriptCache[src];
    scriptCache[src] = new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-upload-src="' + src + '"]');
      if (existing) {
        if (globalName && window[globalName]) { resolve(); return; }
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', reject);
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.dataset.uploadSrc = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed to load library.')); };
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
    } catch (e) { /* ignore */ }
  }

  function getActiveFile(input, currentFile) {
    if (currentFile) return currentFile;
    return input && input.files && input.files[0] ? input.files[0] : null;
  }

  function extOf(file) {
    const name = file && file.name ? file.name : '';
    return ('.' + (name.split('.').pop() || '')).toLowerCase();
  }

  function baseName(file) {
    const n = file && file.name ? file.name : 'file';
    const i = n.lastIndexOf('.');
    return i > 0 ? n.slice(0, i) : n;
  }

  function showNote(note, text, color) {
    if (!note) return;
    note.hidden = false;
    note.textContent = text;
    note.style.color = color || 'var(--muted)';
  }

  function setBtnVisible(btn, show) {
    if (!btn) return;
    btn.hidden = !show;
    if (show) btn.classList.add('show');
    else btn.classList.remove('show');
  }

  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load image.'));
      };
      img.src = url;
    });
  }

  function enhanceContrast(ctx, w, h) {
    const id = ctx.getImageData(0, 0, w, h);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const v = Math.min(255, Math.max(0, (gray - 128) * 1.45 + 128));
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
  }

  function buildOcrCanvas(img) {
    let scale = 1;
    const maxSide = Math.max(img.width, img.height);
    if (maxSide < 1200) scale = 1200 / maxSide;
    if (maxSide > 2400) scale = 2400 / maxSide;

    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    enhanceContrast(ctx, w, h);
    return { canvas: canvas, scale: scale };
  }

  function normalizeLines(data) {
    const raw = (data && data.lines) ? data.lines : [];
    const lines = raw
      .map(function (line) {
        const text = String(line.text || '').replace(/\s+/g, ' ').trim();
        const b = line.bbox || {};
        return {
          text: text,
          confidence: line.confidence || 0,
          bbox: {
            x0: b.x0 || 0,
            y0: b.y0 || 0,
            x1: b.x1 || 0,
            y1: b.y1 || 0,
          },
        };
      })
      .filter(function (line) {
        return line.text.length > 0 && (line.confidence > 25 || line.text.length > 2);
      });

    if (lines.length) return lines;

    const fallback = String(data && data.text ? data.text : '').trim();
    if (!fallback) return [];
    return fallback.split(/\n+/).map(function (t, i) {
      return {
        text: t.trim(),
        confidence: 100,
        bbox: { x0: 20, y0: 30 + i * 36, x1: 400, y1: 58 + i * 36 },
      };
    }).filter(function (l) { return l.text; });
  }

  async function extractImageText(file) {
    const ext = extOf(file);
    if (ext === '.svg') {
      throw new Error('SVG is not supported for OCR. Upload JPG or PNG.');
    }

    const img = await loadImageFromFile(file);
    const ocrPrep = buildOcrCanvas(img);

    await loadScript(TESSERACT_SRC, 'Tesseract');
    if (!window.Tesseract || !window.Tesseract.createWorker) {
      throw new Error('OCR library failed to load.');
    }

    const worker = await window.Tesseract.createWorker('eng');
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: '1',
        preserve_interword_spaces: '1',
      });
      const result = await worker.recognize(ocrPrep.canvas);
      const data = result && result.data ? result.data : {};
      const lines = normalizeLines(data);
      const text = lines.map(function (l) { return l.text; }).join('\n').trim()
        || String(data.text || '').trim();

      if (!text) throw new Error('No readable text found. Use a clearer, higher-contrast image.');

      return {
        text: text,
        lines: lines,
        sourceImage: img,
        ocrScale: ocrPrep.scale,
      };
    } finally {
      await worker.terminate();
    }
  }

  async function translateString(text) {
    if (!window.getHomeTranslation) {
      throw new Error('Translator not ready. Refresh the page and try again.');
    }
    const chunkSize = 3500;
    if (text.length <= chunkSize) return window.getHomeTranslation(text);

    const parts = [];
    let rest = text;
    while (rest.length) {
      let cut = rest.lastIndexOf('\n', chunkSize);
      if (cut < chunkSize * 0.4) cut = rest.lastIndexOf(' ', chunkSize);
      if (cut < 1) cut = chunkSize;
      const piece = rest.slice(0, cut).trim();
      parts.push(await window.getHomeTranslation(piece));
      rest = rest.slice(cut).trim();
    }
    return parts.join('\n\n');
  }

  async function translateOcrLines(lines) {
    const translated = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const raw = line.text.trim();
      if (!raw) {
        translated.push(Object.assign({}, line, { translatedText: '' }));
        continue;
      }
      try {
        const tr = await translateString(raw);
        translated.push(Object.assign({}, line, { translatedText: tr }));
      } catch (e) {
        translated.push(Object.assign({}, line, { translatedText: raw }));
      }
    }
    return translated;
  }

  function wrapCanvasLines(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let current = '';
    words.forEach(function (word) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }

  function drawTextInBox(ctx, text, x, y, w, h) {
    let fontSize = Math.max(11, Math.min(22, Math.floor(h * 0.72)));
    let drawn = [];
    while (fontSize >= 9) {
      ctx.font = '600 ' + fontSize + 'px "Crimson Pro", Georgia, serif';
      drawn = wrapCanvasLines(ctx, text, w - 6);
      const totalH = drawn.length * fontSize * 1.22;
      if (totalH <= h + 4) break;
      fontSize -= 1;
    }
    ctx.fillStyle = '#1a1510';
    let cy = y + fontSize;
    drawn.forEach(function (ln) {
      ctx.fillText(ln, x + 3, cy, w - 6);
      cy += fontSize * 1.22;
    });
  }

  function renderTranslatedImage(sourceImage, lines, ocrScale, mimeType) {
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0);

    lines.forEach(function (line) {
      const tr = line.translatedText || line.text;
      if (!tr) return;
      const b = line.bbox;
      const x0 = b.x0 / ocrScale;
      const y0 = b.y0 / ocrScale;
      const x1 = b.x1 / ocrScale;
      const y1 = b.y1 / ocrScale;
      const w = Math.max(24, x1 - x0);
      const h = Math.max(16, y1 - y0);

      ctx.fillStyle = 'rgba(250, 247, 242, 0.94)';
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
      ctx.lineWidth = 1;
      const pad = 3;
      ctx.fillRect(x0 - pad, y0 - pad, w + pad * 2, h + pad * 2);
      ctx.strokeRect(x0 - pad, y0 - pad, w + pad * 2, h + pad * 2);
      drawTextInBox(ctx, tr, x0, y0, w, h);
    });

    const outMime = mimeType === 'image/jpeg' || mimeType === 'image/jpg' ? 'image/jpeg' : 'image/png';
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve({
          blob: blob,
          dataUrl: canvas.toDataURL(outMime, 0.92),
          mime: outMime,
        });
      }, outMime, 0.92);
    });
  }

  async function extractPdfText(file) {
    await loadScript(PDFJS_SRC, 'pdfjsLib');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    const data = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: data }).promise;
    const parts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      parts.push(content.items.map(function (item) { return item.str; }).join(' '));
    }
    return parts.join('\n\n').trim();
  }

  async function extractDocxText(file) {
    await loadScript(MAMMOTH_SRC, 'mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return String(result && result.value ? result.value : '').trim();
  }

  async function extractDocumentText(file) {
    const ext = extOf(file);
    if (ext === '.txt' || ext === '.md' || ext === '.srt') {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () { resolve(String(reader.result || '')); };
        reader.onerror = function () { reject(new Error('Could not read file.')); };
        reader.readAsText(file);
      });
    }
    if (ext === '.pdf') {
      const text = await extractPdfText(file);
      if (text) return text;
      throw new Error('No selectable text in PDF. Save pages as images and use the Images tab for OCR.');
    }
    if (ext === '.docx') return extractDocxText(file);
    if (ext === '.doc') {
      throw new Error('Legacy .DOC is not supported. Save as .DOCX or .TXT.');
    }
    throw new Error('Unsupported document type.');
  }

  async function translateSrt(content) {
    const blocks = content.trim().split(/\n\n+/);
    const out = [];
    for (let i = 0; i < blocks.length; i++) {
      const lines = blocks[i].split('\n');
      if (lines.length < 2) {
        out.push(blocks[i]);
        continue;
      }
      const timingIdx = lines.findIndex(function (l) { return l.includes('-->'); });
      if (timingIdx < 0) {
        out.push(blocks[i]);
        continue;
      }
      const head = lines.slice(0, timingIdx + 1);
      const caption = lines.slice(timingIdx + 1).join('\n').trim();
      const tr = caption ? await translateString(caption) : '';
      out.push(head.concat([tr]).join('\n'));
    }
    return out.join('\n\n') + '\n';
  }

  async function buildTranslatedPdf(text, file) {
    await loadScript(PDFLIB_SRC, 'PDFLib');
    const pdfDoc = await window.PDFLib.PDFDocument.create();
    const font = await pdfDoc.embedFont(window.PDFLib.StandardFonts.TimesRoman);
    const fontSize = 11;
    const margin = 50;
    const lineHeight = fontSize * 1.35;
    const charsPerLine = 90;
    const linesPerPage = 42;

    const allLines = [];
    String(text).split('\n').forEach(function (para) {
      const p = para.trim();
      if (!p) { allLines.push(''); return; }
      let rest = p;
      while (rest.length) {
        allLines.push(rest.slice(0, charsPerLine));
        rest = rest.slice(charsPerLine);
      }
    });

    let idx = 0;
    while (idx < allLines.length) {
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      let y = height - margin;
      let count = 0;
      while (idx < allLines.length && count < linesPerPage) {
        page.drawText(allLines[idx] || ' ', {
          x: margin,
          y: y,
          size: fontSize,
          font: font,
          maxWidth: width - margin * 2,
        });
        y -= lineHeight;
        idx += 1;
        count += 1;
      }
    }

    const bytes = await pdfDoc.save();
    return {
      blob: new Blob([bytes], { type: 'application/pdf' }),
      filename: baseName(file) + '-translated.pdf',
    };
  }

  function buildTranslatedWordDoc(text, file) {
    const safe = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Georgia,serif;font-size:12pt;line-height:1.6;">' + safe + '</body></html>';
    const ext = extOf(file);
    const filename = baseName(file) + '-translated.' + (ext === '.doc' ? 'doc' : 'doc');
    return {
      blob: new Blob(['\ufeff', html], { type: 'application/msword' }),
      filename: filename,
    };
  }

  async function buildTranslatedDocument(file, originalText, translatedText) {
    const ext = extOf(file);
    const name = baseName(file);

    if (ext === '.pdf') return buildTranslatedPdf(translatedText, file);
    if (ext === '.doc' || ext === '.docx') return buildTranslatedWordDoc(translatedText, file);

    const mimeMap = {
      '.txt': 'text/plain;charset=utf-8',
      '.md': 'text/markdown;charset=utf-8',
      '.srt': 'application/x-subrip;charset=utf-8',
    };
    return {
      blob: new Blob([translatedText], { type: mimeMap[ext] || 'text/plain;charset=utf-8' }),
      filename: name + '-translated' + ext,
    };
  }

  function initStack(stack) {
    const tabs = stack.querySelectorAll('.tool-mode-tab');
    const panels = stack.querySelectorAll('.tool-mode-panel');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const mode = tab.dataset.mode || 'text';
        tabs.forEach(function (t) {
          const on = t === tab;
          t.classList.toggle('active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach(function (panel) {
          const on = panel.dataset.panel === mode;
          panel.classList.toggle('active', on);
          if (on) panel.removeAttribute('hidden');
          else panel.setAttribute('hidden', '');
        });
      });
    });

    setupImageUpload(stack);
    setupDocUpload(stack);
  }

  function validateFile(file, allowedExt) {
    if (!file) return 'No file selected.';
    if (file.size > MAX_BYTES) return 'File exceeds 10 MB limit.';
    if (allowedExt.indexOf(extOf(file)) === -1) return 'File type not supported.';
    return null;
  }

  function setupDropZone(zone, input, onFile) {
    if (!zone || !input) return;
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', function () { zone.classList.remove('dragover'); });
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

  function setupImageUpload(stack) {
    const input = stack.querySelector('#imageFileInput');
    const zone = stack.querySelector('#imageUploadZone');
    const nameEl = stack.querySelector('#imageFileName');
    const preview = stack.querySelector('#imagePreview');
    const note = stack.querySelector('#imageUploadNote');
    const btn = stack.querySelector('#imageTranslateBtn');
    const fileDl = stack.querySelector('#imageFileDownload');
    const translatedDl = stack.querySelector('#imageTranslatedDownload');
    const extractBlock = stack.querySelector('#imageExtractBlock');
    const extractTa = stack.querySelector('#imageExtractedText');
    const resultBlock = stack.querySelector('#imageResultBlock');
    const resultPreview = stack.querySelector('#imageTranslatedPreview');
    const resultLink = stack.querySelector('#imageTranslatedPreviewLink');
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const btnDefault = btn ? btn.textContent : '✦ Translate Image';
    let currentFile = null;
    let translatedBlob = null;
    let translatedUrl = null;

    function revokeTranslatedUrl() {
      if (translatedUrl) {
        URL.revokeObjectURL(translatedUrl);
        translatedUrl = null;
      }
    }

    function clear() {
      if (input) input.value = '';
      currentFile = null;
      translatedBlob = null;
      revokeTranslatedUrl();
      setBtnVisible(fileDl, false);
      setBtnVisible(translatedDl, false);
      if (nameEl) { nameEl.hidden = true; nameEl.textContent = ''; }
      if (preview) { preview.hidden = true; preview.src = ''; }
      if (note) { note.hidden = true; note.textContent = ''; }
      if (extractBlock) extractBlock.hidden = true;
      if (extractTa) extractTa.value = '';
      if (resultBlock) resultBlock.hidden = true;
      if (resultPreview) resultPreview.src = '';
    }

    function onFile(file) {
      const err = validateFile(file, allowed);
      if (err) { showNote(note, err, '#c04040'); return; }
      assignFileToInput(input, file);
      currentFile = file;
      translatedBlob = null;
      revokeTranslatedUrl();
      if (nameEl) { nameEl.hidden = false; nameEl.textContent = file.name; }
      if (note) note.hidden = true;
      setBtnVisible(fileDl, true);
      setBtnVisible(translatedDl, false);
      if (extractBlock) extractBlock.hidden = true;
      if (resultBlock) resultBlock.hidden = true;
      if (extractTa) extractTa.value = '';
      if (preview) {
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
      if (currentFile && window.downloadBlob) window.downloadBlob(currentFile, currentFile.name);
    });

    translatedDl?.addEventListener('click', function () {
      if (!translatedBlob) return;
      const ext = translatedBlob.type === 'image/jpeg' ? '.jpg' : '.png';
      const fname = baseName(currentFile || { name: 'image' }) + '-translated' + ext;
      if (window.downloadBlob) window.downloadBlob(translatedBlob, fname);
    });

    btn?.addEventListener('click', async function () {
      const file = getActiveFile(input, currentFile);
      const err = validateFile(file, allowed);
      if (err) { showNote(note, err, '#c04040'); return; }

      btn.disabled = true;
      btn.textContent = 'Running OCR…';
      showNote(note, 'Enhancing image and reading text…', 'var(--gold)');

      try {
        const ocr = await extractImageText(file);
        if (extractTa) extractTa.value = ocr.text.slice(0, 5000);
        if (extractBlock) extractBlock.hidden = false;

        showNote(note, 'Translating text on image…', 'var(--gold)');
        btn.textContent = 'Translating…';

        const translatedLines = await translateOcrLines(ocr.lines);
        const rendered = await renderTranslatedImage(
          ocr.sourceImage,
          translatedLines,
          ocr.ocrScale,
          file.type
        );

        translatedBlob = rendered.blob;
        revokeTranslatedUrl();
        translatedUrl = URL.createObjectURL(rendered.blob);

        if (resultPreview) resultPreview.src = rendered.dataUrl;
        if (resultLink) resultLink.href = translatedUrl;
        if (resultBlock) resultBlock.hidden = false;
        setBtnVisible(translatedDl, true);

        const fullTranslated = translatedLines.map(function (l) { return l.translatedText || l.text; }).join('\n');
        if (window.fillMainTextInput) window.fillMainTextInput(fullTranslated, stack);
        if (window.runHomeTranslate) await window.runHomeTranslate(fullTranslated);

        showNote(note, 'Done! Download the translated image below.', 'var(--gold-lt)');
      } catch (e) {
        showNote(note, (e && e.message) || 'Image translation failed.', '#c04040');
      } finally {
        btn.disabled = false;
        btn.textContent = btnDefault;
      }
    });

    stack.querySelector('#imageSpeechApply')?.addEventListener('click', function () {
      const speechTa = stack.querySelector('#imageSpeechText');
      const text = speechTa && speechTa.value.trim();
      if (!text) {
        showNote(note, 'Speak or type text first.', '#c04040');
        return;
      }
      if (window.fillMainTextInput) window.fillMainTextInput(text, stack);
      showNote(note, 'Text loaded in Text mode.', 'var(--gold)');
    });
  }

  function setupDocUpload(stack) {
    const input = stack.querySelector('#docFileInput');
    const zone = stack.querySelector('#docUploadZone');
    const nameEl = stack.querySelector('#docFileName');
    const note = stack.querySelector('#docUploadNote');
    const btn = stack.querySelector('#docTranslateBtn');
    const fileDl = stack.querySelector('#docFileDownload');
    const translatedDl = stack.querySelector('#docTranslatedDownload');
    const extractBlock = stack.querySelector('#docExtractBlock');
    const extractTa = stack.querySelector('#docExtractedText');
    const translatedBlock = stack.querySelector('#docTranslatedBlock');
    const translatedTa = stack.querySelector('#docTranslatedText');
    const allowed = ['.pdf', '.doc', '.docx', '.txt', '.md', '.srt'];
    const btnDefault = btn ? btn.textContent : '✦ Translate Document';
    let currentFile = null;
    let translatedDoc = null;

    function clear() {
      if (input) input.value = '';
      currentFile = null;
      translatedDoc = null;
      setBtnVisible(fileDl, false);
      setBtnVisible(translatedDl, false);
      if (nameEl) { nameEl.hidden = true; nameEl.textContent = ''; }
      if (note) { note.hidden = true; note.textContent = ''; }
      if (extractBlock) extractBlock.hidden = true;
      if (translatedBlock) translatedBlock.hidden = true;
      if (extractTa) extractTa.value = '';
      if (translatedTa) translatedTa.value = '';
    }

    function onFile(file) {
      const err = validateFile(file, allowed);
      if (err) { showNote(note, err, '#c04040'); return; }
      assignFileToInput(input, file);
      currentFile = file;
      translatedDoc = null;
      if (nameEl) {
        nameEl.hidden = false;
        nameEl.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
      }
      if (note) note.hidden = true;
      setBtnVisible(fileDl, true);
      setBtnVisible(translatedDl, false);
      if (extractBlock) extractBlock.hidden = true;
      if (translatedBlock) translatedBlock.hidden = true;
    }

    setupDropZone(zone, input, onFile);
    stack.querySelector('[data-clear-upload="documents"]')?.addEventListener('click', clear);

    fileDl?.addEventListener('click', function () {
      if (currentFile && window.downloadBlob) window.downloadBlob(currentFile, currentFile.name);
    });

    translatedDl?.addEventListener('click', function () {
      if (!translatedDoc || !window.downloadBlob) return;
      window.downloadBlob(translatedDoc.blob, translatedDoc.filename);
    });

    btn?.addEventListener('click', async function () {
      const file = getActiveFile(input, currentFile);
      const err = validateFile(file, allowed);
      if (err) { showNote(note, err, '#c04040'); return; }

      btn.disabled = true;
      btn.textContent = 'Reading…';
      showNote(note, 'Extracting document text…', 'var(--gold)');

      try {
        let raw = await extractDocumentText(file);
        if (!raw.trim()) throw new Error('No text found in document.');

        if (extractTa) extractTa.value = raw.slice(0, 8000);
        if (extractBlock) extractBlock.hidden = false;

        showNote(note, 'Translating document…', 'var(--gold)');
        btn.textContent = 'Translating…';

        const ext = extOf(file);
        let translated;
        if (ext === '.srt') {
          translated = await translateSrt(raw);
        } else {
          translated = await translateString(raw.trim().slice(0, 12000));
        }

        if (translatedTa) translatedTa.value = translated.slice(0, 8000);
        if (translatedBlock) translatedBlock.hidden = false;

        translatedDoc = await buildTranslatedDocument(file, raw, translated);
        setBtnVisible(translatedDl, true);

        if (window.fillMainTextInput) window.fillMainTextInput(translated, stack);
        if (window.runHomeTranslate) await window.runHomeTranslate(translated);

        showNote(note, 'Done! Download the translated document (' + translatedDoc.filename + ').', 'var(--gold-lt)');
      } catch (e) {
        showNote(note, (e && e.message) || 'Document translation failed.', '#c04040');
      } finally {
        btn.disabled = false;
        btn.textContent = btnDefault;
      }
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
