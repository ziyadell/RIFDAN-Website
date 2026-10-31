// Compares this site with the approved release and scans the build for excluded data. Reads the release only.
// Usage: node scripts/verify-release.mjs <path to RIFDAN-Data-Analytics>
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const release = process.argv[2];
if (!release) {
  console.error('Pass the path to the release repository.');
  process.exit(2);
}
let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`);
};
const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name);
  if (name === 'node_modules' || name === '.git') return [];
  return statSync(full).isDirectory() ? walk(full) : [full];
});

// Identical copies of the public release files.
for (const [from, to] of [
  ['outputs/metrics.json', 'source/metrics.json'],
  ['outputs/dashboard/RIFDAN_Dashboard.html', 'public/dashboard/RIFDAN_Dashboard.html'],
  ['outputs/dashboard/RIFDAN_Dashboard.html', 'dist/dashboard/RIFDAN_Dashboard.html'],
  ['report/executive_summary.pdf', 'public/report/RIFDAN_Report.pdf'],
  ['report/executive_summary.pdf', 'dist/report/RIFDAN_Report.pdf'],
]) {
  check(`${to} is byte-identical to the release ${from}`, sha(join(release, from)) === sha(join(root, to)));
}

// Validation figures match the repository's own result files.
const summary = JSON.parse(readFileSync(join(root, 'source/validation-summary.json'), 'utf8'));
const project = JSON.parse(readFileSync(join(release, 'validation/results/validation_report.json'), 'utf8'));
const dashboard = JSON.parse(readFileSync(join(release, 'validation/results/dashboard_validation.json'), 'utf8'));
const notebook = JSON.parse(readFileSync(join(release, 'analysis.ipynb'), 'utf8'));
const code = notebook.cells.filter((c) => c.cell_type === 'code').length;
check('project figures match validation_report.json', summary.project.passed === project.passed && summary.project.total === project.total, `${project.passed}/${project.total}`);
check('dashboard figures match dashboard_validation.json', summary.dashboard.passed === dashboard.passed && summary.dashboard.total === dashboard.total, `${dashboard.passed}/${dashboard.total}`);
check('notebook counts match analysis.ipynb', summary.notebook.cells === notebook.cells.length && summary.notebook.codeCells === code && summary.notebook.markdownCells === notebook.cells.length - code, `${notebook.cells.length} = ${code} + ${notebook.cells.length - code}`);

// Nothing donor-level or retired anywhere in the project or its build.
const files = walk(root);
const rel = (f) => relative(root, f).replaceAll('\\', '/');
const tabular = new Set(['.csv', '.tsv', '.xls', '.xlsx', '.parquet', '.feather', '.pkl', '.sqlite', '.db', '.ipynb', '.zip']);
const banned = files.filter((f) => tabular.has(extname(f).toLowerCase()));
check('no tabular, notebook or archive files in the project', banned.length === 0, banned.map(rel).join(' '));
check('no presentation file', !files.some((f) => /deck|presentation/i.test(rel(f))));

const distText = walk(join(root, 'dist')).filter((f) => ['.html', '.js', '.css', '.json', '.svg'].includes(extname(f)));
const minute = /202[0-3]-\d\d-\d\d[ T]\d\d:\d\d/;
const userId = /user_?id/i;
const scan = (re) => distText.filter((f) => re.test(readFileSync(f, 'utf8'))).map(rel);
check('build: no minute-level timestamps', scan(minute).length === 0, scan(minute).join(' '));
check('build: no donor identifier fields', scan(userId).length === 0, scan(userId).join(' '));
check('source: no minute-level timestamps in metrics.json', !minute.test(readFileSync(join(root, 'source/metrics.json'), 'utf8')));
// "day" in the survival curve counts days since a first gift, so it is not a calendar field.
const dayKey = /"(?:date|created_at|creationtime)"\s*:/i;
const siteData = readFileSync(join(root, 'src/data/site-data.json'), 'utf8');
check('site data: no calendar-day fields', !dayKey.test(siteData) && !/\d{4}-\d\d-\d\d/.test(siteData));
check('old identity absent from the build', scan(new RegExp(`${'ATH'}${'AR'}`)).length === 0);

console.log(`\n${failed ? `${failed} failed` : 'all passed'}`);
process.exit(failed ? 1 : 0);
