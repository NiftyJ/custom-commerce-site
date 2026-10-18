// Category definitions and demo data used to populate data/db.json on first run.

const CATEGORIES = [
  {
    id: 'hair-beauty',
    name: 'Hair & Beauty',
    description: 'Braiding, wigs, haircuts, hair coloring, manicures, pedicures, lashes, makeup, and eyebrow services.',
  },
  {
    id: 'barbering',
    name: 'Barbering & Grooming',
    description: 'Haircuts, beard grooming, shaving, hair treatments, and home-visit barber services.',
  },
  {
    id: 'spa-wellness',
    name: 'Spa & Wellness',
    description: 'Massages, facials, body treatments, wellness sessions, and other bookable personal-care services.',
  },
  {
    id: 'local-services',
    name: 'Everyday Local Services',
    description: 'Cleaning, plumbing, electrical work, tailoring, photography, appliance repairs, and other services people need to book.',
  },
];

const COLORS = ['#c2410c', '#7c3aed', '#0f766e', '#be185d', '#1d4ed8', '#a16207', '#15803d', '#9333ea', '#b91c1c', '#0369a1'];

const HOURS = {
  salon: { mon: null, tue: ['09:00', '18:00'], wed: ['09:00', '18:00'], thu: ['09:00', '20:00'], fri: ['09:00', '20:00'], sat: ['08:00', '18:00'], sun: ['12:00', '17:00'] },
  weekday: { mon: ['08:00', '18:00'], tue: ['08:00', '18:00'], wed: ['08:00', '18:00'], thu: ['08:00', '18:00'], fri: ['08:00', '18:00'], sat: ['09:00', '14:00'], sun: null },
  late: { mon: ['10:00', '20:00'], tue: ['10:00', '20:00'], wed: ['10:00', '20:00'], thu: ['10:00', '21:00'], fri: ['10:00', '21:00'], sat: ['09:00', '19:00'], sun: ['11:00', '16:00'] },
  barber: { mon: ['09:00', '19:00'], tue: ['09:00', '19:00'], wed: ['09:00', '19:00'], thu: ['09:00', '19:00'], fri: ['08:00', '20:00'], sat: ['07:00', '18:00'], sun: null },
};

// [name, category, area, tagline, homeVisit, capacity, hours, services[[name, minutes, price]]]
const PROVIDERS = [
  ["Amara's Braid Studio", 'hair-beauty', 'Eastside', 'Knotless, box braids & cornrows that last', true, 2, 'salon',
    [['Knotless braids (mid-back)', 240, 180], ['Box braids', 210, 150], ['Cornrows', 90, 60], ['Kids braids', 120, 70]]],
  ['Crown & Glow Wig Bar', 'hair-beauty', 'Downtown', 'Wig installs, revamps and custom units', false, 1, 'late',
    [['Frontal wig install', 90, 85], ['Closure wig install', 75, 65], ['Wig revamp & restyle', 60, 45], ['Custom unit consultation', 30, 0]]],
  ['Polished Nail Lounge', 'hair-beauty', 'Riverside', 'Gel, acrylics and spa pedicures', false, 3, 'late',
    [['Gel manicure', 45, 35], ['Spa pedicure', 60, 45], ['Acrylic full set', 90, 60], ['Mani + pedi combo', 105, 75]]],
  ['Lash & Brow by Zee', 'hair-beauty', 'Northgate', 'Lash extensions & brow lamination — studio or at home', true, 1, 'salon',
    [['Classic lash set', 90, 90], ['Volume lash set', 120, 130], ['Brow lamination', 45, 55], ['Brow shape & tint', 30, 30]]],
  ['Glam Room Makeup', 'hair-beauty', 'Old Town', 'Bridal, events and everyday soft glam', true, 1, 'late',
    [['Soft glam', 60, 70], ['Bridal makeup', 120, 220], ['1-on-1 makeup lesson', 90, 80]]],
  ['Color Theory Salon', 'hair-beauty', 'Westpark', 'Cuts, color and silk presses for every texture', false, 2, 'salon',
    [['Haircut & style', 60, 55], ['Silk press', 90, 75], ['Full color', 120, 130], ['Balayage', 180, 210]]],

  ['Sharp Lines Barbershop', 'barbering', 'Downtown', 'Walk-in energy, booked-in convenience', false, 3, 'barber',
    [['Haircut', 30, 25], ['Haircut & beard', 45, 35], ['Kids cut', 30, 18], ['Line-up', 15, 12]]],
  ['Mobile Barber — Kofi', 'barbering', 'Eastside', 'Fresh cuts at your home or office', true, 1, 'weekday',
    [['Home-visit haircut', 45, 45], ['Haircut & beard (home visit)', 60, 60], ['Group booking (up to 4)', 120, 150]]],
  ["Gentleman's Chair", 'barbering', 'Old Town', 'Hot towel shaves & classic grooming', false, 2, 'barber',
    [['Hot towel shave', 40, 35], ['Beard sculpt', 30, 25], ['Scalp treatment', 30, 30], ['Executive cut', 50, 45]]],
  ['Fade Factory', 'barbering', 'Northgate', 'Skin fades, designs and color', false, 2, 'late',
    [['Skin fade', 40, 28], ['Hair design / art', 20, 15], ['Hair dye', 45, 40]]],

  ['Still Water Spa', 'spa-wellness', 'Riverside', 'Massage & bodywork in a calm space', false, 2, 'late',
    [['Swedish massage (60 min)', 60, 85], ['Deep tissue massage (60 min)', 60, 95], ['Hot stone massage (90 min)', 90, 130], ['Couples massage', 60, 170]]],
  ['Bloom Facial Studio', 'spa-wellness', 'Westpark', 'Results-driven facials and skin treatments', false, 1, 'salon',
    [['Signature facial', 60, 75], ['Hydrating facial', 60, 120], ['Acne clearing treatment', 45, 65]]],
  ['Mobile Massage by Ines', 'spa-wellness', 'Downtown', 'Licensed massage therapist — I bring the table', true, 1, 'late',
    [['Home massage (60 min)', 60, 100], ['Home massage (90 min)', 90, 140], ['Prenatal massage', 60, 105]]],
  ['Breathe Wellness', 'spa-wellness', 'Old Town', 'Private yoga, sound baths and body treatments', false, 1, 'weekday',
    [['Private yoga session', 60, 60], ['Sound bath', 60, 40], ['Body scrub & wrap', 75, 90]]],

  ['Spotless Home Cleaning', 'local-services', 'Eastside', 'Reliable, vetted cleaners — supplies included', true, 3, 'weekday',
    [['Standard clean (2 hrs)', 120, 90], ['Deep clean (4 hrs)', 240, 180], ['Move-out clean', 300, 240]]],
  ['FlowRight Plumbing', 'local-services', 'Northgate', 'Leaks, blockages and installs — fixed fast', true, 1, 'weekday',
    [['Call-out & diagnosis', 60, 60], ['Leak repair', 90, 110], ['Drain unblocking', 60, 85]]],
  ['Bright Spark Electrical', 'local-services', 'Westpark', 'Certified electrician for homes & small shops', true, 1, 'weekday',
    [['Electrical safety inspection', 60, 70], ['Socket / switch install', 45, 55], ['Light fitting', 60, 65]]],
  ['Needle & Thread Tailoring', 'local-services', 'Downtown', 'Alterations, repairs and made-to-measure', false, 1, 'salon',
    [['Trouser hem', 30, 15], ['Dress alteration', 45, 35], ['Made-to-measure fitting', 60, 50]]],
  ['Frame by Tunde Photography', 'local-services', 'Riverside', 'Portraits, headshots and event coverage', true, 1, 'late',
    [['Headshots (30 min)', 30, 75], ['Portrait session', 60, 120], ['Event coverage (2 hrs)', 120, 300]]],
  ['FixIt Appliance Repair', 'local-services', 'Old Town', 'Washers, fridges and ovens repaired at home', true, 1, 'weekday',
    [['Appliance diagnosis', 30, 35], ['Washing machine repair', 60, 80], ['Fridge repair', 60, 90]]],
];

const REVIEWERS = ['Chioma A.', 'Marcus T.', 'Priya S.', 'Daniel O.', 'Fatima K.', 'Jordan L.', 'Grace M.', 'Samuel E.', 'Leah W.', 'Ade B.', 'Nina R.', 'Tom H.'];
const REVIEW_TEXT = {
  5: ['Absolutely brilliant — booked in two minutes and the service was spot on.', 'On time, friendly and really skilled. Already booked my next one.', 'Best I have found in the area. Highly recommend!', 'Super professional and great value for money.'],
  4: ['Really good experience, just ran a few minutes late.', 'Great result. Would love more evening slots.', 'Very happy overall, will be back.'],
  3: ['Decent service but had to wait a while.'],
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slugify(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function seed() {
  const rand = mulberry32(42);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const providers = [];
  const reviews = [];
  const now = Date.now();

  PROVIDERS.forEach(([name, category, area, tagline, homeVisit, capacity, hours, services], i) => {
    const id = `p_seed${String(i + 1).padStart(2, '0')}`;
    providers.push({
      id,
      slug: slugify(name),
      name,
      category,
      tagline,
      about: `${name} is a local ${area} business. ${tagline}. Book online in seconds and pay securely — or pay on the day.`,
      area,
      address: homeVisit ? '' : `${10 + i * 7} Market Street, ${area}`,
      phone: `+1 555 01${String(i).padStart(2, '0')}`,
      homeVisit,
      capacity,
      hours: HOURS[hours],
      services: services.map(([sName, duration, price], j) => ({ id: `s${j + 1}`, name: sName, duration, price })),
      color: COLORS[i % COLORS.length],
      verified: i % 3 !== 2,
      manageKey: `demo-key-${i + 1}`,
      createdAt: new Date(now - (60 + i * 9) * 864e5).toISOString(),
    });

    const count = 2 + Math.floor(rand() * 4);
    for (let r = 0; r < count; r++) {
      const roll = rand();
      const rating = roll < 0.62 ? 5 : roll < 0.92 ? 4 : 3;
      reviews.push({
        id: `r_seed${i}_${r}`,
        providerId: id,
        bookingId: null,
        name: pick(REVIEWERS),
        rating,
        text: pick(REVIEW_TEXT[rating]),
        createdAt: new Date(now - Math.floor(rand() * 50 + 1) * 864e5).toISOString(),
      });
    }
  });

  return { providers, bookings: [], reviews };
}

module.exports = { CATEGORIES, COLORS, seed, slugify };
