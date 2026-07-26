/**
 * Generates public/aquario-loading-v3.json — "from the water sign" variant.
 *
 * Story: the Aquarius glyph ♒ — two zigzag wave ribbons in matrix green —
 * ripples for a beat, then flattens and morphs into the top and bottom bars
 * of the mark (turning white as it goes) while the middle bar fades in
 * between them. The true notched bars take over, AQUARIO types on behind
 * the green cursor, and the loop ripples and blinks like v1.
 *
 * The morph is a real Lottie shape-path interpolation: each ribbon is a
 * closed polygon (zigzag top edge + offset bottom edge, 18 vertices) and the
 * flat bar is the same polygon with amplitude 0 — identical topology, so the
 * vertices slide smoothly.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (ripple + blink, period 60)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/aquario', name)).toString('base64');

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

// v1 lockup layout
const S = 70;
const IMAGES = [
  ['bar1', 143, 33, 169.7, 260.1],
  ['bar2', 143, 34, 169.7, 298.3],
  ['bar3', 143, 33, 169.7, 340.6],
  ['a1', 90, 98, 291.2, 298.3],
  ['q', 99, 96, 362.2, 300.4],
  ['u', 70, 94, 431.9, 301.1],
  ['a2', 90, 98, 496.3, 298.3],
  ['r', 61, 92, 557.5, 300.4],
  ['i', 17, 92, 594.6, 300.4],
  ['o', 95, 96, 646.4, 300.4],
];

const assets = IMAGES.map(([id, w, h]) => ({
  id: `v3-${id}`,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(`${id}.png`)}`,
  e: 1,
}));

const layer = (ind, id, ks, extra = {}) => {
  const [, w, h] = IMAGES.find(([i]) => i === id);
  return {
    ddd: 0,
    ind,
    ty: 2,
    nm: id,
    refId: `v3-${id}`,
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: { a: still([w / 2, h / 2, 0]), ...ks },
    ...extra,
  };
};

// --- zigzag ribbon polygon (18 vertices, corner points) ---------------------
// cx,cy center · w width · A peak amplitude (0 = flat bar) · T thickness
const ribbon = (cx, cy, w, A, T) => {
  const n = 9;
  const top = [];
  const bot = [];
  for (let i = 0; i < n; i++) {
    const x = cx - w / 2 + (w * i) / (n - 1);
    const y = cy + (i % 2 === 0 ? -A : A);
    top.push([x, y - T / 2]);
    bot.unshift([x, y + T / 2]);
  }
  const v = [...top, ...bot];
  return { c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) };
};

const GREEN = [0, 1, 0.255, 1];
const WHITE = [1, 1, 1, 1];
const MX = 169.7;

// ♒ start: two waves stacked at the mark position → morph to bar1/bar3
const zig = (ind, nm, y0, yBar) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm,
  sr: 1,
  ao: 0,
  ip: 0,
  op: 50,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [0, 0, linear],
      [8, 100, easeInOut],
      [44, 100, linear],
      [48, 0],
    ]),
    r: still(0),
    p: still([0, 0, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: `${nm}-g`,
      it: [
        {
          ty: 'sh',
          ks: {
            a: 1,
            k: [
              { t: 8, s: [ribbon(MX, y0, 130, 14, 7)], o: easeInOut.o, i: easeInOut.i },
              { t: 16, s: [ribbon(MX, y0, 130, -14, 7)], o: easeInOut.o, i: easeInOut.i },
              { t: 24, s: [ribbon(MX, y0, 130, 14, 7)], o: easeInOut.o, i: easeInOut.i },
              { t: 44, s: [ribbon(MX, yBar, 100.1, 0, 20.7)] },
            ],
          },
        },
        {
          ty: 'fl',
          c: {
            a: 1,
            k: [
              { t: 24, s: GREEN, o: easeInOut.o, i: easeInOut.i },
              { t: 44, s: WHITE },
            ],
          },
          o: still(100),
          r: 1,
        },
        {
          ty: 'tr',
          p: still([0, 0]),
          a: still([0, 0]),
          s: still([100, 100]),
          r: still(0),
          o: still(100),
          sk: still(0),
          sa: still(0),
        },
      ],
    },
  ],
});

const zigLayers = [zig(11, 'zig-top', 283, 260.1), zig(12, 'zig-bottom', 317, 340.6)];

// --- raster bars: take over from the flat ribbons, ripple in the loop -------
const barLayers = IMAGES.slice(0, 3).map(([id, , , x0, y], i) => {
  const phase = i * 1.05;
  const wave = [];
  for (let t = 90; t <= 210; t += 5) {
    wave.push([t, [x0 + 4 * Math.sin((2 * Math.PI * (t - 90)) / 60 - phase), y, 0], linear]);
  }
  const oIn =
    id === 'bar2'
      ? [
          [34, 0, linear],
          [42, 100],
        ]
      : [
          [44, 0, linear],
          [48, 100],
        ];
  return layer(1 + i, id, {
    o: anim(oIn),
    r: still(0),
    p: anim([[78, [x0, y, 0], easeInOut], ...wave]),
    s: still([S, S, 100]),
  });
});

// --- letters: typewriter ----------------------------------------------------
const letterLayers = IMAGES.slice(3).map(([id, , , x, y], i) => {
  const t0 = 46 + i * 3;
  return layer(4 + i, id, {
    o: anim([
      [0, 0, null, true],
      [t0, 100, null, true],
    ]),
    r: still(0),
    p: still([x, y, 0]),
    s: still([S, S, 100]),
  });
});

// --- cursor: steps with the typing, blinks in the loop ----------------------
const CURSOR_STEPS = [
  [44, 272],
  [46, 341.9],
  [49, 416.1],
  [52, 475.6],
  [55, 547.0],
  [58, 598.1],
  [61, 619.8],
  [64, 700.3],
];
const cursor = {
  ddd: 0,
  ind: 15,
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
      [0, 0, null, true],
      [44, 100, null, true],
      [84, 0, null, true],
      [114, 100, null, true],
      [144, 0, null, true],
      [174, 100, null, true],
      [204, 0, null, true],
      [234, 100, null, true],
    ]),
    r: still(0),
    p: anim(CURSOR_STEPS.map(([t, x]) => [t, [x, 300.4, 0], null, true])),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'cursor-g',
      it: [
        { ty: 'rc', d: 1, s: still([30, 62]), p: still([0, 0]), r: still(2) },
        { ty: 'fl', c: still(GREEN), o: still(100), r: 1 },
        {
          ty: 'tr',
          p: still([0, 0]),
          a: still([0, 0]),
          s: still([100, 100]),
          r: still(0),
          o: still(100),
          sk: still(0),
          sa: still(0),
        },
      ],
    },
  ],
};

// --- background: aq1.co black ----------------------------------------------
const bg = {
  ddd: 0,
  ind: 20,
  ty: 1,
  nm: 'bg',
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([400, 300, 0]),
    a: still([400, 300, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  sw: 800,
  sh: 600,
  sc: '#000000',
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// --- compose ---------------------------------------------------------------
const lottie = {
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm: 'AQUARIO — loading v3 (from the water sign)',
  ddd: 0,
  assets,
  layers: [...zigLayers, ...barLayers, ...letterLayers, cursor, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/aquario-loading-v3.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
