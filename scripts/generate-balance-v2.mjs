/**
 * Generates public/balance-loading-v2.json — BALANCE AUTO TENNIS, version 2.
 *
 * Story: the solid ball rolls in from the left and the outline ball rolls
 * in from the right; each decelerates and stops rotating exactly as it
 * reaches its place in the mark. BALANCE and AUTO TENNIS reveal beneath.
 * In the loop the assembled mark breathes gently while the dots pulse.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90]   intro   [90..210] seamless loop (breath period 60, dots 40)
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
// decelerating landing shared by position AND rotation so the roll reads true
const roll = { o: { x: [0.3], y: [0.5] }, i: { x: [0.35], y: [1] } };

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

// --- assets (same crops as v1) ---------------------------------------------
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

const S = 1.5;
const MARK_S = S * 100;
const MARK_CTRL = 10;
const SOLID_Y = (73.5 - 103) * S; // -44.25
const OUTLINE_Y = (132.5 - 103) * S; // 44.25

// rolling: ball radius on screen = 44 * 1.5 = 66px; a 460px run ≈ 400° of
// spin — rounded to one clean full turn, ending exactly at 0°
const RUN = 460;

// --- solid ball: rolls in from the left, stops dead center -----------------
const ballSolid = layer(
  1,
  'ball-solid',
  {
    o: anim([
      [4, 0, easeOut],
      [10, 100],
    ]),
    r: anim([
      [4, -360, roll],
      [40, 0],
    ]),
    s: still([MARK_S, MARK_S, 100]),
    p: anim([
      [4, [-RUN, SOLID_Y, 0], roll],
      [40, [0, SOLID_Y, 0]],
    ]),
  },
  { parent: MARK_CTRL },
);

// --- outline ball: rolls in from the right, stops dead center --------------
const ballOutline = layer(
  2,
  'ball-outline',
  {
    o: anim([
      [12, 0, easeOut],
      [18, 100],
    ]),
    r: anim([
      [12, 360, roll],
      [48, 0],
    ]),
    s: still([MARK_S, MARK_S, 100]),
    p: anim([
      [12, [RUN, OUTLINE_Y, 0], roll],
      [48, [0, OUTLINE_Y, 0]],
    ]),
  },
  { parent: MARK_CTRL },
);

// --- mark controller: static position, gentle breath in the loop -----------
const breath = [];
for (let c = 42; c <= OP + 20; c += 60) {
  breath.push(
    [c, [100, 100, 100], easeInOut],
    [c + 22, [101.8, 101.8, 100], easeInOut],
    [c + 44, [100, 100, 100], easeInOut],
  );
}
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
    s: anim(breath),
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

const balance = reveal(3, 'balance', 355, 48, 62, 85);
const auto = reveal(4, 'auto', 420, 56, 70, 85);

// --- loading dots ----------------------------------------------------------
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
  nm: 'BALANCE AUTO TENNIS — loading v2',
  ddd: 0,
  assets,
  layers: [ballSolid, ballOutline, balance, auto, dots, markCtrl, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/balance-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
