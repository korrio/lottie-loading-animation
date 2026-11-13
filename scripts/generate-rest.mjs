/**
 * Generates public/rest-loading.json — a PURE VECTOR Lottie loading
 * animation for RE:st (Relational Structured Truth · documents that
 * work together), built from potrace-traced paths (scripts/rest-vec.json)
 * with gradient fills sampled from the source art (scripts/rest-colors.json).
 *
 * "Documents that work together": the three facets of the R mark fly in
 * from different directions like separate documents and snap together
 * into one mark. The wordmark rises, the colon dots pop, the taglines
 * settle. On loop the two colon dots exchange a sync pulse while the
 * assembled mark breathes as one piece.
 *
 * Timeline (60fps, 240 frames, 800×600): intro [0..90], loop [90..210].
 * The file is fully transparent — the page DOM supplies the background.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const VEC = JSON.parse(readFileSync(join(root, 'scripts/rest-vec.json')));
const COL = JSON.parse(readFileSync(join(root, 'scripts/rest-colors.json')));

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };

const kf = (frames) =>
  frames.map(([t, s, ease], idx) => {
    const k = { t, s: Array.isArray(s) ? s : [s] };
    if (idx !== frames.length - 1) {
      const e = ease ?? easeInOut;
      k.o = e.o;
      k.i = e.i;
    }
    return k;
  });
const anim = (frames) => ({ a: 1, k: kf(frames) });
const still = (v) => ({ a: 0, k: v });

// logo px → comp coords
const K = 0.62;
const OX = 400 - 627 * K;
const OY = 300 - 629.5 * K;
const px = (cx) => OX + cx * K;
const py = (cy) => OY + cy * K;
const S = K * 100;

const c01 = (c) => c.map((v) => Math.round((v / 255) * 1000) / 1000);

const center = (nm) => {
  const [x0, y0, x1, y1] = VEC[nm].bbox;
  return [(x0 + x1) / 2, (y0 + y1) / 2];
};

const shapes = (nm) => VEC[nm].paths.map((p) => ({ ty: 'sh', ks: { a: 0, k: { c: true, v: p.v, i: p.i, o: p.o } } }));

const TR = { ty: 'tr', p: still([0, 0]), a: still([0, 0]), s: still([100, 100]), r: still(0), o: still(100), sk: still(0), sa: still(0) };

const fillFlat = (nm) => ({ ty: 'fl', nm: 'fill', c: still([...c01(COL[nm].color), 1]), o: still(100), r: 1 });

const fillGrad = (nm) => {
  const { axis, stops } = COL[nm];
  const [s0, s1, s2] = stops.map(c01);
  return {
    ty: 'gf',
    nm: 'grad',
    o: still(100),
    r: 1,
    t: 1,
    s: still(axis[0]),
    e: still(axis[1]),
    g: { p: 3, k: still([0, ...s0, 0.5, ...s1, 1, ...s2]) },
  };
};

// vector layer: paths live in logo px coords; the layer transform maps to comp
const vlayer = (ind, nm, fill, ks, extra = {}) => {
  const [cx, cy] = center(nm);
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
    shapes: [{ ty: 'gr', nm, it: [...shapes(nm), fill, TR] }],
    ...extra,
  };
};

// --- the mark: three facets fly in like documents and snap together --------
const facet = (ind, nm, t0, fromX, fromY, fromR) => {
  const [cx, cy] = center(nm);
  return vlayer(
    ind,
    nm,
    fillGrad(nm),
    {
      o: anim([
        [t0, 0, easeOut],
        [t0 + 8, 100],
      ]),
      r: anim([
        [t0, fromR, easeOut],
        [t0 + 14, -fromR * 0.18, easeInOut],
        [t0 + 19, 0],
      ]),
      p: anim([
        [t0, [px(cx) + fromX, py(cy) + fromY, 0], easeOut],
        [t0 + 14, [px(cx) - fromX * 0.04, py(cy) - fromY * 0.04, 0], easeInOut],
        [t0 + 19, [px(cx), py(cy), 0]],
      ]),
      s: still([S, S, 100]),
    },
    { parent: 30 },
  );
};

// mark rig — the assembled mark breathes as one piece in the loop
const MX = px(627);
const MY = py(429);
const rig = {
  ddd: 0,
  ind: 30,
  ty: 3,
  nm: 'mark-rig',
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([MX, MY, 0]),
    a: still([MX, MY, 0]),
    s: anim([
      [90, [100, 100, 100], easeInOut],
      [150, [101.8, 101.8, 100], easeInOut],
      [210, [100, 100, 100]],
    ]),
  },
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// --- wordmark + taglines ---------------------------------------------------
const rise = (ind, nm, t0, dy = 26) => {
  const [cx, cy] = center(nm);
  return vlayer(ind, nm, fillFlat(nm), {
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
  });
};

// colon dots pop in, then exchange a sync pulse in the loop (alternating)
const dot = (ind, nm, t0, beats) => {
  const [cx, cy] = center(nm);
  const pulses = [];
  for (const c of beats) {
    pulses.push(
      [c, [S, S, 100], easeInOut],
      [c + 9, [S * 1.35, S * 1.35, 100], easeInOut],
      [c + 18, [S, S, 100], easeInOut],
    );
  }
  return vlayer(ind, nm, fillFlat(nm), {
    o: anim([
      [t0, 0, easeOut],
      [t0 + 6, 100],
    ]),
    r: still(0),
    p: still([px(cx), py(cy), 0]),
    s: anim([
      [t0, [0, 0, 100], easeOut],
      [t0 + 7, [S * 1.2, S * 1.2, 100], easeInOut],
      [t0 + 11, [S, S, 100], easeInOut],
      ...pulses,
    ]),
  });
};

const layers = [
  facet(1, 'mblue', 6, 40, -130, -7),
  facet(2, 'mcream', 14, -150, 20, 6),
  facet(3, 'mnavy', 22, 130, 110, 5),
  rise(4, 'R', 40),
  rise(5, 'E', 46),
  dot(6, 'dottop', 52, [96, 156]),
  dot(7, 'dotbot', 56, [126, 186]),
  rise(8, 's', 60),
  rise(9, 't', 66),
  rise(10, 'tag1', 70, 16),
  rise(11, 'tag2', 74, 14),
  rig,
];

const lottie = {
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm: 'RE:st — loading',
  ddd: 0,
  assets: [],
  layers,
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/rest-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
