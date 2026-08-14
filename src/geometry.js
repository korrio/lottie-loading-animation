import './style.css';
import lottie from 'lottie-web';

const INTRO = [0, 90];

const PANELS = [
  { id: 'v1', path: '/geometry-loading.json' },
  { id: 's1', path: '/geometry-01-cube-cluster.json' },
  { id: 's1b', loop: [90, 330], path: '/geometry-01-cube-cluster-v2.json' },
  { id: 's2', path: '/geometry-02-icosahedron.json' },
  { id: 's3', path: '/geometry-03-hex-cube.json' },
  { id: 's3b', loop: [90, 330], path: '/geometry-03-hex-cube-v2.json' },
  { id: 's4', path: '/geometry-04-lattice.json' },
  { id: 's4b', loop: [90, 330], path: '/geometry-04-lattice-v2.json' },
  { id: 's5', path: '/geometry-05-plus-cubes.json' },
  { id: 's6', path: '/geometry-06-octahedron.json' },
  { id: 's7', path: '/geometry-07-tesseract.json' },
  { id: 's7b', loop: [90, 330], path: '/geometry-07-tesseract-v2.json' },
  { id: 's8', path: '/geometry-08-tri-pyramid.json' },
];

for (const { id, path, loop = [90, 210] } of PANELS) {
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
    anim.playSegments(loop, true);
  });

  document.querySelector(`#replay-${id}`).addEventListener('click', playIntro);
}
