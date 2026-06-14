# LadderLive — Claude Guidelines

## Deployment

**Always ask before committing or pushing to GitHub.**

Before running any `git commit` or `git push`, explicitly confirm with the user:
> "Ready to commit and push to GitHub — shall I go ahead?"

Do not deploy unless the user says yes. When the user asks to "see what something looks like" or "try an option", implement it locally only.

The only exception is running DB migration scripts locally (against staging), which can proceed without confirmation.

## Environments

- **Localhost (dev)**: `npm run dev` → http://localhost:3000 — safe to use freely
- **Staging (Vercel Preview / GitHub `main`)**: NeonDB main branch — has test data
- **Production**: NeonDB new branch — empty, real users; do NOT touch until explicitly asked

When running scripts against the DB, they run against staging (`.env.local`) by default. Always confirm before running against production.

## Design Changes

When the user asks to "see" or "try" a design option:
1. Implement it locally only
2. Let the user review at http://localhost:3000
3. Only commit and push after explicit approval

When presenting multiple design options, use ASCII mockups or describe the options first. Do not implement any option until the user has chosen.

## Code Practices

- Do not add features, abstractions, or error handling beyond what is asked
- Do not refactor surrounding code when fixing a bug
- Default to no comments unless the WHY is non-obvious
- Always run `npm run build` before committing to catch errors

## Stack Reference

- **Framework**: Next.js 14 Pages Router (not App Router)
- **DB**: PostgreSQL via `@neondatabase/serverless` — session key `ladderlive_session`
- **Auth**: Phone + PIN (bcryptjs v2 only — v3 breaks Next.js API routes)
- **Deployment**: Vercel, auto-deploys from GitHub `main`
- **Phone format**: Always stored with 65 prefix, exactly 10 digits (e.g. `6591234567`)
- **Ladder slugs**: Random 8-char codes — never regenerate on name change
- **Points**: win=4, draw=1, loss=1 across all ladders
