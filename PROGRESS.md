# AI Learning Platform — Build Progress

## Phase 1 — Foundation ✅ — 2026-04-27

- Next.js 16 scaffold, TypeScript, Tailwind, App Router
- Supabase auth (login/signup/logout), middleware route protection
- Classroom CRUD (create, list, archive, soft-delete)
- Interactive topic intake — multi-turn AI conversation via SSE
- Dashboard: server-fetched classroom list, filter tabs, ClassroomCard with menu
- LLM provider abstraction: Anthropic, OpenAI, DeepSeek, Groq — swap via env var
- DB schema + RLS migrations
- Build: 9 routes, zero TypeScript errors

---

## Phase 2 — Session Engine ✅ — 2026-04-27

- Session start/stop/resume API (race-condition guarded)
- Duration timer with circular SVG countdown, red warning at <5 min, auto-stop
- Inactivity detection (90s idle + Page Visibility API) → pause overlay
- State persistence: scroll + last message snapshotted to DB every 30s
- Pre-session recap generation (SSE streamed from session transcript)
- Full session lifecycle: setup → recap gate → duration → active → ended
- Build: 13 routes, zero TypeScript errors

---

## Phase 3 — AI Classroom Core ✅ — 2026-04-27

**Prompt Library:**
- `src/lib/prompts/instructor.ts` — instructor system prompt builder; per-depth re-explain instructions (ELI5 → Expert)
- `src/lib/prompts/colearner.ts` — per-persona co-learner prompt builder; rotation logic (1–2 personas per turn, cycling)

**AI API Endpoints (all SSE streamed, 15s keepalive, 45s timeout):**
- `POST /api/sessions/[id]/chat` — user sends message → saves to DB → builds context via manager → streams instructor response → saves instructor message → emits `done` with message ID + total count
- `POST /api/sessions/[id]/colearners` — takes instructor_message_id + turn_index → picks 1–2 personas → streams each question sequentially → saves each to DB as `colearner`/`question`
- `POST /api/sessions/[id]/reexplain` — takes message_id + depth level → streams re-explanation at chosen depth → saves as child message (parent_message_id = original) with `{reexplain: true}` metadata
- `POST /api/sessions/[id]/summarise` — fetches last 20 messages → LLM generates dense summary → saves to session_state.context_summary (injected into future context calls)

**Context Manager (wired live):**
- Every chat call: fetches latest session_state.context_summary → injects via `buildContextMessages`
- After every 20th message: `shouldSummarise()` triggers background summarise call
- Hard 6k token cap enforced in `buildContextMessages`
- Persona definitions always in system prompt (persona anchoring — never pruned)

**UI Components:**
- `MessageBubble` — renders user/instructor/co-learner messages with distinct styles; persona colour-coded avatars; "Re-explain ↓" button appears on hover for instructor messages; re-explain badge; streaming dot animation
- `DepthControls` — dropdown: ELI5 / Simple / Intermediate / Advanced / Expert
- `useSSEStream` hook — shared SSE reader: parses event/data pairs, routes to onToken/onEvent/onDone/onError handlers; abort controller for cleanup

**SessionView (fully AI-powered):**
- User types → sends to `/chat` → instructor streams in → co-learner questions stream in sequentially
- Hover any instructor message → Re-explain menu appears → pick depth → re-explanation streams inline
- Rolling summary triggered automatically in background at 20-message intervals
- Turn index tracked to rotate co-learner personas across exchanges
- Optimistic UI: user message appears instantly; streaming placeholders with animated dots

**Build status:** `next build` passes, 17 routes, middleware active, zero TypeScript errors.

---

## Phase 3 Complete ✅

All Phase 3 deliverables done:
- [x] Co-learner persona system (5 personas, consistent across sessions via `persona_definitions` field)
- [x] Live Q&A thread — instructor answers + co-learner questions stream in after each exchange
- [x] Re-explain at 5 depth levels (ELI5 → Simple → Intermediate → Advanced → Expert)
- [x] Context window manager wired live (rolling summary, selective injection, 6k token cap)
- [x] Multi-LLM provider abstraction fully active across all endpoints

---

## Up Next — Phase 4: Rich Learning Features
- [ ] Mind map generation and SVG rendering
- [ ] Structured response cards (concept / summary / insight)
- [ ] Classroom history browser (all sessions, searchable)
- [ ] Session recap visual design
- [ ] User config knobs: pace, depth, language style, co-learner intensity
