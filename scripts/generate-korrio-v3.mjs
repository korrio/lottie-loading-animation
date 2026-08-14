/**
 * Generates public/korrio-loading-v3.json — "clean lines".
 *
 * Built on the vectorized avatar (scripts/korrio-strokes.json — the same
 * paths as public/korrio-avatar.svg), but quieter than v2: the glow is
 * reduced to a thin static halo, and instead of the long line-tracing the
 * strokes materialize quickly — short overlapping draws with a soft fade,
 * the whole portrait present within a second. The loop is still, except
 * the eyes blink once per cycle.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const STROKES = JSON.parse(readFileSync(join(root, 'scripts/korrio-strokes.json'), 'utf8'));

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

const M = ([x, y]) => [Math.round((400 + (x - 200) * 1.1) * 10) / 10, Math.round((300 + (y - 200) * 1.1) * 10) / 10];

const pts = STROKES.filter((s) => s.pts);
const circles = STROKES.filter((s) => s.circle);
const isNeck = (s) => s.color === 'green' && s.pts[0][1] > 290;
const hair = pts.filter((s) => s.color === 'green' && !isNeck(s)).sort((a, b) => b.pts.length - a.pts.length);
const face = pts.filter((s) => s.color === 'blue').sort((a, b) => b.pts.length - a.pts.length);
const feats = pts.filter((s) => s.color === 'yellow');
const neck = pts.filter(isNeck);
const eyeDots = circles.filter((s) => s.color === 'blue');
const otherDots = circles.filter((s) => s.color !== 'blue');
const ORDERED = [...hair, ...face, ...feats, ...neck, ...otherDots, ...eyeDots];

const smoothPath = (raw) => {
  const P = raw.map(M);
  const n = P.length;
  const iT = [];
  const oT = [];
  for (let i = 0; i < n; i++) {
    const prev = P[Math.max(0, i - 1)];
    const next = P[Math.min(n - 1, i + 1)];
    const tx = (next[0] - prev[0]) / 6;
    const ty = (next[1] - prev[1]) / 6;
    oT.push([tx, ty]);
    iT.push([-tx, -ty]);
  }
  return { c: false, v: P, i: iT, o: oT };
};

const circlePath = ([cx, cy, r]) => {
  const [X, Y] = M([cx, cy]);
  const R = r * 1.1;
  const k = R * 0.5523;
  return {
    c: true,
    v: [[X, Y - R], [X + R, Y], [X, Y + R], [X - R, Y]],
    i: [[-k, 0], [0, -k], [k, 0], [0, k]],
    o: [[k, 0], [0, k], [-k, 0], [0, -k]],
  };
};

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

const layers = ORDERED.map((s, i) => {
  const t0 = 6 + i * 3;
  const isEye = s.circle && s.color === 'blue';
  const path = s.pts ? smoothPath(s.pts) : circlePath(s.circle);
  const [r, g, b] = s.rgb;
  const col = [r / 255, g / 255, b / 255, 1];
  const W = s.pts ? 6.2 : 5.2;
  // eyes get a real anchor so the loop blink squashes in place
  const eyeCenter = isEye ? M([s.circle[0], s.circle[1]]) : null;
  const ks = isEye
    ? {
        o: anim([
          [t0, 0, linear],
          [t0 + 4, 100],
        ]),
        r: still(0),
        p: still([...eyeCenter, 0]),
        a: still([...eyeCenter, 0]),
        s: anim([
          [90, [100, 100, 100], easeInOut],
          [146, [100, 100, 100], easeInOut],
          [150, [100, 8, 100], easeInOut],
          [156, [100, 100, 100], easeInOut],
          [210, [100, 100, 100]],
        ]),
      }
    : {
        o: anim([
          [t0, 0, linear],
          [t0 + 4, 100],
        ]),
        r: still(0),
        p: still([0, 0, 0]),
        a: still([0, 0, 0]),
        s: still([100, 100, 100]),
      };
  return {
    ddd: 0,
    ind: 1 + i,
    ty: 4,
    nm: `stroke-${i}`,
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks,
    shapes: [
      {
        ty: 'gr',
        nm: `stroke-${i}-g`,
        it: [
          { ty: 'sh', ks: { a: 0, k: path } },
          {
            ty: 'tm',
            s: still(0),
            e: anim([
              [t0, 0, easeOut],
              [t0 + 9, 100],
            ]),
            o: still(0),
            m: 1,
          },
          { ty: 'st', c: still(col), o: still(100), w: still(W), lc: 2, lj: 2 },
          // reduced glow: thin static halo, no breathing
          { ty: 'st', c: still(col), o: still(14), w: still(W * 1.8), lc: 2, lj: 2 },
          tr(),
        ],
      },
    ],
  };
});

const bg = {
  ddd: 0,
  ind: 40,
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
  sc: '#1b1a2a',
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
};

const lottie = {
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm: 'korrio — avatar v3 (clean lines)',
  ddd: 0,
  assets: [],
  layers: [...layers, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/korrio-loading-v3.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
