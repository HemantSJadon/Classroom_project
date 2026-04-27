# AI Learning Platform — Build Progress

## Phase 1 — Foundation ✅ — 2026-04-27
- Next.js 16 scaffold, TypeScript, Tailwind, App Router
- Supabase auth (login/signup/logout), middleware route protection
- Classroom CRUD (create, list, archive, soft-delete)
- Interactive topic intake — multi-turn AI conversation via SSE
- Dashboard: server-fetched classroom list, filter tabs, ClassroomCard with menu
- LLM provider abstraction: Anthropic, OpenAI, DeepSeek, Groq — swap via env var
- DB schema + RLS migrations | Build: 9 routes, zero TypeScript errors

## Phase 2 — Session Engine ✅ — 2026-04-27
- Session start/stop/resume API (race-condition guarded)
- Duration timer with circular SVG countdown, red at <5 min, auto-stop
- Inactivity detection (90s idle + Page Visibility API) → pause overlay
- State persistence: scroll + last message snapshotted to DB every 30s
- Pre-session recap generation (SSE streamed from session transcript)
- Full session lifecycle: setup → recap gate → duration → active → ended
- Build: 13 routes, zero TypeScript errors

## Phase 3 — AI Classroom Core ✅ — 2026-04-27
- Instructor + co-learner prompt library (5 depth levels, persona rotation)
- /api/sessions/[id]/chat: user → DB save → context build → instructor stream
- /api/sessions/[id]/colearners: picks 1-2 personas/turn, streams questions sequentially
- /api/sessions/[id]/reexplain: re-explain any message at 5 depth levels
- /api/sessions/[id]/summarise: rolling 3-5 sentence summary → session_state
- Context manager wired live (6k token cap, rolling summary, persona anchoring)
- MessageBubble: persona avatars, streaming dots, Re-explain hover menu
- useSSEStream hook: reusable SSE reader with event routing + abort control
- Build: 17 routes, zero TypeScript errors

---

## Phase 4 — Rich Learning Features ✅ — 2026-04-27

**Mind Map:**
- `src/lib/mindmap/types.ts` — MindMapData types + JSON schema + LLM instructions
- `POST /api/sessions/[id]/mindmap` — fetches recent messages → LLM generates JSON → saved as `content_type: mindmap` message
- `MindMapRenderer` — pure SVG radial tree: root node at centre, N branches at equal angles, leaves at spread sub-angles; colour-coded by branch; no D3 dependency (custom geometry)

**Concept Cards:**
- `POST /api/sessions/[id]/card` — generates concept / summary / insight card JSON from recent discussion
- `ConceptCard` — renders card with type-specific border colour, icon badge, body, and tag chips

**Session Toolbar:**
- `SessionToolbar` — "Generate: ⬡ Mind Map | ▣ Card ↓" bar above input; card type dropdown (concept/summary/insight); disabled while generating
- `MessageBubble` updated: detects `content_type === 'mindmap'` or `'card'` → renders `MindMapRenderer` or `ConceptCard` inline; dynamic import (no SSR) for MindMapRenderer

**Classroom History Browser:**
- `GET /api/classrooms/[id]/sessions` — lists all sessions with message counts
- `/dashboard/classroom/[id]/history` — server-rendered history page
- `HistoryView` (client) — search by date; accordion per session (click to expand); lazy-fetches messages on open; shows text messages inline (line-clamped); shows duration, message count, status badge

**User Preferences:**
- `supabase/migrations/002_user_preferences.sql` — `user_preferences` table with RLS (preferred_depth, colearner_intensity, language_style, learning_pace); unique constraint per user; updated_at trigger
- `GET/POST /api/user/preferences` — fetch preferences (with defaults); upsert via onConflict
- `PreferencesPanel` — modal: fetches prefs, renders 4 setting groups as pill toggles, saves and shows ✓ confirmation
- `Sidebar` updated: "Preferences" button opens panel; sign-out preserved

**Database types** updated with `user_preferences` table.

**Build status:** `next build` passes, 22 routes, middleware active, zero TypeScript errors.

---

## Phase 4 Complete ✅

All Phase 4 deliverables done:
- [x] Mind map generation and SVG rendering (radial tree, colour-coded branches/leaves)
- [x] Structured response cards (concept / summary / insight with type-specific styling)
- [x] Session toolbar wiring mindmap + card generation inline in session view
- [x] Classroom history browser (all sessions, expandable, lazy message loading, search)
- [x] User preferences (4 knobs: depth, co-learner intensity, language style, pace)

---

## Phase 5 — Polish + Deployment ✅ — 2026-04-27

**Design system:**
- `globals.css` rewritten with CSS custom properties for all design tokens (--background, --surface-1/2, --border, --accent, --accent-hover, --text-*)
- Animation keyframes: fade-in, slide-up, pulse-soft, spin-smooth + `.animate-*` utility classes
- `.streaming-cursor::after` blinking block cursor for live SSE output
- Thin scrollbar styling, global focus ring, `::selection` accent colour

**Components:**
- `Spinner` — size variants sm/md/lg; `animate-spin-smooth`
- `ErrorBoundary` — React class component with reset; wraps `SessionView` in `ClassroomClient`
- `OfflineBanner` — detects `navigator.onLine` + `online`/`offline` events; yellow top bar; wired into root `layout.tsx`

**Loading & error pages:**
- `app/error.tsx`, `app/not-found.tsx` — root-level Next.js error boundaries with reset / home navigation
- `app/dashboard/error.tsx` — dashboard-scoped error boundary
- `app/dashboard/loading.tsx`, `app/dashboard/classroom/[id]/loading.tsx` — skeleton spinners via Next.js `loading.tsx` convention

**Rate limiting (all LLM routes):**
- `src/lib/ratelimit.ts` — Upstash Redis sliding-window (sorted set, score=timestamp); graceful fallback (allow all) when Redis unconfigured
- Applied to: intake (20), chat (30), colearners (40), reexplain (20), mindmap (10), card (15), recap (10), summarise (10)

**next.config.ts optimisations:**
- `reactStrictMode: true`, `compress: true`
- Security headers on all routes: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- Long-lived cache header for `/_next/static/*`
- Image optimisation: avif + webp formats, standard device sizes

**README.md** — Full setup guide: local dev, Supabase migrations, env vars, LLM provider switching table, rate limit table, project structure, Vercel deployment checklist.

**Build status:** `next build` passes, 22 routes, zero TypeScript errors.

---

## Phase 5 Complete ✅ — Platform Complete

All 5 phases delivered:
- [x] Phase 1 — Foundation (scaffold, auth, classroom CRUD, intake)
- [x] Phase 2 — Session Engine (timer, inactivity, state persistence, recap)
- [x] Phase 3 — AI Classroom Core (instructor, co-learners, re-explain, context manager)
- [x] Phase 4 — Rich Features (mind maps, concept cards, history browser, preferences)
- [x] Phase 5 — Polish + Deployment (design system, error boundaries, rate limiting, next.config, README)
