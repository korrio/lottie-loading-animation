/**
 * Generates public/pantip-loading.json — a self-contained Lottie loading
 * animation for Pantip (Thailand's #1 community forum).
 *
 * Story: the happy bespectacled face pops in like a sticker, the letters
 * of "Pantip" pop in one by one, the i-dot drops in with a bounce, and
 * "Learn, Share & Fun" rises beneath. In the loop the face does a gentle
 * head-tilt chuckle while the dots pulse.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90]   intro   [90..210] seamless loop (wobble period 120, dots 40)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/pantip', name)).toString('base64');

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

// --- assets: crops from the 1771×1034 raster of the SVG --------------------
const IMAGES = [
  { id: 'face', w: 1009, h: 447 },
  { id: 'l-P', w: 306, h: 378 },
  { id: 'l-a', w: 282, h: 268 },
  { id: 'l-n', w: 328, h: 263 },
  { id: 'l-t', w: 231, h: 343 },
  { id: 'l-i', w: 163, h: 263 },
  { id: 'l-idot', w: 106, h: 100 },
  { id: 'l-p2', w: 309, h: 400 },
  { id: 'tagline', w: 1269, h: 106 },
];

const assets = IMAGES.map(({ id, w, h }) => ({
  id,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(`${id}.png`)}`,
  e: 1,
}));

const layer = (ind, refId, ks, extra = {}) => {
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
    ...extra,
  };
};

// face: raster center (730, 258) → comp (400, 160), scale 0.46, anchored at
// the chin so the pop and the chuckle wobble pivot naturally
const FACE_S = 46;
const CHIN = [504.5, 447];
const CHIN_POS = [400, 160 + (482 - 258) * 0.46]; // (400, 263)

// word: letters keep their original relative metrics, scale 0.27,
// word center (887.5, 725) → comp (400, 372)
const W = 0.27;
const wx = (cx) => 400 + (cx - 887.5) * W;
const wy = (cy) => 372 + (cy - 725) * W;

// --- face: sticker pop, then chuckle wobble in the loop --------------------
const wobble = [];
for (let c = 90; c <= OP; c += 120) {
  wobble.push([c, 0, easeInOut], [c + 30, 2.2, easeInOut], [c + 60, 0, easeInOut], [c + 90, -2.2, easeInOut]);
}
const face = layer(1, 'face', {
  a: still([...CHIN, 0]),
  o: anim([
    [4, 0, easeOut],
    [10, 100],
  ]),
  r: anim([
    [40, 0, easeInOut],
    ...wobble,
    [OP + 30, 0],
  ]),
  p: still([...CHIN_POS, 0]),
  s: anim([
    [4, [0, 0, 100], easeOut],
    [16, [FACE_S * 1.06, FACE_S * 1.06, 100], easeInOut],
    [24, [FACE_S, FACE_S, 100]],
  ]),
});

// --- letters: pop in one by one --------------------------------------------
const pop = (ind, refId, cx, cy, t0) =>
  layer(ind, refId, {
    o: anim([
      [t0, 0, easeOut],
      [t0 + 4, 100],
    ]),
    r: still(0),
    p: still([wx(cx), wy(cy), 0]),
    s: anim([
      [t0, [0, 0, 100], easeOut],
      [t0 + 8, [W * 112, W * 112, 100], easeInOut],
      [t0 + 14, [W * 100, W * 100, 100]],
    ]),
  });

const lP = pop(2, 'l-P', 188.5, 664.5, 22);
const lA = pop(3, 'l-a', 491.5, 724.5, 27);
const lN = pop(4, 'l-n', 816.5, 722, 32);
const lT = pop(5, 'l-t', 1116, 687, 37);
const lI = pop(6, 'l-i', 1332, 722, 42);
const lP2 = pop(7, 'l-p2', 1584, 790.5, 47);

// --- i-dot: drops in last with a little bounce -----------------------------
const IDOT_X = wx(1328.5);
const IDOT_Y = wy(508.5);
const lIdot = layer(8, 'l-idot', {
  o: anim([
    [52, 0, easeOut],
    [57, 100],
  ]),
  r: still(0),
  s: still([W * 100, W * 100, 100]),
  p: anim([
    [52, [IDOT_X, IDOT_Y - 60, 0], easeOut],
    [60, [IDOT_X, IDOT_Y + 6, 0], easeInOut],
    [66, [IDOT_X, IDOT_Y, 0]],
  ]),
});

// --- tagline: left-aligned under the word, rises in ------------------------
const TAG_X = wx(36) + (1269 * W) / 2; // left edge aligned with the P
const TAG_Y = wy(948.5);
const tagline = layer(9, 'tagline', {
  o: anim([
    [62, 0, easeOut],
    [74, 100],
  ]),
  r: still(0),
  s: still([W * 100, W * 100, 100]),
  p: anim([
    [62, [TAG_X, TAG_Y + 14, 0], easeOut],
    [74, [TAG_X, TAG_Y, 0]],
  ]),
});

// --- loading dots: purple family -------------------------------------------
const PURPLE = [0.322, 0.161, 0.506, 1]; // #522981
const LILAC = [0.639, 0.518, 0.780, 1]; // lighter tint

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
          [68 + off * 0.3, [0, 0], easeOut],
          [80 + off * 0.3, [118, 118], easeInOut],
          [88 + off * 0.3, [100, 100]],
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
  ind: 10,
  ty: 4,
  nm: 'loading-dots',
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([400, 510, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [dotGroup(-32, 0, PURPLE), dotGroup(0, 13, LILAC), dotGroup(32, 27, PURPLE)],
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// --- background: full-comp solid -------------------------------------------
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
  sc: '#ffffff',
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
  nm: 'Pantip — loading',
  ddd: 0,
  assets,
  layers: [face, lP, lA, lN, lT, lI, lIdot, lP2, tagline, dots, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/pantip-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
