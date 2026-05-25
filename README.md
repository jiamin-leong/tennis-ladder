# 🎾 Tennis Ladder

A Next.js web app for running a tennis ladder competition — tracks players, match scores, and standings automatically. Built to connect with WhatsApp group chats for easy player management.

## Features

- **Leaderboard** — live ranked standings with points, W/L record
- **Match history** — full results log with automatic point calculation
- **Submit scores** — set-by-set score entry, points awarded instantly
- **WhatsApp import** — upload a group chat export to auto-detect players
- **Season settings** — start/end dates, countdown timer, join policy
- **PostgreSQL backend** — all data persisted via Vercel Postgres

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/tennis-ladder.git
cd tennis-ladder
npm install
```

### 2. Create a Vercel Postgres database

1. Push to GitHub, then import the repo at [vercel.com/new](https://vercel.com/new)
2. In your Vercel project → **Storage** → **Connect Store** → **Create New** → **Postgres**
3. Name it (e.g. `tennis-ladder-db`) and hit Create
4. Vercel auto-injects the env vars into your project

### 3. Set up local environment

```bash
# Pull env vars from Vercel to your local machine
npx vercel env pull .env.local
```

Or copy `.env.example` → `.env.local` and fill in the values manually from the Vercel Postgres dashboard.

### 4. Create database tables

```bash
npm run db:setup
```

This runs `scripts/setup-db.js` and creates the `players`, `matches`, and `ladder_settings` tables.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Deploy

```bash
git push origin main
```

Vercel auto-deploys on every push. Your app is live at `https://your-project.vercel.app`.

---

## Project structure

```
tennis-ladder/
├── pages/
│   ├── index.js              # Main app page
│   └── api/
│       ├── players.js        # GET /api/players, POST /api/players
│       ├── matches.js        # GET /api/matches, POST /api/matches
│       ├── settings.js       # GET /api/settings, PUT /api/settings
│       └── whatsapp-parse.js # POST /api/whatsapp-parse
├── components/
│   ├── Leaderboard.js
│   ├── Matches.js
│   ├── SubmitScore.js
│   ├── Players.js
│   └── Settings.js
├── lib/
│   ├── db.js                 # PostgreSQL connection pool
│   └── utils.js              # Points calculator, WhatsApp parser
├── scripts/
│   └── setup-db.js           # One-time DB table creation
└── styles/
    └── globals.css
```

---

## Scoring system

| Result | Winner | Loser |
|---|---|---|
| Straight sets (2–0) | +3 pts | +0 pts |
| Three-setter (2–1) | +2 pts | +1 pt |
| Walkover / forfeit | +1 pt | −1 pt |

---

## WhatsApp import

1. In WhatsApp, open your group chat
2. Tap ⋮ → More → Export chat → **Without Media**
3. Share the `.txt` file to yourself
4. In the app, go to **Players** → tap the import area → upload the file
5. All senders are detected automatically; confirm who to add to the ladder

---

## Tech stack

- **Frontend**: Next.js 14, React 18
- **Backend**: Next.js API routes (serverless functions)
- **Database**: PostgreSQL via Vercel Postgres (Neon)
- **Deployment**: Vercel
