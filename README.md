# Lottie Loading Animation Creator

Programmatically-generated **Lottie loading animations** for a collection of brand logos — no After Effects involved. Each animation is authored as plain JSON by a Node script, previewed in a multi-page Vite site, and deployed to Firebase Hosting.

**Live site:** https://spinbase-animation.web.app

| Brand | Page | Animation |
| --- | --- | --- |
| SPIN BASE | [/](https://spinbase-animation.web.app/) | 3 variants: flat spin, globe spin, 3D Earth-style ball rotation |
| COURTHAUS | [/courthaus/](https://spinbase-animation.web.app/courthaus/) | Letters pop in one by one, tennis ball drops into the "O" |
| FUZE TRAINING | [/fuze/](https://spinbase-animation.web.app/fuze/) | Logo mark halves slam together, beat pulse on loop |
| สร้างสรรค์ปัญญา (Creative Intelligent) | [/sspy/](https://spinbase-animation.web.app/sspy/) | Pen nib rises, idea bulb pops and glows, Thai + English text reveal |
| BALANCE AUTO TENNIS | [/balance/](https://spinbase-animation.web.app/balance/) | 2 variants: counter-rotating balls, roll-in-and-rest |
| Bitkub Capital | [/bitkub/](https://spinbase-animation.web.app/bitkub/) | Diamond-mark hooks fly in from opposite corners and interlock, coin dots pop in |

## Quick start

```bash
npm install
npm run dev            # preview at http://localhost:5173
```

Regenerate any animation after tweaking its script:

```bash
node scripts/generate-lottie.mjs        # SPIN BASE  → public/spinbase-loading.json
node scripts/generate-courthaus.mjs     # COURTHAUS  → public/courthaus-loading.json
node scripts/generate-fuze.mjs          # FUZE       → public/fuze-loading.json
node scripts/generate-sspy.mjs          # สร้างสรรค์ปัญญา → public/sspy-loading.json
node scripts/generate-balance.mjs       # BALANCE v1 → public/balance-loading.json
node scripts/generate-balance-v2.mjs    # BALANCE v2 → public/balance-loading-v2.json
node scripts/generate-bitkub.mjs        # Bitkub     → public/bitkub-loading.json
```

Deploy:

```bash
npm run build && firebase deploy --only hosting
```

## How it works

### 1. Logo segmentation (Python / PIL)

Each brand logo PNG is cut into independently-animatable layers (ball, seam, text lines, per-letter glyphs, …) using alpha-channel gap analysis, flood-fill connected components, and geometric masks. The crops live in `public/assets/<brand>/`.

Where a part of the artwork is occluded in the source (e.g. the BALANCE outline ball's arc and seam hidden behind the solid ball), the missing geometry is reconstructed synthetically so the layer survives rotation.

### 2. Lottie authoring (Node)

`scripts/generate-*.mjs` build the Lottie document as a plain JS object and write it out. Images are embedded as base64 data URIs (`e: 1`), so **every JSON file is fully self-contained** — it plays anywhere: lottie-web, dotLottie players, LottieFiles, iOS/Android Lottie.

### 3. The shared animation contract

Every animation uses the same timeline (60 fps, 240 frames, 800×600):

| Segment | Frames | Marker |
| --- | --- | --- |
| intro | 0–90 | `intro` — plays once |
| loop | 90–210 | `loop` — seamless forever |

The loop is seamless because **every animated property satisfies `v(90) === v(210)`**:

- continuous rotations run at 3°/frame → exactly 360° per 120-frame loop
- pulse/breath cycles use period 60, anchored at frame 42 + 60k
- loading-dot pulses use period 40, staggered by 0/13/27 frames

Players consume the segments like this (see `src/*.js`):

```js
anim.playSegments([0, 90], true);           // intro, once
anim.addEventListener('complete', () => {
  anim.loop = true;
  anim.playSegments([90, 210], true);       // seamless loop
});
```

Playing the whole file on loop also works — the intro just replays each cycle.

### 4. Preview site (Vite, multi-page)

Each brand gets `<brand>/index.html` + `src/<brand>.js` + a theme class in `src/style.css`, registered in `vite.config.js` `rollupOptions.input`. Pages show each animation with intro/loop status chip, Replay button, and a Download link for the raw `.json`.

## Techniques worth stealing

- **Fake 3D ball rotation** (SPIN BASE v3): a static radial-gradient sphere + seam rasters sweeping across its face behind track mattes, Earth-rotation style.
- **Track mattes over layer masks** for clipping moving rasters — Lottie layer masks scale with the layer's own transform; mattes (`td`/`tt`) don't.
- **Physically-coherent rolling** (BALANCE v2): position and rotation share the same easing curve, and spin degrees ≈ travel distance / ball radius, so the roll reads true.
- **Occlusion reconstruction** (BALANCE): the outline ball's hidden arc and seam strokes are completed with concentric synthetic arcs so the ball can rotate 360° without gaps.
- **Complex-script text as raster**: Thai text (สร้างสรรค์ปัญญา) rendered via PIL + raqm with SukhumvitSet Semi Bold, then embedded as an image layer.
- **Embedded background**: a full-comp solid layer (`ty: 1`) bakes the brand background color into the JSON itself, so it renders in any player.

## Project layout

```
scripts/            one generator per brand → public/*.json
public/assets/      layered logo crops (PNG) per brand
public/*.json       generated, self-contained Lottie files
<brand>/index.html  per-brand preview page (multi-page Vite)
src/<brand>.js      lottie-web player wiring (intro → seamless loop)
src/style.css       shared UI + per-brand theme classes
firebase.json       Firebase Hosting config (dist/, short JSON cache)
```
