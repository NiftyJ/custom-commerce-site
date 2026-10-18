// Nearbook single-page app: hash router + views. No framework, no build step.

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = (n) => String(n).padStart(2, '0');
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

let CONFIG = { brand: 'Nearbook', currency: 'USD', categories: [], areas: [] };

// ---------- utilities ----------

const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status });
  return data;
}

const amount = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: CONFIG.currency, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const money = (n) => (n === 0 ? 'Free' : amount(n));
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDate = (iso, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => parseDate(iso).toLocaleDateString(undefined, opts);
function fmtTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function fmtDuration(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return [h && `${h} hr`, m && `${m} min`].filter(Boolean).join(' ');
}
const catName = (id) => (CONFIG.categories.find((c) => c.id === id) || {}).name || '';
const initials = (name) => name.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const avatar = (p, size = '') => `<div class="avatar ${size}" style="--c:${esc(p.color)}">${esc(initials(p.name))}</div>`;
const stars = (rating) => `<span class="stars" style="--r:${((rating || 0) / 5) * 100}%" aria-label="${rating || 0} out of 5">★★★★★</span>`;
const shareUrl = (slug) => `${location.origin}/p/${slug}`;

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 2800);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copied'); }
  catch { window.prompt('Copy this link:', text); }
}

const ICONS = {
  'hair-beauty': '<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  barbering: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
  'spa-wellness': '<path d="M12 21c-4.4-1.6-8-5.4-8-10 3.4 0 6.2 1.6 8 4.2 1.8-2.6 4.6-4.2 8-4.2 0 4.6-3.6 8.4-8 10z"/><path d="M12 15.2C10.2 11.8 10.6 6.6 12 3c1.4 3.6 1.8 8.8 0 12.2"/>',
  'local-services': '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.8-3.8a6 6 0 01-7.9 7.9l-6.9 6.9a2.1 2.1 0 01-3-3l6.9-6.9a6 6 0 017.9-7.9l-3.8 3.8z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  pin: '<path d="M12 21s-7-6.1-7-11.5A7 7 0 0119 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
};
const icon = (name, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

function providerCard(p) {
  return `<a class="card pcard" href="#/p/${esc(p.slug)}">
    <div class="pcard-cover" style="--c:${esc(p.color)}">${avatar(p, 'lg')}<span class="chip">${esc(catName(p.category))}</span></div>
    <div class="pcard-body">
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.tagline)}</p>
      <div class="meta">
        ${p.rating ? `${stars(p.rating)} <b>${p.rating.toFixed(1)}</b> <span class="muted">(${p.reviewCount})</span>` : '<span class="chip">New</span>'}
        <span class="sep">•</span> ${esc(p.area)}
      </div>
      <div class="pcard-foot">
        ${p.homeVisit ? `<span class="tag">${icon('home', 14)} Home visits</span>` : '<span></span>'}
        <span class="from">${p.priceFrom === 0 ? '<b>Free</b> consult' : `From <b>${money(p.priceFrom)}</b>`}</span>
      </div>
    </div>
  </a>`;
}

function nextDays(n) {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    return {
      iso: isoDate(d),
      key: DAYS[d.getDay()],
      dow: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
      dom: d.getDate(),
      mon: d.toLocaleDateString(undefined, { month: 'short' }),
    };
  });
}

function luhn(num) {
  let sum = 0;
  for (let i = 0; i < num.length; i++) {
    let d = Number(num[num.length - 1 - i]);
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return num.length >= 12 && sum % 10 === 0;
}
function cardBrand(num) {
  if (/^4/.test(num)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(num)) return 'Mastercard';
  if (/^3[47]/.test(num)) return 'Amex';
  if (/^(6011|65)/.test(num)) return 'Discover';
  return 'Card';
}

function downloadIcs(b) {
  const start = parseDate(b.date);
  const [h, m] = b.time.split(':').map(Number);
  start.setHours(h, m);
  const end = new Date(start.getTime() + b.duration * 60000);
  const f = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const where = b.location === 'home' ? b.address : (b.provider && b.provider.address) || '';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${CONFIG.brand}//Booking//EN`, 'BEGIN:VEVENT',
    `UID:${b.id}@${location.host}`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${b.serviceName} — ${b.provider ? b.provider.name : ''}`,
    `LOCATION:${where.replace(/[,;]/g, '\\$&')}`, `DESCRIPTION:Booking ref ${b.ref}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `booking-${b.ref}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const errorBox = (msg) => `<div class="form-error" role="alert">${esc(msg)}</div>`;

// ---------- views ----------

async function homeView() {
  const { providers } = await api('/providers?sort=rating&limit=8');
  const popular = ['Knotless braids', 'Skin fade', 'Gel manicure', 'Massage', 'Lashes', 'Deep clean', 'Plumber'];
  const totalProviders = CONFIG.categories.reduce((s, c) => s + (c.count || 0), 0);
  const tints = ['#ffe2cf', '#e4ecdc', '#f4e1ee', '#e2eaf3'];
  const inks = ['#c2410c', '#4d7c3a', '#9d3a7a', '#2f5f8f'];
  const faqs = [
    ['Do I have to pay when I book?', 'No. Most providers let you choose: pay securely by card when you book, or pay them at the appointment in cash or by transfer.'],
    ['Can I cancel or move a booking?', 'Yes. Cancelling is free until your appointment starts, and card payments are refunded automatically. Open My bookings, cancel, then pick a new time.'],
    ['Can someone come to my home?', 'Many providers offer home visits. Tick "Comes to me" in search and choose Home visit at checkout. Then add your address.'],
    ['Are the reviews real?', `Only customers who booked through ${esc(CONFIG.brand)} can leave a review, and only after their appointment. Look for the "Booked on ${esc(CONFIG.brand)}" label.`],
    ['Do I need an account?', 'No. Your confirmation and bookings are linked to the email you book with. Enter it in My bookings to see your appointments.'],
    ['I run a business. What does it cost to list?', 'Creating your booking page is free. Add your services, prices and hours, and you\'ll get a link you can share right away.'],
  ];
  const lead = providers[0];
  const leadSvc = lead && lead.priceFrom ? money(lead.priceFrom) : money(35);
  const week = nextDays(5);

  return {
    html: `
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <span class="chip">${icon('pin', 14)} Local providers, booked in seconds</span>
          <h1>Book <em>local</em> pros without the back&#8209;and&#8209;forth.</h1>
          <p class="lead">Hair, nails, barbers, massage, cleaners, plumbers and more. See real prices and open times, pick a slot and pay your way. Many of these providers don't have a website of their own.</p>
          <form class="searchbar" id="heroSearch">
            <div class="field">${icon('search')}<input name="q" placeholder="What do you need? e.g. braids, fade" aria-label="Service"></div>
            <div class="field">${icon('pin')}<select name="area" aria-label="Area"><option value="">Any area</option>${CONFIG.areas.map((a) => `<option>${esc(a)}</option>`).join('')}</select></div>
            <button class="btn">Search</button>
          </form>
          <div class="popular"><span class="muted small">Popular:</span>${popular.map((t) => `<a href="#/search?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="hero-block"></div>
          <figure class="hero-photo"><img src="/img/hero-braids.jpg" alt="" width="1200" height="1600" fetchpriority="high"></figure>
          <figure class="hero-inset"><img src="/img/hero-lashes.jpg" alt="" loading="lazy"></figure>
          <div class="slot-card">
            <div class="ph-prov">${lead ? avatar(lead) : '<div class="avatar">NB</div>'}<div><b>${esc(lead ? lead.name : 'Your local studio')}</b><div class="muted small">${lead && lead.rating ? `★ ${lead.rating.toFixed(1)} · ` : ''}${esc(lead ? lead.area : 'Nearby')}</div></div></div>
            <div class="ph-days">${week.map((d, i) => `<span class="${i === 1 ? 'on' : ''}"><small>${esc(d.dow.slice(0, 3))}</small><b>${d.dom}</b></span>`).join('')}</div>
            <div class="ph-slots">${['09:30', '11:30', '14:00'].map((t, i) => `<span class="${i === 1 ? 'on' : ''}">${fmtTime(t)}</span>`).join('')}</div>
            <div class="ph-btn">Book · ${leadSvc}</div>
          </div>
          <div class="hero-toast">${icon('check', 18)}<div><b>You're booked!</b><span>Added to your calendar</span></div></div>
        </div>
      </div>
    </section>

    <section class="block wrap">
      <div class="block-head center">
        <h2>Everything local, in one place</h2>
        <p>Everything you'd normally book by phone or DM, with prices up front.</p>
      </div>
      <div class="cat-grid">
        ${CONFIG.categories.map((c, i) => `
          <a class="cat-card" href="#/search?category=${c.id}" style="--tint:${tints[i % tints.length]};--ink-c:${inks[i % inks.length]}">
            <div class="cat-art">
              <img src="/img/cat-${esc(c.id)}.jpg" alt="" loading="lazy" onerror="this.remove()">
              <span class="cat-sticker">${icon(c.id, 22)}<b>${c.count}</b> provider${c.count === 1 ? '' : 's'}</span>
            </div>
            <h3>${esc(c.name)}</h3>
            <p>${esc(c.description)}</p>
            <span class="more">See providers <span aria-hidden="true">→</span></span>
          </a>`).join('')}
      </div>
    </section>

    <section class="block wrap">
      <div class="section-head"><div><h2>Top-rated near you</h2><p class="muted">Highly reviewed by customers who booked through ${esc(CONFIG.brand)}.</p></div><a href="#/search" class="btn btn-outline btn-sm">See all providers</a></div>
      <div class="grid top-grid">${providers.map(providerCard).join('')}</div>
    </section>

    <section class="block wrap split">
      <div>
        <span class="pill">${icon('clock', 18)}</span>
        <h2 class="display">How it works</h2>
        <p class="lead-sm">No calls, no waiting for a reply to your DM. Here's how you get from "I need a trim" to booked.</p>
        <ol class="numbered">
          <li><span>1</span><div><b>Discover.</b> Search by service and area, compare prices and read verified reviews.</div></li>
          <li><span>2</span><div><b>Book a real slot.</b> Live availability means the time you pick is actually free.</div></li>
          <li><span>3</span><div><b>Pay your way.</b> Pay by card when you book, or pay the provider on the day.</div></li>
          <li><span>4</span><div><b>Review.</b> After your appointment, help others find great local pros.</div></li>
        </ol>
      </div>
      <div class="process-art" aria-hidden="true">
        <img src="/img/process-nails.jpg" alt="" loading="lazy">
        <div class="ticket">
          <div class="ticket-top"><span class="confirm-dot">${icon('check', 22)}</span><div><b>Booking confirmed</b><div class="muted small">Ref <span class="ref">NB-7K2Q</span></div></div></div>
          <div class="summary-line"><span>Service</span><b>Gel manicure</b></div>
          <div class="summary-line"><span>When</span><span>${fmtDate(week[2].iso)} · ${fmtTime('11:30')}</span></div>
          <div class="summary-line"><span>Where</span><span>Home visit</span></div>
          <div class="summary-line"><span>Payment</span><span class="badge due">pay on day</span></div>
        </div>
        <div class="ticket ticket-back"><b>How was your gel manicure?</b><div class="stars" style="--r:80%;font-size:1.4rem;margin:8px 0;display:block">★★★★★</div><span class="muted small">Your review helps neighbours choose.</span></div>
      </div>
    </section>

    <section class="wrap">
      <div class="band">
        <img src="/img/banner-barbershop.jpg" alt="" loading="lazy">
        <h2>Your neighbourhood, open for booking.</h2>
        <div class="band-stats">
          <div><b>${totalProviders}</b><span>local providers</span></div>
          <div><b>${CONFIG.categories.length}</b><span>categories</span></div>
          <div><b>${CONFIG.areas.length}</b><span>areas covered</span></div>
        </div>
      </div>
    </section>

    <section class="block wrap split split-rev">
      <div class="biz-art" aria-hidden="true">
        <img src="/img/biz-stylist.jpg" alt="" loading="lazy">
        <div class="mock-page">
          <div class="mock-url">${esc(location.host)}/p/your-business</div>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px"><div class="avatar" style="--c:#7c3aed">YB</div><div><b>Your Business</b><div class="muted small">★ 5.0 · Your area</div></div></div>
          <div class="mock-row"><span>Signature service</span><b>${money(45)}</b></div>
          <div class="mock-row"><span>Premium service</span><b>${money(80)}</b></div>
          <div class="mock-row"><span>Home visit</span><b>${money(60)}</b></div>
          <div class="btn btn-block" style="margin-top:10px">Book now</div>
        </div>
      </div>
      <div>
        <span class="pill">${icon('share', 18)}</span>
        <h2 class="display">No website? No&nbsp;problem.</h2>
        <p class="lead-sm">Get a free booking page your customers can use straight away. Put it in your Instagram bio, WhatsApp status or TikTok and take bookings around the clock.</p>
        <ul class="ticks">
          <li>${icon('check', 18)} Your own link with services, prices and hours</li>
          <li>${icon('check', 18)} Card payments or pay-on-the-day</li>
          <li>${icon('check', 18)} A simple dashboard for your appointments</li>
          <li>${icon('check', 18)} Home-visit and mobile services supported</li>
        </ul>
        <form class="quick-join" id="quickJoin">
          <input name="name" placeholder="Your business name" aria-label="Business name" maxlength="80">
          <button class="btn btn-dark">Create my free page</button>
        </form>
      </div>
    </section>

    <section class="block wrap faq">
      <div>
        <h2 class="display">Questions?</h2>
        <p class="lead-sm">The quick answers. Anything else is on the provider's page.</p>
      </div>
      <div class="accordion">
        ${faqs.map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary><span class="plus" aria-hidden="true"></span>${q}</summary><p>${a}</p></details>`).join('')}
      </div>
    </section>`,
    mount() {
      $('#heroSearch').addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const qs = new URLSearchParams([...fd].filter(([, v]) => v));
        location.hash = '#/search' + (qs.toString() ? '?' + qs : '');
      });
      $('#quickJoin').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = new FormData(e.target).get('name').trim();
        location.hash = '#/join' + (name ? '?name=' + encodeURIComponent(name) : '');
      });
    },
  };
}

async function searchView(_, params) {
  const { total, providers } = await api('/providers?' + params.toString());
  const sel = (name, value) => (params.get(name) === value ? 'selected' : '');
  const active = CONFIG.categories.find((c) => c.id === params.get('category'));
  const withParam = (key, value) => {
    const p = new URLSearchParams(params);
    value ? p.set(key, value) : p.delete(key);
    return '#/search' + (p.toString() ? '?' + p : '');
  };
  return {
    html: `
    <div class="wrap">
      <div class="page-head">
        <h1>${active ? esc(active.name) : params.get('q') ? `Results for “${esc(params.get('q'))}”` : 'Explore local services'}</h1>
        <p class="muted">${active ? esc(active.description) : 'Find and book trusted providers in your area.'}</p>
      </div>
      <div class="cat-pills">
        <a href="${withParam('category', '')}" class="${!active ? 'active' : ''}">All</a>
        ${CONFIG.categories.map((c) => `<a href="${withParam('category', c.id)}" class="${active && active.id === c.id ? 'active' : ''}">${esc(c.name)}</a>`).join('')}
      </div>
      <div class="search-layout">
        <form class="card filters" id="filters">
          <h3>Filters</h3>
          <input type="hidden" name="category" value="${esc(params.get('category') || '')}">
          <label>Keyword<input name="q" value="${esc(params.get('q') || '')}" placeholder="e.g. silk press"></label>
          <label>Area<select name="area"><option value="">Any area</option>${CONFIG.areas.map((a) => `<option ${sel('area', a)}>${esc(a)}</option>`).join('')}</select></label>
          <label>Starting price<select name="maxPrice"><option value="">Any price</option>${[25, 50, 100, 200].map((n) => `<option value="${n}" ${sel('maxPrice', String(n))}>Up to ${money(n)}</option>`).join('')}</select></label>
          <label class="check"><input type="checkbox" name="homeVisit" value="1" ${params.get('homeVisit') === '1' ? 'checked' : ''}> Comes to me (home visits)</label>
          <label>Sort by<select name="sort">
            <option value="rating" ${sel('sort', 'rating')}>Top rated</option>
            <option value="reviews" ${sel('sort', 'reviews')}>Most reviewed</option>
            <option value="price" ${sel('sort', 'price')}>Lowest price</option>
            <option value="new" ${sel('sort', 'new')}>Newest</option>
          </select></label>
          <button class="btn btn-block">Apply</button>
          ${[...params.keys()].length ? '<a href="#/search" class="btn btn-ghost btn-block" style="margin-top:8px">Clear all</a>' : ''}
        </form>
        <div>
          <div class="results-head"><b>${total} provider${total === 1 ? '' : 's'}</b></div>
          ${providers.length
            ? `<div class="grid">${providers.map(providerCard).join('')}</div>`
            : `<div class="card empty"><h3>No matches yet</h3><p class="muted">Try a different keyword or area, or clear your filters.</p><a href="#/search" class="btn btn-ghost">Clear filters</a></div>`}
        </div>
      </div>
    </div>`,
    mount() {
      const form = $('#filters');
      const apply = () => {
        const qs = new URLSearchParams([...new FormData(form)].filter(([, v]) => v));
        location.hash = '#/search' + (qs.toString() ? '?' + qs : '');
      };
      form.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
      $$('select, input[type=checkbox]', form).forEach((el) => el.addEventListener('change', apply));
    },
  };
}

async function providerView([slug]) {
  const p = await api('/providers/' + encodeURIComponent(slug));
  const todayKey = DAYS[new Date().getDay()];
  return {
    html: `
    <div class="wrap">
      <section class="p-hero">
        <div class="p-head">
          ${avatar(p, 'xl')}
          <div>
            <div class="meta" style="margin-bottom:6px"><span class="chip">${esc(catName(p.category))}</span>${p.verified ? `<span class="tag">${icon('shield', 14)} Verified</span>` : ''}${p.homeVisit ? `<span class="tag">${icon('home', 14)} Home visits</span>` : ''}</div>
            <h1>${esc(p.name)}</h1>
            <div class="meta">${p.rating ? `${stars(p.rating)} <b>${p.rating.toFixed(1)}</b> <span class="muted">(${p.reviewCount} reviews)</span>` : '<span class="muted">No reviews yet</span>'} <span class="sep">•</span> ${icon('pin', 16)} ${esc(p.area)}</div>
          </div>
          <div class="actions"><button class="btn btn-ghost btn-sm" id="shareBtn">${icon('share', 16)} Share</button></div>
        </div>
      </section>
      <div class="p-layout">
        <div>
          <div class="card pad" style="margin-bottom:18px">
            <h2>Services</h2>
            ${p.services.map((s) => `
              <div class="service">
                <div><h3>${esc(s.name)}</h3><div class="meta">${icon('clock', 15)} ${fmtDuration(s.duration)}</div></div>
                <div class="service-right"><span class="price">${money(s.price)}</span><a class="btn btn-sm" href="#/book/${esc(p.slug)}/${esc(s.id)}">Book</a></div>
              </div>`).join('')}
          </div>
          ${p.tagline || p.about ? `<div class="card pad" style="margin-bottom:18px"><h2>About</h2>${p.tagline ? `<p><b>${esc(p.tagline)}</b></p>` : ''}<p class="muted" style="white-space:pre-line;margin:0">${esc(p.about)}</p></div>` : ''}
          <div class="card pad">
            <h2>Reviews</h2>
            ${p.rating ? `<div class="rating-big"><b>${p.rating.toFixed(1)}</b><div>${stars(p.rating)}<div class="muted small">${p.reviewCount} review${p.reviewCount === 1 ? '' : 's'}</div></div></div>` : ''}
            ${p.reviews.length ? p.reviews.map((r) => `
              <div class="review">
                <div class="review-head"><b>${esc(r.name)}</b>${stars(r.rating)}<span class="muted small">${new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>${r.verified ? `<span class="verified">✓ Booked on ${esc(CONFIG.brand)}</span>` : ''}</div>
                ${r.text ? `<p>${esc(r.text)}</p>` : ''}
              </div>`).join('') : '<p class="muted">No reviews yet. Book an appointment and be the first to leave one.</p>'}
          </div>
        </div>
        <aside class="p-side">
          <div class="card pad">
            <h3>Location & contact</h3>
            <div class="info-list">
              ${p.address ? `<div>${icon('pin', 18)}<span>${esc(p.address)}</span></div>` : ''}
              ${p.homeVisit ? `<div>${icon('home', 18)}<span>Comes to you, available at checkout</span></div>` : ''}
              <div>${icon('phone', 18)}<span>${esc(p.phone)}</span></div>
            </div>
          </div>
          <div class="card pad">
            <h3>Opening hours</h3>
            <table class="hours">${WEEK.map((d) => `<tr class="${d === todayKey ? 'today' : ''}"><td>${DAY_NAMES[d]}</td><td>${p.hours[d] ? `${fmtTime(p.hours[d][0])} – ${fmtTime(p.hours[d][1])}` : 'Closed'}</td></tr>`).join('')}</table>
          </div>
          <a class="btn btn-block" href="#/book/${esc(p.slug)}/${esc(p.services[0].id)}">Book an appointment</a>
        </aside>
      </div>
    </div>`,
    mount() { $('#shareBtn').addEventListener('click', () => copy(shareUrl(p.slug))); },
  };
}

async function bookView([slug, serviceId]) {
  const p = await api('/providers/' + encodeURIComponent(slug));
  const svc = p.services.find((s) => s.id === serviceId);
  if (!svc) throw new Error('That service is no longer available.');
  const days = nextDays(21);
  const saved = store.get('nb_customer', {});
  const state = { date: null, time: null };
  const free = svc.price === 0;

  const summaryHtml = () => `
    <div class="summary-prov">${avatar(p)}<div><b>${esc(p.name)}</b><div class="muted small">${esc(p.area)}</div></div></div>
    <div class="summary-line"><span>Service</span><b style="text-align:right">${esc(svc.name)}</b></div>
    <div class="summary-line"><span>Duration</span><span>${fmtDuration(svc.duration)}</span></div>
    <div class="summary-line"><span>Date</span><span>${state.date ? fmtDate(state.date, { weekday: 'long', month: 'long', day: 'numeric' }) : '—'}</span></div>
    <div class="summary-line"><span>Time</span><span>${state.time ? fmtTime(state.time) : '—'}</span></div>
    <div class="summary-line summary-total"><span>Total</span><span>${money(svc.price)}</span></div>
    <div class="secure">${icon('shield', 16)} Free cancellation until your appointment starts.</div>`;

  return {
    html: `
    <div class="wrap">
      <a href="#/p/${esc(p.slug)}" class="back">← ${esc(p.name)}</a>
      <h1 style="margin-bottom:20px">Book ${esc(svc.name)}</h1>
      <div class="book-layout">
        <div>
          <section class="card step-card">
            <div class="step-title"><span class="num">1</span><h2>Choose service</h2></div>
            <label style="margin:0">Service<select id="svcSelect">${p.services.map((s) => `<option value="${esc(s.id)}" ${s.id === svc.id ? 'selected' : ''}>${esc(s.name)} · ${fmtDuration(s.duration)} · ${money(s.price)}</option>`).join('')}</select></label>
          </section>
          <section class="card step-card">
            <div class="step-title"><span class="num">2</span><h2>Pick a date & time</h2></div>
            <div class="days" id="days">
              ${days.map((d) => `<button type="button" class="day" data-date="${d.iso}" ${p.hours[d.key] ? '' : 'disabled title="Closed"'}><small>${esc(d.dow)}</small><b>${d.dom}</b><small>${esc(d.mon)}</small></button>`).join('')}
            </div>
            <div class="slots" id="slots"><p class="muted">Select a day to see open times.</p></div>
          </section>
          <form class="card step-card" id="bookForm" hidden novalidate>
            <div class="step-title"><span class="num">3</span><h2>Your details</h2></div>
            <div id="formError"></div>
            ${p.homeVisit ? `
              <div class="choice-row">
                <label class="choice"><input type="radio" name="location" value="venue" ${p.address ? 'checked' : ''} ${p.address ? '' : 'disabled'}><div><b>At the venue</b><span>${p.address ? esc(p.address) : 'Mobile-only provider'}</span></div></label>
                <label class="choice"><input type="radio" name="location" value="home" ${p.address ? '' : 'checked'}><div><b>Home visit</b><span>They come to your address</span></div></label>
              </div>
              <label id="addressField" ${p.address ? 'hidden' : ''}>Your address<input name="address" autocomplete="street-address" value="${esc(saved.address || '')}" placeholder="Street, building, apartment"></label>` : ''}
            <div class="row">
              <label>Full name<input name="name" required autocomplete="name" value="${esc(saved.name || '')}"></label>
              <label>Phone<input name="phone" type="tel" autocomplete="tel" value="${esc(saved.phone || '')}"></label>
            </div>
            <label>Email <span class="hint">· your confirmation goes here</span><input name="email" type="email" required autocomplete="email" value="${esc(saved.email || store.get('nb_email', ''))}"></label>
            <label>Notes for the provider <span class="hint">(optional)</span><textarea name="notes" placeholder="Hair length, allergies, access instructions…"></textarea></label>

            <div class="step-title" style="margin-top:10px"><span class="num">4</span><h2>Payment</h2></div>
            ${free ? '<p class="muted">This service is free, so you don\'t need to pay anything.</p>' : `
            <div class="choice-row">
              <label class="choice"><input type="radio" name="payMethod" value="card" checked><div><b>Pay now by card</b><span>Secure checkout, instant confirmation</span></div></label>
              <label class="choice"><input type="radio" name="payMethod" value="cash"><div><b>Pay at appointment</b><span>Cash or transfer on the day</span></div></label>
            </div>
            <div class="card-fields" id="cardFields">
              <div class="demo-note">Demo checkout: nothing is charged. Use test card 4242 4242 4242 4242 with any future expiry date.</div>
              <label>Card number<input name="cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234" maxlength="23"></label>
              <div class="row">
                <label>Expiry<input name="cardExp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY" maxlength="7"></label>
                <label>CVC<input name="cardCvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></label>
              </div>
            </div>`}
            <button class="btn btn-block" id="submitBtn">${free ? 'Confirm booking' : `Confirm & pay ${money(svc.price)}`}</button>
          </form>
        </div>
        <aside class="card summary" id="summary">${summaryHtml()}</aside>
      </div>
    </div>`,

    mount() {
      const slotsEl = $('#slots');
      const form = $('#bookForm');
      const refreshSummary = () => ($('#summary').innerHTML = summaryHtml());

      $('#svcSelect').addEventListener('change', (e) => { location.hash = `#/book/${p.slug}/${e.target.value}`; });

      async function loadSlots() {
        const date = state.date;
        slotsEl.innerHTML = '<p class="muted">Checking availability…</p>';
        try {
          const { slots } = await api(`/providers/${p.id}/availability?service=${svc.id}&date=${date}`);
          if (date !== state.date) return slots; // user picked another day meanwhile
          slotsEl.innerHTML = slots.length
            ? slots.map((t) => `<button type="button" class="slot ${t === state.time ? 'active' : ''}" data-time="${t}">${fmtTime(t)}</button>`).join('')
            : '<p class="muted">No open times left on this day. Try another date.</p>';
          return slots;
        } catch (err) {
          slotsEl.innerHTML = `<p>${errorBox(err.message)}</p>`;
          return null;
        }
      }

      function selectDay(btn) {
        $$('.day').forEach((d) => d.classList.toggle('active', d === btn));
        state.date = btn.dataset.date;
        state.time = null;
        form.hidden = true;
        refreshSummary();
        return loadSlots();
      }

      let userPicked = false;
      $('#days').addEventListener('click', (e) => {
        const btn = e.target.closest('.day');
        if (btn && !btn.disabled) { userPicked = true; selectDay(btn); }
      });

      slotsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.slot');
        if (!btn) return;
        $$('.slot', slotsEl).forEach((s) => s.classList.toggle('active', s === btn));
        state.time = btn.dataset.time;
        refreshSummary();
        const wasHidden = form.hidden;
        form.hidden = false;
        if (wasHidden) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      // Auto-select the first day (within the next week) that still has open times.
      (async () => {
        const open = $$('.day:not(:disabled)').slice(0, 7);
        const strip = $('#days');
        for (const btn of open) {
          if (userPicked) return;
          const slots = await selectDay(btn);
          if (slots === null || slots.length) {
            strip.scrollLeft += btn.getBoundingClientRect().left - strip.getBoundingClientRect().left - 16;
            return;
          }
        }
        if (open[0] && !userPicked) selectDay(open[0]);
      })();

      form.addEventListener('change', (e) => {
        if (e.target.name === 'location') $('#addressField').hidden = e.target.value !== 'home';
        if (e.target.name === 'payMethod') $('#cardFields').hidden = e.target.value !== 'card';
      });
      form.addEventListener('input', (e) => {
        if (e.target.name === 'cardNumber') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
        if (e.target.name === 'cardExp') {
          const v = e.target.value.replace(/\D/g, '').slice(0, 4);
          e.target.value = v.length > 2 ? `${v.slice(0, 2)} / ${v.slice(2)}` : v;
        }
        if (e.target.name === 'cardCvc') e.target.value = e.target.value.replace(/\D/g, '');
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(form));
        const showError = (msg) => { $('#formError').innerHTML = errorBox(msg); $('#formError').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
        if (!state.date || !state.time) return showError('Please choose a date and time.');
        if (!fd.name || !fd.name.trim()) return showError('Please enter your name.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email || '')) return showError('Please enter a valid email address.');
        const location = fd.location || 'venue';
        if (location === 'home' && !(fd.address || '').trim()) return showError('Please enter the address for your home visit.');

        let payment = { method: 'none' };
        if (!free) {
          payment = { method: fd.payMethod };
          if (fd.payMethod === 'card') {
            const num = (fd.cardNumber || '').replace(/\D/g, '');
            const [mm, yy] = (fd.cardExp || '').split('/').map((s) => Number(s.trim()));
            const expEnd = new Date(2000 + yy, mm, 1);
            if (!luhn(num)) return showError('That card number doesn\'t look right.');
            if (!(mm >= 1 && mm <= 12) || !yy || expEnd <= new Date()) return showError('Please enter a valid, unexpired expiry date.');
            if (!/^\d{3,4}$/.test(fd.cardCvc || '')) return showError('Please enter the 3 or 4 digit security code.');
            payment = { method: 'card', last4: num.slice(-4), brand: cardBrand(num) };
          }
        }

        const btn = $('#submitBtn');
        btn.disabled = true;
        btn.textContent = payment.method === 'card' ? 'Processing payment…' : 'Booking…';
        try {
          const booking = await api('/bookings', {
            method: 'POST',
            body: {
              providerId: p.id, serviceId: svc.id, date: state.date, time: state.time, location,
              address: fd.address, notes: fd.notes, payment,
              customer: { name: fd.name, email: fd.email, phone: fd.phone },
            },
          });
          store.set('nb_customer', { name: fd.name, email: fd.email, phone: fd.phone, address: fd.address || saved.address || '' });
          store.set('nb_email', fd.email.trim().toLowerCase());
          showConfirmation(booking);
        } catch (err) {
          btn.disabled = false;
          btn.textContent = free ? 'Confirm booking' : `Confirm & pay ${money(svc.price)}`;
          showError(err.message);
          if (err.status === 409) { state.time = null; refreshSummary(); loadSlots(); }
        }
      });
    },
  };
}

function showConfirmation(b) {
  const where = b.location === 'home' ? `Home visit: ${b.address}` : (b.provider.address || 'At the venue');
  const payLabel = {
    card: `Paid ${money(b.price)} · ${b.payment.brand} •••• ${b.payment.last4}`,
    cash: `${money(b.price)} due at your appointment`,
    none: 'Free, nothing to pay',
  }[b.payment.method];
  $('#app').innerHTML = `
    <div class="wrap confirm">
      <div class="confirm-icon">${icon('check', 36)}</div>
      <h1>You're booked!</h1>
      <p class="muted">We've saved your booking. Reference <span class="ref">${esc(b.ref)}</span></p>
      <div class="card pad">
        <div class="summary-prov">${avatar({ name: b.provider.name, color: b.provider.color })}<div><b>${esc(b.provider.name)}</b><div class="muted small">${esc(b.provider.phone)}</div></div></div>
        <div class="summary-line"><span>Service</span><b>${esc(b.serviceName)}</b></div>
        <div class="summary-line"><span>When</span><span>${fmtDate(b.date, { weekday: 'long', month: 'long', day: 'numeric' })} at ${fmtTime(b.time)}</span></div>
        <div class="summary-line"><span>Duration</span><span>${fmtDuration(b.duration)}</span></div>
        <div class="summary-line"><span>Where</span><span style="text-align:right">${esc(where)}</span></div>
        <div class="summary-line"><span>Payment</span><span><span class="badge ${b.payment.status}">${b.payment.status}</span></span></div>
        <p class="muted small" style="margin:10px 0 0">${esc(payLabel)}</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-ghost" id="icsBtn">${icon('clock', 18)} Add to calendar</button>
        <a href="#/bookings" class="btn">View my bookings</a>
      </div>
    </div>`;
  $('#icsBtn').addEventListener('click', () => downloadIcs(b));
  window.scrollTo(0, 0);
}

async function bookingsView() {
  const email = store.get('nb_email', '');
  if (!email) {
    return {
      html: `
      <div class="wrap narrow">
        <div class="page-head"><h1>My bookings</h1><p class="muted">Enter the email you booked with to see, cancel or review your appointments.</p></div>
        <form class="card pad" id="emailForm">
          <label>Email<input type="email" name="email" required autocomplete="email" placeholder="you@example.com"></label>
          <button class="btn">Find my bookings</button>
        </form>
      </div>`,
      mount() {
        $('#emailForm').addEventListener('submit', (e) => {
          e.preventDefault();
          store.set('nb_email', new FormData(e.target).get('email').trim().toLowerCase());
          render();
        });
      },
    };
  }

  let bookings = await api('/bookings?email=' + encodeURIComponent(email));
  let tab = 'upcoming';
  const isUpcoming = (b) => b.status === 'confirmed' && b.canCancel;

  const bookingHtml = (b) => `
    <div class="card booking" data-id="${esc(b.id)}">
      ${b.provider ? avatar({ name: b.provider.name, color: b.provider.color }) : ''}
      <div>
        <h3>${esc(b.serviceName)}</h3>
        <div class="muted small">${b.provider ? `<a href="#/p/${esc(b.provider.slug)}">${esc(b.provider.name)}</a>` : ''} · Ref <span class="ref">${esc(b.ref)}</span></div>
        <div class="when" style="margin-top:6px">${fmtDate(b.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · ${fmtTime(b.time)} · ${fmtDuration(b.duration)}</div>
        <div class="meta" style="margin-top:6px">
          <span class="badge ${b.status}">${b.status.replace('_', '-')}</span>
          <span class="badge ${b.payment.status}">${b.payment.method === 'none' ? 'free' : b.payment.status}</span>
          <span>${money(b.price)}</span>
          ${b.location === 'home' ? `<span class="sep">•</span><span>Home visit</span>` : ''}
        </div>
      </div>
      <div class="booking-actions">
        ${b.canCancel ? '<button class="btn btn-danger btn-sm" data-act="cancel">Cancel</button><button class="btn btn-ghost btn-sm" data-act="ics">Add to calendar</button>' : ''}
        ${b.canReview ? '<button class="btn btn-sm" data-act="review">Leave a review</button>' : ''}
        ${b.reviewed ? '<span class="verified">✓ Reviewed</span>' : ''}
        ${!isUpcoming(b) && b.provider ? `<a class="btn btn-ghost btn-sm" href="#/book/${esc(b.provider.slug)}/${esc(b.serviceId)}">Book again</a>` : ''}
      </div>
    </div>`;

  const listHtml = () => {
    const list = bookings.filter((b) => (tab === 'upcoming' ? isUpcoming(b) : !isUpcoming(b)));
    if (tab === 'upcoming') list.reverse(); // soonest first
    return list.length
      ? list.map(bookingHtml).join('')
      : `<div class="card empty"><h3>${tab === 'upcoming' ? 'No upcoming bookings' : 'Nothing here yet'}</h3><p class="muted">Find something you'd like to book.</p><a href="#/search" class="btn">Explore services</a></div>`;
  };

  return {
    html: `
    <div class="wrap narrow">
      <div class="page-head">
        <h1>My bookings</h1>
        <p class="muted">Showing bookings for <b>${esc(email)}</b> · <button class="link-btn" id="switchEmail">Use a different email</button></p>
      </div>
      <div class="tabs"><button data-tab="upcoming" class="active">Upcoming</button><button data-tab="past">Past & cancelled</button></div>
      <div id="bookingList">${listHtml()}</div>
    </div>`,
    mount() {
      const listEl = $('#bookingList');
      const redraw = () => (listEl.innerHTML = listHtml());
      $('#switchEmail').addEventListener('click', () => { store.set('nb_email', ''); render(); });
      $('.tabs').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        tab = btn.dataset.tab;
        $$('.tabs button').forEach((b) => b.classList.toggle('active', b === btn));
        redraw();
      });

      listEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const card = btn.closest('.booking');
        const b = bookings.find((x) => x.id === card.dataset.id);
        const replace = (updated) => { bookings = bookings.map((x) => (x.id === updated.id ? updated : x)); redraw(); };

        if (btn.dataset.act === 'ics') return downloadIcs(b);
        if (btn.dataset.act === 'cancel') {
          if (!window.confirm(`Cancel ${b.serviceName} on ${fmtDate(b.date)}?${b.payment.method === 'card' ? ' Your card payment will be refunded.' : ''}`)) return;
          try { replace(await api(`/bookings/${b.id}/cancel`, { method: 'POST', body: { email } })); toast('Booking cancelled'); }
          catch (err) { toast(err.message); }
        }
        if (btn.dataset.act === 'review') {
          if ($('.booking-review', card)) return;
          card.insertAdjacentHTML('beforeend', `
            <form class="booking-review">
              <b>How was ${esc(b.provider.name)}?</b><br>
              <div class="star-input">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" value="${n}" id="r${b.id}${n}"><label for="r${b.id}${n}" title="${n} star${n > 1 ? 's' : ''}">★</label>`).join('')}</div>
              <textarea name="text" placeholder="Tell others about your experience (optional)"></textarea>
              <div class="btn-row" style="justify-content:flex-start;margin-top:10px"><button class="btn btn-sm">Post review</button></div>
            </form>`);
          $('.booking-review', card).addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            if (!fd.get('rating')) return toast('Pick a star rating');
            try {
              replace(await api(`/bookings/${b.id}/review`, { method: 'POST', body: { email, rating: Number(fd.get('rating')), text: fd.get('text') } }));
              toast('Thanks for your review!');
            } catch (err) { toast(err.message); }
          });
        }
      });
    },
  };
}

function joinView(_, params) {
  const defaultHours = { mon: ['09:00', '18:00'], tue: ['09:00', '18:00'], wed: ['09:00', '18:00'], thu: ['09:00', '18:00'], fri: ['09:00', '18:00'], sat: ['10:00', '16:00'], sun: null };
  const svcRow = (s = {}) => `
    <div class="svc-row">
      <label>Service name<input name="svcName" value="${esc(s.name || '')}" placeholder="e.g. Knotless braids" required></label>
      <label>Minutes<input name="svcDuration" type="number" min="15" max="600" step="5" value="${s.duration || 60}" required></label>
      <label>Price<input name="svcPrice" type="number" min="0" step="0.01" value="${s.price ?? ''}" placeholder="0" required></label>
      <button type="button" class="icon-btn" data-remove title="Remove">×</button>
    </div>`;

  return {
    html: `
    <div class="wrap">
      <div class="page-head">
        <span class="chip">For businesses · free</span>
        <h1 style="margin-top:12px">Get your free booking page</h1>
        <p class="muted">You don't need a website or any technical skills. Add your services and hours, and you'll get a link customers can book and pay through.</p>
      </div>
      <div class="join-layout">
        <form id="joinForm" novalidate>
          <div id="joinError"></div>
          <section class="card form-section">
            <h2>Your business</h2><p class="muted">This is what customers will see.</p>
            <label>Business name<input name="name" required placeholder="e.g. Amara's Braid Studio" maxlength="80" value="${esc(params.get('name') || '')}"></label>
            <div class="cat-select">
              ${CONFIG.categories.map((c, i) => `<label class="choice"><input type="radio" name="category" value="${c.id}" ${i === 0 ? 'checked' : ''}><div><b>${esc(c.name)}</b></div></label>`).join('')}
            </div>
            <label>Tagline <span class="hint">(one line about what you do)</span><input name="tagline" maxlength="120" placeholder="e.g. Neat, long-lasting braids for all ages"></label>
            <label>About <span class="hint">(optional)</span><textarea name="about" maxlength="1500" placeholder="Experience, specialities, what to expect…"></textarea></label>
          </section>

          <section class="card form-section">
            <h2>Location & contact</h2><p class="muted">Customers search by area.</p>
            <div class="row">
              <label>Area / neighbourhood<input name="area" required list="areaList" placeholder="e.g. Eastside"><datalist id="areaList">${CONFIG.areas.map((a) => `<option value="${esc(a)}">`).join('')}</datalist></label>
              <label>Phone / WhatsApp<input name="phone" type="tel" required placeholder="+1 555 000 0000"></label>
            </div>
            <label>Address <span class="hint">(leave blank if you only do home visits)</span><input name="address" placeholder="Street, unit, landmark"></label>
            <label class="check"><input type="checkbox" name="homeVisit"> I offer home visits / mobile service</label>
            <label style="max-width:260px">Customers you can serve at once<input name="capacity" type="number" min="1" max="20" value="1"><span class="hint">Number of chairs, stations or staff.</span></label>
          </section>

          <section class="card form-section">
            <h2>Services & prices</h2><p class="muted">Add the services customers can book. You can add more later.</p>
            <div id="svcList">${svcRow()}${svcRow()}</div>
            <button type="button" class="btn btn-ghost btn-sm" id="addSvc">+ Add another service</button>
          </section>

          <section class="card form-section">
            <h2>Opening hours</h2><p class="muted">Customers can only book inside these hours.</p>
            ${WEEK.map((d) => `
              <div class="hours-row" data-day="${d}">
                <label class="check"><input type="checkbox" ${defaultHours[d] ? 'checked' : ''}> ${DAY_NAMES[d].slice(0, 3)}</label>
                <input type="time" value="${(defaultHours[d] || ['09:00'])[0]}" ${defaultHours[d] ? '' : 'disabled'} aria-label="${DAY_NAMES[d]} opens">
                <input type="time" value="${(defaultHours[d] || [null, '17:00'])[1]}" ${defaultHours[d] ? '' : 'disabled'} aria-label="${DAY_NAMES[d]} closes">
              </div>`).join('')}
          </section>
          <button class="btn btn-block" id="joinBtn">Create my booking page</button>
        </form>
        <aside class="card pad">
          <h3>What you get</h3>
          <div class="info-list" style="margin-top:12px">
            <div>${icon('share', 18)}<span><b>Your own link</b> to share on Instagram, WhatsApp, TikTok or Google</span></div>
            <div>${icon('clock', 18)}<span><b>24/7 bookings</b> with no back-and-forth messages</span></div>
            <div>${icon('shield', 18)}<span><b>Get paid upfront</b> by card, or let customers pay on the day</span></div>
            <div>${icon('search', 18)}<span><b>Get discovered</b> by new customers searching your area</span></div>
          </div>
        </aside>
      </div>
    </div>`,

    mount() {
      const form = $('#joinForm');
      $('#addSvc').addEventListener('click', () => $('#svcList').insertAdjacentHTML('beforeend', svcRow()));
      $('#svcList').addEventListener('click', (e) => {
        if (!e.target.matches('[data-remove]')) return;
        if ($$('.svc-row').length > 1) e.target.closest('.svc-row').remove();
        else toast('You need at least one service');
      });
      $$('.hours-row').forEach((row) => {
        const [cb, open, close] = $$('input', row);
        cb.addEventListener('change', () => { open.disabled = close.disabled = !cb.checked; });
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const hours = {};
        $$('.hours-row').forEach((row) => {
          const [cb, open, close] = $$('input', row);
          hours[row.dataset.day] = cb.checked ? [open.value, close.value] : null;
        });
        const services = $$('.svc-row').map((row) => ({
          name: $('[name=svcName]', row).value,
          duration: Number($('[name=svcDuration]', row).value),
          price: Number($('[name=svcPrice]', row).value || 0),
        })).filter((s) => s.name.trim());

        const btn = $('#joinBtn');
        btn.disabled = true;
        try {
          const { provider, manageKey } = await api('/providers', {
            method: 'POST',
            body: {
              name: fd.get('name'), category: fd.get('category'), tagline: fd.get('tagline'), about: fd.get('about'),
              area: fd.get('area'), phone: fd.get('phone'), address: fd.get('address'), homeVisit: fd.get('homeVisit') === 'on',
              capacity: Number(fd.get('capacity')), services, hours,
            },
          });
          const keys = store.get('nb_keys', {});
          keys[provider.id] = { key: manageKey, name: provider.name };
          store.set('nb_keys', keys);
          updateNav();
          showJoinSuccess(provider, manageKey);
        } catch (err) {
          btn.disabled = false;
          $('#joinError').innerHTML = errorBox(err.message);
          $('#joinError').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    },
  };
}

function showJoinSuccess(p, key) {
  const dashUrl = `${location.origin}/#/dashboard/${p.id}?key=${encodeURIComponent(key)}`;
  $('#app').innerHTML = `
    <div class="wrap confirm">
      <div class="confirm-icon">${icon('check', 36)}</div>
      <h1>${esc(p.name)} is live!</h1>
      <p class="muted">Customers can find you in search and book through your page.</p>
      <div class="card pad">
        <h3>Your booking link</h3>
        <p class="muted small">Put it in your Instagram bio, WhatsApp status or Google profile.</p>
        <div class="share-box"><code>${esc(shareUrl(p.slug))}</code><button class="btn btn-sm" data-copy="${esc(shareUrl(p.slug))}">Copy</button></div>
        <h3 style="margin-top:22px">Your private dashboard link</h3>
        <p class="muted small">This link lets you manage your bookings. Keep it safe and don't share it. It's also saved in this browser.</p>
        <div class="share-box"><code>${esc(dashUrl)}</code><button class="btn btn-sm btn-ghost" data-copy="${esc(dashUrl)}">Copy</button></div>
      </div>
      <div class="btn-row">
        <a class="btn btn-ghost" href="#/p/${esc(p.slug)}">View my page</a>
        <a class="btn" href="#/dashboard/${esc(p.id)}">Go to dashboard</a>
      </div>
    </div>`;
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(b.dataset.copy)));
  window.scrollTo(0, 0);
}

async function dashboardView([id], params) {
  const keys = store.get('nb_keys', {});

  if (!id) {
    const ids = Object.keys(keys);
    if (ids.length === 1) { location.replace(`#/dashboard/${ids[0]}`); return null; }
    return {
      html: `
      <div class="wrap narrow">
        <div class="page-head"><h1>Business dashboard</h1><p class="muted">Manage your appointments and booking page.</p></div>
        ${ids.length ? `<div class="card pad" style="margin-bottom:18px"><h3>Your businesses on this device</h3>${ids.map((i) => `<p><a href="#/dashboard/${esc(i)}">${esc(keys[i].name)}</a></p>`).join('')}</div>` : ''}
        <div class="card pad"><h3>Not listed yet?</h3><p class="muted">Create a free booking page in a few minutes.</p><a class="btn" href="#/join">List your business</a>
        <p class="muted small" style="margin:16px 0 0">Already listed on another device? Open the private dashboard link you were given when you signed up.</p></div>
      </div>`,
    };
  }

  const fromUrl = params.get('key');
  if (fromUrl) {
    keys[id] = { key: fromUrl, name: (keys[id] && keys[id].name) || 'My business' };
    store.set('nb_keys', keys);
    location.replace(`#/dashboard/${id}`); // drop the key from the address bar
    return null;
  }
  const key = keys[id] && keys[id].key;
  if (!key) throw new Error('This dashboard needs your private dashboard link. Open the link you were given when you signed up.');

  const headers = { 'x-manage-key': key };
  let data;
  try { data = await api('/manage/' + encodeURIComponent(id), { headers }); }
  catch (err) {
    if (err.status === 401) { delete keys[id]; store.set('nb_keys', keys); updateNav(); }
    throw err;
  }
  const p = data.provider;
  keys[id].name = p.name;
  store.set('nb_keys', keys);
  let bookings = data.bookings;
  let tab = 'upcoming';

  const statsHtml = () => {
    const upcoming = bookings.filter((b) => b.status === 'confirmed' && !b.started);
    const month = isoDate(new Date()).slice(0, 7);
    const earned = bookings.filter((b) => b.payment.status === 'paid' && b.status !== 'cancelled' && b.date.startsWith(month)).reduce((s, b) => s + b.price, 0);
    const due = upcoming.filter((b) => b.payment.status === 'due').reduce((s, b) => s + b.price, 0);
    return `
      <div class="card stat"><div class="label">Upcoming appointments</div><div class="value">${upcoming.length}</div></div>
      <div class="card stat"><div class="label">Paid this month</div><div class="value">${amount(earned)}</div></div>
      <div class="card stat"><div class="label">To collect on the day</div><div class="value">${due ? money(due) : '—'}</div></div>
      <div class="card stat"><div class="label">Rating</div><div class="value">${p.rating ? `${p.rating.toFixed(1)} ★` : '—'}</div><div class="muted small">${p.reviewCount} reviews</div></div>`;
  };

  const rowsHtml = () => {
    const needsAction = (b) => b.status === 'confirmed';
    let list;
    if (tab === 'upcoming') list = bookings.filter((b) => needsAction(b) && !b.started);
    else if (tab === 'action') list = bookings.filter((b) => needsAction(b) && b.started);
    else list = bookings.filter((b) => !needsAction(b)).reverse();
    if (!list.length) return `<div class="empty"><p class="muted">${{ upcoming: 'No upcoming appointments yet. Share your booking link to get your first one!', action: 'Nothing to update.', history: 'No past appointments yet.' }[tab]}</p></div>`;
    return `<div class="table-wrap"><table class="list">
      <thead><tr><th>When</th><th>Customer</th><th>Service</th><th>Payment</th><th>Status</th><th></th></tr></thead>
      <tbody>${list.map((b) => `
        <tr data-id="${esc(b.id)}">
          <td><b>${fmtDate(b.date)}</b><br><span class="muted">${fmtTime(b.time)} · ${fmtDuration(b.duration)}</span></td>
          <td><b>${esc(b.customer.name)}</b><br><span class="muted small">${esc(b.customer.phone || b.customer.email)}</span>${b.location === 'home' ? `<br><span class="tag">${icon('home', 12)} ${esc(b.address)}</span>` : ''}${b.notes ? `<br><span class="muted small">“${esc(b.notes)}”</span>` : ''}</td>
          <td>${esc(b.serviceName)}<br><span class="muted small">Ref ${esc(b.ref)}</span></td>
          <td>${money(b.price)}<br><span class="badge ${b.payment.status}">${b.payment.method === 'cash' && b.payment.status === 'due' ? 'pay on day' : b.payment.status}</span></td>
          <td><span class="badge ${b.status}">${b.status.replace('_', '-')}</span></td>
          <td><div class="actions">${b.status === 'confirmed' ? `
            ${b.started ? '<button class="btn btn-sm" data-status="completed">Complete</button><button class="btn btn-ghost btn-sm" data-status="no_show">No-show</button>' : ''}
            <button class="btn btn-danger btn-sm" data-status="cancelled">Cancel</button>` : ''}</div></td>
        </tr>`).join('')}</tbody></table></div>`;
  };

  const actionCount = () => bookings.filter((b) => b.status === 'confirmed' && b.started).length;

  return {
    html: `
    <div class="wrap">
      <div class="page-head p-head">
        ${avatar(p, 'lg')}
        <div><h1 style="margin:0">${esc(p.name)}</h1><div class="muted">${esc(catName(p.category))} · ${esc(p.area)}</div></div>
        <div class="actions"><a class="btn btn-ghost btn-sm" href="#/p/${esc(p.slug)}">View public page</a></div>
      </div>
      <div class="card pad" style="margin-bottom:22px">
        <h3>Your booking link</h3>
        <div class="share-box"><code>${esc(shareUrl(p.slug))}</code><button class="btn btn-sm" id="copyLink">Copy link</button></div>
        <p class="muted small" style="margin:6px 0 0">Share it anywhere. Customers can see your services, pick a time and pay.</p>
      </div>
      <div class="stat-grid" id="stats">${statsHtml()}</div>
      <div class="card pad">
        <div class="tabs" id="dashTabs">
          <button data-tab="upcoming" class="active">Upcoming</button>
          <button data-tab="action">Needs update <span id="actionCount">${actionCount() ? `(${actionCount()})` : ''}</span></button>
          <button data-tab="history">History</button>
        </div>
        <div id="rows">${rowsHtml()}</div>
      </div>
    </div>`,
    mount() {
      $('#copyLink').addEventListener('click', () => copy(shareUrl(p.slug)));
      const redraw = () => {
        $('#rows').innerHTML = rowsHtml();
        $('#stats').innerHTML = statsHtml();
        $('#actionCount').textContent = actionCount() ? `(${actionCount()})` : '';
      };
      $('#dashTabs').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        tab = btn.dataset.tab;
        $$('#dashTabs button').forEach((b) => b.classList.toggle('active', b === btn));
        redraw();
      });
      $('#rows').addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-status]');
        if (!btn) return;
        const bid = btn.closest('tr').dataset.id;
        const b = bookings.find((x) => x.id === bid);
        if (btn.dataset.status === 'cancelled' && !window.confirm(`Cancel ${b.customer.name}'s booking? ${b.payment.method === 'card' ? 'Their card payment will be refunded.' : ''}`)) return;
        try {
          const updated = await api(`/manage/${p.id}/bookings/${bid}`, { method: 'POST', headers, body: { status: btn.dataset.status } });
          bookings = bookings.map((x) => (x.id === bid ? updated : x));
          redraw();
          toast('Booking updated');
        } catch (err) { toast(err.message); }
      });
    },
  };
}

function notFoundView() {
  return { html: `<div class="wrap confirm"><h1>Page not found</h1><p class="muted">That page doesn't exist.</p><a href="#/" class="btn">Go home</a></div>` };
}

// ---------- router ----------

const routes = [
  [/^\/?$/, homeView],
  [/^\/search$/, searchView],
  [/^\/p\/([\w-]+)$/, providerView],
  [/^\/book\/([\w-]+)\/([\w-]+)$/, bookView],
  [/^\/bookings$/, bookingsView],
  [/^\/join$/, joinView],
  [/^\/dashboard(?:\/([\w-]+))?$/, dashboardView],
];

let renderId = 0;
async function render() {
  const id = ++renderId;
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs || '');
  const app = $('#app');
  const match = routes.map(([re, view]) => [path.match(re), view]).find(([m]) => m);
  const [m, view] = match || [[], notFoundView];

  closeMenu();
  updateNav(path);
  app.innerHTML = '<div class="loading">Loading…</div>';
  let result;
  try {
    result = await view(m.slice(1), params);
  } catch (err) {
    result = { html: `<div class="wrap confirm"><h1>Something went wrong</h1><p class="muted">${esc(err.message)}</p><a href="#/" class="btn">Go home</a></div>` };
  }
  if (id !== renderId || !result) return; // a newer navigation took over
  app.innerHTML = result.html;
  if (result.mount) result.mount();
  window.scrollTo(0, 0);
}

function updateNav(path = (location.hash.slice(1) || '/').split('?')[0]) {
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', path.startsWith(a.dataset.nav)));
  $('#dashLink').hidden = !Object.keys(store.get('nb_keys', {})).length;
}

function closeMenu() { $('#nav').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }
$('#menuBtn').addEventListener('click', () => {
  const open = $('#nav').classList.toggle('open');
  $('#menuBtn').setAttribute('aria-expanded', String(open));
});

(async function init() {
  try { CONFIG = await api('/config'); } catch { /* fall back to defaults */ }
  document.title = `${CONFIG.brand} — Book trusted local services`;
  $$('.brand-name').forEach((el) => (el.textContent = CONFIG.brand));
  window.addEventListener('hashchange', render);
  render();
})();
