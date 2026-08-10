import './style.css';
import lottie from 'lottie-web';

const INTRO = [0, 90];
const LOOP = [90, 210];

const PANELS = [
  { id: 'v1', path: '/onepiece-loading.json' },
  { id: 'v2', path: '/onepiece-loading-v2.json' },
  { id: 'v3', path: '/onepiece-loading-v3.json' },
];

for (const { id, path } of PANELS) {
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
    anim.playSegments(INTRO, true);
  };

  anim.addEventListener('DOMLoaded', playIntro);
  anim.addEventListener('complete', () => {
    chip.textContent = 'loop';
    anim.loop = true;
    anim.playSegments(LOOP, true);
  });

  document.querySelector(`#replay-${id}`).addEventListener('click', playIntro);
}
