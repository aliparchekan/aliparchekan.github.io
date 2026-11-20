// Depth and motion, shared by every page. Everything here is optional:
// without it each page is a static, fully readable document.
(() => {
  const body = document.body;
  const hero = document.querySelector('.hero');
  const button = document.getElementById('motion-toggle');
  const dockLinks = [...document.querySelectorAll('.dock [data-section]')];
  const sections = dockLinks.map(link => document.getElementById(link.dataset.section))
    .filter(section => section && !section.classList.contains('anchor-end'));
  const cases = [...document.querySelectorAll('.case')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  let paused = false;
  try { paused = localStorage.getItem('ap-motion') === 'paused'; } catch { /* storage unavailable */ }
  let scrollQueued = false;
  let target = { x: 0, y: 0 };
  let current = { x: 0, y: 0 };
  let frame = 0;

  const motionOn = () => !paused && !reduced.matches;

  // Pointer parallax for the name and the backdrop light. The figure itself
  // never moves. The loop eases toward the pointer, then stops.
  function step() {
    current.x += (target.x - current.x) * 0.08;
    current.y += (target.y - current.y) * 0.08;
    hero.style.setProperty('--px', current.x.toFixed(4));
    hero.style.setProperty('--py', current.y.toFixed(4));
    const settled = Math.abs(target.x - current.x) < 0.002 && Math.abs(target.y - current.y) < 0.002;
    frame = settled ? 0 : requestAnimationFrame(step);
  }
  function aim(x, y) {
    if (!hero) return;
    target = { x, y };
    if (!frame) frame = requestAnimationFrame(step);
  }
  if (hero) {
    hero.addEventListener('pointermove', event => {
      if (!motionOn() || !finePointer.matches || event.pointerType === 'touch') return;
      const box = hero.getBoundingClientRect();
      aim(((event.clientX - box.left) / box.width - 0.5) * 2, ((event.clientY - box.top) / box.height - 0.5) * 2);
    });
    hero.addEventListener('pointerleave', () => aim(0, 0));
  }

  // Scroll: how far the page has slid over the pinned stage, and where we are.
  function readScroll() {
    scrollQueued = false;
    if (hero) {
      const height = hero.offsetHeight;
      const progress = Math.min(Math.max(window.scrollY / height, 0), 1);
      const covered = progress >= 1;
      hero.style.setProperty('--dim', progress.toFixed(4));
      hero.style.setProperty('--cover', motionOn() ? progress.toFixed(4) : '0');
      hero.classList.toggle('is-covered', covered);
      body.classList.toggle('past-hero', window.scrollY > height * 0.7);
      body.classList.toggle('name-idle', covered || document.hidden);
    } else {
      body.classList.add('past-hero');
    }

    const line = window.innerHeight * 0.4;
    let active = '';
    sections.forEach(section => { if (section.getBoundingClientRect().top <= line) active = section.id; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 140) active = 'contact';
    dockLinks.forEach(link => {
      const on = link.dataset.section === active;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    });
  }
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(readScroll);
  }

  // Case plates pin in a stack. They share one height and step down by a
  // fixed amount, so each plate fully covers the one before it. When the
  // plates are taller than the window the whole stack pins by its bottom
  // edge, so every plate has been read in full before it is covered.
  function layoutCases() {
    if (!cases.length) return;
    const stack = window.innerWidth > 900;
    cases.forEach(plate => plate.style.removeProperty('min-height'));
    if (!stack) { cases.forEach(plate => plate.style.removeProperty('--stick')); return; }
    const step = 18;
    const height = Math.max(...cases.map(plate => plate.offsetHeight));
    const base = Math.min(84, window.innerHeight - height - 20 - step * (cases.length - 1));
    cases.forEach((plate, index) => {
      plate.style.minHeight = `${height}px`;
      plate.style.setProperty('--stick', `${Math.round(base + index * step)}px`);
    });
  }

  function sync() {
    body.classList.toggle('motion-on', motionOn());
    if (button) {
      button.hidden = reduced.matches;
      button.textContent = paused ? 'Resume motion' : 'Pause motion';
      button.setAttribute('aria-pressed', String(paused));
    }
    if (!motionOn()) aim(0, 0);
    readScroll();
  }

  if (button) button.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('ap-motion', paused ? 'paused' : 'on'); } catch { /* storage unavailable */ }
    sync();
  });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { layoutCases(); onScroll(); });
  window.addEventListener('load', layoutCases);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutCases);

  layoutCases();
  sync();
})();
