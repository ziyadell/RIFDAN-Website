import { useRef } from 'react';
import { num, stats as c } from '../content';
import { useCountUp, useInViewOnce } from '../hooks';
import { SectionHead } from '../ui';

function Counter({ value, decimals, suffix }: { value: number; decimals: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInViewOnce(ref, 0.6);
  const current = useCountUp(value, inView);
  const final = `${num(value, decimals)}${suffix}`;
  return (
    <span ref={ref} className="counter" data-final={final} role="text" aria-label={final}>
      <bdi aria-hidden="true">{inView ? num(current, decimals) : num(value, decimals)}{suffix === '%' ? suffix : <small>{suffix}</small>}</bdi>
    </span>
  );
}

export function Stats() {
  return (
    <section className="section stats scene-cream" id="stats" aria-labelledby="stats-title">
      <div className="container">
        <SectionHead id="stats-title" title={c.heading} lead={c.lead} />
        <div className="stat-pairs">
          {c.pairs.map((p) => (
            <article className="stat-pair reveal" key={p.title}>
              <h3>{p.title}</h3>
              <div className="stat-items">
                {p.items.map((it) => (
                  <div key={it.label}>
                    <Counter value={it.value} decimals={it.decimals} suffix={it.suffix} />
                    <p className="stat-label">{it.label}</p>
                  </div>
                ))}
              </div>
              <p className="body">{p.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
