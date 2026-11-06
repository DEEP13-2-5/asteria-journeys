# Asteria Journeys

Asteria Journeys is a server-rendered travel operations platform for a Kerala and South India tour operator. It gives travellers a polished package discovery and enquiry experience while giving staff a focused workspace for package content, seasonal pricing, AI-assisted enquiry handling, blogs and branded quotes.

## Links

- Live application: https://asteria-journeys.onrender.com
- GitHub repository: https://github.com/DEEP13-2-5/asteria-journeys

## Core flow

1. Browse searchable journeys and open a server-rendered package detail page.
2. Submit an enquiry with traveller details and optional WhatsApp consent.
3. Sign in to the staff workspace and review the enquiry in `/admin/enquiries`.
4. Inspect the original message beside AI-extracted fields, destination-based suggestions and an editable reply draft.
5. Manage journeys and seasonal prices through `/admin/packages`, or create a branded quote.

## Included features

- Responsive public travel site with package pages, itineraries, inclusions, hotels, pricing and maps
- Owner package CMS with create, edit, duplicate, seasonal prices, preview mode and version snapshots
- First-party blog CMS with categories, SEO fields and related packages
- Website enquiry forms and staff inbox with status, assignment, notes and replies
- AI extraction with deterministic fallback when an external model is unavailable
- Branded quote generation with per-person, twin-sharing and 5% GST terms
- Passport-based authentication and owner/consultant/customer access control
- MongoDB persistence, seeded sample data and automated tests

External WhatsApp, email, chat and phone ingestion is not implemented in this prototype; the inbox consolidates website-submitted enquiries. The consent field supports the intended workflow but is not a complete DPDP Act 2023 compliance guarantee.

## Local setup

See [`deployment.md`](./deployment.md) for prerequisites, environment variable names, seed commands, demo credentials and Render deployment instructions.

```bash
npm install
cp .env.example .env
node init/seedExpandedData.js
npm test
npm start
```

The local server runs on port `8080` by default.
