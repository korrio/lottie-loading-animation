/**
 * Generates the LegalConnect (legalconnect.co.th) loading animations:
 *
 *   legalconnect-loading.json     v1 — the connection draws: gold dots pop
 *                                 in sequence, the orange node-C wipes on
 *                                 around its arc, letters rise, tagline
 *                                 fades; on loop a pulse travels dot to dot.
 *   legalconnect-loading-v2.json  v2 — the quiet build: mark and words fade
 *                                 and slide in as calm groups; on loop a
 *                                 brightened copy of the C breathes softly.
 *   legalconnect-loading-v3.json  v3 — connect the dots: scattered dots
 *                                 glide into the grid, the C snaps in,
 *                                 words rise, the tagline wipes on; on loop
 *                                 the whole network breathes twice.
 *
 * The five gold dots are pure vectors (#FABD3D circles measured from the
 * official SVG raster); the orange C, twelve blue letters, and the tagline
 * are alpha crops. Transparent background per house rule.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/legalconnect', name)).toString('base64');

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
const tr = () => ({
  ty: 'tr',
  p: still([0, 0]),
  a: still([0, 0]),
  s: still([100, 100]),
  r: still(0),
  o: still(100),
  sk: still(0),
  sa: still(0),
});
const R1 = (v) => Math.round(v * 10) / 10;

const K = 680 / 1250; // raster px → comp px
const X = (x) => R1(60 + x * K);
const Y = (y) => R1(204 + y * K);
const SPR = R1(K * 100); // sprite display scale (54.4)

const GOLD = [250 / 255, 189 / 255, 61 / 255, 1];
const DOT_R = R1(43 * K);
// grid order traces the corner: down the left column, then across the bottom
const DOTS = [
  [43.5, 45],
  [43.5, 172],
  [43.5, 299],
  [170, 299],
  [297, 299],
];

const CMARK = { w: 198, h: 198, cx: 233.5, cy: 108.5 };
const TAG = { w: 837, h: 55, cx: 833, cy: 327 };
const W1 = [
  ['w1-0', 88, 118, 458.5, 58.5],
  ['w1-1', 92, 118, 558.5, 58.5],
  ['w1-2', 114, 122, 670.5, 58.5],
  ['w1-3', 131, 118, 796.5, 58.5],
  ['w1-4', 88, 118, 912.5, 58.5],
];
const W2 = [
  ['w2-0', 113, 122, 471.5, 210.5],
  ['w2-1', 129, 121, 595.5, 211],
  ['w2-2', 108, 118, 728.5, 210.5],
  ['w2-3', 108, 118, 858.5, 210.5],
  ['w2-4', 92, 118, 980.5, 210.5],
  ['w2-5', 112, 122, 1092.5, 210.5],
  ['w2-6', 103, 118, 1199, 210.5],
];

const imgLayer = (ind, refId, w, h, cx, cy, ks = {}, extra = {}) => ({
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
  ...extra,
  ks: {
    o: still(100),
    r: still(0),
    p: still([X(cx), Y(cy), 0]),
    a: still([w / 2, h / 2, 0]),
    s: still([SPR, SPR, 100]),
    ...ks,
  },
});

const dotLayer = (ind, i, ks = {}) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm: `dot-${i}`,
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: still(100),
    r: still(0),
    p: still([X(DOTS[i][0]), Y(DOTS[i][1]), 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
    ...ks,
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'dot-g',
      it: [
        { ty: 'el', d: 1, s: still([DOT_R * 2, DOT_R * 2]), p: still([0, 0]) },
        { ty: 'fl', c: still(GOLD), o: still(100), r: 1 },
        tr(),
      ],
    },
  ],
});

const baseAssets = [
  { id: 'cmark', w: CMARK.w, h: CMARK.h, u: '', p: `data:image/png;base64,${asset('lc-c.png')}`, e: 1 },
  { id: 'tag', w: TAG.w, h: TAG.h, u: '', p: `data:image/png;base64,${asset('lc-tag.png')}`, e: 1 },
  { id: 'cglow', w: CMARK.w, h: CMARK.h, u: '', p: `data:image/png;base64,${asset('lc-c-glow.png')}`, e: 1 },
  ...[...W1, ...W2].map(([id, w, h]) => ({
    id,
    w,
    h,
    u: '',
    p: `data:image/png;base64,${asset(`lc-${id}.png`)}`,
    e: 1,
  })),
];

const doc = (nm, layers) => ({
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm,
  ddd: 0,
  assets: baseAssets,
  layers,
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
});

// pulse wave helper: dot i returns to 100 inside the loop (seamless)
const pulse = (t0, up = 110, dur = 16) => [
  [t0, [100, 100, 100], easeOut],
  [t0 + dur / 2, [up, up, 100], easeInOut],
  [t0 + dur, [100, 100, 100], easeInOut],
];

// ============================================================================
// v1 — the connection draws
// ============================================================================
// pie-wedge mask sweeping the C on around its arc (top tip, counterclockwise
// through the left, to the bottom tip)
const wedgeKeys = [];
const CC = [CMARK.w / 2 + 0.5, CMARK.h / 2 + 0.5];
const WR = 260;
const rim = (deg) => [R1(CC[0] + WR * Math.cos((deg * Math.PI) / 180)), R1(CC[1] + WR * Math.sin((deg * Math.PI) / 180))];
const easeP = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
for (let t = 20; t <= 42; t += 2) {
  const p = easeP((t - 20) / 22);
  const sweep = 0.5 + 251 * p;
  const a0 = -55;
  const v = [CC, rim(a0), rim(a0 - sweep / 3), rim(a0 - (2 * sweep) / 3), rim(a0 - sweep)];
  wedgeKeys.push({
    t,
    s: [{ c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) }],
    ...(t < 42 ? { o: linear.o, i: linear.i } : {}),
  });
}

const v1Dots = DOTS.map((_, i) =>
  dotLayer(20 + i, i, {
    s: anim([
      [4 + i * 4, [0, 0, 100], easeOut],
      [9 + i * 4, [112, 112, 100], easeInOut],
      [13 + i * 4, [100, 100, 100], easeInOut],
      [80, [100, 100, 100], easeInOut],
      ...pulse(94 + i * 10),
      [210, [100, 100, 100]],
    ]),
  })
);

const v1C = imgLayer(
  10,
  'cmark',
  CMARK.w,
  CMARK.h,
  CMARK.cx,
  CMARK.cy,
  {
    o: anim([
      [20, 0, linear],
      [22, 100],
    ]),
    s: anim([
      [80, [SPR, SPR, 100], easeInOut],
      ...pulse(150, R1(SPR * 1.03)).map(([t, [sx], e]) => [t, [sx === 100 ? SPR : sx, sx === 100 ? SPR : sx, 100], e]),
      [210, [SPR, SPR, 100]],
    ]),
  },
  { hasMask: true, masksProperties: [{ inv: false, mode: 'a', pt: { a: 1, k: wedgeKeys }, o: still(100), x: still(0), nm: 'wipe' }] }
);

const riseLetter = (ind, [id, w, h, cx, cy], t0) =>
  imgLayer(ind, id, w, h, cx, cy, {
    o: anim([
      [t0, 0, linear],
      [t0 + 4, 100],
    ]),
    p: anim([
      [t0, [X(cx), Y(cy) + 18, 0], easeOut],
      [t0 + 8, [X(cx), Y(cy), 0]],
    ]),
  });

const v1 = doc('LegalConnect — the connection draws', [
  v1C,
  ...W1.map((L, i) => riseLetter(30 + i, L, 40 + i * 3)),
  ...W2.map((L, i) => riseLetter(35 + i, L, 50 + i * 3)),
  imgLayer(50, 'tag', TAG.w, TAG.h, TAG.cx, TAG.cy, {
    o: anim([
      [76, 0, linear],
      [86, 100],
    ]),
    p: anim([
      [76, [X(TAG.cx), Y(TAG.cy) + 12, 0], easeOut],
      [88, [X(TAG.cx), Y(TAG.cy), 0]],
    ]),
  }),
  ...v1Dots,
]);

// ============================================================================
// v2 — the quiet build (calm corporate fades + a glint on loop)
// ============================================================================
const groupFade = (t0, dur = 16) =>
  anim([
    [t0, 0, linear],
    [t0 + dur, 100],
  ]);
const wordNull = (ind, t0) => ({
  ddd: 0,
  ind,
  ty: 3,
  nm: `word-rig-${ind}`,
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: still(0),
    r: still(0),
    p: anim([
      [t0, [-26, 0, 0], easeOut],
      [t0 + 18, [0, 0, 0]],
    ]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
});

const v2MarkScale = anim([
  [4, [96, 96, 100], easeInOut],
  [22, [100, 100, 100]],
]);
const v2Dots = DOTS.map((_, i) =>
  dotLayer(20 + i, i, {
    o: groupFade(4),
    s: anim([
      [4, [96, 96, 100], easeInOut],
      [22, [100, 100, 100]],
    ]),
  })
);
const v2C = imgLayer(10, 'cmark', CMARK.w, CMARK.h, CMARK.cx, CMARK.cy, {
  o: groupFade(4),
  s: anim([
    [4, [R1(SPR * 0.96), R1(SPR * 0.96), 100], easeInOut],
    [22, [SPR, SPR, 100]],
  ]),
});

// loop accent: a brightened copy of the C breathes over it, twice per loop
const v2Glow = imgLayer(9, 'cglow', CMARK.w, CMARK.h, CMARK.cx, CMARK.cy, {
  o: anim([
    [90, 0, easeInOut],
    [104, 45, easeInOut],
    [118, 0, easeInOut],
    [150, 0, easeInOut],
    [164, 45, easeInOut],
    [178, 0, null, true],
    [210, 0],
  ]),
});

const v2 = doc('LegalConnect — the quiet build', [
  v2Glow,
  v2C,
  ...W1.map((L, i) => ({ ...imgLayer(30 + i, L[0], L[1], L[2], L[3], L[4], { o: groupFade(16) }), parent: 60 })),
  ...W2.map((L, i) => ({ ...imgLayer(35 + i, L[0], L[1], L[2], L[3], L[4], { o: groupFade(24) }), parent: 61 })),
  imgLayer(50, 'tag', TAG.w, TAG.h, TAG.cx, TAG.cy, { o: groupFade(44) }),
  ...v2Dots,
  wordNull(60, 16),
  wordNull(61, 24),
]);

// ============================================================================
// v3 — connect the dots
// ============================================================================
const SCATTER = [
  [-70, -30],
  [60, -55],
  [-55, 45],
  [35, 70],
  [85, 25],
];
const v3Dots = DOTS.map(([dx, dy], i) => {
  const hx = X(dx);
  const hy = Y(dy);
  const t0 = 6 + i * 4;
  return dotLayer(20 + i, i, {
    o: anim([
      [t0, 0, linear],
      [t0 + 4, 100],
    ]),
    p: anim([
      [t0, [hx + SCATTER[i][0], hy + SCATTER[i][1], 0], easeInOut],
      [t0 + 16, [hx, hy, 0]],
    ]),
    s: anim([
      [80, [100, 100, 100], easeOut],
      ...pulse(90, 105, 24),
      ...pulse(150, 105, 24),
      [210, [100, 100, 100]],
    ]),
  });
});

const v3C = imgLayer(10, 'cmark', CMARK.w, CMARK.h, CMARK.cx, CMARK.cy, {
  o: anim([
    [30, 0, linear],
    [33, 100],
  ]),
  r: anim([
    [30, -8, easeOut],
    [44, 0],
  ]),
  s: anim([
    [30, [0, 0, 100], easeOut],
    [38, [R1(SPR * 1.05), R1(SPR * 1.05), 100], easeInOut],
    [44, [SPR, SPR, 100], easeInOut],
    [80, [SPR, SPR, 100], easeOut],
    ...pulse(90, R1(SPR * 1.05), 24).map(([t, [sx], e]) => [t, [sx === 100 ? SPR : sx, sx === 100 ? SPR : sx, 100], e]),
    ...pulse(150, R1(SPR * 1.05), 24).map(([t, [sx], e]) => [t, [sx === 100 ? SPR : sx, sx === 100 ? SPR : sx, 100], e]),
    [210, [SPR, SPR, 100]],
  ]),
});

const tagWipe = {
  ...imgLayer(50, 'tag', TAG.w, TAG.h, TAG.cx, TAG.cy, { o: still(100) }),
  hasMask: true,
  masksProperties: [
    {
      inv: false,
      mode: 'a',
      pt: {
        a: 1,
        k: [
          {
            t: 66,
            s: [{ c: true, v: [[-4, -4], [0, -4], [0, TAG.h + 4], [-4, TAG.h + 4]], i: [[0,0],[0,0],[0,0],[0,0]], o: [[0,0],[0,0],[0,0],[0,0]] }],
            o: easeInOut.o,
            i: easeInOut.i,
          },
          {
            t: 84,
            s: [{ c: true, v: [[-4, -4], [TAG.w + 4, -4], [TAG.w + 4, TAG.h + 4], [-4, TAG.h + 4]], i: [[0,0],[0,0],[0,0],[0,0]], o: [[0,0],[0,0],[0,0],[0,0]] }],
          },
        ],
      },
      o: still(100),
      x: still(0),
      nm: 'wipe',
    },
  ],
};

const v3 = doc('LegalConnect — connect the dots', [
  v3C,
  ...W1.map((L, i) => riseLetter(30 + i, L, 44 + i * 2.5)),
  ...W2.map((L, i) => riseLetter(35 + i, L, 52 + i * 2.5)),
  tagWipe,
  ...v3Dots,
]);

for (const [name, d] of [
  ['legalconnect-loading.json', v1],
  ['legalconnect-loading-v2.json', v2],
  ['legalconnect-loading-v3.json', v3],
]) {
  const file = join(root, `public/${name}`);
  writeFileSync(file, JSON.stringify(d));
  console.log(`wrote ${file} (${(JSON.stringify(d).length / 1024).toFixed(0)} KB)`);
}
