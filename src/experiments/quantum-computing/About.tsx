import { AboutPage } from '../../ui/learning/AboutPage';
import { content } from './content';

/** This room's explanation page, at /quantum-computing/about. */
export default function About() {
  return (
    <AboutPage
      id="quantum-computing"
      number={content.number}
      roomTitle={content.title}
      about={content.about}
    />
  );
}
