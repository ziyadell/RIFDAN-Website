import { Fragment, type ReactNode } from 'react';
import { LOGO_ARCS, LOGO_BARS, LOGO_VIEWBOX } from './logo-paths';

/** Renders [[x]] as a highlighted figure. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[\[(.+?)\]\]/).map((part, i) => (
        <Fragment key={i}>{i % 2 ? <mark className="hl"><bdi>{part}</bdi></mark> : part}</Fragment>
      ))}
    </>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg className="logo" viewBox={LOGO_VIEWBOX} width={size} height={size * (880 / 960)} aria-hidden="true">
      <path className="logo-bars" d={LOGO_BARS} />
      <path fill="currentColor" d={LOGO_ARCS} />
    </svg>
  );
}

export function External({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

/** Splits on spaces only, so Arabic letters stay joined. Revealed by the nearest .reveal ancestor. */
export function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((word, i, all) => (
        <Fragment key={i}>
          <span className="w" style={{ '--w': i } as React.CSSProperties}>{word}</span>
          {i < all.length - 1 && ' '}
        </Fragment>
      ))}
    </>
  );
}

export function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SectionHead({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <header className="section-head reveal">
      <h2 id={id}><Words text={title} /></h2>
      {lead && <p className="lead">{lead}</p>}
    </header>
  );
}
