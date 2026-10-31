import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpLeft, Menu, X } from 'lucide-react';
import { brand, cta, nav, urls } from '../content';
import { useActiveSection } from '../hooks';
import { External, Logo } from '../ui';

export function Header() {
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  // home and outputs have no nav item; observing them clears the highlight there.
  const ids = useMemo(() => ['home', ...nav.flatMap((n) => n.sections), 'outputs'], []);
  const active = useActiveSection(ids);

  // One indicator slides between items instead of each item drawing its own underline.
  useLayoutEffect(() => {
    const place = () => {
      const link = navRef.current?.querySelector<HTMLElement>('a.active');
      if (!indicator.current) return;
      indicator.current.style.opacity = link ? '1' : '0';
      if (link) indicator.current.style.transform = `translateX(${link.offsetLeft + 14}px) scaleX(${(link.offsetWidth - 28) / 100})`;
    };
    place();
    window.addEventListener('resize', place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener('resize', place);
  }, [active]);

  // Reading progress: transform only, written once per frame.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
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
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="topbar scene-dark">
      <div className="progress" ref={bar} aria-hidden="true" />
      <div className="container nav-wrap">
        <a className="brand" href="#home" aria-label={`${brand.name}: الرئيسية`} onClick={() => setOpen(false)}>
          <Logo />
          <strong>{brand.name}</strong>
        </a>
        <nav ref={navRef} id="site-nav" className={`nav-links${open ? ' open' : ''}`} aria-label="التنقل الرئيسي">
          <span ref={indicator} className="nav-indicator" aria-hidden="true" />
          {nav.map((item) => {
            const current = item.sections.includes(active);
            return (
              <a key={item.href} href={item.href} className={current ? 'active' : undefined} aria-current={current ? 'location' : undefined} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            );
          })}
        </nav>
        <External href={urls.dashboard} className="button button-primary nav-cta magnetic">
          {cta.dashboard} <ArrowUpLeft size={16} aria-hidden="true" />
        </External>
        <button ref={toggle} className="menu-toggle" type="button" aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
