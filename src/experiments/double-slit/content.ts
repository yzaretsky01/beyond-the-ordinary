/**
 * Every visitor-facing word in the double-slit room. Word budgets are enforced by
 * src/content/textBudget.test.ts. Physics claims follow .claude/skills/quantum-physics.
 */
export const content = {
  number: '01',
  title: 'The Double Slit',

  wonder: {
    question: 'Can one photon go through two slits at once?',
    ledes: [
      'A lamp fires {{photon|photons}}, tiny packets of light, at a wall with two narrow {{slit|slits}}. A screen behind it records where each one lands.',
      'The swirling colours are the light’s wave. Colour shows its {{phase}}; brightness shows the {{probability}} of a photon landing there.',
    ],
    buildsOn: {
      text: 'This first room introduces waves, phase and probability. Every other room builds on them.',
    },
  },

  predict: {
    prompt: 'Draw where you think the photons will land.',
    hint: 'Sketch on the dark screen area at the right of the stage.',
    orPick: 'Or pick a shape',
    choices: [
      { id: 'one', label: 'One bright band' },
      { id: 'two', label: 'Two bright bands' },
      { id: 'many', label: 'Many stripes' },
    ],
    lock: 'Lock in my prediction',
    redo: 'Clear my sketch',
    locked: 'Prediction locked. Now run the experiment.',
  },

  experiment: {
    prompt: 'Fire photons. Drag the slits and the screen.',
    fireOne: 'Fire one photon',
    stream: 'Fire continuously',
    clear: 'Clear screen',
    reset: 'Reset everything',
    full: 'The screen is full. Clear it to keep firing.',
    beforeYouTry: {
      id: 'closer',
      question: 'Move the slits closer together. The stripes will…',
      choices: [
        { id: 'squeeze', label: 'Squeeze together' },
        { id: 'spread', label: 'Spread apart' },
        { id: 'vanish', label: 'Disappear' },
      ],
      correct: 'spread',
      right:
        'Yes! Closer slits make the two paths differ more slowly across the screen, so the stripes spread out.',
      wrong: 'Most people guess that. Closer slits actually spread the stripes out. Watch it happen.',
      tryLabel: 'Move the slits closer and fire',
    },
  },

  controls: {
    wavelength: {
      label: 'Wavelength',
      tip: 'The colour of the light. Longer wavelengths are redder. Watch how the stripes respond.',
    },
    separation: {
      label: 'Slit separation',
      tip: 'Distance between the centres of the two slits. You can also drag the top slit on the stage.',
    },
    width: {
      label: 'Slit width',
      tip: 'How wide each slit is. Narrower slits spread light more, so the overall glow widens.',
    },
    distance: {
      label: 'Screen distance',
      tip: 'How far the screen is from the slits. You can also drag the screen on the stage.',
    },
    rate: {
      label: 'Photons per second',
      tip: 'How fast the source fires when firing continuously. It does not change where photons land.',
    },
    slits: { legend: 'Open slits', both: 'Both', upper: 'Top only', lower: 'Bottom only' },
    detector: {
      label: 'Which-slit detector',
      tip: 'Records which slit each photon passes through, without blocking it. Try it with the screen full of stripes.',
    },
    arrows: {
      label: 'Show phase as arrows',
      tip: 'Adds arrows that point the way the colour does: the same phase information, readable without colour.',
    },
    theory: {
      label: 'Show the prediction from theory',
      tip: 'The dashed blue curve is what the model says the dots will build up to.',
    },
  },

  discoveries: [
    {
      id: 'one-dot',
      title: 'One photon, one dot',
      body: 'Each photon lands whole, in a single spot, like a tiny particle.',
    },
    {
      id: 'stripes',
      title: 'Dots build stripes',
      body: 'Hundreds of single dots build bright and dark stripes, a pattern only waves make.',
    },
    {
      id: 'which-path',
      title: 'Knowing erases the stripes',
      body: 'When a detector records which slit each photon used, the stripes vanish.',
    },
    {
      id: 'one-slit',
      title: 'One slit, no stripes',
      body: 'With one slit open, photons spread into one broad glow. Stripes need both paths.',
    },
    {
      id: 'colour',
      title: 'Colour sets the spacing',
      body: 'Redder light has longer waves, and longer waves spread the stripes further apart.',
    },
  ],

  challenges: [
    { id: 'double', text: 'Make the stripes twice as far apart as at the start.' },
    { id: 'five', text: 'Fit exactly five bright stripes on the screen.' },
    { id: 'erase', text: 'Erase the stripes while keeping both slits open.' },
  ],

  explain: {
    summary:
      'Here’s the twist: every photon lands as one dot, like a particle. But where it can land is set by a wave that went through both slits and overlapped with itself.',
    compare: {
      predicted: (bands: number) => (bands === 1 ? 'one bright band' : `${bands} bright bands`),
      stripes: (n: number) => `With these settings the screen shows ${n} stripes.`,
      noStripes: 'Right now the screen shows one broad glow, because the two paths can’t interfere.',
      sketch: 'Your sketch is the dashed amber line.',
    },
    waitWhy: [
      {
        q: 'Wait, why does a particle make a wave pattern?',
        body: 'Nobody sees the wave itself; we only ever see dots. But where dots can land follows a wave that passed through both slits. The wave’s value at each spot is its {{amplitude}}, and its size squared is the chance of a dot landing there.',
      },
      {
        q: 'Wait, what does phase mean?',
        body: 'Picture each wave as a clock hand going round. {{phase|Phase}} is where the hand points right now. Two waves arriving with hands pointing the same way add up; pointing opposite ways, they cancel.',
        limits:
          'The clock hand is a picture of a number that cycles. Nothing inside the photon is actually spinning.',
      },
      {
        q: 'Wait, isn’t this like water waves?',
        body: 'Water waves through two gaps make the same striped pattern, which is why the picture is useful.',
        limits:
          'A water wave arrives everywhere at once, spread out. Each photon arrives as one dot; the stripes only appear as dots pile up.',
      },
    ],
    story: {
      title: 'A three-month photograph',
      body: 'In 1909 G. I. Taylor dimmed his lamp until photons passed through one at a time, on average. His longest photograph took about three months to expose. The stripes still appeared.',
    },
    mathTeaser: {
      reading:
        'The spacing between stripes grows with the {{wavelength}} λ and the screen distance L, and shrinks as the slits move apart (d).',
    },
    hotspots: {
      centre: {
        title: 'Bright centre',
        body: 'Both paths are the same length here, so the waves arrive in step and add up. This is where photons land most often.',
      },
      dark: {
        title: 'Dark stripe',
        body: 'Here one path is one and a half wavelengths longer. Crest meets trough, the waves cancel, and almost no photon ever lands.',
      },
      slits: {
        title: 'Two paths',
        body: 'The wave describing each photon passes through both slits. Neither slit alone decides where the photon lands.',
      },
      colours: {
        title: 'Colours',
        body: 'Colour shows the wave’s {{phase}}, where it is in its cycle. Brightness shows how likely a photon is to land there.',
      },
    },
    realWorld: [
      {
        id: 'electrons',
        title: 'Electrons do it too',
        body: 'In 1989 Akira Tonomura’s team sent electrons one at a time through an electron biprism. The same stripes built up, dot by dot.',
      },
      {
        id: 'disc',
        title: 'Rainbows on a CD',
        body: 'A CD’s closely spaced tracks act like thousands of slits. Each colour’s bright stripes leave at a different angle, splitting white light.',
      },
      {
        id: 'ligo',
        title: 'Measuring with waves',
        body: '{{interferometer|Interferometers}} compare two light paths to detect changes far smaller than a wavelength. LIGO used one to detect gravitational waves in 2015.',
      },
    ],
  },

  checks: [
    {
      id: 'close-top',
      question: 'Close the top slit. What will the screen show?',
      choices: [
        { id: 'stripes', label: 'The same stripes' },
        { id: 'glow', label: 'One broad glow' },
        { id: 'two', label: 'Two bands' },
      ],
      correct: 'glow',
      right: 'Right. With only one path there is nothing to interfere with, so the stripes disappear.',
      wrong: 'Good guess, but with only one path there is nothing to interfere with. Watch the screen.',
      tryLabel: 'Close the top slit and watch',
    },
    {
      id: 'red-light',
      question: 'Switch from green to red light. The stripes will…',
      choices: [
        { id: 'closer', label: 'Move closer' },
        { id: 'apart', label: 'Spread apart' },
        { id: 'same', label: 'Stay the same' },
      ],
      correct: 'apart',
      right: 'Right. Red light has a longer wavelength, and the stripe spacing grows with wavelength.',
      wrong: 'Surprising, right? Red light has a longer wavelength. Watch what that does to the spacing.',
      tryLabel: 'Switch to red light and watch',
    },
  ],

  deeper: {
    intro: 'Hover a symbol to find its control. Every number here is live.',
    equations: {
      path: 'Bright stripes appear where the two paths differ by a whole number of wavelengths; dark ones where they differ by a half.',
      spacing:
        'Longer waves or a farther screen spread the stripes; slits further apart squeeze them together.',
      intensity:
        'The cos² part makes the stripes. The sinc² part is the broad glow from each slit’s own width, which fades the outer stripes.',
      born: 'Without a detector, add the two amplitudes and then square: interference. With a detector, square each first and then add: no interference.',
    },
    misconceptions: [
      {
        myth: 'Watching needs a person.',
        fact: 'Any physical interaction that records the path removes the stripes, even an unattended machine.',
      },
      {
        myth: 'The photon splits in half.',
        fact: 'Every photon lands whole, in one place. What passes through both slits is the probability wave.',
      },
      {
        myth: 'The stripes come from photons bumping into each other.',
        fact: 'The stripes still build up when photons are sent one at a time, long after one another.',
      },
    ],
    modelTitle: 'What this model simplifies',
    model: [
      {
        label: 'Model',
        points: [
          'Wave optics in the far field (Fraunhofer diffraction), with exact angles: sin θ = y ⁄ √(y² + L²).',
          'Each photon’s landing spot is drawn at random from |ψ|², using the {{bornRule|Born rule}}.',
          'A which-slit detector gives complete path information, so probabilities add instead of amplitudes.',
        ],
      },
      {
        label: 'Assumptions',
        points: [
          'A single, pure colour and a perfectly coherent source.',
          'Two identical, ideal slits in a thin wall; light treated as a scalar wave (polarisation ignored).',
          'The screen is far away compared with the slit size (Fresnel number shown below stays well under 1).',
          'Photons that hit the wall are absorbed; with both slits open, the count is normalised to 1.',
        ],
      },
      {
        label: 'Limitations',
        points: [
          'No partial detector: the real world allows weak which-path information that only fades the stripes.',
          'No slit-edge effects, vibration, or detector noise.',
          'The coloured waves on the stage are drawn hugely enlarged and squeezed. They show roughly the same number of stripes as the screen; the screen pattern itself is calculated at true scale.',
          'Crests move far slower than real light, which oscillates about 10¹⁵ times per second.',
        ],
      },
    ],
    validity: 'Far-field check (Fresnel number): the formula holds when this is far below 1',
    historyTitle: 'History and sources',
    history: [
      {
        year: '1801–1803',
        text: 'Thomas Young shows light makes interference stripes, evidence that light is a wave.',
        ref: 'T. Young, “Experiments and calculations relative to physical optics”, Phil. Trans. R. Soc. 94, 1–16 (1804).',
      },
      {
        year: '1909',
        text: 'G. I. Taylor sees the stripes with light so faint that photons pass through roughly one at a time.',
        ref: 'G. I. Taylor, “Interference fringes with feeble light”, Proc. Camb. Phil. Soc. 15, 114 (1909).',
      },
      {
        year: '1961',
        text: 'Claus Jönsson performs the double-slit experiment with electrons.',
        ref: 'C. Jönsson, Zeitschrift für Physik 161, 454–474 (1961).',
      },
      {
        year: '1989',
        text: 'Tonomura’s team records single electrons building up the pattern one dot at a time.',
        ref: 'A. Tonomura et al., “Demonstration of single-electron buildup of an interference pattern”, Am. J. Phys. 57, 117–120 (1989).',
      },
    ],
    further: 'Further reading: The Feynman Lectures on Physics, Vol. III, Chapter 1, “Quantum Behavior”.',
  },
} as const;

export type DiscoveryId = (typeof content.discoveries)[number]['id'];
export type ChallengeId = (typeof content.challenges)[number]['id'];
