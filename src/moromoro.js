import './style.css';
import lottie from 'lottie-web';

const INTRO = [0, 90];
const LOOP = [90, 210];

const PANELS = [
  { id: 'd1', path: '/moromoro-dark-v1.json' },
  { id: 'd2', path: '/moromoro-dark-v2.json' },
  { id: 'd3', path: '/moromoro-dark-v3.json' },
  { id: 'd4', path: '/moromoro-dark-v4.json' },
  { id: 'd5', path: '/moromoro-dark-v5.json' },
  { id: 'd6', path: '/moromoro-dark-v6.json' },
  { id: 'l1', path: '/moromoro-light-v1.json' },
  { id: 'l2', path: '/moromoro-light-v2.json' },
  { id: 'l3', path: '/moromoro-light-v3.json' },
  { id: 'l4', path: '/moromoro-light-v4.json' },
  { id: 'l5', path: '/moromoro-light-v5.json' },
  { id: 'l6', path: '/moromoro-light-v6.json' },
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
