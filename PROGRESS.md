# AI Learning Platform — Build Progress

## Phase 1 — Foundation

### Step 1: Next.js Scaffold ✅ — 2026-04-27
**Status:** Complete. Build passes. Zero TypeScript errors.

**What was done:**
- Scaffolded Next.js 16 (App Router) with TypeScript, Tailwind, src dir layout in `platform/`
- Installed all required dependencies:
  - `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`
  - `@anthropic-ai/sdk`, `openai` (also used as compatible SDK for DeepSeek/Groq)
  - `@upstash/redis`, `zustand`, `zod`
- Created `.env.local.example` with all required environment variables documented

**LLM Provider Abstraction Layer (complete):**
- `src/lib/llm/provider.ts` — `LLMProvider` interface with `stream()` and `complete()` methods
- `src/lib/llm/anthropic.ts` — Anthropic adapter (claude-sonnet-4-20250514), 45s hard timeout
- `src/lib/llm/openai.ts` — OpenAI adapter (gpt-4o), 45s hard timeout
- `src/lib/llm/deepseek.ts` — DeepSeek adapter via OpenAI-compatible base URL, 45s hard timeout
- `src/lib/llm/groq.ts` — Groq adapter (llama-3.3-70b-versatile), 45s hard timeout
- `src/lib/llm/index.ts` — Factory: reads `LLM_PROVIDER` env var, zero code change to switch

**Supabase Clients:**
- `src/lib/supabase/client.ts` — Browser client (for client components)
- `src/lib/supabase/server.ts` — Server client (for server components and API routes)

**Database:**
- `supabase/migrations/001_initial_schema.sql` — Full schema with RLS:
  - `classrooms`, `sessions`, `messages`, `session_state` tables
  - All indexes for common queries
  - Row Level Security policies (users see only their own data)
  - `updated_at` trigger on classrooms

**Core Library Files:**
- `src/lib/context/manager.ts` — Context window manager (6k token cap, last-10-messages injection, rolling summary support)
- `src/lib/session/inactivity.ts` — Inactivity detection (90s idle + Page Visibility API)
- `src/lib/session/state.ts` — Session state helpers (sessionStorage draft persistence)
- `src/lib/personas/definitions.ts` — 5 co-learner personas with system prompt fragments
- `src/types/database.ts` — Full TypeScript types for all DB tables

**UI Shell:**
- `/` — Landing page with sign in / create account links
- `/login` — Login form (shell, not yet wired to Supabase)
- `/signup` — Signup form (shell, not yet wired to Supabase)
- `/dashboard` — Classroom grid with placeholder card + new classroom CTA
- Dashboard layout with `Sidebar` component

**Build status:** `next build` passes, 5 routes, zero warnings.

---

## Up Next — Phase 1 Remaining Steps
- [ ] Wire auth forms to Supabase (login, signup, session management)
- [ ] Auth middleware (protect `/dashboard` and all sub-routes)
- [ ] Classroom CRUD API routes
- [ ] Interactive topic intake flow (multi-turn AI conversation)
- [ ] Classroom list fetched from DB, not hardcoded
