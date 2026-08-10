# Lottie Loading Animation Creator

Programmatically-generated **Lottie loading animations** for a collection of brand logos — no After Effects involved. Each animation is authored as plain JSON by a Node script, previewed in a multi-page Vite site, and deployed to Firebase Hosting.

**Live site:** https://spinbase-animation.web.app

| Brand | Page | Animation |
| --- | --- | --- |
| SPIN BASE | [/](https://spinbase-animation.web.app/) | 3 variants: flat spin, globe spin, 3D Earth-style ball rotation |
| COURTHAUS | [/courthaus/](https://spinbase-animation.web.app/courthaus/) | Letters pop in one by one, tennis ball drops into the "O" |
| FUZE TRAINING | [/fuze/](https://spinbase-animation.web.app/fuze/) | Logo mark halves slam together, beat pulse on loop |
| สร้างสรรค์ปัญญา (Creative Intelligent) | [/sspy/](https://spinbase-animation.web.app/sspy/) | Pen nib rises, idea bulb pops and glows, Thai + English text reveal |
| BALANCE AUTO TENNIS | [/balance/](https://spinbase-animation.web.app/balance/) | 3 variants: counter-rotating balls, roll-in-and-rest, balancing act — the solid ball lands on the outline ball and teeters |
| Bitkub Capital | [/bitkub/](https://spinbase-animation.web.app/bitkub/) | Diamond-mark hooks fly in from opposite corners and interlock, coin dots pop in |
| Pantip | [/pantip/](https://spinbase-animation.web.app/pantip/) | Face pops in like a sticker, letters pop one by one, the i-dot bounces in last |
| NY SPACE | [/nyspace/](https://spinbase-animation.web.app/nyspace/) | 2 variants: drop-and-bounce; trace the line — the ball rides the letterform's stroke and rests on its dot |
| FastCourt | [/fastcourt/](https://spinbase-animation.web.app/fastcourt/) | 2 variants (with/without tagline): the F mark dashes in stretched by its own speed, letters land in its wake, speed lines whoosh on loop |
| AQUARIO | [/aquario/](https://spinbase-animation.web.app/aquario/) | 3 variants: type-on over the aq1.co ocean photo; surface-and-float from the vertical lockup; the Aquarius glyph ♒ morphs into the mark |
| Anthropic | [/anthropic/](https://spinbase-animation.web.app/anthropic/) | A coral Claude spark spins where the "I" belongs, letters rise around it, then it collapses into the iconic backslash |
| SSS Half Tennis | [/sss/](https://spinbase-animation.web.app/sss/) | The court frame pops in with the cat dozing, its eyes open, the ball drops to its paws — on loop the cat blinks lazily |
| One Piece | [/onepiece/](https://spinbase-animation.web.app/onepiece/) | The jolly-roger lockup drops in hung like a pirate flag and pendulum-settles; treasure glints twinkle as it sways |

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
node scripts/generate-balance-v3.mjs    # BALANCE v3 → public/balance-loading-v3.json
node scripts/generate-bitkub.mjs        # Bitkub     → public/bitkub-loading.json
node scripts/generate-pantip.mjs        # Pantip     → public/pantip-loading.json
node scripts/generate-nyspace.mjs       # NY SPACE v1 → public/nyspace-loading.json
node scripts/generate-nyspace-v2.mjs    # NY SPACE v2 → public/nyspace-loading-v2.json
node scripts/generate-fastcourt.mjs     # FastCourt v1 → public/fastcourt-loading.json
node scripts/generate-fastcourt-v2.mjs  # FastCourt v2 → public/fastcourt-loading-v2.json
node scripts/generate-aquario.mjs       # AQUARIO v1 → public/aquario-loading.json
node scripts/generate-aquario-v2.mjs    # AQUARIO v2 → public/aquario-loading-v2.json
node scripts/generate-aquario-v3.mjs    # AQUARIO v3 → public/aquario-loading-v3.json
node scripts/generate-anthropic.mjs     # Anthropic  → public/anthropic-loading.json
node scripts/generate-anthropic-v2.mjs  # Anthropic v2 → public/anthropic-loading-v2.json
node scripts/generate-sss.mjs           # SSS Half Tennis → public/sss-loading.json
node scripts/generate-onepiece.mjs      # One Piece  → public/onepiece-loading.json
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

## Rendering to video (for social media)

No extra installs needed — Chrome records the animation itself:

```bash
node scripts/video-recv-server.mjs   # terminal 1: receives the recording → renders/
npm run dev                          # terminal 2
```

Open the brand page, paste `scripts/record-lottie-video.js` into the DevTools
console, then:

```js
await recordLottie('/aquario-loading.json', 'aquario-v1.webm')
```

That saves a 1600×1200 30fps WebM (intro + 2 seamless loops + a hold on the
resting lockup, ~6s) into `renders/`. WebM uploads directly to YouTube/X.
For Instagram/TikTok convert to MP4 (uses ffmpeg if present):

```bash
ffmpeg -i renders/aquario-v1.webm -c:v libx264 -pix_fmt yuv420p -crf 18 -r 30 \
       -movflags +faststart renders/aquario-v1.mp4
```
