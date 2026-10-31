import { ChartShell, Tip, type Frame } from './ChartShell';
import { data, num, pct } from '../content';

const km = data.km;
const maxDay = km[km.length - 1].day;
const at30 = km.findIndex((p) => p.day === 30);
const m = { top: 14, right: 16, bottom: 34, left: 44 };

const scales = ({ w, h }: Frame) => ({
  x: (d: number) => m.left + (d / maxDay) * (w - m.left - m.right),
  y: (s: number) => m.top + (1 - s) * (h - m.top - m.bottom),
});

export function KmChart() {
  const f = data.facts;
  return (
    <ChartShell
      name="km"
      label={`منحنى كابلان-ماير: عاد ${pct(f.return30)} خلال 30 يوماً و${pct(f.return90)} خلال 90 يوماً، ووسيط زمن العودة ${num(f.medianDays)} يوماً، على فوج من ${num(f.cohort)} معرّفاً.`}
      count={km.length}
      height={(w) => (w < 560 ? 300 : 420)}
      render={(frame) => {
        const { w, h, active } = frame;
        const { x, y } = scales(frame);
        // Step-after line; S(t) is 1 just before the first observed day.
        let line = `M${x(km[0].day)},${y(1)}V${y(km[0].survival)}`;
        km.slice(1).forEach((p) => { line += `H${x(p.day)}V${y(p.survival)}`; });
        const area = `${line}V${y(0)}H${x(km[0].day)}Z`;
        const xTicks = w < 560 ? [0, 90, 180, 270, 360] : [0, 30, 60, 90, 180, 270, 360];
        const mark = km[at30];
        const labelLeft = x(mark.day) + 12;
        return (
          <>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line className="grid" x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} />
                <text className="tick" x={m.left - 8} y={y(t) + 4} textAnchor="end">{t * 100}%</text>
              </g>
            ))}
            {xTicks.map((t) => <text key={t} className="tick" x={x(t)} y={h - 10} textAnchor="middle">{t}</text>)}
            <line className="axis" x1={m.left} x2={w - m.right} y1={y(0)} y2={y(0)} />
            <path className="km-area" d={area} />
            <path className="km-line" d={line} pathLength={1} data-points={JSON.stringify(km.map((p) => [p.day, p.survival]))} />
            <line className="ref" x1={x(mark.day)} x2={x(mark.day)} y1={m.top} y2={y(0)} />
            <circle className="dot" cx={x(mark.day)} cy={y(mark.survival)} r={5} />
            <text className="val" x={labelLeft} y={m.top + 14} textAnchor="end" direction="rtl">{`30 يوماً: عاد ${pct(f.return30)}`}</text>
            {active !== null && (
              <>
                <line className="crosshair" x1={x(km[active].day)} x2={x(km[active].day)} y1={m.top} y2={y(0)} />
                <circle className="dot active" cx={x(km[active].day)} cy={y(km[active].survival)} r={6} />
              </>
            )}
          </>
        );
      }}
      locate={(px, _py, frame) => {
        const { x } = scales(frame);
        let best = 0;
        km.forEach((p, i) => { if (Math.abs(x(p.day) - px) < Math.abs(x(km[best].day) - px)) best = i; });
        return best;
      }}
      anchor={(i, frame) => {
        const { x, y } = scales(frame);
        return { x: x(km[i].day), y: y(km[i].survival) };
      }}
      tip={(i) => (
        <Tip
          title={`اليوم ${km[i].day}`}
          rows={[
            { value: pct((1 - km[i].survival) * 100), label: 'عادوا' },
            { value: pct(km[i].survival * 100), label: 'لم يعودوا بعد' },
          ]}
        />
      )}
    />
  );
}

export const kmTable = {
  head: ['اليوم', 'لم يعودوا بعد', 'عادوا'],
  rows: km.map((p) => [p.day, pct(p.survival * 100), pct((1 - p.survival) * 100)]),
};
