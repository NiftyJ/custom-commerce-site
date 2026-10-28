// Nearbook single-page app: hash router + views. No framework, no build step.

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = (n) => String(n).padStart(2, '0');
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

let CONFIG = { brand: 'Nearbook', currency: 'GHS', depositPercent: 30, whatsapp: false, countryCode: '233', categories: [], regions: [], areas: [] };

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

// narrowSymbol shows cedis the local way (GH₵450) rather than "GHS 450".
const amount = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: CONFIG.currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const money = (n) => (n === 0 ? 'Free' : amount(n));
// Same formula as server.js, so the deposit shown at checkout is the one recorded.
const depositFor = (price) => Math.min(price, Math.ceil(Math.round(price * CONFIG.depositPercent) / 100));
const payBadge = (pay) => `<span class="badge ${esc(pay.status)}">${pay.method === 'none' ? 'free' : esc(pay.status.replace('_', ' '))}</span>`;
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
// Providers without their own photo (new sign-ups) borrow their category's photo.
const photoFor = (p) => p.photo || `/img/cat-${p.category}.jpg`;
const stars = (rating) => `<span class="stars" style="--r:${((rating || 0) / 5) * 100}%" aria-label="${rating || 0} out of 5">★★★★★</span>`;
const shareUrl = (slug) => `${location.origin}/p/${slug}`;
// wa.me click-to-chat link for a local or international number (same rules as whatsapp.js on the server).
function waLink(phone) {
  const raw = String(phone || '').trim();
  let d = raw.replace(/\D/g, '');
  if (!raw.startsWith('+')) {
    if (d.startsWith('00')) d = d.slice(2);
    else if (d.startsWith('0')) d = CONFIG.countryCode + d.slice(1);
    else if (d.length === 9) d = CONFIG.countryCode + d;
  }
  return d.length >= 11 && d.length <= 15 ? `https://wa.me/${d}` : '';
}

// <option>s for an area <select>, grouped by region. In search, a region's own option covers all of its areas.
const areaOptions = (selected, { regionWide = true } = {}) => CONFIG.regions.map((r) => `
  <optgroup label="${esc(r.name)}">
    ${regionWide ? `<option value="${esc(r.name)}" ${selected === r.name ? 'selected' : ''}>All of ${esc(r.name)}</option>` : ''}
    ${r.areas.map((a) => `<option ${selected === a ? 'selected' : ''}>${esc(a)}</option>`).join('')}
  </optgroup>`).join('');

// ---------- saved (favourite) providers ----------
// Kept in this browser. The server only gets an anonymous per-device count for the business dashboard.

const favs = {
  list: () => store.get('nb_favs', []),
  has: (id) => favs.list().includes(id),
  toggle(id) {
    const list = favs.list();
    const saved = !list.includes(id);
    store.set('nb_favs', saved ? [...list, id] : list.filter((x) => x !== id));
    return saved;
  },
};

function deviceId() {
  let id = store.get('nb_device', '');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    store.set('nb_device', id);
  }
  return id;
}

// The label spans let the provider page show "Save"/"Saved" text; cards show just the heart.
const favButton = (p, cls = '') => {
  const on = favs.has(p.id);
  return `<button type="button" class="fav-btn ${cls} ${on ? 'on' : ''}" data-fav="${esc(p.id)}" aria-pressed="${on}" aria-label="Save ${esc(p.name)} to favourites">
    ${icon('heart', 20)}<span class="when-off">Save</span><span class="when-on">Saved</span></button>`;
};

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
  'hair-beauty': '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
  'spa-wellness': '<path d="M12 21c-4.4-1.6-8-5.4-8-10 3.4 0 6.2 1.6 8 4.2 1.8-2.6 4.6-4.2 8-4.2 0 4.6-3.6 8.4-8 10z"/><path d="M12 15.2C10.2 11.8 10.6 6.6 12 3c1.4 3.6 1.8 8.8 0 12.2"/>',
  'laundry-cleaning': '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4.5"/><path d="M8 6.5h.01M11 6.5h.01"/>',
  'home-repair': '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.8-3.8a6 6 0 01-7.9 7.9l-6.9 6.9a2.1 2.1 0 01-3-3l6.9-6.9a6 6 0 017.9-7.9l-3.8 3.8z"/>',
  'waste-collection': '<path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13M10 11v6M14 11v6"/>',
  'photo-video': '<path d="M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
  'moving-delivery': '<path d="M2 6h11v10H2zM13 10h4l4 4v2h-8"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
  'appliance-phone-repair': '<rect x="6.5" y="2.5" width="11" height="19" rx="2"/><path d="M10.5 18.5h3"/>',
  'events-entertainment': '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  'gardening-outdoor': '<path d="M12 21v-9"/><path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7zM12 14.5c0-3.5 2.5-6 7-6 0 3.5-2.5 6-7 6z"/>',
  'student-academic': '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  pin: '<path d="M12 21s-7-6.1-7-11.5A7 7 0 0119 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  heart: '<path d="M12 20.5s-7.6-4.6-9.3-9.5C1.5 7.5 3.9 4 7.4 4c2 0 3.6 1.1 4.6 2.7C13 5.1 14.6 4 16.6 4c3.5 0 5.9 3.5 4.7 7-1.7 4.9-9.3 9.5-9.3 9.5z"/>',
  chat: '<path d="M20.5 11.6a8.5 8.5 0 01-12.6 7.5L3.5 20.5l1.4-4.3a8.5 8.5 0 1115.6-4.6z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.8-1-.9.8a4 4 0 01-2.4-2.4l.8-.9-1-1.8z"/>',
};
const icon = (name, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

// The heart sits outside the link (a button can't go inside an <a>) and is positioned over the card.
function providerCard(p) {
  return `<div class="pcard-wrap">
  <a class="card pcard" href="#/p/${esc(p.slug)}">
    <div class="pcard-media" style="--c:${esc(p.color)}">
      ${icon(p.category, 44)}
      <img src="${esc(photoFor(p))}" alt="" loading="lazy" onerror="this.remove()">
      ${p.rating ? `<span class="pcard-rating">★ ${p.rating.toFixed(1)}</span>` : ''}
      <span class="chip">${esc(catName(p.category))}</span>
    </div>
    <div class="pcard-body">
      ${avatar(p)}
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
  </a>
  ${favButton(p)}
  </div>`;
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
  const popular = ['Knotless braids', 'Skin fade', 'Laundry', 'Okada delivery', 'Phone repair', 'DJ', 'WASSCE prep'];
  const totalProviders = CONFIG.categories.reduce((s, c) => s + (c.count || 0), 0);
  // Kente-inspired sticker colours: gold, green, red, earth, indigo, plum.
  const tints = ['#fde3a7', '#d4eadc', '#f9d4c8', '#f1e1c8', '#d8e4ef', '#ecdcef'];
  const inks = ['#9a6400', '#0b6e4f', '#b3311a', '#7a4a1e', '#1f5f8b', '#6d3b8c'];
  const faqs = [
    ['Do I have to pay when I book?', `Only a deposit. You make an initial deposit (${CONFIG.depositPercent}% of the price) to secure your booking, then complete payment after the service.`],
    ['Can I cancel or move a booking?', 'Yes. Cancelling is free until your appointment starts, and your deposit is refunded. Open My bookings, cancel, then pick a new time.'],
    ['Can someone come to my home?', 'Many providers offer home visits. Tick "Comes to me" in search and choose Home visit at checkout. Then add your address.'],
    ['Are the reviews real?', `Only customers who booked through ${esc(CONFIG.brand)} can leave a review, and only after their appointment. Look for the "Booked on ${esc(CONFIG.brand)}" label.`],
    ['Do I need an account?', 'No. Your confirmation and bookings are linked to the email you book with. Enter it in My bookings to see your appointments. Tap the ♥ on any provider to save them for later.'],
    ['I run a business. What does it cost to list?', 'Creating your booking page is free. Add your services, prices and hours, and you\'ll get a link you can share right away.'],
  ];
  const lead = providers[0];
  const leadSvc = lead && lead.priceFrom ? money(lead.priceFrom) : money(150);
  const week = nextDays(5);

  return {
    html: `
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <span class="chip">${icon('pin', 14)} Akwaaba! Local pros across Accra & Kumasi</span>
          <h1>Book <em>local</em> pros without the back&#8209;and&#8209;forth.</h1>
          <p class="lead">Braiders and barbers, laundry, plumbers, okada errands, DJs, tutors and more. See real prices and open times, pick a slot and secure it with a small deposit. Many of these providers don't have a website of their own.</p>
          <form class="searchbar" id="heroSearch">
            <div class="field">${icon('search')}<input name="q" placeholder="What service do you need?" aria-label="Service"></div>
            <div class="field">${icon('pin')}<select name="area" aria-label="Area"><option value="">Choose your area</option>${areaOptions()}</select></div>
            <button class="btn">Explore Services</button>
          </form>
          <div class="popular"><span class="muted small">Popular:</span>${popular.map((t) => `<a href="#/search?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="hero-block"></div>
          <figure class="hero-photo"><img src="/img/hero-braids.jpg" alt="" width="1200" height="1600" fetchpriority="high"></figure>
          <figure class="hero-inset"><img src="/img/hero-adonko.jpg" alt="" loading="lazy"></figure>
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
              ${icon(c.id, 64)}
              <img src="/img/cat-${esc(c.id)}.jpg" alt="" loading="lazy" onerror="this.remove()">
              <span class="cat-sticker">${icon(c.id, 22)}<b>${c.count}</b> provider${c.count === 1 ? '' : 's'}</span>
            </div>
            <h3>${esc(c.name)}</h3>
            <p>${esc(c.description)}</p>
            <span class="more">See providers <span aria-hidden="true">→</span></span>
          </a>`).join('')}
      </div>
    </section>

    <section class="top-band">
      <div class="wrap">
        <div class="section-head"><div><h2>Top-rated near you</h2><p>Highly reviewed by customers who booked through ${esc(CONFIG.brand)}.</p></div><a href="#/search" class="btn btn-outline btn-sm">See all providers</a></div>
        <div class="grid top-grid">${providers.map(providerCard).join('')}</div>
      </div>
    </section>

    <section class="block wrap split">
      <div>
        <span class="pill">${icon('clock', 18)}</span>
        <h2 class="display">How it works</h2>
        <p class="lead-sm">No calls, no waiting for a reply to your DM. Here's how you get from "I need a trim" to booked.</p>
        <ol class="numbered">
          <li><span>1</span><div><b>Discover.</b> Search by service and area, compare prices and read verified reviews.</div></li>
          <li><span>2</span><div><b>Book a real slot.</b> Live availability means the time you pick is actually free.</div></li>
          <li><span>3</span><div><b>Pay a deposit.</b> Make your initial deposit to secure your booking, and complete payment after the service.</div></li>
          <li><span>4</span><div><b>Review.</b> After your appointment, help others find great local pros.</div></li>
        </ol>
      </div>
      <div class="process-art" aria-hidden="true">
        <img src="/img/process-makeup.jpg" alt="" loading="lazy">
        <div class="ticket">
          <div class="ticket-top"><span class="confirm-dot">${icon('check', 22)}</span><div><b>Booking confirmed</b><div class="muted small">Ref <span class="ref">NB-7K2Q</span></div></div></div>
          <div class="summary-line"><span>Service</span><b>Soft glam makeup</b></div>
          <div class="summary-line"><span>When</span><span>${fmtDate(week[2].iso)} · ${fmtTime('11:30')}</span></div>
          <div class="summary-line"><span>Where</span><span>Home visit</span></div>
          <div class="summary-line"><span>Payment</span><span class="badge deposit_paid">deposit paid</span></div>
        </div>
        <div class="ticket ticket-back"><b>How was your soft glam?</b><div class="stars" style="--r:80%;font-size:1.4rem;margin:8px 0;display:block">★★★★★</div><span class="muted small">Your review helps neighbours choose.</span></div>
      </div>
    </section>

    <section class="wrap">
      <div class="band">
        <img src="/img/band-oxford-street.jpg" alt="" loading="lazy">
        <div><span class="band-areas">${CONFIG.areas.slice(0, 8).map(esc).join(' · ')}</span><h2>Your neighbourhood, open for booking.</h2></div>
        <div class="band-stats">
          <div><b>${totalProviders}</b><span>local providers</span></div>
          <div><b>${CONFIG.categories.length}</b><span>categories</span></div>
          <div><b>${CONFIG.areas.length}</b><span>areas covered</span></div>
        </div>
      </div>
    </section>

    <section class="block wrap split split-rev">
      <div class="biz-art" aria-hidden="true">
        <img src="/img/biz-makola-trader.jpg" alt="" loading="lazy">
        <div class="mock-page">
          <div class="mock-url">${esc(location.host)}/p/your-business</div>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px"><div class="avatar" style="--c:#0b6e4f">YB</div><div><b>Your Business</b><div class="muted small">★ 5.0 · Your area</div></div></div>
          <div class="mock-row"><span>Signature service</span><b>${money(150)}</b></div>
          <div class="mock-row"><span>Premium service</span><b>${money(300)}</b></div>
          <div class="mock-row"><span>Home visit</span><b>${money(200)}</b></div>
          <div class="btn btn-block" style="margin-top:10px">Book now</div>
        </div>
      </div>
      <div>
        <span class="pill">${icon('share', 18)}</span>
        <h2 class="display">No website? No&nbsp;problem.</h2>
        <p class="lead-sm">Get a free booking page your customers can use straight away. Put it in your Instagram bio, WhatsApp status or TikTok and take bookings around the clock.</p>
        <ul class="ticks">
          <li>${icon('check', 18)} Your own link with services, prices and hours</li>
          <li>${icon('check', 18)} Deposits that secure every booking</li>
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
        <p class="muted">${active ? esc(active.description) : 'Find and book trusted providers in your area.'}${params.get('area') ? ` Showing <b>${esc(params.get('area'))}</b>.` : ''}</p>
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
          <label>Area<select name="area"><option value="">Choose your area</option>${areaOptions(params.get('area'))}</select></label>
          <label>Starting price<select name="maxPrice"><option value="">Any price</option>${[50, 100, 250, 500].map((n) => `<option value="${n}" ${sel('maxPrice', String(n))}>Up to ${money(n)}</option>`).join('')}</select></label>
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
      // On phones the pills scroll sideways; bring the selected category into view.
      const pills = $('.cat-pills');
      const current = $('.cat-pills a.active');
      document.fonts.ready.then(() => { pills.scrollLeft += current.getBoundingClientRect().left - pills.getBoundingClientRect().left - 16; });
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
        <div class="p-cover" style="--c:${esc(p.color)}">${icon(p.category, 56)}<img src="${esc(photoFor(p))}" alt="" onerror="this.remove()"></div>
        <div class="p-head">
          ${avatar(p, 'xl')}
          <div>
            <div class="meta" style="margin-bottom:6px"><span class="chip">${esc(catName(p.category))}</span>${p.verified ? `<span class="tag">${icon('shield', 14)} Verified</span>` : ''}${p.homeVisit ? `<span class="tag">${icon('home', 14)} Home visits</span>` : ''}</div>
            <h1>${esc(p.name)}</h1>
            <div class="meta">${p.rating ? `${stars(p.rating)} <b>${p.rating.toFixed(1)}</b> <span class="muted">(${p.reviewCount} reviews)</span>` : '<span class="muted">No reviews yet</span>'} <span class="sep">•</span> ${icon('pin', 16)} ${esc(p.area)}</div>
          </div>
          <div class="actions">${favButton(p, 'fav-inline btn btn-ghost btn-sm')}<button class="btn btn-ghost btn-sm" id="shareBtn">${icon('share', 16)} Share</button></div>
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
  const deposit = depositFor(svc.price);
  const balance = Math.round((svc.price - deposit) * 100) / 100;
  const submitLabel = free ? 'Confirm booking' : `Pay ${money(deposit)} deposit & book`;

  const summaryHtml = () => `
    <div class="summary-prov">${avatar(p)}<div><b>${esc(p.name)}</b><div class="muted small">${esc(p.area)}</div></div></div>
    <div class="summary-line"><span>Service</span><b style="text-align:right">${esc(svc.name)}</b></div>
    <div class="summary-line"><span>Duration</span><span>${fmtDuration(svc.duration)}</span></div>
    <div class="summary-line"><span>Date</span><span>${state.date ? fmtDate(state.date, { weekday: 'long', month: 'long', day: 'numeric' }) : '—'}</span></div>
    <div class="summary-line"><span>Time</span><span>${state.time ? fmtTime(state.time) : '—'}</span></div>
    <div class="summary-line summary-total"><span>Total</span><span>${money(svc.price)}</span></div>
    ${free ? '' : `<div class="summary-line"><span>Deposit to book</span><b>${money(deposit)}</b></div>
    <div class="summary-line"><span>Pay after service</span><span>${money(balance)}</span></div>`}
    <div class="secure">${icon('shield', 16)} Free cancellation until your appointment starts${free ? '' : ', and your deposit is refunded'}.</div>`;

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
              <label>Phone / WhatsApp<input name="phone" type="tel" autocomplete="tel" value="${esc(saved.phone || '')}" placeholder="024 123 4567"></label>
            </div>
            ${CONFIG.whatsapp ? `<label class="check wa-opt"><input type="checkbox" name="whatsapp" ${saved.whatsapp ? 'checked' : ''}> ${icon('chat', 18)} Send my confirmation and a reminder on WhatsApp</label>` : ''}
            <label>Email <span class="hint">· your confirmation goes here</span><input name="email" type="email" required autocomplete="email" value="${esc(saved.email || store.get('nb_email', ''))}"></label>
            <label>Notes for the provider <span class="hint">(optional)</span><textarea name="notes" placeholder="Hair length, allergies, access instructions…"></textarea></label>

            <div class="step-title" style="margin-top:10px"><span class="num">4</span><h2>${free ? 'Payment' : 'Deposit'}</h2></div>
            ${free ? '<p class="muted">This service is free, so you don\'t need to pay anything.</p>' : `
            <p class="muted">Make your initial deposit to secure your booking, and complete payment after the service.</p>
            <div class="deposit-box">
              <div class="summary-line"><span>Deposit now (${CONFIG.depositPercent}%)</span><b>${money(deposit)}</b></div>
              <div class="summary-line"><span>Balance after service</span><span>${money(balance)}</span></div>
            </div>
            <div class="demo-note">Demo checkout: no money is charged yet.</div>`}
            <button class="btn btn-block" id="submitBtn">${submitLabel}</button>
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
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(form));
        const showError = (msg) => { $('#formError').innerHTML = errorBox(msg); $('#formError').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
        if (!state.date || !state.time) return showError('Please choose a date and time.');
        if (!fd.name || !fd.name.trim()) return showError('Please enter your name.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email || '')) return showError('Please enter a valid email address.');
        const whatsapp = fd.whatsapp === 'on';
        if (whatsapp && !(fd.phone || '').trim()) return showError('Please enter your WhatsApp number, or untick WhatsApp updates.');
        const location = fd.location || 'venue';
        if (location === 'home' && !(fd.address || '').trim()) return showError('Please enter the address for your home visit.');

        const btn = $('#submitBtn');
        btn.disabled = true;
        btn.textContent = free ? 'Booking…' : 'Processing deposit…';
        try {
          const booking = await api('/bookings', {
            method: 'POST',
            body: {
              providerId: p.id, serviceId: svc.id, date: state.date, time: state.time, location,
              address: fd.address, notes: fd.notes,
              customer: { name: fd.name, email: fd.email, phone: fd.phone, whatsapp },
            },
          });
          store.set('nb_customer', { name: fd.name, email: fd.email, phone: fd.phone, whatsapp, address: fd.address || saved.address || '' });
          store.set('nb_email', fd.email.trim().toLowerCase());
          showConfirmation(booking);
        } catch (err) {
          btn.disabled = false;
          btn.textContent = submitLabel;
          showError(err.message);
          if (err.status === 409) { state.time = null; refreshSummary(); loadSlots(); }
        }
      });
    },
  };
}

function showConfirmation(b) {
  const where = b.location === 'home' ? `Home visit: ${b.address}` : (b.provider.address || 'At the venue');
  const payLabel = b.payment.method === 'deposit'
    ? `Deposit of ${money(b.payment.deposit)} paid.${b.payment.balance ? ` Pay the remaining ${money(b.payment.balance)} after your service.` : ''}`
    : 'Free, nothing to pay';
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
        <div class="summary-line"><span>Payment</span><span>${payBadge(b.payment)}</span></div>
        <p class="muted small" style="margin:10px 0 0">${esc(payLabel)}</p>
        ${b.customer.whatsapp ? `<p class="muted small" style="margin:6px 0 0">${icon('chat', 14)} We'll send your confirmation and a reminder the day before on WhatsApp.</p>` : ''}
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
          ${payBadge(b.payment)}
          <span>${b.status === 'confirmed' && b.payment.status === 'deposit_paid' && b.payment.balance ? `${money(b.price)} · ${money(b.payment.balance)} due after service` : money(b.price)}</span>
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
          if (!window.confirm(`Cancel ${b.serviceName} on ${fmtDate(b.date)}?${b.payment.status === 'deposit_paid' ? ' Your deposit will be refunded.' : ''}`)) return;
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
            <label>Business name<input name="name" required placeholder="e.g. Akosua's Braid Studio" maxlength="80" value="${esc(params.get('name') || '')}"></label>
            <label>Category<select name="category" id="catSelect" required>
              <option value="">Choose the one that fits best</option>
              ${CONFIG.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}
            </select><span class="hint" id="catHint">Customers browse by category, so pick the closest match.</span></label>
            <label>Tagline <span class="hint">(one line about what you do)</span><input name="tagline" maxlength="120" placeholder="e.g. Neat, long-lasting braids for all ages"></label>
            <label>About <span class="hint">(optional)</span><textarea name="about" maxlength="1500" placeholder="Experience, specialities, what to expect…"></textarea></label>
          </section>

          <section class="card form-section">
            <h2>Location & contact</h2><p class="muted">Customers search by area.</p>
            <div class="row">
              <label>Area / neighbourhood<select name="area" required><option value="">Choose your area</option>${areaOptions('', { regionWide: false })}</select><span class="hint">Not listed? Pick the closest one.</span></label>
              <label>Phone / WhatsApp<input name="phone" type="tel" required placeholder="024 123 4567"></label>
            </div>
            ${CONFIG.whatsapp ? `<label class="check wa-opt"><input type="checkbox" name="whatsapp" checked> ${icon('chat', 18)} Send new bookings and my dashboard link to this WhatsApp number</label>` : ''}
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
            <div>${icon('shield', 18)}<span><b>Fewer no-shows.</b> Customers pay a deposit to secure their booking and the balance after the service</span></div>
            <div>${icon('search', 18)}<span><b>Get discovered</b> by new customers searching your area</span></div>
          </div>
        </aside>
      </div>
    </div>`,

    mount() {
      const form = $('#joinForm');
      $('#catSelect').addEventListener('change', (e) => {
        const c = CONFIG.categories.find((x) => x.id === e.target.value);
        $('#catHint').textContent = c ? c.description : 'Customers browse by category, so pick the closest match.';
      });
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
              area: fd.get('area'), phone: fd.get('phone'), whatsapp: fd.get('whatsapp') === 'on', address: fd.get('address'), homeVisit: fd.get('homeVisit') === 'on',
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
        <p class="muted small">This link lets you manage your bookings. Keep it safe and don't share it. It's also saved in this browser${p.whatsapp ? ', and we\'ve sent it to your WhatsApp' : ''}.</p>
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
        <div class="page-head"><h1>Business dashboard</h1><p class="muted">See your bookings, earnings and customers, and how many people saved your business.</p></div>
        ${ids.length ? `<div class="card pad" style="margin-bottom:18px"><h3>Your businesses on this device</h3>${ids.map((i) => `<p><a href="#/dashboard/${esc(i)}">${esc(keys[i].name)}</a></p>`).join('')}</div>` : ''}
        <form class="card pad" id="linkForm" style="margin-bottom:18px">
          <h3>Sign in on this device</h3>
          <p class="muted small">Paste the private dashboard link you got when you listed your business.</p>
          <div id="linkError"></div>
          <label>Dashboard link<input name="link" required autocomplete="off" placeholder="${esc(location.host)}/#/dashboard/…?key=…"></label>
          <button class="btn">Open my dashboard</button>
        </form>
        ${CONFIG.whatsapp ? `
        <form class="card pad" id="recoverForm" style="margin-bottom:18px">
          <h3>Lost your link?</h3>
          <p class="muted small">We'll send it on WhatsApp to the phone number on your listing.</p>
          <div id="recoverMsg"></div>
          <label>Phone / WhatsApp<input name="phone" type="tel" required placeholder="024 123 4567"></label>
          <button class="btn btn-ghost">${icon('chat', 18)} Send my link</button>
        </form>` : ''}
        <div class="card pad"><h3>Not listed yet?</h3><p class="muted">Create a free booking page in a few minutes.</p><a class="btn" href="#/join">List your business</a></div>
      </div>`,
      mount() {
        $('#linkForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const m = new FormData(e.target).get('link').match(/dashboard\/([\w-]+)\?key=([^&\s]+)/);
          if (!m) { $('#linkError').innerHTML = errorBox('That isn\'t a dashboard link. It ends with "?key=" and your private key.'); return; }
          location.hash = `#/dashboard/${m[1]}?key=${m[2]}`;
        });
        const recover = $('#recoverForm');
        if (recover) {
          recover.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = $('button', recover);
            btn.disabled = true;
            try {
              await api('/manage/recover', { method: 'POST', body: { phone: new FormData(recover).get('phone') } });
              $('#recoverMsg').innerHTML = '<div class="form-ok" role="status">If that number is on a listing, your link is on its way to WhatsApp.</div>';
            } catch (err) { $('#recoverMsg').innerHTML = errorBox(err.message); }
            btn.disabled = false;
          });
        }
      },
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

  // Money actually received: the full price once paid, otherwise the deposit (also kept after a no-show).
  const received = (b) => (b.payment.status === 'paid' ? b.price : b.payment.status === 'deposit_paid' ? b.payment.deposit : 0);
  const live = () => bookings.filter((b) => b.status !== 'cancelled');

  // One row per customer (matched by email), newest first.
  const customers = () => {
    const byEmail = new Map();
    for (const b of live()) {
      const c = byEmail.get(b.customer.email) || { visits: 0, spent: 0, last: '' };
      c.visits++;
      c.spent += received(b);
      if (b.date >= c.last) Object.assign(c, { last: b.date, name: b.customer.name, phone: b.customer.phone, email: b.customer.email });
      byEmail.set(b.customer.email, c);
    }
    return [...byEmail.values()].sort((a, b) => b.last.localeCompare(a.last));
  };

  const statsHtml = () => {
    const upcoming = bookings.filter((b) => b.status === 'confirmed' && !b.started);
    const month = isoDate(new Date()).slice(0, 7);
    const earned = live().filter((b) => b.date.startsWith(month)).reduce((s, b) => s + received(b), 0);
    const due = upcoming.filter((b) => b.payment.status === 'deposit_paid').reduce((s, b) => s + b.payment.balance, 0);
    const people = customers();
    const regulars = people.filter((c) => c.visits > 1).length;
    return `
      <div class="card stat"><div class="label">Upcoming appointments</div><div class="value">${upcoming.length}</div></div>
      <div class="card stat"><div class="label">Received this month</div><div class="value">${amount(earned)}</div><div class="muted small">Deposits and balances</div></div>
      <div class="card stat"><div class="label">To collect after service</div><div class="value">${due ? money(due) : '—'}</div></div>
      <div class="card stat"><div class="label">Rating</div><div class="value">${p.rating ? `${p.rating.toFixed(1)} ★` : '—'}</div><div class="muted small">${p.reviewCount} reviews</div></div>
      <div class="card stat"><div class="label">Customers</div><div class="value">${people.length}</div><div class="muted small">${regulars} came back more than once</div></div>
      <div class="card stat"><div class="label">Saved by</div><div class="value">${data.favorites} ${icon('heart', 20)}</div><div class="muted small">${data.favorites === 1 ? 'person has' : 'people have'} you in their favourites</div></div>`;
  };

  // Column chart of bookings by appointment month. Only the latest month is labelled on the bar;
  // hovering or focusing any month shows its count.
  const chartHtml = () => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = isoDate(d).slice(0, 7);
      return { label: d.toLocaleDateString(undefined, { month: 'short' }), long: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), count: live().filter((b) => b.date.startsWith(key)).length };
    });
    const max = Math.max(1, ...months.map((m) => m.count));
    const step = 10 ** Math.floor(Math.log10(max / 2 || 1));
    const half = Math.max(1, [1, 2, 5, 10].map((n) => n * step).find((v) => v >= max / 2));
    const top = half * 2;
    const plural = (n) => `${n} booking${n === 1 ? '' : 's'}`;
    return `
      <div class="chart">
        <div class="chart-grid" aria-hidden="true">${[top, half, 0].map((v) => `<span style="--y:${(v / top) * 100}%"><i>${v}</i></span>`).join('')}</div>
        <ul class="chart-cols">
          ${months.map((m, i) => `
            <li tabindex="0" aria-label="${esc(m.long)}: ${plural(m.count)}">
              <div class="col-track"><div class="col" style="--h:${(m.count / top) * 100}%">${i === months.length - 1 ? `<b class="col-val">${m.count}</b>` : ''}</div></div>
              <span class="col-label">${esc(m.label)}</span>
              <span class="col-tip" aria-hidden="true">${esc(m.long)}<b>${plural(m.count)}</b></span>
            </li>`).join('')}
        </ul>
      </div>`;
  };

  const topServicesHtml = () => {
    const by = new Map();
    for (const b of live()) {
      const s = by.get(b.serviceName) || { name: b.serviceName, count: 0, earned: 0 };
      s.count++;
      s.earned += received(b);
      by.set(b.serviceName, s);
    }
    const list = [...by.values()].sort((a, b) => b.count - a.count || b.earned - a.earned).slice(0, 5);
    if (!list.length) return '<p class="muted">Your most-booked services will show here once customers start booking.</p>';
    return `<table class="list"><thead><tr><th>Service</th><th class="num">Bookings</th><th class="num">Received</th></tr></thead>
      <tbody>${list.map((s) => `<tr><td>${esc(s.name)}</td><td class="num">${s.count}</td><td class="num">${amount(s.earned)}</td></tr>`).join('')}</tbody></table>`;
  };

  // Phone numbers become "chat on WhatsApp" links (wa.me click-to-chat, no API needed).
  const contactHtml = (c) => {
    const wa = waLink(c.phone);
    return wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener" class="wa-link">${icon('chat', 14)} ${esc(c.phone)}</a>` : esc(c.phone || c.email);
  };

  const customersHtml = () => {
    const list = customers();
    if (!list.length) return '<div class="empty"><p class="muted">Customers who book with you will appear here, with their contact details and how often they come back.</p></div>';
    return `<div class="table-wrap"><table class="list">
      <thead><tr><th>Customer</th><th class="num">Bookings</th><th>Latest</th><th class="num">Paid you</th></tr></thead>
      <tbody>${list.map((c) => `
        <tr>
          <td><b>${esc(c.name)}</b>${c.visits > 1 ? ' <span class="tag">Regular</span>' : ''}<br><span class="small">${contactHtml(c)}</span></td>
          <td class="num">${c.visits}</td>
          <td>${fmtDate(c.last, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
          <td class="num">${amount(c.spent)}</td>
        </tr>`).join('')}</tbody></table></div>`;
  };

  const rowsHtml = () => {
    if (tab === 'customers') return customersHtml();
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
          <td><b>${esc(b.customer.name)}</b><br><span class="muted small">${contactHtml(b.customer)}</span>${b.location === 'home' ? `<br><span class="tag">${icon('home', 12)} ${esc(b.address)}</span>` : ''}${b.notes ? `<br><span class="muted small">“${esc(b.notes)}”</span>` : ''}</td>
          <td>${esc(b.serviceName)}<br><span class="muted small">Ref ${esc(b.ref)}</span></td>
          <td>${money(b.price)}<br>${payBadge(b.payment)}${b.status === 'confirmed' && b.payment.status === 'deposit_paid' && b.payment.balance ? `<br><span class="muted small">${money(b.payment.balance)} after service</span>` : ''}</td>
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
        <p class="muted small" style="margin:6px 0 0">Share it anywhere. Customers can see your services, pick a time and pay a deposit to book.</p>
      </div>
      <div class="stat-grid" id="stats">${statsHtml()}</div>
      <div class="insights">
        <div class="card pad"><h3>Bookings per month</h3><p class="muted small">Last 6 months, by appointment date. Cancellations not counted.</p><div id="chart">${chartHtml()}</div></div>
        <div class="card pad"><h3>Top services</h3><p class="muted small">Your most-booked services and what they've brought in.</p><div id="topServices">${topServicesHtml()}</div></div>
      </div>
      <div class="card pad">
        <div class="tabs" id="dashTabs">
          <button data-tab="upcoming" class="active">Upcoming</button>
          <button data-tab="action">Needs update <span id="actionCount">${actionCount() ? `(${actionCount()})` : ''}</span></button>
          <button data-tab="history">History</button>
          <button data-tab="customers">Customers</button>
        </div>
        <div id="rows">${rowsHtml()}</div>
      </div>
    </div>`,
    mount() {
      $('#copyLink').addEventListener('click', () => copy(shareUrl(p.slug)));
      const redraw = () => {
        $('#rows').innerHTML = rowsHtml();
        $('#stats').innerHTML = statsHtml();
        $('#chart').innerHTML = chartHtml();
        $('#topServices').innerHTML = topServicesHtml();
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
        if (btn.dataset.status === 'cancelled' && !window.confirm(`Cancel ${b.customer.name}'s booking? ${b.payment.status === 'deposit_paid' ? 'Their deposit will be refunded.' : ''}`)) return;
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

async function savedView() {
  const ids = favs.list();
  const { providers } = ids.length ? await api('/providers?limit=100&ids=' + ids.map(encodeURIComponent).join(',')) : { providers: [] };
  providers.sort((a, b) => ids.indexOf(b.id) - ids.indexOf(a.id)); // most recently saved first
  return {
    html: `
    <div class="wrap">
      <div class="page-head">
        <h1>Saved providers</h1>
        <p class="muted">Your favourite places, ready to rebook. Tap the ${icon('heart', 16)} on any provider to add or remove them. Saved on this device.</p>
      </div>
      <div id="savedList">${providers.length
        ? `<div class="grid">${providers.map(providerCard).join('')}</div>`
        : `<div class="card empty"><span class="pill">${icon('heart', 22)}</span><h3>No favourites yet</h3><p class="muted">Tap the heart on a provider you like and they'll show up here, so you can find them again quickly.</p><a href="#/search" class="btn">Explore services</a></div>`}</div>
    </div>`,
  };
}

async function creditsView() {
  const res = await fetch('/img/credits.json');
  if (!res.ok) throw new Error('Could not load photo credits.');
  const credits = await res.json();
  const link = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`;
  return {
    html: `
    <div class="wrap narrow">
      <div class="page-head"><h1>Photo credits</h1><p class="muted">Photos are used under the licences linked below and have been cropped and resized. Thank you to the photographers who share their work openly.</p></div>
      <div class="card pad credits">
        ${credits.map((c) => `
          <div class="credit">
            <img src="${esc(c.file)}" alt="" loading="lazy">
            <div><b>${esc(c.title)}</b><div class="muted small">${esc(c.creator)} · ${link(c.licenseUrl, c.license)} · ${link(c.source, 'Source')}</div></div>
          </div>`).join('')}
      </div>
    </div>`,
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
  [/^\/saved$/, savedView],
  [/^\/join$/, joinView],
  [/^\/dashboard(?:\/([\w-]+))?$/, dashboardView],
  [/^\/credits$/, creditsView],
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
  $('#dashLink').textContent = Object.keys(store.get('nb_keys', {})).length ? 'My business' : 'Business login';
  const count = favs.list().length;
  $('#favCount').textContent = count || '';
  $('#favCount').hidden = !count;
}

// Hearts anywhere on the page. Every copy of the same provider's heart updates together.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-fav]');
  if (!btn) return;
  e.preventDefault();
  const id = btn.dataset.fav;
  const saved = favs.toggle(id);
  $$('[data-fav]').filter((b) => b.dataset.fav === id).forEach((b) => {
    b.classList.toggle('on', saved);
    b.setAttribute('aria-pressed', String(saved));
  });
  toast(saved ? 'Saved to your favourites' : 'Removed from favourites');
  updateNav();
  api(`/providers/${encodeURIComponent(id)}/favorite`, { method: 'POST', body: { device: deviceId(), saved } }).catch(() => { /* the count is best-effort */ });
  // On the Saved page, un-hearting removes the card.
  if (!saved && $('#savedList')) {
    btn.closest('.pcard-wrap').remove();
    if (!$('#savedList .pcard-wrap')) render();
  }
});

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
