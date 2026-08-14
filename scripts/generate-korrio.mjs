/**
 * Generates public/korrio-loading.json — "the sign hums on".
 *
 * korrio's avatar is a neon sign: green tube hair and neck, blue tube face
 * and eyes, yellow accents. So it animates like one — tubes flicker and
 * buzz alight in stages (hair first, then the face, then the features,
 * the eyes snapping on last), and in the loop the sign just hums: a soft
 * brightness breath, one flicker of the hair highlight, and a blink.
 *
 * All layers keep the source's baked glow (soft alpha from distance to
 * the background color), so it reads as light, not line art.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/korrio', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
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

const S = 110;

// [id, w, h, compX, compY]
const IMAGES = [
  ['hair', 224, 184, 396.2, 220.3],
  ['neck', 141, 124, 416.5, 422.7],
  ['face', 225, 342, 396.7, 307.2],
  ['eye-l', 37, 34, 342.8, 288.5],
  ['eye-r', 28, 32, 420.4, 285.2],
  ['hl', 51, 75, 303.2, 181.2],
  ['brow-l', 45, 31, 341.7, 267.0],
  ['brow-r', 45, 33, 420.9, 262.6],
  ['nose', 55, 86, 372.5, 317.1],
  ['lips', 45, 29, 370.3, 373.7],
];

const assets = IMAGES.map(([id, w, h]) => ({
  id: `kor-${id}`,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(`${id}.png`)}`,
  e: 1,
}));

const layer = (ind, id, oKeys) => {
  const [, w, h, x, y] = IMAGES.find(([i]) => i === id);
  return {
    ddd: 0,
    ind,
    ty: 2,
    nm: id,
    refId: `kor-${id}`,
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: {
      o: anim(oKeys),
      r: still(0),
      p: still([x, y, 0]),
      a: still([w / 2, h / 2, 0]),
      s: still([S, S, 100]),
    },
  };
};

// neon tube igniting: dark → sputter → catch
const H = true;
const flickerOn = (t0, tail = []) => [
  [t0, 0, null, H],
  [t0 + 2, 55, null, H],
  [t0 + 4, 0, null, H],
  [t0 + 7, 75, null, H],
  [t0 + 9, 25, null, H],
  [t0 + 12, 100, null, H],
  ...tail,
];
const popOn = (t0, tail = []) => [
  [t0, 0, null, H],
  [t0 + 2, 70, null, H],
  [t0 + 4, 30, null, H],
  [t0 + 6, 100, null, H],
  ...tail,
];

// loop tails (all start and end the loop at 100)
const humTail = [
  [90, 100, easeInOut],
  [150, 93, easeInOut],
  [210, 100],
];
const faceHumTail = [
  [90, 100, easeInOut],
  [120, 94, easeInOut],
  [150, 100, easeInOut],
  [180, 94, easeInOut],
  [210, 100],
];
const hlTail = [
  [114, 100, null, H],
  [116, 30, null, H],
  [118, 100, null, H],
  [120, 45, null, H],
  [123, 100, null, H],
];
const blinkTail = [
  [146, 100, null, H],
  [150, 0, null, H],
  [156, 100, null, H],
];

const layers = [
  layer(1, 'hl', popOn(58, hlTail)),
  layer(2, 'eye-l', [[50, 0, null, H], [52, 100, null, H], ...blinkTail]),
  layer(3, 'eye-r', [[50, 0, null, H], [52, 100, null, H], ...blinkTail]),
  layer(4, 'brow-l', popOn(32)),
  layer(5, 'brow-r', popOn(36)),
  layer(6, 'nose', popOn(40)),
  layer(7, 'lips', popOn(44)),
  layer(8, 'face', flickerOn(16, faceHumTail)),
  layer(9, 'hair', flickerOn(4, humTail)),
  layer(10, 'neck', flickerOn(4, humTail)),
];

// --- background: sign-shop midnight -----------------------------------------
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
  sc: '#1b1a2a',
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
  nm: 'korrio — avatar (the sign hums on)',
  ddd: 0,
  assets,
  layers: [...layers, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/korrio-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
