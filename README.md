# Neurora

An AI-powered mental wellness companion for students preparing for high-stakes examinations (JEE, NEET, UPSC, CAT, GATE, CUET, Board Exams).

## Architecture Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Shadcn-style UI, React Query, Recharts | All UI pages, client state, charts |
| **Backend** | Next.js API Routes (Route Handlers) | REST API for check-ins, AI analysis, chat, insights |
| **Database** | MongoDB (via Mongoose) | Persistent storage for check-ins, profiles, chat history |
| **AI Engine** | OpenAI API | LLM analysis, mindfulness, motivation, chat (default: `gpt-4o-mini`) |
| **Encryption** | AES-256-GCM (Node.js crypto) | Journal entries encrypted at rest before MongoDB storage |

### Deployment

Designed for **one-click deploy on Vercel**:
- Frontend + API routes run as a single Next.js app
- MongoDB Atlas for managed database (free tier available)
- OpenAI for AI (pay-per-use API key from platform.openai.com)

## Features

- **Daily Check-In** — Journal, mood, energy, sleep, study hours, exam context
- **AI Journal Analysis** — 10-dimension emotional analysis with pattern detection
- **Emotional Insights Dashboard** — Trends, correlations, weekly summaries, risk alerts
- **Wellness Dashboard** — Composite wellness score with breakdown
- **Mood History** — Timeline of all check-ins with charts
- **Mindfulness Coach** — AI-personalized exercises (breathing, grounding, exam anxiety, sleep prep)
- **Motivation Center** — Affirmations, encouragement, progress celebrations
- **Burnout Risk Monitor** — Early warning system with recovery recommendations
- **AI Companion Chat** — Conversational coach with memory of goals and patterns

### Advanced Features

- Exam Stress Predictor
- Confidence Tracker
- Study-Wellness Correlation Engine
- Wellness Score (mood + sleep + stress + confidence + consistency)
- Early Warning System for severe distress

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string (Atlas or local) |
| `OPENAI_API_KEY` | Yes | API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | No | Model name (default: `gpt-4o-mini`) |
| `ENCRYPTION_KEY` | Yes | 64-char hex key for AES-256 journal encryption |
| `NEXT_PUBLIC_APP_URL` | No | App URL for deployment metadata (default: `http://localhost:3000`) |

Generate encryption key:
```bash
openssl rand -hex 32
```

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev

# Run tests
npm test
```

Open [http://localhost:3000](http://localhost:3000).

## MongoDB Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user and whitelist your IP (or `0.0.0.0/0` for dev)
3. Copy the connection string to `MONGODB_URI`
4. Collections are created automatically: `checkins`, `userprofiles`, `chatmessages`

## OpenAI Setup

1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Create an API key under API keys
3. Set `OPENAI_API_KEY` in `.env.local`
4. Optionally change `OPENAI_MODEL` — any chat model with JSON mode support works (e.g. `gpt-4o`, `gpt-4o-mini`)

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables in the Vercel dashboard. Set `NEXT_PUBLIC_APP_URL` to your production URL.

## Privacy & Security

- Journal entries encrypted with AES-256-GCM before storage
- Anonymous user IDs stored in browser localStorage (no account required)
- API routes validate `x-user-id` header against request body
- Zod validation on all inputs
- No third-party analytics or data sharing
- Safety disclaimers and escalation messaging for severe distress

## Project Structure

```
src/
├── app/                    # Next.js pages & API routes
│   ├── api/                # Backend API endpoints
│   ├── check-in/           # Daily check-in form
│   ├── analysis/           # AI journal analysis
│   ├── insights/           # Pattern discovery
│   ├── dashboard/          # Wellness dashboard
│   ├── mood-history/       # Historical entries
│   ├── mindfulness/        # Mindfulness coach
│   ├── motivation/         # Motivation center
│   ├── burnout/            # Burnout monitor
│   ├── chat/               # AI companion chat
│   └── profile/            # Profile & settings
├── components/             # UI components
├── hooks/                  # Client hooks & API client
├── lib/                    # Utilities, AI, encryption, DB
├── models/                 # Mongoose schemas
├── providers/              # React Query provider
└── schemas/                # Zod validation schemas
```

## Safety Notice

Neurora is **not a therapist or medical professional**. It provides wellness support for exam preparation. If feelings persist or become overwhelming, users are encouraged to speak with a trusted adult, counselor, or mental health professional.

## License

Private — All rights reserved.
