const frames = '#produits :is(.product-image, .gbs-image), main .grid .card > .photo';
const tracked = new WeakMap();

const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/assets/cadrage-catalogue.css';
document.head.append(stylesheet);

const response = await fetch('/assets/cadrage-catalogue.json');
if (!response.ok) throw new Error('Cadrage indisponible');
const measurements = await response.json();

function fit(frame) {
  const image = tracked.get(frame);
  if (!image?.complete || !image.naturalWidth || !image.clientWidth || !image.clientHeight) return;

  const url = new URL(image.currentSrc || image.src);
  const key = (url.origin === location.origin ? '' : url.host) + url.pathname;
  const box = measurements[key];
  if (!box) {
    image.removeAttribute('data-catalogue-cropped');
    return;
  }

  const [left, top, right, bottom] = box;
  const width = image.clientWidth;
  const height = image.clientHeight;
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const photoWidth = image.naturalWidth * ratio;
  const photoHeight = image.naturalHeight * ratio;
  const span = Math.min(width, height);
  const zoom = Math.min(4, span * .88 / ((right - left) * photoWidth),
    span * .86 / ((bottom - top) * photoHeight));
  const x = (.5 - (left + right) / 2) * photoWidth * zoom;
  const y = (.5 - (top + bottom) / 2) * photoHeight * zoom;

  image.style.setProperty('--hira-photo-zoom', zoom.toFixed(3));
  image.style.setProperty('--hira-photo-offset', `${x.toFixed(1)}px ${y.toFixed(1)}px`);
  image.setAttribute('data-catalogue-cropped', '');
}

const observer = new ResizeObserver(entries => {
  for (const {target} of entries) fit(target);
});

function registerFrames() {
  for (const frame of document.querySelectorAll(frames)) {
    if (tracked.has(frame)) continue;
    const image = frame.querySelector('img');
    if (!image) continue;
    tracked.set(frame, image);
    image.addEventListener('load', () => fit(frame));
    observer.observe(frame);
    fit(frame);
  }
}

registerFrames();
document.addEventListener('hira:catalogue-hydrated', registerFrames);
