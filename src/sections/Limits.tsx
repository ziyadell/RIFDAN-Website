import { limits as c } from '../content';
import { SectionHead } from '../ui';

export function Limits() {
  return (
    <section className="section limits scene-cream" id="limits" aria-labelledby="limits-title">
      <div className="container limits-grid">
        <SectionHead id="limits-title" title={c.heading} lead={c.lead} />
        <ul className="limit-list">
          {c.items.map((x, i) => (
            <li className={`reveal${i === 0 ? ' limit-lead' : ''}`} key={x.title}>
              <h3>{x.title}</h3>
              <p className="body">{x.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
