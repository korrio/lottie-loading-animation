import './style.css';
import lottie from 'lottie-web';

const INTRO = [0, 90];
const LOOP = [90, 210];

const VERSIONS = [
  {
    id: 'v1',
    name: 'V1 · Flat Spin',
    desc: 'Whole logo ball rotating in-plane',
    file: 'spinbase-loading-v1-flat-spin.json',
  },
  {
    id: 'v2',
    name: 'V2 · Globe Spin',
    desc: 'Ball turning left → right on its vertical axis',
    file: 'spinbase-loading-v2-globe-spin.json',
  },
  {
    id: 'v3',
    name: 'V3 · 3D Ball',
    desc: 'Static-lit 3D sphere, only the seam rotates',
    file: 'spinbase-loading-v3-3d-ball.json',
  },
];

const gallery = document.querySelector('#gallery');

for (const v of VERSIONS) {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="stage" id="stage-${v.id}" aria-label="${v.name} loading animation"></div>
    <div class="meta">
      <h2>${v.name}</h2>
      <p>${v.desc}</p>
      <div class="actions">
        <span class="chip" id="chip-${v.id}">intro</span>
        <button type="button" id="replay-${v.id}">Replay</button>
        <a href="/${v.file}" download="${v.file}">Download .json</a>
      </div>
    </div>`;
  gallery.appendChild(panel);

  const chip = panel.querySelector(`#chip-${v.id}`);
  const anim = lottie.loadAnimation({
    container: panel.querySelector(`#stage-${v.id}`),
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: `/${v.file}`,
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
  panel.querySelector(`#replay-${v.id}`).addEventListener('click', playIntro);
}
