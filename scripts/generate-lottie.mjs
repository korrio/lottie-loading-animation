/**
 * Generates public/spinbase-loading.json — a self-contained Lottie animation
 * of the SPIN BASE logo for use as a loading screen.
 *
 * Timeline (60fps, 240 frames):
 *   [0..90]   intro — ball drops in with bounce + squash, title/subtitle reveal
 *   [90..210] seamless loop — ball rotation covers exactly 360°, dot pulses
 *             have period 40 (120 = 3 periods), so frame 90 === frame 210
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets', name)).toString('base64');

const FR = 60;
const OP = 240;
const W = 800;
const H = 600;

// --- easing helpers -------------------------------------------------------
const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const easeIn = { o: { x: [0.55], y: [0] }, i: { x: [0.95], y: [0.8] } };
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

// --- image assets ---------------------------------------------------------
const images = [
  { id: 'seam', file: 'seam.png', w: 360, h: 371 },
  { id: 'title', file: 'title.png', w: 1000, h: 132 },
  { id: 'subtitle', file: 'subtitle.png', w: 1000, h: 63 },
];

const assets = images.map(({ id, file, w, h }) => ({
  id,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(file)}`,
  e: 1,
}));

const imageLayer = (ind, refId, ks, extra = {}) => {
  const { w, h } = images.find((i) => i.id === refId);
  return {
    ddd: 0,
    ind,
    ty: 2,
    nm: refId,
    refId,
    sr: 1,
    ks: { a: still([w / 2, h / 2, 0]), ...ks },
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ...extra,
  };
};

// --- ball: 3D sphere, seam rotates on the z-axis, lighting stays fixed -----
// The illusion: a static radial-gradient sphere + static highlight/rim shading,
// with ONLY the white S seam rotating. Fixed light + moving texture reads as a
// real 3D ball, unlike rotating the whole flat image.
const BALL_X = 400;
const BALL_Y = 212;
const BALL_CTRL = 7; // null layer index the ball parts parent to

const identityTr = {
  ty: 'tr',
  p: still([0, 0]),
  a: still([0, 0]),
  s: still([100, 100]),
  r: still(0),
  o: still(100),
  sk: still(0),
  sa: still(0),
};

const radialFill = (name, sPt, ePt, stops, alphas) => ({
  ty: 'gf',
  nm: name,
  o: still(100),
  r: 1,
  bm: 0,
  t: 2,
  s: still(sPt),
  e: still(ePt),
  g: {
    p: stops.length,
    k: still([
      ...stops.flatMap(([pos, r, g, b]) => [pos, r, g, b]),
      ...(alphas ?? []).flat(),
    ]),
  },
});

// carries the drop/bounce/squash; every ball part inherits it
const ballCtrl = {
  ddd: 0,
  ind: BALL_CTRL,
  ty: 3,
  nm: 'ball-ctrl',
  sr: 1,
  ks: {
    o: still(0),
    r: still(0),
    a: still([0, 0, 0]),
    p: anim([
      [0, [BALL_X, -190, 0], easeIn],
      [22, [BALL_X, BALL_Y, 0], easeOut],
      [34, [BALL_X, BALL_Y - 46, 0], easeIn],
      [46, [BALL_X, BALL_Y, 0], easeOut],
      [56, [BALL_X, BALL_Y - 17, 0], easeIn],
      [64, [BALL_X, BALL_Y, 0]],
    ]),
    s: anim([
      [0, [55, 55, 100], easeInOut],
      [18, [51.5, 59.5, 100], easeInOut],
      [23, [62, 46.5, 100], easeInOut],
      [30, [52.5, 58, 100], easeInOut],
      [38, [56.5, 53.5, 100], easeInOut],
      [46, [55, 55, 100]],
    ]),
  },
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
};

// static sphere body — light from the top, darker toward the bottom
const sphere = {
  ddd: 0,
  ind: 6,
  ty: 4,
  nm: 'sphere',
  parent: BALL_CTRL,
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([0, 0, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [
    {
      ty: 'gr',
      nm: 'body',
      it: [
        { ty: 'el', nm: 'circle', p: still([0, 0]), s: still([357, 368]) },
        radialFill(
          'body-grad',
          [0, -120],
          [303, -120],
          [
            [0, 0.812, 0.878, 0.122], // #cfe01f
            [0.55, 0.663, 0.737, 0.047], // #a9bc0c
            [1, 0.545, 0.627, 0.055], // #8ba00e
          ],
        ),
        identityTr,
      ],
    },
  ],
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// Earth-style rotation around the vertical axis: the sphere silhouette stays
// fixed while the seam texture sweeps across the face — enters compressed at
// the left limb, expands through the center, compresses and exits at the
// right limb (position ~sin, width ~cos of the rotation angle). Two copies
// alternate 30 frames apart so one is always crossing, like continents coming
// around. Period 60 divides the loop length (120), keeping the loop seamless.
const seamSweep = (ind, start) => {
  const p = [];
  const s = [];
  const o = [];
  for (let c = start; c <= OP + 20; c += 120) {
    // 80-frame crossing on a 120-frame period (one revolution per 2s) →
    // consecutive copies overlap by 20 frames, so a new seam is entering the
    // left limb while the previous one exits the right — never a blank ball.
    p.push([c, [-145, 0, 0], easeIn], [c + 40, [0, 0, 0], easeOut], [c + 80, [145, 0, 0], linear]);
    s.push(
      [c, [14, 100, 100], easeOut],
      [c + 40, [100, 100, 100], easeIn],
      [c + 80, [14, 100, 100], linear],
    );
    // quick fades right at the limbs; opacity stays 0 until the next crossing
    o.push([c, 0, easeInOut], [c + 10, 100, easeInOut], [c + 70, 100, easeInOut], [c + 80, 0, easeInOut]);
  }
  return imageLayer(
    ind,
    'seam',
    { o: anim(o), r: still(0), p: anim(p), s: anim(s) },
    { parent: BALL_CTRL, tt: 1 },
  );
};

// alpha matte clipping each seam copy to the sphere
const seamMatte = (ind) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm: 'seam-matte',
  parent: BALL_CTRL,
  td: 1,
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([0, 0, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [
    {
      ty: 'gr',
      nm: 'clip',
      it: [
        { ty: 'el', nm: 'circle', p: still([0, 0]), s: still([353, 364]) },
        { ty: 'fl', nm: 'fill', c: still([1, 1, 1, 1]), o: still(100), r: 1 },
        identityTr,
      ],
    },
  ],
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
});

const seamA = seamSweep(3, 26);
const seamB = seamSweep(5, 86);

// static shading on top of the seam: soft top highlight + darkened rim
const shine = {
  ddd: 0,
  ind: 1,
  ty: 4,
  nm: 'shine',
  parent: BALL_CTRL,
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([0, 0, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [
    {
      ty: 'gr',
      nm: 'rim-shade',
      it: [
        { ty: 'el', nm: 'circle', p: still([0, 0]), s: still([357, 368]) },
        radialFill(
          'rim-grad',
          [0, -60],
          [0, 190],
          [
            [0, 0.333, 0.396, 0.039], // #556509
            [0.72, 0.333, 0.396, 0.039],
            [1, 0.333, 0.396, 0.039],
          ],
          [
            [0, 0],
            [0.72, 0],
            [1, 0.4],
          ],
        ),
        identityTr,
      ],
    },
    {
      ty: 'gr',
      nm: 'highlight',
      it: [
        { ty: 'el', nm: 'glow', p: still([0, 0]), s: still([225, 122]) },
        radialFill(
          'glow-grad',
          [0, 0],
          [113, 0],
          [
            [0, 1, 1, 1],
            [0.6, 1, 1, 1],
            [1, 1, 1, 1],
          ],
          [
            [0, 0.4],
            [0.6, 0.12],
            [1, 0],
          ],
        ),
        {
          ...identityTr,
          p: still([-8, -106]),
          r: still(-6),
        },
      ],
    },
  ],
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// --- title / subtitle: fade + slide up ------------------------------------
const reveal = (ind, refId, y, t0, t1, scale) =>
  imageLayer(ind, refId, {
    o: anim([
      [t0, 0, easeOut],
      [t1, 100],
    ]),
    p: anim([
      [t0, [400, y + 22, 0], easeOut],
      [t1, [400, y, 0]],
    ]),
    s: still([scale, scale, 100]),
  });

const title = reveal(8, 'title', 380, 34, 56, 46);
const subtitle = reveal(9, 'subtitle', 432, 48, 70, 46);

// --- loading dots: pop in, then pulse with period 40 ----------------------
const GREEN = [0.678, 0.792, 0.075, 1]; // sampled from the ball

const dotGroup = (x, off) => {
  // opacity pulse: alternate 30 ↔ 100 every 20 frames, phase-shifted per dot.
  // Periodic from t=10, so v(90) === v(210) for every offset.
  const pulse = [];
  let v = 30;
  for (let t = 10 + off; t <= OP + 20; t += 20) {
    pulse.push([t, v, easeInOut]);
    v = v === 30 ? 100 : 30;
  }
  return {
    ty: 'gr',
    nm: `dot-${x}`,
    it: [
      { ty: 'el', p: still([0, 0]), s: still([15, 15]), nm: 'circle' },
      { ty: 'fl', c: still(GREEN), o: still(100), r: 1, nm: 'fill' },
      {
        ty: 'tr',
        p: still([x, 0]),
        a: still([0, 0]),
        // pop in during the intro, static well before the loop point
        s: anim([
          [55 + off * 0.3, [0, 0], easeOut],
          [68 + off * 0.3, [118, 118], easeInOut],
          [76 + off * 0.3, [100, 100]],
        ]),
        r: still(0),
        o: anim(pulse),
        sk: still(0),
        sa: still(0),
      },
    ],
  };
};

const dots = {
  ddd: 0,
  ind: 10,
  ty: 4,
  nm: 'loading-dots',
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([400, 498, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [dotGroup(-34, 0), dotGroup(0, 13), dotGroup(34, 27)],
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
  w: W,
  h: H,
  nm: 'SPIN BASE — loading',
  ddd: 0,
  assets,
  layers: [shine, seamMatte(2), seamA, seamMatte(4), seamB, sphere, ballCtrl, title, subtitle, dots],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/spinbase-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
