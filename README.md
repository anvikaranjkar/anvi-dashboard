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
- Editable todo completion dates, a dedicated today list and a monthly due-date calendar
- Clickable calendar days with a full agenda and one-tap creation of dated to-dos
- A separate archive where completed tasks can be restored or permanently removed
- Upcoming meeting planner with editable dates, start/end times, details and per-meeting alert timing
- Installable web app for iPhone and Mac with native-style notification support
- Timed todo reminders, flexible meeting alerts and a configurable morning summary
- Goals by time horizon, chronologically ordered countdowns, bookmarks, notes and square bulk-upload image boards
- Subject-specific resource links and notebooks, plus a dedicated editable Ideas page
- Computer-uploaded home covers and an optional Spotify track, album or playlist player
- A responsive `/display` focus screen with a flip clock, today’s tasks, active study timer, optional countdown and live Spotify artwork ambience
- Automatic Supabase sync for cross-device data and image storage
- JSON export/import backup

## Deploy to Vercel

1. Extract the ZIP and upload the folder to GitHub, GitLab or Bitbucket.
2. In Vercel, choose **Add New → Project**, import the repository and keep the detected **Next.js** settings.
3. Press **Deploy**. The supplied Supabase project is already configured in the app, so no environment variables are required.

Vercel uses the included `vercel.json`, runs `npm install`, then runs the standard Next.js Vercel build.

## Supabase setup

1. Open the configured Supabase project.
2. Open **SQL Editor**, paste `supabase/setup.sql`, and run it once.
3. Open the dashboard on any device. It loads and saves the same Supabase record automatically, with no passphrase or connection setup.

The app keeps an on-device cache for offline continuity. Supabase remains the shared source for cross-device persistence, and its `vision-board` storage bucket holds uploaded images.

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
