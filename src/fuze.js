import './style.css';
import lottie from 'lottie-web';

const INTRO = [0, 90];
const LOOP = [90, 210];

const PANELS = [
  { id: 'v1', path: '/fuze-loading.json' },
  { id: 'v11', path: '/fuze-loading-v1-white.json' },
  { id: 'v21', path: '/fuze-loading-v2-1.json' },
  { id: 'v22', path: '/fuze-loading-v2-2.json' },
  { id: 'v31', path: '/fuze-loading-v3-1.json' },
  { id: 'v32', path: '/fuze-loading-v3-2.json' },
  { id: 'v33', path: '/fuze-loading-v3-3.json' },
  { id: 'v34', path: '/fuze-loading-v3-4.json' },
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
