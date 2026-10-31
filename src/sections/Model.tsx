import { model as c } from '../content';
import { CoxChart, CoxLegend, coxTable } from '../charts/CoxChart';
import { TableView } from '../charts/ChartShell';
import { SectionHead } from '../ui';

export function Model() {
  return (
    <section className="section model scene-dark" id="model" aria-labelledby="model-title">
      <div className="container">
        <SectionHead id="model-title" title={c.heading} lead={c.lead} />
        <figure className="chart-figure reveal">
          <figcaption>{c.coxTitle}</figcaption>
          <CoxLegend />
          <CoxChart />
          <p className="note">{c.coxNote}</p>
          <TableView {...coxTable} />
        </figure>
        <div className="model-grid">
          {c.cards.map((x) => (
            <article className="model-item reveal" key={x.title}>
              <h3>{x.title}</h3>
              <p className="model-figure"><bdi>{x.figure}</bdi></p>
              <p className="model-vs"><bdi>{x.vs}</bdi></p>
              <p className="body">{x.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
