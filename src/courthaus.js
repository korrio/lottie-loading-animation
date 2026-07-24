import './style.css';
import lottie from 'lottie-web';

const INTRO = [0, 90];
const LOOP = [90, 210];

const chip = document.querySelector('#chip');

const anim = lottie.loadAnimation({
  container: document.querySelector('#stage'),
  renderer: 'svg',
  loop: false,
  autoplay: false,
  path: '/courthaus-loading.json',
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

document.querySelector('#replay').addEventListener('click', playIntro);
