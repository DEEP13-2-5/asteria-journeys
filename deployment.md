# Asteria Journeys — Deployment & Local Setup Guide

> **Client:** Company A, Kochi (Kerala & South India Tour Operator)  
> **Repository:** https://github.com/DEEP13-2-5/asteria-journeys  
> **Stack:** Node.js (v18+ / v20+), Express.js, MongoDB (Atlas / Community), EJS SSR, OpenRouter LLM

---

## 1. Demo Login Details for Reviewer

The system enforces role-based access control (RBAC) across distinct user roles:

| Role | Username | Password | Purpose / Permissions |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `asd` | `admin123` | Full access: Package CMS, Blog CMS, Enquiry Inbox, Quote Generation, Team Invitations, Price Updates |
| **Consultant** | `consultant` | `consultant123` | Operational access: Enquiry triage, AI extraction review, Quote drafting, Package suggestions |
| **Public / Traveller** | *No login needed* | *N/A* | Public portal: Package catalog, Custom Package Builder, AI Trip Planner, Blog guides, Instant Enquiries |

*To access the Admin Portal directly, navigate to `/login` and sign in with the credentials above.*

---

## 2. Step-by-Step Local Setup

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **MongoDB** instance (local MongoDB server or MongoDB Atlas cluster connection string)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DEEP13-2-5/asteria-journeys.git
   cd Hotelbnb
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Populate the `.env` variables with your credentials (see Section 3 for variable names).

4. **Seed Database with Sample Data:**
   Run the idempotent seed script to populate packages (including `PKG-KL-07` and `PKG-SI-12`), curated hotels, sightseeing spots, blogs, and demo accounts:
   ```bash
   node init/seedExpandedData.js
   ```

5. **Run Automated Test Suite:**
   Verify logic, database integration, pricing, and AI extraction:
   ```bash
   npm test
   ```
   *(All 5 test suites will pass cleanly).*

6. **Start the Application:**
   ```bash
   npm start
   # or for development with auto-reload:
   npx nodemon app.js
   ```

7. **Access the Web Portal:**
   - **Public Portal:** http://localhost:8080/
   - **Holiday Packages:** http://localhost:8080/journeys
   - **Hotels & Places Explorer:** http://localhost:8080/explore
   - **Custom Package Builder:** http://localhost:8080/custom-package
   - **AI Trip Planner:** http://localhost:8080/ai-planner
   - **Travel Stories & Blogs:** http://localhost:8080/blogs
   - **Staff Login:** http://localhost:8080/login
   - **Admin Enquiry Inbox:** http://localhost:8080/admin/enquiries
   - **Package CMS:** http://localhost:8080/admin/packages

---

## 3. Environment Variables

*In compliance with security rules, only variable names are listed below. No real secrets are committed.*

| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `ATLASTDB_URL` or `MONGODB_URI` | **Yes** | MongoDB connection URI (Atlas cloud or local `mongodb://127.0.0.1:27017/hotelbnb`) |
| `SESSION_SECRET` | **Yes** | Cryptographic secret for signing HTTP session cookies |
| `OPENROUTER_API_KEY` | Optional | API key for OpenRouter LLM (enquiry extraction & AI package generation) |
| `OPENROUTER_MODEL` | Optional | LLM model identifier (default: `dots-studio/dots-3-note-preview:free` or `openai/gpt-4o-mini`) |
| `CLOUD_NAME` | Optional | Cloudinary cloud name for uploaded hotel/package media |
| `CLOUD_API_KEY` | Optional | Cloudinary API key |
| `CLOUD_API_SECRET` | Optional | Cloudinary API secret |
| `MAPBOX_TOKEN` | Optional | Mapbox public access token for interactive itinerary maps |
| `PORT` | Optional | Web server port (defaults to `8080` with auto-fallback to `8081`) |

> **Graceful Degradation Note:** If `OPENROUTER_API_KEY` is not provided, the platform automatically engages its built-in rule-based NLP extraction and deterministic pricing engine. The application remains fully functional without external third-party API dependencies.

---

## 4. Production Deployment Guide

The application is structured for straightforward deployment on cloud platforms such as **Render**, **Railway**, **Fly.io**, or an **AWS EC2 / DigitalOcean Droplet**:

### Deploying to Render / Railway:
1. Connect your GitHub repository (`https://github.com/DEEP13-2-5/asteria-journeys`) to Render / Railway.
2. Select **Web Service** with runtime `Node`.
3. Set the **Build Command**: `npm install`
4. Set the **Start Command**: `node app.js`
5. Under **Environment Variables**, supply:
   - `ATLASTDB_URL`
   - `SESSION_SECRET`
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
   - `NODE_ENV=production`
6. Once deployed, run the seed script once via the platform shell or one-off job:
   ```bash
   node init/seedExpandedData.js
   ```
7. Verify health: `GET /journeys` should return HTTP 200 with server-rendered package pages.
