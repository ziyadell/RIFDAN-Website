# RIFDAN | رفدان — Project Showcase Website

**From data to sustainable giving.** A responsive, Arabic-first, right-to-left showcase for **RIFDAN**, a donation analytics project based on a historical sample of **40,930 donations** from Saudi Arabia's Ehsan platform. The website presents the proposed decision, supporting evidence, interactive visuals, and limitations in an accessible visual story.

[![RIFDAN website preview — Arabic landing page](assets/website-preview.png)](https://ziyad-jammah.sa)

**[Explore the live website](https://ziyad-jammah.sa)** · **[Open the interactive dashboard](https://ziyad-jammah.sa/dashboard/RIFDAN_Dashboard.html)** · **[Read the executive report](https://ziyad-jammah.sa/report/RIFDAN_Report.pdf)** · **[View the analytics repository](https://github.com/ziyadell/RIFDAN-Data-Analytics)**

> **About this repository:** It contains the **showcase website**, not the full analytics workflow. For the notebook, analysis methodology, and validation of research results, visit [RIFDAN-Data-Analytics](https://github.com/ziyadell/RIFDAN-Data-Analytics). Findings describe a historical sample, not all Ehsan donors or current sector activity.

<div dir="rtl">

### نبذة بالعربية

موقع تعريفي عربي لمشروع **رفدان**، يعرض نتائج تحليل عينة تاريخية من تبرعات منصة إحسان في تجربة تفاعلية تدعم اللغة العربية واتجاه العرض من اليمين إلى اليسار. يبدأ الموقع بالقرار المقترح، ثم الأدلة والرسوم التفاعلية، وصولًا إلى حدود التحليل وروابط لوحة البيانات والتقرير التنفيذي. النتائج وصفية ولا تمثل كامل المنصة أو القطاع، والتوصيات مقترحات للاختبار وليست نتائج سببية مثبتة.

</div>

## 📊 Project at a glance

| Area | Details |
|---|---|
| Purpose | Communicate analytics results and proposed decisions through a concise, accessible web experience |
| Audience | Reviewers, analysts, decision-makers, and portfolio visitors |
| Interface | Arabic, RTL, responsive, and keyboard-accessible |
| Frontend | React 19, TypeScript, Vite, plain CSS |
| Charts | Custom SVG visualisations without a charting library |
| Source of analytical results | [RIFDAN analytics repository](https://github.com/ziyadell/RIFDAN-Data-Analytics) |
| Live deployment | [ziyad-jammah.sa](https://ziyad-jammah.sa) |

## 🖥️ Experience and features

- **Decision-first storytelling:** A recommended action, the data supporting it, and the limits of that evidence.
- **Arabic and RTL layout:** Attention to mixed Arabic text, numerals, ranges, and technical terms.
- **Purpose-built SVG charts:** Amount bands, Kaplan–Meier survival, entry cohorts, Cox hazard ratios, and monthly and hourly activity.
- **Accessible interactions:** Consistent tooltips for mouse, touch, and keyboard, with a tabular view for each analytical chart.
- **Motion with control:** Scroll-drawn data journey without scroll hijacking, plus reduced-motion support.
- **Usability and privacy:** Visible keyboard focus, an accessible image dialog, self-hosted fonts, and no external requests from the page.

### Related resources

| Resource | Open |
|---|---|
| Showcase | [Live website](https://ziyad-jammah.sa) |
| Interactive dashboard | [Dashboard on the website](https://ziyad-jammah.sa/dashboard/RIFDAN_Dashboard.html) |
| Alternate dashboard URL | [Dashboard on GitHub Pages](https://ziyadell.github.io/RIFDAN-Data-Analytics/outputs/dashboard/RIFDAN_Dashboard.html) |
| Executive report | [Arabic PDF report](https://ziyad-jammah.sa/report/RIFDAN_Report.pdf) |
| Analysis and methodology | [RIFDAN-Data-Analytics](https://github.com/ziyadell/RIFDAN-Data-Analytics) |

## 🛠️ Stack and local development

Built with **React 19**, **TypeScript**, **Vite**, and **plain CSS**. Icons are provided by `lucide-react`. Browser verification uses `playwright-core` with an installed Edge or Chrome browser.

**Prerequisite:** Node.js **20 or newer**.

```bash
npm install
npm run dev
```

By default, the development site is served at `http://127.0.0.1:5173/rifdan-site/`.

### Build for production

The default build uses the base path `/rifdan-site/`:

```bash
npm run build
```

To reproduce the official deployment at the domain root, supply the site address and base path.

**Bash**

```bash
BASE_PATH=/ SITE_URL=https://ziyad-jammah.sa npm run build
```

**PowerShell**

```powershell
$env:BASE_PATH='/'; $env:SITE_URL='https://ziyad-jammah.sa'; npm run build
```

| Variable | Purpose |
|---|---|
| `BASE_PATH` | Deployment path; default `/rifdan-site/` |
| `SITE_URL` | Public origin used for canonical and social links; also generates `robots.txt` and `sitemap.xml` |
| `PREVIEW=1` | Creates a `noindex` preview build and omits `robots.txt` and `sitemap.xml` |

## ✅ Verification

| Command | What it verifies |
|---|---|
| `npm run verify:data` | `src/data/site-data.json` agrees with `source/metrics.json` |
| `npm run verify:contrast` | Text/background pairs meet a 4.5:1 contrast requirement |
| `npm run preview` then `npm run verify:rendered` | Values, copy, links, interaction, keyboard, touch, and reduced-motion behaviour in a browser |
| `node scripts/verify-release.mjs <analytics-repo-folder>` | Site assets and published validation figures match the analytics release, without excluded donor-level data |

`verify:rendered` targets the default base path. For a deployed URL, use:

```bash
node scripts/verify-rendered.mjs <url>
```

These checks are for the website and its consistency with source results; they do not independently establish the correctness of every analytical conclusion.

## Project structure

```text
src/content.ts           Page copy and formatted numbers
src/sections/            Individual page sections
src/charts/              Custom SVG visualisations
src/data/site-data.json  Generated from source/metrics.json during builds
source/                  Analytical outputs used by the site
public/                  Fonts, branding, dashboard, report, and previews
scripts/                 Data generation, asset preparation, and checks
vercel.json              noindex outside the official domain
```

**Do not add** `data_raw`, `data_clean`, or donor-level records to this repository.

## Deployment

The published site runs on **Vercel** in the `rifdan-showcase` project and is deployed from the build output using the Vercel CLI.

**Important:** This GitHub repository is **not connected to automatic Vercel deployment**. Pushing commits here **does not** update the live website.

The Vercel project redirects `www.ziyad-jammah.sa` and its production `vercel.app` URLs to the official domain.

## Scope and limitations

- Results describe a **historical sample** and should not be generalized to all Ehsan users or the nonprofit sector.
- Donor IDs are pseudonymous and may not represent distinct individuals. The site does not expose individual donor identifiers or records.
- Associations do not demonstrate causation. Recommendations are proposals for future experiments, not verified impacts.
- The source has no cost or marketing-channel fields, so the analysis does not claim return on investment or marketing attribution.
- Validation statistics shown on the website originate from the **analytics repository**; they are not counts of this website's own tests.

## Acknowledgments and licensing

**Data.** This project contains information derived from [“A sample of donations for different IDs in Ehsan”](https://open.data.gov.sa/ar/datasets/view/cc3b177a-5e5d-4845-bb92-6119b1322b05), published on the Saudi Open Data Platform under the [Open Data License](https://open.data.gov.sa/ar/pages/policies/license) (ODC Attribution License), version 2.0. Dataset-derived transformations and results do not imply endorsement by the data licensor.

**Fonts.** IBM Plex Sans Arabic and Plus Jakarta Sans are used under the SIL Open Font License 1.1; licence copies are available in [`licenses/`](licenses).

**Website code.** This repository currently has **no general software license**. The data and font licenses above apply to those respective materials only.
