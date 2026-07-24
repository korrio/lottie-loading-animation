/**
 * Generates public/nyspace-loading-v2.json — "orbit" variant for NY Space.
 *
 * Story: same intro as v1 — the mark pops in and the tennis ball drops,
 * bounces once and settles as the mark's dot. Then, once per loop, the ball
 * leaves its dot spot and takes one full lap around the letterform —
 * shrinking and sliding behind it on the far side — before landing exactly
 * back home. The orbit ellipse passes through the dot position, so every
 * loop begins and ends on the true logo lockup.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (one orbit, spin 3°/frame)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/nyspace', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const linear = { o: { x: [0.167], y: [0.167] }, i: { x: [0.833], y: [0.833] } };
const fall = { o: { x: [0.45], y: [0.02] }, i: { x: [0.75], y: [0.55] } };

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
const holds = (pairs) => ({ a: 1, k: pairs.map(([t, v]) => ({ t, s: [v], h: 1 })) });

const IMAGES = [
  { id: 'ball', w: 120, h: 120 },
  { id: 'mark', w: 477, h: 486 },
  { id: 'wordmark', w: 676, h: 83 },
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

const S = 52;
const MARK_POS = [406.6, 271.9];
const BX = 296.0; // ball's dot spot (v1 rest position)
const BY = 152.5;

// --- orbit geometry ---------------------------------------------------------
// Tilted ellipse centered on the mark, with its near quarter point exactly at
// the dot spot. Quarter keys with circular-arc bezier tangents, rotated into
// comp coords; 30 frames per quarter → one revolution per 120-frame loop.
// The z-order swaps at the crossings, where the ball is clear of the mark.
const C = MARK_POS;
const dvx = BX - C[0];
const dvy = BY - C[1];
const RY = Math.hypot(dvx, dvy); // near point = dot spot, by construction
const RX = 200;
// Solve rotation so local near point (0, RY) maps onto the dot offset:
// R(phi)·(0,RY) = (-RY sin phi, RY cos phi) = (dvx, dvy)
const phi = Math.atan2(-dvx / RY, dvy / RY);
const rot = ([x, y]) => [x * Math.cos(phi) - y * Math.sin(phi), x * Math.sin(phi) + y * Math.cos(phi)];

const K = 0.5523;
const TX = RX * K;
const TY = RY * K;

// local CCW quarter sequence; P1 = near point (the dot spot)
const quartersLocal = [
  { s: [-RX, 0], to: [0, TY], ti: [0, -TY] }, // P0: swap point (top-right on screen)
  { s: [0, RY], to: [TX, 0], ti: [-TX, 0] }, // P1: near — the dot spot, big, front
  { s: [RX, 0], to: [0, -TY], ti: [0, TY] }, // P2: swap point (bottom-left on screen)
  { s: [0, -RY], to: [-TX, 0], ti: [TX, 0] }, // P3: far — small, behind the mark
];
const quarters = quartersLocal.map(({ s, to, ti }) => {
  const [sx, sy] = rot(s);
  return { s: [C[0] + sx, C[1] + sy], to: rot(to), ti: rot(ti) };
});

// orbit keys: P1 at 90 and 210 → the loop starts and ends on the lockup
const orbitOrder = [1, 2, 3, 0, 1, 2];
const orbitP = orbitOrder.map((qi, i) => {
  const q = quarters[qi];
  return {
    t: 90 + i * 30,
    s: [...q.s, 0],
    to: [...q.to, 0],
    ti: [...q.ti, 0],
    o: linear.o,
    i: linear.i,
  };
});
orbitP[0].ti = [0, 0, 0]; // ball is at rest before launch — no incoming curve

// --- ball: v1 drop-and-bounce intro, then one lap per loop ------------------
const ballP = {
  a: 1,
  k: [
    ...kf([
      [26, [BX, BY - 340, 0], fall],
      [44, [BX, BY, 0], easeOut],
      [50, [BX, BY - 26, 0], easeInOut],
      [56, [BX, BY, 0], easeInOut],
    ]).slice(0, -1),
    { t: 56, s: [BX, BY, 0], o: easeInOut.o, i: easeInOut.i },
    ...orbitP,
  ],
};

const ballTransform = {
  a: still([60, 60, 0]),
  r: anim([
    [26, -220, fall],
    [44, 0, linear],
    [90, 0, linear],
    [210, 360, linear],
    [240, 450],
  ]),
  p: ballP,
  s: anim([
    [43, [S, S, 100], easeOut],
    [45, [S * 1.19, S * 0.83, 100], easeOut],
    [51, [S, S, 100], easeInOut],
    [90, [S, S, 100], easeInOut],
    [120, [47, 47, 100], easeInOut],
    [150, [42, 42, 100], easeInOut], // far point, behind the mark
    [180, [47, 47, 100], easeInOut],
    [210, [S, S, 100], easeInOut],
    [240, [47, 47, 100]],
  ]),
};

// front copy: intro + the near half of the orbit (P0 → P1 → P2)
const ballFront = layer(1, 'ball', {
  ...ballTransform,
  o: holds([
    [24, 0],
    [26, 100],
    [120, 0],
    [180, 100],
    [240, 0],
  ]),
});

// back copy: the far half (P2 → P3 → P0), occluded by the mark
const ballBack = layer(
  3,
  'ball',
  {
    ...ballTransform,
    o: holds([
      [0, 0],
      [120, 100],
      [180, 0],
      [240, 100],
    ]),
  },
  { nm: 'ball-back' },
);

// --- mark: sticker pop, gentle breath in the loop ---------------------------
const mark = layer(2, 'mark', {
  o: anim([
    [4, 0, easeOut],
    [8, 100],
  ]),
  r: still(0),
  p: still([...MARK_POS, 0]),
  s: anim([
    [4, [0, 0, 100], easeOut],
    [16, [S * 1.06, S * 1.06, 100], easeInOut],
    [24, [S, S, 100], easeInOut],
    [90, [S, S, 100], easeInOut],
    [120, [S * 1.015, S * 1.015, 100], easeInOut],
    [150, [S, S, 100], easeInOut],
    [180, [S * 1.015, S * 1.015, 100], easeInOut],
    [210, [S, S, 100], easeInOut],
    [240, [S * 1.015, S * 1.015, 100]],
  ]),
});

// --- wordmark: tracks in (letterspacing tightens as it fades up) -----------
const wordmark = layer(4, 'wordmark', {
  o: anim([
    [50, 0, easeOut],
    [62, 100],
  ]),
  r: still(0),
  s: anim([
    [50, [58, 47, 100], easeOut],
    [64, [47, 47, 100]],
  ]),
  p: anim([
    [50, [400, 462, 0], easeOut],
    [62, [400, 448, 0]],
  ]),
});

// --- background: brand green solid -----------------------------------------
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
  sc: '#195050',
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
  nm: 'NY SPACE — loading v2 (orbit)',
  ddd: 0,
  assets,
  layers: [ballFront, mark, ballBack, wordmark, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/nyspace-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
