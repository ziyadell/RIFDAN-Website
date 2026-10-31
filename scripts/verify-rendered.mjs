// End-to-end checks against the running site, in a real browser (Edge or Chrome).
// Usage: node scripts/verify-rendered.mjs [url]   (start `npm run preview` first)
import { chromium } from 'playwright-core';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv[2] ?? 'http://127.0.0.1:4173/rifdan-site/';
const m = JSON.parse(readFileSync(resolve(root, 'source/metrics.json'), 'utf8'));
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`);
};
const fmt = (x, d = 0) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const scrollAll = async (p) => {
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 450) {
    await p.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
    await p.waitForTimeout(90);
  }
  await p.waitForTimeout(900);
};

const browser = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch({ channel: 'chrome' }));
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const problems = [];
p.on('pageerror', (e) => problems.push(e.message));
p.on('console', (msg) => { if (['error', 'warning'].includes(msg.type())) problems.push(msg.text()); });
p.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });
await p.goto(url, { waitUntil: 'networkidle' });
await scrollAll(p);

// --- 1. Every chart mark equals metrics.json ---
const marks = await p.evaluate(() => ({
  bands: [...document.querySelectorAll('[data-chart="bands"] [data-key]')].map((e) => [e.dataset.key, +e.dataset.value]),
  cohorts: [...document.querySelectorAll('[data-chart="cohorts"] [data-key]')].map((e) => [e.dataset.key, +e.dataset.value]),
  monthly: [...document.querySelectorAll('[data-chart="monthly"] [data-key]')].map((e) => [e.dataset.key, +e.dataset.value]),
  hours: [...document.querySelectorAll('[data-chart="hours"] [data-key]')].map((e) => [e.dataset.key, +e.dataset.value]),
  cox: [...document.querySelectorAll('[data-chart="cox"] [data-key]')].map((e) => [e.dataset.key, +e.dataset.hr, +e.dataset.lo, +e.dataset.hi]),
  km: JSON.parse(document.querySelector('[data-chart="km"] .km-line').dataset.points),
}));
const diff = (name, rendered, expected) => {
  const miss = rendered.filter(([k, v]) => expected.get(k) !== v);
  check(`${name}: ${rendered.length} marks equal metrics.json`, rendered.length === expected.size && miss.length === 0, miss.length ? JSON.stringify(miss.slice(0, 3)) : '');
};
const bandMap = new Map(m.amount_bands.flatMap((b) => [[`${b.band}|count_pct`, b.count_pct], [`${b.band}|amount_pct`, b.amount_pct]]));
diff('bands', marks.bands, bandMap);
diff('cohorts', marks.cohorts, new Map(m.cohorts.months.map((c) => [c.month, c.return_30d_pct])));
diff('monthly', marks.monthly, new Map(m.monthly.map((x) => [x.year_month, x.transactions])));
diff('hours', marks.hours, new Map(m.by_hour.map((x) => [String(x.hour), x.transactions])));
const coxMap = new Map(m.cox.terms.map((t) => [t.term, t]));
check(`cox: ${marks.cox.length} rows equal metrics.json`, marks.cox.length === m.cox.terms.length && marks.cox.every(([k, hr, lo, hi]) => coxMap.get(k).hazard_ratio === hr && coxMap.get(k).ci95[0] === lo && coxMap.get(k).ci95[1] === hi));
const curve = new Map(m.survival.curve.map((c) => [c.day, c.survival]));
check(`km: ${marks.km.length} points equal metrics.json`, marks.km.length === 60 && marks.km.every(([d, s]) => curve.get(d) === s));

// --- 2. Displayed text equals metrics.json ---
const rawText = await p.evaluate(() => document.body.textContent);
const text = rawText.replace(/[⁦⁩]/g, '').replace(/ /g, ' ');
const o = m.overview;
const d = m.donors;
const s = m.survival;
const v = m.value_sizing;
const expected = [
  ['transactions', fmt(o.transactions)], ['total amount', fmt(o.total_amount)], ['initiatives', `${o.unique_initiatives} مبادرة`], ['donors', fmt(o.observed_donors)],
  ['median', `${fmt(o.median)} ر.س`], ['mean', `${fmt(o.mean, 1)} ر.س`], ['top1 share', `${fmt(d.top1_donor_amount_share_pct, 1)}%`], ['top10% share', `${fmt(d.top10pct_donors_amount_share_pct, 1)}%`],
  ['top1 transactions', `${d.top1_donor_transactions} عملية`],
  ['band 2-10 txn', `${fmt(m.amount_bands[1].count_pct, 1)}%`], ['band 2-10 amount', `${fmt(m.amount_bands[1].amount_pct, 1)}%`], ['band 5k txn', `${fmt(m.amount_bands[5].count_pct, 1)}%`], ['band 5k amount', `${fmt(m.amount_bands[5].amount_pct, 1)}%`],
  ['cohort', fmt(s.cohort)], ['return 30', `${fmt(s.return_rate_pct['30'], 1)}%`], ['median days', `${fmt(s.median_days_to_second)} يوماً`], ['censored', fmt(s.censored)],
  ['cox first amount', fmt(m.cox.terms.find((t) => t.term === 'log_first_amount').hazard_ratio, 3)], ['cox p', 'p = 0.40'], ['c-index', `C-index = ${fmt(m.cox.concordance, 3)}`],
  ['log-rank', `p = ${fmt(Object.values(s.tests)[1].p_value, 4)}`], ['cohort min', `${fmt(m.cohorts.min_pct, 1)}%`], ['cohort max', `${fmt(m.cohorts.max_pct, 1)}%`], ['cohort median', `${fmt(m.cohorts.median_pct, 1)}%`],
  ['auc', `AUC ${fmt(m.prediction.test.auc, 3)}`], ['baseline', fmt(m.prediction.baseline.test_auc, 3)], ['auc ci low', `−${fmt(Math.abs(m.prediction.bootstrap.ci95[0]), 3)}`], ['auc ci high', `+${fmt(m.prediction.bootstrap.ci95[1], 3)}`],
  ['peak share', `${fmt(m.peak_window.share_txn_pct, 1)}%`], ['rank effect', `+${fmt(m.peak_test.rank_biserial, 3)}`], ['sizing', `${fmt(v.lower_bound_sar)}–${fmt(v.upper_bound_sar)} ر.س`],
  ['silhouette', `Silhouette ${fmt(m.segmentation.silhouette_chosen, 2)}`], ['ARI', `Adjusted Rand = ${fmt(m.segmentation.stability_ari_min, 2)}`],
  ...m.insights.slice(0, 4).map((i) => [`rec ${i.id}`, `${fmt(i.affected_amount_share_pct, 1)}%`]),
  ...m.insights.slice(0, 4).map((i) => [`rec title ${i.id}`, i.title]),
  ...m.action_plans.map((a) => [`plan ${a.id}`, a.title]),
  ['peak month', fmt(Math.max(...m.monthly.map((x) => x.transactions)))],
  ['button label', 'افتح اللوحة التفاعلية'],
];
const missing = expected.filter(([, want]) => !text.includes(want));
check(`text: ${expected.length} stated values found as formatted from metrics.json`, missing.length === 0, JSON.stringify(missing));

// Sweep: every number on the page must trace to metrics.json or to a listed structural value.
const known = new Set();
const addForms = (n) => {
  for (const f of [n, Math.abs(n), n * 100, 100 - n * 100]) for (let i = 0; i <= 4; i += 1) known.add(fmt(Math.abs(f), i));
};
const walk = (x) => {
  if (typeof x === 'number') addForms(x);
  else if (typeof x === 'string') (x.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).forEach((t) => known.add(t));
  else if (x && typeof x === 'object') Object.values(x).forEach(walk);
};
walk(m);
const structural = {
  dates: ['14', '13', '2020', '2021', '2022', '2023', '2.0'], time: ['16:00', '18:59', '00', '60', '90', '180', '270', '360', '1000', '2000', '3000'],
  'dashboard measured': ['6', '21', '6.2'], 'statistical conventions': ['95', '100', '1.0', '0', '1'],
  'ranks and counts': ['01', '02', '03', '04'], 'axis ticks': ['10', '20', '25', '30', '40', '50', '70', '75', '80', '0.5', '0.7', '1.5', '2.5'],
  'validation summary': ['68', '35', '32', '41', '25', '16'], 'source points': ['60', '264'],
};
Object.values(structural).flat().forEach((t) => known.add(t));
// Node by node, so neighbouring table cells never merge into one number.
const nodes = await p.evaluate(() => {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('script, style')) out.push(walker.currentNode.textContent);
  return out;
});
const seen = nodes.join(' ').replace(/[⁦⁩]/g, '').match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
const hours = new Set(Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).concat(Array.from({ length: 24 }, (_, i) => String(i))));
const unknown = [...new Set(seen)].filter((t) => !known.has(t) && !hours.has(t));
check(`sweep: ${new Set(seen).size} distinct numbers on the page trace to a source`, unknown.length === 0, unknown.join(' '));

// --- 3. Old identity and withdrawn content ---
const html = await p.content();
check('no ATHAR or أثر as a brand', !/ATHAR|athar/.test(html) && !/أثر ATHAR/.test(html));
check('withdrawn recommendation absent', !/اختبار مبالغ مقترحة حسب|Apple Pay/.test(text));
check('title', (await p.title()) === 'رفدان | RIFDAN — من البيانات إلى استدامة العطاء');
check('lang and dir', await p.evaluate(() => document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl'));

// --- 4. Links ---
const links = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href));
const internal = [...new Set(links)].filter((h) => h.startsWith(new URL(url).origin) && !h.includes('#'));
for (const h of internal) {
  const r = await ctx.request.get(h);
  check(`link ${new URL(h).pathname}`, r.ok());
}
const served = await (await ctx.request.get(new URL('dashboard/RIFDAN_Dashboard.html', url).href)).body();
const sha = (b) => createHash('sha256').update(b).digest('hex');
check('dashboard byte-identical to public copy', sha(served) === sha(readFileSync(resolve(root, 'public/dashboard/RIFDAN_Dashboard.html'))));
const anchors = await p.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].every((a) => document.getElementById(a.getAttribute('href').slice(1))));
check('all in-page anchors resolve', anchors);
const summary = JSON.parse(readFileSync(resolve(root, 'source/validation-summary.json'), 'utf8'));
const validationText = (await p.locator('.validation').textContent()).replace(/[⁦⁩]/g, '');
const expectedValidation = [summary.project, summary.dashboard, summary.publicRelease].flatMap((x) => [`${x.passed}/${x.total}`, x.script]).concat(`${summary.notebook.cells} خلية`, `${summary.notebook.codeCells} خلية كود`, `${summary.notebook.markdownCells} خلية نصية`);
check('validation figures equal validation-summary.json, each with its suite', expectedValidation.every((t) => validationText.includes(t)));
check('outdated validation figures gone', !/61 من 61|32 من 32|61\/61/.test(text));
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const arDate = (iso) => { const [y, mo, da] = iso.split('-').map(Number); return `${da} ${monthNames[mo - 1]} ${y}`; };
check('sample period equals metrics.json dates', text.includes(arDate(m.overview.date_min)) && text.includes(arDate(m.overview.date_max)));
check('license link present in the notice', links.includes('https://open.data.gov.sa/ar/pages/policies/license'));
check('no hourly amounts displayed', !(await p.locator('.chart-figure', { has: p.locator('[data-chart="hours"]') }).textContent()).includes('ر.س'));
check('repository card links to the public repository', await p.evaluate(() => document.querySelector('.resource-repo a')?.href === 'https://github.com/ziyadell/RIFDAN-Data-Analytics'));
check('file-size note removed', !text.includes('ميجابايت'));
const starLink = await p.locator('.star-cta').evaluate((a) => ({ href: a.href, target: a.target, rel: a.rel, text: a.textContent }));
check('star link opens the repository and asks only for a star', starLink.href === 'https://github.com/ziyadell/RIFDAN-Data-Analytics' && starLink.target === '_blank' && starLink.rel.includes('noopener') && starLink.text.includes('ادعم المشروع بنجمة'));
const rangeShown = await p.evaluate(() => {
  const el = [...document.querySelectorAll('.model-figure bdi')].find((e) => e.textContent.includes('2,451'));
  const r = document.createRange();
  const t = el.firstChild;
  const at = (s) => { const i = t.textContent.indexOf(s); r.setStart(t, i); r.setEnd(t, i + s.length); return r.getBoundingClientRect().left; };
  return at('129') < at('2,451');
});
check('amount range reads low to high', rangeShown);
const star = await p.locator('.star-cta').evaluate((el) => { const i = el.querySelector('svg'); return { svg: !!i, color: getComputedStyle(i).color, fill: getComputedStyle(i).fill, hidden: i.getAttribute('aria-hidden'), text: el.textContent.trim() }; });
check('star icon is a golden SVG, label has no emoji', star.svg && star.color === 'rgb(231, 182, 91)' && star.hidden === 'true' && star.text === 'إذا ألهمك رفدان، ادعم المشروع بنجمة على GitHub' && !/[\u2B50\u2605\u2606]/u.test(text), star.color);
const logoFills = await p.evaluate(() => ({
  hero: getComputedStyle(document.querySelector('.emblem-arcs')).fill,
  bars: [...document.querySelectorAll('.emblem-bar')].map((b) => getComputedStyle(b).fill),
  nav: getComputedStyle(document.querySelector('.topbar .logo-bars')).fill,
  footer: getComputedStyle(document.querySelector('.footer .logo-bars')).fill,
  navArc: getComputedStyle(document.querySelector('.topbar .logo path:not(.logo-bars)')).fill,
  footArc: getComputedStyle(document.querySelector('.footer .logo path:not(.logo-bars)')).fill,
}));
const light = 'rgb(246, 242, 234)';
const green = 'rgb(19, 182, 140)';
check('hero arcs light, green bars and other logos unchanged', logoFills.hero === light && logoFills.bars.length === 3 && logoFills.bars.every((x) => x === green) && logoFills.nav === green && logoFills.footer === green && logoFills.navArc === light && logoFills.footArc === light);
check('no private-repository message remains', !text.includes('خاص حالياً'));
check('presentation resource removed', !links.some((h) => /deck|Presentation/i.test(h)) && !text.includes('العرض التقديمي'));
const social = await p.evaluate(() => [...document.querySelectorAll('.footer-col a[target=_blank]')].map((a) => ({ href: a.href, rel: a.rel, icon: !!a.querySelector('svg') })));
const socialOk = (u) => social.some((a) => a.href === u && a.icon && a.rel.includes('noopener') && a.rel.includes('noreferrer'));
check('LinkedIn and X icons with original URLs and secure rel', socialOk('https://www.linkedin.com/in/ziyad-jammah-008a28263') && socialOk('https://x.com/ziyadles'));
const dataset = await p.evaluate(() => [...document.querySelectorAll('.resource-source a')].map((a) => a.href));
check('dataset link is the approved source', dataset[0] === 'https://open.data.gov.sa/ar/datasets/view/cc3b177a-5e5d-4845-bb92-6119b1322b05');
check('dashboard preview links to the dashboard', await p.evaluate(() => document.querySelector('.resource-dashboard a').href.endsWith('dashboard/RIFDAN_Dashboard.html') && !!document.querySelector('.resource-dashboard a img')));
check('report preview links to the report', await p.evaluate(() => document.querySelector('.resource-report a').href.endsWith('report/RIFDAN_Report.pdf')));

// --- 5. Navigation ---
await p.click('nav.nav-links a[href="#recommendations"]');
await p.waitForTimeout(1200);
check('nav jump highlights the section', await p.evaluate(() => document.querySelector('.nav-links a.active')?.getAttribute('href') === '#recommendations'));
check('section heading not hidden under the bar', await p.evaluate(() => {
  const top = document.getElementById('recs-title').getBoundingClientRect().top;
  return top >= document.querySelector('.topbar').getBoundingClientRect().bottom;
}));
await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await p.waitForTimeout(300);
check('no nav highlight on the hero', await p.evaluate(() => !document.querySelector('.nav-links a.active')));
await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
await p.waitForTimeout(250);
check('reading progress reaches the end', await p.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.progress')).transform).a > 0.99));

// --- Journey: the line draws with scroll and stages follow it ---
await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await p.waitForTimeout(200);
const j0 = await p.evaluate(() => ({ dash: parseFloat(getComputedStyle(document.querySelector('.j-progress')).strokeDashoffset), total: parseFloat(getComputedStyle(document.querySelector('.j-progress')).strokeDasharray), on: document.querySelectorAll('.j-stage.is-on').length }));
await p.evaluate(() => {
  // Puts the third node at mid-screen, past the line's reveal point and before the fourth.
  const n = document.querySelectorAll('.j-node')[2].getBoundingClientRect();
  window.scrollBy({ top: n.top - window.innerHeight * 0.5, behavior: 'instant' });
});
await p.waitForTimeout(250);
const j1 = await p.evaluate(() => ({ dash: parseFloat(getComputedStyle(document.querySelector('.j-progress')).strokeDashoffset), on: document.querySelectorAll('.j-stage.is-on').length }));
await p.evaluate(() => document.querySelector('#dashboard').scrollIntoView({ behavior: 'instant' }));
await p.waitForTimeout(250);
const j2 = await p.evaluate(() => ({ dash: parseFloat(getComputedStyle(document.querySelector('.j-progress')).strokeDashoffset), on: document.querySelectorAll('.j-stage.is-on').length }));
check('journey line starts undrawn', j0.on === 0 && Math.abs(j0.dash - j0.total) < 1, JSON.stringify(j0));
check('journey advances with scroll', j1.on === 3 && j1.dash > 0 && j1.dash < j0.total, JSON.stringify(j1));
check('journey completes after the section', j2.on === 5 && j2.dash < 1, JSON.stringify(j2));
check('journey navigation bar removed, all five stages kept', await p.evaluate(() => !document.querySelector('.j-rail, #journey nav') && document.querySelectorAll('.j-stage').length === 5 && [...document.querySelectorAll('.j-stage h3')].map((h) => h.textContent).join('|') === 'البيانات|التجهيز|التحليل|الرؤى|دعم القرار'));

// --- Preview cards stay still through hover, leave and focus ---
for (const card of ['.resource-dashboard', '.resource-report']) {
  const link = p.locator(`${card} a`);
  await link.scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
  const read = () => link.evaluate((a) => {
    const i = a.querySelector('img');
    const f = a.querySelector('.preview-frame');
    const [ir, fr, ar] = [i, f, a].map((e) => e.getBoundingClientRect());
    const h = document.documentElement.scrollHeight;
    return { rects: [ir, fr, ar].map((r) => [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 10) / 10)).join('|'), transform: getComputedStyle(i).transform, clipped: ir.bottom > fr.bottom + 0.5 || ir.right > fr.right + 0.5, ratio: Math.abs(i.naturalWidth / i.naturalHeight - fr.width / fr.height) < 0.01, h };
  });
  const normal = await read();
  const states = [];
  for (let i = 0; i < 3; i += 1) {
    await link.hover();
    await p.waitForTimeout(600);
    states.push(await read());
    await p.mouse.move(2, 2);
    await p.waitForTimeout(250);
    states.push(await read());
  }
  await link.focus();
  await p.waitForTimeout(250);
  states.push(await read());
  await p.evaluate(() => document.activeElement.blur());
  check(`${card}: image and card unchanged through hover, leave and focus`, states.every((x) => x.rects === normal.rects && x.transform === 'none' && x.h === normal.h), normal.rects);
  check(`${card}: image whole inside its frame, ratio preserved`, !normal.clipped && normal.ratio);
  const [popup] = await Promise.all([p.waitForEvent('popup'), link.click()]);
  await popup.waitForLoadState('commit');
  check(`${card}: click opens its destination`, /RIFDAN_(Dashboard\.html|Report\.pdf)/.test(popup.url()), popup.url().split('/').pop());
  await popup.close();
}

// --- 6. Hover tooltip, per chart ---
for (const [name, want] of [['bands', '%'], ['km', 'لم يعودوا بعد'], ['cohorts', 'معرّفاً في الفوج'], ['cox', 'نسبة الخطر'], ['monthly', 'عملية'], ['hours', 'عملية']]) {
  const c = p.locator(`[data-chart="${name}"]`);
  await c.scrollIntoViewIfNeeded();
  const box = await c.boundingBox();
  await p.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.45);
  await p.waitForTimeout(120);
  const tip = await c.locator('.chart-tip').textContent();
  const inside = await c.evaluate((el) => {
    const t = el.querySelector('.chart-tip').getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return t.left >= r.left - 1 && t.right <= r.right + 1;
  });
  check(`hover ${name}`, tip.includes(want) && inside, tip.replace(/[⁦⁩]/g, '').slice(0, 60));
  await p.mouse.move(0, 0);
}
// Tooltip value agrees with the mark it describes.
const peak = p.locator('[data-chart="monthly"]');
await peak.focus();
await p.keyboard.press('End');
const lastTip = (await peak.locator('.chart-tip').textContent()).replace(/[⁦⁩]/g, '');
check('keyboard End shows the last month', lastTip.includes(fmt(m.monthly.at(-1).transactions)), lastTip.slice(0, 50));
await p.keyboard.press('ArrowLeft');
const prevTip = (await peak.locator('.chart-tip').textContent()).replace(/[⁦⁩]/g, '');
check('keyboard arrow moves between values', prevTip !== lastTip && prevTip.includes(fmt(m.monthly.at(-2).transactions)));
await p.keyboard.press('Escape');

// --- 7. Toggles and modal ---
await p.locator('.segmented button', { hasText: 'بدون المعرّف الأكبر' }).click();
const compare = (await p.locator('.compare-rows').textContent());
check('with/without toggle shows the source value', compare.includes(`${fmt(d.mean_txn_without_top1, 1)} ر.س`) && compare.includes(`${fmt(d.mean_monetary_without_top1)} ر.س`));

await p.locator('.shots-head button', { hasText: 'داكن' }).click();
await p.waitForTimeout(300);
const shotSrc = await p.locator('.shot-km img').evaluate((i) => i.currentSrc || i.src);
check('theme switch loads the dark crop', /km-dark/.test(shotSrc), shotSrc.split('/').pop());
const trigger = p.locator('.shot-km .shot-trigger');
await trigger.focus();
await p.keyboard.press('Enter');
await p.waitForSelector('[role=dialog]');
await p.waitForTimeout(200);
check('modal receives focus', await p.evaluate(() => document.querySelector('[role=dialog]').contains(document.activeElement)));
const seenInDialog = new Set();
for (let i = 0; i < 5; i += 1) {
  await p.keyboard.press('Tab');
  seenInDialog.add(await p.evaluate(() => document.activeElement.className));
  if (!(await p.evaluate(() => document.querySelector('[role=dialog]').contains(document.activeElement)))) seenInDialog.add('ESCAPED');
}
check('Tab cycles inside the modal', seenInDialog.size >= 2 && !seenInDialog.has('ESCAPED'), [...seenInDialog].join(' | '));
await p.keyboard.press('Shift+Tab');
check('Shift+Tab stays inside the modal', await p.evaluate(() => document.querySelector('[role=dialog]').contains(document.activeElement)));
await p.keyboard.press('Escape');
await p.waitForTimeout(150);
check('Escape closes and returns focus to the source', (await p.locator('[role=dialog]').count()) === 0 && await trigger.evaluate((el) => el === document.activeElement));

// --- 8. Keyboard traversal ---
await p.goto(url, { waitUntil: 'networkidle' });
await p.evaluate(() => document.body.focus());
const visited = [];
const noOutline = [];
let stuck = false;
for (let i = 0; i < 120; i += 1) {
  await p.keyboard.press('Tab');
  const here = await p.evaluate(() => {
    const e = document.activeElement;
    if (e === document.body) return null;
    const repeat = window.lastFocused === e;
    window.lastFocused = e;
    const style = getComputedStyle(e);
    return { repeat, outlined: style.outlineStyle !== 'none', label: `${e.tagName}|${e.getAttribute('href') ?? e.dataset.chart ?? e.textContent.trim().slice(0, 24)}` };
  });
  if (!here) break;
  if (here.repeat) { stuck = true; break; }
  if (!here.outlined) noOutline.push(here.label);
  visited.push(here.label);
}
check(`Tab walks the page from start to end (${visited.length} stops)`, !stuck && visited[0].includes('main-content') && visited.at(-1).includes('#home'), visited.at(-1));
check('every focus stop shows a visible outline', noOutline.length === 0, noOutline.slice(0, 5).join(' ; '));

// --- 9. Rendered contrast of all visible text ---
const contrast = await p.evaluate(() => {
  const parse = (c) => {
    const m2 = c.match(/[\d.]+/g).map(Number);
    return { r: m2[0], g: m2[1], b: m2[2], a: m2[3] ?? 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c.a >= 0.99) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const bad = [];
  let count = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    if (!walker.currentNode.textContent.trim() || !el || el.closest('script, style, .chart-tip, .sr-only, .skip-link, details:not([open]) .table-scroll')) continue;
    const isSvg = el.closest('svg');
    const st = getComputedStyle(el);
    const fg = parse(isSvg ? st.fill : st.color);
    if (fg.a < 0.99) continue;
    const a = lum(fg);
    const b = lum(bgOf(isSvg ? el.closest('.chart') : el));
    const r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    count += 1;
    if (r < 4.5) bad.push(`${r.toFixed(2)} ${walker.currentNode.textContent.trim().slice(0, 24)}`);
  }
  return { count, bad: [...new Set(bad)] };
});
check(`contrast >= 4.5:1 on ${contrast.count} rendered text nodes`, contrast.bad.length === 0, contrast.bad.slice(0, 8).join(' ; '));

check('no console errors, warnings, or failed requests', problems.length === 0, problems.slice(0, 4).join(' | '));
await ctx.close();

// --- 10. Reduced motion: everything visible and fully drawn, without scrolling ---
const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const rp = await rm.newPage();
await rp.goto(url, { waitUntil: 'networkidle' });
await rp.waitForTimeout(300);
const reduced = await rp.evaluate(() => {
  const hidden = [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1');
  const notFull = [...document.querySelectorAll('.bar, .bar-row')].filter((e) => getComputedStyle(e).transform !== 'none');
  const line = getComputedStyle(document.querySelector('.km-line'));
  const words = [...document.querySelectorAll('.w')].filter((e) => getComputedStyle(e).opacity !== '1');
  const stages = document.querySelectorAll('.j-stage.is-on').length;
  const jDash = parseFloat(getComputedStyle(document.querySelector('.j-progress')).strokeDashoffset) || 0;
  return { hidden: hidden.length + words.length, notFull: notFull.length, bars: document.querySelectorAll('.bar, .bar-row').length, dash: line.strokeDashoffset, charts: document.querySelectorAll('.chart svg').length, stages, jDash };
});
check('reduced motion: all content visible, charts drawn', reduced.hidden === 0 && reduced.notFull === 0 && reduced.bars > 50 && reduced.charts === 6 && (reduced.dash === '0px' || reduced.dash === '0') && reduced.stages === 5 && reduced.jDash === 0, JSON.stringify(reduced));
const counter = await rp.locator('.counter').first().textContent();
check('reduced motion: counters show final values at once', counter.includes(fmt(m.overview.median)));
await rm.close();

// --- Dashboard: the served copy works in a real browser, with month filters and no day filter ---
const dash = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const dp = await dash.newPage();
const dashErrors = [];
dp.on('pageerror', (e) => dashErrors.push(e.message));
await dp.goto(new URL('dashboard/RIFDAN_Dashboard.html', url).href);
await dp.waitForFunction(() => document.querySelectorAll('.js-plotly-plot .main-svg').length > 0, null, { timeout: 60000 });
const tabCount = await dp.locator('nav[role=tablist] button').count();
let plots = 0;
for (let i = 0; i < tabCount; i += 1) {
  await dp.locator('nav[role=tablist] button').nth(i).click();
  await dp.waitForTimeout(600);
  plots += await dp.evaluate(() => [...document.querySelectorAll('.js-plotly-plot')].filter((e) => e.offsetParent).length);
}
check('dashboard: 6 pages and 21 charts as stated', tabCount === 6 && plots === 21, `${tabCount} / ${plots}`);
check('dashboard: no day-level filter', await dp.evaluate(() => !document.querySelector('input[type=date]') && document.getElementById('fFrom').tagName === 'SELECT'));
await dp.locator('nav[role=tablist] button').first().click();
const scope = () => dp.evaluate(() => document.body.innerText.match(/المرشحات الحالية[^\n]*/)[0]);
const scopeBefore = await scope();
await dp.selectOption('#fFrom', '2022-01');
await dp.waitForTimeout(500);
const scopeAfter = await scope();
check('dashboard: month filter changes the results', scopeBefore !== scopeAfter);
check('dashboard: no JavaScript errors', dashErrors.length === 0, dashErrors.join(' | '));
await dash.close();

// --- 11. Touch: a tap reveals a value on a phone ---
const phone = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
const tp = await phone.newPage();
await tp.goto(url, { waitUntil: 'networkidle' });
const chart = tp.locator('[data-chart="km"]');
await chart.scrollIntoViewIfNeeded();
await tp.waitForTimeout(500);
const bb = await chart.boundingBox();
await tp.touchscreen.tap(bb.x + bb.width * 0.4, bb.y + bb.height * 0.5);
await tp.waitForTimeout(150);
const tapTip = await chart.locator('.chart-tip').textContent();
check('touch tap shows a chart value', tapTip.includes('لم يعودوا بعد'), tapTip.replace(/[⁦⁩]/g, '').slice(0, 50));
await tp.locator('.menu-toggle').tap();
check('mobile menu opens with five items', await tp.locator('.nav-links.open a').count() === 5);
await tp.keyboard.press('Escape');
check('Escape closes the mobile menu', await tp.locator('.nav-links.open').count() === 0);
await phone.close();

await browser.close();
const failed = results.filter((x) => !x).length;
console.log(`\n${results.length} checks, ${failed} failed`);
process.exit(failed ? 1 : 0);
