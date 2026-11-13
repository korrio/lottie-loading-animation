/**
 * Generates public/dcms-loading.json — a Lottie loading animation for
 * DCMS 365 (Debt Collection Management System, PBX-powered).
 *
 * "The trusted line": built for confidence and credibility — the letters
 * stamp into place with firm, weighty settles (no playful spins), the
 * people icon takes its seat inside the C, and the 365 call badge drops
 * down last like a stamp of approval, sending out a call-signal ring.
 * On loop the letters hold perfectly still (stability) while the badge
 * pulses gently like a live PBX line, each beat radiating a signal ring.
 *
 * The tagline and the rule under it are intentionally left out per brief.
 *
 * Timeline (60fps, 240 frames, 800×600): intro [0..90], loop [90..210].
 * The file is fully transparent — the page DOM supplies the background.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const META = JSON.parse(readFileSync(join(root, 'scripts/dcms-meta.json')));

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };

const kf = (frames) =>
  frames.map(([t, s, ease, hold], idx) => {
    const k = { t, s: Array.isArray(s) ? s : [s] };
    if (hold) k.h = 1;
    else if (idx !== frames.length - 1) {
      const e = ease ?? easeInOut;
      k.o = e.o;
      k.i = e.i;
    }
    return k;
  });
const anim = (frames) => ({ a: 1, k: kf(frames) });
const still = (v) => ({ a: 0, k: v });

// logo px → comp coords (content bbox center (247.5, 219.5))
const K = 1.15;
const OX = 400 - 247.5 * K;
const OY = 300 - 219.5 * K;
const px = (cx) => OX + cx * K;
const py = (cy) => OY + cy * K;
const S = K * 100;

const asset = (nm) =>
  readFileSync(join(root, `public/assets/dcms/dcms-${nm}.png`)).toString('base64');

const assets = Object.entries(META).map(([id, { w, h }]) => ({
  id,
  w,
  h,
  u: '',
  p: `data:image/png;base64,${asset(id)}`,
  e: 1,
}));

const layer = (ind, id, ks) => {
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
  };
};

// firm stamp: rise a touch from below and lock in place — no spin, no bounce
const stamp = (ind, id, t0) => {
  const { cx, cy } = META[id];
  return layer(ind, id, {
    o: anim([
      [t0, 0, easeOut],
      [t0 + 9, 100],
    ]),
    r: still(0),
    p: anim([
      [t0, [px(cx), py(cy) + 16, 0], easeOut],
      [t0 + 12, [px(cx), py(cy), 0]],
    ]),
    s: anim([
      [t0, [S * 0.94, S * 0.94, 100], easeOut],
      [t0 + 12, [S, S, 100]],
    ]),
  });
};

// people icon takes its seat inside the C
const people = (ind, t0) => {
  const { cx, cy } = META.people;
  return layer(ind, 'people', {
    o: anim([
      [t0, 0, easeOut],
      [t0 + 6, 100],
    ]),
    r: still(0),
    p: still([px(cx), py(cy), 0]),
    s: anim([
      [t0, [0, 0, 100], easeOut],
      [t0 + 8, [S * 1.1, S * 1.1, 100], easeInOut],
      [t0 + 13, [S, S, 100]],
    ]),
  });
};

// the 365 call badge drops in like a stamp of approval, then pulses
// gently on loop like a live PBX line
const badge = (ind, t0) => {
  const { cx, cy } = META.badge;
  const pulses = [];
  for (const c of [96, 156]) {
    pulses.push(
      [c, [S, S, 100], easeInOut],
      [c + 10, [S * 1.045, S * 1.045, 100], easeInOut],
      [c + 20, [S, S, 100], easeInOut],
    );
  }
  return layer(ind, 'badge', {
    o: anim([
      [t0, 0, easeOut],
      [t0 + 7, 100],
    ]),
    r: still(0),
    p: anim([
      [t0, [px(cx), py(cy) - 34, 0], easeOut],
      [t0 + 10, [px(cx), py(cy) + 3, 0], easeInOut],
      [t0 + 15, [px(cx), py(cy), 0]],
    ]),
    s: anim([
      [t0, [S, S, 100], easeOut],
      [t0 + 10, [S * 1.03, S * 1.03, 100], easeInOut],
      [t0 + 15, [S, S, 100], easeInOut],
      ...pulses,
    ]),
  });
};

// call-signal ring radiating from the badge (intro burst + one per beat)
const BX = px(META.badge.cx);
const BY = py(META.badge.cy);
const ring = (ind, cycles, color, w) => {
  const oKeys = [];
  const sKeys = [];
  for (const c of cycles) {
    oKeys.push([c - 0.5, 0, null, true], [c, 58, easeOut], [c + 28, 0, null, true]);
    sKeys.push([c - 0.5, [16, 16, 100], null, true], [c, [16, 16, 100], easeOut], [c + 28, [168, 168, 100], null, true]);
  }
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: `ring-${ind}`,
    sr: 1,
    ks: {
      o: anim(oKeys),
      r: still(0),
      p: still([BX, BY, 0]),
      a: still([0, 0, 0]),
      s: anim(sKeys),
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        nm: 'ring',
        it: [
          { ty: 'el', nm: 'circle', p: still([0, 0]), s: still([100, 100]) },
          { ty: 'st', nm: 'stroke', c: still(color), o: still(100), w: still(w), lc: 2, lj: 1 },
          { ty: 'tr', p: still([0, 0]), a: still([0, 0]), s: still([100, 100]), r: still(0), o: still(100), sk: still(0), sa: still(0) },
        ],
      },
    ],
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };
};

const CYAN = [0.09, 0.73, 1, 1];
const BLUE = [0.016, 0.306, 0.922, 1];

const layers = [
  ring(8, [52, 96, 156], CYAN, 4),
  ring(9, [58, 104, 164], BLUE, 2.5),
  badge(7, 46),
  people(6, 26),
  stamp(2, 'D', 6),
  stamp(3, 'C', 14),
  stamp(4, 'M', 22),
  stamp(5, 'S', 30),
];

const lottie = {
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm: 'DCMS 365 — loading',
  ddd: 0,
  assets,
  layers,
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: 120 },
  ],
};

const out = join(root, 'public/dcms-loading.json');
writeFileSync(out, JSON.stringify(lottie));
console.log(`wrote ${out} (${(JSON.stringify(lottie).length / 1024).toFixed(0)} KB)`);
