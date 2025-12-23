-- Migration: Phase 17 Compliance Features
-- Run this in Supabase SQL Editor to add the missing compliant features.

-- 10. REPORTS (For Compliance)
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) not null,
  reported_user_id uuid references public.profiles(id) not null,
  reason text not null,
  details text,
  status text check (status in ('PENDING', 'RESOLVED', 'DISMISSED')) default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reports enable row level security;

-- Drop policy if exists to avoid error on re-run (optional but safe)
drop policy if exists "Users can insert reports" on reports;

create policy "Users can insert reports"
  on reports for insert
  with check ( auth.uid() = reporter_id );

-- 11. RPC: Delete Own Account
create or replace function delete_own_account()
returns void
language plpgsql
security definer
as $$
begin
  -- This function allows the user to delete their own auth account.
  -- Cascading deletes should handle public.profiles and related data if configured correctly.
  delete from auth.users where id = auth.uid();
end;
$$;
