/**
 * Generates the SunnyDay 365 (sunnydaylife.tech) loading animations:
 *
 *   sunnyday-loading.json     v1 — bloom: rings pop outward from the core,
 *                             the wordmark bounces in; the rings breathe in
 *                             an outward ripple on loop.
 *   sunnyday-loading-v2.json  v2 — day & night: the split disk screws in and
 *                             keeps revolving (365 days a year) beneath the
 *                             upright wordmark.
 *   sunnyday-loading-v3.json  v3 — the tagline: the compact logo blooms, then
 *                             "Focus on your works, / Let us deal with
 *                             technology" types on behind a blinking cursor.
 *
 * The logo is rebuilt as vectors: five concentric rings, each a teal half
 * (night) and a gold half (sunny) — colors and radii measured from the
 * official sunnyday-logo.svg's embedded raster. Only the wordmark ("Sunny
 * Day" + teal 365) is a sprite, extracted with its soft shadow by masking
 * away the known ring colors.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop.
 * Transparent background per house rule — the page DOM owns the color.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/sunnyday', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const linear = { o: { x: [0.167], y: [0.167] }, i: { x: [0.833], y: [0.833] } };

const kf = (frames) =>
  frames.map(([t, s, ease, hold], idx) => {
    const isLast = idx === frames.length - 1;
    const k = { t, s: Array.isArray(s) ? s : [s] };
    if (hold) k.h = 1;
    else if (!isLast) {
      const e = ease ?? easeInOut;
      k.o = e.o;
      k.i = e.i;
    }
    return k;
  });

const anim = (frames) => ({ a: 1, k: kf(frames) });
const still = (v) => ({ a: 0, k: v });
const tr = () => ({
  ty: 'tr',
  p: still([0, 0]),
  a: still([0, 0]),
  s: still([100, 100]),
  r: still(0),
  o: still(100),
  sk: still(0),
  sa: still(0),
});
const col = (r, g, b) => [r / 255, g / 255, b / 255, 1];
const R1 = (v) => Math.round(v * 10) / 10;

// measured from the 513×510 source raster (center 256,254.5, edge r=256)
const K = 230 / 256; // source px → comp px at full display size
const RADII = [52.5, 104.5, 164.5, 205.5, 256].map((r) => R1(r * K));
const L_COLS = [
  [192, 224, 232],
  [128, 192, 208],
  [8, 140, 164],
  [16, 120, 144],
  [32, 96, 112],
].map((c) => col(...c));
const R_COLS = [
  [248, 232, 200],
  [248, 216, 152],
  [244, 180, 64],
  [208, 160, 64],
  [152, 120, 56],
].map((c) => col(...c));

// a semicircle half-disk, flat edge on the vertical axis (side -1 left, +1 right)
const halfPath = (r, side) => {
  const k = 0.5523 * r;
  const s = side;
  return {
    c: true,
    v: [[0, -r], [s * r, 0], [0, r]],
    o: [[s * k, 0], [0, k], [0, 0]],
    i: [[0, 0], [0, -k], [s * k, 0]],
  };
};

// wordmark sprites (source-space offsets from the disk center)
const WORDS = { w: 193, h: 102, dx: 3.1, dy: 4.9 };
const T365 = { w: 39, h: 32, dx: 57.0, dy: -31.9 };
const SPR = R1(K * 100); // sprite display scale % (89.8)

const buildRing = (ind, i, side, scaleKs, parent) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm: `ring-${i}-${side < 0 ? 'L' : 'R'}`,
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ...(parent ? { parent } : {}),
  ks: {
    o: still(100),
    r: still(0),
    p: parent ? still([0, 0, 0]) : still([400, 300, 0]),
    a: still([0, 0, 0]),
    s: scaleKs,
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'half',
      it: [
        { ty: 'sh', ks: { a: 0, k: halfPath(RADII[i], side) } },
        { ty: 'fl', c: still(side < 0 ? L_COLS[i] : R_COLS[i]), o: still(100), r: 1 },
        tr(),
      ],
    },
  ],
});

// pop + breathing ripple: rings bloom smallest-first, then breathe in an
// outward phase-cascaded sinusoid on loop (period 120 ⇒ seamless)
const bloomBreath = (i, t0, amp) => {
  const keys = [
    [t0, [0, 0, 100], easeOut],
    [t0 + 8, [106, 106, 100], easeInOut],
    [t0 + 12, [100, 100, 100], easeInOut],
    [80, [100, 100, 100], easeInOut],
  ];
  for (let t = 84; t <= 210; t += 6) {
    const v = R1(100 + amp * Math.sin((2 * Math.PI * (t - 90)) / 120 - i * 0.8));
    keys.push([t, [v, v, 100], linear]);
  }
  return anim(keys);
};

const spritePop = (ind, nm, refId, spr, t0, over, parent) => ({
  ddd: 0,
  ind,
  ty: 2,
  nm,
  refId,
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ...(parent ? { parent } : {}),
  ks: {
    o: anim([
      [t0, 0, linear],
      [t0 + 3, 100],
    ]),
    r: still(0),
    p: parent ? still([spr.dx, spr.dy, 0]) : still([400 + spr.dx, 300 + spr.dy, 0]),
    a: still([spr.w / 2, spr.h / 2, 0]),
    s: anim([
      [t0, [0, 0, 100], easeOut],
      [t0 + 6, [R1(SPR * over), R1(SPR * over), 100], easeInOut],
      [t0 + 11, [SPR, SPR, 100]],
    ]),
  },
});

const baseAssets = () => [
  { id: 'words', w: WORDS.w, h: WORDS.h, u: '', p: `data:image/png;base64,${asset('sunnyday-words.png')}`, e: 1 },
  { id: 't365', w: T365.w, h: T365.h, u: '', p: `data:image/png;base64,${asset('sunnyday-365.png')}`, e: 1 },
];

const doc = (nm, layers, assets) => ({
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm,
  ddd: 0,
  assets,
  layers,
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
});

// --- v1: bloom ---------------------------------------------------------------
const v1Rings = [];
for (let i = 0; i < 5; i++) {
  const ks = bloomBreath(i, 4 + i * 7, 1.8);
  v1Rings.push(buildRing(10 + i * 2, i, -1, ks));
  v1Rings.push(buildRing(11 + i * 2, i, 1, ks));
}
const v1 = doc(
  'SunnyDay — bloom',
  [spritePop(1, 'words', 'words', WORDS, 48, 1.072), spritePop(2, 't365', 't365', T365, 64, 1.12), ...v1Rings],
  baseAssets()
);

// --- v2: day & night --------------------------------------------------------
// The split disk screws in, then revolves forever — 3°/frame, one full turn
// per loop — while the wordmark stays upright on top.
const spinRig = {
  ddd: 0,
  ind: 30,
  ty: 3,
  nm: 'spin-rig',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: still(0),
    r: anim([
      [10, -120, easeOut],
      [44, 0, easeInOut],
      [90, 0, linear],
      [210, 360],
    ]),
    p: still([400, 300, 0]),
    a: still([0, 0, 0]),
    s: anim([
      [10, [0, 0, 100], easeOut],
      [38, [104, 104, 100], easeInOut],
      [46, [100, 100, 100]],
    ]),
  },
};
const v2Rings = [];
for (let i = 0; i < 5; i++) {
  v2Rings.push(buildRing(10 + i * 2, i, -1, still([100, 100, 100]), 30));
  v2Rings.push(buildRing(11 + i * 2, i, 1, still([100, 100, 100]), 30));
}
const v2 = doc(
  'SunnyDay — day & night',
  [spritePop(1, 'words', 'words', WORDS, 56, 1.072), spritePop(2, 't365', 't365', T365, 70, 1.12), ...v2Rings, spinRig],
  baseAssets()
);

// --- v3: the tagline ---------------------------------------------------------
// Compact logo up top, then the company tagline types on behind a cursor:
// "Focus on your works," / "Let us deal with technology".
const logoRig = {
  ddd: 0,
  ind: 31,
  ty: 3,
  nm: 'logo-rig',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: still(0),
    r: still(0),
    p: still([400, 225, 0]),
    a: still([0, 0, 0]),
    s: still([70, 70, 100]),
  },
};
const v3Rings = [];
for (let i = 0; i < 5; i++) {
  const ks = bloomBreath(i, 4 + i * 5, 1.2);
  v3Rings.push(buildRing(10 + i * 2, i, -1, ks, 31));
  v3Rings.push(buildRing(11 + i * 2, i, 1, ks, 31));
}

const TAG1 = { w: 690, h: 81, y: 448, chars: 20 };
const TAG2 = { w: 890, h: 81, y: 505, chars: 27 };
const TAG_S = 50; // display scale %
const tagLayer = (ind, refId, tag, t0, step) => {
  const dispW = (tag.w * TAG_S) / 100;
  const maskKeys = [];
  for (let j = 0; j <= tag.chars; j++) {
    const w = R1(((tag.w + 8) * j) / tag.chars);
    maskKeys.push({
      t: R1(t0 + j * step),
      s: [{ c: true, v: [[-4, -4], [w, -4], [w, tag.h + 4], [-4, tag.h + 4]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]] }],
      h: 1,
    });
  }
  return {
    ddd: 0,
    ind,
    ty: 2,
    nm: refId,
    refId,
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    hasMask: true,
    masksProperties: [{ inv: false, mode: 'a', pt: { a: 1, k: maskKeys }, o: still(100), x: still(0), nm: 'reveal' }],
    ks: {
      o: still(100),
      r: still(0),
      p: still([400, tag.y, 0]),
      a: still([tag.w / 2, tag.h / 2, 0]),
      s: still([TAG_S, TAG_S, 100]),
    },
  };
};

// cursor: steps along with the reveal, then parks and blinks on loop
const cursorPos = [];
const t1x0 = 400 - (TAG1.w * TAG_S) / 200;
const t2x0 = 400 - (TAG2.w * TAG_S) / 200;
for (let j = 0; j <= TAG1.chars; j++) {
  cursorPos.push([R1(46 + j * 1.0), [R1(t1x0 + ((TAG1.w * TAG_S) / 100 / TAG1.chars) * j), TAG1.y, 0], null, true]);
}
for (let j = 0; j <= TAG2.chars; j++) {
  cursorPos.push([R1(68 + j * 0.8), [R1(t2x0 + ((TAG2.w * TAG_S) / 100 / TAG2.chars) * j), TAG2.y, 0], null, true]);
}
const cursor = {
  ddd: 0,
  ind: 3,
  ty: 4,
  nm: 'cursor',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [44, 0, null, true],
      [46, 100, null, true],
      [90, 0, null, true],
      [96, 100, null, true],
      [126, 0, null, true],
      [156, 100, null, true],
      [186, 0, null, true],
      [210, 0],
    ]),
    r: still(0),
    p: anim(cursorPos),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'bar',
      it: [
        { ty: 'rc', d: 1, s: still([4, 34]), p: still([6, 0]), r: still(1.5) },
        { ty: 'fl', c: still(col(240, 96, 0)), o: still(100), r: 1 },
        tr(),
      ],
    },
  ],
};

const v3 = doc(
  'SunnyDay — the tagline',
  [
    spritePop(1, 'words', 'words', WORDS, 36, 1.072, 31),
    spritePop(2, 't365', 't365', T365, 50, 1.12, 31),
    cursor,
    tagLayer(4, 'tag1', TAG1, 46, 1.0),
    tagLayer(5, 'tag2', TAG2, 68, 0.8),
    ...v3Rings,
    logoRig,
  ],
  [
    ...baseAssets(),
    { id: 'tag1', w: TAG1.w, h: TAG1.h, u: '', p: `data:image/png;base64,${asset('sunnyday-tag1.png')}`, e: 1 },
    { id: 'tag2', w: TAG2.w, h: TAG2.h, u: '', p: `data:image/png;base64,${asset('sunnyday-tag2.png')}`, e: 1 },
  ]
);

for (const [name, d] of [
  ['sunnyday-loading.json', v1],
  ['sunnyday-loading-v2.json', v2],
  ['sunnyday-loading-v3.json', v3],
]) {
  const file = join(root, `public/${name}`);
  writeFileSync(file, JSON.stringify(d));
  console.log(`wrote ${file} (${(JSON.stringify(d).length / 1024).toFixed(0)} KB)`);
}
