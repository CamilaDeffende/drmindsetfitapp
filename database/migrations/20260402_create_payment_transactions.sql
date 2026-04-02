create extension if not exists pgcrypto;

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  provider text not null default 'mercadopago',
  external_reference text not null,
  preference_id text,
  payment_id text,
  merchant_order_id text,
  status text not null default 'pending',
  status_detail text,
  amount numeric,
  payer_email text,
  raw_preference jsonb,
  raw_payment jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_transactions_external_reference_key
  on public.payment_transactions (external_reference);

create unique index if not exists payment_transactions_payment_id_key
  on public.payment_transactions (payment_id)
  where payment_id is not null;

alter table public.payment_transactions enable row level security;

create policy if not exists "payment_transactions_select_own"
  on public.payment_transactions
  for select
  using (auth.uid() = user_id);
