import { AboutPage } from '../../ui/learning/AboutPage';
import { content } from './content';

/** This room's explanation page, at /entanglement/about. */
export default function About() {
  return (
    <AboutPage id="entanglement" number={content.number} roomTitle={content.title} about={content.about} />
  );
}
