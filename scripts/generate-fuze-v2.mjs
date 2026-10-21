/**
 * Generates FUZE TRAINING v2 — pure vector draw-on, in two editions:
 *
 *   fuze-loading-v2-1.json  v2.1 — draw & spark, white (for dark surfaces)
 *   fuze-loading-v2-2.json  v2.2 — draw & spark, black (for light surfaces)
 *   fuze-loading-v3-1.json  v3.1 — the convergence, white: X and FUZE charge
 *                           in from the left, TRAINING from the right, and
 *                           the divider stamps down where they meet
 *   fuze-loading-v3-2.json  v3.2 — the convergence, black
 *
 * The official fuze-logo-white.png was vectorized with potrace (per-component,
 * bezier paths in scripts/fuze-vec.json; also emitted as public/fuze-logo-white.svg).
 * Story: the X-mark's outline draws itself on and fills, FUZE follows letter
 * by letter the same way, the divider drops, TRAINING pops in. On loop an
 * energy spark runs around the X silhouette while the mark beats twice —
 * the v1 pulse heritage. Transparent background per house rule.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const VEC = JSON.parse(readFileSync(join(root, 'scripts/fuze-vec.json'), 'utf8'));

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
const R1 = (v) => Math.round(v * 10) / 10;

const K = 0.68; // logo px → comp px (1000 → 680)
const OX = 60;
const OY = R1(300 - 60 * K); // 259.2, logo v-centered

const sh = (p) => ({ ty: 'sh', ks: { a: 0, k: { c: true, v: p.v, i: p.i, o: p.o } } });

// comp indices in scripts/fuze-vec.json (sorted by x):
// 0 X-mark · 1-4 F U Z E · 5 divider · 6-13 T R A I N I N G
const [XM, F, U, Z, E, DIV, ...TRAIN] = VEC;

const compLayer = (ind, comp, nm, { fillO, strokeE, strokeO, scaleKs, posKs, color }) => {
  const [x0, y0, x1, y1] = comp.bbox;
  const w = x1 - x0;
  const h = y1 - y0;
  const cx = OX + (x0 + w / 2) * K;
  const cy = OY + (y0 + h / 2) * K;
  const groups = [];
  if (strokeE) {
    groups.push({
      ty: 'gr',
      nm: 'draw',
      it: [
        ...comp.paths.map(sh),
        { ty: 'tm', s: still(0), e: strokeE, o: still(0), m: 1 },
        { ty: 'st', c: still(color), o: strokeO, w: still(3.2), lc: 2, lj: 2 },
        tr(),
      ],
    });
  }
  groups.push({
    ty: 'gr',
    nm: 'fill',
    it: [...comp.paths.map(sh), { ty: 'fl', c: still(color), o: fillO, r: 2 }, tr()],
  });
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
    ks: {
      o: still(100),
      r: still(0),
      p: posKs ?? still([R1(cx), R1(cy), 0]),
      a: still([w / 2, h / 2, 0]),
      s: scaleKs ?? still([K * 100, K * 100, 100]),
    },
    shapes: groups,
  };
};

const drawnIn = (t0, drawDur = 14) => ({
  strokeE: anim([
    [t0, 0, easeInOut],
    [t0 + drawDur, 100],
  ]),
  strokeO: anim([
    [t0 + drawDur + 2, 100, linear],
    [t0 + drawDur + 10, 0],
  ]),
  fillO: anim([
    [t0 + drawDur - 4, 0, linear],
    [t0 + drawDur + 4, 100],
  ]),
});

const build = (edition, color) => {
  // X-mark: draws on first, then beats twice per loop (the v1 pulse heritage)
  const xLayer = compLayer(10, XM, 'x-mark', {
    ...drawnIn(4, 20),
    color,
    scaleKs: anim([
      [88, [K * 100, K * 100, 100], easeOut],
      [96, [K * 102.5, K * 102.5, 100], easeInOut],
      [106, [K * 100, K * 100, 100], easeInOut],
      [150, [K * 100, K * 100, 100], easeOut],
      [158, [K * 102.5, K * 102.5, 100], easeInOut],
      [168, [K * 100, K * 100, 100], easeInOut],
      [210, [K * 100, K * 100, 100]],
    ]),
  });

  const letters = [F, U, Z, E].map((comp, i) =>
    compLayer(11 + i, comp, `fuze-${i}`, { ...drawnIn(16 + i * 6, 12), color })
  );

  // divider: drops down into place
  const [dx0, dy0, dx1, dy1] = DIV.bbox;
  const divider = {
    ...compLayer(15, DIV, 'divider', { fillO: anim([[48, 0, linear], [52, 100]]), color }),
    ks: {
      o: still(100),
      r: still(0),
      p: still([R1(OX + (dx0 + (dx1 - dx0) / 2) * K), R1(OY + dy0 * K), 0]),
      a: still([(dx1 - dx0) / 2, 0, 0]),
      s: anim([
        [48, [K * 100, 0, 100], easeOut],
        [58, [K * 100, K * 100, 100]],
      ]),
    },
  };

  const training = TRAIN.map((comp, i) =>
    compLayer(16 + i, comp, `train-${i}`, {
      fillO: anim([
        [54 + i * 3, 0, linear],
        [57 + i * 3, 100],
      ]),
      color,
      scaleKs: anim([
        [54 + i * 3, [0, 0, 100], easeOut],
        [59 + i * 3, [K * 112, K * 112, 100], easeInOut],
        [63 + i * 3, [K * 100, K * 100, 100]],
      ]),
    })
  );

  // loop spark: a short dash of the outline racing around the X silhouette
  const [sx0, sy0, sx1, sy1] = XM.bbox;
  const spark = {
    ddd: 0,
    ind: 2,
    ty: 4,
    nm: 'spark',
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: {
      o: anim([
        [89, 0, linear],
        [90, 75],
      ]),
      r: still(0),
      p: still([R1(OX + (sx0 + (sx1 - sx0) / 2) * K), R1(OY + (sy0 + (sy1 - sy0) / 2) * K), 0]),
      a: still([(sx1 - sx0) / 2, (sy1 - sy0) / 2, 0]),
      s: still([K * 100, K * 100, 100]),
    },
    shapes: [
      {
        ty: 'gr',
        nm: 'spark-g',
        it: [
          ...XM.paths.map(sh),
          {
            ty: 'tm',
            s: still(0),
            e: still(7),
            o: anim([
              [90, 0, linear],
              [210, 360],
            ]),
            m: 1,
          },
          { ty: 'st', c: still(color), o: still(100), w: still(4.5), lc: 2, lj: 2 },
          tr(),
        ],
      },
    ],
  };

  return {
    v: '5.9.6',
    fr: FR,
    ip: 0,
    op: OP,
    w: 800,
    h: 600,
    nm: `FUZE — draw & spark (${edition})`,
    ddd: 0,
    assets: [],
    layers: [spark, xLayer, ...letters, divider, ...training],
    markers: [
      { tm: 0, cm: 'intro', dr: 90 },
      { tm: 90, cm: 'loop', dr: 120 },
    ],
  };
};

// ============================================================================
// v3 — the convergence: FUZE from the left, TRAINING from the right
// ============================================================================
const slideLayer = (ind, comp, nm, color, t0, fromLeft, scaleKs) => {
  const [x0, y0, x1, y1] = comp.bbox;
  const w = x1 - x0;
  const h = y1 - y0;
  const cx = R1(OX + (x0 + w / 2) * K);
  const cy = R1(OY + (y0 + h / 2) * K);
  const startX = fromLeft ? -(w * K) / 2 - 30 : 800 + (w * K) / 2 + 30;
  const over = fromLeft ? 12 : -12;
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
    ks: {
      o: still(100),
      r: still(0),
      p: anim([
        [t0, [R1(startX), cy, 0], easeOut],
        [t0 + 16, [R1(cx + over), cy, 0], easeInOut],
        [t0 + 22, [cx, cy, 0]],
      ]),
      a: still([w / 2, h / 2, 0]),
      s: scaleKs ?? still([K * 100, K * 100, 100]),
    },
    shapes: [
      { ty: 'gr', nm: 'fill', it: [...comp.paths.map(sh), { ty: 'fl', c: still(color), o: still(100), r: 2 }, tr()] },
    ],
  };
};

const build3 = (edition, color) => {
  // X leads the left charge and pulses on the divider stamp + loop beats
  const xScale = anim([
    [46, [K * 100, K * 100, 100], easeOut],
    [52, [K * 102.5, K * 102.5, 100], easeInOut],
    [60, [K * 100, K * 100, 100], easeInOut],
    [96, [K * 100, K * 100, 100], easeOut],
    [104, [K * 102.5, K * 102.5, 100], easeInOut],
    [114, [K * 100, K * 100, 100], easeInOut],
    [158, [K * 100, K * 100, 100], easeOut],
    [166, [K * 102.5, K * 102.5, 100], easeInOut],
    [176, [K * 100, K * 100, 100], easeInOut],
    [210, [K * 100, K * 100, 100]],
  ]);
  const left = [XM, F, U, Z, E].map((comp, i) =>
    slideLayer(10 + i, comp, `left-${i}`, color, 6 + (i === 0 ? 0 : 4 + (i - 1) * 3), true, i === 0 ? xScale : null)
  );
  const right = TRAIN.map((comp, i) => slideLayer(16 + i, comp, `right-${i}`, color, 12 + i * 1.8, false, null));

  // divider stamps down where the two sides meet
  const [dx0, dy0, dx1, dy1] = DIV.bbox;
  const divider = {
    ddd: 0,
    ind: 15,
    ty: 4,
    nm: 'divider',
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: {
      o: anim([
        [44, 0, linear],
        [46, 100],
      ]),
      r: still(0),
      p: still([R1(OX + (dx0 + (dx1 - dx0) / 2) * K), R1(OY + dy0 * K), 0]),
      a: still([(dx1 - dx0) / 2, 0, 0]),
      s: anim([
        [44, [K * 100, 0, 100], easeOut],
        [50, [K * 100, K * 112, 100], easeInOut],
        [56, [K * 100, K * 100, 100]],
      ]),
    },
    shapes: [
      { ty: 'gr', nm: 'fill', it: [...DIV.paths.map(sh), { ty: 'fl', c: still(color), o: still(100), r: 2 }, tr()] },
    ],
  };

  // loop spark racing the X silhouette (as in v2)
  const [sx0, sy0, sx1, sy1] = XM.bbox;
  const spark = {
    ddd: 0,
    ind: 2,
    ty: 4,
    nm: 'spark',
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: {
      o: anim([
        [89, 0, linear],
        [90, 75],
      ]),
      r: still(0),
      p: still([R1(OX + (sx0 + (sx1 - sx0) / 2) * K), R1(OY + (sy0 + (sy1 - sy0) / 2) * K), 0]),
      a: still([(sx1 - sx0) / 2, (sy1 - sy0) / 2, 0]),
      s: still([K * 100, K * 100, 100]),
    },
    shapes: [
      {
        ty: 'gr',
        nm: 'spark-g',
        it: [
          ...XM.paths.map(sh),
          { ty: 'tm', s: still(0), e: still(7), o: anim([[90, 0, linear], [210, 360]]), m: 1 },
          { ty: 'st', c: still(color), o: still(100), w: still(4.5), lc: 2, lj: 2 },
          tr(),
        ],
      },
    ],
  };

  return {
    v: '5.9.6',
    fr: FR,
    ip: 0,
    op: OP,
    w: 800,
    h: 600,
    nm: `FUZE — the convergence (${edition})`,
    ddd: 0,
    assets: [],
    layers: [spark, ...left, divider, ...right],
    markers: [
      { tm: 0, cm: 'intro', dr: 90 },
      { tm: 90, cm: 'loop', dr: 120 },
    ],
  };
};

const WHITE = [1, 1, 1, 1];
const BLACK = [0.07, 0.07, 0.09, 1];
for (const [name, d] of [
  ['fuze-loading-v2-1.json', build('white', WHITE)],
  ['fuze-loading-v2-2.json', build('black', BLACK)],
  ['fuze-loading-v3-1.json', build3('white', WHITE)],
  ['fuze-loading-v3-2.json', build3('black', BLACK)],
]) {
  const file = join(root, `public/${name}`);
  writeFileSync(file, JSON.stringify(d));
  console.log(`wrote ${file} (${(JSON.stringify(d).length / 1024).toFixed(0)} KB)`);
}
