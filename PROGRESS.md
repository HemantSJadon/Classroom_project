# AI Learning Platform — Build Progress

## Phase 1 — Foundation

### Step 1: Next.js Scaffold ✅ — 2026-04-27

- Scaffolded Next.js 16 (App Router), TypeScript, Tailwind, src dir layout in `platform/`
- All dependencies installed: Supabase, LLM SDKs, Redis, Zustand, Zod
- LLM provider abstraction layer: Anthropic, OpenAI, DeepSeek, Groq — swap via `LLM_PROVIDER` env var
- Supabase browser + server clients (migrated from deprecated `auth-helpers-nextjs` to `@supabase/ssr`)
- DB schema migration with RLS (`supabase/migrations/001_initial_schema.sql`)
- Core libs: context manager, inactivity detection, session state, 5 persona definitions
- UI shell: landing, login, signup, dashboard with sidebar
- Build: 5 routes, zero TypeScript errors

---

### Step 2: Auth + Classroom CRUD + Intake Flow ✅ — 2026-04-27

**Auth:**
- `src/middleware.ts` — Route protection middleware (redirects unauthenticated to `/login`, authenticated away from auth pages)
- `src/lib/supabase/middleware.ts` — Session refresh + redirect logic using `@supabase/ssr`
- `src/app/actions/auth.ts` — Server Actions: `login`, `signup`, `logout` with Zod validation
- `src/components/auth/LoginForm.tsx` — Client form using `useActionState`, pending state, error display
- `src/components/auth/SignupForm.tsx` — Client form with success state (check email message)
- Login/signup pages updated to use wired components

**Classroom CRUD API:**
- `GET /api/classrooms` — list user's non-deleted classrooms, ordered by updated_at
- `POST /api/classrooms` — create classroom with title, topic_summary, personas
- `GET /api/classrooms/[id]` — fetch single classroom (owner-only)
- `PATCH /api/classrooms/[id]` — update title, status, topic_summary, persona_definitions
- `DELETE /api/classrooms/[id]` — soft delete (sets status = 'deleted')

**Interactive Topic Intake (multi-turn AI conversation):**
- `POST /api/classrooms/intake` — SSE endpoint: streams AI responses token-by-token, 15s keepalive pings, 45s hard timeout
- AI system prompt guides 4–6 turn conversation to understand topic, level, style, goal
- AI produces a `{"ready":true, "title":"...", "topic_summary":"..."}` JSON block when ready
- `src/components/classroom/IntakeChat.tsx` — streaming chat UI: renders tokens as they arrive, parse completion signal, user input with Enter-to-send
- `src/components/classroom/NewClassroomModal.tsx` — modal wrapping intake chat, creates classroom on AI completion

**Dashboard (live):**
- `src/app/dashboard/page.tsx` — server component: fetches classrooms from Supabase, passes to client
- `src/app/dashboard/DashboardClient.tsx` — active/archived filter tabs, CRUD actions, new classroom modal
- `src/components/classroom/ClassroomCard.tsx` — classroom card with archive/delete menu, status badge
- `src/app/dashboard/classroom/[id]/page.tsx` — classroom detail page (session placeholder for Phase 2)
- `src/components/layout/Sidebar.tsx` — updated with sign-out button

**Build status:** `next build` passes, 9 routes, middleware active, zero TypeScript errors.

---

## Phase 1 Complete ✅

All Phase 1 deliverables done:
- [x] Project scaffold + DB schema migrations
- [x] Supabase auth (login / signup / session / logout)
- [x] Auth middleware (dashboard protected, auth routes redirect when logged in)
- [x] Classroom CRUD (create, list, archive, delete, restore via PATCH status)
- [x] Interactive topic intake — multi-turn AI conversation with streaming SSE
- [x] Basic UI shell — sidebar, classroom cards, session view placeholder

---

## Up Next — Phase 2: Session Engine
- [ ] Session start / stop / resume API
- [ ] Duration timer with auto-stop
- [ ] Inactivity detection wired to live session
- [ ] State persistence — scroll position, last message, full session context saved to DB
- [ ] Pre-session recap generation from previous session history
