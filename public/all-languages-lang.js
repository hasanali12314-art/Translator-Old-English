/**
 * All-languages page: select target language via #lang-{slug} hash (no ?to= query URLs).
 * Rewrites legacy ?to= links to hash for clean canonicals.
 */
(function () {
  'use strict';

  function slugify(s) {
    return String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function applyLang(name) {
    var target = document.getElementById('target-lang');
    if (!target || !name) return;
    var slug = slugify(name);
    for (var i = 0; i < target.options.length; i++) {
      var opt = target.options[i];
      var label = opt.getAttribute('data-label') || opt.textContent || '';
      if (label === name || slugify(label) === slug) {
        target.selectedIndex = i;
        target.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
    var tool = document.getElementById('tool-area');
    if (tool) tool.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function cleanLegacyQuery() {
    var u = new URL(location.href);
    if (!u.searchParams.has('to')) return;
    var lang = u.searchParams.get('to');
    u.searchParams.delete('to');
    if (lang) u.hash = 'lang-' + slugify(lang);
    history.replaceState(null, '', u.pathname + u.search + u.hash);
    if (lang) applyLang(lang);
  }

  function fromHash() {
    var h = location.hash.replace(/^#/, '');
    if (!h.startsWith('lang-')) return;
    var slug = h.slice(5);
    var card = document.querySelector('[data-lang-slug="' + slug + '"]');
    if (card) applyLang(card.getAttribute('data-lang') || '');
  }

  function init() {
    cleanLegacyQuery();
    fromHash();
    window.addEventListener('hashchange', fromHash);
    document.querySelectorAll('a[data-lang-slug]').forEach(function (a) {
      a.addEventListener('click', function () {
        var name = a.getAttribute('data-lang');
        if (name) window.setTimeout(function () { applyLang(name); }, 0);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
