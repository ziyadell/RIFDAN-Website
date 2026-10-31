// Proves site-data.json equals metrics.json: every copied value, exactly.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const m = JSON.parse(readFileSync(resolve(root, 'source/metrics.json'), 'utf8'));
const d = JSON.parse(readFileSync(resolve(root, 'src/data/site-data.json'), 'utf8'));

let checks = 0;
const diffs = [];
const same = (label, a, b) => {
  checks += 1;
  if (a !== b) diffs.push(`${label}: site=${a} metrics=${b}`);
};

// Curve: every kept point exists unchanged in the source, in order, with the named days present.
const source = new Map(m.survival.curve.map((p) => [p.day, p.survival]));
d.km.forEach((p) => same(`km day ${p.day}`, p.survival, source.get(p.day)));
[0, 30, 60, 90].forEach((day) => same(`km keeps day ${day}`, d.km.some((p) => p.day === day), true));
same('km last day', d.km.at(-1).day, m.survival.curve.at(-1).day);
same('km source length', d.kmSourcePoints, m.survival.curve.length);
same('km thinned length', d.km.length, 60);
// KM at 30 days equals the stated 30-day return rate.
same('S(30) = 1 - return30', Math.abs((1 - source.get(30)) * 100 - m.survival.return_rate_pct['30']) < 1e-9, true);

const list = (name, siteRows, metricRows, pairs) => {
  same(`${name} length`, siteRows.length, metricRows.length);
  siteRows.forEach((r, i) => pairs.forEach(([a, b]) => same(`${name}[${i}].${a}`, r[a], b(metricRows[i]))));
};
list('bands', d.bands, m.amount_bands, ['band', 'count', 'sum', 'count_pct', 'amount_pct'].map((k) => [k, (x) => x[k]]));
list('monthly', d.monthly, m.monthly, [['month', (x) => x.year_month], ['transactions', (x) => x.transactions], ['amount', (x) => x.amount], ['partial', (x) => x.partial]]);
list('hours', d.hours, m.by_hour, ['hour', 'transactions'].map((k) => [k, (x) => x[k]]));
same('hourly amounts withheld', d.hours.some((x) => 'amount' in x), false);
list('cohorts', d.cohorts, m.cohorts.months, ['month', 'donors', 'return_30d_pct'].map((k) => [k, (x) => x[k]]));
list('cox', d.cox, m.cox.terms, [['term', (x) => x.term], ['hr', (x) => x.hazard_ratio], ['lo', (x) => x.ci95[0]], ['hi', (x) => x.ci95[1]], ['p', (x) => x.p_value], ['significant', (x) => x.significant]]);

// Facts: each value must be present in metrics.json at some path.
const all = new Set();
const walk = (o) => {
  if (typeof o === 'number') all.add(o);
  else if (o && typeof o === 'object') Object.values(o).forEach(walk);
};
walk(m);
Object.entries(d.facts).forEach(([k, v]) => same(`facts.${k} exists in metrics`, all.has(v), true));

// Recommendations: wording and shares come straight from the insights.
const byId = Object.fromEntries(m.insights.map((i) => [i.id, i]));
d.recommendations.forEach((r) => {
  same(`rec ${r.id} title`, r.title, byId[r.id].title);
  same(`rec ${r.id} share`, r.share, byId[r.id].affected_amount_share_pct);
  same(`rec ${r.id} priority`, r.priority, byId[r.id].priority);
});
const shares = d.recommendations.map((r) => r.share);
same('recs sorted by share', JSON.stringify(shares), JSON.stringify([...shares].sort((a, b) => b - a)));
same('withdrawn Apple Pay card absent', /Apple Pay|أبل باي/.test(JSON.stringify(d.recommendations)), false);

console.log(`metrics -> site-data: ${checks} checks, ${diffs.length} differences`);
diffs.forEach((x) => console.log('  DIFF', x));
process.exit(diffs.length ? 1 : 0);
