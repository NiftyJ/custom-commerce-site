# Nearbook

A marketplace where people can discover, book and pay local service providers, including small businesses that don't have a website or booking system.

Categories: **Beauty, Hair & Barbering**, **Spa, Wellness & Fitness**, **Laundry & Home Cleaning**, **Plumbing, Electrical & Home Repair**, **Waste & Garbage Collection**, **Photography & Videography**, **Moving, Delivery & Errands**, **Appliance & Phone Repairs**, **Events & Entertainment**, **Gardening & Outdoor Services**, **Student & Academic Services**. Edit them in `seed.js`.

The demo is set in Accra: 32 seeded providers across Osu, East Legon, Labone, Madina, Spintex, Dansoman, Jamestown and Legon, with prices in Ghana cedis (GH₵). The look draws on kente and Adinkra (green, gold and clay palette, kente strips and an Adinkra symbol pattern behind the page).

## Run it

```
npm start            # http://localhost:3000
npm run reset        # wipe data/db.json and reseed demo providers
```

Requires Node 18+. There are no dependencies.

Optional environment variables: `PORT`, `BRAND` (display name), `CURRENCY` (ISO code, default `GHS`; e.g. `NGN`, `KES`, `GBP`), `DEPOSIT_PERCENT` (share of the price paid as a deposit at booking, default `30`).

## What's in it

**Customers**
- Search by keyword and area, with filters for category, price, home visits and sort order
- Provider pages with services, prices, durations, opening hours, location and reviews
- Live availability that respects opening hours, service length, existing bookings and provider capacity (chairs/staff)
- Booking checkout: pick a date and time, choose venue or home visit, then make an initial deposit to secure the booking; the balance is paid after the service
- Confirmation with a booking reference and an "Add to calendar" (.ics) download
- My bookings: view, cancel (the deposit is refunded), book again, and leave a verified review after the appointment

**Businesses**
- "List your business" onboarding: services, prices, hours, area, home-visit option and capacity
- A shareable booking page link (`/p/your-business`) to put in an Instagram bio, on WhatsApp, etc.
- A private dashboard showing upcoming appointments, money received (deposits and balances) and balances still to collect after the service, with buttons to mark bookings complete, no-show (the deposit is kept) or cancelled (the deposit is refunded)

Seeded demo providers have dashboard keys `demo-key-1` … `demo-key-32` (in order of `seed.js`), for example `/#/dashboard/p_seed01?key=demo-key-1`.

## Structure

```
server.js        HTTP server + JSON API (bookings, availability, providers, reviews, dashboard)
seed.js          Categories and demo data
public/          Single-page frontend (index.html, app.js, styles.css)
data/db.json     Created on first run
```

## Photos

Photos in `public/img/` are mostly Creative Commons photos of Ghana from Wikimedia Commons and Openverse, plus two from Unsplash. Many are CC BY / CC BY-SA, which require attribution, so every photo is listed with its creator, licence and source in `public/img/credits.json`. That list is shown on the Photo credits page (`/#/credits`, linked in the footer). If you add or swap a photo, update its entry.

- Provider cards and profile covers load `public/img/providers/<slug>.jpg`, where the slug comes from the seeded business name (e.g. `akosuas-braid-studio.jpg`).
- Providers without their own photo, such as new sign-ups, fall back to their category photo, `cat-<category-id>.jpg`.
- If neither photo exists, cards show the category icon on a coloured background.

## Before going live

This is a working prototype. To run it as a real marketplace you would need:

- **Payments**: the deposit at checkout is simulated. Connect Paystack/Flutterwave (or Stripe Connect, depending on your market) to collect deposits and pay providers out, and decide how the balance is paid after the service.
- **Accounts**: customers look up bookings by email alone, and providers sign in with a secret link. Add proper login (email magic links or OTP) before real customer data goes in.
- **Database**: replace the JSON file with Postgres or SQLite for concurrent writes and backups.
- **Notifications**: email or SMS/WhatsApp confirmations and reminders.
- **Trust & safety**: provider verification, photo uploads, moderation of listings and reviews.
- **Profile editing** for providers (right now you set the profile once at signup).
