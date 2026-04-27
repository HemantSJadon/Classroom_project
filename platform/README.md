# AI Classroom — Adaptive Learning Platform

An AI-powered learning platform where an intelligent instructor teaches you any topic in an interactive classroom session — complete with co-learner personas, mind map generation, concept cards, and adaptive re-explanation.

---

## Features

- **Multi-turn intake flow** — Conversational classroom setup that learns your level, goals, and style
- **Live AI instructor** — Streaming SSE responses with persona-aware teaching
- **Co-learner personas** — 5 distinct student personas (Alex, Priya, Marcus, Sofia, James) that ask questions and react, rotating each turn
- **Re-explain at depth** — Any instructor message can be re-explained from ELI5 to Expert level
- **Mind maps** — LLM-generated radial SVG mind maps rendered without any chart library
- **Concept cards** — Concept / Summary / Insight cards distilled from the session
- **Rolling context manager** — 6k-token cap with automatic rolling summaries every 20 messages
- **Session history** — Browse all past sessions with expandable message transcripts
- **User preferences** — Preferred depth, co-learner intensity, language style, learning pace
- **Inactivity detection** — 90s idle timer + Page Visibility API auto-pauses sessions
- **Rate limiting** — Sliding-window per-user limits via Upstash Redis (graceful fallback)
- **Offline banner** — Detects network loss and shows a dismissable banner

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database / Auth | Supabase (PostgreSQL + Row Level Security) |
| AI streaming | Server-Sent Events (SSE) |
| Rate limiting | Upstash Redis (sliding window) |
| LLM | Pluggable — Anthropic / OpenAI / DeepSeek / Groq |

---

## Local Setup

### 1. Install dependencies

```bash
cd platform
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# LLM provider (see "Switching LLM Providers" below)
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Upstash Redis (optional — rate limiting disabled if omitted)
UPSTASH_REDIS_REST_URL=https://<your-db>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>
```

### 3. Run Supabase migrations

If using Supabase CLI:

```bash
supabase db push
```

Or run the SQL files in order against your project's SQL editor:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_user_preferences.sql
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Switching LLM Providers

Set `LLM_PROVIDER` in your `.env.local` and provide the matching API key:

| Provider | `LLM_PROVIDER` value | API key env var |
|---|---|---|
| Anthropic Claude | `anthropic` | `ANTHROPIC_API_KEY` |
| OpenAI GPT | `openai` | `OPENAI_API_KEY` |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` |
| Groq | `groq` | `GROQ_API_KEY` |

The factory in `src/lib/llm/index.ts` reads `LLM_PROVIDER` at runtime — no code changes needed.

**Model defaults** (edit the adapter files to change):

| Provider | Default model |
|---|---|
| Anthropic | `claude-3-5-haiku-20241022` |
| OpenAI | `gpt-4o-mini` |
| DeepSeek | `deepseek-chat` |
| Groq | `llama-3.3-70b-versatile` |

---

## Rate Limiting

All LLM-backed API routes are rate-limited per user per minute using Upstash Redis:

| Route | Limit |
|---|---|
| `/api/classrooms/intake` | 20 req/min |
| `/api/sessions/[id]/chat` | 30 req/min |
| `/api/sessions/[id]/colearners` | 40 req/min |
| `/api/sessions/[id]/reexplain` | 20 req/min |
| `/api/sessions/[id]/mindmap` | 10 req/min |
| `/api/sessions/[id]/card` | 15 req/min |
| `/api/sessions/[id]/recap` | 10 req/min |
| `/api/sessions/[id]/summarise` | 10 req/min |

If `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are not set, all requests are allowed (useful for local development).

---

## Project Structure

```
platform/
├── src/
│   ├── app/
│   │   ├── api/                  # API route handlers (SSE + JSON)
│   │   │   ├── classrooms/       # Classroom CRUD + intake
│   │   │   ├── sessions/         # Session lifecycle + AI routes
│   │   │   └── user/             # User preferences
│   │   ├── dashboard/            # Authenticated app pages
│   │   ├── login/ signup/        # Auth pages
│   │   ├── actions/auth.ts       # Server Actions (login/signup/logout)
│   │   ├── layout.tsx            # Root layout (fonts, OfflineBanner)
│   │   └── globals.css           # Design tokens + animation classes
│   ├── components/
│   │   ├── layout/               # Sidebar, TopBar
│   │   ├── session/              # SessionView, MessageBubble, MindMapRenderer…
│   │   └── ui/                   # ErrorBoundary, OfflineBanner, Spinner
│   ├── lib/
│   │   ├── llm/                  # Provider abstraction + adapters
│   │   ├── supabase/             # Server + browser clients, middleware
│   │   ├── context/              # Context window manager
│   │   ├── mindmap/              # MindMapData types + LLM instructions
│   │   ├── personas/             # Co-learner persona definitions
│   │   ├── prompts/              # Instructor + co-learner prompt builders
│   │   ├── session/              # useSSEStream hook, inactivity hook
│   │   └── ratelimit.ts          # Upstash Redis sliding-window rate limiter
│   └── types/
│       └── database.ts           # Full Supabase Database type (Relationships: [])
└── supabase/
    └── migrations/               # SQL schema + RLS policies
```

---

## Deployment (Vercel + Supabase)

1. Push to GitHub and import the repo in [vercel.com](https://vercel.com).
2. Set root directory to `platform/`.
3. Add all environment variables from `.env.local` in the Vercel dashboard.
4. Enable **Edge Middleware** — the middleware file already uses `@supabase/ssr` which is edge-compatible.
5. Your Supabase project handles the database — no additional config needed.

### Environment variables checklist for production

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `LLM_PROVIDER` + matching `*_API_KEY`
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (optional but recommended)

---

## Development Scripts

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Production build (type-check included)
npm run start      # Start production server
npm run lint       # ESLint
```
