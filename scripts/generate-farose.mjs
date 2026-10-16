/**
 * Generates public/farose-loading.json (white), farose-loading-v2.json (navy) and the
 * trimmed, transparent farose-loading-v3.json (white) / farose-loading-v3-navy.json
 * — ไกลบ้าน (FAROSE) "building a home far from home".
 *
 * The wordmark is pure vector: every piece (roof, eave dash, ไ ก ล, the two
 * underlines, บ ้ า น) was traced from the show's cover art with potrace into
 * public/assets/farose/farose-logo-paths.json, so the logo stays crisp at any size.
 *
 * Story: the ground line is laid first, บ้าน is built on it glyph by glyph, the
 * floor line goes in, ไกล rises on top, then the roof drops onto the house and the
 * eave flicks out. The tone mark ้ hops in last like a flag on the chimney. In the
 * loop the roof lifts and settles (the house breathing) while ้ hops in counter-time.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOGO = JSON.parse(readFileSync(join(root, 'public/assets/farose/farose-logo-paths.json'), 'utf8'));

const FR = 60;
const OP = 240;

const easeInOut = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };
const easeOut = { o: { x: [0.25], y: [0.6] }, i: { x: [0.45], y: [1] } };
const easeIn = { o: { x: [0.55], y: [0] }, i: { x: [0.9], y: [0.6] } };
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

// logo units → comp: the 427×489 lockup is scaled to ~410px tall, centred
const S = 84;

const bbox = (name) => {
  const xs = [], ys = [];
  for (const sh of LOGO.pieces[name]) for (const [x, y] of sh.v) { xs.push(x); ys.push(y); }
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};
const center = (name) => {
  const b = bbox(name);
  return [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
};

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).concat(1);

// ---------------------------------------------------------------------------
// layers
// ---------------------------------------------------------------------------
const base = (ind, nm) => ({ ddd: 0, ind, sr: 1, ao: 0, ip: 0, op: OP, st: 0, bm: 0, nm });

// parent null: places the whole lockup in the comp
const makeRig = (x, y, scale) => ({
  ...base(1, 'logo-rig'),
  ty: 3,
  ks: {
    o: still(0),
    r: still(0),
    p: still([x, y, 0]),
    a: still([LOGO.w / 2, LOGO.h / 2, 0]),
    s: still([scale, scale, 100]),
  },
});

// Trimmed comp: cropped to the lockup's ink (control points included, so curves
// never poke out) plus only the headroom the roof needs for its loop lift. The
// roof and ้ fall in from outside the frame during the intro, and the glyph pops
// may overshoot the edge for a few frames — once landed, nothing clips.
const LIFT = 9; // roof lift in the loop, logo units
const INK = (() => {
  const xs = [], ys = [];
  for (const shapes of Object.values(LOGO.pieces))
    for (const { v, i, o } of shapes)
      v.forEach(([x, y], k) => {
        xs.push(x, x + i[k][0], x + o[k][0]);
        ys.push(y, y + i[k][1], y + o[k][1]);
      });
  // 1 unit of air so anti-aliased edges are not shaved off
  return { x0: Math.floor(Math.min(...xs)) - 1, y0: Math.floor(Math.min(...ys)) - 1, x1: Math.ceil(Math.max(...xs)) + 1, y1: Math.ceil(Math.max(...ys)) + 1 };
})();
const TRIM = { w: INK.x1 - INK.x0, h: INK.y1 - INK.y0 + LIFT };

const piece = (ind, name, color, ks, extra = {}) => {
  const [cx, cy] = center(name);
  return {
    ...base(ind, name),
    ty: 4,
    parent: 1,
    ks: { o: still(100), r: still(0), p: still([cx, cy, 0]), a: still([cx, cy, 0]), s: still([100, 100, 100]), ...ks },
    shapes: [
      {
        ty: 'gr',
        nm: name,
        it: [
          ...LOGO.pieces[name].map((k, i) => ({ ty: 'sh', nm: `${name}-${i}`, ks: still(k) })),
          { ty: 'fl', nm: 'fill', c: still(hex(color)), o: still(100), r: 2 },
          {
            ty: 'tr',
            p: still([0, 0]), a: still([0, 0]), s: still([100, 100]),
            r: still(0), o: still(100), sk: still(0), sa: still(0),
          },
        ],
      },
    ],
    ...extra,
  };
};

// pop: scale 0 → 114% → 100%, fading in
const pop = (name, t0) => {
  const [cx, cy] = center(name);
  return {
    o: anim([[t0, 0, linear], [t0 + 4, 100]]),
    s: anim([[t0, [0, 0, 100], easeOut], [t0 + 8, [114, 114, 100], easeInOut], [t0 + 13, [100, 100, 100]]]),
    p: anim([[t0, [cx, cy + 18, 0], easeOut], [t0 + 10, [cx, cy, 0]]]),
  };
};

// wipe: a mask rectangle sweeps left → right across a line
const rect = (x0, x1, y0, y1) => ({
  c: true,
  v: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]],
  i: [[0, 0], [0, 0], [0, 0], [0, 0]],
  o: [[0, 0], [0, 0], [0, 0], [0, 0]],
});
const wipe = (name, t0, dur) => {
  const b = bbox(name);
  const y0 = b.y0 - 10, y1 = b.y1 + 10, x0 = b.x0 - 10;
  return {
    hasMask: true,
    masksProperties: [
      {
        inv: false,
        mode: 'a',
        nm: 'wipe',
        o: still(100),
        x: still(0),
        pt: anim([[t0, rect(x0, x0, y0, y1), easeInOut], [t0 + dur, rect(x0, b.x1 + 10, y0, y1)]]),
      },
    ],
  };
};

function build(color, nm, trim = false) {
  const L = [];
  let ind = 2;
  const add = (name, ks, extra) => L.push(piece(ind++, name, color, ks, extra));

  // 1. the ground line is laid
  add('line2', {}, wipe('line2', 2, 18));

  // 2. บ า น are built on it
  ['bo', 'aa', 'no'].forEach((n, i) => add(n, pop(n, 10 + i * 5)));

  // 3. the floor line
  add('line1', {}, wipe('line1', 26, 14));

  // 4. ไ ก ล rise on top
  ['ai', 'ko', 'lo'].forEach((n, i) => add(n, pop(n, 32 + i * 5)));

  // 5. the roof drops onto the house, overshoots, settles — then breathes in the loop
  {
    const [cx, cy] = center('roof');
    add('roof', {
      o: anim([[48, 0, linear], [54, 100]]),
      r: anim([[48, -7, easeOut], [64, 1.5, easeInOut], [72, 0]]),
      p: anim([
        [48, [cx, cy - 150, 0], easeIn],
        [60, [cx, cy + 8, 0], easeOut],
        [68, [cx, cy - 4, 0], easeInOut],
        [76, [cx, cy, 0], easeInOut],
        // loop: lift and settle, twice (v(90) === v(210))
        [90, [cx, cy, 0], easeInOut],
        [120, [cx, cy - 9, 0], easeInOut],
        [150, [cx, cy, 0], easeInOut],
        [180, [cx, cy - 9, 0], easeInOut],
        [210, [cx, cy, 0]],
      ]),
    });
  }

  // 6. the eave dash flicks out from the wall
  {
    const [cx, cy] = center('dash');
    add('dash', {
      o: anim([[62, 0, linear], [66, 100]]),
      p: anim([[62, [cx + 34, cy - 4, 0], easeOut], [72, [cx - 4, cy, 0], easeInOut], [78, [cx, cy, 0]]]),
    });
  }

  // 7. ้ hops in last — and keeps hopping in counter-time with the roof
  {
    const [cx, cy] = center('mai');
    add('mai', {
      o: anim([[68, 0, linear], [72, 100]]),
      r: anim([
        [68, 25, easeOut], [80, -6, easeInOut], [86, 0],
        [90, 0, easeOut], [100, -10, easeInOut], [112, 0],
        [150, 0, easeOut], [160, -10, easeInOut], [172, 0], [210, 0],
      ]),
      p: anim([
        [68, [cx, cy - 70, 0], easeIn],
        [78, [cx, cy + 4, 0], easeOut],
        [84, [cx, cy, 0]],
        [90, [cx, cy, 0], easeOut],
        [100, [cx, cy - 16, 0], easeIn],
        [110, [cx, cy, 0], easeOut],
        [150, [cx, cy, 0], easeOut],
        [160, [cx, cy - 16, 0], easeIn],
        [170, [cx, cy, 0], easeOut],
        [210, [cx, cy, 0]],
      ]),
    });
  }

  return {
    v: '5.9.6',
    fr: FR,
    ip: 0,
    op: OP,
    w: trim ? TRIM.w : 800,
    h: trim ? TRIM.h : 600,
    nm,
    ddd: 0,
    assets: [],
    // last built is drawn on top: reverse so the roof and ้ sit above the glyphs
    layers: [...L.reverse(), trim ? makeRig(LOGO.w / 2 - INK.x0, LOGO.h / 2 - INK.y0 + LIFT, 100) : makeRig(400, 300, S)],
    markers: [
      { tm: 0, cm: 'intro', dr: 90 },
      { tm: 90, cm: 'loop', dr: 120 },
    ],
  };
}

for (const [file, color, nm, trim] of [
  ['farose-loading.json', '#ffffff', 'ไกลบ้าน — loading (white, for dark/colour backgrounds)'],
  ['farose-loading-v2.json', '#123a8c', 'ไกลบ้าน — loading (navy, for light backgrounds)'],
  ['farose-loading-v3.json', '#ffffff', 'ไกลบ้าน — loading (white, transparent, trimmed)', true],
  ['farose-loading-v3-navy.json', '#123a8c', 'ไกลบ้าน — loading (navy, transparent, trimmed)', true],
]) {
  const doc = build(color, nm, trim);
  const out = join(root, 'public', file);
  writeFileSync(out, JSON.stringify(doc));
  console.log(`wrote ${out} (${(JSON.stringify(doc).length / 1024).toFixed(0)} KB)`);
}
