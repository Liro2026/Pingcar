-- Apple subscriptions can be purchased before a PingCar account exists.
-- Keep the Apple-verified transaction until the user optionally signs in and
-- restores purchases, at which point apple-iap-verify claims the row.
alter table public.apple_iap_subscriptions
  alter column user_id drop not null;
