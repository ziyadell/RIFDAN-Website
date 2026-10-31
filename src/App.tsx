import { useMagnetic, useRevealObserver } from './hooks';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { Decision } from './sections/Decision';
import { Stats } from './sections/Stats';
import { Value } from './sections/Value';
import { Returning } from './sections/Returning';
import { Model } from './sections/Model';
import { Journey } from './sections/Journey';
import { Dashboard } from './sections/Dashboard';
import { Recommendations } from './sections/Recommendations';
import { Limits } from './sections/Limits';
import { Footer, Outputs } from './sections/Outputs';

export default function App() {
  useRevealObserver();
  useMagnetic();
  return (
    <>
      <a className="skip-link" href="#main-content">انتقل إلى المحتوى</a>
      <Header />
      <main id="main-content">
        <Hero />
        <Decision />
        <Stats />
        <Value />
        <Returning />
        <Model />
        <Journey />
        <Dashboard />
        <Recommendations />
        <Limits />
        <Outputs />
      </main>
      <Footer />
    </>
  );
}
