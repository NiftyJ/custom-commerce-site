// Category definitions and demo data used to populate data/db.json on first run.

const CATEGORIES = [
  {
    id: 'hair-beauty',
    name: 'Beauty, Hair & Barbering',
    description: 'Braids, wigs, haircuts, fades, beard grooming, nails, lashes, makeup and brows.',
  },
  {
    id: 'spa-wellness',
    name: 'Spa, Wellness & Fitness',
    description: 'Massages, facials, body treatments, yoga and personal training.',
  },
  {
    id: 'laundry-cleaning',
    name: 'Laundry & Home Cleaning',
    description: 'Wash and fold, ironing, bedding, house cleaning and deep cleans.',
  },
  {
    id: 'home-repair',
    name: 'Plumbing, Electrical & Home Repair',
    description: 'Handyman services: plumbers, electricians, carpentry, fittings and fixes around the home.',
  },
  {
    id: 'waste-collection',
    name: 'Waste & Garbage Collection',
    description: 'Refuse pickup, bulk waste removal and compound clean-ups.',
  },
  {
    id: 'photo-video',
    name: 'Photography & Videography',
    description: 'Portraits, headshots, event coverage, convocation shoots, reels and video.',
  },
  {
    id: 'moving-delivery',
    name: 'Moving, Delivery & Errands',
    description: 'Home relocation, hostel-to-hostel moves, luggage transport, day-to-day and okada delivery, and errands.',
  },
  {
    id: 'appliance-phone-repair',
    name: 'Appliance & Phone Repairs',
    description: 'Phone screens and batteries, fridges, washing machines and other home appliances.',
  },
  {
    id: 'events-entertainment',
    name: 'Events & Entertainment',
    description: 'DJs, decor, MCs, hosts, and birthday and wedding planners.',
  },
  {
    id: 'gardening-outdoor',
    name: 'Gardening & Outdoor Services',
    description: 'Lawn mowing, hedge trimming, weeding, landscaping and outdoor clean-ups.',
  },
  {
    id: 'student-academic',
    name: 'Student & Academic Services',
    description: 'Private tutoring, study coaching, exam preparation and transcription services.',
  },
];

const COLORS = ['#c2410c', '#7c3aed', '#0f766e', '#be185d', '#1d4ed8', '#a16207', '#15803d', '#9333ea', '#b91c1c', '#0369a1'];

const HOURS = {
  salon: { mon: null, tue: ['09:00', '18:00'], wed: ['09:00', '18:00'], thu: ['09:00', '20:00'], fri: ['09:00', '20:00'], sat: ['08:00', '18:00'], sun: ['12:00', '17:00'] },
  weekday: { mon: ['08:00', '18:00'], tue: ['08:00', '18:00'], wed: ['08:00', '18:00'], thu: ['08:00', '18:00'], fri: ['08:00', '18:00'], sat: ['09:00', '14:00'], sun: null },
  late: { mon: ['10:00', '20:00'], tue: ['10:00', '20:00'], wed: ['10:00', '20:00'], thu: ['10:00', '21:00'], fri: ['10:00', '21:00'], sat: ['09:00', '19:00'], sun: ['11:00', '16:00'] },
  barber: { mon: ['09:00', '19:00'], tue: ['09:00', '19:00'], wed: ['09:00', '19:00'], thu: ['09:00', '19:00'], fri: ['08:00', '20:00'], sat: ['07:00', '18:00'], sun: null },
  daily: { mon: ['07:00', '21:00'], tue: ['07:00', '21:00'], wed: ['07:00', '21:00'], thu: ['07:00', '21:00'], fri: ['07:00', '21:00'], sat: ['07:00', '21:00'], sun: ['09:00', '19:00'] },
  events: { mon: null, tue: null, wed: ['10:00', '18:00'], thu: ['10:00', '18:00'], fri: ['10:00', '23:00'], sat: ['08:00', '23:00'], sun: ['12:00', '22:00'] },
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

  ['Sharp Lines Barbershop', 'hair-beauty', 'Downtown', 'Walk-in energy, booked-in convenience', false, 3, 'barber',
    [['Haircut', 30, 25], ['Haircut & beard', 45, 35], ['Kids cut', 30, 18], ['Line-up', 15, 12]]],
  ['Mobile Barber — Kofi', 'hair-beauty', 'Eastside', 'Fresh cuts at your home or office', true, 1, 'weekday',
    [['Home-visit haircut', 45, 45], ['Haircut & beard (home visit)', 60, 60], ['Group booking (up to 4)', 120, 150]]],
  ["Gentleman's Chair", 'hair-beauty', 'Old Town', 'Hot towel shaves & classic grooming', false, 2, 'barber',
    [['Hot towel shave', 40, 35], ['Beard sculpt', 30, 25], ['Scalp treatment', 30, 30], ['Executive cut', 50, 45]]],
  ['Fade Factory', 'hair-beauty', 'Northgate', 'Skin fades, designs and color', false, 2, 'late',
    [['Skin fade', 40, 28], ['Hair design / art', 20, 15], ['Hair dye', 45, 40]]],

  ['Still Water Spa', 'spa-wellness', 'Riverside', 'Massage & bodywork in a calm space', false, 2, 'late',
    [['Swedish massage (60 min)', 60, 85], ['Deep tissue massage (60 min)', 60, 95], ['Hot stone massage (90 min)', 90, 130], ['Couples massage', 60, 170]]],
  ['Bloom Facial Studio', 'spa-wellness', 'Westpark', 'Results-driven facials and skin treatments', false, 1, 'salon',
    [['Signature facial', 60, 75], ['Hydrating facial', 60, 120], ['Acne clearing treatment', 45, 65]]],
  ['Mobile Massage by Ines', 'spa-wellness', 'Downtown', 'Licensed massage therapist — I bring the table', true, 1, 'late',
    [['Home massage (60 min)', 60, 100], ['Home massage (90 min)', 90, 140], ['Prenatal massage', 60, 105]]],
  ['Breathe Wellness', 'spa-wellness', 'Old Town', 'Private yoga, sound baths and body treatments', false, 1, 'weekday',
    [['Private yoga session', 60, 60], ['Sound bath', 60, 40], ['Body scrub & wrap', 75, 90]]],
  ['Core Fit Personal Training', 'spa-wellness', 'Westpark', 'Personal training at the gym, the park or your home', true, 1, 'weekday',
    [['1-on-1 training session', 60, 40], ['Partner session (2 people)', 60, 60], ['Fitness assessment', 45, 25]]],

  ['Spotless Home Cleaning', 'laundry-cleaning', 'Eastside', 'Reliable, vetted cleaners — supplies included', true, 3, 'weekday',
    [['Standard clean (2 hrs)', 120, 90], ['Deep clean (4 hrs)', 240, 180], ['Move-out clean', 300, 240]]],
  ['Fresh Fold Laundry', 'laundry-cleaning', 'Riverside', 'Wash, dry, iron and fold — we pick up and drop off', true, 2, 'late',
    [['Wash & fold (per bag)', 60, 15], ['Wash, iron & fold (per bag)', 90, 25], ['Duvet & bedding wash', 60, 20]]],

  ['FlowRight Plumbing', 'home-repair', 'Northgate', 'Leaks, blockages and installs — fixed fast', true, 1, 'weekday',
    [['Call-out & diagnosis', 60, 60], ['Leak repair', 90, 110], ['Drain unblocking', 60, 85]]],
  ['Bright Spark Electrical', 'home-repair', 'Westpark', 'Certified electrician for homes & small shops', true, 1, 'weekday',
    [['Electrical safety inspection', 60, 70], ['Socket / switch install', 45, 55], ['Light fitting', 60, 65]]],
  ['HandyPro Fix-It', 'home-repair', 'Old Town', 'Carpentry, door locks, TV mounting and odd jobs', true, 2, 'weekday',
    [['Handyman (1 hr)', 60, 40], ['TV wall mounting', 60, 50], ['Furniture assembly', 90, 55]]],

  ['CleanBin Waste Collection', 'waste-collection', 'Eastside', 'Refuse pickup for homes, hostels and shops', true, 3, 'weekday',
    [['One-off bin pickup', 30, 10], ['Bulk waste removal', 90, 60], ['Compound clean-up', 120, 80]]],

  ['Frame by Tunde Photography', 'photo-video', 'Riverside', 'Portraits, headshots and event coverage', true, 1, 'late',
    [['Headshots (30 min)', 30, 75], ['Portrait session', 60, 120], ['Event coverage (2 hrs)', 120, 300]]],
  ['Reel Moments Video', 'photo-video', 'Downtown', 'Event videography, reels and convocation shoots', true, 1, 'events',
    [['Event video (3 hrs)', 180, 250], ['Short promo / reel', 90, 120], ['Convocation photo + video', 120, 150]]],

  ['SwiftMove Relocations', 'moving-delivery', 'Northgate', 'Home and hostel-to-hostel moves with van and crew', true, 2, 'weekday',
    [['Hostel-to-hostel move', 90, 40], ['Room or studio move', 180, 120], ['Luggage transport', 60, 30]]],
  ['Okada Express Errands', 'moving-delivery', 'Downtown', 'Same-day okada delivery and errands across town', true, 4, 'daily',
    [['Same-day delivery (in town)', 30, 5], ['Market / grocery errand', 60, 10], ['Document drop-off', 30, 6]]],

  ['FixIt Appliance Repair', 'appliance-phone-repair', 'Old Town', 'Washers, fridges and ovens repaired at home', true, 1, 'weekday',
    [['Appliance diagnosis', 30, 35], ['Washing machine repair', 60, 80], ['Fridge repair', 60, 90]]],
  ['PhoneDoc Repairs', 'appliance-phone-repair', 'Westpark', 'Screens, batteries and charging ports fixed while you wait', false, 2, 'late',
    [['Screen replacement', 60, 70], ['Battery replacement', 45, 40], ['Charging port repair', 45, 30]]],

  ['DJ Vybz Entertainment', 'events-entertainment', 'Riverside', 'DJ, MC and sound for birthdays, weddings and parties', true, 1, 'events',
    [['Party DJ (3 hrs)', 180, 200], ['Wedding DJ & sound (5 hrs)', 300, 450], ['MC / host', 240, 180]]],
  ['Petals & Pearls Events', 'events-entertainment', 'Old Town', 'Decor and planning for birthdays and weddings', true, 1, 'events',
    [['Planning consultation', 30, 0], ['Birthday decor setup', 120, 150], ['Wedding day coordination', 480, 600]]],

  ['GreenEdge Gardening', 'gardening-outdoor', 'Westpark', 'Lawn mowing, hedge trimming and compound weeding', true, 2, 'weekday',
    [['Lawn mowing', 60, 35], ['Hedge trimming', 90, 45], ['Garden makeover (half day)', 240, 160]]],

  ['BrightMinds Tutoring', 'student-academic', 'Northgate', 'Private lessons, study coaching and exam prep', true, 3, 'late',
    [['Private lesson (1 hr)', 60, 20], ['Exam prep session (2 hrs)', 120, 35], ['Study coaching', 60, 25]]],
  ['Scribe Transcription', 'student-academic', 'Downtown', 'Lectures, interviews and research audio typed up fast', false, 2, 'weekday',
    [['Transcription (up to 30 min audio)', 60, 15], ['Transcription (up to 1 hr audio)', 120, 28]]],
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
      about: `${name} is a local ${area} business. ${tagline}. Book online in seconds: a small deposit secures your slot, and you pay the rest after the service.`,
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
