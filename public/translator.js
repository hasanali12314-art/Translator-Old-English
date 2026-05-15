/**
 * Self-contained translator — loaded on every translator page.
 */
(function () {
  'use strict';

  const MYMEMORY = 'https://api.mymemory.translated.net/get';
  const MAX_CHUNK = 450;

  const LANG = {"auto-detect / any language":"auto","afrikaans":"af","albanian":"sq","amharic":"am","arabic":"ar","armenian":"hy","azerbaijani":"az","basque":"eu","belarusian":"be","bengali":"bn","bosnian":"bs","bulgarian":"bg","catalan":"ca","cebuano":"ceb","chinese (simplified)":"zh-CN","chinese (traditional)":"zh-TW","corsican":"co","croatian":"hr","czech":"cs","danish":"da","dutch":"nl","english":"en","esperanto":"eo","estonian":"et","finnish":"fi","french":"fr","frisian":"fy","galician":"gl","georgian":"ka","german":"de","greek":"el","gujarati":"gu","haitian creole":"ht","hausa":"ha","hawaiian":"haw","hebrew":"he","hindi":"hi","hmong":"hmn","hungarian":"hu","icelandic":"is","igbo":"ig","indonesian":"id","irish":"ga","italian":"it","japanese":"ja","javanese":"jv","kannada":"kn","kazakh":"kk","khmer":"km","korean":"ko","kurdish":"ku","kyrgyz":"ky","lao":"lo","latin":"la","latvian":"lv","lithuanian":"lt","luxembourgish":"lb","macedonian":"mk","malagasy":"mg","malay":"ms","malayalam":"ml","maltese":"mt","maori":"mi","marathi":"mr","mongolian":"mn","myanmar":"my","nepali":"ne","norwegian":"no","nyanja":"ny","odia":"or","pashto":"ps","persian":"fa","polish":"pl","portuguese":"pt","punjabi":"pa","romanian":"ro","russian":"ru","samoan":"sm","scots gaelic":"gd","serbian":"sr","sesotho":"st","shona":"sn","sindhi":"sd","sinhala":"si","slovak":"sk","slovenian":"sl","somali":"so","spanish":"es","sundanese":"su","swahili":"sw","swedish":"sv","tagalog":"tl","tajik":"tg","tamil":"ta","telugu":"te","thai":"th","turkish":"tr","ukrainian":"uk","urdu":"ur","uyghur":"ug","uzbek":"uz","vietnamese":"vi","welsh":"cy","xhosa":"xh","yiddish":"yi","yoruba":"yo","zulu":"zu","ancient greek":"el","old english":"ang","aramaic":"he","egyptian arabic":"ar","navajo":"nv","creole (haitian)":"ht"};

  function langCode(label) {
    const k = String(label || '').trim().toLowerCase();
    return LANG[k] || k.split(/[\s(/]/)[0] || 'en';
  }

  function splitChunks(text) {
    if (text.length <= MAX_CHUNK) return [text];
    const chunks = [];
    let rest = text;
    while (rest.length > MAX_CHUNK) {
      let cut = rest.lastIndexOf('. ', MAX_CHUNK);
      if (cut < MAX_CHUNK / 2) cut = rest.lastIndexOf(' ', MAX_CHUNK);
      if (cut < 1) cut = MAX_CHUNK;
      chunks.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
  }

  async function fetchTranslation(text, source, target) {
    const src = source === 'auto' ? 'en' : source;
    const langpair = src + '|' + target;
    const q = encodeURIComponent(text);

    const url = MYMEMORY + '?q=' + q + '&langpair=' + encodeURIComponent(langpair);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Translation service unavailable (' + res.status + ')');
    const data = await res.json();
    const status = data.responseStatus;
    if (status !== 200 && status !== '200') {
      throw new Error(data.responseDetails || 'Translation failed');
    }
    if (data.quotaFinished) {
      throw new Error('Daily translation limit reached. Please try again tomorrow.');
    }
    const translated = data.responseData && data.responseData.translatedText;
    if (!translated || translated === '-') {
      throw new Error('No translation returned. Try shorter text or a different language.');
    }
    if (String(translated).includes('INVALID TARGET LANGUAGE')) {
      throw new Error('Language not supported by the free API.');
    }
    if (String(translated).includes('MYMEMORY WARNING')) {
      throw new Error('Translation quota exceeded. Please try again later.');
    }
    return translated;
  }

  async function translateApi(text, source, target) {
    const chunks = splitChunks(text);
    const out = [];
    for (let i = 0; i < chunks.length; i++) {
      out.push(await fetchTranslation(chunks[i], source, target));
    }
    return out.join(' ');
  }

  const PRONOUN = [
    [/\byou\b/gi, 'thee'], [/\byour\b/gi, 'thy'], [/\byours\b/gi, 'thine'],
    [/\bare\b/gi, 'art'], [/\bdo\b/gi, 'dost'], [/\bdoes\b/gi, 'doth'],
    [/\bhave\b/gi, 'hast'], [/\bhas\b/gi, 'hath'], [/\bwill\b/gi, 'shalt'],
    [/\bshall\b/gi, 'shalt'], [/\bwas\b/gi, 'wast'], [/\bwere\b/gi, 'wert'],
    [/\bmy\b/gi, 'mine'],
  ];
  const MIDDLE = [
    [/\bthe\b/gi, 'ye'], [/\bof\b/gi, 'o'], [/\bto\b/gi, 'unto'],
    [/\bfrom\b/gi, 'fro'], [/\bwith\b/gi, 'withal'],
    [/\bking\b/gi, 'cyning'], [/\bwarrior\b/gi, 'cempa'], [/\bsea\b/gi, 'sæ'],
    [/\bbrave\b/gi, 'beald'], [/\bstrong\b/gi, 'strang'],
  ];
  const ANCIENT = [
    [/\bhello\b/gi, 'Wes þū hāl'], [/\bthank you\b/gi, 'Ic þancie þē'],
    [/\bking\b/gi, 'cyning'], [/\bglory\b/gi, 'þrym'], [/\blisten\b/gi, 'Hwæt'],
  ];

  function applyRules(text, rules) {
    let o = text;
    for (let i = 0; i < rules.length; i++) o = o.replace(rules[i][0], rules[i][1]);
    return o;
  }

  function toArchaic(text, style, opts) {
    const pronouns = opts.pronouns !== false;
    const verbs = opts.verbs !== false;
    const vocab = opts.vocab !== false;
    let o = text;
    if (pronouns || verbs) o = applyRules(o, PRONOUN);
    if (vocab && (style === 'middle' || style === 'ancient')) o = applyRules(o, MIDDLE);
    if (vocab && style === 'ancient') o = applyRules(o, ANCIENT);
    if (style === 'simple') o = applyRules(o, PRONOUN.slice(0, 6));
    return o;
  }

  const FANCY = {
    script: { u: 0x1d49c, l: 0x1d4b6 },
    bold: { u: 0x1d400, l: 0x1d41a },
    italic: { u: 0x1d434, l: 0x1d44e },
    fraktur: { u: 0x1d504, l: 0x1d51e },
    double: { u: 0x1d538, l: 0x1d552 },
  };

  function toFancy(text) {
    const s = FANCY.script;
    return Array.from(text).map(function (ch) {
      const c = ch.codePointAt(0);
      if (c >= 0x41 && c <= 0x5a) return String.fromCodePoint(s.u + (c - 0x41));
      if (c >= 0x61 && c <= 0x7a) return String.fromCodePoint(s.l + (c - 0x61));
      return ch;
    }).join('');
  }

  const DIALECTS = {
    british: [[/\bcolor\b/gi, 'colour'], [/\bapartment\b/gi, 'flat'], [/\belevator\b/gi, 'lift'], [/\btrash\b/gi, 'rubbish'], [/\bthanks\b/gi, 'cheers']],
    southern: [[/\byou all\b/gi, "y'all"], [/\bhello\b/gi, 'howdy'], [/\bgoing to\b/gi, 'fixin to']],
    scottish: [[/\bnot\b/gi, 'nae'], [/\bhello\b/gi, 'awright'], [/\blittle\b/gi, 'wee'], [/\bmy\b/gi, 'ma']],
    australian: [[/\bhello\b/gi, "g'day"], [/\bfriend\b/gi, 'mate'], [/\bthanks\b/gi, 'ta']],
    irish: [[/\bhello\b/gi, 'howya'], [/\bthanks\b/gi, 'fair play'], [/\byes\b/gi, 'aye']],
  };

  function toDialect(text, dialect) {
    return applyRules(text, DIALECTS[dialect] || DIALECTS.british);
  }

  const NAVAJO = {
    hello: "Yá'át'ééh", 'thank you': 'Ahéheeʼ', goodbye: 'Hágoóneeʼ',
    yes: 'Aooʼ', no: 'Doo', water: 'Tó', family: 'Kʼé', friend: 'Shikʼis',
  };

  function toNavajo(text) {
    const key = text.trim().toLowerCase();
    if (NAVAJO[key]) return NAVAJO[key];
    const words = text.split(/\s+/);
    const tr = words.map(function (w) { return NAVAJO[w.toLowerCase()] || w; });
    if (tr.some(function (w, i) { return w !== words[i]; })) return tr.join(' ');
    throw new Error('Navajo: try hello, thank you, goodbye, yes, no, water, family, friend.');
  }

  async function translate(text, opts) {
    const mode = opts.mode || 'translate';
    const source = opts.source || 'en';
    const target = opts.target || 'es';
    const style = opts.style || 'early';
    const dialect = opts.dialect || 'british';

    if (mode === 'fancy') return toFancy(text);
    if (mode === 'dialect') return toDialect(text, dialect);
    if (mode === 'archaic' || target === 'ang') {
      return toArchaic(text, style, opts);
    }
    if (target === 'nv') return toNavajo(text);
    if (source === target) return text;
    return translateApi(text, source, target);
  }

  function toggleOn(area, key) {
    const el = area.querySelector('[data-toggle="' + key + '"]');
    return !el || el.classList.contains('active');
  }

  function bindTool(area) {
    const root = area;
    const inp = area.querySelector('.comp-input');
    const out = area.querySelector('.comp-output');
    if (!inp || !out) return;

    const charEl = area.querySelector('.comp-char');
    const copyBtn = area.querySelector('.comp-copy');
    const errEl = area.querySelector('.comp-error');
    const btn = area.querySelector('.comp-translate');
    if (!btn) return;

    inp.addEventListener('input', function () {
      if (charEl) charEl.textContent = String(inp.value.length);
    });

    const flip = area.querySelector('.comp-flip');
    if (flip) {
      flip.addEventListener('click', function () {
        const tmp = inp.value;
        inp.value = out.value;
        out.value = tmp;
        const s = root.dataset.sourceLang || 'en';
        const t = root.dataset.targetLang || 'es';
        root.dataset.sourceLang = t;
        root.dataset.targetLang = s;
        const srcSel = area.querySelector('#source-lang');
        const tgtSel = area.querySelector('#target-lang');
        if (srcSel && tgtSel) {
          const v = srcSel.value;
          srcSel.value = tgtSel.value;
          tgtSel.value = v;
        }
        if (charEl) charEl.textContent = String(inp.value.length);
      });
    }

    const clear = area.querySelector('.comp-clear');
    if (clear) {
      clear.addEventListener('click', function () {
        inp.value = '';
        out.value = '';
        if (charEl) charEl.textContent = '0';
        if (copyBtn) copyBtn.style.opacity = '0';
        if (errEl) errEl.style.display = 'none';
      });
    }

    btn.addEventListener('click', async function () {
      const text = inp.value.trim();
      if (!text) return;

      let source = root.dataset.sourceLang || 'en';
      let target = root.dataset.targetLang || 'es';
      const mode = root.dataset.mode || 'translate';

      const srcSel = area.querySelector('#source-lang');
      const tgtSel = area.querySelector('#target-lang');
      if (srcSel && srcSel.value) {
        source = langCode(srcSel.options[srcSel.selectedIndex].text);
      }
      if (tgtSel && tgtSel.value) {
        target = langCode(tgtSel.options[tgtSel.selectedIndex].text);
      }
      if (source === 'auto') source = 'en';

      const styleSel = area.querySelector('#style-select-c');
      const dialectSel = area.querySelector('#dialect-select-c');

      if (errEl) errEl.style.display = 'none';
      const prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Translating…';

      try {
        const result = await translate(text, {
          mode: mode,
          source: source,
          target: target,
          style: styleSel ? styleSel.value : 'early',
          dialect: dialectSel ? dialectSel.value : 'british',
          pronouns: toggleOn(area, 'pronouns'),
          verbs: toggleOn(area, 'verbs'),
          vocab: toggleOn(area, 'vocab'),
        });
        out.value = result;
        out.removeAttribute('placeholder');
        if (copyBtn) copyBtn.style.opacity = '1';
        if (window.saveToHistory) window.saveToHistory('Translation', text, result);
      } catch (e) {
        const msg = (e && e.message) ? e.message : 'Translation failed. Check your connection or disable ad blockers.';
        if (errEl) {
          errEl.textContent = msg;
          errEl.style.display = 'block';
        }
        out.value = '';
        out.placeholder = msg;
      } finally {
        btn.disabled = false;
        btn.textContent = prev || '✦ Translate';
      }
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(out.value);
        copyBtn.textContent = '✓ Copied!';
        setTimeout(function () { copyBtn.textContent = '📋 Copy'; }, 2000);
      });
    }

    area.querySelectorAll('.toggle').forEach(function (t) {
      t.addEventListener('click', function () { t.classList.toggle('active'); });
    });

    const advToggle = area.querySelector('#advancedToggle2');
    const advContent = area.querySelector('#advancedContent2');
    const advArrow = area.querySelector('#advancedArrow2');
    if (advToggle && advContent) {
      advToggle.addEventListener('click', function () {
        const open = advContent.classList.toggle('open');
        if (advArrow) advArrow.style.transform = open ? 'rotate(180deg)' : '';
      });
    }
  }

  /** Homepage tool uses #input-text / #output-text */
  function bindHomepageTool() {
    const inp = document.getElementById('input-text');
    const out = document.getElementById('output-text');
    const btn = document.getElementById('translateBtn');
    if (!inp || !out || !btn) return;

    const charCount = document.getElementById('charCount');
    inp.addEventListener('input', function () {
      if (charCount) charCount.textContent = String(inp.value.length);
    });

    btn.addEventListener('click', async function () {
      const text = inp.value.trim();
      if (!text) return;
      const styleSel = document.getElementById('style-select');
      const style = styleSel ? styleSel.value : 'early';
      const prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Translating…';
      try {
        const result = await translate(text, {
          mode: 'archaic',
          source: 'en',
          target: 'ang',
          style: style,
          pronouns: document.getElementById('pronounToggle')?.classList.contains('active') !== false,
          verbs: document.getElementById('verbToggle')?.classList.contains('active') !== false,
          vocab: document.getElementById('vocabToggle')?.classList.contains('active') !== false,
        });
        out.value = result;
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) copyBtn.style.opacity = '1';
        if (window.saveToHistory) window.saveToHistory(style, text, result);
      } catch (e) {
        out.value = '';
        out.placeholder = (e && e.message) || 'Translation failed';
      } finally {
        btn.disabled = false;
        btn.textContent = prev || '✦ Translate';
      }
    });
  }

  function init() {
    document.querySelectorAll('.tool-area').forEach(bindTool);
    bindHomepageTool();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
