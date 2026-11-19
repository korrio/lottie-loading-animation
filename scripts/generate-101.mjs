/**
 * Generates public/101-loading.json, -v2.json, -v3.json — pure-vector
 * Lottie loading animations for 101 Racquet Club (padel & tennis venue),
 * built from potrace-traced paths (scripts/101-vec.json).
 *
 * v1 "the rally"   — the digits rise, a ball rallies across the tops of
 *                    1-0-1 with squash bounces and exits, RACQUET CLUB
 *                    types in. Loop: a soft shimmer wave rolls through
 *                    the letterspaced wordmark.
 * v2 "the monogram"— 101 presses in like a club monogram stamp while
 *                    RACQUET CLUB converges from wide letterspacing.
 *                    Loop: the whole lockup breathes once.
 * v3 "the bounce"  — the 0 is the ball: both 1s stamp in, then the 0
 *                    drops from above and bounces into place with
 *                    decaying squashes. Loop: the 0 does a gentle hop.
 *
 * Timeline (60fps, 240 frames, 800×600): intro [0..90], loop [90..210].
 * All files are fully transparent — the page DOM supplies the cream.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const VEC = JSON.parse(readFileSync(join(root, 'scripts/101-vec.json')));

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const easeIn = { o: { x: [0.5], y: [0] }, i: { x: [0.9], y: [0.7] } };

const kf = (frames) =>
  frames.map(([t, s, ease, hold], idx) => {
    const k = { t, s: Array.isArray(s) ? s : [s] };
    if (hold) k.h = 1;
    else if (idx !== frames.length - 1) {
      const e = ease ?? easeInOut;
      k.o = e.o;
      k.i = e.i;
    }
    return k;
  });
const anim = (frames) => ({ a: 1, k: kf(frames) });
const still = (v) => ({ a: 0, k: v });

// logo px → comp coords
const K = 0.95;
const OX = 400 - 606 * K;
const OY = 300 - 320 * K;
const px = (cx) => OX + cx * K;
const py = (cy) => OY + cy * K;
const S = K * 100;

const GREEN = [0.071, 0.247, 0.196, 1];

const DIGITS = ['d1', 'd0', 'd2'];
const TAG = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'c1', 'c2', 'c3', 'c4'];

const shapes = (nm) =>
  VEC[nm].paths.map((p) => ({ ty: 'sh', ks: { a: 0, k: { c: true, v: p.v, i: p.i, o: p.o } } }));
const TR = { ty: 'tr', p: still([0, 0]), a: still([0, 0]), s: still([100, 100]), r: still(0), o: still(100), sk: still(0), sa: still(0) };
const FILL = { ty: 'fl', nm: 'fill', c: still(GREEN), o: still(100), r: 1 };

const ctr = (nm) => {
  const [x0, y0, x1, y1] = VEC[nm].bbox;
  return [(x0 + x1) / 2, (y0 + y1) / 2];
};

const vlayer = (ind, nm, ks, extra = {}) => {
  const [cx, cy] = ctr(nm);
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm,
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: { a: still([cx, cy, 0]), ...ks },
    shapes: [{ ty: 'gr', nm, it: [...shapes(nm), FILL, TR] }],
    ...extra,
  };
};

const doc = (nm, layers) => ({
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm,
  ddd: 0,
  assets: [],
  layers,
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
});

const rise = (ind, nm, t0, dy = 24, extra = {}) => {
  const [cx, cy] = ctr(nm);
  return vlayer(
    ind,
    nm,
    {
      o: anim([
        [t0, 0, easeOut],
        [t0 + 10, 100],
      ]),
      r: still(0),
      p: anim([
        [t0, [px(cx), py(cy) + dy, 0], easeOut],
        [t0 + 12, [px(cx), py(cy), 0]],
      ]),
      s: still([S, S, 100]),
    },
    extra,
  );
};

/* ------------------------- v1 — the rally ------------------------------- */
const buildV1 = () => {
  // tag letters type in, then shimmer in waves on loop
  const tagLayer = (ind, nm, i) => {
    const [cx, cy] = ctr(nm);
    const t0 = 36 + i * 2.5;
    const oKeys = [
      [t0, 0, easeOut],
      [t0 + 3, 100, easeInOut],
    ];
    for (const c of [96, 156]) {
      oKeys.push(
        [c + i * 4, 100, easeInOut],
        [c + i * 4 + 5, 65, easeInOut],
        [c + i * 4 + 10, 100, easeInOut],
      );
    }
    return vlayer(ind, nm, {
      o: anim(oKeys),
      r: still(0),
      p: anim([
        [t0, [px(cx), py(cy) + 8, 0], easeOut],
        [t0 + 4, [px(cx), py(cy), 0]],
      ]),
      s: still([S, S, 100]),
    });
  };

  // the rally ball: piecewise parabolic arcs over the digit tops
  const topY = py(156) - 16;
  const BOUNCES = [
    [-30, topY - 60, 24],
    [px(358), topY, 34],
    [px(542), topY, 46],
    [px(738), topY, 58],
    [840, topY - 80, 68],
  ];
  const APEX = [70, 62, 56, 64];
  const pKeys = [];
  for (let t = 24; t <= 68; t += 2) {
    let seg = 0;
    while (seg < 3 && t >= BOUNCES[seg + 1][2]) seg++;
    const [x0, y0, t0] = BOUNCES[seg];
    const [x1, y1, t1] = BOUNCES[seg + 1];
    const u = (t - t0) / (t1 - t0);
    const x = x0 + (x1 - x0) * u;
    const y = y0 + (y1 - y0) * u - 4 * APEX[seg] * u * (1 - u);
    pKeys.push([t, [Math.round(x * 10) / 10, Math.round(y * 10) / 10, 0], { o: { x: [0.33], y: [0.33] }, i: { x: [0.67], y: [0.67] } }]);
  }
  const sKeys = [];
  for (const c of [34, 46, 58]) {
    sKeys.push([c - 2, [100, 100, 100], easeInOut], [c, [118, 82, 100], easeInOut], [c + 3, [100, 100, 100], easeInOut]);
  }
  const ball = {
    ddd: 0,
    ind: 30,
    ty: 4,
    nm: 'ball',
    sr: 1,
    ks: {
      o: anim([
        [23.5, 0, null, true],
        [24, 100, easeInOut],
        [62, 100, easeInOut],
        [68, 0],
      ]),
      r: still(0),
      p: anim(pKeys),
      a: still([0, 0, 0]),
      s: anim([[20, [100, 100, 100], easeInOut], ...sKeys]),
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        nm: 'ball',
        it: [
          { ty: 'el', nm: 'circle', p: still([0, 0]), s: still([30, 30]) },
          FILL,
          TR,
        ],
      },
    ],
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };

  return doc('101 Racquet Club — loading v1 (the rally)', [
    ball,
    ...DIGITS.map((nm, i) => rise(1 + i, nm, 6 + i * 6)),
    ...TAG.map((nm, i) => tagLayer(4 + i, nm, i)),
  ]);
};

/* ----------------------- v2 — the monogram ------------------------------ */
const buildV2 = () => {
  const master = {
    ddd: 0,
    ind: 41,
    ty: 3,
    nm: 'master',
    sr: 1,
    ks: {
      o: still(100),
      r: still(0),
      p: still([400, 300, 0]),
      a: still([400, 300, 0]),
      s: anim([
        [90, [100, 100, 100], easeInOut],
        [150, [101.2, 101.2, 100], easeInOut],
        [210, [100, 100, 100]],
      ]),
    },
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };
  const digitsC = px(548.5);
  const digitsRig = {
    ddd: 0,
    ind: 40,
    ty: 3,
    nm: 'digits-rig',
    sr: 1,
    parent: 41,
    ks: {
      o: still(100),
      r: still(0),
      p: still([digitsC, py(266), 0]),
      a: still([digitsC, py(266), 0]),
      s: anim([
        [6, [0, 0, 100], easeOut],
        [22, [103, 103, 100], easeInOut],
        [28, [100, 100, 100]],
      ]),
    },
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };
  const digit = (ind, nm) => {
    const [cx, cy] = ctr(nm);
    return vlayer(
      ind,
      nm,
      { o: still(100), r: still(0), p: still([px(cx), py(cy), 0]), s: still([S, S, 100]) },
      { parent: 40 },
    );
  };
  const TAGC = px(599.5);
  const converge = (ind, nm) => {
    const [cx, cy] = ctr(nm);
    const fx = TAGC + (px(cx) - TAGC) * 1.6;
    return vlayer(
      ind,
      nm,
      {
        o: anim([
          [30, 0, easeOut],
          [42, 100],
        ]),
        r: still(0),
        p: anim([
          [30, [fx, py(cy), 0], easeOut],
          [48, [px(cx), py(cy), 0]],
        ]),
        s: still([S, S, 100]),
      },
      { parent: 41 },
    );
  };
  return doc('101 Racquet Club — loading v2 (the monogram)', [
    ...DIGITS.map((nm, i) => digit(1 + i, nm)),
    ...TAG.map((nm, i) => converge(4 + i, nm)),
    digitsRig,
    master,
  ]);
};

/* ------------------------ v3 — the bounce ------------------------------- */
const buildV3 = () => {
  // the 0 is the ball — anchored at its baseline so squashes sit on it
  const [x0, , x1, y1] = VEC.d0.bbox;
  const cx = (x0 + x1) / 2;
  const baseY = py(y1);
  const d0 = vlayer(2, 'd0', {
    o: anim([
      [14, 0, easeOut],
      [18, 100],
    ]),
    r: still(0),
    p: anim([
      [14, [px(cx), baseY - 300, 0], easeIn],
      [26, [px(cx), baseY, 0], easeOut],
      [34, [px(cx), baseY - 70, 0], easeIn],
      [42, [px(cx), baseY, 0], easeOut],
      [48, [px(cx), baseY - 24, 0], easeIn],
      [54, [px(cx), baseY, 0], easeOut],
      [100, [px(cx), baseY, 0], easeOut],
      [106, [px(cx), baseY - 12, 0], easeIn],
      [112, [px(cx), baseY, 0], easeInOut],
      [160, [px(cx), baseY, 0], easeOut],
      [166, [px(cx), baseY - 12, 0], easeIn],
      [172, [px(cx), baseY, 0]],
    ]),
    s: anim([
      [25, [100, 100, 100], easeInOut],
      [27, [112, 84, 100], easeInOut],
      [31, [96, 106, 100], easeInOut],
      [34, [100, 100, 100], easeInOut],
      [41, [100, 100, 100], easeInOut],
      [43, [108, 90, 100], easeInOut],
      [46, [100, 100, 100], easeInOut],
      [53, [100, 100, 100], easeInOut],
      [55, [104, 95, 100], easeInOut],
      [58, [100, 100, 100], easeInOut],
      [111, [100, 100, 100], easeInOut],
      [113, [105, 94, 100], easeInOut],
      [117, [100, 100, 100], easeInOut],
      [171, [100, 100, 100], easeInOut],
      [173, [105, 94, 100], easeInOut],
      [177, [100, 100, 100], easeInOut],
    ]),
  });
  d0.ks.a = still([cx, y1, 0]);

  return doc('101 Racquet Club — loading v3 (the bounce)', [
    rise(1, 'd1', 6),
    d0,
    rise(3, 'd2', 12),
    ...TAG.map((nm, i) => rise(4 + i, nm, 48 + i * 1.5, 10)),
  ]);
};

for (const [fn, file] of [
  [buildV1, '101-loading.json'],
  [buildV2, '101-loading-v2.json'],
  [buildV3, '101-loading-v3.json'],
]) {
  const d = fn();
  const out = join(root, `public/${file}`);
  writeFileSync(out, JSON.stringify(d));
  console.log(`wrote ${out} (${(JSON.stringify(d).length / 1024).toFixed(0)} KB)`);
}
