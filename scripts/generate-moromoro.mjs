/**
 * Generates the moromoro (moro.exchange) blink animations — six files:
 * two mascot themes × three eye shapes.
 *
 *   moromoro-dark-v1.json   white fox on midnight  · round eyes
 *   moromoro-dark-v2.json   white fox on midnight  · happy-arc eyes
 *   moromoro-dark-v3.json   white fox on midnight  · gem-diamond eyes
 *   moromoro-light-v1..v3   navy fox on paper      · same three
 *
 * Story (all): the fox head pops in, the teal gem spins into its brow with
 * a glint, and the eyes blink OPEN. In the loop the mascot rests and just
 * blinks — v1 gives a quick double-blink, v2 closes into happy anime arcs
 * (a real path morph) and holds the smile a beat, v3's diamond eyes blink
 * while the brow gem twinkles in sympathy. The gem always breathes softly.
 *
 * Timeline (60fps, 240 frames, 800×600): [0..90] intro  [90..210] loop
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => readFileSync(join(root, 'public/assets/moromoro', name)).toString('base64');

const FR = 60;
const OP = 240;

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

const S = 64; // 750² mascot displayed at 480px
const TEAL = [103 / 255, 250 / 255, 232 / 255, 1];
const NAVY = [57 / 255, 77 / 255, 133 / 255, 1];
const WHITE = [1, 1, 1, 1];

// image coords → comp coords (head centered at 400,300)
const M = (ix, iy) => [400 + (ix - 375) * 0.64, 300 + (iy - 375) * 0.64];

const THEMES = {
  dark: { bg: '#101528', eyeColor: NAVY, gem: M(377.1, 315.4) },
  light: { bg: '#f6f8fb', eyeColor: NAVY && WHITE, gem: M(374, 313.4) },
};
THEMES.dark.eyeColor = NAVY;
THEMES.light.eyeColor = WHITE;

const EYES = [M(295, 430), M(455, 430)];

// --- eye shape paths (local coords, anchor at eye center) --------------------
const ellipsePath = (w, h) => {
  const kx = w * 0.5523;
  const ky = h * 0.5523;
  return {
    c: true,
    v: [[0, -h], [w, 0], [0, h], [-w, 0]],
    i: [[-kx, 0], [0, -ky], [kx, 0], [0, ky]],
    o: [[kx, 0], [0, ky], [-kx, 0], [0, -ky]],
  };
};

// happy anime arc (closed smiling eye) — same 4-vertex topology as the oval
const happyPath = () => ({
  c: true,
  v: [[0, -15], [16, 4], [0, -5], [-16, 4]],
  i: [[-9, 0], [3, -8], [9, 0], [-2, 8]],
  o: [[9, 0], [-2, 8], [-9, 0], [3, -8]],
});

const diamondPath = (w, h) => ({
  c: true,
  v: [[0, -h], [w, 0], [0, h], [-w, 0]],
  i: [[0, 0], [0, 0], [0, 0], [0, 0]],
  o: [[0, 0], [0, 0], [0, 0], [0, 0]],
});

const starPath = (rOut, rIn) => {
  const v = [];
  for (let k = 0; k < 4; k++) {
    const a1 = ((k * 90 - 90) * Math.PI) / 180;
    const a2 = ((k * 90 - 45) * Math.PI) / 180;
    v.push([rOut * Math.cos(a1), rOut * Math.sin(a1)]);
    v.push([rIn * Math.cos(a2), rIn * Math.sin(a2)]);
  }
  return { c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) };
};

// --- build one document ------------------------------------------------------
const build = (theme, version) => {
  const T = THEMES[theme];
  const [gx, gy] = T.gem;

  const head = {
    ddd: 0,
    ind: 10,
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
      p: still([400, 300, 0]),
      a: still([375, 375, 0]),
      s: anim([
        [2, [S * 0.94, S * 0.94, 100], easeOut],
        [16, [S, S, 100]],
      ]),
    },
  };

  // gem: spins into the brow, breathes in the loop (v3 also twinkles on blink)
  const gemPulse =
    version === 'v3'
      ? [
          [90, [S, S, 100], easeInOut],
          [146, [S, S, 100], easeInOut],
          [150, [S * 1.18, S * 1.18, 100], easeInOut],
          [158, [S, S, 100], easeInOut],
          [210, [S, S, 100]],
        ]
      : [
          [90, [S, S, 100], easeInOut],
          [150, [S * 1.05, S * 1.05, 100], easeInOut],
          [210, [S, S, 100]],
        ];
  const gem = {
    ddd: 0,
    ind: 11,
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
      p: still([gx, gy, 0]),
      a: still([theme === 'dark' ? 377.1 : 374, theme === 'dark' ? 315.4 : 313.4, 0]),
      s: anim([
        [22, [0, 0, 100], easeOut],
        [34, [S * 1.15, S * 1.15, 100], easeInOut],
        [40, [S, S, 100], easeInOut],
        ...gemPulse.slice(0),
      ]),
    },
  };

  // glint star at the gem's shoulder — pops after the gem lands, twinkles once
  const glintPops = version === 'v3' ? [42, 148] : [42, 166];
  const gK = [];
  const grK = [];
  glintPops.forEach((t0) => {
    gK.push([t0, [0, 0, 100], easeOut], [t0 + 7, [100, 100, 100], easeInOut], [t0 + 14, [0, 0, 100], easeInOut]);
    grK.push([t0, 0, linear], [t0 + 14, 55, linear]);
  });
  const glint = {
    ddd: 0,
    ind: 12,
    ty: 4,
    nm: 'glint',
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: {
      o: still(100),
      r: anim(grK),
      p: still([gx + 24, gy - 30, 0]),
      a: still([0, 0, 0]),
      s: anim(gK),
    },
    shapes: [
      {
        ty: 'gr',
        nm: 'glint-g',
        it: [{ ty: 'sh', ks: { a: 0, k: starPath(16, 4.5) } }, { ty: 'fl', c: still(TEAL), o: still(100), r: 1 }, tr()],
      },
    ],
  };

  // --- eyes ------------------------------------------------------------------
  const eyeLayers = EYES.map(([ex, ey], i) => {
    let shapeKs;
    let scaleKs;
    const color = version === 'v3' ? TEAL : T.eyeColor;
    if (version === 'v2') {
      // path morph: happy arc ↔ open oval
      shapeKs = {
        a: 1,
        k: kf([
          [46, [happyPath()], easeInOut],
          [56, [ellipsePath(15, 21)], easeInOut],
          // loop: close into the happy arc, hold the smile, open again
          [90, [ellipsePath(15, 21)], easeInOut],
          [138, [ellipsePath(15, 21)], easeInOut],
          [144, [happyPath()], easeInOut],
          [162, [happyPath()], easeInOut],
          [168, [ellipsePath(15, 21)], easeInOut],
          [210, [ellipsePath(15, 21)]],
        ]),
      };
      scaleKs = anim([
        [46, [0, 0, 100], easeOut],
        [52, [108, 108, 100], easeInOut],
        [58, [100, 100, 100]],
      ]);
    } else {
      const path = version === 'v1' ? ellipsePath(15, 21) : diamondPath(14, 20);
      shapeKs = { a: 0, k: path };
      const blink =
        version === 'v1'
          ? [
              // double blink
              [90, [100, 100, 100], easeInOut],
              [144, [100, 100, 100], easeInOut],
              [148, [100, 6, 100], easeInOut],
              [153, [100, 100, 100], easeInOut],
              [158, [100, 6, 100], easeInOut],
              [164, [100, 100, 100], easeInOut],
              [210, [100, 100, 100]],
            ]
          : [
              [90, [100, 100, 100], easeInOut],
              [146, [100, 100, 100], easeInOut],
              [150, [100, 8, 100], easeInOut],
              [157, [100, 100, 100], easeInOut],
              [210, [100, 100, 100]],
            ];
      scaleKs = anim([
        [46, [0, 0, 100], easeOut],
        [52, [108, 115, 100], easeInOut],
        [58, [100, 100, 100], easeInOut],
        ...blink,
      ]);
    }
    return {
      ddd: 0,
      ind: 13 + i,
      ty: 4,
      nm: `eye-${i}`,
      sr: 1,
      ao: 0,
      ip: 0,
      op: OP,
      st: 0,
      bm: 0,
      ks: {
        o: anim([
          [46, 0, linear],
          [49, 100],
        ]),
        r: still(0),
        p: still([ex, ey, 0]),
        a: still([0, 0, 0]),
        s: scaleKs,
      },
      shapes: [
        {
          ty: 'gr',
          nm: `eye-${i}-g`,
          it: [{ ty: 'sh', ks: shapeKs }, { ty: 'fl', c: still(color), o: still(100), r: 1 }, tr()],
        },
      ],
    };
  });

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
    sc: T.bg,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };

  return {
    v: '5.9.6',
    fr: FR,
    ip: 0,
    op: OP,
    w: 800,
    h: 600,
    nm: `moromoro — ${theme} ${version} (blink)`,
    ddd: 0,
    assets: [
      { id: 'head', w: 750, h: 750, u: '', p: `data:image/png;base64,${asset(`head-${theme}.png`)}`, e: 1 },
      { id: 'gem', w: 750, h: 750, u: '', p: `data:image/png;base64,${asset(`gem-${theme}.png`)}`, e: 1 },
    ],
    layers: [glint, ...eyeLayers, gem, head, bg],
    markers: [
      { tm: 0, cm: 'intro', dr: 90 },
      { tm: 90, cm: 'loop', dr: 120 },
    ],
  };
};

for (const theme of ['dark', 'light']) {
  for (const version of ['v1', 'v2', 'v3']) {
    const doc = build(theme, version);
    const file = join(root, `public/moromoro-${theme}-${version}.json`);
    writeFileSync(file, JSON.stringify(doc));
    console.log(`wrote ${file} (${(JSON.stringify(doc).length / 1024).toFixed(0)} KB)`);
  }
}
