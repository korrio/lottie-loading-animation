/**
 * Generates public/fastcourt-loading-v2.json — "dash in" without the tagline.
 *
 * Story: the F mark sprints in from the left — stretched by its own speed —
 * overshoots and settles with a skid. The nine wordmark letters are laid down
 * left-to-right in its wake, the acid tagline fades up, and in the loop the
 * mark keeps straining forward while speed lines whoosh past its streaks.
 * Identical to v1 except the BOOKING INFRASTRUCTURE tagline is omitted.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90] intro   [90..210] seamless loop (whoosh period 60, strain period 60)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/fastcourt', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const dash = { o: { x: [0.15], y: [0.7] }, i: { x: [0.3], y: [1] } }; // hard launch, soft arrive
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

const IMAGES = [
  { id: 'mark', w: 237, h: 173 },
  { id: 'f', w: 71, h: 98 },
  { id: 'a', w: 74, h: 78 },
  { id: 's', w: 69, h: 78 },
  { id: 't1', w: 57, h: 95 },
  { id: 'c', w: 86, h: 100 },
  { id: 'o', w: 79, h: 78 },
  { id: 'u', w: 79, h: 77 },
  { id: 'r', w: 60, h: 77 },
  { id: 't2', w: 56, h: 95 },
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

const S = 75; // logo layers render at 75% of source pixels

// --- mark: sprints in from off-canvas left, overshoots, skids to a stop ----
const MX = 172.0;
const MY = 270.0;
const mark = layer(1, 'mark', {
  o: anim([
    [0, 0, linear],
    [3, 100],
  ]),
  r: still(0),
  p: anim([
    [0, [-140, MY, 0], dash],
    [14, [MX + 16, MY, 0], easeInOut],
    [22, [MX, MY, 0], easeInOut],
    // loop: straining forward against its own speed lines (period 60)
    [90, [MX, MY, 0], easeInOut],
    [120, [MX + 4, MY, 0], easeInOut],
    [150, [MX, MY, 0], easeInOut],
    [180, [MX + 4, MY, 0], easeInOut],
    [210, [MX, MY, 0]],
  ]),
  s: anim([
    [0, [S * 1.3, S * 0.88, 100], easeOut],
    [14, [S * 0.96, S * 1.04, 100], easeInOut],
    [21, [S, S, 100]],
  ]),
});

// --- wordmark letters: laid down left-to-right in the mark's wake ----------
const LETTERS = [
  ['f', 299.5, 270.4],
  ['a', 345.6, 278.6],
  ['s', 396.3, 278.6],
  ['t1', 442.0, 272.3],
  ['c', 493.4, 270.4],
  ['o', 547.0, 278.6],
  ['u', 607.0, 279.0],
  ['r', 656.9, 278.3],
  ['t2', 696.6, 272.3],
];

const letterLayers = LETTERS.map(([id, x, y], i) => {
  const t0 = 22 + i * 3;
  return layer(2 + i, id, {
    o: anim([
      [t0, 0, linear],
      [t0 + 5, 100],
    ]),
    r: still(0),
    p: anim([
      [t0, [x - 28, y, 0], easeOut],
      [t0 + 8, [x, y, 0]],
    ]),
    s: still([S, S, 100]),
  });
});

// --- speed-line whooshes ----------------------------------------------------
// Thin rounded dashes that streak leftward past the mark's tails. Each cycle:
// appear near the mark, sweep left while fading, hold invisible, reset.
const whoosh = (ind, nm, { w, h, y, color, opMax, x0, x1, cycles }) => {
  const oK = [];
  const pK = [];
  cycles.forEach((c) => {
    oK.push([c, 0, linear], [c + 4, opMax, easeOut], [c + 26, 0, null, true]);
    pK.push([c, [x0, y, 0], dash], [c + 26, [x1, y, 0], null, true]);
  });
  // explicit reset so v(90) === v(210) even for invisible properties
  const last = cycles[cycles.length - 1];
  oK.push([last + 56, 0, null, true]);
  pK.push([last + 56, [x0, y, 0], null, true]);
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm,
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: {
      o: anim(oK),
      r: still(0),
      p: anim(pK),
      a: still([0, 0, 0]),
      s: still([100, 100, 100]),
    },
    shapes: [
      {
        ty: 'gr',
        nm: `${nm}-g`,
        it: [
          { ty: 'rc', d: 1, s: still([w, h]), p: still([0, 0]), r: still(h / 2) },
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
};

const ACID = [0.710, 0.878, 0.224, 1];
const WHITE = [1, 1, 1, 1];

const whooshes = [
  // intro echo right after the mark lands, then loop cycles (period 60)
  whoosh(13, 'whoosh-a', { w: 46, h: 7, y: 228, color: ACID, opMax: 75, x0: 126, x1: 42, cycles: [26, 90, 150] }),
  whoosh(14, 'whoosh-b', { w: 34, h: 6, y: 276, color: WHITE, opMax: 38, x0: 140, x1: 54, cycles: [34, 120, 180] }),
  whoosh(15, 'whoosh-c', { w: 24, h: 5, y: 313, color: ACID, opMax: 55, x0: 148, x1: 74, cycles: [105, 165] }),
];

// --- background: FastCourt deep navy ---------------------------------------
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
  sc: '#0f1638',
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
  nm: 'FastCourt — loading v2 (dash in, no tagline)',
  ddd: 0,
  assets,
  layers: [mark, ...letterLayers, ...whooshes, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/fastcourt-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
