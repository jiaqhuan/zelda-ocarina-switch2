#!/usr/bin/env node
import fs from 'node:fs';
import { convert, RANGE, noteName } from '../src/ocarina.mjs';

const HELP = `Usage: node bin/score-to-ns2.mjs "<notes>" [options]
       node bin/score-to-ns2.mjs --file melody.txt [options]

Notes are scientific pitch names separated by spaces: C4, F#4, Eb5.
Use "|" for bar lines and "r" for rests.

Options:
  --transpose <n>   Shift every note by n semitones (default 0)
  --auto            Pick the easiest transposition that fits B3–F5
  --lang <en|zh>    Output language (default en)
  --json            Print machine-readable JSON
  --help            Show this help

Example:
  node bin/score-to-ns2.mjs "E5 D5 C5 B4 | A4 G4 A4 B4" --lang zh
`;

function parseArgs(argv) {
  const opts = { transpose: 0, auto: false, lang: 'en', json: false, score: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--auto') opts.auto = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--transpose') opts.transpose = Number(argv[++i]);
    else if (a === '--lang') opts.lang = argv[++i];
    else if (a === '--file') opts.score.push(fs.readFileSync(argv[++i], 'utf8'));
    else opts.score.push(a);
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help || opts.score.length === 0) {
  console.log(HELP);
  process.exit(opts.help ? 0 : 1);
}
if (!Number.isInteger(opts.transpose)) {
  console.error('--transpose must be an integer number of semitones.');
  process.exit(1);
}

try {
  const result = convert(opts.score.join(' '), opts);
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const sign = result.shift >= 0 ? '+' : '';
    const range = `${noteName(RANGE.min)}–${noteName(RANGE.max)}`;
    console.log(
      opts.lang === 'zh'
        ? `移调：${sign}${result.shift} 个半音（音域 ${range}）`
        : `Transpose: ${sign}${result.shift} semitones (range ${range})`,
    );
    console.log('');
    for (const e of result.events) {
      if (e.type === 'bar') console.log('');
      else if (e.type === 'rest') console.log('(rest)');
      else console.log(`${e.note.padEnd(4)} →  ${e.text}`);
    }
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
