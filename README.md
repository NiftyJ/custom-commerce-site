# Nearbook

A marketplace where people can discover, book and pay local service providers, including small businesses that don't have a website or booking system.

Categories: **Hair & Beauty**, **Barbering & Grooming**, **Spa & Wellness**, **Everyday Local Services**.

## Run it

```
npm start            # http://localhost:3000
npm run reset        # wipe data/db.json and reseed demo providers
```

Requires Node 18+. There are no dependencies.

Optional environment variables: `PORT`, `BRAND` (display name), `CURRENCY` (ISO code, e.g. `GBP`, `NGN`, `KES`).

## What's in it

**Customers**
- Search by keyword and area, with filters for category, price, home visits and sort order
- Provider pages with services, prices, durations, opening hours, location and reviews
- Live availability that respects opening hours, service length, existing bookings and provider capacity (chairs/staff)
- Booking checkout: pick a date and time, choose venue or home visit, then pay by card now or pay at the appointment
- Confirmation with a booking reference and an "Add to calendar" (.ics) download
- My bookings: view, cancel (card payments are refunded automatically), book again, and leave a verified review after the appointment

**Businesses**
- "List your business" onboarding: services, prices, hours, area, home-visit option and capacity
- A shareable booking page link (`/p/your-business`) to put in an Instagram bio, on WhatsApp, etc.
- A private dashboard showing upcoming appointments, earnings and cash still to collect, with buttons to mark bookings complete, no-show or cancelled

Seeded demo providers have dashboard keys `demo-key-1` … `demo-key-20` (in order of `seed.js`), for example `/#/dashboard/p_seed01?key=demo-key-1`.

## Structure

```
server.js        HTTP server + JSON API (bookings, availability, providers, reviews, dashboard)
seed.js          Categories and demo data
public/          Single-page frontend (index.html, app.js, styles.css)
data/db.json     Created on first run
```

Home page photos in `public/img/` are free stock from [Unsplash](https://unsplash.com/license) (no attribution required). Category cards load `cat-<category-id>.jpg`, so swap in your own photos by replacing files with the same names.

## Before going live

This is a working prototype. To run it as a real marketplace you would need:

- **Payments**: card checkout is simulated, and only the last 4 digits ever reach the server. Swap in Stripe Connect (or Paystack/Flutterwave, depending on your market) so providers get paid out and you can take a commission.
- **Accounts**: customers look up bookings by email alone, and providers sign in with a secret link. Add proper login (email magic links or OTP) before real customer data goes in.
- **Database**: replace the JSON file with Postgres or SQLite for concurrent writes and backups.
- **Notifications**: email or SMS/WhatsApp confirmations and reminders.
- **Trust & safety**: provider verification, photo uploads, moderation of listings and reviews.
- **Profile editing** for providers (right now you set the profile once at signup).
