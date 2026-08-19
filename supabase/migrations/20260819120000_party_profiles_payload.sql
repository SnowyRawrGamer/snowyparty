alter table public.rooms add column if not exists payload jsonb not null default '{}'::jsonb;
create table if not exists public.party_profiles (id text primary key, coins int not null default 0, title text not null default 'None', frame text not null default 'neon', avatar text not null default '🐯', unlocked jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now());
alter table public.party_profiles enable row level security;
create policy "profiles read" on public.party_profiles for select using (true);
create policy "profiles write" on public.party_profiles for insert with check (true);
create policy "profiles update" on public.party_profiles for update using (true);
alter publication supabase_realtime add table public.party_profiles;
