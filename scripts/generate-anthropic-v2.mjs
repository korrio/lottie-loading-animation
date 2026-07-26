/**
 * Generates public/anthropic-loading-v2.json — the A\ symbol assembles.
 *
 * Story: the monogram's two strokes arrive separately — the A rises from
 * below, the backslash slides in along its own diagonal from the top right —
 * and click together with a soft settle pulse. The backslash winks
 * book-cloth coral once, then the whole mark breathes gently in the loop
 * while the backslash keeps its coral pulse, like a thinking cursor.
 *
 * Corporate identity: ivory #F0F0EB ground, slate #181818 mark (official
 * symbol SVG), book-cloth coral #CC785C accent.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (breath + pulse period 60)
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

const S = 88.6;

const IMAGES = [
  ['sym-a', 414, 406],
  ['sym-bs', 249, 406],
  ['sym-bs-coral', 249, 406],
];

const assets = IMAGES.map(([id, w, h]) => ({
  id,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(`${id}.png`)}`,
  e: 1,
}));

// parent null at the mark's center — its scale drives the loop breath
const rig = {
  ddd: 0,
  ind: 10,
  ty: 3,
  nm: 'rig',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: still(0),
    r: still(0),
    p: still([400, 300, 0]),
    a: still([0, 0, 0]),
    s: anim([
      [28, [100, 100, 100], easeInOut],
      [34, [102, 102, 100], easeInOut],
      [40, [100, 100, 100], easeInOut],
      [90, [100, 100, 100], easeInOut],
      [120, [101.5, 101.5, 100], easeInOut],
      [150, [100, 100, 100], easeInOut],
      [180, [101.5, 101.5, 100], easeInOut],
      [210, [100, 100, 100]],
    ]),
  },
};

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
    parent: 10,
    ks: { a: still([w / 2, h / 2, 0]), ...ks },
    ...extra,
  };
};

// home positions in rig space (rig origin = mark center at comp (400,300))
const AX = -71.5;
const AY = -0.2;
const BX = 144.2;
const BY = -0.2;
// slide vector along the backslash's own diagonal (from top-right)
const SLIDE = [78, -129];

// --- the A: rises from below -------------------------------------------------
const symA = layer(1, 'sym-a', {
  o: anim([
    [4, 0, linear],
    [10, 100],
  ]),
  r: still(0),
  p: anim([
    [4, [AX, AY + 50, 0], easeOut],
    [18, [AX, AY, 0]],
  ]),
  s: still([S, S, 100]),
});

// --- the backslash: coral base + slate top (wink & pulse via slate opacity) --
const bsSlide = {
  p: anim([
    [12, [BX + SLIDE[0], BY + SLIDE[1], 0], easeOut],
    [26, [BX, BY, 0]],
  ]),
  s: still([S, S, 100]),
  r: still(0),
};

const bsCoral = layer(2, 'sym-bs-coral', {
  o: anim([
    [12, 0, linear],
    [18, 100],
  ]),
  ...bsSlide,
});

const bsSlate = layer(3, 'sym-bs', {
  o: anim([
    [12, 0, linear],
    [18, 100, easeInOut],
    // coral wink once the mark has settled
    [44, 100, easeInOut],
    [50, 15, easeInOut],
    [58, 100, easeInOut],
    // loop: thinking-cursor pulse
    [90, 100, easeInOut],
    [120, 25, easeInOut],
    [150, 100, easeInOut],
    [180, 25, easeInOut],
    [210, 100],
  ]),
  ...bsSlide,
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
  nm: 'ANTHROPIC — loading v2 (the mark assembles)',
  ddd: 0,
  assets,
  layers: [symA, bsSlate, bsCoral, rig, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/anthropic-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
