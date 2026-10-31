import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpLeft, X, ZoomIn } from 'lucide-react';
import { asset, cta, dashboard as c, urls } from '../content';
import shotSizes from '../data/shots.json';
import { HoursChart, MonthlyChart, hoursTable, monthlyTable } from '../charts/ColumnChart';
import { TableView } from '../charts/ChartShell';
import { External, SectionHead } from '../ui';

type Theme = 'light' | 'dark';

function Shot({ name, alt, lazy = true }: { name: string; alt: string; lazy?: boolean }) {
  const size = shotSizes.find((s) => s.name === name)!;
  return (
    <picture>
      <source srcSet={asset(`shots/${name}.avif`)} type="image/avif" />
      <source srcSet={asset(`shots/${name}.webp`)} type="image/webp" />
      <img src={asset(`shots/${name}.webp`)} alt={alt} width={size.width} height={size.height} loading={lazy ? 'lazy' : undefined} decoding="async" />
    </picture>
  );
}

export function Dashboard() {
  const [theme, setTheme] = useState<Theme>('light');
  const [zoomed, setZoomed] = useState<(typeof c.shots)[number] | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setZoomed(null);
    requestAnimationFrame(() => trigger.current?.focus());
  }, []);

  useEffect(() => {
    if (!zoomed) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key !== 'Tab' || !dialog.current) return;
      // Tab cycles through the dialog's own focusable elements.
      const items = [...dialog.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]')];
      const first = items[0];
      const last = items[items.length - 1];
      const inside = dialog.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [zoomed, close]);

  return (
    <section className="section dashboard scene-cream" id="dashboard" aria-labelledby="dashboard-title">
      <div className="container">
        <SectionHead id="dashboard-title" title={c.heading} lead={c.lead} />

        <div className="live-pair">
          <figure className="chart-figure reveal">
            <figcaption>{c.monthlyTitle}</figcaption>
            <MonthlyChart />
            <p className="note">{c.monthlyNote}</p>
            <TableView {...monthlyTable} />
          </figure>
          <figure className="chart-figure reveal">
            <figcaption>{c.hoursTitle}</figcaption>
            <HoursChart />
            <p className="note">{c.hoursNote}</p>
            <TableView {...hoursTable} />
          </figure>
        </div>

        <div className="shots-head reveal">
          <h3>{c.shotsHeading}</h3>
          <div className="segmented" role="group" aria-label={c.themeGroup}>
            <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>{c.light}</button>
            <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>{c.dark}</button>
          </div>
        </div>
        <div className="shots reveal">
          {c.shots.map((s) => (
            <figure className={`shot shot-${s.id}`} key={s.id}>
              <button
                type="button"
                className="shot-trigger"
                aria-label={`${c.zoomHint}: ${s.title}`}
                aria-haspopup="dialog"
                onClick={(e) => {
                  trigger.current = e.currentTarget;
                  setZoomed(s);
                }}
              >
                <Shot name={`${s.id}-${theme}`} alt={s.alt} />
                <span className="zoom-hint" aria-hidden="true"><ZoomIn size={16} /> {c.zoomHint}</span>
              </button>
              <figcaption>{s.title}</figcaption>
            </figure>
          ))}
        </div>

        <div className="dash-cta reveal">
          <div>
            <p className="dash-cta-title">{c.ctaHeading}</p>
            <p className="dash-counts"><bdi>{c.counts}</bdi></p>
          </div>
          <div className="dash-cta-action">
            <External href={urls.dashboard} className="button button-invert button-xl magnetic">
              {cta.dashboard} <ArrowUpLeft size={20} aria-hidden="true" />
            </External>
          </div>
        </div>
      </div>

      {zoomed && createPortal(
        <div className="zoom-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div ref={dialog} className="zoom-dialog scene-dark" role="dialog" aria-modal="true" aria-labelledby="zoom-title" dir="rtl">
            <div className="zoom-bar">
              <h2 id="zoom-title">{zoomed.title}</h2>
              <External href={urls.dashboard} className="button button-secondary zoom-open">{cta.dashboard}</External>
              <button ref={closeBtn} className="zoom-close" type="button" aria-label={c.zoomClose} onClick={close}><X size={20} aria-hidden="true" /></button>
            </div>
            <div className="zoom-image" tabIndex={0} role="group" aria-label={zoomed.title}><Shot name={`${zoomed.id}-${theme}`} alt={zoomed.alt} lazy={false} /></div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
