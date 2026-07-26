/**
 * In-browser Lottie → WebM recorder. Zero installs: Chrome does the encoding.
 *
 * Usage:
 *   1. node scripts/video-recv-server.mjs        (terminal 1)
 *   2. npm run dev                                (terminal 2)
 *   3. open any brand page (e.g. http://localhost:5173/aquario/),
 *      paste this file into the DevTools console, then run e.g.:
 *        await recordLottie('/aquario-loading.json', 'aquario-v1.webm')
 *   4. optional MP4 for Instagram/TikTok (uses ffmpeg if you have it):
 *        ffmpeg -i renders/aquario-v1.webm -c:v libx264 -pix_fmt yuv420p \
 *               -crf 18 -r 30 -movflags +faststart renders/aquario-v1.mp4
 *
 * Records the intro once + the seamless loop twice + a short hold on the
 * resting lockup: ~6s at 1600×1200 30fps. WebM (VP9) uploads fine to
 * YouTube/X as-is.
 */
window.recordLottie = async (jsonPath, outName, { width = 1600, height = 1200, fps = 30 } = {}) => {
  if (!window.lottie) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = '/node_modules/lottie-web/build/player/lottie.min.js';
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const box = document.createElement('div');
  box.style.cssText = `position:fixed;left:-99999px;width:${width}px;height:${height}px`;
  document.body.appendChild(box);
  const anim = lottie.loadAnimation({ container: box, renderer: 'svg', loop: false, autoplay: false, path: jsonPath });
  await new Promise((r) => anim.addEventListener('DOMLoaded', r));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const rec = new MediaRecorder(canvas.captureStream(fps), {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 12_000_000,
  });
  const chunks = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));

  const ser = new XMLSerializer();
  const drawFrame = async (f) => {
    anim.goToAndStop(f, true);
    const svg = box.querySelector('svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    const url = URL.createObjectURL(new Blob([ser.serializeToString(svg)], { type: 'image/svg+xml' }));
    const img = new Image();
    img.src = url;
    await img.decode();
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
  };

  // 60fps timeline sampled every 2 frames → 30fps video, real-time paced
  const frames = [];
  for (let f = 0; f < 90; f += 2) frames.push(f); // intro
  for (let k = 0; k < 2; k++) for (let f = 90; f < 210; f += 2) frames.push(f); // loop ×2
  for (let k = 0; k < fps / 2; k++) frames.push(90); // hold the resting lockup

  rec.start();
  const t0 = performance.now();
  for (let i = 0; i < frames.length; i++) {
    await drawFrame(frames[i]);
    const wait = t0 + ((i + 1) * 1000) / fps - performance.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }
  rec.stop();
  await done;
  anim.destroy();
  box.remove();

  const blob = new Blob(chunks, { type: 'video/webm' });
  const resp = await fetch(`http://localhost:5198/upload?name=${outName}`, { method: 'POST', body: blob });
  return `${outName}: ${(blob.size / 1024).toFixed(0)} KB, upload ${resp.status}`;
};
