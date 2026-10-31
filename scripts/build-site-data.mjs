// Generates src/data/site-data.json from source/metrics.json.
// Values are copied, never recomputed or rounded, so the UI can format them and
// scripts/verify-data.mjs can prove the chain metrics -> site-data -> rendered charts.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const m = JSON.parse(readFileSync(resolve(root, 'source/metrics.json'), 'utf8'));

/** Keeps the days the story names plus the largest drops, so the thinned step line stays faithful. */
export function thinCurve(curve, target, keepDays) {
  const keep = new Set([0, curve.length - 1]);
  curve.forEach((p, i) => { if (keepDays.includes(p.day)) keep.add(i); });
  const drops = curve
    .map((p, i) => ({ i, drop: i === 0 ? 0 : curve[i - 1].survival - p.survival }))
    .sort((a, b) => b.drop - a.drop);
  for (const { i } of drops) {
    if (keep.size >= target) break;
    keep.add(i);
  }
  return [...keep].sort((a, b) => a - b).map((i) => curve[i]);
}

const { source: _validationSource, ...validation } = JSON.parse(readFileSync(resolve(root, 'source/validation-summary.json'), 'utf8'));
const insightById = Object.fromEntries(m.insights.map((i) => [i.id, i]));
const groupAmount = m.survival.groups.find((g) => g.name.includes('مبلغ'));
const testAmount = Object.entries(m.survival.tests).find(([name]) => name.includes('مبلغ'))[1];
const firstAmount = m.cox.terms.find((t) => t.term === 'log_first_amount');
const sig = m.cox.terms.filter((t) => t.significant);

const data = {
  km: thinCurve(m.survival.curve, 60, [30, 60, 90]),
  kmSourcePoints: m.survival.curve.length,
  bands: m.amount_bands.map((b) => ({ band: b.band, count: b.count, sum: b.sum, count_pct: b.count_pct, amount_pct: b.amount_pct })),
  monthly: m.monthly.map((x) => ({ month: x.year_month, transactions: x.transactions, amount: x.amount, partial: x.partial })),
  gapMonths: m.gap_months,
  // Counts only: the release dashboard withholds hourly amounts for privacy.
  hours: m.by_hour.map((x) => ({ hour: x.hour, transactions: x.transactions })),
  cohorts: m.cohorts.months,
  cox: m.cox.terms.map((t) => ({ term: t.term, hr: t.hazard_ratio, lo: t.ci95[0], hi: t.ci95[1], p: t.p_value, significant: t.significant })),
  facts: {
    transactions: m.overview.transactions,
    totalAmount: m.overview.total_amount,
    initiatives: m.overview.unique_initiatives,
    donors: m.overview.observed_donors,
    mean: m.overview.mean,
    median: m.overview.median,
    shareLe10Txn: m.overview.share_txn_le10_pct,
    shareLe10Amount: m.overview.amount_share_le10_pct,
    top1Share: m.donors.top1_donor_amount_share_pct,
    top1Txn: m.donors.top1_donor_transactions,
    top1PctShare: m.donors.top1pct_donors_amount_share_pct,
    top10PctShare: m.donors.top10pct_donors_amount_share_pct,
    meanDonor: m.donors.mean_monetary,
    meanDonorWithoutTop1: m.donors.mean_monetary_without_top1,
    meanTxnWithoutTop1: m.donors.mean_txn_without_top1,
    rawRecords: m.quality_before.records,
    duplicates: m.duplicates.duplicate_rows,
    cohort: m.survival.cohort,
    returned: m.survival.returned,
    censored: m.survival.censored,
    medianDays: m.survival.median_days_to_second,
    return30: m.survival.return_rate_pct['30'],
    return60: m.survival.return_rate_pct['60'],
    return90: m.survival.return_rate_pct['90'],
    lowMedian30: groupAmount.levels[0].return_rate_pct['30'],
    highMedian30: groupAmount.levels[1].return_rate_pct['30'],
    logRankP: testAmount.p_value,
    coxFirstAmountHr: firstAmount.hazard_ratio,
    coxFirstAmountP: firstAmount.p_value,
    coxFirstAmountLo: firstAmount.ci95[0],
    coxFirstAmountHi: firstAmount.ci95[1],
    coxConcordance: m.cox.concordance,
    coxCampaignsHr: sig.find((t) => t.term.includes('الحملات')).hazard_ratio,
    coxFitrHr: sig.find((t) => t.term.includes('زكاة')).hazard_ratio,
    cohortCount: m.cohorts.months.length,
    cohortMin: m.cohorts.min_pct,
    cohortMax: m.cohorts.max_pct,
    cohortMedian: m.cohorts.median_pct,
    auc: m.prediction.test.auc,
    baselineAuc: m.prediction.baseline.test_auc,
    aucMargin: m.prediction.test_margin_over_baseline,
    aucLo: m.prediction.bootstrap.ci95[0],
    aucHi: m.prediction.bootstrap.ci95[1],
    peakTxnShare: m.peak_window.share_txn_pct,
    peakAmountShare: m.peak_window.share_amount_pct,
    peakRankEffect: m.peak_test.rank_biserial,
    peakMeanLo: m.peak_test.cluster_bootstrap_mean.ci95[0],
    peakMeanHi: m.peak_test.cluster_bootstrap_mean.ci95[1],
    sizingLow: m.value_sizing.lower_bound_sar,
    sizingHigh: m.value_sizing.upper_bound_sar,
    sizingLowShare: m.value_sizing.lower_bound_share_pct,
    sizingHighShare: m.value_sizing.upper_bound_share_pct,
    silhouette: m.segmentation.silhouette_chosen,
    silhouetteBest: m.segmentation.silhouette_by_k['2'],
    ariMin: m.segmentation.stability_ari_min,
    recurringTxnShare: m.initiatives.find((i) => i.initiative === 'التبرع الدوري').txn_share_pct,
    recurringAmountShare: m.initiatives.find((i) => i.initiative === 'التبرع الدوري').amount_share_pct,
    topInitiativeShare: m.initiatives[0].amount_share_pct,
    peakMonthTxn: Math.max(...m.monthly.map((x) => x.transactions)),
  },
  recommendations: ['concentration', 'high_value', 'dormant', 'return_driver'].map((id) => ({
    id,
    title: insightById[id].title,
    priority: insightById[id].priority,
    share: insightById[id].affected_amount_share_pct,
    observation: insightById[id].observation,
    action: insightById[id].action,
  })),
  plans: m.action_plans.map((p) => ({ id: p.id, title: p.title, kind: p.kind, kpi: p.kpi, duration: p.duration })),
  themesTotal: m.insights.length,
  validation,
};

const out = resolve(root, 'src/data/site-data.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(data)}\n`, 'utf8');
console.log(`site-data.json: ${(JSON.stringify(data).length / 1024).toFixed(1)} KB, km ${data.km.length}/${data.kmSourcePoints} points`);
