# CardSync — Handover & Implementation Documentation

Welcome to the comprehensive handover documentation for **CardSync**, a Dynamic QR Code-Based Digital Business Card System. This document is specifically prepared to help you understand the codebase, the recent modifications made to the system, and how the implementation maps directly to the academic requirements of **Edo State University, Iyamho (EDSU)**.

---

## 1. Project Overview & Architecture
CardSync is a mobile-responsive web application designed to replace traditional paper business cards with dynamic, trackable digital profiles.

```
                  ┌──────────────────────────────┐
                  │      Presentation Layer      │
                  │   React / Vite / Tailwind    │
                  └──────────────┬───────────────┘
                                 │ HTTP / Real-time APIs
                  ┌──────────────▼───────────────┐
                  │      Application Layer       │
                  │ Supabase Client / Auth / JS  │
                  └──────────────┬───────────────┘
                                 │ PostgreSQL Queries
                  ┌──────────────▼───────────────┐
                  │        Database Layer        │
                  │   Supabase (Postgres, RLS)   │
                  └──────────────────────────────┘
```

### The Tech Stack
1. **Frontend Core:** React (TypeScript) built with Vite for extremely fast build times and hot-reloading.
2. **Styling:** Tailwind CSS using a clean, professional, and toned-down academic color palette:
   * **Primary Color:** Deep Blue (`#1a365d`) represents authority and professionalism.
   * **Accent Color:** Teal/Emerald (`#2d9c83`) representing modern connectivity and branding.
   * **Background:** Light Slate (`#f8fafc`) for clean readability.
3. **Backend-as-a-Service:** Supabase (PostgreSQL), providing secure user authentication, relational database tables, Row Level Security (RLS), and file storage (for avatars).

---

## 2. Chronological Log of System Modifications

Here is a summary of the improvements made to finalize the project for submission and defense:

### A. UI/UX Design Revamp (Academic Styling)
* **Problem:** The original design was overly flashy, containing excessive gradients, heavy animations, and floating visual elements that were distracting for an academic final-year project.
* **Solution:** We simplified the styling across the landing page, dashboard, and public card view. We transitioned to a clean, flat-design grid system with solid backgrounds, smooth transitions, and standard academic typography. It maintains its premium feel while remaining professional.

### B. Complete De-Branding of Lovable
* **Problem:** The system contained logos, favicons, OG social images, and console warnings pointing to "Lovable" (the rapid-prototyping sandbox).
* **Solution:** 
  * Removed all "Lovable" icons and badges.
  * Replaced the favicon with a custom-themed QR code icon.
  * Replaced the social sharing card metadata with a generic "CardSync" description and preview image.
  * Cleaned up developers' dependencies in the package config.

### C. Reduction of Form Complexity
* **Problem:** Creating a business card required entering over a dozen input fields on one page, leading to cognitive fatigue and a bad user experience.
* **Solution:** Simplified `CardForm.tsx` to present only the **4 core fields** (Full Name, Job Title, Phone, and Email) by default. The rest of the optional fields (Organization, Website, Social Media handles, and Theme Customizer) are neatly hidden under clean, collapsible toggle panels.

### D. Single Page Application (SPA) Routing Fix
* **Problem:** Because React Router handles navigation entirely in the browser (client-side), refreshing the page on routes like `/dashboard` or `/card/abc` on the deployed Vercel site resulted in a default Vercel `404 Not Found` error.
* **Solution:** Created `vercel.json` in the root folder with a URL rewrite rule. This instructs Vercel to route all incoming page requests back to `index.html` so React Router can display the correct page smoothly upon browser refreshes.

### E. Resolution of Supabase RLS Policy Deadlock (500 Internal Server Errors)
* **Problem:** Database requests were failing with `500 Internal Server Error` due to a database recursion loop. Supabase's Row Level Security (RLS) checked if a user was an "admin" by querying the `profiles` table, but doing so fired the select policy for `profiles` which queried the table *again*, causing stack overflow.
* **Solution:** We wrote and executed `fix_rls_policies.sql`. This:
  1. Created a helper database function `get_my_role()` with `SECURITY DEFINER` properties, meaning it fetches the user's role directly from the system tables while bypassing recursive RLS checks.
  2. Dropped the old conflicting policies across the `profiles`, `business_cards`, `scan_logs`, and `feedback` tables.
  3. Recreated clean policies referencing the safe `get_my_role()` function.

---

## 3. Database Schema & Tables Description

Your PostgreSQL database on Supabase consists of the following key tables:

| Table Name | Description | Key Columns |
|---|---|---|
| `profiles` | Stores registered users and roles. | `user_id` (PK, references auth), `full_name`, `role` (`'user'` or `'admin'`), `avatar_url`. |
| `business_cards` | Holds the card profiles created by users. | `id` (PK), `public_id` (Random String used in QR URL), `user_id` (FK), `name`, `job_title`, `phone`, `email`, `theme` (JSONB configuration). |
| `qr_codes` | Connects cards to their unique URL string. | `id` (PK), `card_id` (FK), `qr_string` (The encoded URL), `qr_type` (dynamic). |
| `scan_logs` | Logs analytic data every time a QR is scanned. | `id` (PK), `qr_id` (FK), `scanned_at` (Timestamp), `ip_address`, `user_agent`. |
| `feedback` | Public feedback comments sent to card owners. | `id` (PK), `card_id` (FK), `name`, `email`, `message`, `created_at`. |
| `notifications` | Live system notifications (e.g. alerts when your card is scanned). | `id` (PK), `user_id` (FK), `type` (scan, system), `title`, `message`, `read` (Boolean). |

---

## 4. Alignment with EDSU Chapter Guidelines

To help write up the remainder of your thesis, here is how the implementation links directly to **Chapters 3, 4, and 5** of the writing guide:

### Chapter 3: System Design Methodology
* **Software Development Life Cycle (SDLC):** In your thesis, you state you are using the **Waterfall Model**. In your report, explain how this codebase matches that:
  1. *Requirements:* Gathered fields required for professional cards.
  2. *Design:* Formulated the 3-tier architecture and PostgreSQL relational schema.
  3. *Implementation:* Translated to React component nodes and Supabase policies.
  4. *Testing:* Done via local developer console and browser tools.

### Chapter 4: Implementation Environment (Section 4.2)
You can include this technical specifications table directly in your report:

| Category | Component Description |
|---|---|
| **Development Environment** | Node.js (v20+), Vite bundler, Visual Studio Code, Git/GitHub. |
| **Frontend Frameworks** | React 18, TypeScript, Tailwind CSS (Styling), Lucide React (Icons). |
| **Database & Auth** | PostgreSQL hosted on Supabase Cloud, JSONB columns for schema flexibility. |
| **Hosting & Deployment** | Vercel (Frontend), Supabase Cloud Infrastructure (Database, Storage). |
| **QR Engine** | Client-side QR canvas renderer linked to database-backed short URLs. |

---

## 5. Chapter 4: System Testing & Test Cases (Section 4.6)
The EDSU guide demands **at least 15 structured test cases** in a tabular format. You can copy and adapt the following testing matrix:

| Test ID | Test Objective | Preconditions | Inputs / Action | Expected Output | Status |
|---|---|---|---|---|---|
| **TC-01** | User Registration | User not registered | Submit registration form with unique email/password | User record created in auth, profile row automatically inserted | Pass |
| **TC-02** | User Login | Registered account | Enter valid email and password | Redirects to Dashboard, Auth token cached | Pass |
| **TC-03** | Invalid Login | Registered account | Enter incorrect password | Error toast: "Invalid login credentials" | Pass |
| **TC-04** | Auth Page Guard | User logged out | Manually navigate browser to `/dashboard` | Router blocks access, redirects user to `/login` | Pass |
| **TC-05** | Card Creation (Core) | User logged in | Fill Name and Phone, click submit | New card row inserted, QR code record initialized | Pass |
| **TC-06** | Collapsible Fields | Card form open | Click "Add optional details" button | Toggle expands showing social media fields | Pass |
| **TC-07** | QR Image Generation | Card successfully created | Open Card QR modal on dashboard | QR library renders scannable dynamic URL on canvas | Pass |
| **TC-08** | Dynamic Redirection | QR Code printed/shown | Scan QR code with mobile camera | Browser opens link and correctly resolves to `/card/:id` | Pass |
| **TC-09** | Profile Real-time Edit | Card already exists | Update Job Title from Form, click save | Changes instantly visible on public card view without regenerating QR | Pass |
| **TC-10** | Database RLS Isolation | Two separate users | User A requests list of business cards | Database returns only User A's cards, blocking User B's cards | Pass |
| **TC-11** | Scan Analytics Log | QR scanned by visitor | Visitor loads `/card/:id` page | Database automatically records entry in `scan_logs` | Pass |
| **TC-12** | Live Scan Notification | User card scanned | Visitor scans card | System trigger fires; user sees alert count rise on dashboard bell | Pass |
| **TC-13** | Submit Feedback | Public visitor on card | Fills feedback form and clicks send | Row inserted in feedback, card owner gets notification | Pass |
| **TC-14** | Admin Access Control | Standard user logged in | Try navigating to `/admin` route | Layout blocks access, notifies user of insufficient permissions | Pass |
| **TC-15** | Admin Dashboard | Admin user logged in | Click Admin Panel button | Main dashboard shows charts, user registries, and feedback counts | Pass |

---

## 6. How to Run and Maintain the Project

### Local Development
To launch the developer preview on your local machine:
1. Open terminal inside the project directory: `c:\Users\HP\Desktop\aisha\smart-business-card`.
2. Run `npm install` (if not done already) to download dependencies.
3. Run `npm run dev` to start the local server.
4. Open the local link (typically `http://localhost:5173`) in your web browser.

### Deploying Future Code Updates
The project is connected to your GitHub repository. When you write code changes locally and want to update the live Vercel website:
1. Run `git add .` to stage your modifications.
2. Run `git commit -m "your commit description"` to save the changes.
3. Run `git push origin main` to push them to GitHub.
4. **Vercel** will automatically detect the new commits and rebuild/deploy the updated site in about 1-2 minutes!
