# KARIGAR CONNECT — Development & Demo Guide

**Other apps tell you who is available. Karigar Connect tells you who is proven.**  
*Pakistan's Practical Skills-Evidence, Verified Job Proof & Trust Platform (English / اردو)*

> **Verification Scope Note**: A verified badge means a competency was assessed by an authorized assessor using a defined practical rubric. It is **NOT** government accreditation.

---

## Core Capabilities (v2)

1. **Three Layers of Trust (`/why-karigar-connect`, `/trust-score-guide`)**:
   - **Assessor-Verified Skills**: 0–3 rubric scoring with mandatory safety-critical checks, appeals, and 12-month expiring badges.
   - **Verified Hire Customer Reviews**: 1 verified review per completed job (overall + 4 sub-ratings + quick tags + before/after photos), Bayesian weighted ratings, 48-hour customer edit window, 1-time worker reply, and moderation reporting.
   - **Customer-Confirmed Proof of Work**: Completed job photo evidence confirmed by customers (`before` / `after` photos in IndexedDB).
2. **All Cities of Pakistan (`src/data/pakistanCities.ts`)**: Searchable `CityCombobox` grouped by 7 provinces/territories across registration, worker/customer profiles, assessor applications, and Explore Workers filters (with custom "Other" city fallback).
3. **48+ Service Categories & PKR Fair Price Guides (`src/data/serviceCatalog.ts`)**: 8 service groups covering home electrical, plumbing, AC/HVAC, appliances, carpentry/painting, masonry/welding, solar/generators, and women-safe home services, with admin-editable PKR fair price ranges.
4. **End-to-End Job Lifecycle (`/worker/jobs`, `/employer/jobs`)**: `REQUESTED -> ACCEPTED -> SCHEDULED -> IN_PROGRESS -> COMPLETED` (plus `CANCELLED` & `DISPUTED`), contact privacy lock until worker acceptance, trusted-contact safety check-in summary, and Urgent SOS (`JOB_SOS`).
5. **Karigar Trust Score (0–100) & Tiers (`BRONZE` | `SILVER` | `GOLD` | `PLATINUM`)**: Transparent score breakdown, Admin-configurable tier rules (`/admin/tier-rules`), Tier Review Queue (`/admin/tiers`), automatic `"Under Review"` flag on rating drops, and 7-Day Karigar Guarantee rework disputes (`/admin/disputes`).
6. **QR Karigar Passport (`/verify-badge`, `/worker/growth`)**: Scannable QR passport code + instant public verification lookup, printable Passport, PKR earnings log, and City Leaderboard.
7. **AI Problem Finder (`/ai-finder`)**: Recommends service categories and `"AI estimate only"` PKR price guides via `@google/genai` server route (`/api/problem-finder`) with deterministic offline bilingual fallback when no API key is configured.
8. **Bilingual EN / Urdu RTL + Voice Input**: Full English/Urdu (`ur-PK`) layout mirroring and Web Speech API (`VoiceMicButton`) for worker bios and skills.

---

## Internal Storage Architecture (No External Database)

KARIGAR CONNECT runs inside your browser with zero external databases and zero database credentials:

- **Structured Application Data (`localStorage` key `kc_db_v1`, schema `version: 2`)**: Stores users, profiles, trades & Fair Price Guides, starter competencies, rubric criteria, evidence metadata, verification requests, rubric scores, verification badges, jobs, verified reviews, guarantee disputes, tier rules & tier applications, earnings logs, shortlists, contact requests, reports, notifications, and audit logs. Existing v1 databases migrate automatically without duplicate records.
- **Evidence & Job Proof Files (`IndexedDB` database `karigar_connect_files`)**: Stores uploaded evidence and before/after job photos/videos as binary `Blob`s, generating live object-URL previews without bloating `localStorage`.
- **Browser Authentication & Session (`localStorage` key `kc_session_v1`)**: Passwords are hashed using Web Crypto API **PBKDF2-SHA256** with random per-user salts. Admin self-registration is blocked.

---

## Seeded Demonstration Accounts

All seeded accounts share the demo password:

`KarigarDemo@2026`

| Role | Name | Email | What to Demonstrate |
| :--- | :--- | :--- | :--- |
| **Worker (Electrician)** | Bilal Ahmed | `bilal.worker@karigarconnect.pk` | Open **Competency Matrix**, view **Tier & Trust Score (0–100)**, manage **My Jobs** (accept/schedule/upload after-photos), check **Growth Hub & QR Passport**, and reply to Verified Hire reviews. |
| **Worker (Women-Safe)** | Zainab Fatima | `zainab.beauty@karigarconnect.pk` | Demonstrates the **Female Professional** filter, home beauty/parlour services, QR Passport, and Trust Score. |
| **Worker (AC / HVAC)** | Hamza Raza | `hamza.ac@karigarconnect.pk` | Browse verified HVAC skills, Fair Price Guides, and completed job proof gallery. |
| **Worker (Plumber)** | Tariq Naveed | `tariq.plumber@karigarconnect.pk` | Inspect Gold-tier plumber metrics, verified competencies, and public proof gallery. |
| **Worker (Appliance Tech)** | Sohail Akhtar | `sohail.appliance@karigarconnect.pk` | Appliance & solar/UPS service worker profile and job records. |
| **Worker (Carpenter)** | Nadia Bibi | `nadia.carpenter@karigarconnect.pk` | Carpentry & wood finishing skills matrix and female professional services. |
| **Worker (Mechanic)** | Usman Tariq | `usman.mechanic@karigarconnect.pk` | Auto & generator mechanic profile and competencies. |
| **Customer / Employer** | Ms. Sana Malik | `sana.employer@karigarconnect.pk` | Filter **Explore Workers** by Pakistan city/province, service group, rating & female-pro toggle, book a job, confirm completion proof, leave a Verified Hire review, or open a 7-Day Guarantee dispute. |
| **Customer (Individual)** | Ahmed Raza | `ahmed.customer@karigarconnect.pk` | Individual homeowner account (`INDIVIDUAL`) with active/completed jobs and verified reviews. |
| **Assessor** | Mr. Tariq Mahmood | `tariq.assessor@karigarconnect.pk` | Open **Verification Queue**, review Bilal's **Basic Electrical Wiring** evidence, test the safety-critical `0` verification block, score the 0–3 rubric, and issue a 12-month badge. |
| **Admin** | Ayesha Siddiqui | `admin@karigarconnect.pk` | Review pending Assessor application (**Kamran Qureshi**), manage **Tier Queue** & **Tier Rules**, resolve **7-Day Guarantee Disputes** & **SOS/Review Reports**, edit **Fair Price Guides**, and inspect **Audit Logs**. |

---

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Optionally set `GEMINI_API_KEY` in your server environment to enable live Gemini responses on `/api/problem-finder` (without it, the app cleanly uses deterministic offline matching). Seed data initializes automatically on first load and never duplicates on refreshes.

