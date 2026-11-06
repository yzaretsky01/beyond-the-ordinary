/** Every visitor-facing word in the tunneling room. Budgets: src/content/textBudget.test.ts. */
export const content = {
  number: '04',
  title: 'Tunneling',

  wonder: {
    question: 'Can an electron pass through a wall it cannot climb?',
    ledes: [
      'An electron, shown as its {{wavePacket|wave packet}}, races towards a thin wall of electric energy. It has less energy than the wall is tall, so by everyday rules it must bounce back.',
      'The curve’s height is the {{probability}} of finding the electron there, and its colour is the wave’s {{phase}}. The motion comes from the {{schrodinger|Schrödinger equation}}.',
    ],
    buildsOn: {
      text: 'Room 01’s idea that a particle’s whereabouts follow a wave.',
      room: { to: '/double-slit', label: 'Revisit room 01' },
    },
  },

  predict: {
    prompt: 'How much of the electron gets through this wall?',
    hint: 'Electron energy 5 eV, wall 7 eV high and 0.2 nm thick. A ball with too little energy always bounces back.',
    label: 'Percent getting through',
    lock: 'Lock in my prediction',
    locked: 'Prediction locked. Now launch the electron.',
  },

  experiment: {
    prompt: 'Launch the electron. Reshape the wall. Launch again.',
    launch: 'Launch electron',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset everything',
    beforeYouTry: {
      id: 'closer-to-top',
      question: 'Raise the energy to 6.5 eV, nearer the wall’s top. Transmission will…',
      choices: [
        { id: 'grow', label: 'Grow' },
        { id: 'shrink', label: 'Shrink' },
        { id: 'same', label: 'Stay the same' },
      ],
      correct: 'grow',
      right: 'Yes! The smaller the gap between energy and wall height, the slower the wave fades inside.',
      wrong:
        'Interesting guess. A smaller energy gap makes the wave fade more slowly inside the wall. Launch and see.',
      tryLabel: 'Set 6.5 eV and launch',
    },
  },

  controls: {
    energy: {
      label: 'Electron energy',
      tip: 'The electron’s average kinetic energy. Drag the dashed line on the stage too.',
    },
    barrier: {
      label: 'Wall height',
      tip: 'How much energy a classical particle would need to climb over. Drag the wall’s top.',
    },
    width: {
      label: 'Wall thickness',
      tip: 'How thick the wall is. Drag the wall’s right edge on the stage.',
    },
    packet: {
      label: 'Wave packet width',
      tip: 'How spread out the electron starts. Narrower packets mix more energies, so their transmission is averaged more.',
    },
    arrows: {
      label: 'Show phase as arrows',
      tip: 'Arrows pointing the way the colour does: the same phase information, readable without colour.',
    },
    classical: {
      label: 'Show a classical ball',
      tip: 'A plain white ball with the same energy. It obeys everyday mechanics: it bounces, or slows down while crossing the wall.',
    },
    theory: {
      label: 'Show the prediction from theory',
      tip: 'Blue lines mark the transmission the formula predicts for this packet.',
    },
  },

  discoveries: [
    {
      id: 'through',
      title: 'Through the wall',
      body: 'Part of the wave appears beyond a wall the electron cannot climb.',
    },
    {
      id: 'split',
      title: 'The wave splits',
      body: 'One part reflects, one part passes. A detector would still find one whole electron.',
    },
    {
      id: 'thin',
      title: 'Thin walls leak',
      body: 'Thinner walls let far more through: the leak shrinks steeply with thickness.',
    },
    {
      id: 'bounce-above',
      title: 'Bouncing off nothing',
      body: 'Even with energy to spare, part of the wave reflects. A classical ball never would.',
    },
    {
      id: 'transparent',
      title: 'A transparent wall',
      body: 'At special energies above the wall, almost nothing reflects.',
    },
  ],

  challenges: [
    { id: 'half', text: 'Get about half through a wall taller than the energy.' },
    { id: 'block', text: 'Block 99.9% with a wall no thicker than 0.5 nm.' },
    { id: 'transparent', text: 'Find an energy above the wall where almost nothing reflects.' },
  ],

  explain: {
    summary:
      'The electron’s wave doesn’t stop dead at the wall. Inside, it fades fast, but if the wall is thin a little is still there on the far side, and so is a chance of finding the electron.',
    compare: {
      result: (guess: number, model: string) =>
        `You predicted ${guess}% would get through. The Schrödinger equation gives ${model} for that wall, and a classical ball would give exactly 0%.`,
    },
    waitWhy: [
      {
        q: 'Wait, how can it pass a wall it can’t climb?',
        body: 'The wave doesn’t drop to zero at the wall. Inside, it fades smoothly instead. If the wall is thin enough, some of the wave reaches the far side, and so does some chance of finding the electron there.',
      },
      {
        q: 'Wait, isn’t it like sound through a wall?',
        body: 'Sound leaks through a thin wall and gets quieter with thickness, much like the wave here.',
        limits:
          'Sound is many air molecules pushing on the wall. Here a detector finds one whole electron on one side or the other, never partly through.',
      },
      {
        q: 'Wait, what are eV and nm?',
        body: 'An {{electronvolt}} is a tiny unit of energy, handy for single electrons. A nanometre (nm) is a millionth of a millimetre, a few atoms across.',
      },
    ],
    story: {
      title: 'Escaping the nucleus',
      body: 'In 1928 George Gamow realised tunneling explains radioactive alpha decay: alpha particles leak out of nuclei they could never climb out of. The same effect lets the Sun fuse hydrogen.',
    },
    mathTeaser: {
      reading:
        'For a single energy E below the wall height V₀, the wave fades inside the wall at a rate κ. For thick walls (bigger a), transmission falls roughly exponentially.',
    },
    hotspots: {
      inside: {
        title: 'Inside the wall',
        body: 'Here the wave fades away exponentially. How fast depends on how far the energy is below the wall’s height.',
      },
      beyond: {
        title: 'Beyond the wall',
        body: 'The part that survives the fade keeps travelling. Its size squared is the chance the electron got through.',
      },
      reflected: {
        title: 'Reflected part',
        body: 'Most of the wave bounces back. Where it overlaps the incoming wave, the two interfere.',
      },
      energy: {
        title: 'Energy line',
        body: 'The dashed line is the electron’s energy. Below the wall’s top, a classical particle could never cross.',
      },
    },
    realWorld: [
      {
        id: 'stm',
        title: 'Seeing single atoms',
        body: 'A scanning tunneling microscope measures electrons tunneling across a tiny gap. The current changes so steeply with distance that it maps atoms.',
      },
      {
        id: 'alpha',
        title: 'Radioactive decay',
        body: 'Alpha particles escape some nuclei by tunneling through the energy barrier that holds them in.',
      },
      {
        id: 'flash',
        title: 'Flash memory',
        body: 'Flash memory stores data as trapped charge. Many chips write or erase it by tunneling electrons through a thin insulating layer.',
      },
    ],
  },

  checks: [
    {
      id: 'thicker',
      question: 'Make the wall twice as thick. Transmission will…',
      choices: [
        { id: 'drop', label: 'Drop a lot' },
        { id: 'halve', label: 'Halve' },
        { id: 'same', label: 'Stay the same' },
      ],
      correct: 'drop',
      right:
        'Right. The wave fades exponentially inside, so doubling the thickness cuts transmission by much more than half.',
      wrong: 'Most people think so. Inside the wall the wave fades fast, so doubling hurts a lot. Watch.',
      tryLabel: 'Double the thickness and launch',
    },
    {
      id: 'above',
      question: 'Energy above the wall. Will anything reflect?',
      choices: [
        { id: 'some', label: 'Yes, some' },
        { id: 'none', label: 'Nothing' },
        { id: 'all', label: 'All of it' },
      ],
      correct: 'some',
      right: 'Right. A sudden change in height reflects part of any wave, even when it has energy to spare.',
      wrong: 'Surprising, right? Waves partly reflect at any sudden change. Watch the reflected bar.',
      tryLabel: 'Raise the energy above the wall and launch',
    },
  ],

  deeper: {
    intro: 'Every number here is live. Change a control and watch them update.',
    equations: {
      tdse: 'The Schrödinger equation: how the electron’s wave changes in time, given the energy landscape V(x).',
      kappa: 'Inside the wall the wave fades as e^(−κx). A bigger energy gap means faster fading.',
      transmission: 'For a single energy, the transmission through a rectangular wall has this exact form.',
      packet:
        'A real packet mixes energies, so the fair comparison averages T over them. That is the number the simulation should reach.',
    },
    misconceptions: [
      {
        myth: 'The electron borrows energy to get over the wall.',
        fact: 'Nothing is borrowed. The wave does not drop to zero inside the wall, so there is a chance of finding the electron beyond it.',
      },
      {
        myth: 'Part of the electron gets through.',
        fact: 'A detector always finds the whole electron, on one side or the other. The wave sets the odds.',
      },
      {
        myth: 'Tunneling only matters in labs.',
        fact: 'It powers the Sun’s fusion, radioactive decay, and the flash memory in your phone.',
      },
    ],
    modelTitle: 'What this model simplifies',
    model: [
      {
        label: 'Model',
        points: [
          'The time-dependent Schrödinger equation in one dimension for one electron (mass mₑ).',
          'Solved with the split-operator Fourier method on 4,096 points, 0.0125 nm apart, with 0.0017 fs time steps.',
          'Through = probability beyond the wall, including what has left the right edge of the grid.',
        ],
      },
      {
        label: 'Assumptions',
        points: [
          'A perfectly rectangular wall that does not change in time; no other electrons or forces.',
          'Non-relativistic motion, which holds well at these few-electronvolt energies.',
          'The packet starts as a Gaussian with the chosen width and mean energy.',
        ],
      },
      {
        label: 'Limitations',
        points: [
          'Real barriers are three-dimensional and smoothly shaped; real tunneling also involves many particles.',
          'The edges of the grid absorb the wave to mimic open space; a tiny fraction can still reflect.',
          'Time on the stage runs about 500 trillion times slower than for a real electron (one second shows about 2 fs).',
        ],
      },
    ],
    historyTitle: 'History and sources',
    history: [
      {
        year: '1928',
        text: 'George Gamow, and independently Ronald Gurney and Edward Condon, explain alpha decay by tunneling.',
        ref: 'G. Gamow, Zeitschrift für Physik 51, 204 (1928); R. W. Gurney, E. U. Condon, Nature 122, 439 (1928).',
      },
      {
        year: '1958',
        text: 'Leo Esaki builds the tunnel diode (Nobel Prize 1973).',
        ref: 'L. Esaki, Phys. Rev. 109, 603 (1958).',
      },
      {
        year: '1982',
        text: 'Gerd Binnig and Heinrich Rohrer demonstrate the scanning tunneling microscope (Nobel Prize 1986).',
        ref: 'G. Binnig, H. Rohrer, Ch. Gerber, E. Weibel, Phys. Rev. Lett. 49, 57 (1982).',
      },
    ],
    further:
      'Further reading: D. J. Griffiths, Introduction to Quantum Mechanics, section on the finite square barrier.',
  },
  /** The long-form explanation page (/tunneling/about). Exempt from the short word budgets. */
  about: {
    title: 'How does tunneling work?',
    sections: [
      {
        q: 'What is quantum tunneling?',
        paras: [
          'Roll a ball at a hill too high for it and it rolls back, every time. An electron is described by a {{wavePacket|wave packet}}, and its wave does not stop dead at a wall it cannot climb. Inside the wall the wave fades away quickly.',
          'If the wall is thin, a little of the wave is still there on the far side. That leftover sets the {{probability}} of finding the electron beyond the wall. Detect it, and you always find one whole electron, on one side or the other.',
        ],
      },
      {
        q: 'Does the electron borrow energy to get through?',
        paras: [
          'No. Nothing is borrowed: an electron found beyond the wall has the same energy it started with. The wave never drops to zero inside the wall, and that is all tunneling needs.',
          'How much gets through depends steeply on the wall. Make it a little thicker or taller and the chance falls dramatically, roughly exponentially with thickness. This room solves the {{schrodinger|Schrödinger equation}} step by step, so you can watch it happen.',
        ],
      },
      {
        q: 'Where does tunneling happen?',
        paras: [
          'All around us. It lets alpha particles escape some radioactive nuclei, which George Gamow explained in 1928. It lets hydrogen nuclei in the Sun get close enough to fuse. And scanning tunneling microscopes use it to map single atoms on a surface.',
        ],
      },
    ],
    sources: [
      'G. Gamow, Zeitschrift für Physik 51, 204 (1928).',
      'G. Binnig, H. Rohrer, Ch. Gerber, E. Weibel, Phys. Rev. Lett. 49, 57 (1982).',
      'D. J. Griffiths, Introduction to Quantum Mechanics, the finite square barrier.',
    ],
  },
} as const;

export type DiscoveryId = (typeof content.discoveries)[number]['id'];
export type ChallengeId = (typeof content.challenges)[number]['id'];
