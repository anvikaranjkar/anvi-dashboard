# Anvi’s Dashboard

A responsive personal student dashboard for tasks, goals, subject insights, Maths exercises, countdowns, notes, vision-board images, reminders and detailed study statistics.

## What’s included

- Live study timer and manual session logging with date, time, subject, duration and study notes
- Daily, weekly, lifetime, average, consistency and longest-session statistics
- Seven-day study chart, subject breakdown and week-over-week comparison
- Overall todos grouped by subject, including required Maths exercises
- Goals by time horizon, live countdowns, bookmarks, notes and image boards
- Supabase sync for cross-device data and image storage
- JSON export/import backup

## Deploy to Vercel

1. Extract the ZIP and upload the folder to GitHub, GitLab or Bitbucket.
2. In Vercel, choose **Add New → Project**, import the repository and keep the detected **Next.js** settings.
3. Add these environment variables in Vercel if you want Supabase preconfigured:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Press **Deploy**. You can also leave the variables empty and enter both values later in the app’s Settings page.

Vercel uses the included `vercel.json`, runs `npm install`, then runs the standard Next.js Vercel build.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste `supabase/setup.sql`, and run it once.
3. Add the Supabase project URL and anonymous key to Vercel, or paste them into the app’s Settings page.
4. Use the same private passphrase on each device to open the same dashboard record.

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
