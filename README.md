# Anvi’s Dashboard

A responsive personal student dashboard for tasks, goals, subject insights, Maths exercises, countdowns, notes, vision-board images, reminders and detailed study statistics.

## What’s included

- Live study timer and manual session logging with date, time, subject, duration and study notes
- Daily, weekly, lifetime, average, consistency and longest-session statistics
- Seven-day study chart, subject breakdown and week-over-week comparison
- Overall todos grouped by subject, including required Maths exercises
- Optional todo completion dates with a monthly due-date calendar
- Simple upcoming meeting planner with date, time and details
- Installable web app for iPhone and Mac with native-style notification support
- Timed todo reminders, 15-minute meeting alerts and a configurable morning summary
- Goals by time horizon, live countdowns, bookmarks, notes and image boards
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

## Production check

```bash
npm run build:vercel
npm start
```
