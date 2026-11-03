const LOCATION = { lat: 38.0171, lon: 12.5074, timeZone: 'Europe/Rome' };

const Wind = (() => {
  const subscribers = [];
  let current = null;

  async function fetchWeather() {
    try {
      const url = 'https://api.open-meteo.com/v1/forecast'
        + `?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}`
        + '&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m'
        + '&wind_speed_unit=ms&timezone=auto';
      const data = (await (await fetch(url)).json()).current;
      current = {
        temperature: data.temperature_2m,
        speed: data.wind_speed_10m,
        gusts: data.wind_gusts_10m,
        direction: data.wind_direction_10m,
      };
      subscribers.forEach((fn) => fn(current));
    } catch (_) {  }
  }

  fetchWeather();
  setInterval(fetchWeather, 5 * 60 * 1000);

  return { subscribe(fn) { subscribers.push(fn); if (current) fn(current); } };
})();

const WORDMARK_SETTINGS = {

  header: { flush: true, speedMin: 0.5, speedMax: 3, ampMin: 5,  ampMax: 30 },
  footer: { speedMin: 1,   speedMax: 2, ampMin: 10, ampMax: 20 },
};

function initWordmark(stage, settings) {
  const LETTERS = 'tramontana'.split('');
  const EXTRA_SPACES = [0, 0, 0, 0, 0, 1, 2, 3, 4, 5];
  const FREQ = 0.6;
  const WIND_MAX = 100 / 3.6;
  const map = (v, min, max) => min + (Math.max(0, Math.min(WIND_MAX, v)) / WIND_MAX) * (max - min);

  let speed = settings.speedMin, amp = settings.ampMin, t = 0;
  Wind.subscribe((w) => {
    speed = map(w.speed, settings.speedMin, settings.speedMax);
    amp = map(w.gusts, settings.ampMin, settings.ampMax);
  });

  const flushCache = {};
  function flushTop(fontSize) {
    const key = fontSize + '|' + document.fonts.status;
    if (flushCache.key === key) return flushCache.top;
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `400 ${fontSize}px ${getComputedStyle(stage).getPropertyValue('--sans') || 'sans-serif'}`;
    const m = ctx.measureText(LETTERS.join(''));
    const baseline = (fontSize - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
    flushCache.key = key;
    flushCache.top = m.actualBoundingBoxAscent - baseline;
    return flushCache.top;
  }

  const word = document.createElement('div');
  word.className = 'wordmark__word';
  Object.assign(word.style, { position: 'absolute', display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap' });
  const spans = LETTERS.map((ch) => {
    const s = document.createElement('span');
    s.textContent = ch;
    Object.assign(s.style, { display: 'inline-block', font: '400 1em var(--sans)', lineHeight: '1', letterSpacing: '0.1em' });
    word.appendChild(s);
    return s;
  });
  stage.appendChild(word);

  function draw() {
    const width = parseFloat(getComputedStyle(stage).width);
    const height = parseFloat(getComputedStyle(stage).height);
    const fontSize = Math.min(width / 18, 72);
    const n = LETTERS.length;
    word.style.fontSize = fontSize + 'px';
    spans.forEach((s, i) => {
      if (i === 0) return;
      const phase = ((i - 1) / (n - 1)) * Math.PI * 2 * FREQ;
      const wave = (i / (n - 1)) * amp * ((1 + Math.sin(t + phase)) / 2);
      s.style.marginLeft = wave + EXTRA_SPACES[i] * fontSize * 0.25 + 'px';
    });
    word.style.left = width * 0.1 + 'px';
    word.style.top = (settings.flush ? flushTop(fontSize) : height - fontSize) + 'px';
    t += speed * 0.03;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

function initCities(container) {
  const WORDS = ['Berlin', 'Milano', 'Trapani'];
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const ANIM_DURATION = 2000;
  const SWAP_INTERVAL = 4000;
  const rndChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

  let slots = [0, 1, 2];
  const words = slots.map((wi) => {
    const span = document.createElement('span');
    span.className = 'word';
    for (const ch of WORDS[wi]) span.appendChild(letter(ch));
    container.appendChild(span);
    return span;
  });

  function letter(ch) {
    const l = document.createElement('span');
    l.className = 'letter';
    l.textContent = ch;
    return l;
  }

  function scrambleLetter(el, target, duration) {
    return new Promise((resolve) => {
      const steps = 18;
      let step = 0;
      const iv = setInterval(() => {
        step++;
        if (step >= steps) { clearInterval(iv); el.textContent = target; resolve(); }
        else el.textContent = Math.random() > step / steps ? rndChar() : target;
      }, duration / steps);
    });
  }

  function changeWord(span, from, to) {
    while (span.children.length < to.length) span.appendChild(letter(rndChar()));
    while (span.children.length > to.length) span.lastChild.remove();
    const letters = [...span.children];

    let diff = [...to].map((c, i) => (from[i] !== c ? i : -1)).filter((i) => i >= 0);
    if (diff.length > 2) diff = diff.sort(() => Math.random() - 0.5).slice(0, 2);
    letters.forEach((l, i) => { if (!diff.includes(i)) l.textContent = to[i]; });
    return Promise.all(diff.map((pos, idx) => new Promise((res) =>
      setTimeout(() => scrambleLetter(letters[pos], to[pos], ANIM_DURATION - idx * 120).then(res), idx * 120))));
  }

  let busy = false;
  setInterval(async () => {
    if (busy) return;
    busy = true;
    let next;
    do next = [...slots].sort(() => Math.random() - 0.5);
    while (next.every((v, i) => v === slots[i]));
    await Promise.all(next.map((wi, i) => (wi !== slots[i] ? changeWord(words[i], WORDS[slots[i]], WORDS[wi]) : null)));
    slots = next;
    busy = false;
  }, SWAP_INTERVAL);
}

function initWeather(el) {
  el.innerHTML = `
    <span>38.0171° N, 12.5074° E</span>
    <span data-time>--:-- CET</span>
    <span data-temp>--°C</span>
    <span class="weather__wind">
      <svg class="weather__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round">
        <line x1="8" y1="14" x2="8" y2="2"/><line x1="8" y1="2" x2="4" y2="6"/><line x1="8" y1="2" x2="12" y2="6"/>
      </svg>
      <span data-wind>– -- KM/H</span>
    </span>`;

  const time = el.querySelector('[data-time]');
  const clock = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: LOCATION.timeZone });
  const tick = () => { time.textContent = clock.format(new Date()) + ' CET'; };
  tick();
  setInterval(tick, 1000);

  Wind.subscribe((w) => {
    el.querySelector('[data-temp]').textContent = Math.round(w.temperature) + '°C';
    el.querySelector('[data-wind]').textContent = Math.round(w.speed * 3.6) + 'KM/H';

    el.querySelector('.weather__arrow').style.transform = `rotate(${w.direction + 180}deg)`;
  });
}

document.querySelectorAll('[data-wordmark]').forEach((el) => initWordmark(el, WORDMARK_SETTINGS[el.dataset.wordmark]));
document.querySelectorAll('[data-cities]').forEach(initCities);
document.querySelectorAll('[data-weather]').forEach(initWeather);
