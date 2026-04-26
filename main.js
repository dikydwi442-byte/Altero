/* Altero — landing page interactions
 * Vanilla JS + GSAP 3 (Core, ScrollTrigger, ScrollToPlugin) + simplex-noise.
 *
 * Phase 1: SimplexNoise-driven canvas particle portal. Click flies through
 *          the portal, reveals the hero, and unlocks page scroll.
 * Phase 2: Mousemove parallax across .p1/.p2/.p3/.word inside #wrapper.
 * Phase 3: Arrow button — hover wiggle + ScrollToPlugin click-to-scroll.
 */

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ---------------------------------------------------------------------------
 * Raw-URL → local-file fallback for the parallax backgrounds.
 * The CSS references the canonical raw.githubusercontent URLs (per spec),
 * which 404 if the repo is private. This probes each URL; on failure it
 * swaps the layer's background to the bundled JPG sitting next to index.html
 * so the deployed site still renders. No-op when the raw URLs load.
 * ------------------------------------------------------------------------- */
(function ensureParallaxAssets () {
  const assets = [
    { sel: '.p1', local: './project%201.jpg' },
    { sel: '.p2', local: './project%202.jpg' },
    { sel: '.p3', local: './project%203.jpg' }
  ];
  for (const { sel, local } of assets) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const css = getComputedStyle(el).backgroundImage;
    const m = css.match(/url\(["']?([^"')]+)["']?\)/);
    if (!m) continue;
    const raw = m[1];
    const probe = new Image();
    probe.onerror = () => {
      // Keep the mask/filter declarations; only swap the URL.
      el.style.backgroundImage = `url('${local}')`;
    };
    probe.src = raw;
  }
})();

/* ===========================================================================
 * Phase 1 — Canvas portal
 * ========================================================================= */
(function initPortal () {
  const screen   = document.getElementById('portal-screen');
  const canvas   = document.getElementById('portal-canvas');
  const enterTxt = document.getElementById('enter-text');
  if (!screen || !canvas) return;

  // ---- createRenderingContext -------------------------------------------
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, cx = 0, cy = 0, dpr = 1;

  function resize () {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width  = Math.floor(innerWidth  * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width  = innerWidth  + 'px';
    canvas.style.height = innerHeight + 'px';
    cx = w / 2;
    cy = h / 2;
  }
  resize();
  addEventListener('resize', resize);

  // ---- SimplexNoise -----------------------------------------------------
  // simplex-noise@2.x (UMD) exposes window.SimplexNoise with a noise3D method.
  const noise = (typeof SimplexNoise === 'function')
    ? new SimplexNoise()
    : { noise3D: (x, y, z) => Math.sin(x * 1.7 + z) * Math.cos(y * 1.3 - z) };

  // ---- Particle system --------------------------------------------------
  const PARTICLE_COUNT = Math.min(900, Math.floor((innerWidth * innerHeight) / 2400));
  const particles = [];

  function spawn (p, initial) {
    const a = Math.random() * Math.PI * 2;
    const r = initial
      ? Math.random() * Math.min(w, h) * 0.5
      : Math.random() * 18 * dpr;
    p.x = cx + Math.cos(a) * r;
    p.y = cy + Math.sin(a) * r;
    p.life = 0;
    p.maxLife = 90 + Math.random() * 220;
    p.size = (0.6 + Math.random() * 1.6) * dpr;
    p.hue = 18 + Math.random() * 38;          // warm gold/amber
    if (Math.random() < 0.35) p.hue = 260 + Math.random() * 40; // splash of violet
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = {};
    spawn(p, true);
    particles.push(p);
  }

  // ---- drawParticle loop ------------------------------------------------
  let portalAlive = true;
  let lastT = 0;

  function drawParticle (t) {
    if (!portalAlive) return;

    // Trail fade
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(0, 0, w, h);

    // Additive blending for the glow
    ctx.globalCompositeOperation = 'lighter';

    const time = t * 0.0008;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.hypot(dx, dy) + 0.001;
      const ang = Math.atan2(dy, dx);

      // Tangential rotation around the centre + outward push
      const tang = ang + Math.PI / 2;
      const rotSpeed = 1.4 + (60 * dpr) / (dist + 30 * dpr);

      // Noise nudge so the spiral is organic, not perfect
      const n = noise.noise3D(p.x * 0.0025, p.y * 0.0025, time);
      const nudge = n * 1.4;

      p.x += Math.cos(tang) * rotSpeed + Math.cos(ang + nudge) * 0.6 + dx * 0.0009;
      p.y += Math.sin(tang) * rotSpeed + Math.sin(ang + nudge) * 0.6 + dy * 0.0009;
      p.life++;

      const alpha = 1 - p.life / p.maxLife;
      const size  = p.size * (0.6 + 0.6 * alpha);

      ctx.fillStyle = `hsla(${p.hue}, 95%, ${55 + alpha * 25}%, ${0.85 * alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();

      if (
        p.life > p.maxLife ||
        dist > Math.max(w, h) * 0.7 ||
        p.x < -50 || p.x > w + 50 || p.y < -50 || p.y > h + 50
      ) {
        spawn(p, false);
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    lastT = t;
    requestAnimationFrame(drawParticle);
  }
  requestAnimationFrame(drawParticle);

  // ---- Click → fly through the portal ----------------------------------
  let entering = false;
  function enterPortal () {
    if (entering) return;
    entering = true;

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        portalAlive = false;
        screen.style.display = 'none';
        document.body.classList.remove('portal-locked');
        // Refresh ScrollTrigger now that the page can scroll.
        ScrollTrigger.refresh();
      }
    });

    tl.to(enterTxt, { opacity: 0, duration: 0.35, ease: 'power1.out' }, 0)
      .to(canvas,   { scale: 20, duration: 1.5, ease: 'power3.in', transformOrigin: '50% 50%' }, 0)
      .to(screen,   { opacity: 0, duration: 1.5, ease: 'power2.inOut' }, 0);
  }

  screen.addEventListener('click', enterPortal);
  screen.addEventListener('touchstart', (e) => { e.preventDefault(); enterPortal(); }, { passive: false });
  screen.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterPortal(); }
  });
})();

/* ===========================================================================
 * Phase 2 — Mousemove parallax hero (#wrapper)
 * ========================================================================= */
(function initMouseParallax () {
  const wrapper = document.getElementById('wrapper');
  if (!wrapper) return;

  const layers = Array.from(wrapper.querySelectorAll('[data-speed]'));
  if (!layers.length) return;

  // .word is centred with top/left: 50% + translate(-50%, -50%). If we let
  // GSAP inherit that from CSS, the first gsap.to({x, y}) will overwrite the
  // centering translate and the title will snap off-centre. Seat the
  // centering in GSAP's xPercent/yPercent track (which survives x/y tweens).
  for (const layer of layers) {
    if (layer.classList.contains('word')) {
      gsap.set(layer, { xPercent: -50, yPercent: -50 });
    }
  }

  let halfW = innerWidth / 2;
  let halfH = innerHeight / 2;
  addEventListener('resize', () => {
    halfW = innerWidth / 2;
    halfH = innerHeight / 2;
  });

  window.addEventListener('mousemove', (e) => {
    // Normalised offset of cursor from screen centre, range ~[-1, +1].
    const offX = (e.clientX - halfW) / halfW;
    const offY = (e.clientY - halfH) / halfH;

    for (const layer of layers) {
      const speed = parseFloat(layer.dataset.speed) || 0;

      gsap.to(layer, {
        x: offX * speed,
        y: offY * speed,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }
  });
})();

/* ===========================================================================
 * Phase 3 — Arrow button
 * ========================================================================= */
(function initArrow () {
  const arrowBtn = document.querySelector('#arrow-btn');
  if (!arrowBtn) return;

  arrowBtn.addEventListener('mouseenter', () => {
    gsap.to('.arrow', { y: 10, duration: 0.8, ease: 'back.inOut(3)', overwrite: 'auto' });
  });

  arrowBtn.addEventListener('mouseleave', () => {
    gsap.to('.arrow', { y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
  });

  arrowBtn.addEventListener('click', () => {
    gsap.to(window, { scrollTo: innerHeight, duration: 1.5, ease: 'power1.inOut' });
  });
})();
