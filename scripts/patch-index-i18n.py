#!/usr/bin/env python3
from pathlib import Path

p = Path(__file__).resolve().parent.parent / "src/pages/index.astro"
t = p.read_text()
D = "div"

def rep(old, new, n=-1):
    global t
    if n < 0:
        t = t.replace(old, new)
    else:
        t = t.replace(old, new, n)

rep(f'<{D} class="ex-tag example-label">Modern</{D}>', f'<{D} class="ex-tag example-label" data-i18n="examples.modern">Modern</{D}>')
rep(f'<{D} class="ex-modern example-text">{{ex.m}}</{D}>', f'<{D} class="ex-modern example-text" data-i18n={{`examples.ex${{i}}.m`}}>{{ex.m}}</{D}>')
rep(f'<{D} class="ex-tag example-label">Old English</{D}>', f'<{D} class="ex-tag example-label" data-i18n="examples.old">Old English</{D}>', 1)
rep(f'<{D} class="ex-old example-text">{{ex.o}}</{D}>', f'<{D} class="ex-old example-text" data-i18n={{`examples.ex${{i}}.o`}}>{{ex.o}}</{D}>')

rep('<h2 class="sec-title">Choose Your Translation Style</h2>', '<h2 class="sec-title" data-i18n="styles.title">Choose Your Translation Style</h2>')
rep(
    '<p class="sec-sub">Four distinct historical periods — each with its own character. Whether you need an <strong>early modern english translator</strong> or a <strong>middle english translator</strong>, we have you covered.</p>',
    '<p class="sec-sub" data-i18n="styles.sub">Four distinct historical periods — each with its own character. Whether you need an early modern english translator or a middle english translator, we have you covered.</p>',
)

rep('].map(s => (', '].map((s, si) => (', 1)
rep(f'<{D} class="sc-name">{{s.name}}</{D}>', f'<{D} class="sc-name" data-i18n={{`styles.${{si}}.name`}}>{{s.name}}</{D}>')
rep(f'<{D} class="sc-period">{{s.period}}</{D}>', f'<{D} class="sc-period" data-i18n={{`styles.${{si}}.period`}}>{{s.period}}</{D}>')
rep(f'<{D} class="sc-desc">{{s.desc}}</{D}>', f'<{D} class="sc-desc" data-i18n={{`styles.${{si}}.desc`}}>{{s.desc}}</{D}>')

rep('<h2>Old English Translator — Complete Guide</h2>', '<h2 data-i18n="guide.title">Old English Translator — Complete Guide</h2>')
rep(
    '<p>Our <strong>old english translator</strong> is the most advanced free AI tool for converting modern English into authentic archaic language styles spanning over a thousand years of English history. Whether you need an <strong>english to old english translator</strong> for a creative project, an <strong>old english text translator</strong> for academic research, or an <strong>old english words translator</strong> for quick lookups, this tool delivers historically grounded results in seconds.</p>',
    '<p data-i18n="guide.p">Our old english translator is the most advanced free AI tool for converting modern English into authentic archaic language styles spanning over a thousand years of English history. Whether you need an english to old english translator for a creative project, an old english text translator for academic research, or an old english words translator for quick lookups, this tool delivers historically grounded results in seconds.</p>',
)

rep('].map(f => (', '].map((f, fi) => (', 1)
rep(f'<{D} class="feat-name">{{f.name}}</{D}>', f'<{D} class="feat-name" data-i18n={{`feat.${{fi}}.name`}}>{{f.name}}</{D}>')
rep(f'<{D} class="feat-desc">{{f.desc}}</{D}>', f'<{D} class="feat-desc" data-i18n={{`feat.${{fi}}.desc`}}>{{f.desc}}</{D}>')

rep('<h3>How to Translate English to Old English in 3 Steps</h3>', '<h3 data-i18n="steps.title">How to Translate English to Old English in 3 Steps</h3>')
rep(
    '<p>Learning how to <strong>translate english to old english</strong> is simple with our tool. Follow these three steps to <strong>translate from english to old english</strong> — no expertise required.</p>',
    '<p data-i18n="steps.p">Learning how to translate english to old english is simple with our tool. Follow these three steps to translate from english to old english — no expertise required.</p>',
)

rep('].map(s => (', '].map((s, si) => (', 1)  # steps - second map
# steps map - need careful: second ].map(s =>
# find steps section first
steps_i = t.find('class="steps"')
if steps_i > 0:
    sub = t[steps_i:]
    sub = sub.replace('].map(s => (', '].map((s, si) => (', 1)
    t = t[:steps_i] + sub

rep(f'<{D} class="step-title">{{s.title}}</{D}>', f'<{D} class="step-title" data-i18n={{`step.${{si}}.title`}}>{{s.title}}</{D}>')
rep(f'<{D} class="step-desc">{{s.desc}}</{D}>', f'<{D} class="step-desc" data-i18n={{`step.${{si}}.desc`}}>{{s.desc}}</{D}>')

rep('<h3>Middle English to Modern English Translator</h3>', '<h3 data-i18n="middle.title">Middle English to Modern English Translator</h3>')
# middle paragraphs - use first occurrence after middle.title
rep(
    '<p>Our tool doubles as a powerful <strong>middle english to modern english translator</strong>',
    '<p data-i18n="middle.p1">Our tool doubles as a powerful middle english to modern english translator',
    1,
)

rep('<h3>Old Norse, Latin &amp; Ancient Language Translators</h3>', '<h3 data-i18n="norse.title">Old Norse, Latin &amp; Ancient Language Translators</h3>')
rep(
    '<p>Interested in languages beyond Old English? Our platform is expanding to cover more ancient and historical languages:</p>',
    '<p data-i18n="norse.p">Interested in languages beyond Old English? Our platform is expanding to cover more ancient and historical languages:</p>',
)

rep('<h3>Why Use Our Old English Translator?</h3>', '<h3 data-i18n="why.title">Why Use Our Old English Translator?</h3>')
rep('].map(b => (', '].map((b, bi) => (', 1)
rep(f'<{D} class="benefit-name">{{b.name}}</{D}>', f'<{D} class="benefit-name" data-i18n={{`benefit.${{bi}}.name`}}>{{b.name}}</{D}>')
rep(f'<{D} class="benefit-desc">{{b.desc}}</{D}>', f'<{D} class="benefit-desc" data-i18n={{`benefit.${{bi}}.desc`}}>{{b.desc}}</{D}>')

rep('<h3>Who Uses Translator Old English?</h3>', '<h3 data-i18n="who.title">Who Uses Translator Old English?</h3>')
rep('].map(u => (', '].map((u, ui) => (', 1)
rep(f'<{D} class="user-title">{{u.title}}</{D}>', f'<{D} class="user-title" data-i18n={{`user.${{ui}}.title`}}>{{u.title}}</{D}>')
rep(f'<{D} class="user-desc">{{u.desc}}</{D}>', f'<{D} class="user-desc" data-i18n={{`user.${{ui}}.desc`}}>{{u.desc}}</{D}>')

rep('<h2>Old English Translator — Frequently Asked Questions</h2>', '<h2 data-i18n="faq.title">Old English Translator — Frequently Asked Questions</h2>')
rep('{faqItems.map(f => (', '{faqItems.map((f, i) => (')
rep('<button type="button" class="faq-question faq-q">{f.q}', '<button type="button" class="faq-question faq-q" data-i18n={`faq.${i}.q`}>{f.q}')
rep('<span>{f.a}</span>', '<span data-i18n={`faq.${i}.a`}>{f.a}</span>')

rep('<h2>Begin Thy Translation</h2>', '<h2 data-i18n="cta.title">Begin Thy Translation</h2>')
rep('<p>Free, instant, AI-powered — no signup required</p>', '<p data-i18n="cta.p">Free, instant, AI-powered — no signup required</p>', 1)
rep('class="cta-btn btn btn-primary btn-lg">Start Translating Now</a>', 'class="cta-btn btn btn-primary btn-lg" data-i18n="cta.btn">Start Translating Now</a>')

# CTA badges - replace in order
rep(f'<{D} class="badge"><span>♾️</span> Free forever</{D}>', f'<{D} class="badge" data-i18n="cta.badge0"><span>♾️</span> Free forever</{D}>')
rep(f'<{D} class="badge"><span>⚡</span> Instant results</{D}>', f'<{D} class="badge" data-i18n="cta.badge1"><span>⚡</span> Instant results</{D}>')
rep(f'<{D} class="badge"><span>🎯</span> AI-powered accuracy</{D}>', f'<{D} class="badge" data-i18n="cta.badge2"><span>🎯</span> AI-powered accuracy</{D}>')

# middle p2 - second p in middle block
mid = t.find('data-i18n="middle.p1"')
if mid > 0:
    p2start = t.find('<p>You can also use it', mid)
    if p2start > 0:
        old = t[p2start:t.find('</p>', p2start)+4]
        t = t[:p2start] + '<p data-i18n="middle.p2">You can also use it as an english to middle english translator — simply type modern English and select the Medieval style to generate authentic Middle English output. This bidirectional capability makes it the most versatile middle english translator available online.</p>' + t[p2start+len(old):]

# norse list items - simplify li content to data-i18n keys
p.write_text(t)
print('done', 'data-i18n count', t.count('data-i18n'))
