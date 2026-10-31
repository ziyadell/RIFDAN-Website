import { ArrowUpLeft, Star } from 'lucide-react';
import { asset, brand, footer, nav, outputs as c, urls } from '../content';
import { External, LinkedInIcon, Logo, SectionHead, XIcon } from '../ui';

function Preview({ name, width, height }: { name: string; width: number; height: number }) {
  return (
    <div className="preview-frame">
      <picture>
        <source srcSet={asset(`shots/${name}.avif`)} type="image/avif" />
        <source srcSet={asset(`shots/${name}.webp`)} type="image/webp" />
        <img src={asset(`shots/${name}.webp`)} alt="" width={width} height={height} loading="lazy" decoding="async" />
      </picture>
    </div>
  );
}

const Action = ({ label }: { label: string }) => (
  <span className="resource-action">{label} <ArrowUpLeft size={16} aria-hidden="true" /></span>
);

export function Outputs() {
  return (
    <section className="section outputs scene-dark" id="outputs" aria-labelledby="outputs-title">
      <div className="container">
        <SectionHead id="outputs-title" title={c.heading} />
        <ul className="resources">
          <li className="resource resource-dashboard reveal">
            <External href={urls.dashboard} className="resource-link">
              <Preview name="preview-dashboard" width={1400} height={875} />
              <h3>{c.dashboard.title}</h3>
              <p>{c.dashboard.text}</p>
              <Action label={c.dashboard.action} />
            </External>
          </li>
          <li className="resource resource-report reveal">
            <External href={urls.report} className="resource-link">
              <div className="resource-copy">
                <h3>{c.report.title}</h3>
                <p>{c.report.text}</p>
                <Action label={c.report.action} />
              </div>
              <Preview name="preview-report" width={800} height={1131} />
            </External>
          </li>
          <li className="resource resource-repo reveal">
            <External href={urls.repo} className="resource-link">
              <h3>{c.repo.title}</h3>
              <p>{c.repo.text}</p>
              <Action label={c.repo.action} />
            </External>
          </li>
          <li className="resource resource-source reveal">
            <External href={urls.source} className="resource-link">
              <h3>{c.source.title}</h3>
              <p>{c.source.text}</p>
              <Action label={c.source.action} />
            </External>
          </li>
        </ul>
        <div className="validation reveal">
          <h3>{c.validationHeading}</h3>
          <p className="note">{c.validationNote}</p>
          <dl className="validation-list">
            {c.validation.map((x) => (
              <div key={x.title}>
                <dd className="validation-value"><bdi>{x.value}</bdi></dd>
                <dt>{x.title}</dt>
                <dd className="validation-script"><bdi dir="ltr">{x.script}</bdi></dd>
                <dd className="validation-text">{x.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer scene-dark">
      <div className="container">
        <External href={urls.repo} className="button button-secondary star-cta">{footer.star} <Star size={18} fill="currentColor" strokeWidth={1.5} aria-hidden="true" /></External>
        <div className="footer-main">
          <div className="footer-about">
            <p>{footer.about}</p>
            <p className="footer-attribution">
              {footer.attributionBefore}<bdi>{footer.attributionDataset}</bdi>{footer.attributionPublished}
              <External href={urls.source}>{footer.attributionPlatform}</External>
              {footer.attributionMiddle}
              <External href={urls.license}>{footer.attributionLicense}<bdi>{footer.attributionLicenseName}</bdi>)</External>
              {footer.attributionAfter}
            </p>
          </div>
          <div className="footer-cols">
            <nav className="footer-col" aria-labelledby="footer-explore">
              <h2 id="footer-explore">{footer.explore}</h2>
              {nav.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
            </nav>
            <div className="footer-col">
              <h2>{footer.resources}</h2>
              <External href={urls.dashboard}>{footer.dashboard}</External>
              <External href={urls.report}>{footer.report}</External>
            </div>
            <div className="footer-col">
              <h2>{footer.contact}</h2>
              <External href={urls.source}>{footer.source}</External>
              <External href={urls.linkedIn}><LinkedInIcon /> {footer.linkedIn}</External>
              <External href={urls.x}><XIcon /> {footer.x}</External>
            </div>
          </div>
        </div>
        <a className="footer-mark" href="#home" aria-label={`${brand.name}: العودة إلى الأعلى`}>
          <Logo size={72} />
          <span>{brand.name}</span>
        </a>
      </div>
    </footer>
  );
}
