import type { ReactNode } from 'react';
import { ChartShell, Tip, columnPath, rowPath, type Frame } from './ChartShell';
import { data, monthLabel, num, pct } from '../content';

interface Column {
  key: string;
  value: number | null;
  axis: string;
  muted?: boolean;
  direct?: string;
  tip: { title: ReactNode; rows: { value: ReactNode; label: ReactNode }[] };
}

interface ColumnChartProps {
  name: string;
  label: string;
  columns: Column[];
  yMax: number;
  ticks: number[];
  format: (t: number) => string;
  axisEvery: (w: number) => number;
  height: (w: number) => number;
  ref_?: { value: number; label: string };
  /** Below this width the chart becomes labelled rows. */
  rowsBelow?: number;
}

const m = { top: 28, right: 8, bottom: 30, left: 46 };
const ROW_H = 30;

function ColumnChart({ name, label, columns, yMax, ticks, format, axisEvery, height, ref_, rowsBelow = 0 }: ColumnChartProps) {
  const isRows = (w: number) => w < rowsBelow;
  const slotOf = (w: number) => (w - m.left - m.right) / columns.length;

  const renderColumns = ({ w, h, active }: Frame) => {
    const ph = h - m.top - m.bottom;
    const slot = slotOf(w);
    const barW = Math.min(24, Math.max(3, slot - 2));
    const y = (v: number) => m.top + ph - (v / yMax) * ph;
    const every = axisEvery(w);
    return (
      <>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} />
            <text className="tick" x={m.left - 8} y={y(t) + 4} textAnchor="end">{format(t)}</text>
          </g>
        ))}
        {columns.map((c, i) => {
          const cx = m.left + slot * i + slot / 2;
          return (
            <g key={c.key} className={active !== null && active !== i ? 'dim' : undefined}>
              {c.value !== null && (
                <path
                  className={`bar c2${c.muted ? ' muted' : ''}`}
                  style={{ '--i': i * (24 / columns.length) } as React.CSSProperties}
                  data-key={c.key}
                  data-value={c.value}
                  d={columnPath(cx - barW / 2, y(c.value), barW, Math.max(1.5, y(0) - y(c.value)), Math.min(4, barW / 2))}
                />
              )}
              {c.direct && <text className="val" x={cx} y={y(c.value ?? 0) - 8} textAnchor="middle">{c.direct}</text>}
              {i % every === 0 && <text className="tick" x={cx} y={h - 10} textAnchor="middle">{c.axis}</text>}
            </g>
          );
        })}
        <line className="axis" x1={m.left} x2={w - m.right} y1={y(0)} y2={y(0)} />
        {ref_ && (
          <>
            <line className="ref strong" x1={m.left} x2={w - m.right} y1={y(ref_.value)} y2={y(ref_.value)} />
            <text className="val small halo" x={w - m.right} y={y(ref_.value) - 6} textAnchor="end" direction="ltr">{ref_.label}</text>
          </>
        )}
      </>
    );
  };

  const renderRows = ({ w, active }: Frame) => {
    const labelW = 68;
    const right = w - labelW;
    const scale = (v: number) => (v / yMax) * (right - 52);
    return (
      <>
        {ref_ && (
          <>
            <line className="ref strong" x1={right - scale(ref_.value)} x2={right - scale(ref_.value)} y1={0} y2={columns.length * ROW_H} />
            <text className="val small" x={right - scale(ref_.value)} y={columns.length * ROW_H + 18} textAnchor="middle" direction="rtl">{ref_.label}</text>
          </>
        )}
        {columns.map((c, i) => {
          const top = i * ROW_H;
          const len = Math.max(1.5, scale(c.value ?? 0));
          return (
            <g key={c.key} className={active !== null && active !== i ? 'dim' : undefined}>
              <text className="tick" x={w} y={top + 19} textAnchor="end">{c.axis}</text>
              <path className="bar-row c2" style={{ '--i': i } as React.CSSProperties} data-key={c.key} data-value={c.value ?? undefined}
                d={rowPath(right, top + 7, len, 16)} />
              <text className="val small halo" x={right - len - 6} y={top + 20} textAnchor="end">{format(c.value ?? 0)}</text>
            </g>
          );
        })}
      </>
    );
  };

  return (
    <ChartShell
      name={name}
      label={label}
      count={columns.length}
      rows={isRows}
      height={(w) => (isRows(w) ? columns.length * ROW_H + (ref_ ? 26 : 0) : height(w))}
      render={(frame) => (isRows(frame.w) ? renderRows(frame) : renderColumns(frame))}
      locate={(x, y, { w }) => {
        const i = isRows(w) ? Math.floor(y / ROW_H) : Math.floor((x - m.left) / slotOf(w));
        return i >= 0 && i < columns.length ? i : null;
      }}
      anchor={(i, { w, h }) => {
        if (isRows(w)) return { x: w / 2, y: i * ROW_H };
        const v = columns[i].value ?? 0;
        return { x: m.left + slotOf(w) * i + slotOf(w) / 2, y: m.top + (h - m.top - m.bottom) * (1 - v / yMax) };
      }}
      tip={(i) => <Tip title={columns[i].tip.title} rows={columns[i].tip.rows} />}
    />
  );
}

const f = data.facts;

export function CohortChart() {
  const cohorts = data.cohorts;
  return (
    <ColumnChart
      name="cohorts"
      label={`أفواج الدخول: ${num(f.cohortCount)} فوجاً شهرياً تتراوح عودتها خلال 30 يوماً بين ${pct(f.cohortMin)} و${pct(f.cohortMax)} بوسيط ${pct(f.cohortMedian)}.`}
      yMax={80}
      ticks={[0, 20, 40, 60, 80]}
      format={(t) => (Number.isInteger(t) ? `${t}%` : pct(t))}
      axisEvery={(w) => (w < 760 ? 2 : 1)}
      height={() => 340}
      rowsBelow={560}
      ref_={{ value: f.cohortMedian, label: `الوسيط ${pct(f.cohortMedian)}` }}
      columns={cohorts.map((c) => ({
        key: c.month,
        value: c.return_30d_pct,
        axis: c.month,
        direct: c.return_30d_pct === f.cohortMax || c.return_30d_pct === f.cohortMin ? pct(c.return_30d_pct) : undefined,
        tip: {
          title: monthLabel(c.month),
          rows: [
            { value: pct(c.return_30d_pct), label: 'عادوا خلال 30 يوماً' },
            { value: num(c.donors), label: 'معرّفاً في الفوج' },
          ],
        },
      }))}
    />
  );
}

export const cohortTable = {
  head: ['شهر الدخول', 'عدد المعرّفات', 'العودة خلال 30 يوماً'],
  rows: data.cohorts.map((c) => [monthLabel(c.month), num(c.donors), pct(c.return_30d_pct)]),
};

/** Month slots stay continuous, so the month with no records shows as a real gap. */
const monthSlots = () => {
  const months = new Map(data.monthly.map((x) => [x.month, x]));
  const slots: string[] = [];
  const [ey, em] = data.monthly[data.monthly.length - 1].month.split('-').map(Number);
  let [y, mo] = data.monthly[0].month.split('-').map(Number);
  while (y < ey || (y === ey && mo <= em)) {
    slots.push(`${y}-${String(mo).padStart(2, '0')}`);
    mo += 1;
    if (mo > 12) { mo = 1; y += 1; }
  }
  return slots.map((key) => ({ key, row: months.get(key) ?? null }));
};

export function MonthlyChart() {
  return (
    <ColumnChart
      name="monthly"
      label={`العمليات الشهرية: أعلى شهر أبريل 2023 بـ${num(f.peakMonthTxn)} عملية.`}
      yMax={5000}
      ticks={[0, 1000, 2000, 3000, 4000, 5000]}
      format={(t) => (t ? `${t / 1000}K` : '0')}
      axisEvery={() => 1}
      height={(w) => (w < 480 ? 240 : 280)}
      columns={monthSlots().map(({ key, row }) => ({
        key,
        value: row ? row.transactions : null,
        // Year labels only, on each January.
        axis: key.endsWith('-01') ? key.slice(0, 4) : '',
        muted: row?.partial,
        direct: row?.transactions === f.peakMonthTxn ? num(f.peakMonthTxn) : undefined,
        tip: {
          title: `${monthLabel(key)}${row?.partial ? ' (شهر جزئي)' : ''}`,
          rows: row ? [{ value: num(row.transactions), label: 'عملية' }, { value: num(row.amount), label: 'ر.س' }] : [{ value: '—', label: 'لا سجلات في هذا الشهر' }],
        },
      }))}
    />
  );
}

export const monthlyTable = {
  head: ['الشهر', 'عدد العمليات', 'المبالغ (ر.س)'],
  rows: data.monthly.map((x) => [monthLabel(x.month), num(x.transactions), num(x.amount)]),
};

export function HoursChart() {
  const top = Math.max(...data.hours.map((x) => x.transactions));
  return (
    <ColumnChart
      name="hours"
      label={`العمليات بحسب الساعة: أعلى ساعة تسجل ${num(top)} عملية.`}
      yMax={3000}
      ticks={[0, 1000, 2000, 3000]}
      format={(t) => (t ? `${t / 1000}K` : '0')}
      axisEvery={(w) => (w < 480 ? 4 : 2)}
      height={(w) => (w < 480 ? 240 : 280)}
      columns={data.hours.map((x) => ({
        key: String(x.hour),
        value: x.transactions,
        axis: String(x.hour),
        direct: x.transactions === top ? num(top) : undefined,
        tip: {
          title: `الساعة ${String(x.hour).padStart(2, '0')}:00`,
          rows: [{ value: num(x.transactions), label: 'عملية' }],
        },
      }))}
    />
  );
}

export const hoursTable = {
  head: ['الساعة', 'عدد العمليات'],
  rows: data.hours.map((x) => [`${String(x.hour).padStart(2, '0')}:00`, num(x.transactions)]),
};
