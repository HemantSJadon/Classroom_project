-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Classrooms
create table if not exists classrooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  topic_summary text,
  intake_transcript jsonb,
  persona_definitions jsonb,
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid references classrooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  planned_duration_minutes int,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  recap_shown boolean not null default false,
  recap_content text,
  created_at timestamptz not null default now()
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  classroom_id uuid references classrooms(id) on delete cascade not null,
  author text not null,
  author_type text not null check (author_type in ('user', 'colearner', 'instructor')),
  content text not null,
  content_type text not null default 'text' check (content_type in ('text', 'mindmap', 'card', 'recap', 'question', 'answer')),
  parent_message_id uuid references messages(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Session state snapshots (for exact resume)
create table if not exists session_state (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  scroll_position int not null default 0,
  last_message_id uuid references messages(id) on delete set null,
  context_summary text,
  saved_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_classrooms_user_id on classrooms(user_id);
create index if not exists idx_classrooms_status on classrooms(status);
create index if not exists idx_sessions_classroom_id on sessions(classroom_id);
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_messages_session_id on messages(session_id);
create index if not exists idx_messages_classroom_id on messages(classroom_id);
create index if not exists idx_messages_parent on messages(parent_message_id);
create index if not exists idx_session_state_session_id on session_state(session_id);

-- Auto-update updated_at on classrooms
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger classrooms_updated_at
  before update on classrooms
  for each row execute function update_updated_at();

-- Row Level Security
alter table classrooms enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;
alter table session_state enable row level security;

-- RLS Policies: users can only see their own data
create policy "classrooms: own rows" on classrooms
  for all using (auth.uid() = user_id);

create policy "sessions: own rows" on sessions
  for all using (auth.uid() = user_id);

create policy "messages: own classroom" on messages
  for all using (
    exists (
      select 1 from classrooms c
      where c.id = messages.classroom_id and c.user_id = auth.uid()
    )
  );

create policy "session_state: own session" on session_state
  for all using (
    exists (
      select 1 from sessions s
      where s.id = session_state.session_id and s.user_id = auth.uid()
    )
  );
