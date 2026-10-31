import { value as c } from '../content';
import { BandsChart, BandsLegend, bandsTable } from '../charts/BandsChart';
import { TableView } from '../charts/ChartShell';
import { Rich, SectionHead } from '../ui';

export function Value() {
  return (
    <section className="section value scene-dark" id="value" aria-labelledby="value-title">
      <div className="container value-grid">
        <div className="value-copy">
          <SectionHead id="value-title" title={c.heading} lead={c.lead} />
          <div className="callouts">
            {c.callouts.map((k) => (
              <div className="callout reveal" key={k.band}>
                <h3><bdi>{k.band}</bdi></h3>
                <p><Rich text={k.text} /></p>
              </div>
            ))}
          </div>
          <p className="note reveal">{c.note}</p>
        </div>
        <figure className="chart-figure reveal">
          <BandsLegend />
          <BandsChart />
          <TableView {...bandsTable} />
        </figure>
      </div>
    </section>
  );
}
