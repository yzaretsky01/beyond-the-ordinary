/** Every visitor-facing word in the superposition room. Budgets: src/content/textBudget.test.ts. */
export const content = {
  number: '02',
  title: 'Superposition',

  wonder: {
    question: 'Can one photon travel two paths and meet itself?',
    ledes: [
      'A {{splitter|beam splitter}} sends each {{photon}} towards two paths. Mirrors bring the paths back together at a second splitter, and two detectors wait at the end.',
      'This setup is an {{interferometer}}. As in room 01, colour shows {{phase}} and brightness shows {{probability}}.',
    ],
    buildsOn: {
      text: 'Room 01’s idea of {{amplitude|amplitudes}} that add or cancel.',
      room: { to: '/double-slit', label: 'Revisit room 01' },
    },
  },

  predict: {
    prompt: 'Fire 100 photons. How many reach detector D1?',
    hint: 'Even split, no phase shift, both splitters in place.',
    label: 'Photons reaching D1',
    lock: 'Lock in my prediction',
    locked: 'Prediction locked. Now run the experiment.',
  },

  experiment: {
    prompt: 'Fire photons. Turn the phase. Remove a splitter.',
    fireOne: 'Fire one photon',
    stream: 'Fire continuously',
    clear: 'Clear counts',
    reset: 'Reset everything',
    beforeYouTry: {
      id: 'quarter',
      question: 'Turn the phase to 90°. The detectors will…',
      choices: [
        { id: 'd1', label: 'All D1' },
        { id: 'd2', label: 'All D2' },
        { id: 'half', label: 'Half each' },
      ],
      correct: 'half',
      right:
        'Yes! A quarter-wave delay is halfway between adding and cancelling, so the photons split evenly.',
      wrong:
        'Good guess. A quarter-wave delay sits halfway between adding and cancelling. Watch the counts even out.',
      tryLabel: 'Set the phase to 90° and fire',
    },
  },

  controls: {
    theta: {
      label: 'First splitter',
      tip: 'How the first splitter divides each photon’s amplitude between the upper and lower paths.',
    },
    phi: {
      label: 'Phase shift φ',
      tip: 'Delays the lower path’s wave. 180° is half a wave: crests become troughs. Drag the plate on the stage too.',
    },
    second: {
      label: 'Second splitter in place',
      tip: 'With it, the paths recombine. Without it, each path leads to its own detector, so the detectors reveal the path.',
    },
    rate: {
      label: 'Photons per second',
      tip: 'How fast the source fires. It does not change where photons go.',
    },
    arrows: {
      label: 'Show phase as arrows',
      tip: 'Adds arrows pointing the way the colour does: the same phase information, readable without colour.',
    },
    theory: {
      label: 'Show the prediction from theory',
      tip: 'Dashed blue lines mark the probabilities the model predicts.',
    },
  },

  discoveries: [
    {
      id: 'whole',
      title: 'Detected whole',
      body: 'Each photon clicks exactly one detector. It is never split into pieces.',
    },
    {
      id: 'certain',
      title: 'Not random after all',
      body: 'With an even split, no phase shift and both paths recombined, every photon reaches D1.',
    },
    {
      id: 'flip',
      title: 'Half a wave flips it',
      body: 'Shift one path by half a wave and every photon switches detector.',
    },
    {
      id: 'coin',
      title: 'A coin toss',
      body: 'Remove the second splitter and each photon turns up at one detector, at random.',
    },
    {
      id: 'blind',
      title: 'Phase needs recombining',
      body: 'Without the second splitter, turning the phase changes nothing you can measure.',
    },
  ],

  challenges: [
    { id: 'all-d2', text: 'Send every photon to detector D2.' },
    { id: 'balance', text: 'Make both detectors click equally, both splitters in.' },
    { id: 'three-quarters', text: 'Without the second splitter, make D1 click three times in four.' },
  ],

  explain: {
    summary:
      'Inside, the photon isn’t on one path or the other: it has an {{amplitude}} for each. At the second splitter both reach each detector, adding up at one and cancelling at the other.',
    compare: {
      result:
        'With an even split and no phase shift the model says 100 of 100: the two paths add up completely at D1 and cancel completely at D2. Your guess is the dashed amber line.',
    },
    waitWhy: [
      {
        q: 'Wait, what is superposition?',
        body: 'Before it’s detected, the photon is in a {{superposition}}: a combination of both paths, with an amplitude for each. A detector always finds it on one path, with odds set by those amplitudes.',
      },
      {
        q: 'Wait, isn’t it like a spinning coin?',
        body: 'A spinning coin is neither heads nor tails until it lands, which captures the idea that the result isn’t settled yet.',
        limits:
          'A spinning coin is always really one way up at each instant, and coins never interfere. The phase plate shows these amplitudes do interfere.',
      },
      {
        q: 'Wait, what is the sphere?',
        body: 'It’s a {{blochSphere|Bloch sphere}}. Every possible state is a point on it: the top is “upper path”, the bottom is “lower path”, and going round the middle changes the phase.',
      },
    ],
    story: {
      title: 'Interfering with itself',
      body: 'In 1930 Paul Dirac wrote that “each photon then interferes only with itself.” A clean test needed a source that truly emits photons one by one. Grangier, Roger and Aspect built one in 1986, and each photon did interfere with itself.',
    },
    mathTeaser: {
      reading:
        'With both splitters in, the chance of D1 depends on the split θ and the phase φ. The term with cos φ is the interference.',
    },
    hotspots: {
      split: {
        title: 'Two amplitudes',
        body: 'The first splitter gives the photon an amplitude for each path. Their sizes squared add to one.',
      },
      phase: {
        title: 'Phase',
        body: 'The plate delays the lower wave. The colour change after it shows the shift in phase.',
      },
      meet: {
        title: 'Paths meet',
        body: 'Here both paths’ amplitudes reach each detector. In step they add; out of step they cancel.',
      },
      sphere: {
        title: 'The state as an arrow',
        body: 'Every possible state of the photon is a point on this {{blochSphere|sphere}}. Its shadow on the dashed line gives the odds of D1.',
      },
    },
    realWorld: [
      {
        id: 'lab',
        title: 'Done with single photons',
        body: 'In 1986 Grangier, Roger and Aspect sent single photons through an interferometer like this one and saw the same interference.',
      },
      {
        id: 'random',
        title: 'Truly random numbers',
        body: 'A photon at an even splitter with no recombining is a quantum coin toss. Some random-number generators work exactly this way.',
      },
      {
        id: 'sunglasses',
        title: 'Polarised sunglasses',
        body: '{{polarisation|Polarisation}} is another two-state system. A photon polarised at 45° passes a vertical filter with probability one half.',
      },
    ],
  },

  checks: [
    {
      id: 'remove',
      question: 'Remove the second splitter. Turning the phase will…',
      choices: [
        { id: 'change', label: 'Change the counts' },
        { id: 'nothing', label: 'Change nothing' },
        { id: 'stop', label: 'Stop all photons' },
      ],
      correct: 'nothing',
      right:
        'Right. Without recombining, each detector sees only one path, and a single path’s phase cannot be seen.',
      wrong: 'Interesting guess! Each detector now sees only one path. Watch the counts as the phase turns.',
      tryLabel: 'Remove it and turn the phase',
    },
    {
      id: 'half-wave',
      question: 'Both splitters in, phase at 180°. Where do photons go?',
      choices: [
        { id: 'd1', label: 'All to D1' },
        { id: 'd2', label: 'All to D2' },
        { id: 'half', label: 'Half each' },
      ],
      correct: 'd2',
      right: 'Right. Half a wave turns adding into cancelling at D1, so every photon goes to D2.',
      wrong:
        'Lots of people guess that. Half a wave swaps which detector gets the adding and which the cancelling.',
      tryLabel: 'Set the phase to 180° and watch',
    },
  ],

  deeper: {
    intro: 'Every number here is live. Change a control and watch them update.',
    equations: {
      state: 'The photon’s state is a sum of the two paths. Each coefficient is an amplitude.',
      path: 'Without the second splitter, the detectors measure the path: the chance is the size squared of that path’s amplitude.',
      interfere:
        'With it, both amplitudes reach D1 and add before squaring. The cross term, sinθ cosφ, is interference.',
      bloch: 'The same state as an arrow: θ tilts it from upper towards lower, φ turns it around the axis.',
    },
    misconceptions: [
      {
        myth: 'The photon secretly takes one path; we only don’t know which.',
        fact: 'If so, the phase plate could not change the counts. It does, so both paths’ amplitudes must contribute.',
      },
      {
        myth: 'Superposition means half a photon in each path.',
        fact: 'Detectors always find a whole photon. What is split is the amplitude, not the photon.',
      },
      {
        myth: 'Measuring only reveals what was already there.',
        fact: 'Removing the second splitter measures the path and destroys the interference. The measurement changes what you can observe.',
      },
    ],
    modelTitle: 'What this model simplifies',
    model: [
      {
        label: 'Model',
        points: [
          'The photon’s path is a two-state system: |ψ⟩ = cos(θ/2)|upper⟩ + e^{iφ} sin(θ/2)|lower⟩.',
          'The second splitter is an even (50/50) splitter; detection follows the {{bornRule|Born rule}}, |amplitude|².',
          'Removing the second splitter turns the detectors into a which-path measurement.',
        ],
      },
      {
        label: 'Assumptions',
        points: [
          'Ideal, lossless splitters and mirrors; perfect detectors; a true single-photon source.',
          'Both arms have exactly the same length, apart from the phase plate.',
          'Splitter phase conventions are chosen so that with no extra phase every photon leaves towards D1.',
        ],
      },
      {
        label: 'Limitations',
        points: [
          'No {{decoherence}}, vibration, or detector noise, which in real labs blur the effect.',
          'The coloured waves are drawn far larger and slower than real light. Their brightness and colour are calculated; their size is not to scale.',
          'No photon is drawn travelling along a path, because standard quantum theory gives it no definite path inside the interferometer.',
          'Interpretations of quantum mechanics disagree about what happens inside; they all agree on the detector statistics shown here.',
        ],
      },
    ],
    historyTitle: 'History and sources',
    history: [
      {
        year: '1891–92',
        text: 'Ludwig Zehnder and Ludwig Mach design the interferometer used in this room.',
        ref: 'L. Zehnder, Zeitschrift für Instrumentenkunde 11, 275 (1891); L. Mach, Zeitschrift für Instrumentenkunde 12, 89 (1892).',
      },
      {
        year: '1930',
        text: 'Paul Dirac writes that each photon “interferes only with itself”. His further claim, that two different photons never interfere, was later shown too strong (Pfleegor and Mandel, 1967).',
        ref: 'P. A. M. Dirac, The Principles of Quantum Mechanics (Oxford, 1930), ch. 1; R. L. Pfleegor, L. Mandel, Phys. Rev. 159, 1084 (1967).',
      },
      {
        year: '1986',
        text: 'Grangier, Roger and Aspect confirm single-photon interference with a true single-photon source.',
        ref: 'P. Grangier, G. Roger, A. Aspect, Europhysics Letters 1, 173–179 (1986).',
      },
    ],
    further:
      'Further reading: M. A. Nielsen and I. L. Chuang, Quantum Computation and Quantum Information, Chapter 1.',
  },
  /** The long-form explanation page (/superposition/about). Exempt from the short word budgets. */
  about: {
    title: 'How does superposition work?',
    sections: [
      {
        q: 'What is superposition?',
        paras: [
          'A light switch is either on or off. A quantum system can be in a combination of its possible states at once, a {{superposition}}. Here the system is a photon with two paths, and the combination is described by two {{amplitude|amplitudes}}, one per path.',
          'An amplitude is like a small arrow: it has a size and a direction, its {{phase}}. When you measure, you always get one definite answer. The squared size of each arrow gives the chance of that answer, the {{bornRule|Born rule}}.',
        ],
      },
      {
        q: 'How do we know it isn’t secretly one or the other?',
        paras: [
          'This room’s {{interferometer}} brings the two paths back together at a second {{splitter}}. If every photon secretly took one path, half would reach each detector whatever you did to the paths.',
          'That is not what happens. Change the phase on one path and the odds swing all the way from every photon reaching D1 to every photon reaching D2. Only amplitudes from both paths, interfering, can do that. Take the second splitter away and the swing is gone: 50/50 every time.',
        ],
      },
      {
        q: 'Where is superposition used?',
        paras: [
          'Interferometers are some of the most sensitive measuring tools ever built. LIGO, a kilometres-long cousin of this one, used interfering laser light to detect gravitational waves in 2015. Superposition is also the raw material of quantum computers, which you can program in room 05.',
        ],
      },
    ],
    sources: [
      'P. Grangier, G. Roger, A. Aspect, Europhysics Letters 1, 173–179 (1986).',
      'B. P. Abbott et al. (LIGO and Virgo), Phys. Rev. Lett. 116, 061102 (2016).',
    ],
  },
} as const;

export type DiscoveryId = (typeof content.discoveries)[number]['id'];
export type ChallengeId = (typeof content.challenges)[number]['id'];
