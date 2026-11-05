/** Every visitor-facing word in the entanglement room. Budgets: src/content/textBudget.test.ts. */
export const content = {
  number: '03',
  title: 'Entanglement',

  wonder: {
    question: 'Can two photons share one story, however far apart?',
    ledes: [
      'A source sends pairs of {{photon|photons}} in opposite directions. Alice and Bob each test theirs with a {{polariser}}: it passes (+) or it doesn’t (−).',
      'Each result on its own is random. The question is whether the two lists are secretly linked.',
    ],
    buildsOn: {
      text: 'Room 02’s {{superposition|superpositions}} and {{measurement|measurements}}, now shared between two particles.',
      room: { to: '/superposition', label: 'Revisit room 02' },
    },
  },

  predict: {
    prompt: 'Polarisers 30° apart: how often will results match?',
    hint: 'Each photon either passes its polariser (+) or not (−). A match means both + or both −.',
    label: 'Matching results',
    lock: 'Lock in my prediction',
    locked: 'Prediction locked. Now run the experiment.',
  },

  experiment: {
    prompt: 'Fire pairs. Turn the polarisers. Try to beat quantum.',
    fireOne: 'Fire one pair',
    stream: 'Fire continuously',
    clear: 'Clear results',
    reset: 'Reset everything',
    beforeYouTry: {
      id: 'ninety',
      question: 'Set the polarisers 90° apart. Results will match…',
      choices: [
        { id: 'always', label: 'Always' },
        { id: 'half', label: 'Half the time' },
        { id: 'never', label: 'Never' },
      ],
      correct: 'never',
      right: 'Yes! At 90° the pair always gives opposite answers, even though each answer is random.',
      wrong: 'Good guess. At 90° the pair gives opposite answers every time. Watch the tapes.',
      tryLabel: 'Set them 90° apart and fire',
    },
  },

  controls: {
    a: {
      label: 'Alice’s polariser',
      tip: 'The angle of Alice’s polariser. You can also drag her dial on the stage.',
    },
    b: {
      label: 'Bob’s polariser',
      tip: 'The angle of Bob’s polariser. You can also drag his dial on the stage.',
    },
    source: {
      legend: 'Photon source',
      quantum: 'Entangled pairs',
      hidden: 'Hidden instructions',
      tip: 'Hidden instructions: each pair secretly shares a polarisation, decided at the source. Can that copy quantum results?',
    },
    mode: {
      legend: 'Experiment',
      explore: 'Explore angles',
      bell: 'Bell test',
      tip: 'In a Bell test each side randomly picks one of two settings for every pair, 45° apart.',
    },
    rate: { label: 'Pairs per second', tip: 'How fast the source fires. It does not change the results.' },
  },

  discoveries: [
    {
      id: 'coin',
      title: 'Each side is a coin toss',
      body: 'On its own, each side’s results look completely random.',
    },
    { id: 'twins', title: 'Perfect twins', body: 'With equal angles, the two random results always match.' },
    { id: 'opposites', title: 'Perfect opposites', body: 'At 90° apart, the results never match.' },
    {
      id: 'no-signal',
      title: 'No messages',
      body: 'Bob turning his dial never changes Alice’s own results.',
    },
    {
      id: 'beat',
      title: 'Beyond hidden instructions',
      body: 'Entangled pairs score above 2, which no hidden-instruction scheme can do.',
    },
  ],

  challenges: [
    { id: 'three-in-four', text: 'Make entangled pairs match three times in four.' },
    { id: 'hidden-best', text: 'Find the angles where hidden instructions reach S = 2.' },
    { id: 'violate', text: 'Measure S above 2.5 with entangled pairs.' },
  ],

  explain: {
    summary:
      'Each photon’s result is a coin toss, yet the two lists are linked. How strongly depends on the angle between the polarisers, following a curve no hidden instructions can copy.',
    compare: {
      result: (guess: number, quantum: string, hidden: string) =>
        `You predicted ${guess}% matches at 30°. Quantum theory says ${quantum}; hidden instructions would give ${hidden}. Real experiments agree with quantum theory.`,
    },
    waitWhy: [
      {
        q: 'Wait, what does entangled mean?',
        body: '{{entangled|Entangled}} photons share one joint state, but neither has a state of its own. That’s why each result alone looks random while the pair’s results are linked.',
      },
      {
        q: 'Wait, isn’t it like a pair of gloves?',
        body: 'Post one glove of a pair to each city. Open one box and you instantly know the other. That is the “hidden instructions” source in this room.',
        limits:
          'Gloves are decided before they’re posted, and anything decided in advance scores at most 2. Entangled photons score about 2.8.',
      },
      {
        q: 'Wait, what is the Bell score?',
        body: 'The {{bellScore|Bell score}} S adds up how strongly results agree at four pairs of angles. Pre-agreed answers can never push it past 2. Quantum theory, and every careful experiment, gives about 2.8.',
      },
    ],
    story: {
      title: '“Spooky action at a distance”',
      body: 'Einstein disliked entanglement and gave it that famous nickname. In 1964 John Bell turned the argument into a test that experiments could actually run. Every careful experiment since has sided with quantum theory.',
    },
    mathTeaser: {
      reading:
        'The chance that Alice and Bob agree depends only on the angle between their polarisers, a − b.',
    },
    hotspots: {
      source: {
        title: 'No polarisation yet',
        body: 'Entangled photons are drawn plain: in quantum theory neither has its own {{polarisation}} until measured. Only the pair has a definite relationship.',
      },
      dial: {
        title: 'A choice of question',
        body: 'Each polariser asks its photon one question. The answer is random, + or −.',
      },
      chart: {
        title: 'Two predictions',
        body: 'The blue curve is quantum theory. The yellow line is the best simple hidden-instruction model. Experiments follow the blue curve.',
      },
      meter: {
        title: 'The Bell score',
        body: 'Hidden instructions can never push S above 2. Entangled pairs reach about 2.83.',
      },
    },
    realWorld: [
      {
        id: 'qkd',
        title: 'Eavesdropper alarms',
        body: 'In some forms of quantum key distribution, a Bell test reveals an eavesdropper, because spying spoils the {{correlation|correlations}}.',
      },
      {
        id: 'space',
        title: 'Entanglement from space',
        body: 'In 2017 China’s Micius satellite sent entangled photons to ground stations over 1,200 km apart. The correlations survived.',
      },
      {
        id: 'nobel',
        title: 'A Nobel Prize',
        body: 'Alain Aspect, John Clauser and Anton Zeilinger shared the 2022 Nobel Prize in Physics for experiments like this one.',
      },
    ],
  },

  checks: [
    {
      id: 'signal',
      question: 'Bob turns his polariser. Alice’s own results will…',
      choices: [
        { id: 'same', label: 'Stay 50/50' },
        { id: 'change', label: 'Change' },
        { id: 'stop', label: 'Stop' },
      ],
      correct: 'same',
      right:
        'Right. Alice alone always sees a fair coin. The link only shows when the two lists are compared.',
      wrong: 'A very natural guess! Watch Alice’s own share of + results while Bob turns his dial.',
      tryLabel: 'Turn Bob’s dial and watch',
    },
    {
      id: 'hidden',
      question: 'Can hidden instructions reach a Bell score of 2.8?',
      choices: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
        { id: 'sometimes', label: 'Only by luck' },
      ],
      correct: 'no',
      right: 'Right. Any pre-agreed answers give S of at most 2, apart from small random wobbles.',
      wrong: 'Tempting, but pre-agreed answers are capped at 2. Run the Bell test with hidden instructions.',
      tryLabel: 'Run a Bell test with hidden instructions',
    },
  ],

  deeper: {
    intro: 'Every number here is live. Change a control and watch them update.',
    equations: {
      state: 'The pair is in one shared state: both horizontal or both vertical, with neither decided.',
      match: 'The chance that the two results match depends only on the angle between the polarisers.',
      chsh: 'The {{bellScore|Bell score}} (also called CHSH, after its four inventors) combines four {{correlation|correlations}}. Any local hidden-variable theory keeps it between −2 and 2.',
      quantum: 'Quantum theory predicts up to 2√2. Experiments agree with quantum theory.',
    },
    misconceptions: [
      {
        myth: 'Entanglement sends a signal faster than light.',
        fact: 'Each side’s own results stay random whatever the other does. Nothing usable travels between them.',
      },
      {
        myth: 'The photons agreed on their answers back at the source.',
        fact: 'That is exactly the hidden-instruction model, and it cannot score above 2. Experiments score about 2.8.',
      },
      {
        myth: 'Measuring one photon pushes the other.',
        fact: 'The predictions do not depend on which side measures first, or on any push travelling between them.',
      },
    ],
    modelTitle: 'What this model simplifies',
    model: [
      {
        label: 'Model',
        points: [
          'Polarisation-entangled pairs in the state (|HH⟩ + |VV⟩)/√2; results follow P(same) = cos²(a − b).',
          'Hidden instructions: each pair shares a random polarisation λ; each photon passes if its polariser is within 45° of λ.',
          'Bell test: each side picks a setting at random for each pair; S = E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′).',
        ],
      },
      {
        label: 'Assumptions',
        points: [
          'A perfect pair source, ideal polarisers and detectors; no photons lost.',
          'The setting choices are random and independent of the source.',
          'The quantum results are generated on a classical computer from quantum theory’s predictions.',
        ],
      },
      {
        label: 'Limitations',
        points: [
          'This is a demonstration of the predictions, not a proof. The proof comes from real experiments, including loophole-free tests in 2015.',
          'The hidden-instruction model shown is one example; the limit S ≤ 2 holds for every such model (checked for all 16 fixed strategies in the tests).',
          'No noise or detector inefficiency, which in real experiments lower S.',
          'Photon flight on the stage is slowed down and is illustrative.',
        ],
      },
    ],
    historyTitle: 'History and sources',
    history: [
      {
        year: '1935',
        text: 'Einstein, Podolsky and Rosen argue quantum theory must be incomplete.',
        ref: 'A. Einstein, B. Podolsky, N. Rosen, Phys. Rev. 47, 777 (1935).',
      },
      {
        year: '1964',
        text: 'John Bell shows hidden instructions and quantum theory make different predictions.',
        ref: 'J. S. Bell, Physics 1, 195 (1964).',
      },
      {
        year: '1969',
        text: 'Clauser, Horne, Shimony and Holt write the testable form used here.',
        ref: 'J. F. Clauser, M. A. Horne, A. Shimony, R. A. Holt, Phys. Rev. Lett. 23, 880 (1969).',
      },
      {
        year: '1982',
        text: 'Aspect, Dalibard and Roger test it with settings changed during flight.',
        ref: 'A. Aspect, J. Dalibard, G. Roger, Phys. Rev. Lett. 49, 1804 (1982).',
      },
      {
        year: '2015',
        text: 'The first loophole-free Bell test, in Delft.',
        ref: 'B. Hensen et al., Nature 526, 682 (2015).',
      },
    ],
    further:
      'Further reading: N. D. Mermin, “Is the moon there when nobody looks?”, Physics Today 38(4), 38 (1985).',
  },
} as const;

export type DiscoveryId = (typeof content.discoveries)[number]['id'];
export type ChallengeId = (typeof content.challenges)[number]['id'];
