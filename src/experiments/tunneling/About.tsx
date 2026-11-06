import { AboutPage } from '../../ui/learning/AboutPage';
import { content } from './content';

/** This room's explanation page, at /tunneling/about. */
export default function About() {
  return <AboutPage id="tunneling" number={content.number} roomTitle={content.title} about={content.about} />;
}
