/**
 * Generates public/onepiece-loading-v3.json — "set sail" fantasy variant.
 *
 * Story: a warm anime sunburst turns slowly in a morning sky while three
 * bands of ocean roll in parallax. The jolly-roger lockup surfaces from
 * behind the waves like a ship coming over the horizon, settles afloat,
 * and bobs on the swell — front waves lapping over its keel. Seagulls
 * cross the sky during the intro and treasure glints twinkle on the mark.
 *
 * Seamless-loop math:
 *   - sun rays: 12-fold symmetry, 0.25°/frame → exactly 30° (one symmetry
 *     period) per 120-frame loop
 *   - waves: each band translates exactly one wavelength per loop
 *   - logo bob / cloud sway: sinusoid keys with period 60/120
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/onepiece', name)).toString('base64');

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

const W = 1240;
const H = 422;
const S = 51.6;

const assets = [
  { id: 'logo', w: W, h: H, u: '', p: `data:image/png;base64,${asset('logo.png')}`, e: 1 },
];

// ---------------------------------------------------------------- sky -------
const sky = {
  ddd: 0,
  ind: 15,
  ty: 4,
  nm: 'sky',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: { o: still(100), r: still(0), p: still([0, 0, 0]), a: still([0, 0, 0]), s: still([100, 100, 100]) },
  shapes: [
    {
      ty: 'gr',
      nm: 'sky-g',
      it: [
        { ty: 'rc', d: 1, s: still([800, 600]), p: still([400, 300]), r: still(0) },
        {
          ty: 'gf',
          o: still(100),
          r: 1,
          t: 1,
          s: still([400, 0]),
          e: still([400, 600]),
          g: { p: 3, k: still([0, 0.62, 0.85, 0.96, 0.5, 0.85, 0.93, 0.97, 1, 1, 0.92, 0.76]) },
        },
        tr(),
      ],
    },
  ],
};

// ------------------------------------------------------- sun + sunburst -----
const SUNX = 400;
const SUNY = 310;

const rayPaths = [];
for (let k = 0; k < 12; k++) {
  const a = (k * 30 * Math.PI) / 180;
  const w = (7 * Math.PI) / 180;
  const R = 320;
  const v = [
    [0, 0],
    [R * Math.cos(a - w), R * Math.sin(a - w)],
    [R * Math.cos(a + w), R * Math.sin(a + w)],
  ];
  rayPaths.push({ ty: 'sh', ks: { a: 0, k: { c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) } } });
}

const sunRays = {
  ddd: 0,
  ind: 10,
  ty: 4,
  nm: 'sun-rays',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [14, 0, linear],
      [34, 34],
    ]),
    r: anim([
      [0, 0, linear],
      [210, 52.5],
    ]),
    p: still([SUNX, SUNY, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  shapes: [{ ty: 'gr', nm: 'rays-g', it: [...rayPaths, { ty: 'fl', c: still([1, 0.84, 0.37, 1]), o: still(100), r: 1 }, tr()] }],
};

const sunDisk = {
  ddd: 0,
  ind: 11,
  ty: 4,
  nm: 'sun',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [10, 0, linear],
      [28, 80],
    ]),
    r: still(0),
    p: still([SUNX, SUNY, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'sun-g',
      it: [
        { ty: 'el', d: 1, s: still([260, 260]), p: still([0, 0]) },
        { ty: 'fl', c: still([0.988, 0.85, 0.35, 1]), o: still(100), r: 1 },
        tr(),
      ],
    },
  ],
};

// -------------------------------------------------------------- clouds ------
const cloudLayer = (ind, x, y, sc, phase) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm: `cloud-${ind}`,
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [4, 0, linear],
      [22, 88],
    ]),
    r: still(0),
    p: anim([
      [90, [x + 10 * Math.sin(phase), y, 0], easeInOut],
      [120, [x + 10 * Math.sin(phase + Math.PI / 2), y, 0], easeInOut],
      [150, [x + 10 * Math.sin(phase + Math.PI), y, 0], easeInOut],
      [180, [x + 10 * Math.sin(phase + 1.5 * Math.PI), y, 0], easeInOut],
      [210, [x + 10 * Math.sin(phase), y, 0]],
    ]),
    a: still([0, 0, 0]),
    s: still([sc, sc, 100]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'cloud-g',
      it: [
        { ty: 'el', d: 1, s: still([110, 44]), p: still([0, 0]) },
        { ty: 'el', d: 1, s: still([70, 36]), p: still([-42, 8]) },
        { ty: 'el', d: 1, s: still([76, 40]), p: still([40, 6]) },
        { ty: 'fl', c: still([1, 1, 1, 1]), o: still(100), r: 1 },
        tr(),
      ],
    },
  ],
});

const clouds = [cloudLayer(12, 150, 100, 100, 0), cloudLayer(13, 430, 66, 76, 2.1), cloudLayer(14, 668, 128, 88, 4.2)];

// --------------------------------------------------------------- waves ------
// band top edge = sine, translating exactly one wavelength per 120 frames
const wavePath = (ytop, A, lambda, phase) => {
  const step = 50;
  const v = [];
  const iT = [];
  const oT = [];
  for (let x = 0; x <= 800; x += step) {
    const th = (2 * Math.PI * x) / lambda + phase;
    v.push([x, ytop + A * Math.sin(th)]);
    const slope = ((A * Math.cos(th) * 2 * Math.PI) / lambda) * (step / 3);
    oT.push([step / 3, slope]);
    iT.push([-step / 3, -slope]);
  }
  v.push([800, 600], [0, 600]);
  oT.push([0, 0], [0, 0]);
  iT.push([0, 0], [0, 0]);
  return { c: true, v, i: iT, o: oT };
};

const waveLayer = (ind, nm, ytop, A, lambda, dir, phi0, color, oIn) => {
  const keys = [];
  for (let t = 0; t <= 210; t += 6) {
    const phase = phi0 + dir * 2 * Math.PI * ((t - 90) / 120);
    const k = { t, s: [wavePath(ytop, A, lambda, phase)] };
    if (t < 210) {
      k.o = linear.o;
      k.i = linear.i;
    }
    keys.push(k);
  }
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
      o: anim(oIn),
      r: still(0),
      p: still([0, 0, 0]),
      a: still([0, 0, 0]),
      s: still([100, 100, 100]),
    },
    shapes: [{ ty: 'gr', nm: `${nm}-g`, it: [{ ty: 'sh', ks: { a: 1, k: keys } }, { ty: 'fl', c: still(color), o: still(100), r: 1 }, tr()] }],
  };
};

const backWave = waveLayer(9, 'wave-back', 372, 7, 320, 1, 0, [0.49, 0.725, 0.91, 1], [
  [2, 0, linear],
  [14, 100],
]);
const midWave = waveLayer(8, 'wave-mid', 398, 9, 260, -1, 1.3, [0.263, 0.451, 0.733, 1], [
  [4, 0, linear],
  [16, 100],
]);
const frontWave = waveLayer(6, 'wave-front', 424, 11, 210, 1, 2.6, [0.145, 0.29, 0.53, 1], [
  [6, 0, linear],
  [18, 100],
]);

// ---------------------------------------------------------------- logo ------
const logo = {
  ddd: 0,
  ind: 7,
  ty: 2,
  nm: 'ship',
  refId: 'logo',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [8, 0, linear],
      [16, 100],
    ]),
    a: still([W / 2, H / 2, 0]),
    p: anim([
      [8, [400, 560, 0], easeOut],
      [36, [400, 297, 0], easeInOut],
      [62, [400, 302, 0], easeInOut],
      [90, [400, 300, 0], easeInOut],
      // afloat: rides the swell (period 120)
      [120, [400, 295, 0], easeInOut],
      [150, [400, 300, 0], easeInOut],
      [180, [400, 305, 0], easeInOut],
      [210, [400, 300, 0]],
    ]),
    r: anim([
      [8, -4, easeOut],
      [36, 1.2, easeInOut],
      [62, -0.5, easeInOut],
      [90, 0, easeInOut],
      [120, 0.7, easeInOut],
      [150, 0, easeInOut],
      [180, -0.7, easeInOut],
      [210, 0],
    ]),
    s: still([S, S, 100]),
  },
};

// ------------------------------------------------------- treasure glints ----
const starPath = (rOut, rIn) => {
  const v = [];
  for (let k = 0; k < 4; k++) {
    const a1 = ((k * 90 - 90) * Math.PI) / 180;
    const a2 = ((k * 90 - 45) * Math.PI) / 180;
    v.push([rOut * Math.cos(a1), rOut * Math.sin(a1)]);
    v.push([rIn * Math.cos(a2), rIn * Math.sin(a2)]);
  }
  return { c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) };
};

const YELLOW = [0.984, 0.788, 0.09, 1];
const WHITE = [0.988, 0.988, 0.984, 1];

// positions in the logo's own pixel space (parented → bob with the ship)
const GLINTS = [
  { nm: 'glint-hat', x: 191, y: 79, color: YELLOW, pops: [44, 128] },
  { nm: 'glint-skull', x: 363, y: 174, color: WHITE, pops: [52, 158] },
  { nm: 'glint-arrow', x: 1033, y: 85, color: YELLOW, pops: [60, 188] },
];

const glintLayers = GLINTS.map(({ nm, x, y, color, pops }, i) => {
  const sK = [];
  const rK = [];
  pops.forEach((t0) => {
    sK.push([t0, [0, 0, 100], easeOut], [t0 + 8, [100, 100, 100], easeInOut], [t0 + 16, [0, 0, 100], easeInOut]);
    rK.push([t0, 0, linear], [t0 + 16, 60, linear]);
  });
  return {
    ddd: 0,
    ind: 3 + i,
    ty: 4,
    nm,
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    parent: 7,
    ks: { o: still(100), r: anim(rK), p: still([x, y, 0]), a: still([0, 0, 0]), s: anim(sK) },
    shapes: [
      {
        ty: 'gr',
        nm: `${nm}-g`,
        it: [{ ty: 'sh', ks: { a: 0, k: starPath(52, 13) } }, { ty: 'fl', c: still(color), o: still(100), r: 1 }, tr()],
      },
    ],
  };
});

// -------------------------------------------------------------- seagulls ----
const gullShape = () => {
  const v = [
    [-16, 0],
    [0, -3],
    [16, 0],
  ];
  const iT = [
    [0, 0],
    [-6, -5],
    [-5, -4],
  ];
  const oT = [
    [5, -4],
    [6, -5],
    [0, 0],
  ];
  return { c: false, v, i: iT, o: oT };
};

const gull = (ind, x0, y0, x1, y1, t0, t1, sc) => {
  const flap = [];
  for (let t = t0; t <= t1; t += 4) {
    flap.push([t, [sc, t % 8 < 4 ? sc : sc * 0.45, 100], easeInOut]);
  }
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: `gull-${ind}`,
    sr: 1,
    ao: 0,
    ip: 0,
    op: 90,
    st: 0,
    bm: 0,
    ks: {
      o: anim([
        [t0, 0, linear],
        [t0 + 6, 100, linear],
        [t1 - 6, 100, linear],
        [t1, 0],
      ]),
      r: still(0),
      p: anim([
        [t0, [x0, y0, 0], linear],
        [t1, [x1, y1, 0]],
      ]),
      a: still([0, 0, 0]),
      s: anim(flap),
    },
    shapes: [
      {
        ty: 'gr',
        nm: 'gull-g',
        it: [
          { ty: 'sh', ks: { a: 0, k: gullShape() } },
          { ty: 'st', c: still([0.08, 0.06, 0.05, 1]), o: still(100), w: still(3.4), lc: 2, lj: 2 },
          tr(),
        ],
      },
    ],
  };
};

const gulls = [gull(1, 880, 128, -60, 104, 40, 86, 100), gull(2, 900, 178, -50, 148, 52, 88, 72)];

// ---------------------------------------------------------------- compose ---
const lottie = {
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm: 'ONE PIECE — loading v3 (set sail)',
  ddd: 0,
  assets,
  layers: [...gulls, ...glintLayers, frontWave, logo, midWave, backWave, sunRays, sunDisk, ...clouds, sky],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/onepiece-loading-v3.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
