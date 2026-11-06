# Asteria Journeys — Deployment & Review Guide

## Project links

- GitHub: https://github.com/DEEP13-2-5/asteria-journeys
- Live application: https://asteria-journeys.onrender.com

## Demo access

The application does not publish passwords in source control. For a private review environment, provision temporary credentials through the hosting dashboard or a secure handoff.

Travellers do not need an account. Start at the live home page, open **Journeys**, choose a package, and use **Enquire**.

To operate a fresh local or private deployment:

1. Register one consultant account at `/signup`.
2. Promote that existing account once, while no active owner exists:

   ```bash
   node init/setupOwner.js <existing-username>
   ```
3. Sign in as the owner and use **Team Staff** to create invitation links for consultants.
4. Share temporary credentials privately; rotate or disable them after review.

## Local setup

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- MongoDB (local or MongoDB Atlas)

### Install and configure

```bash
git clone https://github.com/DEEP13-2-5/asteria-journeys.git
cd asteria-journeys
npm install
cp .env.example .env
```

Set the environment variables listed in the next section. A local MongoDB default is:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/wanderlust
```

### Seed realistic sample data

```bash
node init/seedExpandedData.js
```

The seed includes published and draft journeys, seasonal prices, hotels, places, blog content and the sample Kerala enquiry data used by the core flow.

### Run tests and start

```bash
npm test
npm start
```

Open http://localhost:8080. The server automatically tries the next port if the configured port is busy.

Useful routes:

- `/` — public landing page
- `/journeys` — searchable package catalogue
- `/journeys/<slug>` — server-rendered package detail and enquiry form
- `/custom-package` — custom package and branded quote flow
- `/blogs` — first-party travel content
- `/login` — staff sign-in
- `/admin/enquiries` — unified enquiry inbox
- `/admin/packages` — owner package CMS
- `/admin/blogs` — owner blog CMS
- `/admin/quotes` — quote management
- `/sitemap.xml` — SEO sitemap

## Environment variables

Never commit values for these variables. Only the names are required in a deployment environment:

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` or `ATLASTDB_URL` | Yes | MongoDB connection string |
| `SESSION_SECRET` | Yes in production | Session and cookie signing secret |
| `OPENROUTER_API_KEY` | Optional | LLM enrichment and custom itinerary generation |
| `OPENROUTER_MODEL` | Optional | OpenRouter model identifier |
| `MAPBOX_TOKEN` | Optional | Map display token; public map fallback remains available |
| `CLOUD_NAME` | Optional | Cloudinary media storage |
| `CLOUD_API_KEY` | Optional | Cloudinary API key |
| `CLOUD_API_SECRET` | Optional | Cloudinary API secret |
| `PORT` | Optional | HTTP port; defaults to `8080` |
| `NODE_ENV` | Recommended | Set to `production` on Render |

Without an OpenRouter key, the enquiry flow remains usable through the deterministic extraction fallback in `services/ai.js`. AI output is stored as a draft for staff review; it does not send messages or publish content automatically.

## Render deployment

1. Create a Render **Web Service** from the GitHub repository.
2. Use Node runtime.
3. Set build command to `npm install`.
4. Set start command to `node app.js`.
5. Add the environment variables above in Render. Use a managed MongoDB Atlas database.
6. Deploy, then run `node init/seedExpandedData.js` once from a secure one-off shell or local machine connected to the same database.
7. Verify `/`, `/journeys`, `/login`, and `/sitemap.xml`.

The current live deployment is available at https://asteria-journeys.onrender.com.

## Security and data notes

- `.env` and ZIP files are ignored by Git.
- Passwords use Passport Local Mongoose hashing; staff routes use role checks.
- Enquiry writes are rate-limited and include CSRF-token validation for state-changing requests.
- WhatsApp follow-up is opt-in via `whatsappConsent`.
- The repository contains synthetic sample data only. Do not use real traveller data in a demo database.
