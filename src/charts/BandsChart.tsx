import { ChartShell, Tip, columnPath, rowPath, type Frame } from './ChartShell';
import { chartText, data, num, pct } from '../content';

const bands = data.bands;
const display = (band: string) => band.replace('-', '–');
const yMax = 50;
const ticks = [0, 10, 20, 30, 40, 50];
const labelled = new Set([1, 5]);
const ROWS_BELOW = 480;

const m = { top: 26, right: 8, bottom: 44, left: 40 };

function vertical({ w, h, active }: Frame) {
  const pw = w - m.left - m.right;
  const ph = h - m.top - m.bottom;
  const slot = pw / bands.length;
  const barW = Math.min(24, (slot - 12) / 2);
  const y = (v: number) => m.top + ph - (v / yMax) * ph;
  return (
    <>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} />
          <text className="tick" x={m.left - 8} y={y(t) + 4} textAnchor="end">{t}%</text>
        </g>
      ))}
      {bands.map((b, i) => {
        const cx = m.left + slot * i + slot / 2;
        const dim = active !== null && active !== i;
        return (
          <g key={b.band} className={dim ? 'dim' : undefined}>
            {active === i && <rect className="hover-band" x={cx - slot / 2} y={m.top - 22} width={slot} height={ph + 22} />}
            <path className="bar c1" style={{ '--i': i } as React.CSSProperties} data-key={`${b.band}|count_pct`} data-value={b.count_pct}
              d={columnPath(cx - barW - 1, y(b.count_pct), barW, Math.max(1.5, y(0) - y(b.count_pct)))} />
            <path className="bar c2" style={{ '--i': i + 0.5 } as React.CSSProperties} data-key={`${b.band}|amount_pct`} data-value={b.amount_pct}
              d={columnPath(cx + 1, y(b.amount_pct), barW, Math.max(1.5, y(0) - y(b.amount_pct)))} />
            {labelled.has(i) && (
              <>
                <text className="val" x={cx - 1} y={y(b.count_pct) - 7} textAnchor="end">{pct(b.count_pct)}</text>
                <text className="val" x={cx + 1} y={y(b.amount_pct) - 7} textAnchor="start">{pct(b.amount_pct)}</text>
              </>
            )}
            <text className="tick" x={cx} y={h - m.bottom + 20} textAnchor="middle">{display(b.band)}</text>
          </g>
        );
      })}
      <line className="axis" x1={m.left} x2={w - m.right} y1={y(0)} y2={y(0)} />
      <text className="axis-title" x={m.left + pw / 2} y={h - 6} textAnchor="middle" direction="rtl">{chartText.bandAxis}</text>
    </>
  );
}

function rows({ w, active }: Frame) {
  const rowH = 64;
  const right = w - 2;
  const scale = (v: number) => (v / yMax) * (w - 64);
  return bands.map((b, i) => {
    const top = i * rowH;
    return (
      <g key={b.band} className={active !== null && active !== i ? 'dim' : undefined}>
        <text className="tick row-label" x={right} y={top + 14} textAnchor="end" direction="ltr">{display(b.band)} ر.س</text>
        <path className="bar-row c1" style={{ '--i': i } as React.CSSProperties} data-key={`${b.band}|count_pct`} data-value={b.count_pct}
          d={rowPath(right, top + 22, Math.max(1.5, scale(b.count_pct)), 13)} />
        <path className="bar-row c2" style={{ '--i': i + 0.5 } as React.CSSProperties} data-key={`${b.band}|amount_pct`} data-value={b.amount_pct}
          d={rowPath(right, top + 37, Math.max(1.5, scale(b.amount_pct)), 13)} />
        <text className="val small" x={right - Math.max(1.5, scale(b.count_pct)) - 6} y={top + 33} textAnchor="end">{pct(b.count_pct)}</text>
        <text className="val small" x={right - Math.max(1.5, scale(b.amount_pct)) - 6} y={top + 48} textAnchor="end">{pct(b.amount_pct)}</text>
      </g>
    );
  });
}

export function BandsLegend() {
  return (
    <div className="legend">
      <span><i className="swatch c1" aria-hidden="true" />{chartText.transactions}</span>
      <span><i className="swatch c2" aria-hidden="true" />{chartText.amounts}</span>
    </div>
  );
}

export function BandsChart() {
  const label = `شرائح المبالغ: شريحة 2–10 ر.س تضم ${pct(bands[1].count_pct)} من العمليات و${pct(bands[1].amount_pct)} من المبالغ، وشريحة 5,000 ر.س فأكثر تضم ${pct(bands[5].count_pct)} من العمليات و${pct(bands[5].amount_pct)} من المبالغ.`;
  return (
    <ChartShell
      name="bands"
      label={label}
      count={bands.length}
      rows={(w) => w < ROWS_BELOW}
      height={(w) => (w < ROWS_BELOW ? bands.length * 64 : 420)}
      render={(frame) => (frame.w < ROWS_BELOW ? rows(frame) : vertical(frame))}
      locate={(x, y, { w }) => {
        if (w < ROWS_BELOW) return Math.max(0, Math.min(bands.length - 1, Math.floor(y / 64)));
        const slot = (w - m.left - m.right) / bands.length;
        const i = Math.floor((x - m.left) / slot);
        return i >= 0 && i < bands.length ? i : null;
      }}
      anchor={(i, { w }) => {
        if (w < ROWS_BELOW) return { x: w / 2, y: i * 64 + 8 };
        const slot = (w - m.left - m.right) / bands.length;
        return { x: m.left + slot * i + slot / 2, y: m.top + 8 };
      }}
      tip={(i) => (
        <Tip
          title={<span dir="ltr">{display(bands[i].band)} ر.س</span>}
          rows={[
            { key: 'c1', value: pct(bands[i].count_pct), label: `${chartText.transactions} (${num(bands[i].count)})` },
            { key: 'c2', value: pct(bands[i].amount_pct), label: `${chartText.amounts} (${num(bands[i].sum)} ر.س)` },
          ]}
        />
      )}
    />
  );
}

export const bandsTable = {
  head: ['الشريحة (ر.س)', 'عدد العمليات', 'من العمليات', 'مجموع المبالغ (ر.س)', 'من المبالغ'],
  rows: bands.map((b) => [display(b.band), num(b.count), pct(b.count_pct), num(b.sum), pct(b.amount_pct)]),
};
