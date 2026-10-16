-- Store verified Apple auto-renewable subscription entitlements separately
-- from existing Stripe/manual rows in public.subscriptions.
create table if not exists public.apple_iap_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  product_id text not null check (product_id in (
    'ch.pingcar.premium.monthly',
    'ch.pingcar.premium.yearly'
  )),
  original_transaction_id text not null unique,
  latest_transaction_id text not null unique,
  status text not null check (status in ('active', 'inactive')),
  expires_at timestamptz not null,
  amount numeric(12, 3),
  currency text,
  environment text not null check (environment in ('Production', 'Sandbox')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists apple_iap_subscriptions_user_status_idx
  on public.apple_iap_subscriptions (user_id, status, expires_at desc);

alter table public.apple_iap_subscriptions enable row level security;

drop policy if exists "Users can read their own Apple subscriptions"
  on public.apple_iap_subscriptions;
create policy "Users can read their own Apple subscriptions"
  on public.apple_iap_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete, truncate, references, trigger
  on public.apple_iap_subscriptions from anon, authenticated;
grant select on public.apple_iap_subscriptions to authenticated;
grant all on public.apple_iap_subscriptions to service_role;
