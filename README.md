# LifeTrack — MERN habit and daily task tracker

A personal tracking app built with MongoDB, Express, React and Node.js.

## Architecture

- **Permanent Habits:** created once and tracked each day. Namaz is seeded as five separate habits (Fajr, Dhuhr, Asr, Maghrib, Isha). Fitness and Self Improvement habits are user-managed.
- **Daily Tasks:** date-specific Work, Skills/Studies and Personal tasks. Tasks are stored against a calendar date and can be completed independently.
- **Home dashboard:** combines all active habits and tasks for the selected date with one-click completion.
- **History:** habit entries and archived tasks remain available to historical reports after the habit/task is archived.

## Requirements

- Node.js 18+
- MongoDB Community Server running locally or a MongoDB connection string

## Setup

1. Copy `server/.env.example` to `server/.env` and configure `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, and `PORT`.
2. Install dependencies:

   ```bash
   npm run install:all
   ```

3. Start both apps:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173`.

## Main API routes

All tracking routes require a JWT bearer token.

- `GET/POST /api/tracking/habits`
- `PUT/DELETE /api/tracking/habits/:id`
- `GET /api/tracking/habits/entries?date=YYYY-MM-DD`
- `PUT /api/tracking/habits/:id/entries` body: `{ "date": "YYYY-MM-DD", "completed": true }`
- `GET/POST /api/tracking/daily-tasks`
- `PUT/DELETE /api/tracking/daily-tasks/:id`
- `GET /api/tracking/dashboard?date=YYYY-MM-DD`

Existing authentication, planner, profile, reminder, notifications and PDF report endpoints remain available.

## Data safety

- Habit completion is stored separately from the habit definition.
- Archiving a habit does not delete its historical entries.
- Deleting a daily task archives it instead of physically removing its record.
- Existing Fitness and Self Improvement records in the old reusable Task collection are migrated into the new Habits collection on first tracking request. Old Work/Skills library entries are not converted into permanent habits because those are now date-specific tasks.

## Leaderboard

LifeTrack includes an opt-in member leaderboard at `/leaderboard`.

- Members must explicitly join before appearing in rankings. The default is private (`leaderboardOptIn: false`).
- Only the member's display name and aggregate completion score are returned. Email addresses, habit titles, and task titles are never exposed by the leaderboard API.
- Rankings are available for today, this week, this month, and all time.
- The score is the percentage of tracked habit-days and date-specific tasks completed in the selected period.
- Members can join or leave from the Leaderboard page, or change the preference in Settings.

The backend endpoint is `GET /api/leaderboard?period=weekly` (accepted periods: `daily`, `weekly`, `monthly`, `all`). It requires the normal LifeTrack bearer token.
