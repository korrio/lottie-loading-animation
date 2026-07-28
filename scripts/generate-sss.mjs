/**
 * Generates public/sss-loading.json — SSS HALF TENNIS "the cat wakes up".
 *
 * Story: the court-frame mark pops in with the cat dozing (eyes shut), the
 * eyes open with a little overshoot — it's awake — and the tennis ball drops
 * to its paws with one squash bounce. SSS stamps in letter by letter and
 * HALF TENNIS fades up. The loop is calm: everything rests except one lazy
 * cat blink every two seconds.
 *
 * Identity from the splash: clay #ba623a ground, white line art, ball green
 * #9cc545, black pupils.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (one blink, v(90)==v(210))
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/sss', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const fall = { o: { x: [0.45], y: [0.02] }, i: { x: [0.75], y: [0.55] } };
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

const S = 72;

// [id, w, h, compX, compY]
const IMAGES = [
  ['mark', 473, 491, 399.8, 221.3],
  ['ball', 160, 156, 399.5, 329.0],
  ['eyes', 144, 32, 319.9, 201.2],
  ['s1', 141, 129, 280.7, 459.3],
  ['s2', 141, 129, 399.8, 459.7],
  ['s3', 142, 129, 519.0, 459.7],
  ['ht0', 42, 38, 245.7, 541.0],
  ['ht1', 49, 38, 283.5, 541.0],
  ['ht2', 36, 38, 318.8, 541.0],
  ['ht3', 38, 38, 350.1, 541.0],
  ['ht4', 42, 38, 395.9, 541.0],
  ['ht5', 38, 38, 429.7, 541.0],
  ['ht6', 43, 38, 464.6, 541.0],
  ['ht7', 43, 38, 502.1, 541.0],
  ['ht8', 12, 38, 528.3, 541.0],
  ['ht9', 43, 39, 553.9, 541.0],
];

const assets = IMAGES.map(([id, w, h]) => ({
  id,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(`${id}.png`)}`,
  e: 1,
}));

const layer = (ind, refId, ks, extra = {}) => {
  const [, w, h] = IMAGES.find(([i]) => i === refId);
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
    ...extra,
  };
};

// --- mark: pops in with the cat dozing --------------------------------------
const mark = layer(3, 'mark', {
  o: anim([
    [2, 0, linear],
    [8, 100],
  ]),
  r: still(0),
  p: still([399.8, 221.3, 0]),
  s: anim([
    [2, [S * 0.96, S * 0.96, 100], easeOut],
    [14, [S, S, 100]],
  ]),
});

// --- eyes: shut → open with overshoot; one lazy blink in the loop -----------
const eyes = layer(2, 'eyes', {
  o: anim([
    [8, 0, linear],
    [12, 100],
  ]),
  r: still(0),
  p: still([319.9, 201.2, 0]),
  s: anim([
    [8, [S, S * 0.08, 100], easeInOut],
    [18, [S, S * 0.08, 100], easeOut],
    [26, [S, S * 1.08, 100], easeInOut],
    [31, [S, S, 100], easeInOut],
    [90, [S, S, 100], easeInOut],
    [142, [S, S, 100], easeInOut],
    [147, [S, S * 0.06, 100], easeInOut],
    [151, [S, S * 0.06, 100], easeInOut],
    [157, [S, S, 100], easeInOut],
    [210, [S, S, 100]],
  ]),
});

// --- ball: drops to the paws, one squash bounce ------------------------------
const BX = 399.5;
const BY = 329.0;
const ball = layer(1, 'ball', {
  o: anim([
    [30, 0, linear],
    [32, 100],
  ]),
  r: still(0),
  p: anim([
    [30, [BX, 49, 0], fall],
    [44, [BX, BY, 0], easeOut],
    [48, [BX, BY - 14, 0], easeInOut],
    [52, [BX, BY, 0]],
  ]),
  s: anim([
    [43, [S, S, 100], easeOut],
    [45, [S * 1.08, S * 0.9, 100], easeOut],
    [50, [S, S, 100]],
  ]),
});

// --- SSS: stamps in ----------------------------------------------------------
const sssLayers = ['s1', 's2', 's3'].map((id, i) => {
  const [, , , x, y] = IMAGES.find(([n]) => n === id);
  const t0 = 54 + i * 4;
  return layer(4 + i, id, {
    o: anim([
      [t0, 0, linear],
      [t0 + 4, 100],
    ]),
    r: still(0),
    p: still([x, y, 0]),
    s: anim([
      [t0, [0, 0, 100], easeOut],
      [t0 + 6, [S * 1.12, S * 1.12, 100], easeInOut],
      [t0 + 10, [S, S, 100]],
    ]),
  });
});

// --- HALF TENNIS: quiet staggered fade-up ------------------------------------
const htLayers = Array.from({ length: 10 }, (_, i) => {
  const [, , , x, y] = IMAGES.find(([n]) => n === `ht${i}`);
  const t0 = 66 + i * 2;
  return layer(7 + i, `ht${i}`, {
    o: anim([
      [t0, 0, linear],
      [t0 + 5, 100],
    ]),
    r: still(0),
    p: anim([
      [t0, [x, y + 8, 0], easeOut],
      [t0 + 5, [x, y, 0]],
    ]),
    s: still([S, S, 100]),
  });
});

// --- background: clay --------------------------------------------------------
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
  sc: '#ba623a',
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
  nm: 'SSS HALF TENNIS — loading (the cat wakes up)',
  ddd: 0,
  assets,
  layers: [ball, eyes, mark, ...sssLayers, ...htLayers, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/sss-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
