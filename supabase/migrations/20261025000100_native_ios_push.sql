-- Native iOS push tokens are kept separate from browser FCM tokens.
-- The existing send_pingcar_chat_message RPC and its five-message limit are unchanged.
create table if not exists public.push_devices (
  device_token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'ios' check (platform = 'ios'),
  language text not null default 'de',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_devices_user_id_idx
  on public.push_devices (user_id);

alter table public.push_devices enable row level security;

drop policy if exists "Users manage their own iOS push devices" on public.push_devices;
create policy "Users manage their own iOS push devices"
  on public.push_devices
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.push_devices to authenticated;
grant all on public.push_devices to service_role;

-- A caller can only trigger one alert per inserted message, even if it retries
-- the Edge Function manually. Old claims are safe to prune because the sender
-- verification only accepts messages created in the last two minutes.
create table if not exists public.push_message_dispatches (
  message_id text primary key,
  created_at timestamptz not null default now()
);

alter table public.push_message_dispatches enable row level security;
grant all on public.push_message_dispatches to service_role;
