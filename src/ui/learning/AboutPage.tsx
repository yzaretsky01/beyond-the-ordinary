import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shared } from '../../content/shared';
import { Vignette } from '../viz/Vignette';
import { Rich } from './Rich';
import '../room/room.css';
import './about.css';

export interface AboutContent {
  title: string;
  sections: readonly { q: string; paras: readonly string[] }[];
  sources: readonly string[];
}

/**
 * A room's long-form explanation: three plain questions, answered in a few short paragraphs,
 * opening with the room's own computed result. Read it before or after the experiment.
 */
export function AboutPage({
  id,
  number,
  roomTitle,
  about,
}: {
  id: string;
  number: string;
  roomTitle: string;
  about: AboutContent;
}) {
  useEffect(() => {
    document.title = `${about.title} · Beyond the Ordinary`;
    window.scrollTo(0, 0);
    return () => {
      document.title = 'Beyond the Ordinary';
    };
  }, [about.title]);
  return (
    <div className="about" data-room={number}>
      <header className="about__head">
        <Link to="/" className="room__back caps">
          <span aria-hidden="true">←</span> Hall
        </Link>
        <Link to={`/${id}`} className="about__room">
          <span className="room__num" aria-hidden="true">
            {Number(number)}
          </span>
          {roomTitle}
        </Link>
      </header>
      <main className="about__body">
        <Vignette id={id} />
        <h1 className="about__title">{about.title}</h1>
        {about.sections.map((s) => (
          <section key={s.q} className="about__section">
            <h2>{s.q}</h2>
            {s.paras.map((p) => (
              <p key={p}>
                <Rich text={p} />
              </p>
            ))}
          </section>
        ))}
        <p>
          <Link to={`/${id}`} className="btn btn--primary">
            {shared.aboutTry} <span aria-hidden="true">→</span>
          </Link>
        </p>
        <footer className="about__sources">
          <h2 className="caps">{shared.aboutSources}</h2>
          <ul>
            {about.sources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </footer>
      </main>
    </div>
  );
}
