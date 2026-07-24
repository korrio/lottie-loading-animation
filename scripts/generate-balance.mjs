/**
 * Generates public/balance-loading.json — a self-contained Lottie loading
 * animation for BALANCE AUTO TENNIS.
 *
 * Story: the solid ball drops from above while the outline ball rolls up
 * from below; they click together into the balance mark. BALANCE and
 * AUTO TENNIS reveal beneath. In the loop the two balls keep rotating
 * in opposite directions like meshed gears.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90]   intro   [90..210] seamless loop (3°/frame = 360° per loop, dots 40)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/balance', name)).toString('base64');

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

// --- assets ----------------------------------------------------------------
// ball crops are 92×92 centered on their circle centers (solid disc at logo
// (64.5, 73.5) r44, outline ring at (64.5, 132.5) — hidden top arc rebuilt),
// so the layer anchor (w/2, h/2) is the rotation center.
// BALANCE x133..582 y30..105, AUTO TENNIS x128..582 y122..174
const IMAGES = [
  { id: 'ball-solid', w: 92, h: 92 },
  { id: 'ball-outline', w: 92, h: 92 },
  { id: 'balance', w: 449, h: 75 },
  { id: 'auto', w: 454, h: 52 },
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

// mark placement: logo mark center (65, 103) → comp (400, 180), scale 1.5
const S = 1.5;
const MARK_S = S * 100;
const MARK_CTRL = 10;
// circle centers in logo coords → offsets from mark center, in parent space
const SOLID_Y = (73.5 - 103) * S; // -44.25
const OUTLINE_Y = (132.5 - 103) * S; // 44.25

// continuous rotation: 3°/frame → exactly 360° per 120-frame loop, so
// r(90) and r(210) are congruent and the wrap is invisible
const ballSolid = layer(
  1,
  'ball-solid',
  {
    o: anim([
      [4, 0, easeOut],
      [10, 100],
    ]),
    r: anim([
      [4, -120, easeOut],
      [36, 0, linear],
      [240, 612],
    ]),
    s: still([MARK_S, MARK_S, 100]),
    p: anim([
      [4, [0, SOLID_Y - 280, 0], easeOut],
      [26, [0, SOLID_Y + 14, 0], easeInOut],
      [34, [0, SOLID_Y, 0]],
    ]),
  },
  { parent: MARK_CTRL },
);

// --- outline ball: rolls up from below, then counter-rotates ---------------
const ballOutline = layer(
  2,
  'ball-outline',
  {
    o: anim([
      [10, 0, easeOut],
      [16, 100],
    ]),
    r: anim([
      [10, 120, easeOut],
      [40, 0, linear],
      [240, -600],
    ]),
    s: still([MARK_S, MARK_S, 100]),
    p: anim([
      [10, [0, OUTLINE_Y + 240, 0], easeOut],
      [32, [0, OUTLINE_Y - 10, 0], easeInOut],
      [40, [0, OUTLINE_Y, 0]],
    ]),
  },
  { parent: MARK_CTRL },
);

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
    p: still([400, 180, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// --- text: BALANCE, then AUTO TENNIS ---------------------------------------
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

const balance = reveal(3, 'balance', 355, 40, 56, 85);
const auto = reveal(4, 'auto', 420, 50, 66, 85);

// --- loading dots: navy / cream / navy -------------------------------------
const NAVY = [0.11, 0.193, 0.371, 1]; // #1c315e
const STEEL = [0.42, 0.51, 0.68, 1]; // mid blue

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
          [58 + off * 0.3, [0, 0], easeOut],
          [70 + off * 0.3, [118, 118], easeInOut],
          [78 + off * 0.3, [100, 100]],
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
  ind: 5,
  ty: 4,
  nm: 'loading-dots',
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([400, 500, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [dotGroup(-32, 0, NAVY), dotGroup(0, 13, STEEL), dotGroup(32, 27, NAVY)],
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
  sc: '#cc7624',
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
  nm: 'BALANCE AUTO TENNIS — loading',
  ddd: 0,
  assets,
  layers: [ballSolid, ballOutline, balance, auto, dots, markCtrl, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/balance-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
