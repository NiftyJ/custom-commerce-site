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
    description: 'Borla (refuse) pickup, bulk waste removal and compound clean-ups.',
  },
  {
    id: 'photo-video',
    name: 'Photography & Videography',
    description: 'Portraits, headshots, event coverage, graduation shoots, reels and video.',
  },
  {
    id: 'moving-delivery',
    name: 'Moving, Delivery & Errands',
    description: 'Home relocation, hostel-to-hostel moves, luggage transport, okada delivery and day-to-day errands.',
  },
  {
    id: 'appliance-phone-repair',
    name: 'Appliance & Phone Repairs',
    description: 'Phone screens and batteries, fridges, washing machines and other home appliances.',
  },
  {
    id: 'events-entertainment',
    name: 'Events & Entertainment',
    description: 'DJs, decor, MCs, hosts, and birthday, outdooring and wedding planners.',
  },
  {
    id: 'gardening-outdoor',
    name: 'Gardening & Outdoor Services',
    description: 'Lawn mowing, hedge trimming, weeding, landscaping and outdoor clean-ups.',
  },
  {
    id: 'student-academic',
    name: 'Student & Academic Services',
    description: 'Private tutoring, WASSCE and BECE prep, study coaching and transcription services.',
  },
];

// Avatar colours drawn from kente cloth: green, red, gold, indigo, earth.
const COLORS = ['#0b6e4f', '#c8361d', '#a66a00', '#6d3b8c', '#1f5f8b', '#8a4b1f', '#0f766e', '#b3311a', '#3f6212', '#9d174d'];

// Areas customers can search and businesses can list in, grouped by region.
// A region's name also works as a search filter covering all of its areas.
const REGIONS = [
  {
    name: 'Greater Accra',
    areas: ['Osu', 'East Legon', 'Madina', 'North Legon', 'Airport Residential', 'Dzorwulu', 'Circle', 'Ridge', 'Oyarifa', 'Lakeside',
      'Adenta', 'Spintex', 'Tema', 'Kaneshie', 'Achimota / Dome', 'Dansoman', 'Ashaiman', 'Lapaz', 'Kasoa'],
  },
  {
    name: 'Greater Kumasi',
    areas: ['Adum', 'Kejetia', 'Bantama', 'Suame', 'Tafo', 'Asokwa', 'Ahodwo', 'KNUST', 'Ayigya', 'Kwadaso', 'Atonsu', 'Ejisu', 'Asokore Mampong'],
  },
];

// Landmark used in the street address of seeded providers that have a shop.
const LANDMARKS = {
  Osu: 'Oxford Street',
  'Airport Residential': 'off Liberation Road',
  Madina: 'near Zongo Junction',
  Spintex: 'near Coca-Cola Roundabout',
  Dansoman: 'near Last Stop',
  'North Legon': 'near Agbogba Junction',
  Adum: 'Prempeh II Street',
  Ahodwo: 'near Ahodwo Roundabout',
  Kejetia: 'near Kejetia Market',
};

const HOURS = {
  salon: { mon: null, tue: ['09:00', '18:00'], wed: ['09:00', '18:00'], thu: ['09:00', '20:00'], fri: ['09:00', '20:00'], sat: ['08:00', '18:00'], sun: ['12:00', '17:00'] },
  weekday: { mon: ['08:00', '18:00'], tue: ['08:00', '18:00'], wed: ['08:00', '18:00'], thu: ['08:00', '18:00'], fri: ['08:00', '18:00'], sat: ['09:00', '14:00'], sun: null },
  late: { mon: ['10:00', '20:00'], tue: ['10:00', '20:00'], wed: ['10:00', '20:00'], thu: ['10:00', '21:00'], fri: ['10:00', '21:00'], sat: ['09:00', '19:00'], sun: ['11:00', '16:00'] },
  barber: { mon: ['09:00', '19:00'], tue: ['09:00', '19:00'], wed: ['09:00', '19:00'], thu: ['09:00', '19:00'], fri: ['08:00', '20:00'], sat: ['07:00', '18:00'], sun: null },
  daily: { mon: ['07:00', '21:00'], tue: ['07:00', '21:00'], wed: ['07:00', '21:00'], thu: ['07:00', '21:00'], fri: ['07:00', '21:00'], sat: ['07:00', '21:00'], sun: ['09:00', '19:00'] },
  events: { mon: null, tue: null, wed: ['10:00', '18:00'], thu: ['10:00', '18:00'], fri: ['10:00', '23:00'], sat: ['08:00', '23:00'], sun: ['12:00', '22:00'] },
};

// [name, category, area, tagline, homeVisit, capacity, hours, services[[name, minutes, price]]]
// Prices are in Ghana cedis (the default CURRENCY). Each seeded provider's photo is public/img/providers/<slug>.jpg.
const PROVIDERS = [
  ["Akosua's Braid Studio", 'hair-beauty', 'East Legon', 'Knotless, box braids & cornrows that last', true, 2, 'salon',
    [['Knotless braids (mid-back)', 240, 450], ['Box braids', 210, 380], ['Cornrows', 90, 120], ['Kids braids', 120, 150]]],
  ['Crown & Glow Wig Bar', 'hair-beauty', 'Osu', 'Wig installs, revamps and custom units', false, 1, 'late',
    [['Frontal wig install', 90, 250], ['Closure wig install', 75, 180], ['Wig revamp & restyle', 60, 150], ['Custom unit consultation', 30, 0]]],
  ['Polished Nail Lounge', 'hair-beauty', 'Airport Residential', 'Gel, acrylics and spa pedicures', false, 3, 'late',
    [['Gel manicure', 45, 150], ['Spa pedicure', 60, 200], ['Acrylic full set', 90, 250], ['Mani + pedi combo', 105, 320]]],
  ['Lash & Brow by Esi', 'hair-beauty', 'Madina', 'Lash extensions & brow lamination — studio or at home', true, 1, 'salon',
    [['Classic lash set', 90, 300], ['Volume lash set', 120, 450], ['Brow lamination', 45, 200], ['Brow shape & tint', 30, 100]]],
  ['Adjoa Glam Studio', 'hair-beauty', 'Spintex', 'Bridal, events and everyday soft glam', true, 1, 'late',
    [['Soft glam', 60, 350], ['Bridal makeup', 120, 1500], ['1-on-1 makeup lesson', 90, 400]]],
  ['Nana Ama Hair Lounge', 'hair-beauty', 'Dansoman', 'Wash & set, treatments and silk presses for every texture', false, 2, 'salon',
    [['Wash & set', 60, 150], ['Silk press', 90, 250], ['Relaxer & treatment', 120, 300], ['Full colour', 120, 400]]],

  ['Sharp Lines Barbershop', 'hair-beauty', 'Osu', 'Walk-in energy, booked-in convenience', false, 3, 'barber',
    [['Haircut', 30, 50], ['Haircut & beard', 45, 70], ['Kids cut', 30, 35], ['Line-up', 15, 25]]],
  ['Mobile Barber — Kofi', 'hair-beauty', 'Kasoa', 'Fresh cuts at your home or office', true, 1, 'weekday',
    [['Home-visit haircut', 45, 100], ['Haircut & beard (home visit)', 60, 130], ['Group booking (up to 4)', 120, 350]]],
  ["Gentleman's Chair", 'hair-beauty', 'Adum', 'Hot towel shaves & classic grooming', false, 2, 'barber',
    [['Hot towel shave', 40, 80], ['Beard sculpt', 30, 60], ['Scalp treatment', 30, 80], ['Executive cut', 50, 120]]],
  ['Fade Factory', 'hair-beauty', 'Madina', 'Skin fades, designs and colour', false, 2, 'late',
    [['Skin fade', 40, 60], ['Hair design / art', 20, 30], ['Hair dye', 45, 80]]],

  ['Nhyira Spa', 'spa-wellness', 'Ahodwo', 'Massage & bodywork in a calm space', false, 2, 'late',
    [['Swedish massage (60 min)', 60, 350], ['Deep tissue massage (60 min)', 60, 400], ['Hot stone massage (90 min)', 90, 550], ['Couples massage', 60, 700]]],
  ['Shea Glow Facial Studio', 'spa-wellness', 'Dansoman', 'Shea butter facials and results-driven skin treatments', false, 1, 'salon',
    [['Signature shea facial', 60, 300], ['Hydrating facial', 60, 450], ['Acne clearing treatment', 45, 280]]],
  ['Mobile Massage by Efua', 'spa-wellness', 'Ridge', 'Licensed massage therapist — I bring the table', true, 1, 'late',
    [['Home massage (60 min)', 60, 400], ['Home massage (90 min)', 90, 550], ['Prenatal massage', 60, 420]]],
  ['Breathe Wellness', 'spa-wellness', 'Spintex', 'Private yoga, sound baths and body treatments', false, 1, 'weekday',
    [['Private yoga session', 60, 250], ['Sound bath', 60, 150], ['Body scrub & wrap', 75, 350]]],
  ['Core Fit Training — Coach Yaw', 'spa-wellness', 'Achimota / Dome', 'Personal training at the gym, the park or your home', true, 1, 'weekday',
    [['1-on-1 training session', 60, 150], ['Partner session (2 people)', 60, 250], ['Fitness assessment', 45, 100]]],

  ['Spotless Home Cleaning', 'laundry-cleaning', 'Tema', 'Reliable, vetted cleaners — supplies included', true, 3, 'weekday',
    [['Standard clean (2 hrs)', 120, 250], ['Deep clean (4 hrs)', 240, 500], ['Move-out clean', 300, 700]]],
  ['Fresh Fold Laundry', 'laundry-cleaning', 'North Legon', 'Wash, dry, iron and fold — we pick up and drop off', true, 2, 'late',
    [['Wash & fold (per bag)', 60, 60], ['Wash, iron & fold (per bag)', 90, 90], ['Duvet & bedding wash', 60, 80]]],

  ['FlowRight Plumbing', 'home-repair', 'Adenta', 'Leaks, blockages, polytanks and installs — fixed fast', true, 1, 'weekday',
    [['Call-out & diagnosis', 60, 150], ['Leak repair', 90, 300], ['Drain unblocking', 60, 250]]],
  ['Bright Spark Electrical', 'home-repair', 'Kaneshie', 'Certified electrician for homes & small shops', true, 1, 'weekday',
    [['Electrical safety inspection', 60, 200], ['Socket / switch install', 45, 120], ['Light fitting', 60, 150]]],
  ['HandyPro Fix-It', 'home-repair', 'Suame', 'Carpentry, door locks, TV mounting and odd jobs', true, 2, 'weekday',
    [['Handyman (1 hr)', 60, 120], ['TV wall mounting', 60, 150], ['Furniture assembly', 90, 200]]],

  ['CleanBin Waste Collection', 'waste-collection', 'Ashaiman', 'Borla pickup for homes, hostels and shops', true, 3, 'weekday',
    [['One-off borla pickup', 30, 40], ['Bulk waste removal', 90, 250], ['Compound clean-up', 120, 350]]],

  ['Frame by Kwame Photography', 'photo-video', 'Bantama', 'Portraits, headshots and event coverage', true, 1, 'late',
    [['Headshots (30 min)', 30, 400], ['Portrait session', 60, 700], ['Event coverage (2 hrs)', 120, 1500]]],
  ['Reel Moments Video', 'photo-video', 'Dzorwulu', 'Event videography, reels and graduation shoots', true, 1, 'events',
    [['Event video (3 hrs)', 180, 2500], ['Short promo / reel', 90, 800], ['Graduation photo + video', 120, 900]]],

  ['SwiftMove Relocations', 'moving-delivery', 'KNUST', 'Home and hostel-to-hostel moves with truck and crew', true, 2, 'weekday',
    [['Hostel-to-hostel move', 90, 200], ['Room or studio move', 180, 600], ['Luggage transport', 60, 120]]],
  ['Okada Express Errands', 'moving-delivery', 'Circle', 'Same-day okada delivery and errands across town', true, 4, 'daily',
    [['Same-day delivery (in town)', 30, 25], ['Market errand (Makola run)', 60, 50], ['Document drop-off', 30, 30]]],

  ['FixIt Appliance Repair', 'appliance-phone-repair', 'Lakeside', 'Washers, fridges and ovens repaired at home', true, 1, 'weekday',
    [['Appliance diagnosis', 30, 100], ['Washing machine repair', 60, 350], ['Fridge repair', 60, 400]]],
  ['PhoneDoc Repairs', 'appliance-phone-repair', 'Kejetia', 'Screens, batteries and charging ports fixed while you wait', false, 2, 'late',
    [['Screen replacement', 60, 450], ['Battery replacement', 45, 200], ['Charging port repair', 45, 120]]],

  ['DJ Vybz Entertainment', 'events-entertainment', 'Lapaz', 'DJ, MC and sound for birthdays, weddings and outdoorings', true, 1, 'events',
    [['Party DJ (3 hrs)', 180, 1200], ['Wedding DJ & sound (5 hrs)', 300, 3000], ['MC / host', 240, 1500]]],
  ['Petals & Pearls Events', 'events-entertainment', 'East Legon', 'Decor and planning for birthdays, outdoorings and weddings', true, 1, 'events',
    [['Planning consultation', 30, 0], ['Birthday decor setup', 120, 1500], ['Outdooring decor & setup', 180, 1800], ['Wedding day coordination', 480, 6000]]],

  ['GreenEdge Gardening', 'gardening-outdoor', 'Oyarifa', 'Lawn mowing, hedge trimming and compound weeding', true, 2, 'weekday',
    [['Lawn mowing', 60, 150], ['Hedge trimming', 90, 200], ['Garden makeover (half day)', 240, 800]]],

  ['BrightMinds Tutoring', 'student-academic', 'Ayigya', 'Private lessons, study coaching and WASSCE/BECE prep', true, 3, 'late',
    [['Private lesson (1 hr)', 60, 100], ['WASSCE exam prep (2 hrs)', 120, 180], ['Study coaching', 60, 120]]],
  ['Scribe Transcription', 'student-academic', 'North Legon', 'Lectures, interviews and research audio typed up fast', false, 2, 'weekday',
    [['Transcription (up to 30 min audio)', 60, 80], ['Transcription (up to 1 hr audio)', 120, 150]]],
];

const REVIEWERS = ['Ama O.', 'Kwame A.', 'Efua M.', 'Yaw B.', 'Abena K.', 'Kojo D.', 'Akua S.', 'Selorm T.', 'Esi A.', 'Nii L.', 'Adwoa F.', 'Ibrahim S.'];
const REVIEW_TEXT = {
  5: ['Booked in two minutes and the work was spot on. Ayekoo!', 'On time, friendly and really skilled. Already booked my next one.', 'Best I have found in the area. Highly recommend!', 'Chale, top-notch service and fair prices.'],
  4: ['Really good experience, just ran a few minutes late.', 'Great result. Would love more evening slots.', 'Very happy overall, will be back.'],
  3: ['Decent service but I had to wait a while.'],
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
    const slug = slugify(name);
    providers.push({
      id,
      slug,
      name,
      category,
      tagline,
      about: `${name} is a local ${area} business. ${tagline}. Book online in seconds: a small deposit secures your slot, and you pay the rest after the service.`,
      area,
      address: homeVisit ? '' : `Shop ${3 + i * 2}, ${LANDMARKS[area]}, ${area}`,
      phone: `+233 20 000 ${String(101 + i).padStart(4, '0')}`,
      photo: `/img/providers/${slug}.jpg`,
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

  return { providers, bookings: [], reviews, favorites: [] };
}

module.exports = { CATEGORIES, REGIONS, COLORS, seed, slugify };
