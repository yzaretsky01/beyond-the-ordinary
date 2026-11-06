/** Every visible word in the hall. Drafted for the owner to review. Budgets: textBudget.test.ts. */
export const hall = {
  title: 'Beyond the Ordinary',
  intro: [
    'Beyond the Ordinary is a browser-based museum of quantum physics. It has five rooms, each a live experiment you steer by hand: a double slit, an interferometer, a Bell test, a wave meeting a wall, and a small quantum computer.',
    'Every picture is computed from the physics itself: photons are sampled from the interference pattern, the electron’s wave is solved from the Schrödinger equation, and the computer is an exact simulation of up to three qubits. The equations, the model’s limits and the sources are always one step away.',
  ],
  /** shown under a room once something has been found there */
  found: '{n} of {total} found',
  roomsLabel: 'Rooms',
  /** one approachable, accurate definition per room, shown under its name */
  definitions: {
    'double-slit':
      'Light sent through two narrow slits lands in stripes. Each photon arrives as one dot, but where it lands is set by a wave that passes through both slits and interferes with itself.',
    superposition:
      'A quantum system can be in a combination of possible states, each with an amplitude. Measuring it always gives one definite answer; the amplitudes set the odds.',
    entanglement:
      'Two particles can share a single quantum state. Their results are then correlated more strongly than any plan agreed in advance can explain, yet no signal passes between them.',
    tunneling:
      'A particle’s wave doesn’t stop dead at a barrier; it fades inside it. If the barrier is thin, some of the wave reaches the far side, so the particle can turn up there.',
    'quantum-computing':
      'A quantum computer keeps an amplitude for every possible answer. Gates make the wrong answers cancel and the right ones reinforce, so measuring is likely to give the right one.',
  } as Record<string, string>,
} as const;
