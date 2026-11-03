document.querySelectorAll('[data-toggle]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    document.getElementById(trigger.dataset.toggle)?.classList.toggle('is-open');
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.popup.is-open').forEach((p) => p.classList.remove('is-open'));
});

document.querySelector('.contact').addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
});

const marqueeTrack = document.querySelector('.marquee__track');
const flushMarquee = () => {
  const span = marqueeTrack.querySelector('span');
  const cs = getComputedStyle(span);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = cs.font;
  const m = ctx.measureText(span.textContent);
  const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize);
  const baseline = (lineHeight - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
  marqueeTrack.style.marginTop = -(baseline - m.actualBoundingBoxAscent) + 'px';
};
flushMarquee();
Stage.onChange(flushMarquee);
if (document.fonts) document.fonts.ready.then(flushMarquee);
