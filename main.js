import { gsap } from 'gsap';

/* ==========================================================================
   Altero — Mousemove parallax hero
   Each layer carries a data-speed attribute (0.01–0.05).
   Cursor offset from screen centre is multiplied by speed × SCALE to give
   a subtle depth-of-field drift: fast layers (front) move more than slow
   layers (back), creating the illusion of parallax depth.
   ========================================================================== */

(function initParallax() {
  const wrapper = document.getElementById('wrapper');
  if (!wrapper) return;

  const layers = Array.from(wrapper.querySelectorAll('[data-speed]'));
  if (!layers.length) return;

  // Maximum pixel travel at speed = 1.0 when cursor is at the screen edge.
  const SCALE = 80;

  let halfW = window.innerWidth  / 2;
  let halfH = window.innerHeight / 2;

  window.addEventListener('resize', () => {
    halfW = window.innerWidth  / 2;
    halfH = window.innerHeight / 2;
  });

  window.addEventListener('mousemove', (e) => {
    // Normalised offset: ranges from -1 (left/top) to +1 (right/bottom)
    const offX = (e.clientX - halfW) / halfW;
    const offY = (e.clientY - halfH) / halfH;

    for (const layer of layers) {
      const speed = parseFloat(layer.dataset.speed) || 0;

      gsap.to(layer, {
        x: offX * speed * SCALE,
        y: offY * speed * SCALE,
        duration: 1,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  });
})();
