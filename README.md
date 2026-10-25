# Anvi’s Dashboard

## Deploy on Vercel

1. Upload this folder to a new GitHub repository.
2. In Vercel, choose **Add New → Project**, import that repository, and deploy.
3. Vercel automatically uses `npm run build:vercel` through `vercel.json`.

For Spotify live playback, add this Redirect URI in your Spotify developer app after your Vercel project has its final domain:

`https://YOUR-VERCEL-DOMAIN/spotify/callback`

A responsive personal student dashboard for tasks, goals, subject insights, Maths exercises, countdowns, notes, vision-board images, reminders and detailed study statistics.

## What’s included

- Open, Pomodoro preset and custom-length study timers with a “working on” note, plus manual session logging
- Daily, weekly, lifetime, average, consistency and longest-session statistics
- Seven-day study chart, subject breakdown and week-over-week comparison
- Overall todos grouped by subject, including required Maths exercises
- A daily card board with Today, All Subjects, Personal and individual subject tabs
- A subject/area selector whenever you create or edit a to-do, reminder, countdown or event
- Editable todo completion dates, a dedicated today list and a monthly due-date calendar
- Automatic rollover of unfinished overdue work into today’s list and focus display
- Clickable calendar days with a full agenda and one-tap creation of dated to-dos
- A separate archive where completed tasks can be restored or permanently removed
- Upcoming meeting planner with editable dates, start/end times, details and per-meeting alert timing
- Installable web app for iPhone and Mac with background Web Push support
- Timed todo reminders, flexible meeting alerts, overdue nudges and configurable morning/evening summaries
- Goals by time horizon, chronologically ordered countdowns, bookmarks, notes and square bulk-upload image boards
- Subject-specific resource links and notebooks, plus a dedicated editable Ideas page
- A combined resource library that automatically includes links saved inside every subject
- Computer-uploaded home covers and an optional Spotify track, album or playlist player
- A responsive `/display` focus screen with a flip clock, today’s tasks, active study timer, optional countdown and live Spotify artwork ambience
- Auto, light and dark themes, an optional compact phone layout and reduced-motion controls
- Calendar-driven countdown creation plus configurable morning, overdue and evening reminders
- Automatic Supabase sync for cross-device data and image storage
- JSON export/import backup

## Deploy to Vercel

1. Extract the ZIP and upload the folder to GitHub, GitLab or Bitbucket.
2. In Vercel, choose **Add New → Project**, import the repository and keep the detected **Next.js** settings.
3. Press **Deploy**. The supplied Supabase project is already configured for dashboard data. Background push is optional and needs the one-time setup below.

Vercel uses the included `vercel.json`, runs `npm install`, then runs the standard Next.js Vercel build.

## Supabase setup

1. Open the configured Supabase project.
2. Open **SQL Editor**, paste `supabase/setup.sql`, and run it once.
3. Open the dashboard on any device. It loads and saves the same Supabase record automatically, with no passphrase or connection setup.

The app keeps an on-device cache for offline continuity. Supabase remains the shared source for cross-device persistence, and its `vision-board` storage bucket holds uploaded images.

## Background notifications while the app is closed

The app now contains the complete Web Push system: each phone or laptop registers itself, Supabase stores the device subscription, and the secure notification route sends todo reminders, event alerts, morning summaries, overdue nudges and evening check-ins.

Do this once:

1. Run the updated `supabase/setup.sql` in **Supabase → SQL Editor**. This creates the two private notification tables.
2. On your computer, run `npm run push:keys`. Copy the two generated values.
3. In **Supabase → Project Settings → API**, copy the **service role key**. Keep this private.
4. In **Vercel → Project → Settings → Environment Variables**, add:
   - `SUPABASE_SERVICE_ROLE_KEY` — the private Supabase service role key
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — the generated public key
   - `VAPID_PRIVATE_KEY` — the generated private key
   - `VAPID_SUBJECT` — for example `mailto:your-email@example.com`
   - `CRON_SECRET` — a new random password of at least 16 characters
5. Choose a scheduler:
   - **Vercel Pro:** replace `vercel.json` with the supplied `vercel-cron.pro.example.json`, then redeploy. It checks every 15 minutes.
   - **Vercel Hobby:** leave `vercel.json` as-is so deployment succeeds. Use a scheduler such as cron-job.org to call `https://YOUR-VERCEL-DOMAIN/api/cron/notifications` every 15 minutes with the header `Authorization: Bearer YOUR_CRON_SECRET`.
6. Redeploy the project. Open **Settings → Web notifications** on each device and turn it on.

On iPhone, open the deployed site in Safari, choose **Share → Add to Home Screen**, launch the installed app, then enable notifications. Browser and operating-system rules mean no website can silently grant itself notification permission; every device must opt in once.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For the always-on iPad, laptop or phone view, open `http://localhost:3000/display`. After deployment, use `https://YOUR-VERCEL-DOMAIN/display` and tap **Full screen**.

## Production check

```bash
npm run build:vercel
npm start
```
