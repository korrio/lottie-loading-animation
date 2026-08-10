/**
 * Generates public/onepiece-loading.json — ONE PIECE "hoist the colors".
 *
 * Story: the jolly-roger lockup drops in hung from its top edge like a
 * pirate flag and pendulum-settles — overshooting a few degrees each way
 * before hanging straight. Treasure glints pop around the straw-hat skull
 * as it settles. In the loop the flag sways ±1.2° in a slow breeze while
 * the glints keep twinkling one at a time.
 *
 * The vecteezy SVG paints all black artwork as one compound path (letters,
 * outlines, skull, bars all connected), so the logo animates as a single
 * sprite; the sparkles are shape layers parented to the flag so they sway
 * with it.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (sway period 120, twinkles)
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
const S = 51.6; // display ~640px wide

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

// --- the flag: hung from its top edge, drops in and pendulum-settles --------
const HANG_Y = 191.1; // comp y of the hang point (logo top-center)
const flag = {
  ddd: 0,
  ind: 1,
  ty: 2,
  nm: 'flag',
  refId: 'logo',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [2, 0, linear],
      [8, 100],
    ]),
    a: still([W / 2, 0, 0]),
    p: anim([
      [2, [400, HANG_Y - 70, 0], easeOut],
      [16, [400, HANG_Y, 0]],
    ]),
    r: anim([
      [2, -7, easeInOut],
      [16, 3.5, easeInOut],
      [28, -1.8, easeInOut],
      [38, 0.8, easeInOut],
      [46, 0, easeInOut],
      // loop: slow breeze (period 120)
      [90, 0, easeInOut],
      [120, 1.2, easeInOut],
      [150, 0, easeInOut],
      [180, -1.2, easeInOut],
      [210, 0],
    ]),
    s: still([S, S, 100]),
  },
};

// --- treasure glints: 4-point stars parented to the flag ---------------------
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

// positions in the flag's own pixel space (parented → sway with the flag)
const GLINTS = [
  { nm: 'glint-hat', x: 191, y: 79, color: YELLOW, pops: [40, 128] },
  { nm: 'glint-skull', x: 363, y: 174, color: WHITE, pops: [48, 158] },
  { nm: 'glint-bones', x: 41, y: 358, color: YELLOW, pops: [56, 188] },
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
    parent: 1,
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
          { ty: 'sh', ks: { a: 0, k: starPath(52, 13) } },
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
  nm: 'ONE PIECE — loading (hoist the colors)',
  ddd: 0,
  assets,
  layers: [...glintLayers, flag, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/onepiece-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
