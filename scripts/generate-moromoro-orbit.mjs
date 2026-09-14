/**
 * Generates the moromoro ecosystem orbits:
 *   public/moromoro-light-orbit.json     v1 — alternating directions, 240f loop
 *   public/moromoro-light-orbit-v2.json  v2 — all clockwise, Kepler speeds, 50% slower
 *
 * The moro.exchange "plain visualization" (2-image-hq.png) brought to life:
 * the light-theme fox with its beating gem (v6) sits in the hub where the
 * "Moro" circle was, eight EVM-network bubbles orbit on the solid inner
 * ring, and eighteen DEX bubbles ride three dotted outer rings — networks
 * clockwise, DEX rings counter-turning alternately, every bubble
 * counter-rotating so it stays upright.
 *
 * Timelines deviate from the house 120-frame loop (an orbit needs to be
 * slow): v1 intro [0..90], loop [90..330] — one revolution per ring, four
 * heartbeats per loop. v2 loop [90..2010] (32s): every ring drifts the same
 * way at its own speed — networks 4 revs (8s/rev, half of v1's pace), then
 * 3 / 2 / 1 revs moving outward, the heart beating every second throughout.
 * Seamless because every ring completes whole revolutions per loop.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/moromoro', name)).toString('base64');

const FR = 60;
let OP = 340;
let LOOP_END = 330;
let BEATS = [90, 150, 210, 270];
let RING_REVS = { net: 1, dex: [1, 1, 1] };
let RING_DIRS = { net: 1, dex: [-1, 1, -1] };

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

const NAVY = [57 / 255, 77 / 255, 133 / 255, 1];
const TEAL = [103 / 255, 250 / 255, 232 / 255, 1];
const WHITE = [1, 1, 1, 1];
const rad = (deg) => (deg * Math.PI) / 180;
const R1 = (v) => Math.round(v * 10) / 10;

const CX = 400;
const CY = 300;
const K = 27; // sprite display scale % (source px → comp px)

// ring radii (source px × 0.27)
const R_NET = 112;
const R_DEX = [177, 216, 256.5];

// measured from the source visualization (screen angles, y-down)
const NETWORKS = [
  ['hyper', -90.2, 346],
  ['eth', -32.0, 226],
  ['bnb', 8.7, 226],
  ['arb', 48.9, 226],
  ['op', 90.2, 226],
  ['poly', 131.6, 226],
  ['avax', 170.0, 226],
  ['other', -149.4, 226],
];
const DEX_ANGLES = [
  [222.0, 190.4, 152.1, -42.0, -10.4, 27.9],
  [203.2, 171.9, -23.2, 8.1],
  [214.2, 186.7, 158.3, 142.3, -34.2, -6.7, 21.7, 37.7],
];

// orbit rigs: networks turn clockwise, DEX rings alternate — all exactly
// one revolution per 240-frame loop, children counter-rotate to stay upright
const nullRig = (ind, revs, dir) => ({
  ddd: 0,
  ind,
  ty: 3,
  nm: `rig-${ind}`,
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: still(0),
    r: anim([
      [90, 0, linear],
      [LOOP_END, 360 * revs * dir],
    ]),
    p: still([CX, CY, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
});
const counterR = (revs, dir) => anim([
  [90, 0, linear],
  [LOOP_END, -360 * revs * dir],
]);

// one orbiting bubble: image layer parented to its rig, popping in at t0
const bubble = (ind, refId, parentInd, revs, dir, ringR, theta, size, t0, scale = K) => ({
  ddd: 0,
  ind,
  ty: 2,
  nm: `${refId}-${ind}`,
  refId,
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  parent: parentInd,
  ks: {
    o: anim([
      [t0, 0, linear],
      [t0 + 3, 100],
    ]),
    r: counterR(revs, dir),
    p: still([R1(ringR * Math.cos(rad(theta))), R1(ringR * Math.sin(rad(theta))), 0]),
    a: still([size / 2, size / 2, 0]),
    s: anim([
      [t0, [0, 0, 100], easeOut],
      [t0 + 5, [scale * 1.14, scale * 1.14, 100], easeInOut],
      [t0 + 8, [scale, scale, 100]],
    ]),
  },
});

const buildDoc = (nm) => {
// --- the hub: white circle + the light v6 fox with the beating gem ----------
const HUB_R = 56;
const FOX = 13; // head display scale %
const G = 13; // gem base scale %
const GEM_P = [R1(CX + (374 - 375) * (FOX / 100)), R1(CY + (313.4 - 375) * (FOX / 100))];

const hub = {
  ddd: 0,
  ind: 4,
  ty: 4,
  nm: 'hub',
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
    r: still(0),
    p: still([CX, CY, 0]),
    a: still([0, 0, 0]),
    s: anim([
      [2, [94, 94, 100], easeOut],
      [16, [100, 100, 100]],
    ]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'hub-g',
      it: [
        { ty: 'el', d: 1, s: still([HUB_R * 2, HUB_R * 2]), p: still([0, 0]) },
        { ty: 'st', c: still(NAVY), o: still(100), w: still(3.5), lc: 2, lj: 2 },
        { ty: 'fl', c: still(WHITE), o: still(100), r: 1 },
        tr(),
      ],
    },
  ],
};

const head = {
  ddd: 0,
  ind: 3,
  ty: 2,
  nm: 'head',
  refId: 'head',
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
    r: still(0),
    p: still([CX, CY, 0]),
    a: still([375, 375, 0]),
    s: anim([
      [2, [FOX * 0.94, FOX * 0.94, 100], easeOut],
      [16, [FOX, FOX, 100]],
    ]),
  },
};

// gem heartbeat — the v6 lub-dub, four beats per 240-frame loop
const beatKeys = [
  [22, [0, 0, 100], easeOut],
  [34, [G * 1.15, G * 1.15, 100], easeInOut],
  [42, [G, G, 100], easeInOut],
];
for (const c of BEATS) {
  beatKeys.push(
    [c, [G, G, 100], easeOut],
    [c + 6, [G * 1.24, G * 1.24, 100], easeOut],
    [c + 12, [G, G, 100], easeOut],
    [c + 18, [G * 1.13, G * 1.13, 100], easeOut],
    [c + 24, [G, G, 100], easeInOut]
  );
}
beatKeys.push([LOOP_END, [G, G, 100]]);

const gem = {
  ddd: 0,
  ind: 2,
  ty: 2,
  nm: 'gem',
  refId: 'gem',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [22, 0, linear],
      [26, 100],
    ]),
    r: anim([
      [22, -160, easeOut],
      [38, 0],
    ]),
    p: still([...GEM_P, 0]),
    a: still([374, 313.4, 0]),
    s: anim(beatKeys),
  },
};

// teal shockwave ring through the hub on every beat
const ringSK = [];
const ringOK = [];
for (const c of BEATS) {
  ringSK.push([c, [12, 12, 100], easeOut], [c + 22, [110, 110, 100], null, true], [c + 59, [12, 12, 100], null, true]);
  ringOK.push([c, 55, easeOut], [c + 22, 0, null, true], [c + 59, 0, null, true]);
}
const shock = {
  ddd: 0,
  ind: 1,
  ty: 4,
  nm: 'beat-ring',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim(ringOK),
    r: still(0),
    p: still([...GEM_P, 0]),
    a: still([0, 0, 0]),
    s: anim(ringSK),
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'ring-g',
      it: [
        { ty: 'el', d: 1, s: still([100, 100]), p: still([0, 0]) },
        { ty: 'st', c: still(TEAL), o: still(100), w: still(3.5), lc: 2, lj: 2 },
        tr(),
      ],
    },
  ],
};

// --- the rings themselves (static vectors) ----------------------------------
const innerRing = {
  ddd: 0,
  ind: 13,
  ty: 4,
  nm: 'inner-ring',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: still(100),
    r: still(0),
    p: still([CX, CY, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  shapes: [
    {
      ty: 'gr',
      nm: 'ring-g',
      it: [
        { ty: 'el', d: 1, s: still([R_NET * 2, R_NET * 2]), p: still([0, 0]) },
        { ty: 'st', c: still(NAVY), o: still(100), w: still(2.4), lc: 2, lj: 2 },
        {
          ty: 'tm',
          s: still(0),
          e: anim([
            [36, 0, easeInOut],
            [58, 100],
          ]),
          o: still(-90),
          m: 1,
        },
        tr(),
      ],
    },
  ],
};

const dashRings = {
  ddd: 0,
  ind: 32,
  ty: 4,
  nm: 'orbit-paths',
  sr: 1,
  ao: 0,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
  ks: {
    o: anim([
      [58, 0, linear],
      [74, 100],
    ]),
    r: still(0),
    p: still([CX, CY, 0]),
    a: still([0, 0, 0]),
    s: still([100, 100, 100]),
  },
  shapes: R_DEX.map((r, i) => ({
    ty: 'gr',
    nm: `path-${i}`,
    it: [
      { ty: 'el', d: 1, s: still([r * 2, r * 2]), p: still([0, 0]) },
      {
        ty: 'st',
        c: still(NAVY),
        o: still(24),
        w: still(1.8),
        lc: 2,
        lj: 2,
        d: [
          { n: 'd', nm: 'dash', v: still(1) },
          { n: 'g', nm: 'gap', v: still(6.5) },
        ],
      },
      tr(),
    ],
  })),
};

// --- assemble ----------------------------------------------------------------
const netLayers = NETWORKS.map(([slug, theta, size], i) =>
  bubble(5 + i, `n-${slug}`, 40, RING_REVS.net, RING_DIRS.net, R_NET, theta, size, 44 + i * 4)
);

const dexLayers = [];
let di = 0;
DEX_ANGLES.forEach((angles, ringIdx) => {
  for (const theta of angles) {
    dexLayers.push(
      bubble(14 + di, 'dex', 41 + ringIdx, RING_REVS.dex[ringIdx], RING_DIRS.dex[ringIdx], R_DEX[ringIdx], theta, 198, 56 + di * 1.6)
    );
    di += 1;
  }
});

const doc = {
  v: '5.9.6',
  fr: FR,
  ip: 0,
  op: OP,
  w: 800,
  h: 600,
  nm,
  ddd: 0,
  assets: [
    { id: 'head', w: 750, h: 750, u: '', p: `data:image/png;base64,${asset('head-light.png')}`, e: 1 },
    { id: 'gem', w: 750, h: 750, u: '', p: `data:image/png;base64,${asset('gem-light.png')}`, e: 1 },
    { id: 'dex', w: 198, h: 198, u: '', p: `data:image/png;base64,${asset('orbit-dex.png')}`, e: 1 },
    ...NETWORKS.map(([slug, , size]) => ({
      id: `n-${slug}`,
      w: size,
      h: size,
      u: '',
      p: `data:image/png;base64,${asset(`orbit-${slug}.png`)}`,
      e: 1,
    })),
  ],
  layers: [
    shock,
    gem,
    head,
    hub,
    ...netLayers,
    innerRing,
    ...dexLayers,
    dashRings,
    nullRig(40, RING_REVS.net, RING_DIRS.net),
    nullRig(41, RING_REVS.dex[0], RING_DIRS.dex[0]),
    nullRig(42, RING_REVS.dex[1], RING_DIRS.dex[1]),
    nullRig(43, RING_REVS.dex[2], RING_DIRS.dex[2]),
  ],
  markers: [
    { tm: 0, cm: 'intro', dr: 90 },
    { tm: 90, cm: 'loop', dr: LOOP_END - 90 },
  ],
};

return doc;
};

const emit = (name, nm) => {
  const doc = buildDoc(nm);
  const file = join(root, `public/${name}`);
  writeFileSync(file, JSON.stringify(doc));
  console.log(`wrote ${file} (${(JSON.stringify(doc).length / 1024).toFixed(0)} KB)`);
};

// v1 — alternating directions, one revolution each, 240-frame loop
emit('moromoro-light-orbit.json', 'moromoro — the ecosystem orbit');

// v2 — everything clockwise at Kepler speeds, 50% slower base pace:
// networks 4 revs over the 1920-frame loop (8s/rev — half of v1's pace),
// DEX rings 3 / 2 / 1 revs moving outward. Heart keeps beating every second.
OP = 2020;
LOOP_END = 2010;
BEATS = [];
for (let c = 90; c <= LOOP_END - 60; c += 60) BEATS.push(c);
RING_REVS = { net: 4, dex: [3, 2, 1] };
RING_DIRS = { net: 1, dex: [1, 1, 1] };
emit('moromoro-light-orbit-v2.json', 'moromoro — the ecosystem orbit v2 (Kepler drift)');
