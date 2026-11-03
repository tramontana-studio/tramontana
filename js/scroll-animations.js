const FADE_DISTANCE = 230;

const START_OFFSCREEN = '.card';

const ANIMATIONS = {
  desktop: {
    '.hero-text': [
      { delay: 320, fromOpacity: 0, opacity: 1 },
      { delay: 2300, speed: 0.7, ease: 'inOut', opacity: 0 },
    ],
    '.hero-reel': [
      { delay: 600, ease: 'inOut', fromOpacity: 0, opacity: 1 },
      { delay: 400, opacity: 0 },
    ],
    '.card--pink': [
      { delay: 1500, ease: 'inOut', y: -473 },
      { delay: 447, ease: 'inOut', y: -980 },
      { ease: 'inOut', opacity: 0 },
    ],
    '.card--yellow': [
      { delay: 1800, ease: 'inOut', y: -437 },
      { delay: 343, ease: 'inOut', y: -980 },
      { ease: 'inOut', opacity: 0 },
    ],
    '.card--blue': [
      { delay: 2000, ease: 'inOut', y: -401 },
      { delay: 339, ease: 'inOut', y: -980 },
    ],

    '.wordmark--header, .coords, .contact': [
      { delay: 3600, speed: 0.5, ease: 'inOut', fromOpacity: 1, opacity: 0 },
    ],

    '.header-fade': [
      { delay: 330, speed: 2, ease: 'inOut', fromOpacity: 0, opacity: 1 },
      { delay: 3155, speed: 0.5, ease: 'inOut', opacity: 0 },
    ],
    '.sun': {
      start: 'bottom',
      steps: [{ ease: 'inOut', x: 866, y: 377, curve: [[272, 3], [554, 5]] }],
    },
  },

  tablet: {
    '.card--pink': [
      { delay: 1500, ease: 'inOut', y: -510 },
      { delay: 447, ease: 'inOut', y: -980 },
      { ease: 'inOut', opacity: 0 },
    ],
    '.card--yellow': [
      { delay: 1800, ease: 'inOut', y: -474 },
      { delay: 343, ease: 'inOut', y: -980 },
      { ease: 'inOut', opacity: 0 },
    ],
    '.card--blue': [
      { delay: 2000, ease: 'inOut', y: -438 },
      { delay: 339, ease: 'inOut', y: -980 },
      { ease: 'inOut', opacity: 0 },
    ],
  },

  phone: {
    '.hero-text': [
      { delay: 300, fromOpacity: 0, opacity: 1 },
      { delay: 2200, ease: 'inOut', opacity: 0 },
    ],
    '.card--pink': [
      { delay: 1600, ease: 'inOut', y: -460 },
      { delay: 450, ease: 'inOut', y: -1000 },
      { ease: 'inOut', opacity: 0 },
    ],
    '.card--yellow': [
      { delay: 1800, ease: 'inOut', y: -460 },
      { delay: 410, ease: 'inOut', y: -1000 },
      { ease: 'inOut', opacity: 0 },
    ],
    '.card--blue': [
      { delay: 2050, ease: 'inOut', y: -460 },
      { delay: 320, ease: 'inOut', y: -1000 },
      { ease: 'inOut', opacity: 0 },
    ],
    '.sun': {
      start: 'center',
      steps: [{ ease: 'inOut', x: 304, y: 240, curve: [[152, 61], [184, 60]] }],
    },
  },
};

(() => {
  const EASINGS = { linear: (t) => t, inOut: cubicBezier(0.42, 0, 0.58, 1) };
  let timelines = [];

  function cubicBezier(x1, y1, x2, y2) {
    const bez = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    return (x) => {
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 20; i++) {
        t = (lo + hi) / 2;
        if (bez(t, x1, x2) < x) lo = t; else hi = t;
      }
      return bez(t, y1, y2);
    };
  }

  function makePath(from, to, curve) {
    if (!curve) {
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      return { length, at: (p) => ({ x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p }) };
    }
    const [c1, c2] = curve.map(([x, y]) => ({ x: from.x + x, y: from.y + y }));
    const point = (t) => {
      const u = 1 - t;
      return {
        x: u ** 3 * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * to.x,
        y: u ** 3 * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * to.y,
      };
    };
    const samples = [{ ...point(0), d: 0 }];
    for (let i = 1; i <= 100; i++) {
      const p = point(i / 100), prev = samples[i - 1];
      samples.push({ ...p, d: prev.d + Math.hypot(p.x - prev.x, p.y - prev.y) });
    }
    const length = samples[100].d;
    return {
      length,
      at(progress) {
        const d = progress * length;
        let i = 1;
        while (i < 100 && samples[i].d < d) i++;
        const a = samples[i - 1], b = samples[i];
        const f = b.d === a.d ? 0 : (d - a.d) / (b.d - a.d);
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      },
    };
  }

  function startPoint(el, mode) {
    const cs = getComputedStyle(el);
    if (!mode) mode = cs.position === 'fixed' || el.closest('.cards') ? 'top' : 'bottom';
    if (mode === 'top') return 0;
    const top = (parseFloat(cs.top) || 0) + (parseFloat(cs.marginTop) || 0);
    const vh = Stage.viewportHeight();
    if (mode === 'center') return top + (parseFloat(cs.height) || 0) / 2 - vh / 2;
    return top - vh;
  }

  function offscreenShift(el) {
    const top = parseFloat(getComputedStyle(el).top) || 0;
    return Math.max(0, Stage.viewportHeight() - top + 20);
  }

  function exitShift(el) {
    const cs = getComputedStyle(el);
    return -((parseFloat(cs.top) || 0) + (parseFloat(cs.height) || 0) + 20);
  }

  function buildTimeline(el, def) {
    const steps = Array.isArray(def) ? def : def.steps;
    const offscreen = el.matches(START_OFFSCREEN);
    const lastMove = steps.map((s) => s.y !== undefined).lastIndexOf(true);
    let cursor = startPoint(el, def.start);
    const origin = { x: 0, y: 0, opacity: steps[0].fromOpacity ?? 1 };
    let state = { ...origin, y: offscreen ? offscreenShift(el) : 0 };
    let plain = origin;
    const segments = steps.map((step, i) => {
      const plainTo = { x: step.x ?? plain.x, y: step.y ?? plain.y };
      let y = step.y ?? state.y;
      if (offscreen && i === lastMove) y = exitShift(el);
      const to = { x: step.x ?? state.x, y, opacity: step.opacity ?? state.opacity };
      const path = makePath(state, to, step.curve);
      const start = cursor + (step.delay || 0);

      const distance = makePath(plain, plainTo, step.curve).length;
      plain = plainTo;
      const duration = (distance > 0 ? distance : FADE_DISTANCE) / (step.speed || 1);
      const seg = { start, duration, from: state, to, path, ease: EASINGS[step.ease || 'linear'] };
      cursor = start + duration;
      state = to;
      return seg;
    });
    return { el, segments, offscreen };
  }

  function render(timeline, scroll) {
    const { el, segments } = timeline;
    let value = segments[0].from;
    for (const seg of segments) {
      if (scroll < seg.start) break;
      const p = seg.ease(Math.min(1, (scroll - seg.start) / seg.duration));
      const pos = seg.path.at(p);
      value = { ...pos, opacity: seg.from.opacity + (seg.to.opacity - seg.from.opacity) * p };
    }

    if (timeline.offscreen && scroll < segments[0].start) value = { ...value, opacity: 0 };
    el.style.transform = value.x || value.y ? `translate(${value.x}px, ${value.y}px)` : '';
    el.style.opacity = value.opacity;
    el.style.pointerEvents = value.opacity < 0.05 ? 'none' : '';
    el.style.visibility = value.opacity < 0.01 ? 'hidden' : '';
  }

  function tabletShift() {
    const blue = timelines.find((t) => t.el.matches('.card--blue'));
    const photo = document.querySelector('.team-photo');
    if (!blue || !photo) return 0;
    const last = blue.segments[blue.segments.length - 1];
    const cardsEnd = last.start + last.duration;
    const photoTop = parseFloat(getComputedStyle(photo).top) || 0;
    return Math.max(0, Math.round(cardsEnd - (photoTop - Stage.viewportHeight())));
  }

  function build() {
    timelines.forEach(({ el }) => { el.style.transform = el.style.opacity = el.style.pointerEvents = el.style.visibility = ''; });
    const config = Stage.isPhone() ? { ...ANIMATIONS.desktop, ...ANIMATIONS.phone }
      : Stage.isTablet() ? { ...ANIMATIONS.desktop, ...ANIMATIONS.tablet } : ANIMATIONS.desktop;
    const make = () => Object.entries(config).flatMap(([selector, def]) =>
      [...document.querySelectorAll(selector)].map((el) => buildTimeline(el, def)));
    timelines = make();
    const shift = Stage.isTablet() ? tabletShift() : 0;
    if (document.body.style.getPropertyValue('--ts') !== shift + 'px') {
      document.body.style.setProperty('--ts', shift + 'px');
      timelines = make();
    }
    update();
  }

  function update() {
    const scroll = Stage.scrollTop();
    timelines.forEach((t) => render(t, scroll));
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });

  Stage.onChange(build);
  build();
})();
