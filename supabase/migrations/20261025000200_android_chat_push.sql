-- Allow the chat push registry to hold both native iOS and Android tokens.
-- Existing iOS registrations and the five-message RPC limit are unchanged.
alter table public.push_devices
  drop constraint if exists push_devices_platform_check;

alter table public.push_devices
  add constraint push_devices_platform_check
  check (platform in ('ios', 'android'));
