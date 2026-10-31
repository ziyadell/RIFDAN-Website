import { useEffect, useState } from 'react';
import { ArrowUpLeft, FileText } from 'lucide-react';
import { brand, cta, hero, urls } from '../content';
import { LOGO_ARCS, LOGO_BARS, LOGO_VIEWBOX } from '../logo-paths';
import { External, Words } from '../ui';

// The traced logo holds one subpath per bar, so each can rise on its own.
const bars = LOGO_BARS.split(/(?=M)/).filter(Boolean);

/** The approved emblem drawn large: arcs recede into the page, the three bars rise once on load. */
function HeroEmblem() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <svg className={`hero-emblem${shown ? ' is-in' : ''}`} viewBox={LOGO_VIEWBOX} aria-hidden="true">
      <path className="emblem-arcs" fill="currentColor" d={LOGO_ARCS} />
      {bars.map((d, i) => (
        <path key={i} className="emblem-bar" d={d} style={{ transitionDelay: `${0.25 + i * 0.12}s` }} />
      ))}
    </svg>
  );
}

export function Hero() {
  return (
    <section className="hero scene-dark" id="home" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy reveal">
          <h1 id="hero-title"><Words text={brand.name} /></h1>
          <p className="hero-slogan">{brand.slogan}</p>
          <p className="hero-desc">{hero.description}</p>
          <div className="hero-actions">
            <External href={urls.dashboard} className="button button-primary button-lg magnetic">
              {cta.dashboard} <ArrowUpLeft size={18} aria-hidden="true" />
            </External>
            <External href={urls.report} className="button button-secondary button-lg magnetic">
              {cta.report} <FileText size={18} aria-hidden="true" />
            </External>
          </div>
        </div>
        <HeroEmblem />
      </div>
      <div className="container hero-foot">
        <dl className="hero-facts">
          {hero.facts.map((x) => (
            <div key={x.label}><dd><bdi>{x.value}</bdi></dd><dt>{x.label}</dt></div>
          ))}
        </dl>
        <p className="hero-scope">{hero.scope}</p>
      </div>
    </section>
  );
}
