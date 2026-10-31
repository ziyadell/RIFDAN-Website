import { recommendations as c } from '../content';
import { SectionHead } from '../ui';

export function Recommendations() {
  return (
    <section className="section recs scene-dark" id="recommendations" aria-labelledby="recs-title">
      <div className="container">
        <SectionHead id="recs-title" title={c.heading} lead={c.lead} />
        <div className="recs-table reveal">
          <table>
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">الترتيب</span></th>
                <th scope="col">{c.columns.title}</th>
                <th scope="col">{c.columns.priority}</th>
                <th scope="col">{c.columns.share}</th>
              </tr>
            </thead>
            <tbody>
              {c.items.map((r) => (
                <tr key={r.id} data-rec={r.id}>
                  <td className="rec-rank" dir="ltr">{r.rank}</td>
                  <td className="rec-main">
                    <strong>{r.title}</strong>
                    <span>{r.action}</span>
                  </td>
                  <td className="rec-priority" data-label={c.columns.priority}>{r.priority}</td>
                  <td className="rec-share" data-label={c.columns.share}><bdi>{r.shareText}</bdi></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="plans">
          <header className="plans-head reveal">
            <h3>{c.plansHeading}</h3>
            <p className="body">{c.plansLead}</p>
          </header>
          {c.plans.map((p) => (
            <article className="plan reveal" key={p.id}>
              <p className="plan-kind">{p.kind}</p>
              <h4>{p.title}</h4>
              <p className="plan-kpi"><strong>{c.kpiLabel}: </strong>{p.kpi}</p>
              <p className="plan-kpi"><strong>{c.durationLabel}: </strong>{p.duration}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
