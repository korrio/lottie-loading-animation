/**
 * Generates public/geometry-loading.json — "the shapes keep turning".
 *
 * A study after the isometric-wireframe reference: the same eight solids,
 * drawn as ink wireframes on isometric graph paper, each moving in place —
 *   1. three-cube cluster    (wobbles, cubes bobbing individually)
 *   2. icosahedron           (spins 72° = one 5-fold step per loop)
 *   3. hexagon with a cube   (static silhouette, inner cube sways)
 *   4. 2×2×2 lattice         (wobbles)
 *   5. 3D plus of 7 cubes    (spins 90°)
 *   6. octahedron            (spins 90°)
 *   7. nested tesseract      (outer & inner counter-sway, corners linked)
 *   8. triangulated pyramid  (spins 90°)
 * Every solid is true 3D geometry rotated and isometrically projected per
 * sampled frame; spins advance exactly one symmetry angle per 120-frame
 * loop and sways are sinusoids of period 120, so the loop is seamless.
 * Each solid's whole edge graph is drawn as ONE stroke (DFS with retraces
 * — invisible at full opacity) to keep the JSON small.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

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
const tr = () => ({
  ty: 'tr',
  p: still([0, 0]),
  a: still([0, 0]),
  s: still([100, 100]),
  r: still(0),
  o: still(100),
  sk: still(0),
  sa: still(0),
});

const INK = [0.08, 0.063, 0.047, 1];
const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

const proj = ([x, y, z]) => [(x - z) * COS30, (x + z) * SIN30 - y];
const rotY = ([x, y, z], th) => [x * Math.cos(th) + z * Math.sin(th), y, -x * Math.sin(th) + z * Math.cos(th)];
const loopPhase = (t) => (2 * Math.PI * (t - 90)) / 120;

// ------------------------------------------------------- solid builders -----
// A solid is { v, e, move(t) -> projected 2D pts (pre-scale) }.

const cubeVE = (cx, cy, cz, h) => {
  const v = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) v.push([cx + sx * h, cy + sy * h, cz + sz * h]);
  const e = [
    [0, 1], [2, 3], [4, 5], [6, 7],
    [0, 2], [1, 3], [4, 6], [5, 7],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  return { v, e };
};

const merge = (parts) => {
  const v = [];
  const e = [];
  for (const p of parts) {
    const off = v.length;
    v.push(...p.v);
    e.push(...p.e.map(([a, b]) => [a + off, b + off]));
  }
  return { v, e };
};

const spinMove = (v, sym) => (t) => {
  const th = (sym * (t - 90)) / 120;
  return v.map((p) => proj(rotY(p, th)));
};
const wobbleMove = (v, amp) => (t) => {
  const th = amp * Math.sin(loopPhase(t));
  return v.map((p) => proj(rotY(p, th)));
};

// 1. three-cube cluster — wobble + per-cube bob
const cubeCluster = () => {
  const { v, e } = merge([cubeVE(-0.55, 0.52, 0.3, 0.5), cubeVE(0.55, 0.52, -0.15, 0.5), cubeVE(-0.05, -0.52, 0.05, 0.5)]);
  const move = (t) => {
    const th = 0.16 * Math.sin(loopPhase(t));
    return v.map((p, i) => {
      const cubeIdx = Math.floor(i / 8);
      const bob = 0.07 * Math.sin(loopPhase(t) + cubeIdx * 2.1);
      const [x, y, z] = rotY(p, th);
      return proj([x, y + bob, z]);
    });
  };
  return { v, e, move };
};

// 2. icosahedron — spins one 5-fold step
const icosahedron = () => {
  const v = [[0, -1.05, 0], [0, 1.05, 0]];
  const yr = 1.05 / Math.sqrt(5);
  const rr = (2 * 1.05) / Math.sqrt(5);
  for (let k = 0; k < 5; k++) {
    const a = (Math.PI * 2 * k) / 5;
    v.push([rr * Math.cos(a), -yr, rr * Math.sin(a)]);
  }
  for (let k = 0; k < 5; k++) {
    const a = (Math.PI * 2 * k) / 5 + Math.PI / 5;
    v.push([rr * Math.cos(a), yr, rr * Math.sin(a)]);
  }
  const e = [];
  for (let k = 0; k < 5; k++) {
    const u = 2 + k;
    const un = 2 + ((k + 1) % 5);
    const l = 7 + k;
    const ln = 7 + ((k + 1) % 5);
    e.push([0, u], [1, l], [u, un], [l, ln], [u, l], [un, l]);
  }
  return { v, e, move: spinMove(v, (2 * Math.PI) / 5) };
};

// 3. hexagon silhouette with a swaying cube inside, corners linked
const hexCube = () => {
  const hexR = 1.55;
  const hex = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI * (30 + 60 * k)) / 180;
    hex.push([hexR * Math.cos(a), -hexR * Math.sin(a)]);
  }
  const inner = cubeVE(0, 0, 0, 0.52);
  const v = [...hex.map((p) => [p[0], p[1], 0]), ...inner.v];
  const e = [];
  for (let k = 0; k < 6; k++) e.push([k, (k + 1) % 6]);
  e.push(...inner.e.map(([a, b]) => [a + 6, b + 6]));
  const move = (t) => {
    const th = 0.42 * Math.sin(loopPhase(t));
    const pts = hex.map((p) => [...p]);
    const cubePts = inner.v.map((p) => proj(rotY(p, th)));
    pts.push(...cubePts);
    return pts;
  };
  // link alternating hexagon corners to their nearest cube corner (at rest)
  const rest = move(90);
  for (const hk of [0, 2, 4]) {
    let best = 6;
    let bd = 1e9;
    for (let ci = 6; ci < rest.length; ci++) {
      const d = Math.hypot(rest[hk][0] - rest[ci][0], rest[hk][1] - rest[ci][1]);
      if (d < bd) {
        bd = d;
        best = ci;
      }
    }
    e.push([hk, best]);
  }
  return { v, e, move };
};

// 4. 2×2×2 lattice — wobble
const lattice = () => {
  const c = cubeVE(0, 0, 0, 1);
  const cross = { v: [], e: [] };
  for (const [ax, sg] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]]) {
    const mk = (u, w) => {
      const p = [0, 0, 0];
      p[ax] = sg;
      p[(ax + 1) % 3] = u;
      p[(ax + 2) % 3] = w;
      return p;
    };
    const o = cross.v.length;
    cross.v.push(mk(-1, 0), mk(1, 0), mk(0, -1), mk(0, 1));
    cross.e.push([o, o + 1], [o + 2, o + 3]);
  }
  const m = merge([c, cross]);
  return { ...m, move: wobbleMove(m.v, 0.18) };
};

// 5. 3D plus of 7 cubes — spins 90°
const plusCluster = () => {
  const h = 0.36;
  const s = 0.74;
  const m = merge([
    cubeVE(0, 0, 0, h),
    cubeVE(s, 0, 0, h),
    cubeVE(-s, 0, 0, h),
    cubeVE(0, 0, s, h),
    cubeVE(0, 0, -s, h),
    cubeVE(0, s, 0, h),
    cubeVE(0, -s, 0, h),
  ]);
  return { ...m, move: spinMove(m.v, Math.PI / 2) };
};

// 6. octahedron — spins 90°, with its polar seam edge
const octahedron = () => {
  const v = [[0, -1.35, 0], [0, 1.35, 0], [0.95, 0, 0], [0, 0, 0.95], [-0.95, 0, 0], [0, 0, -0.95]];
  const e = [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 3], [3, 4], [4, 5], [5, 2],
    [0, 1],
  ];
  return { v, e, move: spinMove(v, Math.PI / 2) };
};

// 7. nested tesseract — outer & inner counter-sway, corners linked
const tesseract = () => {
  const outer = cubeVE(0, 0, 0, 1.02);
  const inner = cubeVE(0, 0, 0, 0.46);
  const m = merge([outer, inner]);
  for (let i = 0; i < 8; i++) m.e.push([i, i + 8]);
  const move = (t) => {
    const a = 0.2 * Math.sin(loopPhase(t));
    const b = -0.34 * Math.sin(loopPhase(t));
    return m.v.map((p, i) => proj(rotY(p, i < 8 ? a : b)));
  };
  return { ...m, move };
};

// 8. triangulated pyramid — spins 90°
const triPyramid = () => {
  const apex = [0, -1.0, 0];
  const base = [];
  for (let k = 0; k < 4; k++) {
    const a = (Math.PI * (45 + 90 * k)) / 180;
    base.push([1.45 * Math.cos(a), 0.62, 1.45 * Math.sin(a)]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
  const v = [apex, ...base];
  const e = [];
  const slantMid = [];
  for (let k = 0; k < 4; k++) {
    v.push(mid(apex, base[k]));
    slantMid.push(v.length - 1);
  }
  const baseMid = [];
  for (let k = 0; k < 4; k++) {
    v.push(mid(base[k], base[(k + 1) % 4]));
    baseMid.push(v.length - 1);
  }
  for (let k = 0; k < 4; k++) {
    e.push([0, 1 + k]); // slant edges
    e.push([1 + k, 1 + ((k + 1) % 4)]); // base edges
    e.push([slantMid[k], slantMid[(k + 1) % 4]]); // belt
    e.push([slantMid[k], baseMid[k]]); // face subdivision
    e.push([slantMid[(k + 1) % 4], baseMid[k]]);
  }
  return { v, e, move: spinMove(v, Math.PI / 2) };
};

// ------------------------------------------------------------- layout -------
const SOLIDS = [
  [cubeCluster, 168, 142, 50, 0.0],
  [icosahedron, 400, 132, 62, 1.1],
  [hexCube, 640, 140, 55, 2.2],
  [lattice, 288, 300, 48, 3.3],
  [plusCluster, 535, 300, 55, 4.4],
  [octahedron, 165, 462, 55, 5.5],
  [tesseract, 400, 466, 54, 6.6],
  [triPyramid, 635, 460, 60, 7.7],
];

// walk each connected component of the edge graph as one stroke, retracing
// when backtracking (overdraw is invisible at full opacity)
const strokeOrders = (solid) => {
  const adj = solid.v.map(() => []);
  solid.e.forEach(([a, b], i) => {
    adj[a].push([b, i]);
    adj[b].push([a, i]);
  });
  const seen = new Set();
  const orders = [];
  const walk = (u, order) => {
    for (const [w, ei] of adj[u]) {
      if (seen.has(ei)) continue;
      seen.add(ei);
      order.push(w);
      walk(w, order);
      order.push(u);
    }
  };
  solid.e.forEach(([a], i) => {
    if (seen.has(i)) return;
    const order = [a];
    walk(a, order);
    orders.push(order);
  });
  return orders;
};

const solidLayer = (ind, builder, x, y, scalePx, phase, t0) => {
  const solid = builder();
  const orders = strokeOrders(solid);
  const keysPer = orders.map(() => []);
  for (let t = 0; t <= 210; t += 6) {
    const pts = solid.move(t).map(([px, py]) => [Math.round(px * scalePx * 10) / 10, Math.round(py * scalePx * 10) / 10]);
    orders.forEach((order, oi) => {
      const v = order.map((vi) => pts[vi]);
      const k = { t, s: [{ c: false, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) }] };
      if (t < 210) {
        k.o = linear.o;
        k.i = linear.i;
      }
      keysPer[oi].push(k);
    });
  }
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: `solid-${ind}`,
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: {
      o: anim([
        [t0, 0, linear],
        [t0 + 8, 100],
      ]),
      r: still(0),
      p: anim([
        [90, [x, y + 3 * Math.sin(phase), 0], easeInOut],
        [120, [x, y + 3 * Math.sin(phase + Math.PI / 2), 0], easeInOut],
        [150, [x, y + 3 * Math.sin(phase + Math.PI), 0], easeInOut],
        [180, [x, y + 3 * Math.sin(phase + 1.5 * Math.PI), 0], easeInOut],
        [210, [x, y + 3 * Math.sin(phase), 0]],
      ]),
      a: still([0, 0, 0]),
      s: anim([
        [t0, [0, 0, 100], easeOut],
        [t0 + 10, [106, 106, 100], easeInOut],
        [t0 + 16, [100, 100, 100]],
      ]),
    },
    shapes: [
      {
        ty: 'gr',
        nm: `solid-${ind}-g`,
        it: [
          ...keysPer.map((keys) => ({ ty: 'sh', ks: { a: 1, k: keys } })),
          { ty: 'st', c: still(INK), o: still(100), w: still(2.6), lc: 2, lj: 2 },
          tr(),
        ],
      },
    ],
  };
};

const solids = SOLIDS.map(([b, x, y, s, ph], i) => solidLayer(1 + i, b, x, y, s, ph, 4 + i * 5));

// ------------------------------------------------- isometric graph paper ----
const gridPaths = [];
const SP = 46;
const slope = Math.tan(Math.PI / 6);
for (let c = -Math.ceil(800 * slope); c <= 600 + Math.ceil(800 * slope); c += SP) {
  gridPaths.push({ ty: 'sh', ks: { a: 0, k: { c: false, v: [[0, c], [800, Math.round((c + 800 * slope) * 10) / 10]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] } } });
  gridPaths.push({ ty: 'sh', ks: { a: 0, k: { c: false, v: [[0, Math.round((c + 800 * slope) * 10) / 10], [800, c]], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] } } });
}

const paper = {
  ddd: 0,
  ind: 15,
  ty: 4,
  nm: 'paper-grid',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: { o: still(46), r: still(0), p: still([0, 0, 0]), a: still([0, 0, 0]), s: still([100, 100, 100]) },
  shapes: [
    {
      ty: 'gr',
      nm: 'grid-g',
      it: [...gridPaths, { ty: 'st', c: still([0.878, 0.871, 0.855, 1]), o: still(100), w: still(1), lc: 1, lj: 1 }, tr()],
    },
  ],
};

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
  sc: '#fbfaf7',
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// ---------------------------------------------------------------- compose ---
const lottie = {
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm: 'GEOMETRY — loading (the shapes keep turning)',
  ddd: 0,
  assets: [],
  layers: [...solids, paper, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/geometry-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
