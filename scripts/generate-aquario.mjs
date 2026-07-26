/**
 * Generates public/aquario-loading.json — AQUARIO "type on" loading animation.
 *
 * Story: the three notched bars of the mark slide in stacked, then AQUARIO
 * types on letter by letter behind a matrix-green cursor block — terminal
 * style, matching aq1.co's black/green aesthetic. In the loop the cursor
 * keeps blinking and the bars ripple in a gentle cascade, like water.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (blink period 60, ripple period 60)
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

const S = 70; // logo renders at 70% of source pixels

// [id, w, h, compX, compY]
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

const assets = [
  ...IMAGES.map(([id, w, h]) => ({
    id,
    w,
    h,
    u: '',
    p: `data:image/png;base64,${asset(`${id}.png`)}`,
    e: 1,
  })),
  // ocean-water photo from aq1.co (assets/images/tale.jpg), 4:3 center crop
  {
    id: 'tale',
    w: 1000,
    h: 750,
    u: '',
    p: `data:image/jpeg;base64,${asset('tale-bg.jpg')}`,
    e: 1,
  },
];

const layer = (ind, refId, ks, extra = {}) => {
  const [, w, h] = IMAGES.find(([i]) => i === refId);
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
    ks: { a: still([w / 2, h / 2, 0]), ...ks },
    ...extra,
  };
};

// --- bars: slide in stacked, then ripple like water in the loop -------------
const barLayers = IMAGES.slice(0, 3).map(([id, , , x0, y], i) => {
  const t0 = 4 + i * 4;
  const phase = i * 1.05;
  const wave = [];
  for (let t = 90; t <= 210; t += 5) {
    wave.push([t, [x0 + 4 * Math.sin((2 * Math.PI * (t - 90)) / 60 - phase), y, 0], linear]);
  }
  wave[wave.length - 1] = [210, wave[wave.length - 1][1]];
  return layer(1 + i, id, {
    o: anim([
      [t0, 0, linear],
      [t0 + 4, 100],
    ]),
    r: still(0),
    p: anim([
      [t0, [x0 - 50, y, 0], easeOut],
      [t0 + 12, [x0, y, 0], easeInOut],
      [78, [x0, y, 0], easeInOut],
      ...wave,
    ]),
    s: still([S, S, 100]),
  });
});

// --- letters: typewriter — each appears instantly on its beat ---------------
const letterLayers = IMAGES.slice(3).map(([id, , , x, y], i) => {
  const t0 = 24 + i * 4;
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

// --- cursor: green block steps along as letters type, blinks in the loop ----
// x = right edge of the last typed letter + half a step
const CURSOR_STEPS = [
  [22, 272],
  [24, 341.9],
  [28, 416.1],
  [32, 475.6],
  [36, 547.0],
  [40, 598.1],
  [44, 619.8],
  [48, 700.3],
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
      [22, 100, null, true],
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
        { ty: 'fl', c: still([0, 1, 0.255, 1]), o: still(100), r: 1 },
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

// --- background: the aq1.co ocean photo, covering the comp ------------------
const bg = {
  ddd: 0,
  ind: 20,
  ty: 2,
  nm: 'bg',
  refId: 'tale',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: still(100),
    r: still(0),
    p: still([400, 300, 0]),
    a: still([500, 375, 0]),
    s: still([80, 80, 100]),
  },
};

// --- compose ---------------------------------------------------------------
const lottie = {
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm: 'AQUARIO — loading (type on)',
  ddd: 0,
  assets,
  layers: [...barLayers, ...letterLayers, cursor, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/aquario-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
