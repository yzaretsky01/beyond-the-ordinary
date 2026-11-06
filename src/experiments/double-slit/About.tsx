import { AboutPage } from '../../ui/learning/AboutPage';
import { content } from './content';

/** This room's explanation page, at /double-slit/about. */
export default function About() {
  return (
    <AboutPage id="double-slit" number={content.number} roomTitle={content.title} about={content.about} />
  );
}
