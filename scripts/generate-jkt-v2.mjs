/**
 * Generates public/jkt-loading-v2.json — the vertical lockup: the artwork
 * on top, จุดกางเต็นท์ and CAMPSITE THAILAND centered beneath it.
 *
 * Story: the terrain fades up — mountains, snow cap, and the pitched tent —
 * then the sun rises slowly from behind the ridge into its place. The Thai
 * wordmark จุดกางเต็นท์ pops in glyph by glyph and CAMPSITE THAILAND fades
 * beneath. In the loop everything rests except the sun, which breathes.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/jkt', name)).toString('base64');
const FILE = { mark: 'mark-solid.png' };

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const linear = { o: { x: [0.167], y: [0.167] }, i: { x: [0.833], y: [0.833] } };

const kf = (frames) =>
  frames.map(([t, s, ease], idx) => {
    const isLast = idx === frames.length - 1;
    const k = { t, s: Array.isArray(s) ? s : [s] };
    if (!isLast) {
      const e = ease ?? easeInOut;
      k.o = e.o;
      k.i = e.i;
    }
    return k;
  });

const anim = (frames) => ({ a: 1, k: kf(frames) });
const still = (v) => ({ a: 0, k: v });

const SA = 90; // artwork
const S = 66; // text

// [id, w, h, compX, compY]
const IMAGES = [
  ['mark', 395, 202, 400.0, 257.0],
  ['sun', 209, 149, 420.3, 178.7],
  ['t1', 58, 96, 225.1, 423.4],
  ['t2', 63, 67, 270.0, 413.8],
  ['t3', 61, 66, 318.2, 413.5],
  ['t4', 43, 66, 358.1, 413.5],
  ['t5', 63, 65, 396.7, 413.5],
  ['t6', 30, 65, 435.0, 414.1],
  ['t7', 65, 101, 470.6, 402.3],
  ['t8', 61, 65, 520.1, 414.1],
  ['t9', 66, 92, 571.9, 404.6],
  ['tagline', 430, 32, 400.0, 470.0],
];

const assets = IMAGES.map(([id, w, h]) => ({
  id: `jkt-${id}`,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(FILE[id] ?? `${id}.png`)}`,
  e: 1,
}));

const layer = (ind, id, ks, extra = {}) => {
  const [, w, h] = IMAGES.find(([i]) => i === id);
  return {
    ddd: 0,
    ind,
    ty: 2,
    nm: id,
    refId: `jkt-${id}`,
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

// --- terrain: mountains + tent fade up ---------------------------------------
const mark = layer(1, 'mark', {
  o: anim([
    [2, 0, linear],
    [10, 100],
  ]),
  r: still(0),
  p: anim([
    [2, [400.0, 287.0, 0], easeOut],
    [16, [400.0, 257.0, 0]],
  ]),
  s: still([SA, SA, 100]),
});

// --- the sun: rises from behind the ridge, breathes in the loop --------------
const sun = layer(2, 'sun', {
  o: anim([
    [46, 0, linear],
    [50, 100],
  ]),
  r: still(0),
  p: still([420.3, 178.7, 0]),
  s: anim([
    [90, [SA, SA, 100], easeInOut],
    [150, [SA * 1.03, SA * 1.03, 100], easeInOut],
    [210, [SA, SA, 100]],
  ]),
});

// the rising sun is a FULL circle (the official bite only exists at rest);
// the mark's baked-white interiors occlude it as it climbs the ridge
const sunFull = {
  ddd: 0,
  ind: 15,
  ty: 4,
  nm: 'sun-full',
  sr: 1,
  ao: 0,
  ip: 0,
  op: 60,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [14, 0, linear],
      [18, 100, linear],
      [46, 100, linear],
      [50, 0],
    ]),
    r: still(0),
    p: anim([
      [14, [420.3, 322, 0], easeInOut],
      [46, [420.3, 205.7, 0]],
    ]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'sun-full-g',
      it: [
        { ty: 'el', d: 1, s: still([185, 185]), p: still([0, 0]) },
        { ty: 'fl', c: still([0.173, 0.318, 0.02, 1]), o: still(100), r: 1 },
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

// --- Thai wordmark: จุดกางเต็นท์ pops in glyph by glyph ----------------------
const thaiLayers = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'].map((id, i) => {
  const [, , , x, y] = IMAGES.find(([n]) => n === id);
  const t0 = 34 + i * 4;
  return layer(3 + i, id, {
    o: anim([
      [t0, 0, linear],
      [t0 + 4, 100],
    ]),
    r: still(0),
    p: still([x, y, 0]),
    s: anim([
      [t0, [0, 0, 100], easeOut],
      [t0 + 6, [S * 1.12, S * 1.12, 100], easeInOut],
      [t0 + 10, [S, S, 100]],
    ]),
  });
});

// --- CAMPSITE THAILAND: fades up ---------------------------------------------
const tagline = layer(14, 'tagline', {
  o: anim([
    [72, 0, easeOut],
    [84, 100],
  ]),
  r: still(0),
  p: anim([
    [72, [400.0, 478.0, 0], easeOut],
    [84, [400.0, 470.0, 0]],
  ]),
  s: still([S, S, 100]),
});

// --- background: paper white -------------------------------------------------
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
  sc: '#ffffff',
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
  nm: 'จุดกางเต็นท์ — loading v2 (vertical lockup)',
  ddd: 0,
  assets,
  layers: [...thaiLayers, tagline, mark, sun, sunFull, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/jkt-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
