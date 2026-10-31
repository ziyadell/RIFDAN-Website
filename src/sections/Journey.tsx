import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { journey as c } from '../content';
import { useWidth } from '../hooks';
import { SectionHead } from '../ui';

/**
 * The line through the five stages draws with the scroll position. No pinning and no scroll
 * capture: scrolling stays native. Under reduced motion the line is complete from the start.
 */
export function Journey() {
  const track = useRef<HTMLDivElement>(null);
  const progress = useRef<SVGPathElement>(null);
  const width = useWidth(track);
  const [d, setD] = useState('');
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [armed, setArmed] = useState(false);

  // Measure the nodes and thread a curve with vertical tangents through their centres.
  useLayoutEffect(() => {
    const root = track.current;
    if (!root || !width) return;
    const build = () => {
      const box = root.getBoundingClientRect();
      const points = [...root.querySelectorAll('.j-node')].map((n) => {
        const r = n.getBoundingClientRect();
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
      });
      let path = `M${points[0].x},${points[0].y}`;
      points.slice(1).forEach((p, i) => {
        const prev = points[i];
        const mid = (prev.y + p.y) / 2;
        path += `C${prev.x},${mid} ${p.x},${mid} ${p.x},${p.y}`;
      });
      setSize({ w: box.width, h: box.height });
      setD(path);
    };
    build();
    document.fonts?.ready.then(build);
  }, [width]);

  // Scroll drives the dash offset and which stages are on, written directly once per frame.
  useEffect(() => {
    const root = track.current;
    const line = progress.current;
    if (!root || !line || !d) return;
    const total = line.getTotalLength();
    line.style.strokeDasharray = `${total}`;
    const stages = [...root.querySelectorAll<HTMLElement>('.j-stage')];
    const finish = () => {
      line.style.strokeDashoffset = '0';
      stages.forEach((s) => s.classList.add('is-on', 'is-seen'));
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    setArmed(true);
    // y along the path rises with length, so a sampled table maps scroll position to length.
    const samples: { len: number; y: number }[] = [];
    for (let len = 0; len <= total; len += 6) samples.push({ len, y: line.getPointAtLength(len).y });
    samples.push({ len: total, y: line.getPointAtLength(total).y });
    const lengthAt = (y: number) => {
      if (y <= samples[0].y) return 0;
      const hit = samples.find((s) => s.y >= y);
      return hit ? hit.len : total;
    };
    const nodeYs = stages.map((s) => {
      const n = s.querySelector('.j-node')!.getBoundingClientRect();
      return n.top + n.height / 2 - root.getBoundingClientRect().top;
    });

    let raf = 0;
    const update = () => {
      raf = 0;
      const box = root.getBoundingClientRect();
      const y = window.innerHeight * 0.62 - box.top;
      const started = y >= nodeYs[0];
      line.style.strokeDashoffset = `${started ? total - lengthAt(y) : total}`;
      stages.forEach((s, i) => {
        const on = y >= nodeYs[i];
        s.classList.toggle('is-on', on);
        // The line follows the scroll both ways; text stays once read.
        if (on) s.classList.add('is-seen');
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [d]);

  return (
    <section className={`section journey scene-dark${armed ? ' j-armed' : ''}`} id="journey" aria-labelledby="journey-title">
      <div className="container">
        <SectionHead id="journey-title" title={c.heading} lead={c.lead} />
        <div className="j-track" ref={track}>
          {d && (
            <svg className="j-svg" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none" aria-hidden="true">
              <path className="j-path" d={d} />
              <path className="j-progress" ref={progress} d={d} />
            </svg>
          )}
          <ol>
          {c.stages.map((s) => (
            <li className="j-stage" key={s.id}>
              <span className="j-node" aria-hidden="true" />
              <div className="j-copy">
                <h3>{s.title}</h3>
                <p className="body">{s.text}</p>
              </div>
              <p className="j-figure">
                <strong><bdi>{s.figure}</bdi></strong>
                <span>{s.figureLabel}</span>
              </p>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
