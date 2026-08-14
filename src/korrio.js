import './style.css';
import lottie from 'lottie-web';

const chip = document.querySelector('#chip-v1');

const anim = lottie.loadAnimation({
  container: document.querySelector('#stage-v1'),
  renderer: 'svg',
  loop: false,
  autoplay: false,
  path: '/korrio-loading.json',
});

const playIntro = () => {
  chip.textContent = 'intro';
  anim.loop = false;
  anim.playSegments([0, 90], true);
};

anim.addEventListener('DOMLoaded', playIntro);
anim.addEventListener('complete', () => {
  chip.textContent = 'loop';
  anim.loop = true;
  anim.playSegments([90, 210], true);
});

document.querySelector('#replay-v1').addEventListener('click', playIntro);
