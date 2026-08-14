/**
 * Generates public/korrio-loading-v2.json — "ค่อยๆ ลากเส้น" (drawn line by
 * line) — and public/korrio-avatar.svg, the vector version of the avatar.
 *
 * The avatar's neon tubes were skeletonized to centerline strokes
 * (scripts/korrio-strokes.json: 16 polylines + 3 dots, each carrying its
 * sampled tube color). v2 draws them like the artist would: hair first,
 * then the face outline in one long line, ears, features — and dots the
 * eyes last. Each stroke is a real vector path revealed by an animated
 * trim, with a wide low-opacity twin underneath for the neon glow.
 * In the loop the finished drawing just glows — the halo breathing.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const STROKES = JSON.parse(readFileSync(join(root, 'scripts/korrio-strokes.json'), 'utf8'));

const FR = 60;
const OP = 300;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
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

// image (400²) → comp coords, avatar centered at (400,300) at 110%
const M = ([x, y]) => [Math.round((400 + (x - 200) * 1.1) * 10) / 10, Math.round((300 + (y - 200) * 1.1) * 10) / 10];

// --- drawing order: hair → face → features → neck → dot the eyes ------------
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

// --- vector paths ------------------------------------------------------------
// Catmull-Rom → cubic bezier tangents for smooth strokes
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

// --- timing: proportional to stroke length, 6 → 144 (a slow, patient hand) --
// v2 deviates from the shared timeline: intro 0-150, loop 150-270.
const INTRO_END = 150;
const LOOP_END = 270;
const totalPts = ORDERED.reduce((t, s) => t + (s.pts ? s.pts.length : 4), 0);
let cursor = 6;
const timed = ORDERED.map((s) => {
  const units = s.pts ? s.pts.length : 4;
  const dur = Math.max(4, Math.round((units / totalPts) * 132));
  const t0 = cursor;
  cursor += dur - 1;
  return { ...s, t0, dur };
});

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

const layers = timed.map((s, i) => {
  const path = s.pts ? smoothPath(s.pts) : circlePath(s.circle);
  const [r, g, b] = s.rgb;
  const col = [r / 255, g / 255, b / 255, 1];
  const W = s.pts ? 6.6 : 5.4;
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
    ks: {
      o: still(100),
      r: still(0),
      p: still([0, 0, 0]),
      a: still([0, 0, 0]),
      s: still([100, 100, 100]),
    },
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
              [s.t0, 0, linear],
              [s.t0 + s.dur, 100],
            ]),
            o: still(0),
            m: 1,
          },
          { ty: 'st', c: still(col), o: still(100), w: still(W), lc: 2, lj: 2 },
          {
            ty: 'st',
            c: still(col),
            o: anim([
              [INTRO_END, 30, easeInOut],
              [INTRO_END + 60, 46, easeInOut],
              [LOOP_END, 30],
            ]),
            w: still(W * 2.6),
            lc: 2,
            lj: 2,
          },
          tr(),
        ],
      },
    ],
  };
});

// --- background: sign-shop midnight -----------------------------------------
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
  nm: 'korrio — avatar v2 (drawn line by line)',
  ddd: 0,
  assets: [],
  layers: [...layers, bg],
  markers: [
    { tm: 0, cm: 'intro', dr: 150 },
    { tm: 150, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/korrio-loading-v2.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);

// --- SVG version of the avatar (source for v3) ------------------------------
const svgPath = (raw) => {
  const P = raw.map((p) => p);
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 1; i < P.length; i++) {
    const prev = P[Math.max(0, i - 2)] ?? P[i - 1];
    const a = P[i - 1];
    const b = P[i];
    const next = P[Math.min(P.length - 1, i + 1)];
    const c1 = [a[0] + (b[0] - prev[0]) / 6, a[1] + (b[1] - prev[1]) / 6];
    const c2 = [b[0] - (next[0] - a[0]) / 6, b[1] - (next[1] - a[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${b[0]},${b[1]}`;
  }
  return d;
};

const rgb = (s) => `rgb(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]})`;
const parts = [];
for (const s of STROKES) {
  if (s.pts) {
    const d = svgPath(s.pts);
    parts.push(`<path d="${d}" stroke="${rgb(s)}" stroke-width="15" stroke-opacity="0.28" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
    parts.push(`<path d="${d}" stroke="${rgb(s)}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  } else {
    const [cx, cy, r] = s.circle;
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="${rgb(s)}" fill-opacity="0.28"/>`);
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${rgb(s)}"/>`);
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#1b1a2a"/>
  ${parts.join('\n  ')}
</svg>
`;
const svgOut = join(root, 'public/korrio-avatar.svg');
writeFileSync(svgOut, svg);
console.log(`wrote ${svgOut} (${(svg.length / 1024).toFixed(1)} KB)`);
