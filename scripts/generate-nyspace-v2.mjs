/**
 * Generates public/nyspace-loading-v2.json — "trace the line" variant.
 *
 * Story: the mark pops in, then the tennis ball appears at the letterform's
 * tail and rides the stroke like a bead on a wire — up the right stroke,
 * across the arch, once around the teardrop loop — rolling as it goes, and
 * finally pops off the stub tip to rest at its original dot position.
 * The loop is calm: the ball floats gently on its dot, the mark breathes.
 *
 * The centerline in scripts/nyspace-path.json was extracted from the logo
 * raster by skeletonizing the mark mask (Zhang–Suen) and walking the
 * skeleton tail → arch → teardrop circuit → stub tip.
 *
 * Timeline (60fps, 240 frames, 800×600) — longer intro than the others so
 * the ride can be slow and deliberate:
 *   [0..120] intro   [120..240] seamless loop (bob period 60, breath 60)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/nyspace', name)).toString('base64');
const PATH = JSON.parse(readFileSync(join(root, 'scripts/nyspace-path.json'), 'utf8'));

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

const S = 52;
const MARK_POS = [406.6, 271.9];
const BX = 296.0; // ball's dot spot
const BY = 152.5;

// --- path sampling ----------------------------------------------------------
// PATH.points are evenly spaced along the centerline (tail → stub tip).
// Position at eased progress u ∈ [0,1] via linear interp over the polyline.
const pts = PATH.points;
const at = (u) => {
  const f = u * (pts.length - 1);
  const i = Math.min(Math.floor(f), pts.length - 2);
  const w = f - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * w, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * w];
};
const easeInOutCubic = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);

// travel: frames 36..106, one key every 2 frames — slow, deliberate ride
const T0 = 36;
const T1 = 106;
const SPIN = -720; // stylized roll, lands at 0°
const travelP = [];
const travelR = [];
for (let t = T0; t <= T1; t += 2) {
  const u = easeInOutCubic((t - T0) / (T1 - T0));
  const [x, y] = at(u);
  travelP.push([t, [x, y, 0], linear]);
  travelR.push([t, SPIN * (1 - u), linear]);
}
const TIP = at(1); // stub tip, where the ball pops off toward home

// --- ball -------------------------------------------------------------------
const ball = layer(1, 'ball', {
  o: anim([
    [22, 0, linear],
    [24, 100],
  ]),
  r: anim([...travelR, [120, 0]]),
  p: {
    a: 1,
    k: [
      ...kf(travelP).slice(0, -1),
      { t: T1, s: [...TIP, 0], o: easeOut.o, i: easeOut.i },
      // pop off the tip, small arc up to the dot spot
      {
        t: 111,
        s: [(TIP[0] + BX) / 2 - 6, Math.min(TIP[1], BY) - 22, 0],
        o: easeInOut.o,
        i: easeInOut.i,
      },
      ...kf([
        [116, [BX, BY, 0], easeInOut],
        [120, [BX, BY, 0], easeInOut],
        [150, [BX, BY - 9, 0], easeInOut],
        [180, [BX, BY, 0], easeInOut],
        [210, [BX, BY - 9, 0], easeInOut],
        [240, [BX, BY, 0]],
      ]),
    ],
  },
  s: anim([
    [24, [0, 0, 100], easeOut],
    [30, [S * 1.1, S * 1.1, 100], easeInOut],
    [36, [S, S, 100], easeInOut],
    [114, [S, S, 100], easeOut],
    [116, [S * 1.08, S * 0.94, 100], easeOut],
    [122, [S, S, 100]],
  ]),
});

// --- mark: sticker pop, gentle breath in the loop ---------------------------
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
    [120, [S, S, 100], easeInOut],
    [150, [S * 1.015, S * 1.015, 100], easeInOut],
    [180, [S, S, 100], easeInOut],
    [210, [S * 1.015, S * 1.015, 100], easeInOut],
    [240, [S, S, 100]],
  ]),
});

// --- wordmark: tracks in (letterspacing tightens as it fades up) -----------
const wordmark = layer(4, 'wordmark', {
  o: anim([
    [84, 0, easeOut],
    [96, 100],
  ]),
  r: still(0),
  s: anim([
    [84, [58, 47, 100], easeOut],
    [98, [47, 47, 100]],
  ]),
  p: anim([
    [84, [400, 462, 0], easeOut],
    [96, [400, 448, 0]],
  ]),
});

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
  nm: 'NY SPACE — loading v2 (trace the line)',
  ddd: 0,
  assets,
  layers: [ball, mark, wordmark, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 120 },
    { tm: 120, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/nyspace-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
