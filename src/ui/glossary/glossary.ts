/**
 * One definition per term, shared by every room so the wording never drifts.
 * Definitions are ≤ 25 words, plain, and true in every room (checked by src/content/textBudget.test.ts).
 * In content files, mark a term as {{key}} or {{key|shown words}}; see ui/learning/Rich.tsx.
 */
export const GLOSSARY = {
  photon: {
    term: 'Photon',
    def: 'A single quantum of light: light’s energy comes in these packets. Each photon is detected whole, in one place.',
  },
  wavelength: {
    term: 'Wavelength',
    def: 'The distance from one wave crest to the next. For visible light it is about half a millionth of a metre.',
  },
  interference: {
    term: 'Interference',
    def: 'What happens when waves overlap: where crests meet crests they add up; where crests meet troughs they cancel.',
  },
  phase: {
    term: 'Phase',
    def: 'Where a wave is in its cycle: at a crest, a trough, or somewhere in between. On every stage, colour shows phase.',
  },
  probability: {
    term: 'Probability',
    def: 'How likely something is, from 0 (never) to 1 (certain). On every stage, brighter or bigger means more likely.',
  },
  amplitude: {
    term: 'Amplitude',
    def: 'A number attached to each possible outcome. Its size squared is that outcome’s probability. Amplitudes can add or cancel, like waves.',
  },
  bornRule: {
    term: 'Born rule',
    def: 'The rule that turns amplitudes into chances: square the size of an outcome’s amplitude to get its probability.',
  },
  superposition: {
    term: 'Superposition',
    def: 'A state that combines several possibilities at once, each with its own amplitude, until a measurement finds one of them.',
  },
  measurement: {
    term: 'Measurement',
    def: 'Any physical interaction that records a result, such as a detector clicking. A person does not need to be watching.',
  },
  slit: {
    term: 'Slit',
    def: 'A narrow opening that light can pass through. In the double-slit room each one is a few hundredths of a millimetre wide.',
  },
  detector: {
    term: 'Detector',
    def: 'A device that records a particle, or something about it, such as which way it went.',
  },
  stripe: {
    term: 'Stripe',
    def: 'A bright band on a screen where many particles land. Physicists call these “fringes”.',
  },
  splitter: {
    term: 'Beam splitter',
    def: 'A half-silvered mirror. It lets part of a light wave through and reflects the rest.',
  },
  interferometer: {
    term: 'Interferometer',
    def: 'A device that splits a wave into two paths and brings them back together, so the paths can interfere.',
  },
  blochSphere: {
    term: 'Bloch sphere',
    def: 'A sphere on which every possible state of a two-state system is a point. The poles are the two definite states.',
  },
  polarisation: {
    term: 'Polarisation',
    def: 'The direction in which a light wave vibrates, at right angles to the way it travels.',
  },
  polariser: {
    term: 'Polariser',
    def: 'A filter that a photon either passes or doesn’t. The chance of passing depends on the photon and the filter’s angle.',
  },
  entangled: {
    term: 'Entangled',
    def: 'Particles sharing one joint state that cannot be split into separate states, one for each particle.',
  },
  correlation: {
    term: 'Correlation',
    def: 'How strongly two lists of results agree: +1 means always the same, −1 always opposite, 0 no link.',
  },
  bellScore: {
    term: 'Bell score',
    def: 'A number, S, built from correlations at four pairs of angles. Pre-agreed answers can never push it above 2.',
  },
  electronvolt: {
    term: 'Electronvolt (eV)',
    def: 'A tiny unit of energy: what an electron gains crossing one volt. A visible-light photon carries about 1.8 to 3.1 eV.',
  },
  wavePacket: {
    term: 'Wave packet',
    def: 'A short burst of wave standing for a particle whose position and speed are both roughly known.',
  },
  schrodinger: {
    term: 'Schrödinger equation',
    def: 'The equation that says how a particle’s wave changes over time, given the forces acting on it.',
  },
  qubit: {
    term: 'Qubit',
    def: 'A quantum bit: a two-state system that can be 0, 1, or a superposition of both described by two amplitudes.',
  },
  gate: {
    term: 'Gate',
    def: 'An operation on qubits, like a logic gate in an ordinary computer, but it changes amplitudes.',
  },
  decoherence: {
    term: 'Decoherence',
    def: 'The loss of a superposition’s phases through contact with the surroundings. It makes quantum effects fade in real devices.',
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;

export const isGlossaryKey = (k: string): k is GlossaryKey => k in GLOSSARY;
