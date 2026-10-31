import { useState } from 'react';
import { decision as c } from '../content';

export function Decision() {
  const [without, setWithout] = useState(false);
  return (
    <section className="section decision scene-dark" id="decision" aria-labelledby="decision-title">
      <div className="container decision-grid">
        <div className="decision-figure reveal">
          <h2 id="decision-title">{c.heading}</h2>
          <p className="giant"><mark className="hl"><bdi>{c.figure}</bdi></mark></p>
          <p className="giant-label">{c.figureLabel}</p>
        </div>
        <div className="decision-body reveal">
          <p className="statement">{c.statement}</p>
          <p className="body">{c.why}</p>
          <ol className="steps">
            {c.steps.map((s) => (
              <li key={s.verb}><strong>{s.verb}</strong><span>{s.text}</span></li>
            ))}
          </ol>
          <p className="body">{c.next}</p>
        </div>
        <div className="compare reveal" role="group" aria-labelledby="compare-title">
          <div className="compare-head">
            <h3 id="compare-title">{c.toggle.title}</h3>
            <p className="note">{c.toggle.note}</p>
          </div>
          <div className="segmented">
            <button type="button" aria-pressed={!without} onClick={() => setWithout(false)}>{c.toggle.with}</button>
            <button type="button" aria-pressed={without} onClick={() => setWithout(true)}>{c.toggle.without}</button>
          </div>
          <dl className="compare-rows" aria-live="polite">
            {c.toggle.rows.map((r) => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd><bdi key={String(without)} className="swap">{without ? r.without : r.with}</bdi></dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
