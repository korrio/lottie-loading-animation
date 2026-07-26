/**
 * Generates public/aquario-loading-v2.json — "surface & float" variant, built
 * from the vertical lockup (gray bar mark stacked over black AQUARIO, white).
 *
 * Story: the three bars surface bottom-up like rising water levels, each
 * drifting up into place; the black wordmark letters rise in softly beneath.
 * In the loop the bars float on a gentle cascading bob — layers of water at
 * rest — while the wordmark holds still.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (bob period 60, phase cascade)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/aquario', name)).toString('base64');

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

// [id, file, w, h, compX, compY, scale]
const IMAGES = [
  ['bar1', 'bar1v2.png', 282, 62, 400, 156.4, 73],
  ['bar2', 'bar2v2.png', 282, 60, 400, 236.4, 73],
  ['bar3', 'bar3v2.png', 282, 60, 400, 324.3, 73],
  ['a1', 'a1-blk.png', 90, 98, 202.9, 420.1, 77],
  ['q', 'q-blk.png', 99, 96, 281.0, 422.4, 77],
  ['u', 'u-blk.png', 70, 94, 357.7, 423.2, 77],
  ['a2', 'a2-blk.png', 90, 98, 428.5, 420.1, 77],
  ['r', 'r-blk.png', 61, 92, 495.9, 422.4, 77],
  ['i', 'i-blk.png', 17, 92, 536.7, 422.4, 77],
  ['o', 'o-blk.png', 95, 96, 593.7, 422.4, 77],
];

const assets = IMAGES.map(([id, file, w, h]) => ({
  id: `v2-${id}`,
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
    refId: `v2-${id}`,
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

// --- bars: surface bottom-up, then float on a cascading bob -----------------
// build order bar3 → bar2 → bar1 (water rising)
const BAR_T0 = { bar1: 16, bar2: 10, bar3: 4 };
const barLayers = IMAGES.slice(0, 3).map(([id, , , , x, y, S], i) => {
  const t0 = BAR_T0[id];
  const phase = i * 1.05;
  const wave = [];
  for (let t = 90; t <= 210; t += 5) {
    wave.push([t, [x, y + 3 * Math.sin((2 * Math.PI * (t - 90)) / 60 - phase), 0], linear]);
  }
  return layer(1 + i, id, {
    o: anim([
      [t0, 0, linear],
      [t0 + 6, 100],
    ]),
    r: still(0),
    p: anim([
      [t0, [x, y + 42, 0], easeOut],
      [t0 + 12, [x, y - 4, 0], easeInOut],
      [t0 + 18, [x, y, 0], easeInOut],
      [78, [x, y, 0], easeInOut],
      ...wave,
    ]),
    s: still([S, S, 100]),
  });
});

// --- letters: rise in softly, left to right ---------------------------------
const letterLayers = IMAGES.slice(3).map(([id, , , , x, y, S], i) => {
  const t0 = 34 + i * 3;
  return layer(4 + i, id, {
    o: anim([
      [t0, 0, linear],
      [t0 + 6, 100],
    ]),
    r: still(0),
    p: anim([
      [t0, [x, y + 14, 0], easeOut],
      [t0 + 8, [x, y, 0]],
    ]),
    s: still([S, S, 100]),
  });
});

// --- background: print white ------------------------------------------------
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
  nm: 'AQUARIO — loading v2 (surface & float)',
  ddd: 0,
  assets,
  layers: [...barLayers, ...letterLayers, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/aquario-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
