/**
 * Generates public/onepiece-loading-v2.json — "wanted!" variant.
 *
 * Story: the jolly-roger lockup slams down onto the parchment like a wanted
 * poster being stamped — dropping from above the camera with a hard scale
 * snap and a crooked-then-straight settle — kicking up dust puffs on impact.
 * Treasure glints pop around the straw-hat skull, and in the loop the logo
 * rests still while the glints twinkle one at a time.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (twinkles only, logo still)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/onepiece', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const slam = { o: { x: [0.7], y: [0] }, i: { x: [0.85], y: [0.6] } }; // accelerates into impact
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

const W = 1240;
const H = 422;
const S = 51.6;

const assets = [
  {
    id: 'logo',
    w: W,
    h: H,
    u: '',
    p: `data:image/png;base64,${asset('logo.png')}`,
    e: 1,
  },
];

// --- the poster: slams down from camera height -------------------------------
const flag = {
  ddd: 0,
  ind: 1,
  ty: 2,
  nm: 'poster',
  refId: 'logo',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [4, 0, linear],
      [8, 100],
    ]),
    a: still([W / 2, H / 2, 0]),
    p: still([400, 300, 0]),
    r: anim([
      [4, -6, slam],
      [12, 1.6, easeOut],
      [20, 0],
    ]),
    s: anim([
      [4, [S * 1.7, S * 1.7, 100], slam],
      [12, [S * 0.97, S * 0.97, 100], easeOut],
      [17, [S * 1.015, S * 1.015, 100], easeOut],
      [22, [S, S, 100]],
    ]),
  },
};

// --- impact dust: puffs kicked out from under the poster ---------------------
const DUST = [
  { x: 130, y: 415, dx: -52, dy: 14, r: 15 },
  { x: 250, y: 425, dx: -30, dy: 22, r: 11 },
  { x: 545, y: 430, dx: -12, dy: 26, r: 13 },
  { x: 660, y: 430, dx: 16, dy: 26, r: 12 },
  { x: 285, y: 180, dx: -34, dy: -20, r: 10 },
  { x: 555, y: 172, dx: 26, dy: -22, r: 11 },
];

const dustLayers = DUST.map(({ x, y, dx, dy, r }, i) => ({
  ddd: 0,
  ind: 5 + i,
  ty: 4,
  nm: `dust-${i}`,
  sr: 1,
  ao: 0,
  ip: 0,
  op: 48,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [12, 0, linear],
      [15, 70, easeOut],
      [34, 0],
    ]),
    r: still(0),
    p: anim([
      [12, [x, y, 0], easeOut],
      [34, [x + dx * 2.2, y + dy * 2.2, 0]],
    ]),
    a: still([0, 0, 0]),
    s: anim([
      [12, [40, 40, 100], easeOut],
      [34, [130, 130, 100]],
    ]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: `dust-${i}-g`,
      it: [
        { ty: 'el', d: 1, s: still([r * 2, r * 2 * 0.8]), p: still([0, 0]) },
        { ty: 'fl', c: still([0.847, 0.812, 0.714, 1]), o: still(100), r: 1 },
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
}));

// --- treasure glints (comp-space; the poster is static once settled) ---------
const starPath = (rOut, rIn) => {
  const v = [];
  for (let k = 0; k < 4; k++) {
    const a1 = ((k * 90 - 90) * Math.PI) / 180;
    const a2 = ((k * 90 - 45) * Math.PI) / 180;
    v.push([rOut * Math.cos(a1), rOut * Math.sin(a1)]);
    v.push([rIn * Math.cos(a2), rIn * Math.sin(a2)]);
  }
  return { c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) };
};

const YELLOW = [0.984, 0.788, 0.09, 1];
const WHITE = [0.988, 0.988, 0.984, 1];

// comp coords: logo top-left is (80, 191.1), scale 0.516 from asset px
const GLINTS = [
  { nm: 'glint-hat', x: 179, y: 232, color: YELLOW, pops: [30, 128] },
  { nm: 'glint-skull', x: 267, y: 281, color: WHITE, pops: [38, 158] },
  { nm: 'glint-arrow', x: 613, y: 235, color: YELLOW, pops: [46, 188] },
];

const glintLayers = GLINTS.map(({ nm, x, y, color, pops }, i) => {
  const sK = [];
  const rK = [];
  pops.forEach((t0) => {
    sK.push([t0, [0, 0, 100], easeOut], [t0 + 8, [100, 100, 100], easeInOut], [t0 + 16, [0, 0, 100], easeInOut]);
    rK.push([t0, 0, linear], [t0 + 16, 60, linear]);
  });
  return {
    ddd: 0,
    ind: 2 + i,
    ty: 4,
    nm,
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: {
      o: still(100),
      r: anim(rK),
      p: still([x, y, 0]),
      a: still([0, 0, 0]),
      s: anim(sK),
    },
    shapes: [
      {
        ty: 'gr',
        nm: `${nm}-g`,
        it: [
          { ty: 'sh', ks: { a: 0, k: starPath(26, 7) } },
          { ty: 'fl', c: still(color), o: still(100), r: 1 },
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
});

// --- background: aged parchment ---------------------------------------------
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
  sc: '#f0efe9',
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
  nm: 'ONE PIECE — loading v2 (wanted!)',
  ddd: 0,
  assets,
  layers: [...glintLayers, ...dustLayers, flag, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/onepiece-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
