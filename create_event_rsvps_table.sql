-- Create table for Event RSVPs if it doesn't exist
create table if not exists public.event_rsvps (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text check (status in ('CONFIRMED', 'DECLINED')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, user_id)
);

-- Enable RLS
alter table public.event_rsvps enable row level security;

-- Policies

-- Everyone can view RSVPs (to see who is going)
create policy "Everyone can view rsvps"
  on public.event_rsvps for select
  using (true);

-- Authenticated users can insert their own RSVP
create policy "Users can insert their own rsvp"
  on public.event_rsvps for insert
  with check (auth.uid() = user_id);

-- Authenticated users can update their own RSVP
create policy "Users can update their own rsvp"
  on public.event_rsvps for update
  using (auth.uid() = user_id);

-- Authenticated users can delete their own RSVP
create policy "Users can delete their own rsvp"
  on public.event_rsvps for delete
  using (auth.uid() = user_id);

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_event_rsvps_updated_at
  before update on public.event_rsvps
  for each row
  execute procedure public.handle_updated_at();
