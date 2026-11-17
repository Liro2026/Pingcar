# Paid subscription expiry automation

This automation applies only to rows created from the admin panel with an amount greater than zero. Existing rows default to not paid. The existing free seven-day trial is not changed.

## Supabase setup

1. Deploy `functions/subscription-expiry-monitor` to the PingCar Supabase project. It calls the already-used `send-email` Edge Function.
2. In Supabase Vault, add these secrets:
   - `pingcar_supabase_url`: the project URL, such as `https://PROJECT_REF.supabase.co`
   - `pingcar_service_role_key`: the project's service role key
3. Run migration `20261117000100_paid_subscription_expiry_grace.sql` in the SQL Editor after adding the Vault secrets.
4. Confirm the daily job in Supabase Cron is named `pingcar-paid-subscription-expiry-daily`.

The job emails the subscriber after expiry, retries the email on later daily runs if sending fails, and changes the paid subscription row to `inactive` after seven days. This status change alone does not disable sign-in or block QR messaging. A separate backend access check is needed to enforce the block; it has deliberately not been added here because this change is limited to the admin and expiry automation.

The email asks the subscriber to reply or use the contact page because the website currently has no self-service renewal checkout URL.
