/**
 * Generates public/anthropic-loading.json — ANTHROP\C "spark to slash".
 *
 * Story: a coral Claude spark ✳ pops in where the wordmark's "I" belongs and
 * spins slowly while the slate letters of ANTHROP C rise into place around
 * it. The spark then collapses into the iconic backslash — first in Claude's
 * book-cloth coral, then settling to slate. In the loop everything holds
 * still except the backslash, which breathes coral like a thinking cursor.
 *
 * Corporate identity: ivory #F0F0EB ground, slate #181818 wordmark (from the
 * official SVG), book-cloth coral #CC785C accent.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (slash breath period 60)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/anthropic', name)).toString('base64');

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

const S = 68;

// [id, file, w, h, compX, compY]
const IMAGES = [
  ['a', 'a.png', 102, 100, 127.0, 300.2],
  ['n', 'n.png', 91, 100, 201.4, 300.2],
  ['t', 't.png', 90, 100, 272.8, 300.2],
  ['h', 'h.png', 91, 100, 343.9, 300.2],
  ['r', 'r.png', 92, 100, 421.7, 300.2],
  ['o', 'o.png', 99, 101, 492.1, 299.8],
  ['p', 'p.png', 86, 100, 566.9, 300.2],
  ['bs', 'bs.png', 63, 100, 622.0, 300.2],
  ['bs-coral', 'bs-coral.png', 63, 100, 622.0, 300.2],
  ['c', 'c.png', 92, 101, 675.7, 299.8],
];

const assets = IMAGES.map(([id, file, w, h]) => ({
  id,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(file)}`,
  e: 1,
}));

const layer = (ind, id, ks, extra = {}) => {
  const [, , w, h] = IMAGES.find(([i]) => i === id);
  return {
    ddd: 0,
    ind,
    ty: 2,
    nm: id,
    refId: id,
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

const CORAL = [0.8, 0.471, 0.361, 1];
const BSX = 622.0;
const BSY = 300.2;

// --- Claude spark: 8-ray starburst at the "I" slot --------------------------
const starPath = (rOut, rIn) => {
  const v = [];
  for (let k = 0; k < 8; k++) {
    const a1 = ((k * 45 - 90) * Math.PI) / 180;
    const a2 = ((k * 45 - 67.5) * Math.PI) / 180;
    v.push([rOut * Math.cos(a1), rOut * Math.sin(a1)]);
    v.push([rIn * Math.cos(a2), rIn * Math.sin(a2)]);
  }
  return { c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) };
};

const spark = {
  ddd: 0,
  ind: 11,
  ty: 4,
  nm: 'spark',
  sr: 1,
  ao: 0,
  ip: 0,
  op: 60,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [2, 0, linear],
      [8, 100, linear],
      [46, 100, easeInOut],
      [56, 0],
    ]),
    r: anim([
      [2, -90, linear],
      [46, 90, easeOut],
      [56, 210],
    ]),
    p: still([BSX, BSY, 0]),
    a: still([0, 0, 0]),
    s: anim([
      [2, [0, 0, 100], easeOut],
      [10, [108, 108, 100], easeInOut],
      [16, [100, 100, 100], easeInOut],
      [46, [100, 100, 100], easeInOut],
      [56, [0, 0, 100]],
    ]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'spark-g',
      it: [
        { ty: 'sh', ks: { a: 0, k: starPath(40, 8.5) } },
        { ty: 'fl', c: still(CORAL), o: still(100), r: 1 },
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
};

// --- letters: rise into place around the spinning spark ---------------------
const LETTER_IDS = ['a', 'n', 't', 'h', 'r', 'o', 'p', 'c'];
const letterLayers = LETTER_IDS.map((id, i) => {
  const [, , , , x, y] = IMAGES.find(([n]) => n === id);
  const t0 = 8 + i * 4;
  return layer(1 + i, id, {
    o: anim([
      [t0, 0, linear],
      [t0 + 8, 100],
    ]),
    r: still(0),
    p: anim([
      [t0, [x, y + 16, 0], easeOut],
      [t0 + 10, [x, y, 0]],
    ]),
    s: still([S, S, 100]),
  });
});

// --- backslash: born coral from the spark, settles to slate ------------------
const bsCoral = layer(12, 'bs-coral', {
  o: anim([
    [46, 0, easeOut],
    [54, 100],
  ]),
  r: still(0),
  p: still([BSX, BSY, 0]),
  s: anim([
    [46, [S * 0.8, S * 0.8, 100], easeOut],
    [54, [S, S, 100]],
  ]),
});

// slate slash on top: fades in to complete the wordmark, breathes in the loop
const bsSlate = layer(13, 'bs', {
  o: anim([
    [58, 0, easeInOut],
    [70, 100, easeInOut],
    [90, 100, easeInOut],
    [120, 25, easeInOut],
    [150, 100, easeInOut],
    [180, 25, easeInOut],
    [210, 100],
  ]),
  r: still(0),
  p: still([BSX, BSY, 0]),
  s: still([S, S, 100]),
});

// --- background: Anthropic ivory --------------------------------------------
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
  sc: '#f0f0eb',
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
  nm: 'ANTHROPIC — loading (spark to slash)',
  ddd: 0,
  assets,
  layers: [bsSlate, bsCoral, spark, ...letterLayers, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/anthropic-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
