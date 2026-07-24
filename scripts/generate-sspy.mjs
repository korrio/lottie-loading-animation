/**
 * Generates public/sspy-loading.json — a self-contained Lottie loading
 * animation for สร้างสรรค์ปัญญา (Creative Intelligent).
 *
 * Story: the pen nib rises, the idea-bulb pops out of it, rays burst,
 * then the Thai name and English subtitle appear. In the loop the bulb
 * glows with a gentle beat and the rays shimmer.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90]   intro   [90..210] seamless loop (pulse period 60, dots 40)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/sspy', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };

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
const IMAGES = [
  { id: 'rays', w: 327, h: 135 },
  { id: 'bulb', w: 237, h: 353 },
  { id: 'nib', w: 179, h: 285 },
  { id: 'handle', w: 275, h: 28 },
  { id: 'thai', w: 795, h: 113 },
  { id: 'eng', w: 873, h: 44 },
];

const assets = IMAGES.map(({ id, w, h }) => ({
  id,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(`${id}.png`)}`,
  e: 1,
}));

const layer = (ind, refId, ks) => {
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
  };
};

// icon logo coords → comp: y = 88 + (ly - 49) * 0.42, x = 400 (all centered)
const K = 0.42;
const ICON_S = K * 100; // layer scale for icon parts (cropped at native res)
const yy = (ly) => 88 + (ly - 49) * K;

// pulse cycles anchored at 42 (period 60) — strictly periodic across 90→210
const pulse = (lo, hi) => {
  const beats = [];
  for (let c = 42; c <= OP + 20; c += 60) {
    beats.push(
      [c, [lo, lo, 100], easeInOut],
      [c + 22, [hi, hi, 100], easeInOut],
      [c + 44, [lo, lo, 100], easeInOut],
    );
  }
  return beats;
};

// --- rays: burst out, then shimmer (anchored at bottom-center, near bulb) --
const rays = layer(1, 'rays', {
  a: still([163.5, 135, 0]),
  o: anim([
    [34, 0, easeOut],
    [42, 100],
  ]),
  r: still(0),
  p: still([400, yy(184), 0]),
  s: anim([
    [34, [0, 0, 100], easeOut],
    [44, [ICON_S * 1.15, ICON_S * 1.15, 100], easeInOut],
    [52, [ICON_S, ICON_S, 100], easeInOut],
    ...pulse(ICON_S, ICON_S * 1.08),
  ]),
});

// --- bulb: pops out of the socket with overshoot, then glows ---------------
const bulb = layer(2, 'bulb', {
  a: still([118.5, 353, 0]), // anchored at its base so it grows from the nib
  o: anim([
    [22, 0, easeOut],
    [30, 100],
  ]),
  r: still(0),
  p: still([400, yy(504), 0]),
  s: anim([
    [22, [0, 0, 100], easeOut],
    [34, [ICON_S * 1.1, ICON_S * 1.1, 100], easeInOut],
    [42, [ICON_S, ICON_S, 100], easeInOut],
    ...pulse(ICON_S, ICON_S * 1.025),
  ]),
});

// --- nib: rises up from below --------------------------------------------
const nib = layer(3, 'nib', {
  o: anim([
    [4, 0, easeOut],
    [14, 100],
  ]),
  r: still(0),
  s: still([ICON_S, ICON_S, 100]),
  p: anim([
    [4, [400, yy(647.5) + 46, 0], easeOut],
    [20, [400, yy(647.5), 0]],
  ]),
});

// --- handle: the bezier node stretches open -------------------------------
const handle = layer(4, 'handle', {
  o: anim([
    [14, 0, easeOut],
    [22, 100],
  ]),
  r: still(0),
  p: still([400, yy(806), 0]),
  s: anim([
    [14, [0, ICON_S, 100], easeOut],
    [26, [ICON_S * 1.06, ICON_S, 100], easeInOut],
    [32, [ICON_S, ICON_S, 100]],
  ]),
});

// --- glow: soft radial halo behind the bulb, breathes with the pulse -------
const GLOW_X = 400;
const GLOW_Y = yy(295); // centered on the bulb glass
const glowPulseO = [];
const glowPulseS = [];
for (let c = 42; c <= OP + 20; c += 60) {
  glowPulseO.push([c, 62, easeInOut], [c + 22, 95, easeInOut], [c + 44, 62, easeInOut]);
  glowPulseS.push(
    [c, [100, 100, 100], easeInOut],
    [c + 22, [114, 114, 100], easeInOut],
    [c + 44, [100, 100, 100], easeInOut],
  );
}
const glow = {
  ddd: 0,
  ind: 8,
  ty: 4,
  nm: 'glow',
  sr: 1,
  ks: {
    o: anim([
      [24, 0, easeOut],
      [38, 62, easeInOut],
      ...glowPulseO,
    ]),
    r: still(0),
    p: still([GLOW_X, GLOW_Y, 0]),
    a: still([0, 0, 0]),
    s: anim([
      [24, [0, 0, 100], easeOut],
      [40, [112, 112, 100], easeInOut],
      [48, [100, 100, 100], easeInOut],
      ...glowPulseS,
    ]),
  },
  ao: 0,
  shapes: [
    {
      ty: 'gr',
      nm: 'halo',
      it: [
        { ty: 'el', nm: 'circle', p: still([0, 0]), s: still([300, 300]) },
        {
          ty: 'gf',
          nm: 'halo-grad',
          o: still(100),
          r: 1,
          bm: 0,
          t: 2,
          s: still([0, 0]),
          e: still([150, 0]),
          g: {
            p: 3,
            k: still([
              // warm yellow core → transparent edge
              0, 0.973, 0.855, 0.427, 0.45, 0.969, 0.816, 0.322, 1, 0.969, 0.816, 0.322,
              0, 0.55, 0.45, 0.28, 1, 0,
            ]),
          },
        },
        {
          ty: 'tr',
          p: still([0, 0]),
          a: still([0, 0]),
          s: still([100, 100]),
          r: still(0),
          o: still(100),
          sk: still(0),
          sa: still(0),
        },
      ],
    },
  ],
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// --- text: Thai name, then English subtitle -------------------------------
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

const thai = reveal(5, 'thai', 468, 42, 58, 60);
const eng = reveal(6, 'eng', 521, 52, 68, 50);

// --- loading dots: tri-color (yellow / teal / brown) -----------------------
const COLORS = [
  [0.961, 0.784, 0.259, 1], // #f5c842 yellow
  [0.306, 0.541, 0.588, 1], // #4e8a96 teal
  [0.42, 0.329, 0.259, 1], // #6b5442 brown
];

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
  ind: 7,
  ty: 4,
  nm: 'loading-dots',
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([400, 566, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [dotGroup(-32, 0, COLORS[0]), dotGroup(0, 13, COLORS[1]), dotGroup(32, 27, COLORS[2])],
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
  nm: 'สร้างสรรค์ปัญญา — loading',
  ddd: 0,
  assets,
  layers: [rays, bulb, glow, nib, handle, thai, eng, dots],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/sspy-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
