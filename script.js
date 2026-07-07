// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const nav = document.getElementById('site-nav');
navToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});
nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

// Gallery — populated from whatever image files currently exist in images/,
// via the GitHub API, so adding/removing photos there needs no other edits.
(() => {
  const API_URL = 'https://api.github.com/repos/theDoodleGuy/made-possible/contents/images';
  const CACHE_KEY = 'mp-gallery-v1';
  const CACHE_TTL_MS = 60 * 60 * 1000;
  const IMG_RE = /\.(jpe?g|png|webp|gif)$/i;
  const gallery = document.getElementById('gallery');
  const emptyNote = document.getElementById('gallery-empty');

  function humanize(filename) {
    const base = filename.replace(/\.[a-zA-Z0-9]+$/, '');
    const spaced = base.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  function render(names) {
    gallery.textContent = '';
    if (!names.length) {
      emptyNote.hidden = false;
      return;
    }
    emptyNote.hidden = true;
    names.forEach((name) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      const img = document.createElement('img');
      img.src = `images/${name}`;
      img.alt = `${humanize(name)} — 3D-printed by Made Possible`;
      img.loading = 'lazy';
      img.decoding = 'async';
      item.appendChild(img);
      gallery.appendChild(item);
    });
  }

  let cached = null;
  const cachedRaw = localStorage.getItem(CACHE_KEY);
  if (cachedRaw) {
    try { cached = JSON.parse(cachedRaw); } catch (e) { cached = null; }
  }
  if (cached && Array.isArray(cached.names)) {
    render(cached.names);
  }
  if (cached && (Date.now() - cached.time) < CACHE_TTL_MS) {
    return; // cache still fresh, skip the network call
  }

  fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' } })
    .then((r) => {
      if (!r.ok) throw new Error('gallery list failed');
      return r.json();
    })
    .then((data) => {
      const names = data
        .filter((f) => f.type === 'file' && IMG_RE.test(f.name))
        .map((f) => f.name)
        .sort((a, b) => a.localeCompare(b));
      localStorage.setItem(CACHE_KEY, JSON.stringify({ names, time: Date.now() }));
      render(names);
    })
    .catch(() => {
      if (!cached) render([]);
    });
})();

// Scroll reveal
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('.reveal');
if (prefersReduced || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => observer.observe(el));
}

// Contact form — submits to Formspree via fetch so the page never navigates away
const form = document.getElementById('contact-form');
const note = document.getElementById('form-note');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { Accept: 'application/json' },
  }).then((response) => {
    if (response.ok) {
      note.textContent = 'Thanks for writing — your message is on its way.';
      form.reset();
      return undefined;
    }
    return response.json().then((data) => {
      const detail = (data && data.errors) ? data.errors.map((err) => err.message).join(', ') : '';
      note.textContent = `Something went wrong sending that${detail ? ` (${detail})` : ''} — please try again, or catch us at a local market.`;
    });
  }).catch(() => {
    note.textContent = 'Something went wrong sending that — please try again, or catch us at a local market.';
  }).finally(() => {
    submitBtn.disabled = false;
    note.hidden = false;
    note.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'nearest' });
  });
});
