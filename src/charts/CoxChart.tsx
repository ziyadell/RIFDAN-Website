import { ChartShell, Tip, type Frame } from './ChartShell';
import { coxLabel, data, num } from '../content';

// First-gift size leads because it is the finding; the rest keep source order.
const terms = [...data.cox].sort((a, b) => Number(b.term === 'log_first_amount') - Number(a.term === 'log_first_amount'));
const xMin = 0.4;
const xMax = 2.5;
const xTicks = [0.5, 0.7, 1, 1.5, 2.5];
const STACK_BELOW = 620;
const rowH = (w: number) => (w < STACK_BELOW ? 54 : 36);
const AXIS = 44;

const layout = (w: number) => {
  const stacked = w < STACK_BELOW;
  const plotRight = stacked ? w - 12 : w - 236;
  const plotLeft = stacked ? 12 : 64;
  const x = (hr: number) => plotLeft + (Math.log(hr / xMin) / Math.log(xMax / xMin)) * (plotRight - plotLeft);
  return { stacked, plotLeft, plotRight, x };
};

export function CoxChart() {
  const f = data.facts;
  return (
    <ChartShell
      name="cox"
      label={`نسب الخطر: بعد ضبط المبادرة يبلغ أثر مبلغ أول تبرع ${num(f.coxFirstAmountHr, 3)} بقيمة p = ${num(f.coxFirstAmountP, 2)}، ولا تدل عليه النتيجة. المبادرتان الدالتان الحملات المخصصة ${num(f.coxCampaignsHr, 2)} وزكاة الفطر ${num(f.coxFitrHr, 2)}.`}
      count={terms.length}
      rows={() => true}
      height={(w) => terms.length * rowH(w) + AXIS}
      render={({ w, h, active }: Frame) => {
        const { stacked, plotRight, x } = layout(w);
        const rh = rowH(w);
        const bottom = h - AXIS;
        return (
          <>
            {xTicks.map((t) => (
              <g key={t}>
                {t !== 1 && <line className="grid" x1={x(t)} x2={x(t)} y1={0} y2={bottom} />}
                <text className="tick" x={x(t)} y={bottom + 20} textAnchor="middle">{t === 1 ? '1.0' : t}</text>
              </g>
            ))}
            <line className="ref strong" x1={x(1)} x2={x(1)} y1={0} y2={bottom} />
            {terms.map((t, i) => {
              const cy = stacked ? i * rh + 38 : i * rh + rh / 2;
              const key = t.term === 'log_first_amount';
              const kind = t.significant ? 'sig' : key ? 'key' : 'plain';
              return (
                <g key={t.term} className={`cox-row ${kind}${active !== null && active !== i ? ' dim' : ''}`} style={{ '--i': i } as React.CSSProperties}
                  data-key={t.term} data-hr={t.hr} data-lo={t.lo} data-hi={t.hi}>
                  {active === i && <rect className="hover-band" x={0} y={i * rh} width={w} height={rh} />}
                  <text className="cox-label" x={w} y={stacked ? i * rh + 18 : cy + 5} textAnchor="start" direction="rtl">{coxLabel(t.term)}</text>
                  {stacked && <text className="val small" x={0} y={i * rh + 18} textAnchor="start">{num(t.hr, 2)}</text>}
                  {!stacked && <text className="val small" x={plotRight + 18} y={cy + 4} textAnchor="start">{num(t.hr, 2)}</text>}
                  <line className="whisker" x1={x(t.lo)} x2={x(t.hi)} y1={cy} y2={cy} />
                  <line className="whisker" x1={x(t.lo)} x2={x(t.lo)} y1={cy - 5} y2={cy + 5} />
                  <line className="whisker" x1={x(t.hi)} x2={x(t.hi)} y1={cy - 5} y2={cy + 5} />
                  <circle className="cox-dot" cx={x(t.hr)} cy={cy} r={key ? 6 : 5} />
                </g>
              );
            })}
          </>
        );
      }}
      locate={(_x, y, { w }) => {
        const i = Math.floor(y / rowH(w));
        return i >= 0 && i < terms.length ? i : null;
      }}
      anchor={(i, { w }) => {
        const { x } = layout(w);
        return { x: x(terms[i].hr), y: i * rowH(w) + 4 };
      }}
      tip={(i) => (
        <Tip
          title={coxLabel(terms[i].term)}
          rows={[
            { value: num(terms[i].hr, 3), label: 'نسبة الخطر' },
            { value: `${num(terms[i].lo, 2)} – ${num(terms[i].hi, 2)}`, label: 'فاصل ثقة 95%' },
            { value: num(terms[i].p, 3), label: terms[i].significant ? 'قيمة p (دالة)' : 'قيمة p (غير دالة)' },
          ]}
        />
      )}
    />
  );
}

export function CoxLegend() {
  return (
    <div className="legend">
      <span><i className="swatch dot sig" aria-hidden="true" />أثر دال إحصائياً</span>
      <span><i className="swatch dot key" aria-hidden="true" />مبلغ أول تبرع</span>
      <span><i className="swatch dot plain" aria-hidden="true" />غير دال</span>
    </div>
  );
}

export const coxTable = {
  head: ['الحد', 'نسبة الخطر', 'فاصل ثقة 95%', 'قيمة p'],
  rows: terms.map((t) => [coxLabel(t.term), num(t.hr, 3), `${num(t.lo, 3)} – ${num(t.hi, 3)}`, num(t.p, 4)]),
};
