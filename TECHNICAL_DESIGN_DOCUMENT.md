# Technical Design Document (TDD)
## Asteria Journeys — Custom CMS & AI-Powered Operations Platform for Tour Operators

> **GitHub Repository:** https://github.com/DEEP13-2-5/asteria-journeys  
> **Live Application URL:** https://asteria-journeys.onrender.com *(or local port 8080)*  
> **Author:** Deep Bodani (Software Engineering Candidate)  
> **Client:** Company A, Kochi, Kerala (Tour operator: ₹28–34 Cr revenue, ~4,300 annual bookings across 60 packages)  
> **Date:** November 2026

---

## 1. Executive Summary & Problem Framing

Company A is an established South India tour operator based in Kochi, Kerala, specializing in curated holidays to Munnar, Alleppey backwaters, Thekkady, Wayanad, and Tamil Nadu heritage trails. While the business achieves solid annual revenue (₹28–34 Cr), its legacy software stack imposed severe operational and financial drag:

1. **Slow & Expensive Content Agility:** Every package modification or seasonal pricing revision was outsourced to an external freelancer at ₹3,000 and 3 days per turnaround. At 40 content changes a month, this created an annual drain of **₹14.4 Lakh** while crippling dynamic pricing during peak season.
2. **Disconnected Content Conversion:** Travel blogs were hosted on an external free blogging site with no interactive links or booking funnels back to the company's packages.
3. **Severe Lead Slippage & Lost Margin:** ~2,400 monthly enquiries arrived across fractured channels (web forms, WhatsApp, email, chat, phone) and were tracked manually in Excel. Crucially, 25% (600 enquiries/month) received replies after 12 hours, collapsing conversion from 15% to 7%. This delay caused **48 lost bookings every month**, hemorrhaging **₹52.42 Lakh in lost gross margin annually**. Combined with freelance CMS fees, the company lost **₹66.82 Lakh every year**.

### The Solution: Asteria Journeys
Asteria Journeys is a purpose-built, full-stack travel operations platform:
- **In-House Versioned Package CMS:** Empowers non-technical staff to create, edit, duplicate, and reprice packages in **under 5 minutes** without developer dependency.
- **Integrated Blog CMS:** Contextually embeds matching packages directly inside editorial travel stories to maximize organic conversion.
- **Centralized Operational Inbox:** Ingests enquiries across all web touchpoints into a unified triage dashboard with instant acknowledgements.
- **AI-Assisted Extraction & Reply Drafting:** Uses an LLM to parse dates, guest counts, destinations, budgets, and must-haves, matching the top 3 best-fit packages from the catalog.
- **Branded Instant Quote Builder:** Generates compliant corporate quotes itemizing 5% GST and twin-sharing terms, exportable to printable PDFs.

---

## 2. System Architecture & Technology Choices

### 2.1 High-Level Architecture Diagram
```
┌────────────────────────────────────────────────────────────────────────┐
│                       Traveller / Public Browser                       │
│    (Mobile-First, HTML5/CSS3, No Login Required for Guests)            │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ HTTP / HTTPS (SSR HTML)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Express.js Web Application Server                   │
│  ┌────────────────────────┐              ┌───────────────────────────┐ │
│  │  Public Travel Router  │              │    Admin & CMS Router     │ │
│  │  • Catalog & Filters   │              │  • Package CMS (CRUD)     │ │
│  │  • Stays by Location   │              │  • Blog CMS (CRUD)        │ │
│  │  • Custom Builder      │              │  • Unified Inbox          │ │
│  │  • AI Trip Planner     │              │  • Branded Quotes         │ │
│  │  • Sitemap.xml (SEO)   │              │  • Team Access & Invites  │ │
│  └───────────┬────────────┘              └─────────────┬─────────────┘ │
│              │                                         │               │
│  ┌───────────▼────────────┐              ┌─────────────▼─────────────┐ │
│  │ Controllers & Views    │              │ RBAC & Security           │ │
│  │ (EJS Server Rendering) │              │ (Passport.js Sessions)    │ │
│  └───────────┬────────────┘              └─────────────┬─────────────┘ │
│              │                                         │               │
│              └───────────────────┬─────────────────────┘               │
│                                  │                                     │
│  ┌───────────────────────────────▼───────────────────────────────────┐ │
│  │                        Core Domain Services                       │ │
│  │  • AI Extraction & Plan Generator (OpenRouter LLM + Regex Fallback│ │
│  │  • MMT-Style Offers & Concession Engine (Promo Codes & Fares)     │ │
│  │  • Quote Calculation & GST Itemization Engine                     │ │
│  └───────────────────────────────┬───────────────────────────────────┘ │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │ Mongoose ODM
┌──────────────────────────────────▼─────────────────────────────────────┐
│                       MongoDB Persistence Layer                        │
│  (Packages, SeasonalPrices, Hotels, Places, Enquiries, Quotes,         │
│   Blogs, Users, Invitations, Audit Version Snapshots)                  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Rationale for Architecture & Stack
- **Server-Side Rendering (SSR) via Express & EJS:**
  - *Organic Search & SEO:* Tour operators rely heavily on non-branded organic search traffic (e.g., *"6 days Kerala houseboat family package"*). SSR guarantees that search bots (Google, Bing) receive 100% pre-rendered semantic HTML with complete OpenGraph metadata, structured microdata, clean slugs, and dynamic `/sitemap.xml`.
  - *Mobile Performance:* Eliminates client-side single-page-app (SPA) framework bloat, satisfying the client brief's requirement of **sub-2.5 second page loads on 4G networks**.
- **MongoDB & Mongoose Document Model:**
  - Tourism entities are inherently nested and hierarchical (day-wise itineraries, variable seasonal rates, multi-city hotel stays, version audit histories). Document storage models these relationships natively without fragile multi-table relational joins.
- **Passport.js Local Strategy (PBKDF2 Hashing):**
  - Robust session management with HTTP-only cookies, rate limiting, and role-based route guards (`requireOwner`, `requireStaff`).
- **OpenRouter LLM (`dots-studio/dots-3-note-preview:free` / `gpt-4o-mini`):**
  - Enterprise-grade reasoning combined with deterministic safety fallback algorithms.

---

## 3. Data Model Design

```
┌─────────────────────┐         1:N          ┌─────────────────────┐
│    TravelPackage    ├─────────────────────►│       Enquiry       │
│  • code             │                      │  • name, email      │
│  • title, slug      │◄─────────────────────┤  • message          │
│  • seasonalPrices[] │    ai.suggestions    │  • ai.extracted     │
│  • itinerary[]      │                      │  • status           │
│  • versions[]       │                      └──────────┬──────────┘
└──────────┬──────────┘                                 │ 1:1
           │                                            │
           │ Related Packages                  ┌────────▼──────────┐
           │                                   │       Quote       │
┌──────────▼──────────┐                        │  • quoteNumber    │
│        Blog         │                        │  • grandTotal     │
│  • title, slug      │                        │  • gstAmount (5%) │
│  • content          │                        │  • status         │
│  • relatedPkgs[]    │                        └───────────────────┘
└─────────────────────┘
```

### 3.1 Key Schema Definitions

1. **`TravelPackage` (`models/package.js`):**
   - `code`: Unique code (`PKG-KL-07`, `PKG-SI-12`).
   - `title`, `slug`: URL slug for SEO.
   - `days`, `nights`: Duration numbers.
   - `destinations`: String array (e.g., `['Munnar', 'Thekkady', 'Alleppey']`).
   - `hotelCategory`: `3 star`, `4 star`, `5 star`, `Heritage / Boutique`.
   - `seasonalPrices`: Array of `{ label: String, price: Number, validity: String }`.
   - `itinerary`: Array of `{ day: Number, title: String, description: String }`.
   - `inclusions`, `exclusions`: Policy lists.
   - `status`: Enum `['draft', 'published', 'archived']`.
   - `versions`: Historical snapshot subdocuments (`savedAt`, `savedBy`, `snapshot`, `note`).
   - `createdBy`, `updatedBy`: User tracking.

2. **`Hotel` & `Place` (`models/hotel.js`, `models/place.js`):**
   - Location-indexed stays and attractions across Munnar, Alleppey, Thekkady, Kochi, Wayanad, Kovalam, Madurai, and Kanyakumari.

3. **`Enquiry` (`models/enquiry.js`):**
   - `name`, `email`, `phone`, `whatsappConsent` (DPDP Act 2023 compliance).
   - `message`: Original raw enquiry text.
   - `fareType`: Regular, Student, Armed Forces, Senior Citizen, GST Concession, Doctor & Nurse.
   - `promoCode`: Voucher code (`MMTKERALA`, `HOUSEBOAT3K`, `ICICITRAVEL`).
   - `ai`: Subdocument capturing `{ dates, travellers, destination, budget, mustHave }`, `personalizedPlan`, `draftReply`, and `suggestions[]`.
   - `messages`: Array of `{ direction: 'inbound'|'outbound'|'system', text: String, author: String, createdAt: Date }`.
   - `status`: `['new', 'in_progress', 'quoted', 'booked', 'closed']`.
   - `assignedTo`: Consultant user identifier.

4. **`Quote` (`models/quote.js`):**
   - `quoteNumber`: Serial identifier (`AST-QT-XXXXXX`).
   - `enquiryRef`: Parent enquiry reference.
   - `basePricePerPerson`, `paxCount`, `specialDiscount`, `promoDiscount`.
   - `subtotal`, `gstPercent` (5%), `gstAmount`, `totalAmount`.
   - `status`: `['draft', 'sent', 'accepted', 'expired']`.

5. **`Blog` (`models/blog.js`):**
   - Rich editorial article with categories, SEO title/description, and `relatedPackages` references.

6. **`User` & `Invitation` (`models/user.js`, `models/invitation.js`):**
   - Team authentication with RBAC roles (`owner`, `consultant`, `customer`) and tokenized invitations.

---

## 4. Core User Flows & Screen Architecture

### 4.1 Flow A: Public Discovery to Enquiry Submission
```
Traveller visits Public Site (No login required)
  │
  ├── Searches Catalog by Destination / Duration / Price (/journeys)
  ├── OR Explores Hotels & Sights Filterable by Town (/explore)
  ├── OR Uses Interactive 6-Step Custom Package Builder (/custom-package)
  ├── OR Generates an AI-Crafted Bespoke Holiday Plan (/ai-planner)
  │
Submits Package Enquiry Form (with mandatory DPDP WhatsApp Consent)
  │
Instant acknowledgement confirmation displayed on-screen
  │
Asynchronous AI Enrichment Pipeline executes
```

### 4.2 Flow B: AI Extraction, Consultant Review & Quoting
```
Enquiry lands in Unified Admin Inbox (/admin/enquiries)
  │
AI Service (services/ai.js):
  ├── Invokes OpenRouter LLM (with 6s timeout)
  ├── Extracts: Dates, Travellers, Destination, Budget, Must-Haves
  ├── Discovers 3 best-fit packages from database catalog
  ├── Drafts warm, personalized reply
  └── [FAILURE/TIMEOUT BRANCH]: Deterministic Regex Fallback engages
  │
Consultant opens Enquiry Detail (/admin/enquiries/:id):
  ├── Side-by-Side Review: Raw Message vs. AI-Extracted Fields
  ├── Consultant edits any incorrect fields
  ├── Consultant reviews/edits pre-filled AI Draft Reply
  ├── [Optional] Clicks "✨ Regenerate AI Reply Draft" if needed
  ├── Clicks "Send Reply to Guest →" (Logged in thread under consultant name)
  │
Consultant clicks "+ Generate Branded Quote":
  ├── System auto-calculates Subtotal, Special Fares, Promos, and 5% GST
  ├── Generates printable corporate letterhead quote sheet (/quotes/:id)
  └── Traveller clicks "Accept This Itinerary & Quotation"
```

### 4.3 Flow C: Package CMS & Repricing in Under 5 Minutes
- Content staff open `/admin/packages`.
- Click on any package to edit seasonal price tiers (`Peak`, `Monsoon`, `All-Year`).
- Every change automatically appends a version snapshot to `versions[]` tracking who made the edit, the timestamp, and the previous snapshot.
- One-click duplicate (`/admin/packages/:id/duplicate`) enables spinning off 5-day variations into 7-day variations in seconds.
- Draft packages can be previewed through the server-rendered package page with the owner-only `?preview=1` query flag before publishing.

---

## 5. The AI & Automation Engine: Reliability & Safety Guardrails

### 5.1 Real LLM Integration
The platform connects to OpenRouter via standard HTTP REST API calls. Both the enquiry enrichment pipeline (`enrichEnquiry`) and the custom package architect (`generateAIPackage`) prompt the LLM to output structured, parsable JSON.

### 5.2 Strict Failure & Hallucination Guardrails
The brief establishes unambiguous safety requirements: *"Extracted fields sit beside the original message for correction; nothing is sent or published until a consultant or editor accepts it; prices in drafts come from the package price table, never from the AI."*

Our system enforces this via three non-negotiable boundaries:

1. **Human-in-the-Loop Validation:**
   The AI never contacts travellers autonomously. It generates an editable *draft* stored in the database. The consultant reviews the original message alongside the extracted fields, adjusts them when needed, and explicitly sends the reply.
2. **Deterministic Pricing (Zero Price Hallucination):**
   The LLM prompt strictly forbids fabricating prices. All final quotations in `services/ai.js`, `controllers/travel.js`, and `models/quote.js` are computed mathematically:
   $$\text{Final Price} = (\text{Base Price} - \text{Fare Concession} - \text{Promo Discount}) \times 1.05 \text{ (GST)}$$
3. **Graceful Degradation via Regex Fallback:**
   If the LLM endpoint times out (timeout set to 6s for enquiries and 14s for trip planning) or the API key is not present, the system engages an internal Regex NLP parser (`extractFallback`). It reliably extracts dates, passenger counts, and budgets without throwing unhandled exceptions.

---

## 6. UI & UX Design Decisions

1. **Restrained Kerala Luxury Aesthetic:**
   - Palette: Deep Forest Palm (`#14382c`), Muted Gold (`#d4af37`), Warm Linen Canvas (`#fbfbfa`), and Slate Gray (`#4a5568`).
   - Clean serif headings (`Playfair Display`) paired with geometric sans-serif (`DM Sans`) for comfortable reading on mobile screens.
2. **MakeMyTrip-Style Special Fares Bar:**
   - Contextual fare selectors (Regular, Student, Armed Forces, GST Invoice, Senior Citizen, Doctors & Nurses, Honeymoon) with hover tooltips explaining eligibility and automatic discount calculations.
3. **Promotional Offers Carousel:**
   - Tabbed voucher cards (`MMTKERALA`, `HOUSEBOAT3K`, `ICICITRAVEL`) with one-click coupon copying and terms modals.
4. **Transparent Pricing Notice:**
   - Every public card and itinerary displays: *"From ₹XX,XXX / person · Twin sharing · GST extra"* adhering to Indian consumer protection regulations.
5. **Print-Ready Branded Quote Sheet:**
   - Corporate letterhead layout for Company A, Kochi with GSTIN, itemized tax invoice, itinerary summary, and interactive "Accept Quote" button.

---

## 7. Assumptions & Scope Trade-Offs

### 7.1 Labeled Assumptions
- **[ASSUMPTION-01] Currency & Tax:** All prices are in Indian Rupees (INR, ₹). Holiday packages are taxed at 5% GST under Indian tourism service guidelines.
- **[ASSUMPTION-02] Enquiry Conversion Rates:** As stated in the brief, sub-1-hour replies sustain a 15% booking rate, whereas 12+ hour delays drop conversion to 7%.
- **[ASSUMPTION-03] Double Occupancy:** Package rates assume twin sharing basis; single supplements are handled during quote customization.
- **[ASSUMPTION-04] DPDP Act 2023 Compliance:** WhatsApp follow-ups require affirmative consent; a dedicated opt-in checkbox is required on all forms.
- **[ASSUMPTION-05] Guest Access:** Travellers browse and submit enquiries without account creation; authentication is strictly for internal staff.

### 7.2 What Was Cut (Out of Scope)
- **Live GDS Flight / Hotel Inventory APIs:** Curated in-house inventory was prioritized over volatile live flight feeds as specified in the brief.
- **Payment Gateway Processing:** Razorpay/Stripe checkout was mocked via quote acceptance workflows.
- **Native iOS/Android Apps:** Replaced by a responsive, progressive-friendly mobile web experience.

### 7.3 Future Roadmap (What to Build Next)
1. **WhatsApp Business Cloud API:** Automated dispatch of accepted quotes to traveller WhatsApp upon consultant approval.
2. **Multi-Language Localization:** Hindi and German public package pages using EJS i18n dictionaries.
3. **Automated Lead Routing:** Dynamic round-robin lead allocation among active consultants based on queue depth.

4. **Activity log and finer-grained editor role:** The current core build uses owner, consultant, and customer roles and records package version snapshots. A separate immutable activity-log collection and editor-only role would be added next for the full enterprise scope.

---

## 8. Verification & Test Suite Summary

The application includes an automated test suite running via Node's native test runner (`node --test`), verifying:
1. **Offers Service:** Validates promo code lookups (`MMTKERALA`, `HOUSEBOAT3K`) and discount logic.
2. **AI NLP Extraction Fallback:** Verifies extraction of travellers, dates, destination, budget, and must-haves from real-world natural language strings.
3. **Database Seeding & Constraints:** Ensures sample packages `PKG-KL-07` (published, ₹32,500 peak / ₹24,900 monsoon) and `PKG-SI-12` (draft, ₹18,750) exist with correct attributes.
4. **Curated Stays & Sights:** Validates location-based querying across Munnar, Alleppey, and South India destinations.
5. **AI Package Generator:** Verifies end-to-end LLM integration, itinerary generation, DB hotel pairing, and GST itemization.

**Status:** `5/5 tests passing cleanly` (0 failures, 0 skipped).
