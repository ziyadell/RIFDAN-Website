import { type KeyboardEvent, type PointerEvent, type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { useInViewOnce, useWidth } from '../hooks';
import { chartText } from '../content';

export interface Frame {
  w: number;
  h: number;
  active: number | null;
}

interface ChartShellProps {
  /** Sentence stating the result; becomes the chart's accessible name. */
  label: string;
  name: string;
  count: number;
  height: (w: number) => number;
  render: (frame: Frame) => ReactNode;
  locate: (x: number, y: number, frame: Frame) => number | null;
  anchor: (i: number, frame: Frame) => { x: number; y: number };
  tip: (i: number) => ReactNode;
  /** Rows move with up and down arrows as well. */
  rows?: (w: number) => boolean;
}

/**
 * Shared chart behaviour: measured SVG (labels keep their real size at any width),
 * entrance on first view, one tooltip for mouse, touch and keyboard.
 */
export function ChartShell({ label, name, count, height, render, locate, anchor, tip, rows }: ChartShellProps) {
  const box = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const w = useWidth(box);
  const shown = useInViewOnce(box);
  const [active, setActive] = useState<number | null>(null);
  const h = w ? height(w) : 0;
  const frame: Frame = { w, h, active };

  const fromEvent = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActive(locate(e.clientX - rect.left, e.clientY - rect.top, frame));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const useRows = rows?.(w);
    const next = useRows ? e.key === 'ArrowDown' : e.key === 'ArrowRight';
    const prev = useRows ? e.key === 'ArrowUp' : e.key === 'ArrowLeft';
    if (next || prev) {
      e.preventDefault();
      setActive((a) => (a === null ? 0 : (a + (next ? 1 : count - 1)) % count));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(count - 1);
    } else if (e.key === 'Escape') {
      setActive(null);
    }
  };

  // Keeps the tooltip inside the chart at both edges.
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!el || active === null || !w) return;
    const { x, y } = anchor(active, frame);
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    const left = Math.min(Math.max(0, x - tw / 2), w - tw);
    const top = y - th - 12 < 0 ? Math.min(y + 14, h - th) : y - th - 12;
    el.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  });

  return (
    <div
      ref={box}
      className={`chart${shown ? ' is-in' : ''}`}
      data-chart={name}
      role="group"
      aria-label={`${label} ${chartText.keyHint}`}
      tabIndex={0}
      style={{ height: h || undefined }}
      onPointerMove={(e) => { if (e.pointerType === 'mouse') fromEvent(e); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setActive(null); }}
      onPointerDown={(e) => { if (e.pointerType !== 'mouse') fromEvent(e); }}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      {w > 0 && (
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={label} direction="ltr">
          {render(frame)}
        </svg>
      )}
      <div ref={tipRef} className="chart-tip" hidden={active === null} aria-live="polite">
        {active !== null && tip(active)}
      </div>
    </div>
  );
}

export function Tip({ title, rows }: { title: ReactNode; rows: { key?: 'c1' | 'c2'; value: ReactNode; label: ReactNode }[] }) {
  return (
    <>
      <div className="tip-title">{title}</div>
      {rows.map((r, i) => (
        <div className="tip-row" key={i}>
          {r.key && <span className={`tip-key ${r.key}`} aria-hidden="true" />}
          <strong dir="ltr">{r.value}</strong>
          <span>{r.label}</span>
        </div>
      ))}
    </>
  );
}

export function TableView({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="table-view">
      <summary>{chartText.tableSummary}</summary>
      <div className="table-scroll">
        <table>
          <thead><tr>{head.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} dir={j ? 'ltr' : undefined}>{c}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Bar with a 4px rounded data end and a square baseline. */
export const columnPath = (x: number, y: number, w: number, h: number, r = 4) => {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
};

/** Horizontal bar growing from the right edge (RTL rows). */
export const rowPath = (right: number, y: number, len: number, h: number, r = 4) => {
  const rr = Math.min(r, h / 2, len);
  const x = right - len;
  return `M${right},${y}H${x + rr}Q${x},${y} ${x},${y + rr}V${y + h - rr}Q${x},${y + h} ${x + rr},${y + h}H${right}Z`;
};
