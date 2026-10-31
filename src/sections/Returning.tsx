import { returning as c } from '../content';
import { KmChart, kmTable } from '../charts/KmChart';
import { CohortChart, cohortTable } from '../charts/ColumnChart';
import { TableView } from '../charts/ChartShell';
import { Rich, SectionHead } from '../ui';

export function Returning() {
  return (
    <section className="section returning scene-cream" id="return" aria-labelledby="return-title">
      <div className="container">
        <SectionHead id="return-title" title={c.heading} lead={c.lead} />
        <dl className="fact-row reveal">
          {c.facts.map((x) => (
            <div key={x.label}><dd><bdi>{x.value}</bdi></dd><dt>{x.label}</dt></div>
          ))}
        </dl>
        <figure className="chart-figure reveal">
          <figcaption>{c.kmTitle}</figcaption>
          <KmChart />
          <p className="note">{c.kmNote}</p>
          <TableView {...kmTable} />
        </figure>
        <div className="return-split">
          <div className="cox-text reveal">
            <h3>{c.coxHeading}</h3>
            <p className="body">{c.coxBefore}</p>
            <p className="body"><Rich text={c.coxAfter} /></p>
            <p className="body">{c.cohortText}</p>
          </div>
          <figure className="chart-figure reveal">
            <figcaption>{c.cohortTitle}</figcaption>
            <CohortChart />
            <p className="note">{c.cohortNote}</p>
            <TableView {...cohortTable} />
          </figure>
        </div>
      </div>
    </section>
  );
}
