-- Track the paid subscriptions created from the admin panel.
-- Existing records stay excluded by default. The existing seven-day premium
-- trial is not changed by this migration.
alter table public.subscriptions
  add column if not exists is_paid_subscription boolean not null default false,
  add column if not exists renewal_email_sent_at timestamptz,
  add column if not exists premium_blocked_at timestamptz;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create or replace function public.invoke_pingcar_subscription_expiry_monitor()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  service_role_key text;
  request_id bigint;
begin
  select decrypted_secret into project_url
  from vault.decrypted_secrets
  where name = 'pingcar_supabase_url'
  limit 1;

  select decrypted_secret into service_role_key
  from vault.decrypted_secrets
  where name = 'pingcar_service_role_key'
  limit 1;

  if project_url is null or service_role_key is null then
    raise exception 'Add pingcar_supabase_url and pingcar_service_role_key to Supabase Vault before running the expiry monitor.';
  end if;

  select net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/subscription-expiry-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function public.invoke_pingcar_subscription_expiry_monitor() from public, anon, authenticated;
grant execute on function public.invoke_pingcar_subscription_expiry_monitor() to postgres, service_role;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'pingcar-paid-subscription-expiry-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'pingcar-paid-subscription-expiry-daily',
    '15 7 * * *',
    'select public.invoke_pingcar_subscription_expiry_monitor();'
  );
end;
$$;
