import './style.css';
import lottie from 'lottie-web';

const PANELS = [
  { id: 'v1', path: '/korrio-loading.json', intro: [0, 90], loop: [90, 210] },
  { id: 'v2', path: '/korrio-loading-v2.json', intro: [0, 150], loop: [150, 270] },
];

for (const { id, path, intro, loop } of PANELS) {
  const chip = document.querySelector(`#chip-${id}`);

  const anim = lottie.loadAnimation({
    container: document.querySelector(`#stage-${id}`),
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path,
  });

  const playIntro = () => {
    chip.textContent = 'intro';
    anim.loop = false;
    anim.playSegments(intro, true);
  };

  anim.addEventListener('DOMLoaded', playIntro);
  anim.addEventListener('complete', () => {
    chip.textContent = 'loop';
    anim.loop = true;
    anim.playSegments(loop, true);
  });

  document.querySelector(`#replay-${id}`).addEventListener('click', playIntro);
}
