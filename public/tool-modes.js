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

  let ocrWorkerPromise = null;

  async function loadImageFromFile(file) {
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        if (bitmap.close) bitmap.close();
        return canvasToImage(canvas);
      } catch (e) { /* fall through */ }
    }
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

  function canvasToImage(canvas) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = canvas.toDataURL('image/png');
    });
  }

  function enhanceContrast(ctx, w, h) {
    const id = ctx.getImageData(0, 0, w, h);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const v = Math.min(255, Math.max(0, (gray - 128) * 1.55 + 128));
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
  }

  function otsuThreshold(histogram, total) {
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];
    let sumB = 0;
    let wB = 0;
    let max = 0;
    let threshold = 128;
    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (!wB) continue;
      const wF = total - wB;
      if (!wF) break;
      sumB += t * histogram[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > max) {
        max = between;
        threshold = t;
      }
    }
    return threshold;
  }

  function binarizeCanvas(sourceCanvas) {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const sctx = sourceCanvas.getContext('2d');
    const octx = out.getContext('2d');
    const id = sctx.getImageData(0, 0, w, h);
    const d = id.data;
    const histogram = new Array(256).fill(0);
    const gray = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      gray[p] = g;
      histogram[g]++;
    }
    const th = otsuThreshold(histogram, w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const v = gray[p] > th ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    octx.putImageData(id, 0, 0);
    return out;
  }

  function buildOcrCanvas(img) {
    let scale = 1;
    const maxSide = Math.max(img.width, img.height);
    if (maxSide < 1600) scale = 1600 / maxSide;
    if (maxSide > 3200) scale = 3200 / maxSide;

    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    enhanceContrast(ctx, w, h);
    return { canvas: canvas, scale: scale };
  }

  function buildOcrVariants(img) {
    const base = buildOcrCanvas(img);
    return [
      { canvas: base.canvas, scale: base.scale, label: 'enhanced' },
      { canvas: binarizeCanvas(base.canvas), scale: base.scale, label: 'binary' },
    ];
  }

  function mergeBbox(words) {
    let x0 = Infinity; let y0 = Infinity; let x1 = 0; let y1 = 0;
    words.forEach(function (w) {
      const b = w.bbox || {};
      x0 = Math.min(x0, b.x0 || 0);
      y0 = Math.min(y0, b.y0 || 0);
      x1 = Math.max(x1, b.x1 || 0);
      y1 = Math.max(y1, b.y1 || 0);
    });
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  function linesFromWords(data) {
    const words = (data && data.words) ? data.words : [];
    const usable = words.filter(function (w) {
      const t = String(w.text || '').trim();
      return t && (w.confidence == null || w.confidence > 15);
    });
    if (!usable.length) return [];

    usable.sort(function (a, b) {
      const ay = ((a.bbox && a.bbox.y0) || 0) + ((a.bbox && a.bbox.y1) || 0);
      const by = ((b.bbox && b.bbox.y0) || 0) + ((b.bbox && b.bbox.y1) || 0);
      if (Math.abs(ay - by) > 20) return ay - by;
      return ((a.bbox && a.bbox.x0) || 0) - ((b.bbox && b.bbox.x0) || 0);
    });

    const lines = [];
    let group = [];
    let groupY = null;

    usable.forEach(function (w) {
      const b = w.bbox || {};
      const cy = ((b.y0 || 0) + (b.y1 || 0)) / 2;
      const lineH = Math.max(12, (b.y1 || 0) - (b.y0 || 0));
      if (group.length && groupY != null && Math.abs(cy - groupY) > lineH * 0.65) {
        lines.push(group);
        group = [];
      }
      group.push(w);
      groupY = groupY == null ? cy : (groupY + cy) / 2;
    });
    if (group.length) lines.push(group);

    return lines.map(function (chunk) {
      const conf = chunk.reduce(function (s, w) { return s + (w.confidence || 0); }, 0) / chunk.length;
      return {
        text: chunk.map(function (w) { return String(w.text || '').trim(); }).filter(Boolean).join(' '),
        confidence: conf,
        bbox: mergeBbox(chunk),
      };
    }).filter(function (l) { return l.text.length > 0; });
  }

  function normalizeLines(data) {
    const raw = (data && data.lines) ? data.lines : [];
    let lines = raw
      .map(function (line) {
        const text = String(line.text || '').replace(/\s+/g, ' ').trim();
        const b = line.bbox || {};
        return {
          text: text,
          confidence: line.confidence || 0,
          bbox: { x0: b.x0 || 0, y0: b.y0 || 0, x1: b.x1 || 0, y1: b.y1 || 0 },
        };
      })
      .filter(function (line) {
        return line.text.length > 0 && (line.confidence > 20 || line.text.length > 2);
      });

    if (lines.length < 2) {
      const fromWords = linesFromWords(data);
      if (fromWords.length > lines.length) lines = fromWords;
    }

    if (lines.length) return lines;

    const fallback = String(data && data.text ? data.text : '').trim();
    if (!fallback) return [];
    return fallback.split(/\n+/).map(function (t, i) {
      return {
        text: t.trim(),
        confidence: 60,
        bbox: { x0: 16, y0: 24 + i * 40, x1: 480, y1: 56 + i * 40 },
      };
    }).filter(function (l) { return l.text; });
  }

  function scoreOcrResult(data) {
    const text = String(data && data.text ? data.text : '').trim();
    const words = (data && data.words) ? data.words : [];
    const confs = words
      .filter(function (w) { return String(w.text || '').trim(); })
      .map(function (w) { return w.confidence || 0; });
    const avg = confs.length
      ? confs.reduce(function (a, b) { return a + b; }, 0) / confs.length
      : (text.length > 8 ? 45 : 0);
    return avg + Math.min(text.length, 400) * 0.05;
  }

  function cleanOcrText(text) {
    return String(text || '')
      .replace(/[|¦]/g, 'I')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\S\n]+/g, ' ')
      .trim();
  }

  async function getOcrWorker() {
    await loadScript(TESSERACT_SRC, 'Tesseract');
    if (!window.Tesseract || !window.Tesseract.createWorker) {
      throw new Error('OCR library failed to load. Check your internet connection.');
    }
    if (!ocrWorkerPromise) {
      ocrWorkerPromise = window.Tesseract.createWorker('eng').then(async function (worker) {
        await worker.setParameters({ preserve_interword_spaces: '1' });
        return worker;
      });
    }
    return ocrWorkerPromise;
  }

  async function recognizeCanvas(worker, canvas, psm) {
    await worker.setParameters({ tessedit_pageseg_mode: String(psm) });
    const result = await worker.recognize(canvas);
    return result && result.data ? result.data : {};
  }

  async function runBestOcr(worker, variants) {
    const tries = [
      { v: 0, psm: 3 },
      { v: 1, psm: 6 },
      { v: 0, psm: 6 },
      { v: 1, psm: 11 },
      { v: 1, psm: 3 },
      { v: 0, psm: 11 },
      { v: 0, psm: 4 },
      { v: 1, psm: 4 },
    ];
    let best = null;

    for (let i = 0; i < tries.length; i++) {
      const t = tries[i];
      const variant = variants[t.v];
      if (!variant) continue;
      try {
        const data = await recognizeCanvas(worker, variant.canvas, t.psm);
        const score = scoreOcrResult(data);
        if (!best || score > best.score) {
          best = { score: score, data: data, scale: variant.scale };
        }
        if (best.score >= 78) break;
      } catch (e) { /* try next */ }
    }

    if (!best) throw new Error('OCR could not read this image. Try a clearer photo with good lighting.');
    return best;
  }

  async function extractImageText(file) {
    const ext = extOf(file);
    if (ext === '.svg') {
      throw new Error('SVG is not supported for OCR. Upload JPG or PNG.');
    }

    const img = await loadImageFromFile(file);
    const variants = buildOcrVariants(img);
    let worker;
    try {
      worker = await getOcrWorker();
    } catch (e) {
      ocrWorkerPromise = null;
      throw e;
    }
    const best = await runBestOcr(worker, variants);
    const data = best.data;
    const lines = normalizeLines(data);
    const text = cleanOcrText(
      lines.map(function (l) { return l.text; }).join('\n') || String(data.text || '')
    );

    if (!text || text.length < 2) {
      throw new Error('No readable text found. Use a straight, well-lit photo of printed or typed text.');
    }

    return {
      text: text,
      lines: lines.length ? lines : normalizeLines({ text: text, words: [], lines: [] }),
      sourceImage: img,
      ocrScale: best.scale,
    };
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
      ctx.font = '600 ' + fontSize + 'px CinzelFont, Georgia, serif';
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

  function renderTranslatedImageSimple(sourceImage, translatedText, mimeType) {
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0);

    const pad = 14;
    const maxPanelH = Math.min(Math.round(sourceImage.height * 0.42), 220);
    const maxW = sourceImage.width - pad * 2;
    let fontSize = Math.max(14, Math.min(22, Math.round(sourceImage.width / 28)));
    let lines = [];
    while (fontSize >= 11) {
      ctx.font = '600 ' + fontSize + 'px CinzelFont, Georgia, serif';
      lines = wrapCanvasLines(ctx, translatedText, maxW);
      if (lines.length * fontSize * 1.28 + pad * 2 <= maxPanelH) break;
      fontSize -= 1;
    }
    const panelH = Math.min(maxPanelH, lines.length * fontSize * 1.28 + pad * 2);
    const y0 = sourceImage.height - panelH;

    ctx.fillStyle = 'rgba(250, 247, 242, 0.96)';
    ctx.fillRect(0, y0, sourceImage.width, panelH);
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, y0, sourceImage.width, panelH);

    ctx.fillStyle = '#1a1510';
    let cy = y0 + pad + fontSize;
    lines.forEach(function (ln) {
      ctx.fillText(ln, pad, cy, maxW);
      cy += fontSize * 1.28;
    });

    const outMime = mimeType === 'image/jpeg' || mimeType === 'image/jpg' ? 'image/jpeg' : 'image/png';
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve({ blob: blob, dataUrl: canvas.toDataURL(outMime, 0.92), mime: outMime });
      }, outMime, 0.92);
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
    const resultWrap = stack.querySelector('#imageTranslatedPreviewWrap');
    const resultPreview = stack.querySelector('#imageTranslatedPreview');
    const resultLink = stack.querySelector('#imageTranslatedPreviewLink');
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const btnDefault = btn ? btn.textContent : '✦ Translate Image';
    let currentFile = null;
    let translatedBlob = null;
    let translatedUrl = null;
    let ocrCache = null;

    function fileKey(file) {
      return file.name + '|' + file.size + '|' + file.lastModified;
    }

    function revokeTranslatedUrl() {
      if (translatedUrl) {
        URL.revokeObjectURL(translatedUrl);
        translatedUrl = null;
      }
    }

    function clear() {
      if (input) input.value = '';
      currentFile = null;
      ocrCache = null;
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
      if (resultWrap) resultWrap.hidden = true;
      if (resultPreview) resultPreview.src = '';
      if (resultLink) resultLink.removeAttribute('href');
    }

    function onFile(file) {
      const err = validateFile(file, allowed);
      if (err) { showNote(note, err, '#c04040'); return; }
      assignFileToInput(input, file);
      currentFile = file;
      ocrCache = null;
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
        const key = fileKey(file);
        const manualText = extractTa && extractTa.value.trim();
        let ocr;
        const reuseOcr = ocrCache && ocrCache.key === key && manualText;

        if (reuseOcr) {
          ocr = {
            text: manualText,
            lines: ocrCache.lines,
            sourceImage: ocrCache.sourceImage,
            ocrScale: ocrCache.ocrScale,
          };
          showNote(note, 'Using detected text. Translating…', 'var(--gold)');
        } else {
          ocr = await extractImageText(file);
          ocrCache = {
            key: key,
            text: ocr.text,
            lines: ocr.lines,
            sourceImage: ocr.sourceImage,
            ocrScale: ocr.ocrScale,
          };
          if (extractTa) extractTa.value = ocr.text.slice(0, 5000);
          if (extractBlock) extractBlock.hidden = false;
          showNote(note, 'Text detected. Translating on image…', 'var(--gold)');
        }

        btn.textContent = 'Translating…';
        const textForTranslate = (extractTa && extractTa.value.trim()) || ocr.text;
        const userEdited = reuseOcr && manualText !== ocrCache.text;
        let rendered;
        let fullTranslated;

        if (userEdited || !ocr.lines.length) {
          fullTranslated = await translateString(textForTranslate);
          rendered = await renderTranslatedImageSimple(ocr.sourceImage, fullTranslated, file.type);
        } else {
          const translatedLines = await translateOcrLines(ocr.lines);
          rendered = await renderTranslatedImage(
            ocr.sourceImage,
            translatedLines,
            ocr.ocrScale,
            file.type
          );
          fullTranslated = translatedLines.map(function (l) { return l.translatedText || l.text; }).join('\n');
        }

        translatedBlob = rendered.blob;
        revokeTranslatedUrl();
        translatedUrl = URL.createObjectURL(rendered.blob);

        if (resultPreview) resultPreview.src = rendered.dataUrl;
        if (resultLink) resultLink.href = translatedUrl;
        if (resultWrap) resultWrap.hidden = false;
        if (resultBlock) resultBlock.hidden = false;
        setBtnVisible(translatedDl, true);

        if (window.fillMainTextInput) window.fillMainTextInput(fullTranslated, stack);
        if (window.runHomeTranslate) await window.runHomeTranslate(fullTranslated);

        showNote(note, 'Done! Fix OCR text above if needed, then download the translated image.', 'var(--gold-lt)');
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
