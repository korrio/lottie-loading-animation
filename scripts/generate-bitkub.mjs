/**
 * Generates public/bitkub-loading.json — a self-contained Lottie loading
 * animation for Bitkub Capital Group Holdings.
 *
 * Story: the two green hooks of the diamond mark fly in from opposite
 * corners and interlock; the two dots pop in like coins. "bitkub" and
 * "Capital Group Holdings" reveal beneath. The mark rests once assembled;
 * the loading dots carry the loop.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90]   intro   [90..210] seamless loop (dots period 40)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/bitkub', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };

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

// --- assets: crops from the 1500×381 raster of the SVG ---------------------
const IMAGES = [
  { id: 'hook-a', w: 311, h: 362 },
  { id: 'hook-b', w: 309, h: 360 },
  { id: 'dot-a', w: 74, h: 74 },
  { id: 'dot-b', w: 75, h: 75 },
  { id: 'bitkub', w: 845, h: 255 },
  { id: 'capital', w: 794, h: 90 },
];

const assets = IMAGES.map(({ id, w, h }) => ({
  id,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(`${id}.png`)}`,
  e: 1,
}));

const layer = (ind, refId, ks, extra = {}) => {
  const { w, h } = IMAGES.find((i) => i.id === refId);
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

// mark: raster center (283.5, 181) → comp (400, 175), scale 0.6
const K = 0.6;
const MARK_S = K * 100;
const MARK_CTRL = 10;
const rel = (cx, cy) => [(cx - 283.5) * K, (cy - 181) * K];
const [HAX, HAY] = rel(155, 180.5);
const [HBX, HBY] = rel(412, 180.5);
const [DAX, DAY] = rel(179.5, 180.5);
const [DBX, DBY] = rel(387, 181);

// --- hooks: fly in from opposite corners and interlock ---------------------
const hookA = layer(
  1,
  'hook-a',
  {
    o: anim([
      [4, 0, easeOut],
      [12, 100],
    ]),
    r: still(0),
    s: still([MARK_S, MARK_S, 100]),
    p: anim([
      [4, [HAX - 220, HAY - 220, 0], easeOut],
      [28, [HAX + 8, HAY + 8, 0], easeInOut],
      [36, [HAX, HAY, 0]],
    ]),
  },
  { parent: MARK_CTRL },
);

const hookB = layer(
  2,
  'hook-b',
  {
    o: anim([
      [8, 0, easeOut],
      [16, 100],
    ]),
    r: still(0),
    s: still([MARK_S, MARK_S, 100]),
    p: anim([
      [8, [HBX + 220, HBY + 220, 0], easeOut],
      [32, [HBX - 8, HBY - 8, 0], easeInOut],
      [40, [HBX, HBY, 0]],
    ]),
  },
  { parent: MARK_CTRL },
);

// --- dots: pop in like two coins ------------------------------------------
const dotPop = (ind, refId, x, y, t0) =>
  layer(
    ind,
    refId,
    {
      o: anim([
        [t0, 0, easeOut],
        [t0 + 6, 100],
      ]),
      r: still(0),
      p: still([x, y, 0]),
      s: anim([
        [t0, [0, 0, 100], easeOut],
        [t0 + 10, [MARK_S * 1.25, MARK_S * 1.25, 100], easeInOut],
        [t0 + 16, [MARK_S, MARK_S, 100]],
      ]),
    },
    { parent: MARK_CTRL },
  );

const dotA = dotPop(3, 'dot-a', DAX, DAY, 34);
const dotB = dotPop(4, 'dot-b', DBX, DBY, 40);

// --- mark controller: static positioning null ------------------------------
const markCtrl = {
  ddd: 0,
  ind: MARK_CTRL,
  ty: 3,
  nm: 'mark-ctrl',
  sr: 1,
  ks: {
    o: still(0),
    r: still(0),
    p: still([400, 175, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// --- text ------------------------------------------------------------------
const reveal = (ind, refId, y, t0, t1, scale) =>
  layer(ind, refId, {
    o: anim([
      [t0, 0, easeOut],
      [t1, 100],
    ]),
    r: still(0),
    s: still([scale, scale, 100]),
    p: anim([
      [t0, [400, y + 18, 0], easeOut],
      [t1, [400, y, 0]],
    ]),
  });

const bitkub = reveal(5, 'bitkub', 375, 44, 60, 45);
const capital = reveal(6, 'capital', 455, 54, 70, 45);

// --- loading dots: green / gray / green ------------------------------------
const GREEN = [0.008, 0.843, 0.404, 1]; // #02d767
const GRAY = [0.259, 0.259, 0.259, 1]; // #424242

const dotGroup = (x, off, color) => {
  const beats = [];
  let v = 30;
  for (let t = 10 + off; t <= OP + 20; t += 20) {
    beats.push([t, v, easeInOut]);
    v = v === 30 ? 100 : 30;
  }
  return {
    ty: 'gr',
    nm: `dot-${x}`,
    it: [
      { ty: 'el', p: still([0, 0]), s: still([14, 14]), nm: 'circle' },
      { ty: 'fl', c: still(color), o: still(100), r: 1, nm: 'fill' },
      {
        ty: 'tr',
        p: still([x, 0]),
        a: still([0, 0]),
        s: anim([
          [62 + off * 0.3, [0, 0], easeOut],
          [74 + off * 0.3, [118, 118], easeInOut],
          [82 + off * 0.3, [100, 100]],
        ]),
        r: still(0),
        o: anim(beats),
        sk: still(0),
        sa: still(0),
      },
    ],
  };
};

const dots = {
  ddd: 0,
  ind: 7,
  ty: 4,
  nm: 'loading-dots',
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([400, 520, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [dotGroup(-32, 0, GREEN), dotGroup(0, 13, GRAY), dotGroup(32, 27, GREEN)],
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// --- background: full-comp solid -------------------------------------------
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
  nm: 'Bitkub Capital — loading',
  ddd: 0,
  assets,
  layers: [hookA, hookB, dotA, dotB, bitkub, capital, dots, markCtrl, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/bitkub-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
