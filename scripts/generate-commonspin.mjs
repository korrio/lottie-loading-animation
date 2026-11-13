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

/* ------------------------------------------------------------------------- *
 * v2 — orbit spin-up: circle rings expand while rotating around the logo,
 * the whole wordmark grows and spins into place as one piece, the mm line
 * draws itself, and on loop the rings keep orbiting (360°/loop, seamless)
 * while they breathe and the s-p-i-n pulse wave rolls through.
 * ------------------------------------------------------------------------- */
const buildV2 = (suffix) => {
  const color = suffix ? [1, 1, 1, 1] : [0.067, 0.067, 0.067, 1];
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
      parent: 40,
      ks: { a: still([w / 2, h / 2, 0]), ...ks },
      ...extra,
    };
  };

  // the logo rig — everything expands while rotating into place as one piece
  const rig = {
    ddd: 0,
    ind: 40,
    ty: 3,
    nm: 'logo-rig',
    sr: 1,
    ks: {
      o: still(100),
      r: anim([
        [10, -150, easeOut],
        [30, 5, easeInOut],
        [38, 0],
      ]),
      p: still([400, 300, 0]),
      a: still([400, 300, 0]),
      s: anim([
        [10, [0, 0, 100], easeOut],
        [30, [106, 106, 100], easeInOut],
        [38, [100, 100, 100]],
      ]),
    },
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };

  // static letter inside the rig, optional loop pulse (s-p-i-n wave)
  const still_letter = (ind, id, beat = null) => {
    const { cx, cy } = META[id];
    let s = still([S, S, 100]);
    if (beat !== null) {
      const pulses = [];
      for (const c of [96 + beat, 156 + beat]) {
        pulses.push(
          [c, [S, S, 100], easeInOut],
          [c + 8, [S * 1.09, S * 1.09, 100], easeInOut],
          [c + 16, [S, S, 100], easeInOut],
        );
      }
      s = anim(pulses);
    }
    return layer(ind, id, {
      o: still(100),
      r: still(0),
      p: still([px(cx), py(cy), 0]),
      s,
    });
  };

  // mm — stays masked while the rig spins in, then draws itself 40-62
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
              { t: 40, s: maskRect(-4), o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } },
              { t: 62, s: maskRect(mmW + 6) },
            ],
          },
        },
      ],
    },
  );

  // orbit ring — expands while rotating in, then orbits 360°/loop + breathes
  const ring = (ind, R, arcPct, t0, r0, theta0) => ({
    ddd: 0,
    ind,
    ty: 4,
    nm: `ring-${ind}`,
    sr: 1,
    ks: {
      o: anim([
        [t0, 0, easeOut],
        [t0 + 12, 30],
      ]),
      r: {
        a: 1,
        k: [
          { t: t0, s: [r0], o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } },
          { t: 90, s: [theta0], o: { x: [0.167], y: [0.167] }, i: { x: [0.833], y: [0.833] } },
          { t: 210, s: [theta0 + 360] },
        ],
      },
      p: still([400, 300, 0]),
      a: still([0, 0, 0]),
      s: anim([
        [t0, [0, 0, 100], easeOut],
        [t0 + 18, [112, 112, 100], easeInOut],
        [t0 + 28, [100, 100, 100], easeInOut],
        [90, [100, 100, 100], easeInOut],
        [150, [104, 104, 100], easeInOut],
        [210, [100, 100, 100]],
      ]),
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        nm: 'arc',
        it: [
          { ty: 'el', nm: 'circle', p: still([0, 0]), s: still([R * 2, R * 2]) },
          { ty: 'tm', nm: 'trim', s: still(0), e: still(arcPct), o: still(0), m: 1 },
          {
            ty: 'st',
            nm: 'stroke',
            c: still(color),
            o: still(100),
            w: still(4),
            lc: 2,
            lj: 1,
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
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  });

  const layers = [
    still_letter(1, 'the'),
    still_letter(2, 'c'),
    still_letter(3, 'o1'),
    mm,
    still_letter(6, 'o2'),
    still_letter(7, 'n1'),
    still_letter(8, 's', 0),
    still_letter(9, 'p', 6),
    still_letter(10, 'i', 12),
    still_letter(11, 'n2', 18),
    rig,
    ring(41, 250, 22, 0, -200, 0),
    ring(42, 282, 10, 5, -20, 180),
  ];

  return {
    v: '5.9.6',
    fr: FR,
    ip: 0,
    op: OP,
    w: 800,
    h: 600,
    nm: `The Common Spin — loading v2${suffix ? ' (white)' : ''}`,
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
  ['', 'commonspin-loading-v2.json'],
  ['-w', 'commonspin-loading-v2-white.json'],
]) {
  const doc = buildV2(suffix);
  const out = join(root, `public/${file}`);
  writeFileSync(out, JSON.stringify(doc));
  console.log(`wrote ${out} (${(JSON.stringify(doc).length / 1024).toFixed(0)} KB)`);
}
