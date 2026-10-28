# Nearbook

A marketplace where people can discover, book and pay local service providers, including small businesses that don't have a website or booking system.

Categories: **Beauty, Hair & Barbering**, **Spa, Wellness & Fitness**, **Laundry & Home Cleaning**, **Plumbing, Electrical & Home Repair**, **Waste & Garbage Collection**, **Photography & Videography**, **Moving, Delivery & Errands**, **Appliance & Phone Repairs**, **Events & Entertainment**, **Gardening & Outdoor Services**, **Student & Academic Services**. Edit them in `seed.js`.

Areas are grouped into two regions (edit `REGIONS` in `seed.js`):

- **Greater Accra**: Osu, East Legon, Madina, North Legon, Airport Residential, Dzorwulu, Circle, Ridge, Oyarifa, Lakeside, Adenta, Spintex, Tema, Kaneshie, Achimota / Dome, Dansoman, Ashaiman, Lapaz, Kasoa
- **Greater Kumasi**: Adum, Kejetia, Bantama, Suame, Tafo, Asokwa, Ahodwo, KNUST, Ayigya, Kwadaso, Atonsu, Ejisu, Asokore Mampong

Businesses pick their area from this list when they sign up. Customers can search one area or a whole region ("All of Greater Kumasi"). The demo has 32 seeded providers across both cities, with prices in Ghana cedis (GH₵). The look draws on kente and Adinkra (green, gold and clay palette, kente strips and an Adinkra symbol pattern behind the page).

## Run it

```
npm start            # http://localhost:3000
npm run reset        # wipe data/db.json and reseed demo providers
```

Requires Node 18+. There are no dependencies. To try the live-site features locally (database, WhatsApp), copy `.env.example` to `.env` and fill it in.

## What's in it

**Customers**
- Search by keyword and area or region, with filters for category, price, home visits and sort order
- Provider pages with services, prices, durations, opening hours, location and reviews
- **Saved (♥)**: tap the heart on any provider to keep them in the Saved tab and rebook them quickly. Saved on the device, no account needed
- Live availability that respects opening hours, service length, existing bookings and provider capacity (chairs/staff)
- Booking checkout: pick a date and time, choose venue or home visit, then make an initial deposit to secure the booking; the balance is paid after the service
- Optional WhatsApp confirmation and a reminder the day before
- Confirmation with a booking reference and an "Add to calendar" (.ics) download
- My bookings: view, cancel (the deposit is refunded), book again, and leave a verified review after the appointment

**Businesses**
- "List your business" onboarding: services, prices, hours, area, home-visit option and capacity
- A shareable booking page link (`/p/your-business`) to put in an Instagram bio, on WhatsApp, etc.
- A private dashboard with:
  - upcoming appointments, money received this month, balances still to collect, rating, number of customers (and how many came back), and how many people saved the business
  - a bookings-per-month chart and the top services by bookings and money received
  - a Customers list with each customer's bookings, last visit and total paid, with a one-tap WhatsApp chat link
  - buttons to mark bookings complete, no-show (the deposit is kept) or cancelled (the deposit is refunded)
- WhatsApp messages for new bookings and cancellations, and the private dashboard link sent to WhatsApp at sign-up
- Business login: paste the dashboard link on any device, or get it re-sent on WhatsApp

Seeded demo providers have dashboard keys `demo-key-1` … `demo-key-32` (in order of `seed.js`), for example `/#/dashboard/p_seed01?key=demo-key-1`.

## Structure

```
server.js        HTTP server + JSON API (bookings, availability, providers, reviews, favourites, dashboard, reminders)
storage.js       Saves the database to Upstash Redis (live site) or data/db.json (your computer)
whatsapp.js      WhatsApp Business Cloud API messages
seed.js          Categories, regions/areas and demo data
public/          Single-page frontend (index.html, app.js, styles.css)
vercel.json      Daily reminder job (Vercel Cron)
.env.example     The settings the site reads, with blank values
```

## Setting up the database (do this first)

**Why new sign-ups disappear without it:** Vercel runs the site as "serverless" functions. They can only write files to a temporary folder, which is wiped whenever the function goes to sleep (after a few minutes without visitors) or the site is redeployed. Several copies can also run at once, each with its own temporary folder. So a new business or booking was saved, then lost. The fix is a real database that every copy shares.

The site uses **Upstash Redis** (free plan: 250 MB, 500,000 requests a month, plenty for this site). With it connected, the whole database is stored there, and two people booking the same slot at the same moment can't both get it.

1. Open [vercel.com](https://vercel.com) → your project → **Storage** → **Create Database** → **Upstash for Redis** (from the Marketplace).
2. Pick the **Free** plan and the region closest to where your Vercel functions run (by default Washington D.C., so choose `us-east-1`).
3. Connect it to the project for all environments. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project's environment variables automatically.
4. Redeploy: **Deployments** → the latest one → **⋯** → **Redeploy**. Environment variables only apply to new deployments.
5. Check it: open `https://<your-site>/api/health`. You should see `"storage": "Upstash Redis"` and `"dataIsSaved": true`.

The first visit after connecting seeds the demo providers. To browse or back up the data, open the database in the Upstash console → **Data Browser** → key `nearbook:db`.

Tip: most visitors are in Ghana, so the site is faster if the functions and database are in Europe. In Vercel → **Settings** → **Functions**, set the region to London (`lhr1`), and create the Upstash database in `eu-west-1` or `eu-west-2`.

How much it holds: everything is kept as one JSON document, which is fine up to tens of thousands of bookings. If the site grows past that, or many people are booking at the same second all day, move to Postgres (Supabase or Neon).

## Keeping API keys and secrets safe

- **Keys only live on the server.** They're read from environment variables (`process.env`) in `server.js`, `storage.js` and `whatsapp.js`. Never put a key in `public/`: everything in that folder is downloaded by every visitor's browser.
- **Live site:** add keys in Vercel → **Settings** → **Environment Variables**, and tick **Sensitive** so they can't be viewed again after saving.
- **Your computer:** put them in `.env` (copy `.env.example`). `.env` is listed in `.gitignore`, so it is never uploaded to GitHub. Only `.env.example`, which has blank values, is committed.
- **The GitHub repo is public**, so anyone can read every file in it. The code has no secrets in it, but making the repo private is a cheap extra safeguard: GitHub → repo **Settings** → **Danger Zone** → **Change visibility**. Vercel keeps deploying from private repos.
- Turn on **Secret scanning** and **Push protection** (GitHub → **Settings** → **Code security**) so GitHub blocks a push that contains a key.
- `data/` (the local database, with customer names, emails and phones) is also git-ignored.
- **If a key leaks:** rotate it straight away. In Upstash, reset the database's token. In Meta, revoke the token and generate a new one. Then update the value in Vercel and redeploy. Deleting the file from GitHub is not enough, because it stays in the history.

## WhatsApp notifications

The site sends these messages through Meta's **WhatsApp Business Cloud API**:

| Template name | Sent to | When |
|---|---|---|
| `booking_confirmed` | Customer (if they tick WhatsApp updates) | They book |
| `new_booking` | Business (if they opted in at sign-up) | A customer books |
| `booking_cancelled_by_customer` | Business | The customer cancels |
| `booking_cancelled_by_provider` | Customer | The business cancels |
| `booking_reminder` | Customer | 5 pm the day before (daily job) |
| `dashboard_link` | Business | At sign-up, and from "Lost your link?" on Business login |

Until `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set, the site runs in **dry run**: nothing is sent, each message is written to the server log (Vercel → **Logs**), and the WhatsApp tick boxes are hidden.

### 1. Create the Meta app

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create app** → choose a **Business** app and add the **WhatsApp** product. This creates a WhatsApp Business Account and a free test number.
2. In **WhatsApp** → **API Setup**, copy the **Phone number ID** → this is `WHATSAPP_PHONE_NUMBER_ID`.
3. Get a token that doesn't expire (the one on the API Setup page only lasts 24 hours): in [business.facebook.com](https://business.facebook.com) → **Settings** → **Users** → **System users** → **Add** (Admin) → **Assign assets**: your app and WhatsApp account, full control → **Generate token** with the `whatsapp_business_messaging` and `whatsapp_business_management` permissions. This is `WHATSAPP_TOKEN`.
4. The test number can only message up to 5 numbers you add on the API Setup page. To message real customers, add your business's own phone number in **WhatsApp Manager** and complete **Business verification**.

### 2. Create the message templates

WhatsApp only lets a business start a conversation with a pre-approved template. In **WhatsApp Manager** → **Message templates** → **Create template**, create each of these with category **Utility** and language **English** (if you choose English (US) instead, set `WHATSAPP_TEMPLATE_LANG=en_US`). Copy the text exactly; `{{1}}`, `{{2}}`… are filled in by the site. Approval usually takes minutes, sometimes up to a day.

**booking_confirmed**
```
Hi {{1}}, your booking is confirmed.

Service: {{2}}
With: {{3}}
When: {{4}}
Where: {{5}}
Payment: {{6}}
Ref: {{7}}

Need to cancel? Open My bookings on Nearbook. Cancelling is free until your appointment starts.
```

**new_booking**
```
New booking for {{1}}!

Customer: {{2}} ({{3}})
Service: {{4}}
When: {{5}}
Where: {{6}}
Payment: {{7}}
Ref: {{8}}

See all your bookings in your Nearbook business dashboard.
```

**booking_cancelled_by_customer**
```
Booking cancelled: {{1}} cancelled their {{2}} booking for {{3}} (ref {{4}}). The time slot is open for booking again.
```

**booking_cancelled_by_provider**
```
Hi {{1}}, sorry, {{2}} had to cancel your {{3}} booking for {{4}} (ref {{5}}). Any deposit you paid will be refunded. You can book a new time on Nearbook.
```

**booking_reminder**
```
Hi {{1}}, this is a reminder that your {{2}} with {{3}} is tomorrow, {{4}}.

Where: {{5}}
To pay after the service: {{6}}
Ref: {{7}}

See you there!
```

**dashboard_link**
```
Here is the private dashboard link for {{1}} on Nearbook:
{{2}}

Use it to see and manage your bookings. Don't share it: anyone with this link can manage your bookings.
```

### 3. Turn it on

In Vercel → **Settings** → **Environment Variables**, add (tick **Sensitive**):

- `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`
- `SITE_URL`: your site's address, e.g. `https://custom-commerce-site.vercel.app` (used in the dashboard link)
- `CRON_SECRET`: any long random string. Vercel sends it with the daily reminder job so nobody else can trigger it.

Then redeploy, and check `/api/health` shows `"whatsapp": "on"`. If a message fails, the booking still goes through and the reason is in Vercel → **Logs**.

Phone numbers can be typed the local way (`024 123 4567`); they're converted to `233…` automatically. Set `DEFAULT_COUNTRY_CODE` to change the country. Meta charges a small fee per template message delivered; check current rates for Ghana on Meta's WhatsApp pricing page.

The reminder job is in `vercel.json` and runs daily at 17:00 UTC (5 pm in Ghana). On Vercel's free Hobby plan, cron jobs run once a day and may run at any point within that hour.

## Settings

| Variable | What it does |
|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis database (`UPSTASH_REDIS_REST_URL` / `_TOKEN` also work) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Cloud API. Leave blank for dry run |
| `WHATSAPP_API_VERSION` | Meta Graph API version, default `v25.0` |
| `WHATSAPP_TEMPLATE_LANG` | Template language code, default `en` |
| `DEFAULT_COUNTRY_CODE` | For local phone numbers, default `233` (Ghana) |
| `CRON_SECRET` | Protects the daily reminder job |
| `SITE_URL` | Public address used in WhatsApp links |
| `BRAND`, `CURRENCY`, `DEPOSIT_PERCENT` | Display name, currency (default `GHS`), deposit share (default `30`) |
| `PORT`, `DATA_DIR` | Local server port and data folder |

## Photos

Photos in `public/img/` are mostly Creative Commons photos of Ghana from Wikimedia Commons and Openverse, plus two from Unsplash. Many are CC BY / CC BY-SA, which require attribution, so every photo is listed with its creator, licence and source in `public/img/credits.json`. That list is shown on the Photo credits page (`/#/credits`, linked in the footer). If you add or swap a photo, update its entry.

- Provider cards and profile covers load `public/img/providers/<slug>.jpg`, where the slug comes from the seeded business name (e.g. `akosuas-braid-studio.jpg`).
- Providers without their own photo, such as new sign-ups, fall back to their category photo, `cat-<category-id>.jpg`.
- If neither photo exists, cards show the category icon on a coloured background.

## Before going live

This is a working prototype. Still to do before it runs as a real marketplace:

- **Payments**: the deposit at checkout is simulated. Connect Paystack/Flutterwave (MoMo and cards) to collect deposits and pay providers out, and decide how the balance is paid after the service.
- **Accounts**: customers look up bookings by email alone, so anyone who knows an email can see those bookings. Add a one-time code (by WhatsApp or email) before real customer data goes in. Businesses sign in with a secret link.
- **Trust & safety**: provider verification, photo uploads, moderation of listings and reviews.
- **Profile editing** for providers (right now you set the profile once at signup).
