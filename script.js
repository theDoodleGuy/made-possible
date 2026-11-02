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

// Events — hide any event whose date has passed (it stays up all day on the day itself).
(() => {
  const list = document.getElementById('events-list');
  const emptyNote = document.getElementById('events-empty');
  if (!list) return;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let shown = 0;
  list.querySelectorAll('.event').forEach((ev) => {
    if (ev.dataset.date < today) ev.remove();
    else shown += 1;
  });
  if (!shown) {
    list.hidden = true;
    emptyNote.hidden = false;
  }
})();

// Journal — posts pulled from Facebook into journal/posts.json by a scheduled GitHub Action.
// The section and its nav link stay hidden until at least one post exists.
(() => {
  const section = document.getElementById('journal');
  const list = document.getElementById('journal-list');
  const navItem = document.getElementById('nav-journal');
  if (!section || !list) return;
  const SHOW = 6;
  const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  fetch('journal/posts.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : []))
    .then((posts) => {
      if (!Array.isArray(posts) || !posts.length) return;
      posts.slice(0, SHOW).forEach((p) => {
        const card = document.createElement('article');
        card.className = 'journal-post';
        if (p.image) {
          const img = document.createElement('img');
          img.src = p.image;
          img.alt = 'Photo from a Made Possible Facebook post';
          img.loading = 'lazy';
          img.decoding = 'async';
          card.appendChild(img);
        }
        const body = document.createElement('div');
        body.className = 'journal-body';
        const date = document.createElement('time');
        date.className = 'journal-date';
        date.dateTime = p.date;
        date.textContent = fmt.format(new Date(p.date));
        const text = document.createElement('p');
        text.className = 'journal-text';
        text.textContent = p.text; // textContent, never innerHTML — post text is plain text
        body.append(date, text);
        if (p.link) {
          const a = document.createElement('a');
          a.className = 'journal-link';
          a.href = p.link;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = 'Read on Facebook →';
          body.appendChild(a);
        }
        card.appendChild(body);
        list.appendChild(card);
      });
      section.hidden = false;
      if (navItem) navItem.hidden = false;
      section.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    })
    .catch(() => {});
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
