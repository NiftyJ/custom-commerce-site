// Nearbook — zero-dependency marketplace server.
// Serves the SPA from /public and a JSON API. Data is stored in Upstash Redis when it's
// configured, otherwise in data/db.json (see storage.js).

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

// Secrets for local development go in .env, which is never committed (see .gitignore).
// On Vercel, set them under Project Settings → Environment Variables instead.
loadEnvFile(path.join(__dirname, '.env'));

const { CATEGORIES, REGIONS, COLORS, seed, slugify } = require('./seed');
const { createStorage } = require('./storage');
const whatsapp = require('./whatsapp');

const PORT = Number(process.env.PORT) || 3000;
const BRAND = process.env.BRAND || 'Nearbook';
const CURRENCY = process.env.CURRENCY || 'GHS';
const DEPOSIT_PERCENT = Math.min(Math.max(Number(process.env.DEPOSIT_PERCENT) || 30, 1), 100);
const PUBLIC_DIR = path.join(__dirname, 'public');
// Serverless hosts (Vercel) only allow file writes to the temp dir, and data there doesn't survive
// cold starts. That's why the live site needs Upstash Redis.
const TEMP_FILE = !process.env.DATA_DIR && Boolean(process.env.VERCEL);
const DATA_DIR = process.env.DATA_DIR || (TEMP_FILE ? path.join(os.tmpdir(), 'nearbook') : path.join(__dirname, 'data'));
const storage = createStorage({ dataFile: path.join(DATA_DIR, 'db.json'), temporary: TEMP_FILE });
const AREAS = REGIONS.flatMap((r) => r.areas);
const SLOT_STEP = 30; // minutes between bookable start times
const LEAD_TIME = 60; // minutes of notice required for same-day bookings
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function loadEnvFile(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

// ---------- storage ----------
// Each API request works on its own fresh copy of the database in `db`. Handlers are synchronous,
// so no other request can swap `db` while one runs. A handler that changes data calls changed();
// run() then saves it, and re-runs the handler on fresh data if another request saved first.

let db = null;
let dirty = false;
let outbox = []; // WhatsApp messages queued by the current handler, sent once its changes are saved
const changed = () => { dirty = true; };

async function loadDb() {
  const snap = await storage.read();
  if (!snap.raw) {
    if (await storage.write(JSON.stringify(seed()), snap.version)) console.log(`Seeded demo data into ${storage.name}`);
    return loadDb();
  }
  const data = JSON.parse(snap.raw);
  data.favorites = data.favorites || [];
  return { data, version: snap.version };
}

async function run(handler, ctx) {
  for (let attempt = 1; ; attempt++) {
    const { data, version } = await loadDb();
    db = data;
    dirty = false;
    outbox = [];
    const result = handler(ctx);
    const mine = { data: db, dirty, outbox };
    if (mine.dirty && !(await storage.write(JSON.stringify(mine.data), version))) {
      if (attempt === 10) fail(503, 'The site is busy right now. Please try again.');
      // Someone else saved first: wait a moment (random, so retries don't collide again) and redo this request on their data.
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 25 * attempt));
      continue;
    }
    await whatsapp.sendAll(mine.outbox);
    return result;
  }
}

// ---------- helpers ----------

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new HttpError(status, message); };

const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isTime = (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const pad = (n) => String(n).padStart(2, '0');
const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const newId = (prefix) => `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
// Whole-unit deposit taken at booking. public/app.js uses the same formula to show it at checkout.
const depositFor = (price) => Math.min(price, Math.ceil(Math.round(price * DEPOSIT_PERCENT) / 100));
const siteUrl = (req) => (process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : `http://${req.headers.host}`)).replace(/\/+$/, '');
const dashboardUrl = (req, p) => `${siteUrl(req)}/#/dashboard/${p.id}?key=${encodeURIComponent(p.manageKey)}`;

function nowLocal() {
  const d = new Date();
  return { date: localDate(d), min: d.getHours() * 60 + d.getMinutes() };
}

function weekday(date) {
  const [y, m, d] = date.split('-').map(Number);
  return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function hasStarted(b) {
  const now = nowLocal();
  return b.date < now.date || (b.date === now.date && toMin(b.time) <= now.min);
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function findProvider(idOrSlug) {
  return db.providers.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || fail(404, 'Provider not found');
}

function publicProvider(p) {
  const reviews = db.reviews.filter((r) => r.providerId === p.id);
  const rating = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : null;
  const { manageKey, linkSentAt, ...rest } = p;
  return { ...rest, rating, reviewCount: reviews.length, priceFrom: Math.min(...p.services.map((s) => s.price)) };
}

function availableSlots(p, service, date) {
  const hours = p.hours[weekday(date)];
  const now = nowLocal();
  if (!hours || date < now.date) return [];
  const [open, close] = hours.map(toMin);
  const minStart = date === now.date ? now.min + LEAD_TIME : 0;
  const taken = db.bookings
    .filter((b) => b.providerId === p.id && b.date === date && b.status === 'confirmed')
    .map((b) => [toMin(b.time), toMin(b.time) + b.duration]);
  const slots = [];
  for (let start = open; start + service.duration <= close; start += SLOT_STEP) {
    if (start < minStart) continue;
    const end = start + service.duration;
    const overlapping = taken.filter(([a, b]) => start < b && end > a).length;
    if (overlapping < (p.capacity || 1)) slots.push(toHHMM(start));
  }
  return slots;
}

function customerBooking(b) {
  const p = db.providers.find((x) => x.id === b.providerId);
  const started = hasStarted(b);
  return {
    ...b,
    provider: p ? { name: p.name, slug: p.slug, phone: p.phone, address: p.address, color: p.color } : null,
    canCancel: b.status === 'confirmed' && !started,
    canReview: !b.reviewed && (b.status === 'completed' || (b.status === 'confirmed' && started)),
  };
}

function bookingRef() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let ref;
  do {
    ref = 'NB-' + Array.from(crypto.randomBytes(6), (x) => alphabet[x % alphabet.length]).join('');
  } while (db.bookings.some((b) => b.ref === ref));
  return ref;
}

function requireManager(req, id) {
  const p = findProvider(id);
  if (!safeEqual(req.headers['x-manage-key'], p.manageKey)) fail(401, 'Invalid manage key');
  return p;
}

// ---------- WhatsApp messages ----------
// Template names and wording are listed in the README; the params below fill {{1}}, {{2}}, …

function notify(phone, template, params) {
  const to = whatsapp.toWhatsApp(phone);
  if (to) outbox.push({ to, template, params });
}

const fmtMoney = (n) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: CURRENCY, currencyDisplay: 'narrowSymbol', minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
function fmtWhen(b) {
  const [y, m, d] = b.date.split('-').map(Number);
  const [h, min] = b.time.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, min)).toLocaleString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
}
const firstName = (b) => b.customer.name.split(/\s+/)[0];
const whereText = (b, p) => (b.location === 'home' ? `Home visit, ${b.address}` : p.address || p.area);
const payText = (b) => (b.payment.method === 'none' ? 'Free' : `${fmtMoney(b.payment.deposit)} deposit paid, ${fmtMoney(b.payment.balance)} after the service`);

// ---------- API routes ----------

const routes = [];
const route = (method, pattern, handler) =>
  routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler });

route('GET', '/api/config', () => ({
  brand: BRAND,
  currency: CURRENCY,
  depositPercent: DEPOSIT_PERCENT,
  whatsapp: whatsapp.enabled(),
  countryCode: whatsapp.countryCode(),
  categories: CATEGORIES.map((c) => ({ ...c, count: db.providers.filter((p) => p.category === c.id).length })),
  regions: REGIONS,
  areas: AREAS,
}));

// Open /api/health after deploying to check the database and WhatsApp are connected.
route('GET', '/api/health', () => ({
  ok: true,
  storage: storage.name,
  dataIsSaved: storage.durable,
  whatsapp: whatsapp.enabled() ? 'on' : 'dry run (messages are only written to the server log)',
  counts: { providers: db.providers.length, bookings: db.bookings.length, reviews: db.reviews.length, favorites: db.favorites.length },
}));

route('GET', '/api/providers', ({ query }) => {
  const terms = (query.get('q') || '').toLowerCase().split(/\s+/).filter(Boolean);
  const category = query.get('category');
  const area = query.get('area');
  const region = REGIONS.find((r) => r.name === area); // a region name covers all of its areas
  const ids = query.get('ids') ? new Set(query.get('ids').split(',')) : null;
  const homeVisit = query.get('homeVisit') === '1';
  const maxPrice = Number(query.get('maxPrice')) || null;
  const sort = query.get('sort') || 'rating';
  const limit = Math.min(Number(query.get('limit')) || 100, 100);

  let list = db.providers
    .filter((p) => !ids || ids.has(p.id))
    .filter((p) => !category || p.category === category)
    .filter((p) => !area || (region ? region.areas.includes(p.area) : p.area === area))
    .filter((p) => !homeVisit || p.homeVisit)
    .filter((p) => {
      if (!terms.length) return true;
      const cat = CATEGORIES.find((c) => c.id === p.category);
      const reg = REGIONS.find((r) => r.areas.includes(p.area));
      const hay = [p.name, p.tagline, p.area, reg && reg.name, cat && cat.name, ...p.services.map((s) => s.name)].join(' ').toLowerCase();
      return terms.every((t) => hay.includes(t));
    })
    .map(publicProvider)
    .filter((p) => !maxPrice || p.priceFrom <= maxPrice);

  const sorters = {
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || b.reviewCount - a.reviewCount,
    price: (a, b) => a.priceFrom - b.priceFrom,
    reviews: (a, b) => b.reviewCount - a.reviewCount,
    new: (a, b) => b.createdAt.localeCompare(a.createdAt),
  };
  list.sort(sorters[sort] || sorters.rating);
  return { total: list.length, providers: list.slice(0, limit) };
});

route('GET', '/api/providers/:id', ({ params }) => {
  const p = findProvider(params.id);
  const reviews = db.reviews
    .filter((r) => r.providerId === p.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ id, name, rating, text, createdAt, bookingId }) => ({ id, name, rating, text, createdAt, verified: !!bookingId }));
  return { ...publicProvider(p), reviews };
});

route('GET', '/api/providers/:id/availability', ({ params, query }) => {
  const p = findProvider(params.id);
  const service = p.services.find((s) => s.id === query.get('service')) || fail(404, 'Service not found');
  const date = query.get('date');
  if (!isDate(date)) fail(400, 'Invalid date');
  return { date, slots: availableSlots(p, service, date) };
});

// Saved (hearted) providers live in the visitor's browser. The server only keeps an anonymous
// per-device record so businesses can see how many people saved them.
route('POST', '/api/providers/:id/favorite', ({ params, body }) => {
  const p = findProvider(params.id);
  const device = str(body.device, 64);
  if (!/^[\w-]{8,64}$/.test(device)) fail(400, 'Invalid device id');
  const i = db.favorites.findIndex((f) => f.providerId === p.id && f.device === device);
  if (body.saved && i < 0) { db.favorites.push({ providerId: p.id, device, createdAt: new Date().toISOString() }); changed(); }
  if (!body.saved && i >= 0) { db.favorites.splice(i, 1); changed(); }
  return { saved: !!body.saved };
});

route('POST', '/api/providers', ({ req, body }) => {
  const name = str(body.name, 80);
  if (name.length < 2) fail(400, 'Business name is required');
  if (!CATEGORIES.some((c) => c.id === body.category)) fail(400, 'Choose a category');
  const area = str(body.area, 60);
  if (!AREAS.includes(area)) fail(400, 'Choose your area from the list');
  const phone = str(body.phone, 30);
  if (!phone) fail(400, 'Phone number is required');
  if (body.whatsapp && !whatsapp.toWhatsApp(phone)) fail(400, 'Enter a valid WhatsApp number, e.g. 024 123 4567');

  if (!Array.isArray(body.services) || !body.services.length) fail(400, 'Add at least one service');
  if (body.services.length > 30) fail(400, 'Up to 30 services allowed');
  const services = body.services.map((s, i) => {
    const sName = str(s && s.name, 80);
    const duration = Math.round(Number(s && s.duration));
    const price = Math.round(Number(s && s.price) * 100) / 100;
    if (!sName) fail(400, `Service ${i + 1}: name is required`);
    if (!(duration >= 15 && duration <= 600)) fail(400, `Service ${i + 1}: duration must be 15–600 minutes`);
    if (!(price >= 0 && price <= 100000)) fail(400, `Service ${i + 1}: invalid price`);
    return { id: `s${i + 1}`, name: sName, duration, price };
  });

  const hours = {};
  for (const d of DAYS) {
    const h = body.hours && body.hours[d];
    if (!h) { hours[d] = null; continue; }
    if (!Array.isArray(h) || !isTime(h[0]) || !isTime(h[1]) || toMin(h[0]) >= toMin(h[1])) fail(400, `Invalid opening hours for ${d}`);
    hours[d] = [h[0], h[1]];
  }
  if (!Object.values(hours).some(Boolean)) fail(400, 'Open at least one day a week');

  const base = slugify(name) || 'provider';
  let slug = base;
  for (let n = 2; db.providers.some((p) => p.slug === slug); n++) slug = `${base}-${n}`;

  const provider = {
    id: newId('p'),
    slug,
    name,
    category: body.category,
    tagline: str(body.tagline, 120),
    about: str(body.about, 1500),
    area,
    address: str(body.address, 200),
    phone,
    whatsapp: !!body.whatsapp,
    homeVisit: !!body.homeVisit,
    capacity: Math.min(Math.max(Math.round(Number(body.capacity)) || 1, 1), 20),
    hours,
    services,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    verified: false,
    manageKey: crypto.randomBytes(18).toString('base64url'),
    createdAt: new Date().toISOString(),
  };
  db.providers.push(provider);
  changed();
  // Send the private dashboard link to their WhatsApp so they can't lose it.
  if (provider.whatsapp) notify(provider.phone, 'dashboard_link', [provider.name, dashboardUrl(req, provider)]);
  return { provider: publicProvider(provider), manageKey: provider.manageKey };
});

route('POST', '/api/bookings', ({ body }) => {
  const p = findProvider(str(body.providerId, 60));
  const service = p.services.find((s) => s.id === body.serviceId) || fail(404, 'Service not found');
  if (!isDate(body.date) || !isTime(body.time)) fail(400, 'Choose a date and time');
  if (!availableSlots(p, service, body.date).includes(body.time)) fail(409, 'Sorry — that time was just taken. Please pick another slot.');

  const c = body.customer || {};
  const customer = { name: str(c.name, 80), email: str(c.email, 120).toLowerCase(), phone: str(c.phone, 30), whatsapp: c.whatsapp === true };
  if (!customer.name) fail(400, 'Your name is required');
  if (!isEmail(customer.email)) fail(400, 'A valid email is required');
  if (customer.whatsapp && !whatsapp.toWhatsApp(customer.phone)) fail(400, 'Enter a valid phone number for WhatsApp updates, e.g. 024 123 4567');

  const location = body.location === 'home' ? 'home' : 'venue';
  if (location === 'home' && !p.homeVisit) fail(400, 'This provider does not offer home visits');
  const address = location === 'home' ? str(body.address, 200) : '';
  if (location === 'home' && !address) fail(400, 'Address is required for a home visit');

  let payment;
  if (service.price === 0) payment = { method: 'none', status: 'paid' };
  else {
    // Demo deposit: a real deployment would confirm the deposit with Paystack/Flutterwave/Stripe here.
    const deposit = depositFor(service.price);
    payment = { method: 'deposit', status: 'deposit_paid', deposit, balance: Math.round((service.price - deposit) * 100) / 100, txn: newId('txn') };
  }

  const booking = {
    id: newId('b'),
    ref: bookingRef(),
    providerId: p.id,
    serviceId: service.id,
    serviceName: service.name,
    duration: service.duration,
    price: service.price,
    date: body.date,
    time: body.time,
    location,
    address,
    notes: str(body.notes, 500),
    customer,
    payment,
    status: 'confirmed',
    reviewed: false,
    createdAt: new Date().toISOString(),
  };
  db.bookings.push(booking);
  changed();
  if (customer.whatsapp) {
    notify(customer.phone, 'booking_confirmed', [firstName(booking), service.name, p.name, fmtWhen(booking), whereText(booking, p), payText(booking), booking.ref]);
  }
  if (p.whatsapp) {
    notify(p.phone, 'new_booking', [p.name, customer.name, customer.phone || customer.email, service.name, fmtWhen(booking), whereText(booking, p), payText(booking), booking.ref]);
  }
  return customerBooking(booking);
});

// Prototype lookup by email. Before launch, gate this behind a login / magic-link.
route('GET', '/api/bookings', ({ query }) => {
  const email = str(query.get('email'), 120).toLowerCase();
  if (!isEmail(email)) fail(400, 'A valid email is required');
  return db.bookings
    .filter((b) => b.customer.email === email)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .map(customerBooking);
});

function customerOwned(id, email) {
  const b = db.bookings.find((x) => x.id === id) || fail(404, 'Booking not found');
  if (b.customer.email !== str(email, 120).toLowerCase()) fail(403, 'This booking belongs to a different email');
  return b;
}

route('POST', '/api/bookings/:id/cancel', ({ params, body }) => {
  const b = customerOwned(params.id, body.email);
  if (!customerBooking(b).canCancel) fail(400, 'This booking can no longer be cancelled');
  b.status = 'cancelled';
  if (b.payment.status === 'deposit_paid') b.payment.status = 'refunded';
  changed();
  const p = db.providers.find((x) => x.id === b.providerId);
  if (p && p.whatsapp) notify(p.phone, 'booking_cancelled_by_customer', [b.customer.name, b.serviceName, fmtWhen(b), b.ref]);
  return customerBooking(b);
});

route('POST', '/api/bookings/:id/review', ({ params, body }) => {
  const b = customerOwned(params.id, body.email);
  if (!customerBooking(b).canReview) fail(400, 'You can review this booking after your appointment');
  const rating = Math.round(Number(body.rating));
  if (!(rating >= 1 && rating <= 5)) fail(400, 'Choose a rating from 1 to 5');
  const parts = b.customer.name.split(/\s+/);
  db.reviews.push({
    id: newId('r'),
    providerId: b.providerId,
    bookingId: b.id,
    name: parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0],
    rating,
    text: str(body.text, 1000),
    createdAt: new Date().toISOString(),
  });
  b.reviewed = true;
  changed();
  return customerBooking(b);
});

route('GET', '/api/manage/:id', ({ req, params }) => {
  const p = requireManager(req, params.id);
  const bookings = db.bookings
    .filter((b) => b.providerId === p.id)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .map((b) => ({ ...b, started: hasStarted(b) }));
  const favorites = db.favorites.filter((f) => f.providerId === p.id).length;
  return { provider: publicProvider(p), bookings, favorites };
});

route('POST', '/api/manage/:id/bookings/:bid', ({ req, params, body }) => {
  const p = requireManager(req, params.id);
  const b = db.bookings.find((x) => x.id === params.bid && x.providerId === p.id) || fail(404, 'Booking not found');
  if (b.status !== 'confirmed') fail(400, `Booking is already ${b.status.replace('_', '-')}`);
  if (!['completed', 'no_show', 'cancelled'].includes(body.status)) fail(400, 'Invalid status');
  if (body.status !== 'cancelled' && !hasStarted(b)) fail(400, 'This appointment has not started yet');
  b.status = body.status;
  // A no-show keeps the deposit; completing means the balance was collected after the service.
  if (b.status === 'completed' && b.payment.status === 'deposit_paid') b.payment.status = 'paid';
  if (b.status === 'cancelled' && b.payment.status === 'deposit_paid') b.payment.status = 'refunded';
  changed();
  if (b.status === 'cancelled' && b.customer.whatsapp) {
    notify(b.customer.phone, 'booking_cancelled_by_provider', [firstName(b), p.name, b.serviceName, fmtWhen(b), b.ref]);
  }
  return { ...b, started: hasStarted(b) };
});

// Lost dashboard link: WhatsApp it to the number on the listing. The reply is the same whether
// or not the number matches, so this can't be used to find out who is listed.
route('POST', '/api/manage/recover', ({ req, body }) => {
  if (!whatsapp.enabled()) fail(503, 'Sending links by WhatsApp is not available yet.');
  const to = whatsapp.toWhatsApp(str(body.phone, 30));
  if (!to) fail(400, 'Enter the phone number on your listing, e.g. 024 123 4567');
  const now = Date.now();
  for (const p of db.providers) {
    if (!p.whatsapp || whatsapp.toWhatsApp(p.phone) !== to) continue;
    if (p.linkSentAt && now - Date.parse(p.linkSentAt) < 10 * 60e3) continue; // at most once every 10 minutes
    p.linkSentAt = new Date(now).toISOString();
    changed();
    notify(p.phone, 'dashboard_link', [p.name, dashboardUrl(req, p)]);
  }
  return { ok: true };
});

// Vercel Cron calls this every evening (see vercel.json) to remind customers about tomorrow's bookings.
// Vercel sends CRON_SECRET as a bearer token, so nobody else can trigger it.
route('GET', '/api/cron/reminders', ({ req }) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || !safeEqual(req.headers.authorization, `Bearer ${secret}`)) fail(401, 'Unauthorized');
  const tomorrow = localDate(new Date(Date.now() + 864e5));
  let reminders = 0;
  for (const b of db.bookings) {
    if (b.date !== tomorrow || b.status !== 'confirmed' || b.remindedAt || !b.customer.whatsapp) continue;
    const p = db.providers.find((x) => x.id === b.providerId);
    if (!p) continue;
    b.remindedAt = new Date().toISOString();
    changed();
    const balance = b.payment.method === 'none' ? 'Nothing, it\'s free' : fmtMoney(b.payment.balance);
    notify(b.customer.phone, 'booking_reminder', [firstName(b), b.serviceName, p.name, fmtWhen(b), whereText(b, p), balance, b.ref]);
    reminders++;
  }
  return { reminders };
});

// ---------- HTTP plumbing ----------

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 1e6) { reject(new HttpError(413, 'Request too large')); req.destroy(); } else chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new HttpError(400, 'Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function serveStatic(res, pathname) {
  const file = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : decodeURIComponent(pathname)));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, { error: 'Forbidden' });
  fs.readFile(file, (err, buf) => {
    if (err) {
      if (!path.extname(file)) return serveStatic(res, '/');
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;

  // Shareable booking-page links: /p/my-business -> SPA route
  const share = pathname.match(/^\/p\/([\w-]+)\/?$/);
  if (share) {
    res.writeHead(302, { Location: `/#/p/${share[1]}` });
    return res.end();
  }

  if (!pathname.startsWith('/api/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    return serveStatic(res, pathname);
  }

  try {
    for (const r of routes) {
      const m = r.method === req.method && pathname.match(r.re);
      if (!m) continue;
      const body = req.method === 'POST' ? await readBody(req) : {};
      const params = Object.fromEntries(Object.entries(m.groups || {}).map(([k, v]) => [k, decodeURIComponent(v)]));
      return send(res, 200, await run(r.handler, { req, params, query: url.searchParams, body: body || {} }));
    }
    fail(404, 'Not found');
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
    console.error(err);
    send(res, 500, { error: 'Something went wrong' });
  }
});

server.listen(PORT, () => {
  console.log(`${BRAND} running at http://localhost:${PORT}`);
  console.log(`Storage: ${storage.name}. WhatsApp: ${whatsapp.enabled() ? 'on' : 'dry run'}.`);
  if (!storage.durable) console.warn('WARNING: new sign-ups and bookings will be lost when this server sleeps. Connect Upstash Redis (see README).');
  loadDb().catch((err) => console.error(`Could not load the database: ${err.message}`));
});
