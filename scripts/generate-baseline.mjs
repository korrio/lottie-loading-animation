/**
 * Generates the BASELINE auto tennis loading animations:
 *   public/baseline-loading.json     v1 — the passing shot
 *   public/baseline-loading-v2.json  v2 — bounce & roll (after the client's
 *                                    BASELINE_F.gif prototype: the ball
 *                                    bounces along the letter tops, then
 *                                    rolls right extruding its trail)
 *
 * "The passing shot": the eight navy letters stamp in left to right, then
 * the green tennis ball rockets in from off-canvas painting its gradient
 * speed trail behind it and lands in its slot above the "i" with a squash —
 * rolling as it flies. On loop the ball keeps rolling in place (3°/frame,
 * one revolution per loop) and the trail shimmers softly.
 *
 * Sprites are cut from baseline-main-logo.png: 8 letter components, the
 * ball as a complete circle-fitted disk (both seams intact, so it can
 * spin), and the trail with a concave right edge that nests the ball
 * pixel-identically at rest.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop.
 * Transparent background per house rule — the page DOM owns the color.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/baseline', name)).toString('base64');

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
const R1 = (v) => Math.round(v * 10) / 10;

// --- layout: full-res logo (3528×959) mapped into the comp ------------------
const K = 680 / 3528; // logo px → comp px
const OX = 60;
const OY = R1(310 - 479.5 * K); // logo v-center lands at comp y=310

const X = (lx) => R1(OX + lx * K);
const Y = (ly) => R1(OY + ly * K);

// letter bboxes in logo coords (sprites are these + 4px pad, halved)
const LETTERS = [
  ['b', 100, 348, 496, 840],
  ['a', 544, 348, 1020, 840],
  ['s', 1080, 336, 1424, 848],
  ['e1', 1520, 348, 1848, 840],
  ['l', 1956, 348, 2284, 840],
  ['i', 2364, 336, 2464, 848],
  ['n', 2596, 348, 3016, 840],
  ['e2', 3116, 348, 3448, 840],
];
const HALF_S = R1(K * 200); // half-res sprites display at 2×K (38.5%)

const BALL = { cx: 2410.5, cy: 142.5, spr: 228 }; // full-res disk sprite
const TRAIL = { x0: 1473, y0: 31, w: 469, h: 88 }; // half-res sprite

// --- letters: stamp in left to right ----------------------------------------
const letterLayers = LETTERS.map(([nm, x0, y0, x1, y1], i) => {
  const t0 = 4 + i * 4;
  const w = Math.round((x1 - x0 + 9) / 2);
  const h = Math.round((y1 - y0 + 9) / 2);
  return {
    ddd: 0,
    ind: 10 + i,
    ty: 2,
    nm: `letter-${nm}`,
    refId: `l-${nm}`,
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: {
      o: anim([
        [t0, 0, linear],
        [t0 + 3, 100],
      ]),
      r: still(0),
      p: still([X((x0 + x1) / 2 + 0.5), Y((y0 + y1) / 2 + 0.5), 0]),
      a: still([w / 2, h / 2, 0]),
      s: anim([
        [t0, [0, 0, 100], easeOut],
        [t0 + 5, [R1(HALF_S * 1.07), R1(HALF_S * 1.07), 100], easeInOut],
        [t0 + 9, [HALF_S, HALF_S, 100]],
      ]),
    },
  };
});

// --- the ball: flies in rolling, lands with a squash, rolls on loop ---------
const BX_FROM = -90;
const BX_TO = X(BALL.cx); // 524.6
const BY = Y(BALL.cy);
const T0 = 52;
const T1 = 72;
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

const ballPosKeys = [];
const ballRotKeys = [];
const trailMaskKeys = [];
const trailFull = TRAIL.w + 6;
for (let t = T0; t <= T1; t += 2) {
  const p = easeOutCubic((t - T0) / (T1 - T0));
  const bx = R1(BX_FROM + (BX_TO - BX_FROM) * p);
  ballPosKeys.push([t, [bx, BY, 0], linear]);
  ballRotKeys.push([t, R1(-640 * (1 - p)), linear]);
  const edge = Math.max(0, Math.min(trailFull, R1((bx - X(TRAIL.x0)) / (K * 2))));
  trailMaskKeys.push({
    t,
    s: [{ c: true, v: [[-6, -6], [edge, -6], [edge, TRAIL.h + 6], [-6, TRAIL.h + 6]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]] }],
    h: 1,
  });
}
ballRotKeys.push([90, 0, linear], [210, 360]);

const ball = {
  ddd: 0,
  ind: 2,
  ty: 2,
  nm: 'ball',
  refId: 'ball',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [T0, 0, linear],
      [T0 + 1, 100],
    ]),
    r: anim(ballRotKeys),
    p: anim(ballPosKeys),
    a: still([114.5, 114.5, 0]),
    s: anim([
      [T1, [R1(K * 100), R1(K * 100), 100], easeOut],
      [T1 + 3, [R1(K * 106), R1(K * 93), 100], easeOut],
      [T1 + 8, [R1(K * 100), R1(K * 100), 100]],
    ]),
  },
};

// trail revealed behind the ball, shimmering gently on loop
const trail = {
  ddd: 0,
  ind: 3,
  ty: 2,
  nm: 'trail',
  refId: 'trail',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  hasMask: true,
  masksProperties: [{ inv: false, mode: 'a', pt: { a: 1, k: trailMaskKeys }, o: still(100), x: still(0), nm: 'reveal' }],
  ks: {
    o: anim([
      [90, 100, easeInOut],
      [150, 86, easeInOut],
      [210, 100],
    ]),
    r: still(0),
    p: still([X(TRAIL.x0), Y(TRAIL.y0), 0]),
    a: still([0, 0, 0]),
    s: still([HALF_S, HALF_S, 100]),
  },
};

const doc = {
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm: 'BASELINE — the passing shot',
  ddd: 0,
  assets: [
    { id: 'ball', w: BALL.spr, h: BALL.spr, u: '', p: `data:image/png;base64,${asset('baseline-ball.png')}`, e: 1 },
    { id: 'trail', w: TRAIL.w, h: TRAIL.h, u: '', p: `data:image/png;base64,${asset('baseline-trail.png')}`, e: 1 },
    ...LETTERS.map(([nm, x0, y0, x1, y1]) => ({
      id: `l-${nm}`,
      w: Math.round((x1 - x0 + 9) / 2),
      h: Math.round((y1 - y0 + 9) / 2),
      u: '',
      p: `data:image/png;base64,${asset(`baseline-${nm}.png`)}`,
      e: 1,
    })),
  ],
  layers: [ball, trail, ...letterLayers],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

// ============================================================================
// v2 — bounce & roll, after the BASELINE_F.gif prototype
// ============================================================================
// Letters are up from the start (quick fade). The ball drops onto the B,
// bounces along the letter tops with decaying arcs, then launches onto the
// trail line and rolls right, the gradient trail extruding behind it until
// the lockup completes. On loop the ball does two lazy idle hops.

const TOP = Y(348) - 21.5; // ball center when resting on a letter top
const seg = (t0, t1, x0, x1, y0, y1, apex, out) => {
  const steps = Math.max(2, Math.round((t1 - t0) / 2));
  for (let k = 0; k < steps; k++) {
    const t = t0 + ((t1 - t0) * k) / steps;
    const p = k / steps;
    out.push([R1(t), [R1(x0 + (x1 - x0) * p), R1(y0 + (y1 - y0) * p - 4 * apex * p * (1 - p)), 0], linear]);
  }
};

const pos2 = [];
// vertical drop onto the B (accelerating)
for (let k = 0; k < 4; k++) {
  const t = 8 + k * 2;
  const p = k / 4;
  pos2.push([t, [X(298), R1(-40 + (TOP + 40) * p * p), 0], linear]);
}
seg(16, 27, X(298), X(782), TOP, TOP, 80, pos2); // B -> A
seg(27, 37, X(782), X(1252), TOP, TOP, 50, pos2); // A -> S
seg(37, 46, X(1252), X(TRAIL.x0), TOP, BY, 34, pos2); // S -> trail line
// glide right along the trail line, decelerating
const G0 = 46;
const G1 = 76;
const gx0 = X(TRAIL.x0);
const maskKeys2 = [];
for (let t = G0; t < G1; t += 2) {
  const p = easeOutCubic((t - G0) / (G1 - G0));
  const bx = R1(gx0 + (BX_TO - gx0) * p);
  pos2.push([t, [bx, BY, 0], linear]);
  const edge = Math.max(0, Math.min(trailFull, R1((bx - gx0) / (K * 2))));
  maskKeys2.push({
    t,
    s: [{ c: true, v: [[-6, -6], [edge, -6], [edge, TRAIL.h + 6], [-6, TRAIL.h + 6]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]] }],
    h: 1,
  });
}
pos2.push([G1, [BX_TO, BY, 0], easeInOut]);
maskKeys2.push({
  t: G1,
  s: [{ c: true, v: [[-6, -6], [trailFull, -6], [trailFull, TRAIL.h + 6], [-6, TRAIL.h + 6]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]] }],
  h: 1,
});
// loop: two lazy idle hops, seamless at 90/210
for (const c of [96, 156]) {
  pos2.push(
    [c, [BX_TO, BY, 0], easeOut],
    [c + 10, [BX_TO, R1(BY - 12), 0], easeInOut],
    [c + 20, [BX_TO, BY, 0], easeInOut]
  );
}
pos2.push([210, [BX_TO, BY, 0]]);

// rolling rotation tied to horizontal distance, ending at 0 at rest
const rot2 = pos2
  .filter(([t]) => t <= G1)
  .map(([t, [x]]) => [t, R1((x - BX_TO) * 1.2), linear]);
rot2.push([210, 0]);

// squash at each contact and hop landing
const S100 = R1(K * 100);
const sq = (c, sx, sy) => [
  [c - 2, [S100, S100, 100], easeOut],
  [c, [R1(K * sx), R1(K * sy), 100], easeOut],
  [c + 3, [S100, S100, 100], easeInOut],
];
const scale2 = anim([
  ...sq(16, 110, 84),
  ...sq(27, 108, 88),
  ...sq(37, 106, 90),
  [76, [S100, S100, 100], easeOut],
  [79, [R1(K * 106), R1(K * 93), 100], easeOut],
  [84, [S100, S100, 100], easeInOut],
  ...sq(116, 106, 92),
  ...sq(176, 106, 92),
  [210, [S100, S100, 100]],
]);

const ball2 = {
  ddd: 0,
  ind: 2,
  ty: 2,
  nm: 'ball',
  refId: 'ball',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [6, 0, linear],
      [8, 100],
    ]),
    r: anim(rot2),
    p: anim(pos2),
    a: still([114.5, 114.5, 0]),
    s: scale2,
  },
};

const trail2 = {
  ...trail,
  masksProperties: [{ inv: false, mode: 'a', pt: { a: 1, k: maskKeys2 }, o: still(100), x: still(0), nm: 'reveal' }],
  ks: { ...trail.ks, o: still(100) },
};

const letters2 = letterLayers.map((L) => ({
  ...L,
  ks: {
    ...L.ks,
    o: anim([
      [0, 0, linear],
      [6, 100],
    ]),
    s: still([HALF_S, HALF_S, 100]),
  },
}));

const doc2 = {
  ...doc,
  nm: 'BASELINE — bounce & roll',
  layers: [ball2, trail2, ...letters2],
};

for (const [name, d] of [
  ['baseline-loading.json', doc],
  ['baseline-loading-v2.json', doc2],
]) {
  const file = join(root, `public/${name}`);
  writeFileSync(file, JSON.stringify(d));
  console.log(`wrote ${file} (${(JSON.stringify(d).length / 1024).toFixed(0)} KB)`);
}
