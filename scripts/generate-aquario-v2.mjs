/**
 * Generates public/aquario-loading-v2.json — "surface & float" variant, built
 * from the vertical lockup (gray bar mark stacked over black AQUARIO, white).
 *
 * Story: the Aquarius glyph ♒ — two zigzag wave ribbons in matrix green —
 * ripples for a beat, then flattens and morphs into the top and bottom bars
 * of the mark (turning brand gray as it goes) while the middle bar fades in
 * between them. The black wordmark letters rise in softly beneath, and in
 * the loop the bars float on a gentle cascading bob.
 *
 * The morph is a real Lottie shape-path interpolation: each ribbon is a
 * closed polygon (zigzag top edge + offset bottom edge, 18 vertices) and the
 * flat bar is the same polygon with amplitude 0 — identical topology.
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

// --- zigzag ribbon polygon (18 vertices, corner points) ---------------------
const ribbon = (cx, cy, w, A, T) => {
  const n = 9;
  const top = [];
  const bot = [];
  for (let i = 0; i < n; i++) {
    const x = cx - w / 2 + (w * i) / (n - 1);
    const y = cy + (i % 2 === 0 ? -A : A);
    top.push([x, y - T / 2]);
    bot.unshift([x, y + T / 2]);
  }
  const v = [...top, ...bot];
  return { c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) };
};

const GREEN = [0, 1, 0.255, 1];
const GRAY = [0.702, 0.702, 0.702, 1];
const MX = 400;

// ♒ start: two waves stacked at the mark position → morph to bar1/bar3
const zig = (ind, nm, y0, yBar) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm,
  sr: 1,
  ao: 0,
  ip: 0,
  op: 50,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [0, 0, linear],
      [8, 100, easeInOut],
      [44, 100, linear],
      [48, 0],
    ]),
    r: still(0),
    p: still([0, 0, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: `${nm}-g`,
      it: [
        {
          ty: 'sh',
          ks: {
            a: 1,
            k: [
              { t: 8, s: [ribbon(MX, y0, 260, 24, 13)], o: easeInOut.o, i: easeInOut.i },
              { t: 16, s: [ribbon(MX, y0, 260, -24, 13)], o: easeInOut.o, i: easeInOut.i },
              { t: 24, s: [ribbon(MX, y0, 260, 24, 13)], o: easeInOut.o, i: easeInOut.i },
              { t: 44, s: [ribbon(MX, yBar, 206, 0, 44)] },
            ],
          },
        },
        {
          ty: 'fl',
          c: {
            a: 1,
            k: [
              { t: 24, s: GREEN, o: easeInOut.o, i: easeInOut.i },
              { t: 44, s: GRAY },
            ],
          },
          o: still(100),
          r: 1,
        },
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
});

const zigLayers = [zig(11, 'zig-top', 215, 156.4), zig(12, 'zig-bottom', 265, 324.3)];

// --- raster bars: take over from the ribbons, then rest still ---------------
const barLayers = IMAGES.slice(0, 3).map(([id, , , , x, y, S], i) => {
  const oIn =
    id === 'bar2'
      ? [
          [34, 0, linear],
          [42, 100],
        ]
      : [
          [44, 0, linear],
          [48, 100],
        ];
  return layer(1 + i, id, {
    o: anim(oIn),
    r: still(0),
    p: still([x, y, 0]),
    s: still([S, S, 100]),
  });
});

// --- letters: rise in softly, left to right ---------------------------------
const letterLayers = IMAGES.slice(3).map(([id, , , , x, y, S], i) => {
  const t0 = 46 + i * 3;
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
  nm: 'AQUARIO — loading v2 (water sign, surface & float)',
  ddd: 0,
  assets,
  layers: [...zigLayers, ...barLayers, ...letterLayers, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/aquario-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
