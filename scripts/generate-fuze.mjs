/**
 * Generates public/fuze-loading.json — a self-contained Lottie loading
 * animation for the FUZE TRAINING logo (fitness venue: fast, punchy).
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90]   intro — the two halves of the X mark slam together from the
 *             sides with an overshoot impact, FUZE slides in with momentum,
 *             TRAINING types on letter by letter
 *   [90..210] seamless loop — the mark beats like a pulse (period 60),
 *             dot pulses have period 40; both divide 120 so frame 90 === 210
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/fuze', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const easeIn = { o: { x: [0.55], y: [0] }, i: { x: [0.95], y: [0.8] } };

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
  { id: 'mark-left', w: 226, h: 190 },
  { id: 'mark-right', w: 229, h: 190 },
  { id: 'fuze', w: 516, h: 142 },
];

const assets = IMAGES.map(({ id, w, h }) => ({
  id,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(`${id}.png`)}`,
  e: 1,
}));

const layerBase = (ind, refId, extra = {}) => {
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
    ks: { a: still([w / 2, h / 2, 0]) },
    ...extra,
  };
};

// --- X mark: two halves slam together, then beat like a pulse --------------
const MARK_CTRL = 14;
const MARK_SCALE = 68; // layer scale for the half assets
// half centers relative to the mark center, in comp px (logo px × 0.45 × 0.68)
const DXL = -77.7;
const DXR = 76.8;

const markHalf = (ind, refId, dx, from) =>
  layerBase(ind, refId, {
    parent: MARK_CTRL,
    ks: {
      a: still([IMAGES.find((i) => i.id === refId).w / 2, 95, 0]),
      o: still(100),
      r: still(0),
      s: still([MARK_SCALE, MARK_SCALE, 100]),
      p: anim([
        [4, [from, 0, 0], easeIn],
        [18, [dx + Math.sign(dx) * -10, 0, 0], easeOut], // overshoot into the clash
        [25, [dx + Math.sign(dx) * 4, 0, 0], easeInOut],
        [31, [dx, 0, 0]],
      ]),
    },
  });

const markLeft = markHalf(2, 'mark-left', DXL, -560);
const markRight = markHalf(3, 'mark-right', DXR, 560);

// heartbeat pulse: one punchy beat per 60 frames, cycles anchored at 42 so
// the pattern is strictly periodic across the 90→210 loop
const beat = [];
for (let c = 42; c <= OP + 20; c += 60) {
  beat.push(
    [c, [100, 100, 100], easeOut],
    [c + 8, [94, 94, 100], easeInOut],
    [c + 18, [102.5, 102.5, 100], easeInOut],
    [c + 28, [100, 100, 100]],
  );
}
const markCtrl = {
  ddd: 0,
  ind: MARK_CTRL,
  ty: 3,
  nm: 'mark-ctrl',
  sr: 1,
  ks: {
    o: still(0),
    r: still(0),
    p: still([400, 225, 0]),
    a: still([0, 0, 0]),
    s: anim(beat),
  },
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
};

// --- FUZE: slides in with momentum (matches the italic lean) ---------------
const fuze = layerBase(4, 'fuze', {
  ks: {
    a: still([258, 71, 0]),
    o: anim([
      [30, 0, easeOut],
      [42, 100],
    ]),
    r: still(0),
    s: still([68, 68, 100]),
    p: anim([
      [30, [330, 408, 0], easeOut],
      [46, [400, 408, 0]],
    ]),
  },
});

// --- loading dots ----------------------------------------------------------
const INK = [0.098, 0.098, 0.098, 1]; // near-black

const dotGroup = (x, off) => {
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
      { ty: 'el', p: still([0, 0]), s: still([14, 14]), nm: 'circle' },
      { ty: 'fl', c: still(INK), o: still(100), r: 1, nm: 'fill' },
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
        o: anim(pulse),
        sk: still(0),
        sa: still(0),
      },
    ],
  };
};

const dots = {
  ddd: 0,
  ind: 13,
  ty: 4,
  nm: 'loading-dots',
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([400, 500, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [dotGroup(-32, 0), dotGroup(0, 13), dotGroup(32, 27)],
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
  nm: 'FUZE TRAINING — loading',
  ddd: 0,
  assets,
  layers: [markLeft, markRight, fuze, dots, markCtrl],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/fuze-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
