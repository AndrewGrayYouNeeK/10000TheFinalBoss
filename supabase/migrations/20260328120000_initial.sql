-- YouNeeK 10,000 — cloud accounts, entitlements, community
-- Apply with: supabase db push   (or SQL editor in dashboard)

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stripe orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_session_id text unique,
  stripe_payment_intent text,
  item_type text not null check (item_type in ('skin', 'felt', 'box')),
  item_id text not null,
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'canceled')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists orders_user_id_idx on public.orders (user_id);

alter table public.orders enable row level security;

create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

-- Entitlements (owned cosmetics from Stripe or grants)
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('skin', 'felt', 'box')),
  item_id text not null,
  source text not null default 'stripe' check (source in ('stripe', 'grant')),
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Skins/felts unique per user; boxes may repeat (one row per purchase)
create unique index if not exists entitlements_unique_non_box
  on public.entitlements (user_id, item_type, item_id)
  where item_type in ('skin', 'felt');

create index if not exists entitlements_user_id_idx on public.entitlements (user_id);

alter table public.entitlements enable row level security;

create policy "entitlements_select_own"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- Community posts
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  board text not null check (board in ('talk', 'help', 'ideas')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 4000),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text,
  reply_count integer not null default 0,
  reported boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_posts_board_idx
  on public.community_posts (board, created_at desc);

alter table public.community_posts enable row level security;

create policy "posts_public_read"
  on public.community_posts for select
  using (true);

create policy "posts_auth_insert"
  on public.community_posts for insert
  with check (auth.uid() = author_id);

create policy "posts_author_update"
  on public.community_posts for update
  using (auth.uid() = author_id);

create policy "posts_author_or_admin_delete"
  on public.community_posts for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Community replies
create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text,
  reported boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_replies_post_idx
  on public.community_replies (post_id, created_at);

alter table public.community_replies enable row level security;

create policy "replies_public_read"
  on public.community_replies for select
  using (true);

create policy "replies_auth_insert"
  on public.community_replies for insert
  with check (auth.uid() = author_id);

create policy "replies_author_or_admin_delete"
  on public.community_replies for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Keep reply_count in sync
create or replace function public.bump_reply_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts
      set reply_count = reply_count + 1
      where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_posts
      set reply_count = greatest(0, reply_count - 1)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists on_reply_change on public.community_replies;
create trigger on_reply_change
  after insert or delete on public.community_replies
  for each row execute function public.bump_reply_count();
