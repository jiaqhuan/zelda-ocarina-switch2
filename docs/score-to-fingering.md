# Score → NS2 fingering: how the converter works

[简体中文](score-to-fingering.zh-CN.md) · [Back to README](../README.md)

The converter turns a melody written as note names into the button inputs for the Ocarina of Time (Switch 2) ocarina. The whole thing is a lookup table plus an optional transposition step. Code: [`src/ocarina.mjs`](../src/ocarina.mjs).

## 1. Input and output

| | |
| --- | --- |
| **Input** | Notes in scientific pitch notation (`C4`, `F#4`, `Eb5`, `F♯4`), `\|` for bar lines, `r` for rests |
| **Options** | `transpose` (semitones) or `auto` (pick the easiest transposition) |
| **Output** | For each note: the button plus an optional D-pad and/or left-stick direction, e.g. `R + Stick ↑` |

```
$ node bin/score-to-ns2.mjs "E5 D5 C5 B4 | A4 G4"
Transpose: +0 semitones (range B3–F5)

E5   →  X + Stick ↑
D5   →  X
C5   →  Y + D-pad ↑
B4   →  Y

A4   →  A
G4   →  R + Stick ↑
```

## 2. The model

Notes are handled as MIDI numbers (C4 = 60), so transposing is just addition.

- Five buttons with fixed base pitches: `L` = D4 (62), `R` = F4 (65), `A` = A4 (69), `Y` = B4 (71), `X` = D5 (74).
- Two modifiers: D-pad ↑/↓ = ±1 semitone, left stick ↑/↓ = ±2 semitones.

```
pitch = base(button) + dpad + 2 × stick        dpad, stick ∈ {−1, 0, +1}
```

Enumerating 5 buttons × 3 × 3 gives **45 inputs** that land on **19 pitches** (59–77, B3–F5). That table is built once at load time, so nothing about the ocarina is hard-coded except the five base pitches and the range. See the [technical analysis](technical-analysis.md#3-the-math-45-inputs-19-pitches) for why the range has no gaps.

## 3. Choosing the easiest input

Most pitches have several inputs, so we rank them by a cost:

| Rule | Cost |
| --- | --- |
| Each D-pad press | 1 |
| Each stick tilt | 1.5 (the stick is less precise than the D-pad) |
| Tie on cost | prefer the lower button (L, R, A, Y, X), then the smaller total bend |

The cheapest input wins. This reproduces the "easiest input" column of the published fingering chart for all 19 pitches, and a unit test checks that, so the rule and the chart can't drift apart.

## 4. Pipeline

```
"E5 D5 | C5"
   │ tokenize        notes / bar lines / rests
   ▼
parseNote            "F#4" → 66        (sharps, flats, ♯ ♭)
   │
   ▼
transposition        none, fixed shift, or auto
   │
   ▼
bestFingering        MIDI → { button, dpad, stick }
   │
   ▼
describe             "R + Stick ↑"  (en / zh)  and short form "R S↑"
```

## 5. Transposition

The ocarina covers 59–77. For a melody with lowest note `lo` and highest note `hi`, the shifts that keep everything playable are exactly:

```
59 − lo  ≤  shift  ≤  77 − hi
```

- **No shift fits** (the window is empty) when the melody spans more than 18 semitones. The converter reports the span and stops. It never silently changes notes.
- **`transpose` given:** if any note ends up outside the range, the error lists those notes and the valid shift window.
- **`auto`:** among the fitting shifts, pick the one with the lowest total input cost, breaking ties by the smallest absolute shift. For the opening of Pachelbel's Canon (D major, starts on F♯5, one semitone too high) the fitting shifts are −10 to −1, and `auto` picks **−2** (C major) with the lowest total cost.

## 6. Edge cases

- Enharmonic spellings (`C#4` / `Db4`) map to the same MIDI number and get the same input.
- Output note names always use sharps (`F♯4`).
- Rests and bar lines pass through untouched, so the output lines up with the input.
- Octaves follow the game's written pitch (L = D4 … X = D5); see the [README](../README.md#sources-and-credits) for the caveat.

## 7. Not covered yet

Kept out on purpose so the first version stays simple:

- **Musical choice of key.** `auto` looks only at input cost, so for a short phrase it can pick a transposition with accidentals (e.g. −2 on `E5 D5 C5 B4 A4 G4` lands on A♯4 and F4). A future option could prefer shifts that keep the original key's character.
- **Rhythm and key signatures.** Input is a plain note list, and accidentals must be written on every note.
- **Hand-movement awareness.** Each note picks its own cheapest input. A smarter pass could consider the previous note, for example the `E5 → D5 → C5` run on `X` using only the stick.
- **Other input formats:** numbered notation (简谱), ABC, MusicXML, MIDI. (Images are supported, see section 9.)
- **A web UI** that runs this module in the browser.

## 8. Usage

```bash
# CLI
node bin/score-to-ns2.mjs "C4 D4 E4 F4 G4 A4 B4 C5"
node bin/score-to-ns2.mjs "F#5 E5 D5 C#5" --auto --lang zh
node bin/score-to-ns2.mjs --file melody.txt --transpose -2 --json

# Library
import { convert } from './src/ocarina.mjs';
const { shift, events } = convert('E5 D5 C5', { auto: true });
```

Run the tests with `npm test` (Node.js 18+, no dependencies).

## 9. Image input (vision API)

`--image` reads a sheet-music image, asks a vision model to transcribe it into the text format above, then runs the normal pipeline. Code: [`src/vision.mjs`](../src/vision.mjs).

```
image ──► vision API ──► "E5 D5 C5 B4 | A4 G4" ──► tokenize / convert (sections 4–5)
              ▲                                        │
        fixed prompt: top staff only,             printed first so you can
        explicit accidentals, ? if unreadable     check it against the image
```

```bash
export OCARINA_VISION_API_KEY=...            # never commit this
node bin/score-to-ns2.mjs --image score.png --auto
node bin/score-to-ns2.mjs --image score.png --notes-only   # just print the recognized notes
```

| Setting | Default |
| --- | --- |
| `OCARINA_VISION_API_KEY` | falls back to `OPENAI_API_KEY` |
| `OCARINA_VISION_BASE_URL` | `https://api.openai.com/v1` (any OpenAI-compatible chat-completions endpoint that accepts images) |
| `OCARINA_VISION_MODEL` | `gpt-4o` |

Things to know:

- **Recognition is the weak link.** General vision models misread key signatures, accidentals and octaves from time to time. The recognized notes are always printed before the fingerings (to stderr, so `--json` output stays clean). Check them, and if something is wrong, fix the text and run again without `--image`.
- The prompt asks for explicit accidentals and for `?` where a note can't be read. A `?` makes the run stop and show the recognized text, instead of guessing.
- The image is sent to whichever API you configure. Don't use it for images you can't share with that provider.
- Only the top staff's melody is read. Rhythm, chords and lyrics are ignored.
- The tests use a mocked HTTP call, so they never need a key or the network.
- For higher accuracy later, a dedicated optical music recognition engine (for example Audiveris, which outputs MusicXML) could replace the vision model. The rest of the pipeline stays the same once the notes are in text form.
