/* ═══════════════════════════════════════════════════════════
   JUNGLE COCKTAIL BAR — design concept
   No libraries. Every scroll effect is a synchronous passive
   handler writing a CSS custom property, so the compositor
   does the animating and the value is readable for testing.
   ═══════════════════════════════════════════════════════════ */
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE    = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ═══════════ DATA ═══════════════════════════════════════
   Every drink, price and line below is transcribed from the
   menu Jungle publishes at jungle.is/#/drinks. Obvious typos
   in the printed sheet are corrected ("Stile-ish" -> style-ish,
   "wierd" -> weird, "Bellpepper" -> bell pepper).
   `img` is set ONLY where the bar's own photo library gives an
   unambiguous filename or CMS record for that exact drink.
   ═════════════════════════════════════════════════════════ */

/* The current menu lives in index.html as real markup (see the drinks
   section). Keeping it in one place only means the page, the ticker and
   the panel can never disagree with each other. */

/* Retired drinks. Names come from Jungle's own CMS records, each one
   paired with the photograph filed against that exact record. */
const ARCHIVE = [
  { n: 'Piblet Comes Home', f: 'a-piblet',      a: 'A vivid green cocktail with basil leaves on a dark wooden bar.' },
  { n: 'Bonita Applebum',   f: 'a-bonita',      a: 'A cocktail served at Jungle, photographed against a dark background.' },
  { n: 'Pinkman',           f: 'a-pinkman',     a: 'A pink cocktail served at Jungle.' },
  { n: 'Cherry Amour',      f: 'a-cherryamour', a: 'A cherry-red cocktail served at Jungle.' },
  { n: 'Holy Mole',         f: 'a-holymole',    a: 'A dark cocktail from the Jungle menu.' },
  { n: 'Major Lazer',       f: 'a-majorlazer',  a: 'A cocktail from the Jungle menu.' },
  { n: 'Jungle Club',       f: 'a-jungleclub',  a: 'A cocktail from the Jungle menu.' },
  { n: 'Cocobutt',          f: 'a-cocobutt',    a: 'A creamy coconut cocktail from the Jungle menu.' },
  { n: 'Beetles',           f: 'a-beetles',     a: 'A cocktail from the Jungle menu.' },
  { n: 'Dewey',             f: 'a-dewey',       a: 'A cocktail from the Jungle menu.' },
  { n: 'Berlingo',          f: 'a-berlingo',    a: 'A cocktail from the Jungle menu.' },
  { n: 'Cher-rye',          f: 'a-cherrye',     a: 'A cocktail from the Jungle menu.' },
  { n: 'Broghurt',          f: 'a-broghurt',    a: 'A cocktail from the Jungle menu.' },
  { n: 'Stairway',          f: 'a-stairway',    a: 'A cocktail from the Jungle menu.' },
  { n: 'Highway',           f: 'a-highway',     a: 'A cocktail from the Jungle menu.' }
];

const HOURS = [
  ['Monday',    '16:00 – 01:00'],
  ['Tuesday',   '16:00 – 01:00'],
  ['Wednesday', '16:00 – 01:00'],
  ['Thursday',  '16:00 – 01:00'],
  ['Friday',    '16:00 – 02:00'],
  ['Saturday',  '16:00 – 02:00'],
  ['Sunday',    '16:00 – 01:00']
];

/* ═══════════ TICKER ═════════════════════════════════════ */
(() => {
  const track = $('#tickTrack');
  if (!track) return;
  // read the names straight off the rendered list, so there is only ever
  // one copy of the menu and the ticker can never drift out of sync
  const names = $$('.drow__name').map(el => el.firstChild.textContent.trim());
  if (!names.length) return;
  // two identical halves so the -50% loop is genuinely seamless
  const half = names.map(n => `<span>${n}<b> ✦ </b></span>`).join('');
  track.innerHTML = half + half;
})();

/* ═══════════ HOURS ══════════════════════════════════════ */
(() => {
  const list = $('#hoursList');
  if (!list) return;
  // getDay() is 0=Sunday; our table starts on Monday
  const idx = (new Date().getDay() + 6) % 7;
  list.innerHTML = HOURS.map(([d, h], i) =>
    `<li class="${i === idx ? 'is-today' : ''}"><span>${d}${i === idx ? ' · today' : ''}</span><b>${h}</b></li>`
  ).join('');
})();

/* ═══════════ DRINK INDEX ════════════════════════════════
   Every drink ships as real markup in index.html, so the list
   works with no javascript and search engines can read it. This
   only ENHANCES it with a preview panel. That is the functional
   fix: the real site ships its menu as a photograph of a printed
   sheet, unreadable to search engines, to screen readers and to
   anyone zooming in on a phone.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const wrap = $('#drinkLists');
  if (!wrap) return;

  const panel = {
    img:   $('#panelImg'),
    noImg: $('#panelNoImg'),
    cat:   $('#panelCat'),
    name:  $('#panelName'),
    note:  $('#panelNote'),
    spec:  $('#panelSpec'),
    price: $('#panelPrice')
  };

  let activeRow = null;
  let token = 0;              // guards against a slow image landing late

  function show(row) {
    if (!row) return;
    const list = row.closest('.dlist');

    if (activeRow) activeRow.classList.remove('is-active');
    row.classList.add('is-active');
    activeRow = row;

    const name = $('.drow__name', row).firstChild.textContent.trim();
    panel.cat.textContent   = (list.dataset.label || '').toUpperCase();
    panel.name.textContent  = name;
    panel.note.textContent  = $('.drow__note', row).textContent;
    panel.price.textContent = list.dataset.price || '';
    panel.spec.innerHTML    = (row.dataset.spec || '').split('|')
      .filter(Boolean).map(s => `<li>${s}</li>`).join('');

    const src = row.dataset.img;
    const me  = ++token;

    if (!src) {
      // never leave another drink's photograph sitting under this name
      panel.img.hidden = true;
      panel.img.removeAttribute('src');
      panel.img.alt = '';
      panel.noImg.hidden = false;
      return;
    }

    panel.noImg.hidden = true;
    panel.img.hidden = false;
    panel.img.classList.add('is-swapping');
    const next = new Image();
    next.onload = next.onerror = () => {
      if (me !== token) return;          // a newer drink won, drop this one
      panel.img.src = src;
      panel.img.alt = row.dataset.alt || '';
      panel.img.classList.remove('is-swapping');
    };
    next.src = src;
  }

  $$('.drow', wrap).forEach(row => {
    const load = () => show(row);
    row.addEventListener('mouseenter', load);
    row.addEventListener('focus', load);
    row.addEventListener('click', load);
  });

  // open on Black & Yellow, the one drink built on an Icelandic spirit
  show($$('.dlist.is-on .drow', wrap)[4]);

  /* ── tabs, with proper roving tabindex and arrow keys ── */
  const tabs = $$('.tab');
  function select(tab) {
    tabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      const p = $('#' + t.getAttribute('aria-controls'));
      if (p) { p.classList.toggle('is-on', on); p.hidden = !on; }
    });
    show($('.dlist.is-on .drow'));
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus(); select(next);
    });
  });
})();

/* ═══════════ ARCHIVE GRID ═══════════════════════════════ */
(() => {
  const grid = $('#archiveGrid');
  if (!grid) return;
  grid.innerHTML = ARCHIVE.map(d => `
    <li>
      <figure class="acard">
        <img src="assets/img/${d.f}.webp" alt="${d.a}" width="1000" height="1000" loading="lazy" decoding="async" />
        <figcaption><span class="acard__tag">Retired</span>${d.n}</figcaption>
      </figure>
    </li>`).join('');
})();

/* ═══════════ HEADER STATE ═══════════════════════════════ */
(() => {
  const hdr = $('#hdr');
  if (!hdr) return;
  const upd = () => hdr.classList.toggle('is-stuck', (scrollY || pageYOffset) > 40);
  addEventListener('scroll', upd, { passive: true });
  upd();
})();

/* ═══════════ MOBILE MENU ════════════════════════════════ */
(() => {
  const burger = $('#burger');
  const menu   = $('#menu');
  if (!burger || !menu) return;

  let open = false;

  function set(state) {
    open = state;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
    if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); }
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { if (!open) menu.hidden = true; }, 360);
    }
  }

  burger.addEventListener('click', () => set(!open));

  addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) { set(false); burger.focus(); }
  });

  // close, then scroll one frame later so the unlock has landed
  $$('a', menu).forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || !id.startsWith('#')) return;
    e.preventDefault();
    set(false);
    requestAnimationFrame(() => {
      const t = $(id);
      if (!t) return;
      if (window.__lenis) window.__lenis.scrollTo(t, { duration: 1.1 });
      else t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
    });
  }));

  addEventListener('resize', () => { if (open && innerWidth > 1080) set(false); });
})();

/* ═══════════ TINY DRINKS THAT FOLLOW THE CURSOR ═════════
   A follow-the-leader chain. Copy 0 eases toward the pointer,
   every later copy eases toward the one ahead of it, so the lag
   comes out of the easing rather than a buffer of samples. The
   whole flock fades in only while the archive is on screen.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const trail = $('#trail');
  const zone  = $('#archive');
  if (!trail || !zone || !FINE || REDUCED) return;

  const PICKS = ['a-piblet', 'a-bonita', 'a-cherryamour', 'a-pinkman', 'a-cocobutt'];
  const CHASE = 0.24;

  trail.innerHTML = PICKS.map(f =>
    `<img src="assets/img/${f}.webp" alt="" width="200" height="200" decoding="async" />`
  ).join('');

  const items = $$('img', trail).map((im, i) => ({
    im,
    x: innerWidth / 2, y: innerHeight / 2,
    rot: 0,
    chase: CHASE * Math.pow(0.74, i),   // each one falls further behind
    tilt: (i % 2 ? 1 : -1) * (3 + i * 2.4),
    scale: 1 - i * 0.11,
    target: 1 - i * 0.15                // resting opacity per copy
  }));

  let mx = innerWidth / 2, my = innerHeight / 2;
  let idle = 9999, vis = 0, last = performance.now(), raf = 0;

  addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY; idle = 0;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }, { passive: true });

  function tick(now) {
    const dt = Math.min(64, now - last);
    last = now;
    idle += dt;

    const r = zone.getBoundingClientRect();
    const inView = r.top < innerHeight * 0.9 && r.bottom > innerHeight * 0.1;
    const want = (inView && idle < 1800 && !document.hidden) ? 1 : 0;
    vis += (want - vis) * (want ? 0.13 : 0.06);

    let tx = mx, ty = my, moved = false;

    for (const it of items) {
      const dx = tx - it.x, dy = ty - it.y;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) moved = true;
      it.x += dx * it.chase;
      it.y += dy * it.chase;
      // lean into the direction of travel, then settle back to level
      const lean = Math.max(-16, Math.min(16, dx * 0.12));
      it.rot += (it.tilt + lean - it.rot) * 0.09;
      tx = it.x; ty = it.y;

      it.im.style.opacity = (it.target * vis).toFixed(3);
      it.im.style.transform =
        `translate3d(${it.x.toFixed(1)}px,${it.y.toFixed(1)}px,0) translate(-50%,-50%) rotate(${it.rot.toFixed(2)}deg) scale(${it.scale})`;
    }

    // idle out rather than spinning a loop forever
    if (!moved && vis < 0.004) { raf = 0; return; }
    raf = requestAnimationFrame(tick);
  }
})();

/* ═══════════ THE FILM ═══════════════════════════════════
   Desktop, fine pointer: the wide film, PAUSED — the scroll
   is the bartender. Scrolling the pinned hero scrubs
   currentTime, so the spoon stirs exactly as fast as you
   scroll. Fetched as a blob so every seek is instant.
   Touch / small screens: the portrait loop, autoplaying.
   Reduced motion: the poster, nothing moves.
   ═══════════════════════════════════════════════════════════ */
const MOTION  = !REDUCED && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && typeof Lenis !== 'undefined';
const DESKTOP = FINE && matchMedia('(min-width: 1081px)').matches;
const SCRUB_MODE = MOTION && DESKTOP;

(() => {
  const v = $('#stirVid');
  if (!v || REDUCED) return;               // reduced motion keeps the poster
  v.muted = true; v.defaultMuted = true;

  if (SCRUB_MODE) {
    // paused film, scroll-driven; blob first so seeking never hits the network
    fetch('assets/stir-wide.mp4')
      .then(r => r.ok ? r.blob() : Promise.reject())
      .then(b => { v.src = URL.createObjectURL(b); })
      .catch(() => { v.src = 'assets/stir-wide.mp4'; });
    v.addEventListener('loadedmetadata', () => {
      v.currentTime = 0.001;
      if (MOTION) ScrollTrigger.refresh();
    }, { once: true });
  } else {
    // ambient loop of the same vortex, autoplaying
    v.src = 'assets/stir-wide.mp4';
    const go = () => { const p = v.play(); if (p) p.catch(() => {}); };
    go();
    addEventListener('pointerdown', go, { once: true, passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });
  }
})();

/* ═══════════ MOTION ENGINE ══════════════════════════════
   Lenis + GSAP ScrollTrigger, wired the proven way:
   lenis drives ScrollTrigger.update, gsap's ticker drives
   lenis, lagSmoothing off. All tweens are transform/opacity
   plus one clip-path device. CSS hides nothing: every
   initial "hidden" state is set here, so no-JS and
   reduced-motion get the complete page for free.
   ═══════════════════════════════════════════════════════════ */
(() => {
  if (!MOTION) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Heavier glide than the default. lerp (not duration) gives a continuous
  // ease that never "arrives", and a damped wheel multiplier stops the jump
  // a notched mouse wheel otherwise produces.
  const lenis = new Lenis({
    lerp: 0.075,
    wheelMultiplier: 0.85,
    touchMultiplier: 1.6,
    smoothWheel: true,
    syncTouch: false
  });
  window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const AMP  = DESKTOP ? 1 : 0.55;         // halve amplitudes on small screens
  const EASE = 'expo.out';

  /* ── hero entrance: time-based, never scroll-gated ────── */
  gsap.set('.hero__inner', { yPercent: 112 });
  gsap.set('.hero__film',  { '--film-s': 1 });   // the render is the composition; never crop it in code
  gsap.set('.hero__eyebrow', { y: -14, opacity: 0 });
  gsap.set('#heroBase', { y: 22, opacity: 0 });
  gsap.set('#heroHint', { opacity: 0 });

  /* The entrance is held until the opening scene hands over, so it plays
     for the viewer instead of behind a full-screen loader, and so nothing
     re-renders it half-finished on the refresh that follows. */
  const intro = gsap.timeline({ paused: true });
  intro
    .to('.hero__inner', { yPercent: 0, duration: 1.05, ease: EASE, stagger: 0.14 }, 0)
    .to('.hero__eyebrow', { y: 0, opacity: 1, duration: 0.7, ease: EASE }, 0.1)
    .to('#heroBase',  { y: 0, opacity: 1, duration: 0.8, ease: EASE }, 0.42)
    .to('#heroHint',  { opacity: 1, duration: 0.6, ease: 'none' }, 0.75);
  window.__heroIntro = intro;
  // no gate on this visit (repeat visitor, reduced motion, no JS gate) -> go now
  if (!$('#gate')) intro.play();

  /* ── the signature: pinned hero, scroll scrubs the stir ── */
  if (SCRUB_MODE) {
    const v = $('#stirVid');
    // build the scrub only once the entrance has landed, so every recorded
    // start value is the element's true resting state
    let targetT = 0, curT = 0;

    // one lerp writes currentTime; Lenis supplies the smoothing upstream
    gsap.ticker.add(() => {
      if (!v || !v.duration) return;
      curT += (targetT - curT) * 0.16;
      if (Math.abs(curT - v.currentTime) > 0.02) v.currentTime = curT;
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: '#heropin', start: 'top top', end: '+=170%',
        pin: true, scrub: 0.55,
        onUpdate(self) {
          if (v && v.duration) targetT = self.progress * (v.duration - 0.06);
        }
      }
    })
      .to('#lineA',      { yPercent: -95, opacity: 0, ease: 'none', duration: 0.7, immediateRender: false }, 0.05)
      .to('#lineB',      { yPercent: 120, opacity: 0, ease: 'none', duration: 0.7, immediateRender: false }, 0.12)
      .to('#heroBase',   { y: 40, opacity: 0, ease: 'none', duration: 0.45, immediateRender: false }, 0)
      .to('#heroHint',   { opacity: 0, ease: 'none', duration: 0.2, immediateRender: false }, 0)
      .to('.hero__film', { '--film-s': 1.14, ease: 'none', duration: 1 }, 0)
      .to('.hero__veil', { opacity: 0.62, ease: 'none', duration: 0.3 }, 0.7);
  } else {
    // no pin on touch: a gentle settle of the film instead
    gsap.to('.hero__film', {
      '--film-s': 1.08, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ── split headings: word masks, aria-safe ────────────── */
  function split(el) {
    // innerText keeps the <br> as a break so words don't fuse across lines
    const label = (el.innerText || el.textContent).replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', label);
    const shell = document.createElement('span');
    shell.setAttribute('aria-hidden', 'true');
    while (el.firstChild) shell.appendChild(el.firstChild);
    el.appendChild(shell);
    (function wrap(node) {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span'); w.className = 'jw';
            const i = document.createElement('span'); i.className = 'jwi';
            i.textContent = part; w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') wrap(n);
      });
    })(shell);
    return el.querySelectorAll('.jwi');
  }

  $$('h2.h2:not([data-nosplit])').forEach(el => {
    const words = split(el);
    gsap.set(words, { yPercent: 118, rotate: 5, transformOrigin: '0% 100%' });
    gsap.to(words, {
      yPercent: 0, rotate: 0, duration: 1.15, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  /* ── THE CREW: vertical scroll drives the rail sideways ─
     One tween + one pinned ScrollTrigger. Inner reveals ride
     containerAnimation with LEFT-based starts, because viewport
     triggers never fire for content that travels horizontally. */
  const track = $('#crewTrack'), crewPin = $('#crewPin');
  if (track && crewPin && DESKTOP) {
    const travel = () => Math.max(0, track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft));
    const rail = gsap.to(track, { x: () => -travel(), ease: 'none' });
    const cards = $$('.crew__card', track);
    const count = $('#crewCount');

    ScrollTrigger.create({
      animation: rail, trigger: '.crew', pin: crewPin, scrub: 0.7,
      start: 'top top', end: () => '+=' + travel(), invalidateOnRefresh: true,
      onUpdate(self) {
        if (!count) return;
        const i = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1);
        count.textContent = String(i).padStart(2, '0');
      }
    });

    gsap.set(cards, { y: 46, opacity: 0 });
    cards.forEach(c => {
      gsap.to(c, {
        y: 0, opacity: 1, duration: 0.8, ease: EASE,
        scrollTrigger: { trigger: c, containerAnimation: rail, start: 'left 92%', once: true }
      });
    });
  } else if (track) {
    gsap.set($$('.crew__card', track), { opacity: 1, y: 0 });
  }

  /* ── image pours: clip wipe up + settle; big frames drift ─ */
  const PARALLAX = new Set(['bleed', 'visit__shot', 'room__cell--wide']);
  $$('[data-pour]').forEach(fig => {
    const img = $('img', fig);
    if (!img) return;
    const drifts = [...fig.classList].some(c => PARALLAX.has(c));

    // a hard wipe from the bottom with the photo arriving oversized and
    // skewed, settling square. Much bigger travel than a polite fade.
    gsap.set(img, { clipPath: 'inset(100% 0 0 0)', scale: drifts ? 1.34 : 1.28, skewY: 3.5 });
    gsap.to(img, {
      clipPath: 'inset(0% 0 0 0)', scale: drifts ? 1.22 : 1, skewY: 0,
      duration: 1.5, ease: 'expo.out',
      scrollTrigger: { trigger: fig, start: 'top 92%', once: true }
    });
    if (drifts) {
      // constant over-scale keeps the frame covered while the image drifts
      gsap.fromTo(img, { yPercent: -14 * AMP }, {
        yPercent: 14 * AMP, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: 0.4 }
      });
    }
    // and the FRAME itself widens open as it arrives
    gsap.fromTo(fig, { scaleX: 0.86, scaleY: 0.94 }, {
      scaleX: 1, scaleY: 1, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: fig, start: 'top 92%', once: true }
    });
  });

  /* ── archive cards: batched stagger rise ──────────────── */
  gsap.set('.acard', { y: 90, scale: 0.8, rotate: -4, opacity: 0, transformOrigin: '50% 100%' });
  ScrollTrigger.batch('.acard', {
    start: 'top 94%', once: true,
    onEnter: batch => gsap.to(batch, {
      y: 0, scale: 1, rotate: 0, opacity: 1, duration: 1.15, ease: 'expo.out', stagger: 0.075
    })
  });

  /* ── quiet content rises, triggered once ──────────────── */
  const rises = $$('.kicker, .sec-head__note, .lead, .quote, .thesis__gloss, .facts li, .steps li, .card, .rent__alt, .rent__nums li, .workshop__meta, .disclaim, .drinks__tabs, .drinks__stage, .room__note, .crew__note');
  gsap.set(rises, { y: 54, opacity: 0, filter: 'blur(6px)' });
  rises.forEach(el => {
    gsap.to(el, {
      y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.05, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true }
    });
  });
  // failsafe: only what is ALREADY on screen may force-show (never the page)
  setTimeout(() => {
    rises.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && +gsap.getProperty(el, 'opacity') < 1)
        gsap.to(el, { y: 0, opacity: 1, duration: 0.5, ease: EASE });
    });
  }, 1700);

  /* ── each paper sheet lifts into place, dome first ────── */
  $$('.paper').forEach(sec => {
    gsap.fromTo(sec, { yPercent: 6 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 55%', scrub: 0.6 }
    });
  });

  /* ── acid band unrolls over the page ──────────────────── */
  gsap.fromTo('.rent', { clipPath: 'inset(0 0 86% 0)' }, {
    clipPath: 'inset(0 0 0% 0)', ease: 'none',
    scrollTrigger: { trigger: '.rent', start: 'top 88%', end: 'top 32%', scrub: 0.5 }
  });

  /* ── closer breathes in ───────────────────────────────── */
  gsap.fromTo('.closer__logo', { scale: 0.9, opacity: 0.2 }, {
    scale: 1, opacity: 1, ease: 'none',
    scrollTrigger: { trigger: '.closer', start: 'top 92%', end: 'top 38%', scrub: 0.5 }
  });

  /* ── the menu pours itself: each glass fills band by band ─ */
  $$('.dish').forEach(dish => {
    const bands = $$('.gl__band', dish);
    if (!bands.length) return;
    gsap.set(bands, { y: 108 });        // parked below the glass silhouette
    gsap.to(bands, {
      y: 0, duration: 1.05, ease: 'power3.out', stagger: 0.09,
      scrollTrigger: { trigger: dish, start: 'top 88%', once: true }
    });
    // hovering an ingredient dims every other band in that glass
    $$('.dish__spec li', dish).forEach(li => {
      const i = li.dataset.ing;
      li.addEventListener('pointerenter', () => bands.forEach(b => {
        if (b.dataset.band !== i) b.setAttribute('data-dim', '');
      }));
      li.addEventListener('pointerleave', () => bands.forEach(b => b.removeAttribute('data-dim')));
    });
  });

  /* ── ticker leans with scroll velocity ────────────────── */
  const skewTo = gsap.quickTo('#tickSkew', 'skewX', { duration: 0.45, ease: 'power2.out' });
  lenis.on('scroll', e => skewTo(gsap.utils.clamp(-6, 6, e.velocity * 0.32)));

  /* ── settle triggers after fonts + layout are real ────── */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();

/* ═══════════ OPENING SCENE ══════════════════════════════
   The viewport is an empty glass. A live wobbling liquid surface
   rises behind their wordmark while a counter runs to 100, then
   the whole level drains away through an arch. Runs once per
   session, is skippable, and never blocks: if anything at all
   goes wrong the gate removes itself on a hard timeout.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const gate = $('#gate');
  if (!gate) return;

  const seen = (() => { try { return sessionStorage.getItem('jg-gate') === '1'; } catch { return false; } })();
  const kill = () => {
    gate.remove();
    document.body.classList.remove('gate-on');
    if (window.__lenis) window.__lenis.start();
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    // refresh first, THEN release the entrance, so the scrub records the
    // hero's true resting values and never a mid-entrance frame
    if (window.__heroIntro) window.__heroIntro.play(0);
  };

  if (seen || REDUCED || typeof gsap === 'undefined') { kill(); return; }

  document.body.classList.add('gate-on');
  try { sessionStorage.setItem('jg-gate', '1'); } catch {}

  const wave  = $('#gateWave');
  const count = $('#gateCount');
  const line  = $('#gateLine');
  const state = { level: 0, phase: 0 };
  let done = false;

  // one path rebuilt per frame: two crests riding on a rising level
  function draw() {
    const y = 1000 - state.level * 1000;
    const a = 26 * (1 - state.level * 0.55);      // crest calms as the glass fills
    const p = state.phase;
    const c = (i) => (y + Math.sin(p + i) * a).toFixed(1);
    wave.setAttribute('d',
      `M0,${c(0)} C200,${c(1.1)} 400,${c(2.3)} 600,${c(3.1)} S1000,${c(4.4)} 1200,${c(5.2)} L1200,1000 L0,1000 Z`);
  }
  const ticker = () => { state.phase += 0.055; draw(); };
  gsap.ticker.add(ticker);

  const tl = gsap.timeline({
    onComplete: () => { if (!done) { done = true; gsap.ticker.remove(ticker); kill(); } }
  });
  tl.to(state, {
      level: 1, duration: 2.5, ease: 'power1.inOut',
      onUpdate: () => { count.textContent = String(Math.round(state.level * 100)).padStart(2, '0'); }
    })
    .to(line, { opacity: 0, duration: 0.3, ease: 'none' }, '-=0.5')
    .set(line, { textContent: 'STIRRED' })
    .to(line, { opacity: 1, duration: 0.35, ease: 'none' })
    // the level drains away through an arch, taking the scene with it
    .to(gate, {
      clipPath: 'inset(0% 0 100% 0)', duration: 1.0, ease: 'expo.inOut'
    }, '+=0.1')
    .to(['.gate__logo', '.gate__count', '#gateSkip', '.gate__line'],
      { opacity: 0, duration: 0.4, ease: 'none' }, '<');

  $('#gateSkip')?.addEventListener('click', () => {
    if (done) return;
    done = true; tl.kill(); gsap.ticker.remove(ticker); kill();
  });

  // hard failsafe: the gate can never trap anyone
  setTimeout(() => { if (!done) { done = true; try { tl.kill(); gsap.ticker.remove(ticker); } catch {} kill(); } }, 7000);
})();

/* ═══════════ SMOOTH IN-PAGE LINKS ═══════════════════════ */
$$('a[href^="#"]').forEach(a => {
  if (a.closest('#menu')) return;   // the overlay handles its own
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    if (window.__lenis) window.__lenis.scrollTo(t, { duration: 1.25 });
    else t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  });
});
