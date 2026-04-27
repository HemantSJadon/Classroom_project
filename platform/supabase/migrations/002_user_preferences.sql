create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  preferred_depth text not null default 'intermediate'
    check (preferred_depth in ('eli5', 'simple', 'intermediate', 'advanced', 'expert')),
  colearner_intensity text not null default 'medium'
    check (colearner_intensity in ('off', 'low', 'medium', 'high')),
  language_style text not null default 'conversational'
    check (language_style in ('formal', 'conversational', 'socratic')),
  learning_pace text not null default 'medium'
    check (learning_pace in ('slow', 'medium', 'fast')),
  updated_at timestamptz not null default now()
);

alter table user_preferences enable row level security;

create policy "user_preferences: own row"
  on user_preferences for all using (auth.uid() = user_id);

create or replace function update_preferences_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger preferences_updated_at
  before update on user_preferences
  for each row execute function update_preferences_updated_at();
