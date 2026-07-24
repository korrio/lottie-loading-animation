/**
 * Generates public/courthaus-loading.json — a self-contained Lottie loading
 * animation for the COURTHAUS logo.
 *
 * Timeline (60fps, 240 frames, 800×600):
 *   [0..90]   intro — letters pop in staggered; the tennis-ball "O" drops
 *             into its slot with a bounce + squash while spinning
 *   [90..210] seamless loop — ball rotation covers exactly 360° (3°/frame),
 *             dot pulses have period 40, so frame 90 === frame 210
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/courthaus', name)).toString('base64');

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const easeIn = { o: { x: [0.55], y: [0] }, i: { x: [0.95], y: [0.8] } };
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

// --- glyph layout ----------------------------------------------------------
// centers measured in logo coords (791×315), mapped into the comp at 70%
const SCALE = 0.7;
const X0 = 123;
const Y0 = 150;
const cx = (x) => X0 + x * SCALE;
const cy = (y) => Y0 + y * SCALE;

const GLYPHS = [
  { id: 'C', c: [97.5, 99], w: 115, h: 128, pop: 6 },
  { id: 'U1', c: [401.5, 99], w: 129, h: 126, pop: 14 },
  { id: 'R', c: [554.5, 98], w: 131, h: 124, pop: 22 },
  { id: 'T', c: [695.5, 98], w: 111, h: 124, pop: 30 },
  { id: 'H', c: [104, 246], w: 128, h: 124, pop: 38 },
  { id: 'A', c: [253.5, 246], w: 129, h: 124, pop: 44 },
  { id: 'U2', c: [401.5, 247], w: 129, h: 126, pop: 50 },
  { id: 'S', c: [548, 246], w: 116, h: 128, pop: 56 },
];
const BALL = { id: 'ball', c: [254, 98], w: 142, h: 142 };

const assets = [...GLYPHS, BALL].map(({ id, w, h }) => ({
  id,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(`${id}.png`)}`,
  e: 1,
}));

const layerBase = (ind, refId, w, h) => ({
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
  ks: { a: still([w / 2, h / 2, 0]) },
});

// --- letters: staggered pop-in ---------------------------------------------
const S100 = SCALE * 100;
const letters = GLYPHS.map((g, i) => {
  const t = g.pop;
  const layer = layerBase(i + 2, g.id, g.w, g.h);
  layer.ks = {
    ...layer.ks,
    o: anim([
      [t, 0, easeOut],
      [t + 5, 100],
    ]),
    r: still(0),
    p: still([cx(g.c[0]), cy(g.c[1]), 0]),
    s: anim([
      [t, [S100 * 0.3, S100 * 0.3, 100], easeOut],
      [t + 8, [S100 * 1.12, S100 * 1.12, 100], easeInOut],
      [t + 13, [S100, S100, 100]],
    ]),
  };
  return layer;
});

// --- ball "O": drops in spinning, bounces into its slot --------------------
const BX = cx(BALL.c[0]);
const BY = cy(BALL.c[1]);
const ball = layerBase(1, 'ball', BALL.w, BALL.h);
ball.ks = {
  ...ball.ks,
  o: still(100),
  // 3°/frame → 720° over 240 frames; frames 90→210 span exactly 360°
  r: anim([
    [0, 0, linear],
    [OP, 720],
  ]),
  p: anim([
    [24, [BX, -120, 0], easeIn],
    [44, [BX, BY, 0], easeOut],
    [54, [BX, BY - 34, 0], easeIn],
    [63, [BX, BY, 0], easeOut],
    [70, [BX, BY - 12, 0], easeIn],
    [76, [BX, BY, 0]],
  ]),
  s: anim([
    [24, [S100 * 0.94, S100 * 1.06, 100], easeInOut],
    [44, [S100 * 0.94, S100 * 1.06, 100], easeInOut],
    [48, [S100 * 1.12, S100 * 0.86, 100], easeInOut],
    [54, [S100 * 0.96, S100 * 1.05, 100], easeInOut],
    [60, [S100 * 1.03, S100 * 0.98, 100], easeInOut],
    [66, [S100, S100, 100]],
  ]),
};

// --- loading dots: pop in, then pulse with period 40 -----------------------
const TERRA = [0.69, 0.384, 0.204, 1]; // #b06234

const dotGroup = (x, off) => {
  const pulse = [];
  let v = 30;
  for (let t = 10 + off; t <= OP + 20; t += 20) {
    pulse.push([t, v, easeInOut]);
    v = v === 30 ? 100 : 30;
  }
  return {
    ty: 'gr',
    nm: `dot-${x}`,
    it: [
      { ty: 'el', p: still([0, 0]), s: still([15, 15]), nm: 'circle' },
      { ty: 'fl', c: still(TERRA), o: still(100), r: 1, nm: 'fill' },
      {
        ty: 'tr',
        p: still([x, 0]),
        a: still([0, 0]),
        s: anim([
          [58 + off * 0.3, [0, 0], easeOut],
          [70 + off * 0.3, [118, 118], easeInOut],
          [78 + off * 0.3, [100, 100]],
        ]),
        r: still(0),
        o: anim(pulse),
        sk: still(0),
        sa: still(0),
      },
    ],
  };
};

const dots = {
  ddd: 0,
  ind: 10,
  ty: 4,
  nm: 'loading-dots',
  sr: 1,
  ks: {
    o: still(100),
    r: still(0),
    p: still([400, 460, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  ao: 0,
  shapes: [dotGroup(-34, 0), dotGroup(0, 13), dotGroup(34, 27)],
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
  nm: 'COURTHAUS — loading',
  ddd: 0,
  assets,
  layers: [ball, ...letters, dots],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/courthaus-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
