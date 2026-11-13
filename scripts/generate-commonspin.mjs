/**
 * Generates public/commonspin-loading.json (+ white edition) — a Lottie
 * loading animation for The Common Spin.
 *
 * "The spin cycle": the letters of common spin into place, the looping
 * mm line draws itself left to right, then SPIN flips up from below.
 * On loop a pulse wave travels through s-p-i-n while the mm line shimmers.
 *
 * Timeline (60fps, 240 frames, 800×600): intro [0..90], loop [90..210].
 * Both files are fully transparent — the page DOM supplies the background.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const META = JSON.parse(readFileSync(join(root, 'scripts/commonspin-meta.json')));

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };

const kf = (frames) =>
  frames.map(([t, s, ease], idx) => {
    const k = { t, s: Array.isArray(s) ? s : [s] };
    if (idx !== frames.length - 1) {
      const e = ease ?? easeInOut;
      k.o = e.o;
      k.i = e.i;
    }
    return k;
  });
const anim = (frames) => ({ a: 1, k: kf(frames) });
const still = (v) => ({ a: 0, k: v });

// logo px → comp coords
const K = 0.84;
const OX = 400 - (738 * K) / 2;
const OY = 300 - (262 * K) / 2;
const px = (cx) => OX + cx * K;
const py = (cy) => OY + cy * K;
const S = K * 100;

const build = (suffix) => {
  const asset = (nm) =>
    readFileSync(join(root, `public/assets/commonspin/cs-${nm}${suffix}.png`)).toString('base64');

  const assets = Object.entries(META).map(([id, { w, h }]) => ({
    id,
    w,
    h,
    u: '',
    p: `data:image/png;base64,${asset(id)}`,
    e: 1,
  }));

  const layer = (ind, id, ks, extra = {}) => {
    const { w, h } = META[id];
    return {
      ddd: 0,
      ind,
      ty: 2,
      nm: id,
      refId: id,
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

  // spin-in: scale up while rotating to rest
  const spinIn = (ind, id, t0) => {
    const { cx, cy } = META[id];
    return layer(ind, id, {
      o: anim([
        [t0, 0, easeOut],
        [t0 + 8, 100],
      ]),
      r: anim([
        [t0, -160, easeOut],
        [t0 + 14, 8, easeInOut],
        [t0 + 20, 0],
      ]),
      p: still([px(cx), py(cy), 0]),
      s: anim([
        [t0, [0, 0, 100], easeOut],
        [t0 + 14, [S * 1.08, S * 1.08, 100], easeInOut],
        [t0 + 20, [S, S, 100]],
      ]),
    });
  };

  // flip up from below with a loop pulse wave (twice per loop, period 60)
  const flipUp = (ind, id, t0, beat) => {
    const { cx, cy } = META[id];
    const pulses = [];
    for (const c of [96 + beat, 156 + beat]) {
      pulses.push([c, [S, S, 100], easeInOut], [c + 8, [S * 1.09, S * 1.09, 100], easeInOut], [c + 16, [S, S, 100], easeInOut]);
    }
    return layer(ind, id, {
      o: anim([
        [t0, 0, easeOut],
        [t0 + 10, 100],
      ]),
      r: anim([
        [t0, 30, easeOut],
        [t0 + 14, -3, easeInOut],
        [t0 + 18, 0],
      ]),
      p: anim([
        [t0, [px(cx), py(cy) + 26, 0], easeOut],
        [t0 + 14, [px(cx), py(cy), 0]],
      ]),
      s: anim([
        [t0, [S, S, 100], easeOut],
        [t0 + 14, [S, S, 100], easeInOut],
        ...pulses,
      ]),
    });
  };

  // the — slides in from the left, quiet
  const the = layer(1, 'the', {
    o: anim([
      [4, 0, easeOut],
      [14, 100],
    ]),
    r: still(0),
    p: anim([
      [4, [px(META.the.cx) - 22, py(META.the.cy), 0], easeOut],
      [16, [px(META.the.cx), py(META.the.cy), 0]],
    ]),
    s: still([S, S, 100]),
  });

  // mm — the looping line draws itself via an animated rect mask,
  // then shimmers on loop
  const mmW = META.mm.w;
  const mmH = META.mm.h;
  const maskRect = (edge) => [
    {
      c: true,
      v: [
        [-6, -6],
        [edge, -6],
        [edge, mmH + 6],
        [-6, mmH + 6],
      ],
      i: [[0, 0], [0, 0], [0, 0], [0, 0]],
      o: [[0, 0], [0, 0], [0, 0], [0, 0]],
    },
  ];
  const mm = layer(
    5,
    'mm',
    {
      o: anim([
        [90, 100, easeInOut],
        [120, 70, easeInOut],
        [150, 100, easeInOut],
        [180, 70, easeInOut],
        [210, 100],
      ]),
      r: still(0),
      p: still([px(META.mm.cx), py(META.mm.cy), 0]),
      s: still([S, S, 100]),
    },
    {
      hasMask: true,
      masksProperties: [
        {
          inv: false,
          mode: 'a',
          nm: 'draw',
          o: still(100),
          x: still(0),
          pt: {
            a: 1,
            k: [
              { t: 20, s: maskRect(-4), o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } },
              { t: 48, s: maskRect(mmW + 6) },
            ],
          },
        },
      ],
    },
  );

  const layers = [
    the,
    spinIn(2, 'c', 8),
    spinIn(3, 'o1', 14),
    mm,
    spinIn(6, 'o2', 36),
    spinIn(7, 'n1', 42),
    flipUp(8, 's', 50, 0),
    flipUp(9, 'p', 56, 6),
    flipUp(10, 'i', 62, 12),
    flipUp(11, 'n2', 68, 18),
  ];

  return {
    v: '5.9.6',
    fr: FR,
    ip: 0,
    op: OP,
    w: 800,
    h: 600,
    nm: `The Common Spin — loading${suffix ? ' (white)' : ''}`,
    ddd: 0,
    assets,
    layers,
    markers: [
      { tm: 0, cm: 'intro', dr: 90 },
      { tm: 90, cm: 'loop', dr: 120 },
    ],
  };
};

for (const [suffix, file] of [
  ['', 'commonspin-loading.json'],
  ['-w', 'commonspin-loading-white.json'],
]) {
  const doc = build(suffix);
  const out = join(root, `public/${file}`);
  writeFileSync(out, JSON.stringify(doc));
  console.log(`wrote ${out} (${(JSON.stringify(doc).length / 1024).toFixed(0)} KB)`);
}
