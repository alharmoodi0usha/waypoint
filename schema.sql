-- ============================================================
-- WAYPOINT — Supabase schema
-- Run this once in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  uni_id text not null,
  country text not null,
  course text default '',
  stage text default 'Researching',
  bio text default '',
  quiz int[] default null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by signed-in users"
  on public.profiles for select to authenticated using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- ---------- TIPS ----------
create table public.tips (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles (id) on delete cascade,
  uni_id text not null,
  category text not null default 'Uni',
  text text not null,
  created_at timestamptz default now()
);

alter table public.tips enable row level security;

create policy "Tips readable by signed-in users"
  on public.tips for select to authenticated using (true);

create policy "Users can post tips as themselves"
  on public.tips for insert to authenticated with check (auth.uid() = author);

create policy "Users can delete their own tips"
  on public.tips for delete to authenticated using (auth.uid() = author);

-- ---------- NOTES ----------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  major text not null,
  uni_id text not null,
  content text not null,
  pages int not null,
  created_at timestamptz default now()
);

alter table public.notes enable row level security;

create policy "Notes readable by signed-in users"
  on public.notes for select to authenticated using (true);
-- Note: the 10-page unlock is enforced in the app UI. For strict enforcement,
-- move note reads behind an RPC that checks the caller's published page count.

create policy "Users can upload notes as themselves"
  on public.notes for insert to authenticated with check (auth.uid() = author);

create policy "Users can delete their own notes"
  on public.notes for delete to authenticated using (auth.uid() = author);

-- ---------- ACTIVITIES ----------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  host uuid not null references public.profiles (id) on delete cascade,
  uni_id text not null,
  title text not null,
  type text not null default 'Meetup',
  date_text text not null,
  location text not null,
  description text default '',
  created_at timestamptz default now()
);

alter table public.activities enable row level security;

create policy "Activities readable by signed-in users"
  on public.activities for select to authenticated using (true);

create policy "Users can host activities as themselves"
  on public.activities for insert to authenticated with check (auth.uid() = host);

create policy "Hosts can delete their own activities"
  on public.activities for delete to authenticated using (auth.uid() = host);

-- ---------- ACTIVITY SIGNUPS ----------
create table public.activity_signups (
  activity_id uuid references public.activities (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (activity_id, profile_id)
);

alter table public.activity_signups enable row level security;

create policy "Signups readable by signed-in users"
  on public.activity_signups for select to authenticated using (true);

create policy "Users can sign themselves up"
  on public.activity_signups for insert to authenticated with check (auth.uid() = profile_id);

create policy "Users can remove their own signup"
  on public.activity_signups for delete to authenticated using (auth.uid() = profile_id);

-- ---------- FRIENDS ----------
create table public.friends (
  user_id uuid references public.profiles (id) on delete cascade,
  friend_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

alter table public.friends enable row level security;

create policy "Users see their own friend list"
  on public.friends for select to authenticated using (auth.uid() = user_id);

create policy "Users manage their own friend list"
  on public.friends for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can unfriend"
  on public.friends for delete to authenticated using (auth.uid() = user_id);

-- ---------- MESSAGES (DMs) ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references public.profiles (id) on delete cascade,
  recipient uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Only participants can read a message"
  on public.messages for select to authenticated
  using (auth.uid() = sender or auth.uid() = recipient);

create policy "Users can send messages as themselves"
  on public.messages for insert to authenticated with check (auth.uid() = sender);

-- Enable realtime for live DMs
alter publication supabase_realtime add table public.messages;

-- ---------- REPORTS (required for content moderation) ----------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references public.profiles (id) on delete cascade,
  target_type text not null, -- 'tip' | 'note' | 'activity' | 'profile' | 'message'
  target_id text not null,
  reason text not null,
  created_at timestamptz default now()
);

alter table public.reports enable row level security;

create policy "Users can file reports"
  on public.reports for insert to authenticated with check (auth.uid() = reporter);
-- Reports are only readable via the dashboard (service role), not by users.
