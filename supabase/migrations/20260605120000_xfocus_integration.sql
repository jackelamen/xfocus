-- xFocus integration migration (applied to cloud project mdkyijbgvxedelcqcouu).
-- focus_sessions is SHARED with Pulse: Pulse owns actual_minutes/planned_minutes,
-- mode, interruptions, note, task_id. xFocus ADDS the nullable columns below so
-- both apps write to one table and sessions are unified. All additions are
-- nullable/defaulted so Pulse inserts are unaffected.

alter table public.focus_sessions
  add column if not exists date date,
  add column if not exists focus_type text,
  add column if not exists energy_level int,
  add column if not exists task_ids uuid[],
  add column if not exists task_names text[],
  add column if not exists completed boolean default false,
  add column if not exists time_block_id uuid,
  add column if not exists felt_score int,
  add column if not exists got_distracted boolean,
  add column if not exists distraction_count int default 0,
  add column if not exists task_completed text,
  add column if not exists would_repeat boolean;

update public.focus_sessions
  set date = (started_at at time zone 'UTC')::date
  where date is null and started_at is not null;

create index if not exists focus_sessions_user_date on public.focus_sessions(user_id, date);

-- ── time_blocks (xFocus-only) ───────────────────────────────────
create table if not exists public.time_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  title       text not null,
  start_time  time not null,
  end_time    time not null,
  color       text default '#ff9b73',
  task_ids    uuid[],
  task_names  text[],
  focus_type  text,
  notes       text,
  completed   boolean default false,
  session_id  uuid,
  created_at  timestamptz default now()
);
alter table public.time_blocks enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='time_blocks' and policyname='Users own their time blocks') then
    create policy "Users own their time blocks" on public.time_blocks
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
create index if not exists time_blocks_user_date on public.time_blocks(user_id, date);

-- ── intentions (xFocus-only) ────────────────────────────────────
create table if not exists public.intentions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  text        text not null,
  created_at  timestamptz default now(),
  unique(user_id, date)
);
alter table public.intentions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='intentions' and policyname='Users own their intentions') then
    create policy "Users own their intentions" on public.intentions
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- ── distractions (xFocus-only) ──────────────────────────────────
create table if not exists public.distractions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  session_id  uuid,
  label       text,
  logged_at   timestamptz default now()
);
alter table public.distractions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='distractions' and policyname='Users own their distractions') then
    create policy "Users own their distractions" on public.distractions
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
create index if not exists distractions_user_date on public.distractions(user_id, date);
