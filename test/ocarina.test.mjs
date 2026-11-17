import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RANGE,
  allFingerings,
  bestFingering,
  chooseShift,
  convert,
  describeShort,
  noteName,
  parseNote,
} from '../src/ocarina.mjs';

// Easiest input per pitch, as published in docs/technical-analysis.md (section 4).
const CHART = {
  B3: 'L D↓ S↓',
  C4: 'L S↓',
  'C♯4': 'L D↓',
  D4: 'L',
  'D♯4': 'L D↑',
  E4: 'R D↓',
  F4: 'R',
  'F♯4': 'R D↑',
  G4: 'R S↑',
  'G♯4': 'A D↓',
  A4: 'A',
  'A♯4': 'A D↑',
  B4: 'Y',
  C5: 'Y D↑',
  'C♯5': 'X D↓',
  D5: 'X',
  'D♯5': 'X D↑',
  E5: 'X S↑',
  F5: 'X D↑ S↑',
};

test('parseNote handles sharps, flats and Unicode accidentals', () => {
  assert.equal(parseNote('C4'), 60);
  assert.equal(parseNote('F#4'), 66);
  assert.equal(parseNote('F♯4'), 66);
  assert.equal(parseNote('Eb5'), 75);
  assert.equal(parseNote('b3'), 59);
  assert.throws(() => parseNote('H4'), SyntaxError);
  assert.equal(noteName(66), 'F♯4');
});

test('45 inputs cover exactly 19 pitches, B3 to F5', () => {
  let inputs = 0;
  let pitches = 0;
  for (let m = RANGE.min - 5; m <= RANGE.max + 5; m++) {
    const list = allFingerings(m);
    inputs += list.length;
    if (list.length) pitches++;
  }
  assert.equal(inputs, 45);
  assert.equal(pitches, 19);
  assert.equal(allFingerings(RANGE.min - 1).length, 0);
  assert.equal(allFingerings(RANGE.max + 1).length, 0);
});

test('easiest input per pitch matches the published chart', () => {
  for (let m = RANGE.min; m <= RANGE.max; m++) {
    assert.equal(describeShort(bestFingering(m)), CHART[noteName(m)], noteName(m));
  }
});

test('convert: C major scale', () => {
  const { shift, events } = convert('C4 D4 E4 F4 G4 A4 B4 C5');
  assert.equal(shift, 0);
  assert.deepEqual(
    events.map((e) => e.short),
    ['L S↓', 'L', 'R D↓', 'R', 'R S↑', 'A', 'Y', 'Y D↑'],
  );
});

test('convert: Canon opening in C major (as used in the article)', () => {
  const { events } = convert('E5 D5 C5 B4 | A4 G4 A4 B4 | C5 B4 A4 G4', { lang: 'zh' });
  const notes = events.filter((e) => e.type === 'note');
  assert.deepEqual(
    notes.map((e) => e.short),
    ['X S↑', 'X', 'Y D↑', 'Y', 'A', 'R S↑', 'A', 'Y', 'Y D↑', 'Y', 'A', 'R S↑'],
  );
  assert.equal(notes[0].text, 'X + 摇杆 ↑');
  assert.equal(events.filter((e) => e.type === 'bar').length, 2);
});

test('convert: out of range without transposing gives a helpful error', () => {
  // Canon in D opens on F♯5, one semitone above the ocarina's top note.
  assert.throws(() => convert('F#5 E5 D5 C#5 B4 A4'), /Out of range.*F#5.*between -?\d+ and -?\d+/s);
});

test('convert: explicit transposition and auto transposition both fit the range', () => {
  const canonD = 'F#5 E5 D5 C#5 B4 A4 B4 C#5 | D5 C#5 B4 A4';
  const manual = convert(canonD, { transpose: -2 });
  assert.equal(manual.events[0].note, 'E5');
  const auto = convert(canonD, { auto: true });
  for (const e of auto.events.filter((x) => x.type === 'note')) {
    assert.ok(e.midi >= RANGE.min && e.midi <= RANGE.max);
  }
  assert.ok(auto.shift <= -1);
});

test('chooseShift returns null when the melody is wider than 18 semitones', () => {
  assert.equal(chooseShift([parseNote('A3'), parseNote('G5')]), null);
  assert.throws(() => convert('A3 G5', { auto: true }), /spans 22 semitones/);
});

test('rests and bar lines pass through untouched', () => {
  const { events } = convert('D4 r | F4');
  assert.deepEqual(events.map((e) => e.type), ['note', 'rest', 'bar', 'note']);
});
