/**
 * Generates public/courthaus-loading-v2.json — from the new LOGO FINAL.svg
 * lockup: sage COURT/HAUS in the chunky retro face, the O drawn as a tennis
 * ball with seam cutouts, terracotta "Tennis & Pickleball Club" script.
 *
 * Story: the letters stamp in around an empty O slot — COURT first, HAUS
 * beneath — then the ball-O screws itself into the gap, spinning down to
 * rest. The tagline rises in last. In the loop everything holds still
 * except the ball-O, which keeps turning at 3°/frame (exactly 360° per
 * loop), its seams making the rotation read.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/courthaus-v2', name)).toString('base64');

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

const S = 99.4;

// [id, w, h, compX, compY]
const IMAGES = [
  ['c', 91, 98, 160.7, 216.5],
  ['ball', 112, 109, 284.9, 216.0],
  ['u1', 101, 97, 401.2, 217.0],
  ['r', 102, 95, 522.5, 216.0],
  ['t', 87, 95, 633.3, 216.0],
  ['h', 101, 95, 227.8, 327.8],
  ['a', 101, 95, 346.6, 327.8],
  ['u2', 101, 97, 463.4, 328.8],
  ['s', 91, 98, 579.2, 327.8],
  ['tagline', 607, 39, 399.8, 418.3],
];

const assets = IMAGES.map(([id, w, h]) => ({
  id: `chv2-${id}`,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(`${id}.png`)}`,
  e: 1,
}));

const layer = (ind, id, ks, extra = {}) => {
  const [, w, h] = IMAGES.find(([i]) => i === id);
  return {
    ddd: 0,
    ind,
    ty: 2,
    nm: id,
    refId: `chv2-${id}`,
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

// --- letters: stamp in around the empty O slot -------------------------------
const LETTERS = ['c', 'u1', 'r', 't', 'h', 'a', 'u2', 's'];
const letterLayers = LETTERS.map((id, i) => {
  const [, , , x, y] = IMAGES.find(([n]) => n === id);
  const t0 = 4 + i * 4;
  return layer(2 + i, id, {
    o: anim([
      [t0, 0, linear],
      [t0 + 4, 100],
    ]),
    r: still(0),
    p: still([x, y, 0]),
    s: anim([
      [t0, [0, 0, 100], easeOut],
      [t0 + 6, [S * 1.1, S * 1.1, 100], easeInOut],
      [t0 + 10, [S, S, 100]],
    ]),
  });
});

// --- the ball-O: screws into its slot, keeps turning forever -----------------
const BX = 284.9;
const BY = 216.0;
const ball = layer(1, 'ball', {
  o: anim([
    [38, 0, linear],
    [42, 100],
  ]),
  r: anim([
    [38, -540, easeOut],
    [58, 0, easeInOut],
    // loop: 3°/frame — exactly one revolution per 120-frame loop
    [90, 0, linear],
    [210, 360],
  ]),
  p: still([BX, BY, 0]),
  s: anim([
    [38, [0, 0, 100], easeOut],
    [50, [S * 1.12, S * 1.12, 100], easeInOut],
    [58, [S, S, 100]],
  ]),
});

// --- tagline: script rises in ------------------------------------------------
const tagline = layer(12, 'tagline', {
  o: anim([
    [60, 0, easeOut],
    [72, 100],
  ]),
  r: still(0),
  p: anim([
    [60, [399.8, 428.3, 0], easeOut],
    [72, [399.8, 418.3, 0]],
  ]),
  s: still([S, S, 100]),
});

// --- background: warm cream --------------------------------------------------
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
  sc: '#f4f1e8',
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
  nm: 'COURTHAUS — loading v2 (the ball screws in)',
  ddd: 0,
  assets,
  layers: [ball, ...letterLayers, tagline, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/courthaus-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
