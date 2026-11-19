/**
 * Generates public/gymconnect-loading.json and -v2.json — pure-vector
 * Lottie loading animations for GymConnect, built from potrace-traced
 * paths (scripts/gymconnect-vec.json). The m is a blue→teal gradient and
 * the C cluster (connector line, node dots and the C) teal→lime, matching
 * the traced SVG.
 *
 * v1 "the circuit"  — the white letters rise, the blue m powers up, then
 *                     the connector wipes on left-to-right like a circuit
 *                     closing, pinging rings at the nodes. Loop: a signal
 *                     dot travels from m into the C while m and C trade
 *                     gentle pulses.
 * v2 "the power rep"— gym strength: the letters slam down like stacked
 *                     plates, the m stamps in, the C cluster drives in
 *                     from the right and hits the connector with a squash,
 *                     screen shake, a shockwave ring and sparks. Loop:
 *                     m and C pump together with a ring per rep.
 *
 * Timeline (60fps, 240 frames, 800×600): intro [0..90], loop [90..210].
 * Both files are fully transparent — the page DOM supplies the dark slate.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const VEC = JSON.parse(readFileSync(join(root, 'scripts/gymconnect-vec.json')));

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const easeIn = { o: { x: [0.55], y: [0] }, i: { x: [0.95], y: [0.85] } };

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
const K = 0.47;
const OX = 400 - 1375.5 * K;
const OY = 300 - 282 * K;
const px = (cx) => OX + cx * K;
const py = (cy) => OY + cy * K;
const S = K * 100;

const WHITES = ['G', 'y', 'o', 'n1', 'n2', 'e', 'c', 't'];
const WIND = { G: 1, y: 2, o: 5, n1: 6, n2: 7, e: 8, c: 9, t: 10 };

const WHITE = [0.89, 0.902, 0.918, 1];
const TEAL = [0.376, 0.725, 0.776, 1];
const LIME = [0.675, 0.925, 0.392, 1];
const BLUE = [0.259, 0.569, 0.941, 1];

const shapes = (nm) =>
  VEC[nm].paths.map((p) => ({ ty: 'sh', ks: { a: 0, k: { c: true, v: p.v, i: p.i, o: p.o } } }));
const TR = { ty: 'tr', p: still([0, 0]), a: still([0, 0]), s: still([100, 100]), r: still(0), o: still(100), sk: still(0), sa: still(0) };

const fillFor = (nm) => {
  if (WHITES.includes(nm)) return { ty: 'fl', nm: 'fill', c: still(WHITE), o: still(100), r: 1 };
  const [x0, , x1] = VEC[nm].bbox;
  if (nm === 'm')
    return {
      ty: 'gf', nm: 'grad', o: still(100), r: 1, t: 1,
      s: still([x0, 0]), e: still([x1, 0]),
      g: { p: 2, k: still([0, 0.259, 0.569, 0.941, 1, 0.376, 0.706, 0.776]) },
    };
  return {
    ty: 'gf', nm: 'grad', o: still(100), r: 1, t: 1,
    s: still([x0, 0]), e: still([x1, 0]),
    g: { p: 3, k: still([0, 0.376, 0.725, 0.725, 0.55, 0.584, 0.859, 0.529, 1, 0.675, 0.925, 0.392]) },
  };
};

const ctr = (nm) => {
  const [x0, y0, x1, y1] = VEC[nm].bbox;
  return [(x0 + x1) / 2, (y0 + y1) / 2];
};

const vlayer = (ind, nm, ks, extra = {}) => {
  const [cx, cy] = ctr(nm);
  return {
    ddd: 0, ind, ty: 4, nm, sr: 1, ao: 0, ip: 0, op: OP, st: 0, bm: 0,
    ks: { a: still([cx, cy, 0]), ...ks },
    shapes: [{ ty: 'gr', nm, it: [...shapes(nm), fillFor(nm), TR] }],
    ...extra,
  };
};

// node positions (logo px) — the dot on the connector line and the C tips
const NODE = [1095, 264];
const TIP_TOP = [1235, 206];
const TIP_BOT = [1235, 322];

const ring = (ind, lx, ly, cycles, r1, w, color, parent = null) => {
  const oKeys = [];
  const sKeys = [];
  for (const c of cycles) {
    oKeys.push([c - 0.5, 0, null, true], [c, 70, easeOut], [c + 22, 0, null, true]);
    sKeys.push([c - 0.5, [10, 10, 100], null, true], [c, [10, 10, 100], easeOut], [c + 22, [r1, r1, 100], null, true]);
  }
  return {
    ddd: 0, ind, ty: 4, nm: `ring-${ind}`, sr: 1,
    ...(parent ? { parent } : {}),
    ks: { o: anim(oKeys), r: still(0), p: still([px(lx), py(ly), 0]), a: still([0, 0, 0]), s: anim(sKeys) },
    ao: 0,
    shapes: [{ ty: 'gr', nm: 'ring', it: [
      { ty: 'el', nm: 'circle', p: still([0, 0]), s: still([100, 100]) },
      { ty: 'st', nm: 'stroke', c: still(color), o: still(100), w: still(w), lc: 2, lj: 1 },
      TR,
    ] }],
    ip: 0, op: OP, st: 0, bm: 0,
  };
};

const doc = (nm, layers) => ({
  v: '5.9.6', fr: FR, ip: 0, op: OP, w: 800, h: 600, nm, ddd: 0, assets: [], layers,
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
});

/* ------------------------- v1 — the circuit ----------------------------- */
const buildV1 = () => {
  const rise = (nm, t0) => {
    const [cx, cy] = ctr(nm);
    return vlayer(WIND[nm], nm, {
      o: anim([[t0, 0, easeOut], [t0 + 8, 100]]),
      r: still(0),
      p: anim([
        [t0, [px(cx), py(cy) + 18, 0], easeOut],
        [t0 + 10, [px(cx), py(cy), 0]],
      ]),
      s: still([S, S, 100]),
    });
  };
  // m powers up, then trades pulses with C on loop
  const m = vlayer(3, 'm', {
    o: anim([[30, 0, easeOut], [36, 100]]),
    r: still(0),
    p: still([px(ctr('m')[0]), py(ctr('m')[1]), 0]),
    s: anim([
      [30, [0, 0, 100], easeOut],
      [38, [S * 1.1, S * 1.1, 100], easeInOut],
      [43, [S, S, 100], easeInOut],
      [96, [S, S, 100], easeInOut],
      [102, [S * 1.035, S * 1.035, 100], easeInOut],
      [108, [S, S, 100], easeInOut],
      [156, [S, S, 100], easeInOut],
      [162, [S * 1.035, S * 1.035, 100], easeInOut],
      [168, [S, S, 100], easeInOut],
    ]),
  });
  // C cluster wipes on left-to-right like a circuit closing
  const [cx0, cy0, cx1, cy1] = VEC.C.bbox;
  const maskRect = (edge) => [{
    c: true,
    v: [[cx0 - 10, cy0 - 10], [edge, cy0 - 10], [edge, cy1 + 10], [cx0 - 10, cy1 + 10]],
    i: [[0, 0], [0, 0], [0, 0], [0, 0]],
    o: [[0, 0], [0, 0], [0, 0], [0, 0]],
  }];
  const C = vlayer(4, 'C', {
    o: still(100),
    r: still(0),
    p: still([px(ctr('C')[0]), py(ctr('C')[1]), 0]),
    s: anim([
      [120, [S, S, 100], easeInOut],
      [126, [S * 1.035, S * 1.035, 100], easeInOut],
      [132, [S, S, 100], easeInOut],
      [180, [S, S, 100], easeInOut],
      [186, [S * 1.035, S * 1.035, 100], easeInOut],
      [192, [S, S, 100], easeInOut],
    ]),
  }, {
    hasMask: true,
    masksProperties: [{
      inv: false, mode: 'a', nm: 'wipe', o: still(100), x: still(0),
      pt: { a: 1, k: [
        { t: 44, s: maskRect(cx0 - 8), o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } },
        { t: 64, s: maskRect(cx1 + 12) },
      ] },
    }],
  });
  // signal dot travels from the m into the connector node on loop
  const dotKeys = { o: [], p: [] };
  for (const c of [96, 156]) {
    dotKeys.o.push([c - 0.5, 0, null, true], [c, 100, easeInOut], [c + 14, 100, easeInOut], [c + 18, 0, null, true]);
    dotKeys.p.push(
      [c - 0.5, [px(1008), py(264), 0], null, true],
      [c, [px(1008), py(264), 0], easeInOut],
      [c + 18, [px(1150), py(264), 0], null, true],
    );
  }
  const dot = {
    ddd: 0, ind: 36, ty: 4, nm: 'signal', sr: 1,
    ks: { o: anim(dotKeys.o), r: still(0), p: anim(dotKeys.p), a: still([0, 0, 0]), s: still([100, 100, 100]) },
    ao: 0,
    shapes: [{ ty: 'gr', nm: 'dot', it: [
      { ty: 'el', nm: 'circle', p: still([0, 0]), s: still([11, 11]) },
      { ty: 'fl', nm: 'fill', c: still(LIME), o: still(100), r: 1 },
      TR,
    ] }],
    ip: 0, op: OP, st: 0, bm: 0,
  };
  return doc('GymConnect — loading v1 (the circuit)', [
    dot,
    ring(60, ...NODE, [48, 114, 174], 90, 3, TEAL),
    ring(61, ...TIP_TOP, [60], 70, 2.5, LIME),
    ring(62, ...TIP_BOT, [62], 70, 2.5, LIME),
    rise('G', 4), rise('y', 8),
    m, C,
    rise('o', 12), rise('n1', 15), rise('n2', 18), rise('e', 21), rise('c', 24), rise('t', 27),
  ]);
};

/* ------------------------ v2 — the power rep ---------------------------- */
const buildV2 = () => {
  const JOLTS = [[7, -3], [-6, 2], [4, -2], [-2, 1], [0, 0]];
  const shake = {
    ddd: 0, ind: 50, ty: 3, nm: 'shake', sr: 1,
    ks: {
      o: still(100), r: still(0),
      p: anim([
        [52, [400, 300, 0], easeOut],
        ...JOLTS.map(([jx, jy], i) => [53 + i * 1.5, [400 + jx, 300 + jy, 0], easeInOut]),
      ]),
      a: still([400, 300, 0]), s: still([100, 100, 100]),
    },
    ao: 0, ip: 0, op: OP, st: 0, bm: 0,
  };
  // plates slam down from above
  const slam = (nm, t0) => {
    const [cx, cy] = ctr(nm);
    return vlayer(WIND[nm], nm, {
      o: anim([[t0, 0, easeOut], [t0 + 5, 100]]),
      r: still(0),
      p: anim([
        [t0, [px(cx), py(cy) - 50, 0], easeIn],
        [t0 + 7, [px(cx), py(cy) + 3, 0], easeInOut],
        [t0 + 11, [px(cx), py(cy), 0]],
      ]),
      s: still([S, S, 100]),
    }, { parent: 50 });
  };
  // the m stamps in big-to-fit
  const m = vlayer(3, 'm', {
    o: anim([[34, 0, easeOut], [39, 100]]),
    r: still(0),
    p: still([px(ctr('m')[0]), py(ctr('m')[1]), 0]),
    s: anim([
      [34, [S * 1.7, S * 1.7, 100], easeIn],
      [41, [S * 0.96, S * 0.96, 100], easeInOut],
      [45, [S, S, 100], easeInOut],
      [96, [S, S, 100], easeInOut],
      [103, [S * 1.05, S * 1.05, 100], easeInOut],
      [110, [S, S, 100], easeInOut],
      [156, [S, S, 100], easeInOut],
      [163, [S * 1.05, S * 1.05, 100], easeInOut],
      [170, [S, S, 100], easeInOut],
    ]),
  }, { parent: 50 });
  // the C cluster drives in from the right and hits the connector,
  // anchored at its left edge so the squash drives into the hit
  const [cx0, cy0, cx1, cy1] = VEC.C.bbox;
  const Ccy = (cy0 + cy1) / 2;
  const C = {
    ...vlayer(4, 'C', {
      o: anim([[42, 0, easeOut], [46, 100]]),
      r: still(0),
      p: anim([
        [42, [px(cx0) + 90, py(Ccy), 0], easeIn],
        [52, [px(cx0), py(Ccy), 0]],
      ]),
      s: anim([
        [42, [S * 1.08, S * 0.96, 100], easeInOut],
        [51, [S * 1.08, S * 0.96, 100], easeInOut],
        [54, [S * 0.86, S * 1.1, 100], easeInOut],
        [59, [S * 1.05, S * 0.97, 100], easeInOut],
        [64, [S, S, 100], easeInOut],
        [96, [S, S, 100], easeInOut],
        [103, [S * 1.05, S * 1.05, 100], easeInOut],
        [110, [S, S, 100], easeInOut],
        [156, [S, S, 100], easeInOut],
        [163, [S * 1.05, S * 1.05, 100], easeInOut],
        [170, [S, S, 100], easeInOut],
      ]),
    }, { parent: 50 }),
  };
  C.ks.a = still([cx0, Ccy, 0]);
  // sparks from the connector node on impact
  const spark = (ind, deg, dist, len, color) => {
    const rad = (deg * Math.PI) / 180;
    const sx = px(NODE[0]);
    const sy = py(NODE[1]);
    return {
      ddd: 0, ind, ty: 4, nm: `spark-${ind}`, sr: 1, parent: 50,
      ks: {
        o: anim([[51.5, 0, null, true], [52, 90, easeOut], [66, 0]]),
        r: still(deg + 90),
        p: anim([[52, [sx, sy, 0], easeOut], [66, [sx + Math.cos(rad) * dist, sy + Math.sin(rad) * dist, 0]]]),
        a: still([0, 0, 0]),
        s: anim([[52, [100, 100, 100], easeOut], [66, [30, 30, 100]]]),
      },
      ao: 0,
      shapes: [{ ty: 'gr', nm: 'spark', it: [
        { ty: 'rc', nm: 'rect', p: still([0, 0]), s: still([3.5, len]), r: still(2) },
        { ty: 'fl', nm: 'fill', c: still(color), o: still(100), r: 1 },
        TR,
      ] }],
      ip: 0, op: OP, st: 0, bm: 0,
    };
  };
  return doc('GymConnect — loading v2 (the power rep)', [
    ring(60, ...NODE, [52, 96, 156], 140, 4, LIME),
    ring(61, ...NODE, [55], 190, 2.5, TEAL),
    spark(30, 50, 90, 13, LIME), spark(31, 130, 85, 12, TEAL), spark(32, 230, 88, 13, LIME), spark(33, 310, 92, 14, TEAL),
    slam('G', 6), slam('y', 9),
    m, C,
    slam('o', 12), slam('n1', 15), slam('n2', 18), slam('e', 21), slam('c', 24), slam('t', 27),
    shake,
  ]);
};

for (const [fn, file] of [
  [buildV1, 'gymconnect-loading.json'],
  [buildV2, 'gymconnect-loading-v2.json'],
]) {
  const d = fn();
  const out = join(root, `public/${file}`);
  writeFileSync(out, JSON.stringify(d));
  console.log(`wrote ${out} (${(JSON.stringify(d).length / 1024).toFixed(0)} KB)`);
}
