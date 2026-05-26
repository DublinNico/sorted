-- =============================================================================
-- Sorted — Supabase Schema
-- Run this in your Supabase SQL editor (dashboard.supabase.com → SQL Editor).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------
-- pg_cron: schedules the daily reminder function.
-- pg_net:  lets pg_cron call the Edge Function over HTTP.
create extension if not exists pg_cron  with schema extensions;
create extension if not exists pg_net   with schema extensions;

-- ---------------------------------------------------------------------------
-- 2. subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  name         text not null,
  price        numeric(10, 2) not null default 0 check (price >= 0),
  currency     text not null default 'EUR',
  billing      text not null default 'Monthly',
  frequency    text not null default 'Monthly',
  category     text not null default 'Other',
  status       text not null default 'active',
  start_date   timestamptz not null default now(),
  renewal_date timestamptz not null default now(),
  icon_url     text not null default '',
  color        text not null default '#C9A84C',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "users can read own subscriptions"   on public.subscriptions;
drop policy if exists "users can insert own subscriptions" on public.subscriptions;
drop policy if exists "users can update own subscriptions" on public.subscriptions;
drop policy if exists "users can delete own subscriptions" on public.subscriptions;

create policy "users can read own subscriptions"
  on public.subscriptions for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "users can insert own subscriptions"
  on public.subscriptions for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "users can update own subscriptions"
  on public.subscriptions for update
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "users can delete own subscriptions"
  on public.subscriptions for delete
  using ((auth.jwt() ->> 'sub') = user_id);

-- ---------------------------------------------------------------------------
-- 3. push_tokens
-- ---------------------------------------------------------------------------
create table if not exists public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  token      text not null,
  platform   text not null default 'ios',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, token)
);

alter table public.push_tokens enable row level security;

drop policy if exists "users can manage own push tokens" on public.push_tokens;

create policy "users can manage own push tokens"
  on public.push_tokens for all
  using ((auth.jwt() ->> 'sub') = user_id);

-- ---------------------------------------------------------------------------
-- 4. notification_preferences
-- ---------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null unique,
  enabled      boolean not null default true,
  days_before  integer[] not null default '{1,3,7}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "users can manage own notification prefs" on public.notification_preferences;

create policy "users can manage own notification prefs"
  on public.notification_preferences for all
  using ((auth.jwt() ->> 'sub') = user_id);

-- ---------------------------------------------------------------------------
-- 5. updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_updated_at          on public.subscriptions;
drop trigger if exists push_tokens_updated_at             on public.push_tokens;
drop trigger if exists notification_preferences_updated_at on public.notification_preferences;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger push_tokens_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. monthly_snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_snapshots (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  year         integer not null,
  month        integer not null check (month between 1 and 12),
  total_amount numeric(10, 2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, year, month)
);

alter table public.monthly_snapshots enable row level security;

drop policy if exists "users can manage own monthly snapshots" on public.monthly_snapshots;

create policy "users can manage own monthly snapshots"
  on public.monthly_snapshots for all
  using ((auth.jwt() ->> 'sub') = user_id);

drop trigger if exists monthly_snapshots_updated_at on public.monthly_snapshots;

create trigger monthly_snapshots_updated_at
  before update on public.monthly_snapshots
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. pg_cron job — runs send-reminders at 09:00 UTC every day
--    Replace <SERVICE_ROLE_KEY> with your service role key from:
--    Supabase Dashboard → Settings → API → service_role (secret)
-- ---------------------------------------------------------------------------
select cron.unschedule('send-payment-reminders');

select cron.schedule(
  'send-payment-reminders',
  '0 9 * * *',
  $$
    select net.http_post(
      url    := 'https://pufzwcpxorlvpkkpjypr.supabase.co/functions/v1/send-reminders',
      headers:= '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
      body   := '{}'::jsonb
    )
  $$
);
