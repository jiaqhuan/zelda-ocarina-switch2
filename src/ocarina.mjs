// Core logic: sheet-music notes -> Ocarina of Time (Switch 2) button inputs.
// Zero dependencies. See docs/score-to-fingering.md for the design.

/** MIDI numbers of the five natural notes. */
export const BUTTONS = { L: 62, R: 65, A: 69, Y: 71, X: 74 }; // D4 F4 A4 B4 D5
export const BUTTON_ORDER = ['L', 'R', 'A', 'Y', 'X'];

/** Playable range: B3 (59) to F5 (77), 19 semitones. */
export const RANGE = { min: 59, max: 77 };

// D-pad lands the pitch exactly, so it is cheaper than the stick; each extra
// modifier makes the input harder to hold.
const COST = { dpad: 1, stick: 1.5 };

const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

/** "F#4" / "Eb4" / "C♯5" -> MIDI number (C4 = 60). */
export function parseNote(text) {
  const m = /^([A-Ga-g])([#♯b♭]?)(-?\d+)$/.exec(text.trim());
  if (!m) throw new SyntaxError(`Cannot parse note "${text}" (expected e.g. C4, F#4, Eb5)`);
  const accidental = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + SEMITONE[m[1].toUpperCase()] + accidental;
}

/** MIDI number -> "F♯4". */
export function noteName(midi) {
  return `${SHARP_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

/** Every one of the 45 inputs, with the pitch it produces and its cost. */
function allInputs() {
  const inputs = [];
  for (const button of BUTTON_ORDER) {
    for (const dpad of [-1, 0, 1]) {
      for (const stick of [-1, 0, 1]) {
        inputs.push({
          button,
          dpad,
          stick,
          midi: BUTTONS[button] + dpad + 2 * stick,
          cost: (dpad ? COST.dpad : 0) + (stick ? COST.stick : 0),
        });
      }
    }
  }
  return inputs;
}

const BY_PITCH = new Map();
for (const input of allInputs()) {
  if (!BY_PITCH.has(input.midi)) BY_PITCH.set(input.midi, []);
  BY_PITCH.get(input.midi).push(input);
}
// Easiest first: lowest cost, then lower button (L..X), then smaller bends.
for (const list of BY_PITCH.values()) {
  list.sort(
    (a, b) =>
      a.cost - b.cost ||
      BUTTON_ORDER.indexOf(a.button) - BUTTON_ORDER.indexOf(b.button) ||
      Math.abs(a.dpad) + Math.abs(a.stick) - (Math.abs(b.dpad) + Math.abs(b.stick)),
  );
}

/** All ways to play a pitch, easiest first. Empty array if out of range. */
export function allFingerings(midi) {
  return BY_PITCH.get(midi) ?? [];
}

/** The easiest input for a pitch, or null if out of range. */
export function bestFingering(midi) {
  return allFingerings(midi)[0] ?? null;
}

const LABELS = {
  en: { dpad: 'D-pad', stick: 'Stick' },
  zh: { dpad: '十字键', stick: '摇杆' },
};
const ARROW = { '-1': '↓', 1: '↑' };

/** Human-readable text for an input, e.g. "R + Stick ↑". */
export function describe(input, lang = 'en') {
  const l = LABELS[lang] ?? LABELS.en;
  const parts = [input.button];
  if (input.dpad) parts.push(`${l.dpad} ${ARROW[input.dpad]}`);
  if (input.stick) parts.push(`${l.stick} ${ARROW[input.stick]}`);
  return parts.join(' + ');
}

/** Compact text, e.g. "R S↑" (D = D-pad, S = left stick). */
export function describeShort(input) {
  const parts = [input.button];
  if (input.dpad) parts.push(`D${ARROW[input.dpad]}`);
  if (input.stick) parts.push(`S${ARROW[input.stick]}`);
  return parts.join(' ');
}

/** Split a score string into tokens: notes, rests ("r" or "-") and bar lines ("|"). */
export function tokenize(score) {
  return score
    .replace(/\|/g, ' | ')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((t) => {
      if (t === '|') return { type: 'bar' };
      if (t === 'r' || t === 'R' || t === '-') return { type: 'rest' };
      return { type: 'note', source: t, midi: parseNote(t) };
    });
}

function totalCost(midis, shift) {
  return midis.reduce((sum, m) => sum + bestFingering(m + shift).cost, 0);
}

/** Transpositions (in semitones) that keep every pitch inside the range. */
export function fittingShifts(midis) {
  if (midis.length === 0) return [0];
  const lo = RANGE.min - Math.min(...midis);
  const hi = RANGE.max - Math.max(...midis);
  const shifts = [];
  for (let s = lo; s <= hi; s++) shifts.push(s);
  return shifts;
}

/**
 * Pick the transposition that makes the piece easiest to play: lowest total
 * input cost, ties broken by the smallest shift (then the lower one).
 */
export function chooseShift(midis) {
  const shifts = fittingShifts(midis);
  if (shifts.length === 0) return null;
  return shifts.reduce((best, s) => {
    const diff = totalCost(midis, s) - totalCost(midis, best);
    if (diff < 0) return s;
    if (diff > 0) return best;
    return Math.abs(s) < Math.abs(best) || (Math.abs(s) === Math.abs(best) && s < best) ? s : best;
  });
}

/**
 * Convert a score string into ocarina inputs.
 * @param {string} score  e.g. "E5 D5 C5 B4 | A4 G4"
 * @param {{ transpose?: number, auto?: boolean, lang?: 'en'|'zh' }} [options]
 *   transpose: semitones to shift every note (ignored when auto is true)
 *   auto: choose the easiest transposition that fits B3–F5
 */
export function convert(score, { transpose = 0, auto = false, lang = 'en' } = {}) {
  const tokens = tokenize(score);
  const midis = tokens.filter((t) => t.type === 'note').map((t) => t.midi);

  let shift = transpose;
  if (auto) {
    shift = chooseShift(midis);
    if (shift === null) {
      const span = Math.max(...midis) - Math.min(...midis);
      throw new RangeError(
        `The melody spans ${span} semitones, but the ocarina only covers ${RANGE.max - RANGE.min} (B3–F5).`,
      );
    }
  } else {
    const outside = tokens.filter((t) => t.type === 'note' && !bestFingering(t.midi + shift));
    if (outside.length > 0) {
      const names = [...new Set(outside.map((t) => t.source))].join(', ');
      const fits = fittingShifts(midis);
      const hint =
        fits.length > 0
          ? `Try a transposition between ${fits[0]} and ${fits[fits.length - 1]} semitones, or use auto.`
          : 'The melody is wider than the ocarina range, so it cannot be played without changing notes.';
      throw new RangeError(`Out of range (B3–F5) after transposing by ${shift}: ${names}. ${hint}`);
    }
  }

  const events = tokens.map((t) => {
    if (t.type !== 'note') return { type: t.type };
    const midi = t.midi + shift;
    const input = bestFingering(midi);
    return {
      type: 'note',
      source: t.source,
      note: noteName(midi),
      midi,
      ...input,
      text: describe(input, lang),
      short: describeShort(input),
    };
  });

  return { shift, events };
}
