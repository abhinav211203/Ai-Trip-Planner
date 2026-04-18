# AI Trip Planner

An intelligent travel assistant built with Next.js that collects user preferences in chat, then generates a complete day-by-day itinerary using Gemini.

## Features

- Conversational trip planning flow
- Personalized itinerary generation
- Budget, group size, and duration-aware plans
- Suggested hotels, activities, and local tips
- Responsive interface

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Clerk (auth)
- Convex
- Gemini via `@google/genai`

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Add environment variables in `.env.local`:

- `GEMINI_API_KEY`
- `UNSPLASH_ACCESS_KEY` (optional, for real image enrichment)
- Clerk and Convex keys used by this project

3. Run the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Production build
- `npm run start` - Run production server
- `npm run lint` - Next.js lint command (requires ESLint setup)
