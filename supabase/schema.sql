-- Profiles table mirrors auth.users basic info
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free',
  plan_status text default 'active',
  plan_interval text default 'lifetime',
  stripe_customer_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles
  add column if not exists plan text default 'free';

alter table public.profiles
  alter column plan set not null;

alter table public.profiles
  add column if not exists plan_status text default 'active';

alter table public.profiles
  add column if not exists plan_interval text default 'lifetime';

alter table public.profiles
  add column if not exists stripe_customer_id text;

alter table public.profiles
  add column if not exists updated_at timestamp with time zone default now();

alter table public.profiles
  add column if not exists subject_last_run_at timestamp with time zone;

-- Separate cooldown tracking for Viral Notes feature
alter table public.profiles
  add column if not exists notes_last_run_at timestamp with time zone;

-- Separate cooldown tracking for Viral Images & Thumbnails
alter table public.profiles
  add column if not exists images_last_run_at timestamp with time zone;

-- Device-based cooldowns (for unauthenticated flows)
create table if not exists public.cooldowns (
  device_id text not null,
  kind text not null,
  last_run_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (device_id, kind)
);

create index if not exists profiles_stripe_customer_idx on public.profiles(stripe_customer_id);

-- Subscriptions table stores Stripe subscription status
create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  plan text,
  interval text,
  status text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Simple RLS policies
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Can view own profile" on public.profiles;
create policy "Can view own profile" on public.profiles for select using ( auth.uid() = id );

drop policy if exists "Can view own subscriptions" on public.subscriptions;
create policy "Can view own subscriptions" on public.subscriptions for select using ( auth.uid() = user_id );

create index if not exists subscriptions_customer_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id);

-- Trigger to upsert profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  -- Ensure a default Free plan subscription exists per user
  insert into public.subscriptions (id, user_id, plan, status)
  values ('free:' || new.id::text, new.id, 'free', 'active')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Subscribers table for newsletter signups
create table if not exists public.subscribers (
  id bigserial primary key,
  email text not null,
  ip text,
  user_agent text,
  created_at timestamp with time zone default now()
);

alter table public.subscribers enable row level security;

-- Prevent duplicates (case-insensitive)
create unique index if not exists subscribers_email_unique on public.subscribers (lower(email));

-- Allow anyone (even signed-out) to insert an email
drop policy if exists "Anyone can subscribe" on public.subscribers;
create policy "Anyone can subscribe" on public.subscribers
  for insert
  with check (true);

-- Do not allow select/update/delete by default (no policies defined)
