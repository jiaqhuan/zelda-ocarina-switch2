import fs from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2];
fs.mkdirSync(outDir, { recursive: true });

const COLORS = { L: '#d97706', R: '#059669', A: '#2563eb', Y: '#9333ea', X: '#dc2626' };
const PITCH = { L: 'D4', R: 'F4', A: 'A4', Y: 'B4', X: 'D5' };
const FONT = `font-family="'Segoe UI','Microsoft YaHei','PingFang SC',system-ui,sans-serif"`;

const T = {
  en: {
    title: 'Ocarina of Time on Switch 2 — note buttons and pitch modifiers',
    stick: 'LEFT STICK',
    stickUp: '↑  +2 semitones',
    stickDown: '↓  −2 semitones',
    dpad: 'D-PAD',
    dpadUp: '↑  +1 semitone',
    dpadDown: '↓  −1 semitone',
    tip1: 'Hold the modifier first,',
    tip2: 'then press a note button.',
    tip3: 'Stack both: up to ±3 semitones.',
    legend: 'Natural notes:',
    chartTitle: 'All 19 pitches, B3–F5 — easiest input for each',
    chartLegend: 'D = D-pad ↑/↓ (±1)  ·  S = left stick ↑/↓ (±2)  ·  Bold outline = natural note (used to recognize songs)',
    chartButton: 'button · semitone offset · modifier',
  },
  zh: {
    title: '《时之笛》Switch 2：音符键与音高修饰',
    stick: '左摇杆',
    stickUp: '↑  升 2 个半音',
    stickDown: '↓  降 2 个半音',
    dpad: '十字键',
    dpadUp: '↑  升 1 个半音',
    dpadDown: '↓  降 1 个半音',
    tip1: '先按住修饰方向，',
    tip2: '再按音符键。',
    tip3: '两者叠加：最多 ±3 个半音。',
    legend: '自然音：',
    chartTitle: '全部 19 个音（B3–F5）——每个音的最简输入',
    chartLegend: 'D = 十字键 ↑/↓（±1）  ·  S = 左摇杆 ↑/↓（±2）  ·  粗框 = 自然音（游戏识别歌曲只认这 5 个）',
    chartButton: '按键 · 半音偏移 · 修饰操作',
  },
};

function controller(t) {
  const note = (cx, cy, k, r = 22) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${COLORS[k]}" stroke="#fff" stroke-width="2"/>
  <text x="${cx}" y="${cy - 1}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" ${FONT}>${k}</text>
  <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="10" font-weight="600" fill="#fff" ${FONT}>${PITCH[k]}</text>`;
  const shoulder = (x, k) => `
  <rect x="${x}" y="125" width="130" height="38" rx="16" fill="${COLORS[k]}"/>
  <text x="${x + 65}" y="150" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" ${FONT}>${k} · ${PITCH[k]}</text>`;
  const chips = Object.keys(COLORS)
    .map((k, i) => {
      const x = 250 + i * 110;
      return `<rect x="${x}" y="545" width="96" height="30" rx="15" fill="${COLORS[k]}"/>
  <text x="${x + 48}" y="565" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" ${FONT}>${k} = ${PITCH[k]}</text>`;
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 600" role="img" aria-label="${t.title}">
  <title>${t.title}</title>
  <rect width="880" height="600" rx="18" fill="#ffffff"/>
  <text x="440" y="48" text-anchor="middle" font-size="22" font-weight="700" fill="#111827" ${FONT}>${t.title}</text>

  <defs>
    <g id="body">
      <rect x="200" y="170" width="480" height="200" rx="70"/>
      <rect x="190" y="270" width="130" height="230" rx="65"/>
      <rect x="560" y="270" width="130" height="230" rx="65"/>
    </g>
  </defs>
  <use href="#body" fill="#e5e7eb" stroke="#6b7280" stroke-width="6"/>
  <use href="#body" fill="#e5e7eb" stroke="none"/>

  ${shoulder(210, 'L')}
  ${shoulder(540, 'R')}

  <!-- left stick (modifier) -->
  <circle cx="275" cy="225" r="36" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/>
  <circle cx="275" cy="225" r="22" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2"/>
  <text x="275" y="196" text-anchor="middle" font-size="13" fill="#1d4ed8" ${FONT}>▲</text>
  <text x="275" y="261" text-anchor="middle" font-size="13" fill="#1d4ed8" ${FONT}>▼</text>

  <!-- d-pad (modifier) -->
  <g fill="#dbeafe" stroke="#1d4ed8" stroke-width="3" stroke-linejoin="round">
    <rect x="334" y="282" width="22" height="66" rx="4"/>
    <rect x="312" y="304" width="66" height="22" rx="4"/>
  </g>
  <rect x="335" y="305" width="20" height="20" fill="#dbeafe"/>
  <text x="345" y="299" text-anchor="middle" font-size="11" fill="#1d4ed8" ${FONT}>▲</text>
  <text x="345" y="343" text-anchor="middle" font-size="11" fill="#1d4ed8" ${FONT}>▼</text>

  <!-- right stick (unused) -->
  <circle cx="535" cy="315" r="30" fill="#d1d5db" stroke="#9ca3af" stroke-width="2"/>
  <circle cx="535" cy="315" r="19" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>

  <!-- face buttons -->
  ${note(605, 205, 'X')}
  ${note(561, 249, 'Y')}
  ${note(649, 249, 'A')}
  <circle cx="605" cy="293" r="22" fill="#9ca3af" stroke="#fff" stroke-width="2"/>
  <text x="605" y="299" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" ${FONT}>B</text>

  <!-- callouts -->
  <g stroke="#1d4ed8" stroke-width="2" fill="none">
    <line x1="182" y1="225" x2="236" y2="225"/>
    <line x1="182" y1="330" x2="308" y2="316"/>
  </g>
  <text x="40" y="190" font-size="15" font-weight="700" fill="#1d4ed8" ${FONT}>${t.stick}</text>
  <text x="40" y="214" font-size="14" fill="#111827" ${FONT}>${t.stickUp}</text>
  <text x="40" y="238" font-size="14" fill="#111827" ${FONT}>${t.stickDown}</text>
  <text x="40" y="320" font-size="15" font-weight="700" fill="#1d4ed8" ${FONT}>${t.dpad}</text>
  <text x="40" y="344" font-size="14" fill="#111827" ${FONT}>${t.dpadUp}</text>
  <text x="40" y="368" font-size="14" fill="#111827" ${FONT}>${t.dpadDown}</text>

  <text x="440" y="420" text-anchor="middle" font-size="14" fill="#111827" ${FONT}>${t.tip1}</text>
  <text x="440" y="440" text-anchor="middle" font-size="14" fill="#111827" ${FONT}>${t.tip2}</text>
  <text x="440" y="468" text-anchor="middle" font-size="14" font-weight="700" fill="#b45309" ${FONT}>${t.tip3}</text>

  <text x="240" y="565" text-anchor="end" font-size="14" font-weight="600" fill="#374151" ${FONT}>${t.legend}</text>
  ${chips}
</svg>
`;
}

const ROWS = [
  ['B3', 'L', '−3', 'D↓S↓'],
  ['C4', 'L', '−2', 'S↓'],
  ['C♯4', 'L', '−1', 'D↓'],
  ['D4', 'L', '0', ''],
  ['D♯4', 'L', '+1', 'D↑'],
  ['E4', 'R', '−1', 'D↓'],
  ['F4', 'R', '0', ''],
  ['F♯4', 'R', '+1', 'D↑'],
  ['G4', 'R', '+2', 'S↑'],
  ['G♯4', 'A', '−1', 'D↓'],
  ['A4', 'A', '0', ''],
  ['A♯4', 'A', '+1', 'D↑'],
  ['B4', 'Y', '0', ''],
  ['C5', 'Y', '+1', 'D↑'],
  ['C♯5', 'X', '−1', 'D↓'],
  ['D5', 'X', '0', ''],
  ['D♯5', 'X', '+1', 'D↑'],
  ['E5', 'X', '+2', 'S↑'],
  ['F5', 'X', '+3', 'D↑S↑'],
];

function chart(t) {
  const x0 = 22;
  const w = 44;
  const cells = ROWS.map(([pitch, k, off, mod], i) => {
    const x = x0 + i * w;
    const natural = ['D4', 'F4', 'A4', 'B4', 'D5'].includes(pitch);
    const sharp = pitch.includes('♯');
    return `
  <text x="${x + w / 2}" y="${natural ? 98 : 100}" text-anchor="middle" font-size="${natural ? 15 : 13}" font-weight="${natural ? 800 : 500}" fill="#111827" ${FONT}>${pitch}</text>
  <rect x="${x + 2}" y="112" width="${w - 4}" height="118" rx="8" fill="${COLORS[k]}" fill-opacity="${sharp ? 0.55 : 0.95}" stroke="${natural ? '#111827' : 'none'}" stroke-width="3"/>
  <text x="${x + w / 2}" y="152" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" ${FONT}>${k}</text>
  <text x="${x + w / 2}" y="180" text-anchor="middle" font-size="15" font-weight="600" fill="#fff" ${FONT}>${off}</text>
  <text x="${x + w / 2}" y="210" text-anchor="middle" font-size="12" font-weight="600" fill="#fff" ${FONT}>${mod}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 300" role="img" aria-label="${t.chartTitle}">
  <title>${t.chartTitle}</title>
  <rect width="880" height="300" rx="18" fill="#ffffff"/>
  <text x="440" y="48" text-anchor="middle" font-size="20" font-weight="700" fill="#111827" ${FONT}>${t.chartTitle}</text>
  <text x="440" y="74" text-anchor="middle" font-size="12" fill="#6b7280" ${FONT}>${t.chartButton}</text>
  ${cells}
  <text x="440" y="270" text-anchor="middle" font-size="12.5" fill="#374151" ${FONT}>${t.chartLegend}</text>
</svg>
`;
}

const L10N = {
  en: { stick: 'Stick', dpad: 'D-pad', none: 'no modifier', scale: 'C major scale on the ocarina', canon: "Pachelbel's Canon — opening phrase (transposed to C)", step: 'Steps' },
  zh: { stick: '摇杆', dpad: '十字键', none: '无修饰', scale: 'C 大调音阶指法', canon: '《卡农》开头乐句（移到 C 大调）', step: '顺序' },
};

// cards: [label, button, modKind ('S'|'D'|null), dir ('↑'|'↓'|null)]
function cardSheet(title, cards, cols, l) {
  const cw = 96;
  const gap = 10;
  const rows = Math.ceil(cards.length / cols);
  const width = 880;
  const x0 = (width - (cols * cw + (cols - 1) * gap)) / 2;
  const ch = 150;
  const height = 90 + rows * (ch + gap) + 20;
  const body = cards
    .map(([name, k, kind, dir], i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = x0 + c * (cw + gap);
      const y = 80 + r * (ch + gap);
      const cx = x + cw / 2;
      const mod = kind
        ? `<rect x="${x + 10}" y="${y + 104}" width="${cw - 20}" height="28" rx="14" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.5"/>
  <text x="${cx}" y="${y + 123}" text-anchor="middle" font-size="13" font-weight="700" fill="#1d4ed8" ${FONT}>${kind === 'S' ? l.stick : l.dpad} ${dir}</text>`
        : `<text x="${cx}" y="${y + 123}" text-anchor="middle" font-size="12" fill="#9ca3af" ${FONT}>${l.none}</text>`;
      return `
  <rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="14" fill="#f9fafb" stroke="#e5e7eb" stroke-width="2"/>
  <text x="${x + 9}" y="${y + 20}" font-size="11" fill="#9ca3af" ${FONT}>${i + 1}</text>
  <text x="${cx}" y="${y + 34}" text-anchor="middle" font-size="19" font-weight="800" fill="#111827" ${FONT}>${name}</text>
  <circle cx="${cx}" cy="${y + 72}" r="26" fill="${COLORS[k]}"/>
  <text x="${cx}" y="${y + 80}" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" ${FONT}>${k}</text>
  ${mod}`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
  <title>${title}</title>
  <rect width="${width}" height="${height}" rx="18" fill="#ffffff"/>
  <text x="${width / 2}" y="46" text-anchor="middle" font-size="21" font-weight="700" fill="#111827" ${FONT}>${title}</text>
  ${body}
</svg>
`;
}

const SCALE = [
  ['C4', 'L', 'S', '↓'], ['D4', 'L', null, null], ['E4', 'R', 'D', '↓'], ['F4', 'R', null, null],
  ['G4', 'R', 'S', '↑'], ['A4', 'A', null, null], ['B4', 'Y', null, null], ['C5', 'Y', 'D', '↑'],
];
const CANON = [
  ['E5', 'X', 'S', '↑'], ['D5', 'X', null, null], ['C5', 'Y', 'D', '↑'], ['B4', 'Y', null, null], ['A4', 'A', null, null], ['G4', 'R', 'S', '↑'],
  ['A4', 'A', null, null], ['B4', 'Y', null, null], ['C5', 'Y', 'D', '↑'], ['B4', 'Y', null, null], ['A4', 'A', null, null], ['G4', 'R', 'S', '↑'],
];

const STAFF_Y = { E4: 170, F4: 160, G4: 150, A4: 140, B4: 130, C5: 120, D5: 110, E5: 100 };
const STAFF_NOTES = [
  ['E5', 'X S↑', 'X'], ['D5', 'X', 'X'], ['C5', 'Y D↑', 'Y'], ['B4', 'Y', 'Y'],
  ['A4', 'A', 'A'], ['G4', 'R S↑', 'R'], ['A4', 'A', 'A'], ['B4', 'Y', 'Y'],
  ['C5', 'Y D↑', 'Y'], ['B4', 'Y', 'Y'], ['A4', 'A', 'A'], ['G4', 'R S↑', 'R'],
];
const STAFF_L10N = {
  en: { title: "Pachelbel's Canon — opening phrase (C major, 4/4)", legend: 'Letters are the ocarina buttons · S = left stick · D = D-pad' },
  zh: { title: '《卡农》开头乐句五线谱（C 大调，4/4）', legend: '字母为陶笛按键 · S = 左摇杆 · D = 十字键' },
};

function staff(l) {
  const lines = [90, 110, 130, 150, 170].map((y) => `<line x1="60" y1="${y}" x2="838" y2="${y}" stroke="#374151" stroke-width="1.5"/>`).join('\n  ');
  const bars = [160, 386, 612, 838];
  const barLines = bars.slice(1).map((x, i) => `<line x1="${x}" y1="90" x2="${x}" y2="170" stroke="#374151" stroke-width="${i === 2 ? 3 : 1.5}"/>`).join('\n  ');
  const notes = STAFF_NOTES.map(([name, fing, k], i) => {
    const bar = Math.floor(i / 4);
    const x = bars[bar] + 36 + (i % 4) * 52;
    const y = STAFF_Y[name];
    const up = y > 130;
    const stem = up
      ? `<line x1="${x + 7.5}" y1="${y}" x2="${x + 7.5}" y2="${y - 36}" stroke="#111827" stroke-width="1.8"/>`
      : `<line x1="${x - 7.5}" y1="${y}" x2="${x - 7.5}" y2="${y + 36}" stroke="#111827" stroke-width="1.8"/>`;
    return `
  <ellipse cx="${x}" cy="${y}" rx="9" ry="6.5" transform="rotate(-20 ${x} ${y})" fill="#111827"/>
  ${stem}
  <text x="${x}" y="215" text-anchor="middle" font-size="15" font-weight="700" fill="#111827" ${FONT}>${name}</text>
  <text x="${x}" y="240" text-anchor="middle" font-size="14" font-weight="700" fill="${COLORS[k]}" ${FONT}>${fing}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 300" role="img" aria-label="${l.title}">
  <title>${l.title}</title>
  <rect width="880" height="300" rx="18" fill="#ffffff"/>
  <text x="440" y="46" text-anchor="middle" font-size="20" font-weight="700" fill="#111827" ${FONT}>${l.title}</text>
  ${lines}
  ${barLines}
  <line x1="60" y1="90" x2="60" y2="170" stroke="#374151" stroke-width="1.5"/>
  <text x="68" y="168" font-size="74" fill="#111827" font-family="'Noto Music','Segoe UI Symbol','Apple Symbols',serif">𝄞</text>
  <text x="128" y="122" text-anchor="middle" font-size="30" font-weight="700" fill="#111827" ${FONT}>4</text>
  <text x="128" y="162" text-anchor="middle" font-size="30" font-weight="700" fill="#111827" ${FONT}>4</text>
  ${notes}
  <text x="440" y="280" text-anchor="middle" font-size="12.5" fill="#6b7280" ${FONT}>${l.legend}</text>
</svg>
`;
}

for (const lang of ['en', 'zh']) {
  fs.writeFileSync(path.join(outDir, `canon-staff-${lang}.svg`), staff(STAFF_L10N[lang]));
  fs.writeFileSync(path.join(outDir, `controller-${lang}.svg`), controller(T[lang]));
  fs.writeFileSync(path.join(outDir, `pitch-chart-${lang}.svg`), chart(T[lang]));
  fs.writeFileSync(path.join(outDir, `scale-c-major-${lang}.svg`), cardSheet(L10N[lang].scale, SCALE, 8, L10N[lang]));
  fs.writeFileSync(path.join(outDir, `canon-opening-${lang}.svg`), cardSheet(L10N[lang].canon, CANON, 6, L10N[lang]));
}
console.log('done');

