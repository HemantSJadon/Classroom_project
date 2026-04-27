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

**Session API:**
- `POST /api/sessions` — start a session; guards against duplicate active sessions
- `GET /api/sessions/[id]` — fetch session + all its messages
- `PATCH /api/sessions/[id]` — update status (paused | completed), sets ended_at automatically
- `POST /api/sessions/[id]/state` — snapshot scroll position + last message to DB
- `GET /api/sessions/[id]/state` — retrieve latest state snapshot (for resume)
- `POST /api/sessions/[id]/recap` — SSE: generates streamed recap from session transcript

**Session UI Components:**
- `DurationPicker` — 6 preset options (15m → no limit), highlighted active selection
- `SessionTimer` — circular countdown with red warning at <5 min remaining, auto-calls onExpired
- `RecapDisplay` — streams recap SSE token-by-token, shows spinner while loading, gates "Continue" until done
- `InactivityBanner` — wired to `initInactivityDetection` (90s idle + Page Visibility API); shows overlay, pauses session, lets user resume
- `SessionSetup` — pre-session screen: shows recap gate if previous session exists, then duration picker
- `SessionView` — full session UI: live message thread, timer in header, end session button, auto-saves state to DB every 30s, scrolls to bottom on new messages

**Classroom Detail Page (fully wired):**
- `ClassroomClient` — orchestrates setup → session → ended states; starts session via API, fetches existing messages for resume
- `ClassroomPage` (server) — fetches classroom + most recent non-active session for recap; passes to client
- Dashboard layout updated: classroom page now fills full viewport height

**Session lifecycle:**
1. Open classroom → SessionSetup (recap gate if previous session exists, then duration picker)
2. Start → POST /api/sessions → SessionView with timer + inactivity detection active
3. Idle 90s or tab hidden → InactivityBanner → session PATCH to paused
4. End session (manual or timer expired) → session PATCH to completed → "Session complete" screen
5. State auto-saved every 30s (scroll position + last message ID)
6. Return to classroom → previous session available for recap

**Build status:** `next build` passes, 13 routes, middleware active, zero TypeScript errors.

---

## Phase 2 Complete ✅

All Phase 2 deliverables done:
- [x] Session start / stop / resume API (race condition guarded)
- [x] Duration timer with auto-stop and visual countdown
- [x] Inactivity detection (90s idle + Page Visibility API) wired to live session
- [x] State persistence — scroll position + last message saved to DB every 30s
- [x] Pre-session recap generation from previous session history (streamed SSE)

---

## Up Next — Phase 3: AI Classroom Core
- [ ] Co-learner persona system (5 personas, consistent across sessions)
- [ ] Live AI Q&A thread — questions from co-learners, answers, follow-ups, threading
- [ ] Re-explain at depth levels (ELI5 → expert)
- [ ] Context window manager fully wired to live sessions
- [ ] Multi-LLM provider tested across all sessions
