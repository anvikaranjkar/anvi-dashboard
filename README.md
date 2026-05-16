# ✦ ANVI'S SPACE — Dashboard 2026

A personal, pixelated Y2K-aesthetic study dashboard built for HSC 2026. Tracks subjects, to-dos, countdowns, study sessions, goals, and more — synced via Supabase and deployable on Vercel in minutes.

---

## Features

- **Passcode lock screen** — password protected on load
- **Dashboard overview** — urgent tasks, upcoming deadlines, study stats at a glance
- **Subject pages** — per-subject tasks, insights, notes, links, and countdown timers
- **All To-Dos** — unified task list across all subjects, including Maths exercises
- **Goals** — track goals across this week, this term, 6 months, and this year
- **Countdowns** — live ticking day/hour/minute/second countdown widgets for assessments
- **Study timer** — log study sessions per subject with automatic stats
- **Extracurriculars** — track work, projects, Gender Lens tasks, and LinkedIn
- **Resources** — bookmarks, quick notes, and a vision board
- **Night / Day mode** — toggle between light and dark themes, saved to localStorage
- **Supabase sync** — all data persists in the cloud across devices
- **Pixel Spider-Man sticker** — floating in the corner for moral support 🕷️

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React (via Vite) |
| Styling | Plain CSS with CSS variables (no Tailwind) |
| Database | Supabase (PostgreSQL via REST) |
| Fonts | Pixelify Sans, Space Mono, Inter |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/anvi-dashboard.git
cd anvi-dashboard
```

### 2. Install dependencies

```bash
npm install @supabase/supabase-js
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In the SQL editor, run:

```sql
create table hsc_dashboard (
  id int8 primary key,
  payload jsonb
);
```

3. Copy your **Project URL** and **anon public key** from Project Settings → API

### 4. Add your credentials

In `index.js`, update these two lines at the top:

```js
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

You can also change the passcode:

```js
const PASSCODE = "hsc2026";
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploying to Vercel

### Option A — via GitHub (recommended)

1. Push your project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New → Project**
3. Import your repo — Vercel auto-detects Vite
4. Click **Deploy**

You'll have a live URL in ~30 seconds.

### Option B — via Vercel CLI

```bash
npm install -g vercel
vercel
```

### Custom domain

In Vercel → your project → **Settings → Domains**, add your domain. SSL is automatic.

---

## Environment Variables (optional but recommended for public repos)

If your repo is public, move your Supabase credentials out of the source code:

1. In Vercel → **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Update `index.js`:

```js
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

> Note: The Supabase anon key is read-only by design, so hardcoding it in a private repo is fine.

---

## Project Structure

```
anvi-dashboard/
├── src/
│   └── index.js          # Entire app — all components, styles, and logic
├── index.html
├── package.json
└── vite.config.js
```

Everything lives in one file by design — easy to read, edit, and ship.

---

## Customisation

| What | Where in index.js |
|---|---|
| Your name | `DEFAULT_DATA.settings.name` |
| Subjects | `DEFAULT_DATA.subjects` |
| Passcode | `const PASSCODE` |
| Accent colours | `:root` CSS variables |
| Hero background | Settings page → Hero Image URL |

---

## Night Mode

Toggle between day and night mode using the **🌙 Night Mode** button at the bottom of the sidebar. Your preference is saved to `localStorage` and persists across sessions.

---

*Built for HSC 2026. Good luck Anvi — you've got this. ✦*
