/** Every visitor-facing word in the quantum computing room. Budgets: src/content/textBudget.test.ts. */
export const content = {
  number: '05',
  title: 'Quantum Computing',

  wonder: {
    question: 'Can a computer find answers by making waves cancel?',
    ledes: [
      'A {{qubit}} can be 0, 1, or a {{superposition}} of both, described by two {{amplitude|amplitudes}}. {{gate|Gates}} change those amplitudes; measuring gives a plain 0 or 1.',
      'Each disc on the stage is one possible answer. Its size is the {{probability}}; its colour is the {{phase}}.',
    ],
    buildsOn: {
      text: 'Room 02’s superposition and room 03’s entanglement, now put to work.',
      room: { to: '/entanglement', label: 'Revisit room 03' },
    },
  },

  predict: {
    prompt: 'Two H gates on one qubit. What will you measure?',
    hint: 'One H gate turns a definite 0 into an even mix of 0 and 1. So what do two do?',
    choices: [
      { id: 'zero', label: 'Always 0' },
      { id: 'mix', label: '50/50' },
      { id: 'one', label: 'Always 1' },
    ],
    lock: 'Lock in my prediction',
    locked: 'Prediction locked. The circuit is loaded: measure it.',
  },

  experiment: {
    prompt: 'Build circuits. Step through them. Measure the result.',
    paletteHint: 'Pick a gate, then tap a slot on a wire. Tap a placed gate to remove it.',
    measureOne: 'Measure once',
    measureMany: 'Measure 100 times',
    clear: 'Clear circuit',
    reset: 'Reset everything',
    beforeYouTry: {
      id: 'x-first',
      question: 'Put X before the two H gates. You will measure…',
      choices: [
        { id: 'zero', label: 'Always 0' },
        { id: 'mix', label: '50/50' },
        { id: 'one', label: 'Always 1' },
      ],
      correct: 'one',
      right: 'Yes! X flips 0 to 1 first, and the two H gates still undo each other, so you always get 1.',
      wrong:
        'Good thinking. The two H gates still undo each other, so what comes out is whatever X put in: a 1.',
      tryLabel: 'Build X · H · H and measure',
    },
  },

  gates: {
    H: 'Hadamard: turns 0 into an even mix of 0 and 1, and back again.',
    X: 'NOT: swaps 0 and 1.',
    Z: 'Phase flip: gives the 1 part a minus sign. Invisible alone, decisive after interference.',
    S: 'Quarter-turn phase on the 1 part.',
    T: 'Eighth-turn phase on the 1 part.',
    CNOT: 'Controlled-NOT: flips the qubit below if this one is 1.',
    CZ: 'Controlled-Z: a minus sign when both qubits are 1.',
  },

  controls: {
    qubits: { legend: 'Qubits', tip: 'More qubits double the number of amplitudes the computer tracks.' },
    view: {
      label: 'Show the state after step',
      tip: 'Scrub through the circuit to watch the amplitudes change gate by gate.',
    },
    presets: {
      legend: 'Load a circuit',
      tip: 'Ready-made circuits worth exploring. Each one replaces the current circuit.',
    },
  },

  discoveries: [
    {
      id: 'superposition',
      title: 'Two at once',
      body: 'After an H gate the qubit has amplitudes for both 0 and 1.',
    },
    {
      id: 'interference',
      title: 'Paths cancel',
      body: 'Two H gates undo each other: the amplitudes for 1 cancel out.',
    },
    {
      id: 'phase',
      title: 'Hidden phase',
      body: 'A Z gate between two H gates turns a certain 0 into a certain 1.',
    },
    {
      id: 'entangled',
      title: 'Entangled qubits',
      body: 'Measuring one qubit now tells you the other: they only make sense together.',
    },
    {
      id: 'search',
      title: 'Search by interference',
      body: 'Grover’s circuit piles all the probability onto the marked answer.',
    },
  ],

  challenges: [
    { id: 'bell', text: 'Make the pair state (|00⟩ + |11⟩)/√2.' },
    { id: 'no-x', text: 'Get a certain 1 on one qubit without any X gate.' },
    { id: 'ghz', text: 'With three qubits, make (|000⟩ + |111⟩)/√2.' },
  ],

  explain: {
    summary:
      'A quantum computer keeps an amplitude for every possible answer. Gates steer those amplitudes, like waves, so wrong answers cancel and the right ones build up before you look.',
    compare: {
      result: (picked: string) =>
        `You predicted ${picked}. Two H gates always give 0: after the first, 0 and 1 have equal amplitudes; the second makes the two routes to 1 cancel and the two routes to 0 add.`,
    },
    waitWhy: [
      {
        q: 'Wait, what is a qubit?',
        body: 'An ordinary bit is 0 or 1. A {{qubit}} can also be in a superposition of both, with an amplitude for each. Reading it out always gives a plain 0 or 1.',
      },
      {
        q: 'Wait, is it like noise-cancelling headphones?',
        body: 'Headphones play a wave that cancels incoming noise. Quantum algorithms similarly arrange amplitudes so wrong answers cancel out.',
        limits:
          'Headphones cancel real sound waves in the air. Amplitudes are not waves in any material; they are numbers whose squares are probabilities.',
      },
      {
        q: 'Wait, why not read all the amplitudes?',
        body: 'You can’t. A {{measurement}} returns one answer and the superposition is gone. All the cleverness has to happen before you look.',
      },
    ],
    story: {
      title: 'Feynman’s challenge',
      body: 'In a 1981 talk, Richard Feynman pointed out that ordinary computers struggle to simulate quantum physics, because the list of amplitudes explodes. His suggestion: build computers out of quantum parts.',
    },
    mathTeaser: {
      reading:
        'Each answer b has an amplitude α_b. Measuring gives b with probability |α_b|², the {{bornRule|Born rule}}.',
    },
    hotspots: {
      circuit: {
        title: 'The circuit',
        body: 'Time runs left to right. Each wire is one qubit; each box is a gate acting on it.',
      },
      discs: {
        title: 'Amplitudes',
        body: 'One disc per possible answer. Its area is the probability; its colour and arrow show the phase.',
      },
      shots: {
        title: 'Measuring',
        body: 'Each measurement gives one answer at random. Repeat it to see the odds the amplitudes set.',
      },
      scrub: {
        title: 'Step through',
        body: 'Move this to see the amplitudes after each step, and watch them cancel or add.',
      },
    },
    realWorld: [
      {
        id: 'shor',
        title: 'Breaking codes',
        body: 'Shor’s algorithm could factor large numbers far faster than any known classical method, which would break much of today’s encryption.',
      },
      {
        id: 'chemistry',
        title: 'Designing molecules',
        body: 'Molecules are quantum systems. Quantum computers may simulate them directly, helping design medicines and materials.',
      },
      {
        id: 'sycamore',
        title: 'Today’s machines',
        body: 'In 2019 Google’s 53-qubit Sycamore chip ran a sampling task its team estimated would take a supercomputer thousands of years.',
      },
    ],
  },

  checks: [
    {
      id: 'hzh',
      question: 'Put a Z between two H gates. You will measure…',
      choices: [
        { id: 'zero', label: 'Always 0' },
        { id: 'mix', label: '50/50' },
        { id: 'one', label: 'Always 1' },
      ],
      correct: 'one',
      right: 'Right. Z flips the sign of the 1 part, so the second H makes the 0 parts cancel instead.',
      wrong:
        'Lots of people say that. The Z’s sign change decides which outcome cancels. Load it and measure.',
      tryLabel: 'Load H · Z · H and measure',
    },
    {
      id: 'grover',
      question: 'How does Grover’s search find the answer?',
      choices: [
        { id: 'all', label: 'Checks all at once' },
        { id: 'interfere', label: 'Interference' },
        { id: 'luck', label: 'Lucky guessing' },
      ],
      correct: 'interfere',
      right: 'Right. Wrong answers are made to cancel and the marked one to grow, step by step.',
      wrong:
        'It’s a popular idea! But reading out gives one random answer; the trick is making that answer right.',
      tryLabel: 'Load Grover’s search and measure',
    },
  ],

  deeper: {
    intro: 'The equations below use the circuit on the stage. Every number is live.',
    equations: {
      state: 'The state of n qubits is a list of 2ⁿ amplitudes, one per possible answer.',
      hadamard:
        'The H (Hadamard) gate written as a grid of numbers, a matrix. Applying it twice gives back the start: HH = I, the do-nothing gate.',
      born: 'Measuring gives answer b with probability |α_b|². The amplitudes themselves are never seen directly.',
      cost: 'Each extra qubit doubles the list. Simulating 50 qubits would need about a quadrillion amplitudes.',
    },
    misconceptions: [
      {
        myth: 'A quantum computer tries every answer at once.',
        fact: 'A measurement returns only one answer. Algorithms work by arranging interference so that answer is likely the right one.',
      },
      {
        myth: 'Quantum computers are faster at everything.',
        fact: 'They help only for problems with structure that interference can exploit, like factoring or simulating molecules.',
      },
      {
        myth: 'A qubit is secretly 0 or 1.',
        fact: 'Then H followed by H could not always give 0. Both amplitudes must be there to cancel.',
      },
    ],
    modelTitle: 'What this model simplifies',
    model: [
      {
        label: 'Model',
        points: [
          'An exact state-vector simulation of 1 to 3 qubits: 2, 4 or 8 complex amplitudes.',
          'Gates are ideal, reversible operations that never lose probability (unitary matrices: H, X, Z, S, T, CNOT, CZ); measurement samples |amplitude|².',
          'Qubit 0 is the rightmost digit in |q₂q₁q₀⟩; two-qubit gates target the next wire down.',
        ],
      },
      {
        label: 'Assumptions',
        points: [
          'No noise, no errors, and no {{decoherence}}: the qubits keep their phases forever.',
          'Measurements are perfect and read every qubit at the end.',
        ],
      },
      {
        label: 'Limitations',
        points: [
          'Real quantum computers are noisy and need error correction, which costs many physical qubits per useful one.',
          'This runs on your ordinary computer. That is easy for 3 qubits and hopeless for 300: the list of amplitudes doubles with each qubit.',
        ],
      },
    ],
    historyTitle: 'History and sources',
    history: [
      {
        year: '1982',
        text: 'Richard Feynman proposes computers built from quantum parts to simulate nature.',
        ref: 'R. P. Feynman, Int. J. Theor. Phys. 21, 467 (1982).',
      },
      {
        year: '1985',
        text: 'David Deutsch describes a universal quantum computer.',
        ref: 'D. Deutsch, Proc. R. Soc. Lond. A 400, 97 (1985).',
      },
      {
        year: '1994',
        text: 'Peter Shor finds a fast quantum algorithm for factoring.',
        ref: 'P. W. Shor, Proc. 35th Annual Symposium on Foundations of Computer Science, 124 (1994).',
      },
      {
        year: '1996',
        text: 'Lov Grover finds a quantum search algorithm.',
        ref: 'L. K. Grover, Proc. 28th Annual ACM Symposium on Theory of Computing, 212 (1996).',
      },
      {
        year: '2019',
        text: 'Google reports a 53-qubit processor outperforming classical supercomputers on one sampling task.',
        ref: 'F. Arute et al., Nature 574, 505 (2019).',
      },
    ],
    further: 'Further reading: M. A. Nielsen and I. L. Chuang, Quantum Computation and Quantum Information.',
  },
} as const;

export type DiscoveryId = (typeof content.discoveries)[number]['id'];
export type ChallengeId = (typeof content.challenges)[number]['id'];
