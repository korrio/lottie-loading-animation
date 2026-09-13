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

// positions studied from the chibi mascots (moro.exchange/brand):
// eyes sit wide and low — 63% down the head, 0.39 face-widths apart
const EYES = [M(282, 458), M(468, 458)];

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
  v: [[0, -26], [28, 7], [0, -9], [-28, 7]],
  i: [[-16, 0], [5, -14], [16, 0], [-4, 14]],
  o: [[16, 0], [-4, 14], [-16, 0], [5, -14]],
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

  // v3.1 "the juggle": the two diamond eyes and the brow gem circle each
  // other like juggled balls — all three parented to a null at their
  // centroid that turns one full revolution per loop (seamless), while each
  // ball counter-rotates so it stays upright in flight.
  const juggle = version === 'v3.1';
  const cJx = (EYES[0][0] + EYES[1][0] + gx) / 3;
  const cJy = (EYES[0][1] + EYES[1][1] + gy) / 3;
  const counterR = () => anim([
    [90, 0, linear],
    [210, 360],
  ]);
  const juggleRig = {
    ddd: 0,
    ind: 21,
    ty: 3,
    nm: 'juggle-rig',
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
        [210, -360],
      ]),
      p: still([cJx, cJy, 0]),
      a: still([0, 0, 0]),
      s: still([100, 100, 100]),
    },
  };

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
    version === 'v6'
      ? [
          [90, [S, S, 100], easeOut],
          [96, [S * 1.24, S * 1.24, 100], easeOut],
          [102, [S, S, 100], easeOut],
          [108, [S * 1.13, S * 1.13, 100], easeOut],
          [114, [S, S, 100], easeInOut],
          [150, [S, S, 100], easeOut],
          [156, [S * 1.24, S * 1.24, 100], easeOut],
          [162, [S, S, 100], easeOut],
          [168, [S * 1.13, S * 1.13, 100], easeOut],
          [174, [S, S, 100], easeInOut],
          [210, [S, S, 100]],
        ]
      : version === 'v3'
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
    ...(juggle ? { parent: 21 } : {}),
    ks: {
      o: anim([
        [22, 0, linear],
        [26, 100],
      ]),
      r: juggle
        ? anim([
            [22, -160, easeOut],
            [38, 0, easeInOut],
            [90, 0, linear],
            [210, 360],
          ])
        : anim([
            [22, -160, easeOut],
            [38, 0],
          ]),
      p: juggle ? still([gx - cJx, gy - cJy, 0]) : still([gx, gy, 0]),
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
  const glintPops =
    version === 'v3' ? [42, 148] : version === 'v3.1' ? [42] : version === 'v5' ? [46, 166] : [42, 166];
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

  // --- v5: the third eye is the Ethereum diamond, coin-spinning ---------------
  // A parent rig cycles scale-x with cos(θ), one revolution per loop, so the
  // glyph flips about its vertical axis like a coin — seamless at 90/210.
  const ETH_DARK = [0.184, 0.847, 0.769, 1];
  const ETH_LITE = [0.561, 0.988, 0.941, 1];
  const ethPoly = (pts) => ({ c: true, v: pts, i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]) });
  const ETH_FACETS = [
    [ethPoly([[0, -208.5], [-128, 3.8], [0, 79.4]]), ETH_DARK],
    [ethPoly([[0, -208.5], [128, 3.8], [0, 79.4]]), ETH_LITE],
    [ethPoly([[-128, 28.1], [0, 103.7], [0, 208.4]]), ETH_DARK],
    [ethPoly([[128, 28.1], [0, 103.7], [0, 208.4]]), ETH_LITE],
  ];
  const spinKeys = [];
  for (let t = 22; t <= 210; t += 6) {
    const sx = 100 * Math.cos((2 * Math.PI * (t - 90)) / 120);
    const k = { t, s: [Math.round(sx * 10) / 10, 100, 100] };
    spinKeys.push([k.t, k.s, linear]);
  }
  const ethRig = {
    ddd: 0,
    ind: 17,
    ty: 3,
    nm: 'eth-rig',
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    ks: {
      o: still(0),
      r: still(0),
      p: still([gx, gy, 0]),
      a: still([0, 0, 0]),
      s: anim(spinKeys),
    },
  };
  const ethEye = {
    ddd: 0,
    ind: 18,
    ty: 4,
    nm: 'eth-eye',
    sr: 1,
    ao: 0,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
    parent: 17,
    ks: {
      o: anim([
        [22, 0, linear],
        [26, 100],
      ]),
      r: still(0),
      p: still([0, 0, 0]),
      a: still([0, 0, 0]),
      s: anim([
        [22, [0, 0, 100], easeOut],
        [34, [24.9, 24.9, 100], easeInOut],
        [42, [21.6, 21.6, 100]],
      ]),
    },
    shapes: ETH_FACETS.map(([path, col], fi) => ({
      ty: 'gr',
      nm: `facet-${fi}`,
      it: [{ ty: 'sh', ks: { a: 0, k: path } }, { ty: 'fl', c: still(col), o: still(100), r: 1 }, tr()],
    })),
  };

  // --- v6.1: the Ethereum diamond itself beats --------------------------------
  const B = 21.6;
  const ethBeat = {
    ddd: 0,
    ind: 18,
    ty: 4,
    nm: 'eth-beat',
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
      r: still(0),
      p: still([gx, gy, 0]),
      a: still([0, 0, 0]),
      s: anim([
        [22, [0, 0, 100], easeOut],
        [34, [B * 1.15, B * 1.15, 100], easeInOut],
        [42, [B, B, 100], easeInOut],
        [90, [B, B, 100], easeOut],
        [96, [B * 1.24, B * 1.24, 100], easeOut],
        [102, [B, B, 100], easeOut],
        [108, [B * 1.13, B * 1.13, 100], easeOut],
        [114, [B, B, 100], easeInOut],
        [150, [B, B, 100], easeOut],
        [156, [B * 1.24, B * 1.24, 100], easeOut],
        [162, [B, B, 100], easeOut],
        [168, [B * 1.13, B * 1.13, 100], easeOut],
        [174, [B, B, 100], easeInOut],
        [210, [B, B, 100]],
      ]),
    },
    shapes: ETH_FACETS.map(([path, col], fi) => ({
      ty: 'gr',
      nm: `facet-${fi}`,
      it: [{ ty: 'sh', ks: { a: 0, k: path } }, { ty: 'fl', c: still(col), o: still(100), r: 1 }, tr()],
    })),
  };

  // --- v6: shockwave ring that ripples out on each heartbeat ------------------
  const ringSK = [];
  const ringOK = [];
  for (const c of [90, 150]) {
    ringSK.push([c, [26, 26, 100], easeOut], [c + 22, [150, 150, 100], null, true], [c + 59, [26, 26, 100], null, true]);
    ringOK.push([c, 55, easeOut], [c + 22, 0, null, true], [c + 59, 0, null, true]);
  }
  const ring = {
    ddd: 0,
    ind: 19,
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
      p: still([gx, gy, 0]),
      a: still([0, 0, 0]),
      s: anim(ringSK),
    },
    shapes: [
      {
        ty: 'gr',
        nm: 'ring-g',
        it: [
          { ty: 'el', d: 1, s: still([100, 100]), p: still([0, 0]) },
          { ty: 'st', c: still(TEAL), o: still(100), w: still(6), lc: 2, lj: 2 },
          tr(),
        ],
      },
    ],
  };

  // --- v7: "the swap" — the eyes are a token pair that trade places ----------
  // A DEX aggregator's eyes: the teal diamond and the round token arc over
  // and under each other to swap sockets at 100-122, and swap back at
  // 160-182 — so the loop closes seamlessly. Each landing gets a squash.
  const [[sxL, sy7], [sxR]] = EYES;
  const midX = (sxL + sxR) / 2;
  const swapP = (fromX, toX, up) => anim([
    [90, [fromX, sy7, 0], easeInOut],
    [100, [fromX, sy7, 0], easeInOut],
    [111, [midX, sy7 + (up ? -46 : 40), 0], easeInOut],
    [122, [toX, sy7, 0], easeInOut],
    [160, [toX, sy7, 0], easeInOut],
    [171, [midX, sy7 + (up ? 42 : -44), 0], easeInOut],
    [182, [fromX, sy7, 0], easeInOut],
    [210, [fromX, sy7, 0]],
  ]);
  const swapS = anim([
    [46, [0, 0, 100], easeOut],
    [52, [110, 116, 100], easeInOut],
    [58, [100, 100, 100], easeInOut],
    [120, [100, 100, 100], easeOut],
    [124, [114, 86, 100], easeOut],
    [130, [100, 100, 100], easeInOut],
    [180, [100, 100, 100], easeOut],
    [184, [114, 86, 100], easeOut],
    [190, [100, 100, 100], easeInOut],
    [210, [100, 100, 100]],
  ]);
  const swapEyes = [
    {
      ddd: 0,
      ind: 13,
      ty: 4,
      nm: 'token-diamond',
      sr: 1,
      ao: 0,
      ip: 0,
      op: OP,
      st: 0,
      bm: 0,
      ks: { o: anim([[46, 0, linear], [49, 100]]), r: still(0), p: swapP(sxL, sxR, true), a: still([0, 0, 0]), s: swapS },
      shapes: [
        { ty: 'gr', nm: 'g', it: [{ ty: 'sh', ks: { a: 0, k: diamondPath(23, 33) } }, { ty: 'fl', c: still(TEAL), o: still(100), r: 1 }, tr()] },
      ],
    },
    {
      ddd: 0,
      ind: 14,
      ty: 4,
      nm: 'token-round',
      sr: 1,
      ao: 0,
      ip: 0,
      op: OP,
      st: 0,
      bm: 0,
      ks: { o: anim([[46, 0, linear], [49, 100]]), r: still(0), p: swapP(sxR, sxL, false), a: still([0, 0, 0]), s: swapS },
      shapes: [
        { ty: 'gr', nm: 'hl', it: [{ ty: 'el', d: 1, s: still([13, 13]), p: still([-6, -8]) }, { ty: 'fl', c: still(theme === 'dark' ? WHITE : NAVY), o: still(100), r: 1 }, tr()] },
        { ty: 'gr', nm: 'g', it: [{ ty: 'el', d: 1, s: still([50, 50]), p: still([0, 0]) }, { ty: 'fl', c: still(T.eyeColor), o: still(100), r: 1 }, tr()] },
      ],
    },
  ];

  // --- eyes ------------------------------------------------------------------
  // v1: chibi anime eyes — plum iris with white highlight sparkles, as on
  // the official mascots. v2: happy arcs (the sleeping chibi's lash line).
  // v3: teal gem diamonds. All blink from an eye-center anchor.
  const PLUM = [0.196, 0.157, 0.271, 1];
  const eyeLayers = version === 'v7' ? swapEyes : version === 'v5' || version === 'v6' || version === 'v6.1' ? [] : EYES.map(([ex, ey], i) => {
    let shapeItems;
    let scaleKs;
    let shapeKs = null;
    if (version === 'v4') {
      // the actual painted eyes from the official chibi mascot (moscot-1),
      // spacing tuned per feedback (1.5x then -25% => 1.125x)
      const ex4 = 400 + (ex - 400) * 1.125;
      const blink = anim([
        [46, [0, 0, 100], easeOut],
        [52, [108, 115, 100], easeInOut],
        [58, [100, 100, 100], easeInOut],
        [90, [100, 100, 100], easeInOut],
        [146, [100, 100, 100], easeInOut],
        [150, [100, 7, 100], easeInOut],
        [157, [100, 100, 100], easeInOut],
        [210, [100, 100, 100]],
      ]);
      return {
        ddd: 0,
        ind: 13 + i,
        ty: 2,
        nm: `eye-${i}`,
        refId: i === 0 ? 'eyeL' : 'eyeR',
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
          p: still([ex4, ey, 0]),
          a: still([40, 31, 0]),
          s: blink,
        },
      };
    }
    if (version === 'v1') {
      // anime eye: tall round iris + two highlights (big up-left, small low-right)
      shapeItems = [
        {
          ty: 'gr',
          nm: 'hl-big',
          it: [{ ty: 'el', d: 1, s: still([17, 17]), p: still([-8, -11]) }, { ty: 'fl', c: still(WHITE), o: still(100), r: 1 }, tr()],
        },
        {
          ty: 'gr',
          nm: 'hl-small',
          it: [{ ty: 'el', d: 1, s: still([8, 8]), p: still([8, 10]) }, { ty: 'fl', c: still(WHITE), o: still(92), r: 1 }, tr()],
        },
        {
          ty: 'gr',
          nm: 'iris',
          it: [{ ty: 'el', d: 1, s: still([52, 60]), p: still([0, 0]) }, { ty: 'fl', c: still(PLUM), o: still(100), r: 1 }, tr()],
        },
        {
          ty: 'gr',
          nm: 'sclera',
          it: [{ ty: 'el', d: 1, s: still([60, 68]), p: still([0, 0]) }, { ty: 'fl', c: still(WHITE), o: still(100), r: 1 }, tr()],
        },
      ];
      scaleKs = anim([
        [46, [0, 0, 100], easeOut],
        [52, [108, 115, 100], easeInOut],
        [58, [100, 100, 100], easeInOut],
        [90, [100, 100, 100], easeInOut],
        [146, [100, 100, 100], easeInOut],
        [150, [100, 7, 100], easeInOut],
        [157, [100, 100, 100], easeInOut],
        [210, [100, 100, 100]],
      ]);
    } else if (version === 'v2') {
      // path morph: happy arc <-> open oval (chibi-sized)
      shapeKs = {
        a: 1,
        k: kf([
          [46, [happyPath()], easeInOut],
          [56, [ellipsePath(26, 30)], easeInOut],
          [90, [ellipsePath(26, 30)], easeInOut],
          [138, [ellipsePath(26, 30)], easeInOut],
          [144, [happyPath()], easeInOut],
          [162, [happyPath()], easeInOut],
          [168, [ellipsePath(26, 30)], easeInOut],
          [210, [ellipsePath(26, 30)]],
        ]),
      };
      shapeItems = [
        { ty: 'gr', nm: 'eye-g', it: [{ ty: 'sh', ks: shapeKs }, { ty: 'fl', c: still(T.eyeColor), o: still(100), r: 1 }, tr()] },
      ];
      scaleKs = anim([
        [46, [0, 0, 100], easeOut],
        [52, [108, 108, 100], easeInOut],
        [58, [100, 100, 100]],
      ]);
    } else {
      shapeItems = [
        { ty: 'gr', nm: 'eye-g', it: [{ ty: 'sh', ks: { a: 0, k: diamondPath(23, 33) } }, { ty: 'fl', c: still(TEAL), o: still(100), r: 1 }, tr()] },
      ];
      scaleKs = juggle
        ? anim([
            [46, [0, 0, 100], easeOut],
            [52, [108, 115, 100], easeInOut],
            [58, [100, 100, 100]],
          ])
        : anim([
            [46, [0, 0, 100], easeOut],
            [52, [108, 115, 100], easeInOut],
            [58, [100, 100, 100], easeInOut],
            [90, [100, 100, 100], easeInOut],
            [146, [100, 100, 100], easeInOut],
            [150, [100, 8, 100], easeInOut],
            [157, [100, 100, 100], easeInOut],
            [210, [100, 100, 100]],
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
      ...(juggle ? { parent: 21 } : {}),
      ks: {
        o: anim([
          [46, 0, linear],
          [49, 100],
        ]),
        r: juggle ? counterR() : still(0),
        p: juggle ? still([ex - cJx, ey - cJy, 0]) : still([ex, ey, 0]),
        a: still([0, 0, 0]),
        s: scaleKs,
      },
      shapes: shapeItems,
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
      ...(version === 'v4'
        ? [
            { id: 'eyeL', w: 80, h: 62, u: '', p: `data:image/png;base64,${asset('eye-real-l.png')}`, e: 1 },
            { id: 'eyeR', w: 80, h: 62, u: '', p: `data:image/png;base64,${asset('eye-real-r.png')}`, e: 1 },
          ]
        : []),
    ],
    layers:
      version === 'v5'
        ? [glint, ethEye, ethRig, head]
        : version === 'v6'
          ? [glint, ring, gem, head]
          : version === 'v6.1'
            ? [glint, ring, ethBeat, head]
            : juggle
              ? [glint, ...eyeLayers, gem, juggleRig, head]
              : [glint, ...eyeLayers, gem, head],
    markers: [
      { tm: 0, cm: 'intro', dr: 90 },
      { tm: 90, cm: 'loop', dr: 120 },
    ],
  };
};

for (const theme of ['dark', 'light']) {
  for (const version of ['v1', 'v2', 'v3', 'v3.1', 'v4', 'v5', 'v6', 'v6.1', 'v7']) {
    const doc = build(theme, version);
    const file = join(root, `public/moromoro-${theme}-${version.replace('.', '-')}.json`);
    writeFileSync(file, JSON.stringify(doc));
    console.log(`wrote ${file} (${(JSON.stringify(doc).length / 1024).toFixed(0)} KB)`);
  }
}
