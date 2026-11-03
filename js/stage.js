const Stage = (() => {
  const PHONE_QUERY = window.matchMedia('(max-width: 599px)');
  const DESIGN_WIDTH = { desktop: 1024, phone: 320 };
  const PHONE_ZOOM = 0.9;
  const listeners = [];
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px)';
  document.documentElement.appendChild(probe);
  let scale = 1;
  let lastWidth = -1;
  let viewHeight = window.innerHeight;

  const TABLET_QUERY = window.matchMedia('(min-width: 600px) and (max-width: 1023px)');
  const TOUCH_QUERY = window.matchMedia('(pointer: coarse)');
  const isPhone = () => PHONE_QUERY.matches;
  const isTablet = () => TABLET_QUERY.matches;

  function update() {
    const width = document.documentElement.clientWidth;
    lastWidth = width;
    viewHeight = window.innerHeight;
    scale = isPhone() ? width / DESIGN_WIDTH.phone * PHONE_ZOOM : width / DESIGN_WIDTH.desktop;
    document.body.style.zoom = scale;
    document.body.style.setProperty('--vw', width / scale + 'px');
    document.body.style.setProperty('--x0', '0px');
    document.body.style.setProperty('--sat', (parseFloat(getComputedStyle(probe).paddingTop) || 0) / scale + 'px');

    document.body.style.setProperty('--vh', viewHeight / scale + 'px');
    listeners.forEach((fn) => fn());
  }

  // On phones/tablets the browser bar shows and hides while scrolling, which fires
  // "resize" with only the height changing. Re-zooming and rebuilding every animation
  // mid-scroll is what made scrolling stutter, so only react when the width changes
  // (rotation, real window resize). Desktop resizes are debounced.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    if (TOUCH_QUERY.matches && document.documentElement.clientWidth === lastWidth) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 120);
  });
  update();

  return {
    isPhone,
    isTablet,
    get scale() { return scale; },

    scrollTop: () => window.scrollY / scale,

    viewportHeight: () => viewHeight / scale,

    onChange: (fn) => listeners.push(fn),
  };
})();
