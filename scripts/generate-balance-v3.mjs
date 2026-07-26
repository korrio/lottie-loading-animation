/**
 * Generates public/balance-loading-v3.json — "balancing act" variant, built
 * from the stacked-lockup logo (arched BALANCE · solid ball over outline
 * ball · arched AUTO TENNIS).
 *
 * Story: the outline ball pops in first, the solid ball drops from above and
 * lands balanced on top of it with a squash — then the BALANCE letters pop in
 * along their arch and AUTO TENNIS fades up. In the loop the solid ball
 * teeters gently on its contact point while the outline ball counter-sways,
 * like the pair is holding its balance.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (teeter period 120, v(90)==v(210))
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/balance-v3', name)).toString('base64');

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

// full-res source → comp mapping: scale 0.34, content centered at (400, 300)
const S = 68; // assets are half-res, so layer scale = 0.34 * 2 * 100

// [id, w, h, compX, compY] — positions are mapped bbox centers
const IMAGES = [
  ['ball-top', 382, 382, 400.9, 213.0],
  ['ball-bottom', 384, 315, 400.2, 405.4],
  ['bl0', 50, 51, 291.7, 87.2],
  ['bl1', 43, 52, 331.2, 67.4],
  ['bl2', 39, 47, 362.1, 54.5],
  ['bl3', 44, 47, 397.8, 48.7],
  ['bl4', 46, 52, 437.9, 52.5],
  ['bl5', 46, 48, 478.0, 66.4],
  ['bl6', 52, 54, 510.0, 86.1],
  ['at0', 47, 48, 291.0, 516.6],
  ['at1', 45, 49, 318.6, 527.5],
  ['at2', 35, 48, 342.7, 538.3],
  ['at3', 45, 45, 364.8, 548.5],
  ['at4', 35, 45, 404.9, 552.6],
  ['at5', 37, 48, 429.1, 550.2],
  ['at6', 47, 52, 454.6, 543.8],
  ['at7', 51, 55, 480.4, 532.2],
  ['at8', 31, 39, 497.1, 521.3],
  ['at9', 40, 45, 510.0, 510.8],
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

// --- solid ball: drops in, lands balanced, teeters in the loop --------------
// Anchor at the contact point (bottom of the solid circle) so the squash
// compresses onto the outline ball and the loop teeter pivots there.
// Contact point: full-res (998.5, 1121) → asset (190.75, 379.5), comp (400.7, 341.1)
const PX = 400.7;
const PY = 341.1;
const ballTop = layer(1, 'ball-top', {
  o: anim([
    [14, 0, linear],
    [16, 100],
  ]),
  a: still([190.75, 379.5, 0]),
  r: anim([
    [14, -6, fall],
    [30, 0, easeInOut],
    // loop: teetering on the contact point (period 120, zero at 90/150/210)
    [90, 0, easeInOut],
    [120, 2.4, easeInOut],
    [150, 0, easeInOut],
    [180, -2.4, easeInOut],
    [210, 0],
  ]),
  p: anim([
    [14, [PX, PY - 400, 0], fall],
    [30, [PX, PY, 0], easeOut],
    [34, [PX, PY - 5, 0], easeInOut],
    [38, [PX, PY, 0]],
  ]),
  s: anim([
    [26, [S, S, 100], easeOut],
    [30, [S * 1.07, S * 0.9, 100], easeOut],
    [38, [S, S, 100]],
  ]),
});

// --- outline ball: pops in first, counter-sways in the loop -----------------
const ballBottom = layer(2, 'ball-bottom', {
  o: anim([
    [2, 0, linear],
    [5, 100],
  ]),
  r: anim([
    [90, 0, easeInOut],
    [120, -0.9, easeInOut],
    [150, 0, easeInOut],
    [180, 0.9, easeInOut],
    [210, 0],
  ]),
  p: still([400.2, 405.4, 0]),
  s: anim([
    [2, [0, 0, 100], easeOut],
    [12, [S * 1.05, S * 1.05, 100], easeInOut],
    [18, [S, S, 100]],
  ]),
});

// --- BALANCE: letters pop along the arch ------------------------------------
const balanceLayers = IMAGES.slice(2, 9).map(([id, , , x, y], i) => {
  const t0 = 36 + i * 3;
  return layer(3 + i, id, {
    o: anim([
      [t0, 0, linear],
      [t0 + 4, 100],
    ]),
    r: still(0),
    p: still([x, y, 0]),
    s: anim([
      [t0, [0, 0, 100], easeOut],
      [t0 + 6, [S * 1.15, S * 1.15, 100], easeInOut],
      [t0 + 10, [S, S, 100]],
    ]),
  });
});

// --- AUTO TENNIS: quiet staggered fade-up -----------------------------------
const autoLayers = IMAGES.slice(9).map(([id, , , x, y], i) => {
  const t0 = 58 + i * 2;
  return layer(10 + i, id, {
    o: anim([
      [t0, 0, linear],
      [t0 + 5, 100],
    ]),
    r: still(0),
    p: anim([
      [t0, [x, y + 6, 0], easeOut],
      [t0 + 5, [x, y, 0]],
    ]),
    s: still([S, S, 100]),
  });
});

// --- background: clay orange ------------------------------------------------
const bg = {
  ddd: 0,
  ind: 30,
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
  sc: '#cc7622',
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
  nm: 'BALANCE AUTO TENNIS — loading v3 (balancing act)',
  ddd: 0,
  assets,
  layers: [ballTop, ballBottom, ...balanceLayers, ...autoLayers, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/balance-loading-v3.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
