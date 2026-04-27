create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  preferred_depth text not null default 'intermediate',
  colearner_intensity text not null default 'medium',
  language_style text not null default 'conversational',
  learning_pace text not null default 'medium',
  updated_at timestamptz not null default now()
);

alter table user_preferences enable row level security;

create policy "user_preferences: own row"
  on user_preferences for all using (auth.uid() = user_id);
