// One-off asset preparation, needed again only when the dashboard or report change:
//   node scripts/prepare-assets.mjs <dir with sharp, potrace, playwright-core, @fontsource installed> <RIFDAN-Data-Analytics release folder, read only>
// Traces the approved logo, copies fonts and deliverables, captures authentic dashboard crops.
import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolsDir = process.argv[2];
const submission = process.argv[3];
const require = createRequire(resolve(toolsDir, 'package.json'));
const sharp = require('sharp');
const potrace = require('potrace');
const { chromium } = require('playwright-core');

const pub = (...p) => resolve(root, 'public', ...p);
for (const d of ['brand', 'fonts', 'shots', 'dashboard', 'report']) mkdirSync(pub(d), { recursive: true });
mkdirSync(resolve(root, 'source'), { recursive: true });

// Deliverables: copied byte-for-byte, never edited.
copyFileSync(resolve(submission, 'outputs/dashboard/RIFDAN_Dashboard.html'), pub('dashboard/RIFDAN_Dashboard.html'));
copyFileSync(resolve(submission, 'report/executive_summary.pdf'), pub('report/RIFDAN_Report.pdf'));
copyFileSync(resolve(submission, 'outputs/metrics.json'), resolve(root, 'source/metrics.json'));

// Fonts: self-hosted subsets (both SIL OFL 1.1).
const fontsrc = (pkg, file) => resolve(toolsDir, 'node_modules/@fontsource', pkg, 'files', file);
for (const w of [400, 500, 600, 700]) {
  copyFileSync(fontsrc('ibm-plex-sans-arabic', `ibm-plex-sans-arabic-arabic-${w}-normal.woff2`), pub(`fonts/ibm-plex-sans-arabic-${w}.woff2`));
}
for (const w of [400, 500, 600, 700, 800]) {
  copyFileSync(fontsrc('plus-jakarta-sans', `plus-jakarta-sans-latin-${w}-normal.woff2`), pub(`fonts/plus-jakarta-sans-${w}.woff2`));
}
writeFileSync(pub('fonts/LICENSE.txt'), 'IBM Plex Sans Arabic (c) IBM Corp. Plus Jakarta Sans (c) The Plus Jakarta Sans Project Authors.\nBoth are licensed under the SIL Open Font License, Version 1.1: https://openfontlicense.org\n');

// Logo: extract the approved PNG from the dashboard and trace each colour into a transparent SVG.
const html = readFileSync(resolve(submission, 'outputs/dashboard/RIFDAN_Dashboard.html'), 'utf8');
const logoB64 = html.match(/<img class="logo"[^>]*src="data:image\/png;base64,([^"]+)"/)[1];
const logo = Buffer.from(logoB64, 'base64');
const { data, info } = await sharp(logo).flatten({ background: '#ffffff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const mask = async (test) => {
  const out = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < out.length; i++) {
    const [r, g, b] = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
    out[i] = test(r, g, b) ? 0 : 255;
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer();
};
const trace = (buf) => new Promise((ok, no) => potrace.trace(buf, { threshold: 128, turdSize: 80, optTolerance: 0.4 }, (e, svg) => (e ? no(e) : ok(svg.match(/ d="([^"]+)"/)[1]))));
const barsPath = await trace(await mask((r, g, b) => g > 130 && g - r > 60));
const arcsPath = await trace(await mask((r, g, b) => r < 90 && g < 90 && b < 110));
const short = (d) => d.replace(/(\d+\.\d)\d+/g, '$1');
const viewBox = '150 220 960 880';
writeFileSync(pub('brand/rifdan-logo.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path fill="var(--logo-accent, #13B68C)" d="${short(barsPath)}"/><path fill="currentColor" d="${short(arcsPath)}"/></svg>\n`);
writeFileSync(resolve(root, 'src/logo-paths.ts'), `// Traced from the approved logo embedded in RIFDAN_Dashboard.html.\nexport const LOGO_VIEWBOX = '${viewBox}';\nexport const LOGO_BARS = '${short(barsPath)}';\nexport const LOGO_ARCS = '${short(arcsPath)}';\n`);
writeFileSync(pub('brand/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 110 1140 1140"><rect x="60" y="110" width="1140" height="1140" rx="240" fill="#0B1220"/><path fill="#13B68C" d="${short(barsPath)}"/><path fill="#F6F2EA" d="${short(arcsPath)}"/></svg>\n`);

// Authentic dashboard crops: captured only after every Plotly chart reports it has drawn.
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(pathToFileURL(pub('dashboard/RIFDAN_Dashboard.html')).href);
await page.waitForFunction(() => document.querySelectorAll('.js-plotly-plot').length > 0, null, { timeout: 60000 });

const openTab = async (i) => {
  await (await page.$$('nav[role=tablist] button'))[i].click();
  await page.waitForFunction(() => {
    const vis = [...document.querySelectorAll('.js-plotly-plot')].filter((e) => e.offsetParent);
    return vis.length > 0 && vis.every((e) => e.querySelector('.main-svg') && e._fullLayout && e.getBoundingClientRect().height > 100);
  }, null, { timeout: 30000 });
  await page.waitForTimeout(1800);
};
const save = async (name, png) => {
  const img = sharp(png).resize({ width: 1400, withoutEnlargement: true });
  await img.clone().avif({ quality: 58 }).toFile(pub(`shots/${name}.avif`));
  await img.clone().webp({ quality: 80 }).toFile(pub(`shots/${name}.webp`));
  const meta = await sharp(await img.clone().png().toBuffer()).metadata();
  return { name, width: meta.width, height: meta.height };
};

const manifest = [];
for (const theme of ['Light', 'Dark']) {
  // The theme switch lives in a collapsed <details>; open it as a visitor would.
  await page.evaluate((id) => {
    const btn = document.getElementById(id);
    const panel = btn.closest('details');
    if (panel) panel.open = true;
    btn.click();
  }, `theme${theme}`);
  await page.waitForTimeout(2000);
  const t = theme.toLowerCase();

  await openTab(0);
  manifest.push(await save(`kpis-${t}`, await page.locator('.grid.kpis').first().screenshot()));

  await openTab(3);
  const heat = page.locator('.card', { has: page.locator('#c_heat') });
  manifest.push(await save(`heatmap-${t}`, await heat.screenshot()));

  await openTab(5);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const box = await page.evaluate(() => {
    const km = document.querySelector('#c_km').closest('.card').getBoundingClientRect();
    return { bottom: km.bottom + window.scrollY, aside: document.querySelector('aside').getBoundingClientRect().left };
  });
  await page.setViewportSize({ width: 1440, height: Math.ceil(box.bottom) + 40 });
  await page.waitForTimeout(800);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: box.aside, height: Math.ceil(box.bottom) + 14 } });
  manifest.push(await save(`km-${t}`, png));
  await page.setViewportSize({ width: 1440, height: 900 });
}
writeFileSync(resolve(root, 'src/data/shots.json'), `${JSON.stringify(manifest, null, 1)}\n`);
console.log(manifest, 'errors', errors);

// Social image: the real wordmark and logo, drawn in the page's own type.
const social = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const font = (f) => `url(${pathToFileURL(pub('fonts', f)).href})`;
const socialPage = join(tmpdir(), 'rifdan-social.html');
writeFileSync(socialPage, `<!doctype html><html dir="rtl"><style>
@font-face{font-family:P;src:${font('plus-jakarta-sans-800.woff2')};font-weight:800}
@font-face{font-family:A;src:${font('ibm-plex-sans-arabic-700.woff2')};font-weight:700}
@font-face{font-family:A;src:${font('ibm-plex-sans-arabic-500.woff2')};font-weight:500}
body{margin:0;width:1200px;height:630px;background:#0B1220;color:#F6F2EA;font-family:P,A;display:flex;flex-direction:column;justify-content:center;padding:0 88px;box-sizing:border-box}
svg{width:150px;margin-bottom:34px}h1{font-size:104px;font-weight:700;margin:0;line-height:1.1}p{font-size:40px;font-weight:500;color:#E7B65B;margin:16px 0 0}</style>
<svg viewBox="${viewBox}"><path fill="#13B68C" d="${short(barsPath)}"/><path fill="#F6F2EA" d="${short(arcsPath)}"/></svg><h1>رفدان | RIFDAN</h1><p>من البيانات إلى استدامة العطاء</p></html>`);
await social.goto(pathToFileURL(socialPage).href);
await social.waitForTimeout(600);
await social.screenshot({ path: pub('brand/rifdan-social.png') });
await browser.close();
