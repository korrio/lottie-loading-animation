/**
 * Generates public/nyspace-loading.json — a self-contained Lottie loading
 * animation for NY Space (tennis club).
 *
 * Story: the cream loop-letterform pops in like a sticker, then the tennis
 * ball drops from above, spinning as it falls, and bounces once before
 * settling into place as the mark's "dot". "NY SPACE" rises beneath.
 * In the loop the ball slowly spins and floats while the mark breathes.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90]   intro   [90..210] seamless loop (spin 3°/frame, bob period 60)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/nyspace', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const linear = { o: { x: [0.167], y: [0.167] }, i: { x: [0.833], y: [0.833] } };
// accelerating fall: slow release, fast arrival
const fall = { o: { x: [0.45], y: [0.02] }, i: { x: [0.75], y: [0.55] } };

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

// --- assets: crops from the 4333×4333 brand JPG (F=2 downsample) -----------
const IMAGES = [
  { id: 'ball', w: 120, h: 120 },
  { id: 'mark', w: 477, h: 486 },
  { id: 'wordmark', w: 676, h: 83 },
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

// Layout: full-res lockup center (2166, 2166) → comp (400, 262), s = 0.26.
// Assets are F=2 crops, so layers render at scale 52.
const S = 52;
const MARK_POS = [406.6, 271.9]; // full-res crop center (2191.5, 2204)
const BX = 296.0; // ball rest, full-res center (1766, 1745)
const BY = 152.5;

// --- mark: sticker pop, gentle breath in the loop --------------------------
const mark = layer(2, 'mark', {
  o: anim([
    [4, 0, easeOut],
    [8, 100],
  ]),
  r: still(0),
  p: still([...MARK_POS, 0]),
  s: anim([
    [4, [0, 0, 100], easeOut],
    [16, [S * 1.06, S * 1.06, 100], easeInOut],
    [24, [S, S, 100], easeInOut],
    [90, [S, S, 100], easeInOut],
    [120, [S * 1.015, S * 1.015, 100], easeInOut],
    [150, [S, S, 100], easeInOut],
    [180, [S * 1.015, S * 1.015, 100], easeInOut],
    [210, [S, S, 100], easeInOut],
    [240, [S * 1.015, S * 1.015, 100]],
  ]),
});

// --- ball: drops in spinning, bounces once, then floats + spins ------------
const ball = layer(1, 'ball', {
  o: anim([
    [24, 0, linear],
    [26, 100],
  ]),
  r: anim([
    [26, -220, fall],
    [44, 0, linear],
    [90, 0, linear],
    [210, 360, linear],
    [240, 450],
  ]),
  p: anim([
    [26, [BX, BY - 340, 0], fall],
    [44, [BX, BY, 0], easeOut],
    [50, [BX, BY - 26, 0], easeInOut],
    [56, [BX, BY, 0], easeInOut],
    [90, [BX, BY, 0], easeInOut],
    [120, [BX, BY - 9, 0], easeInOut],
    [150, [BX, BY, 0], easeInOut],
    [180, [BX, BY - 9, 0], easeInOut],
    [210, [BX, BY, 0], easeInOut],
    [240, [BX, BY - 9, 0]],
  ]),
  s: anim([
    [43, [S, S, 100], easeOut],
    [45, [S * 1.19, S * 0.83, 100], easeOut],
    [51, [S, S, 100]],
  ]),
});

// --- wordmark: rises in beneath the mark -----------------------------------
const WORD_S = 47;
const wordmark = layer(3, 'wordmark', {
  o: anim([
    [56, 0, easeOut],
    [68, 100],
  ]),
  r: still(0),
  s: still([WORD_S, WORD_S, 100]),
  p: anim([
    [56, [400, 462, 0], easeOut],
    [68, [400, 448, 0]],
  ]),
});

// --- loading dots: ball-yellow + cream -------------------------------------
const YELLOW = [0.933, 0.996, 0.416, 1]; // #eefe6a
const CREAM = [0.878, 0.808, 0.761, 1]; // #e0cec2

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
  ind: 4,
  ty: 4,
  nm: 'loading-dots',
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([400, 515, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [dotGroup(-32, 0, YELLOW), dotGroup(0, 13, CREAM), dotGroup(32, 27, YELLOW)],
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

// --- background: brand green solid -----------------------------------------
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
  sc: '#195050',
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
  nm: 'NY SPACE — loading',
  ddd: 0,
  assets,
  layers: [ball, mark, wordmark, dots, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/nyspace-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
