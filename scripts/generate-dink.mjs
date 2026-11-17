/**
 * Generates public/dink-loading.json (light) and dink-loading-dark.json —
 * pure-vector Lottie loading animations for MOUNTAIN DINK, built from
 * potrace-traced letter paths (scripts/dink-vec.json).
 *
 * "The collision" (FUZE-style, full power): MOUNTAIN charges in from the
 * left and DINK from the right, accelerating into each other and slamming
 * together at the gap between the words. Both sides squash into the impact
 * point, the whole logo shakes with decaying jolts, two shockwave rings
 * burst from the hit and sparks fly radially. On loop DINK beats like a
 * power pulse, each beat radiating its own teal ring.
 *
 * Editions: light = flat brand gray + teal; dark = silver vertical
 * gradient MOUNTAIN + bright teal for dark surfaces.
 *
 * Timeline (60fps, 240 frames, 800×600): intro [0..90], loop [90..210].
 * Both files are fully transparent — the page DOM supplies the background.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const VEC = JSON.parse(readFileSync(join(root, 'scripts/dink-vec.json')));
const COL = JSON.parse(readFileSync(join(root, 'scripts/dink-colors.json')));

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.22], y: [0.65] }, i: { x: [0.4], y: [1] } };
const easeIn = { o: { x: [0.55], y: [0] }, i: { x: [0.95], y: [0.85] } };

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

// logo px → comp coords
const K = 0.51;
const OX = 400 - 778.5 * K;
const OY = 300 - 340.5 * K;
const px = (cx) => OX + cx * K;
const py = (cy) => OY + cy * K;
const S = K * 100;

// collision interface: the gap between MOUNTAIN and DINK
const CX = px(1018);
const CY = 300;
const IMPACT = 26;

const c01 = (c) => c.map((v) => Math.round((v / 255) * 1000) / 1000);

const shapes = (nm) =>
  VEC[nm].paths.map((p) => ({ ty: 'sh', ks: { a: 0, k: { c: true, v: p.v, i: p.i, o: p.o } } }));

const TR = { ty: 'tr', p: still([0, 0]), a: still([0, 0]), s: still([100, 100]), r: still(0), o: still(100), sk: still(0), sa: still(0) };

const GRAYS = ['M', 'O', 'U', 'N1', 'T', 'A', 'I1', 'N2'];
const TEALS = ['D', 'I2', 'N3', 'K'];

const TEAL_BRIGHT = [0.13, 0.8, 0.86, 1];

const build = (edition) => {
  const teal = edition === 'light' ? [...c01(COL.teal), 1] : TEAL_BRIGHT;
  const ringGray = edition === 'light' ? [...c01(COL.gray), 1] : [0.92, 0.92, 0.95, 1];

  const fillFor = (nm) => {
    const isTeal = TEALS.includes(nm);
    if (isTeal) return { ty: 'fl', nm: 'fill', c: still(teal), o: still(100), r: 1 };
    if (edition === 'light')
      return { ty: 'fl', nm: 'fill', c: still([...c01(COL.gray), 1]), o: still(100), r: 1 };
    const [x0, y0, x1, y1] = VEC[nm].bbox;
    const cx = (x0 + x1) / 2;
    return {
      ty: 'gf',
      nm: 'grad',
      o: still(100),
      r: 1,
      t: 1,
      s: still([cx, y0]),
      e: still([cx, y1]),
      g: { p: 3, k: still([0, 0.96, 0.96, 0.98, 0.55, 0.78, 0.78, 0.82, 1, 0.58, 0.58, 0.63]) },
    };
  };

  // static letter inside a charge rig
  const child = (ind, nm, parent) => {
    const [x0, y0, x1, y1] = VEC[nm].bbox;
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
      parent,
      ks: {
        o: still(100),
        r: still(0),
        p: still([px((x0 + x1) / 2), py((y0 + y1) / 2), 0]),
        a: still([(x0 + x1) / 2, (y0 + y1) / 2, 0]),
        s: still([S, S, 100]),
      },
      shapes: [{ ty: 'gr', nm, it: [...shapes(nm), fillFor(nm), TR] }],
    };
  };

  // screen shake null — everything hangs off this
  const JOLTS = [[9, -4], [-8, 3], [6, -3], [-5, 2], [4, -2], [-3, 1], [2, -1], [-1, 0], [0, 0]];
  const shake = {
    ddd: 0,
    ind: 50,
    ty: 3,
    nm: 'shake',
    sr: 1,
    ks: {
      o: still(100),
      r: still(0),
      p: anim([
        [IMPACT, [400, 300, 0], easeOut],
        ...JOLTS.map(([jx, jy], i) => [IMPACT + 1 + i * 1.5, [400 + jx, 300 + jy, 0], easeInOut]),
      ]),
      a: still([400, 300, 0]),
      s: still([100, 100, 100]),
    },
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };

  // charge rig anchored AT the collision interface so the squash drives
  // into the impact point
  const chargeRig = (ind, fromLeft) => {
    const from = fromLeft ? CX - 570 : CX + 490;
    return {
      ddd: 0,
      ind,
      ty: 3,
      nm: fromLeft ? 'charge-left' : 'charge-right',
      sr: 1,
      parent: 50,
      ks: {
        o: still(100),
        r: still(0),
        p: anim([
          [6, [from, CY, 0], easeIn],
          [IMPACT, [CX, CY, 0]],
        ]),
        a: still([CX, CY, 0]),
        s: anim([
          [8, [111, 95, 100], easeInOut],
          [IMPACT - 1, [111, 95, 100], easeInOut],
          [IMPACT + 2, [84, 108, 100], easeInOut],
          [IMPACT + 7, [106, 97, 100], easeInOut],
          [IMPACT + 13, [100, 100, 100]],
        ]),
      },
      ao: 0,
      ip: 0,
      op: OP,
      st: 0,
      bm: 0,
    };
  };

  // DINK beat null — power pulse on loop
  const DCX = px((VEC.D.bbox[0] + VEC.K.bbox[2]) / 2);
  const beatRig = {
    ddd: 0,
    ind: 53,
    ty: 3,
    nm: 'dink-beat',
    sr: 1,
    parent: 52,
    ks: {
      o: still(100),
      r: still(0),
      p: still([DCX, CY, 0]),
      a: still([DCX, CY, 0]),
      s: anim([
        [96, [100, 100, 100], easeInOut],
        [104, [104.5, 104.5, 100], easeInOut],
        [112, [100, 100, 100], easeInOut],
        [156, [100, 100, 100], easeInOut],
        [164, [104.5, 104.5, 100], easeInOut],
        [172, [100, 100, 100]],
      ]),
    },
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };

  // shockwave ring: per-cycle opacity with leading zero-holds (the
  // value-before-first-keyframe rule), scale resets held while invisible
  const ring = (ind, cx, cy, cycles, r1, w, color) => {
    const oKeys = [];
    const sKeys = [];
    for (const c of cycles) {
      oKeys.push([c - 0.5, 0, null, true], [c, 65, easeOut], [c + 26, 0, null, true]);
      sKeys.push([c - 0.5, [10, 10, 100], null, true], [c, [10, 10, 100], easeOut], [c + 26, [r1, r1, 100], null, true]);
    }
    return {
      ddd: 0,
      ind,
      ty: 4,
      nm: `ring-${ind}`,
      sr: 1,
      parent: 50,
      ks: {
        o: anim(oKeys),
        r: still(0),
        p: still([cx, cy, 0]),
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
            TR,
          ],
        },
      ],
      ip: 0,
      op: OP,
      st: 0,
      bm: 0,
    };
  };

  // spark particles flying radially from the impact point
  const spark = (ind, deg, dist, len, color) => {
    const rad = (deg * Math.PI) / 180;
    const tx = CX + Math.cos(rad) * dist;
    const ty = CY + Math.sin(rad) * dist;
    return {
      ddd: 0,
      ind,
      ty: 4,
      nm: `spark-${ind}`,
      sr: 1,
      parent: 50,
      ks: {
        o: anim([
          [IMPACT - 0.5, 0, null, true],
          [IMPACT, 90, easeOut],
          [IMPACT + 16, 0],
        ]),
        r: still(deg + 90),
        p: anim([
          [IMPACT, [CX, CY, 0], easeOut],
          [IMPACT + 16, [tx, ty, 0]],
        ]),
        a: still([0, 0, 0]),
        s: anim([
          [IMPACT, [100, 100, 100], easeOut],
          [IMPACT + 16, [30, 30, 100]],
        ]),
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          nm: 'spark',
          it: [
            { ty: 'rc', nm: 'rect', p: still([0, 0]), s: still([4, len]), r: still(2) },
            { ty: 'fl', nm: 'fill', c: still(color), o: still(100), r: 1 },
            TR,
          ],
        },
      ],
      ip: 0,
      op: OP,
      st: 0,
      bm: 0,
    };
  };

  const SPARKS = [
    [55, 120, 16],
    [125, 105, 13],
    [235, 110, 14],
    [305, 125, 16],
    [80, 95, 11],
    [280, 90, 11],
  ].map(([deg, dist, len], i) => spark(30 + i, deg, dist, len, i % 2 ? ringGray : teal));

  const layers = [
    // impact rings (burst at the hit) + loop beat rings at DINK center
    ring(60, CX, CY, [IMPACT], 150, 4, teal),
    ring(61, CX, CY, [IMPACT + 3], 210, 2.5, ringGray),
    ring(62, DCX, CY, [96, 156], 120, 3, teal),
    ...SPARKS,
    ...GRAYS.map((nm, i) => child(1 + i, nm, 51)),
    ...TEALS.map((nm, i) => child(10 + i, nm, 53)),
    chargeRig(51, true),
    chargeRig(52, false),
    beatRig,
    shake,
  ];

  return {
    v: '5.9.6',
    fr: FR,
    ip: 0,
    op: OP,
    w: 800,
    h: 600,
    nm: `MOUNTAIN DINK — loading (${edition})`,
    ddd: 0,
    assets: [],
    layers,
    markers: [
      { tm: 0, cm: 'intro', dr: 90 },
      { tm: 90, cm: 'loop', dr: 120 },
    ],
  };
};

for (const [edition, file] of [
  ['light', 'dink-loading.json'],
  ['dark', 'dink-loading-dark.json'],
]) {
  const doc = build(edition);
  const out = join(root, `public/${file}`);
  writeFileSync(out, JSON.stringify(doc));
  console.log(`wrote ${out} (${(JSON.stringify(doc).length / 1024).toFixed(0)} KB)`);
}
