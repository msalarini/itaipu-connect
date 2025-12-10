-- Create table for Message Reactions
create table if not exists public.message_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.ministry_messages(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id, emoji) -- Prevent duplicate reaction of same emoji by same user
);

-- Enable RLS
alter table public.message_reactions enable row level security;

-- Policies

-- Everyone can view reactions
create policy "Everyone can view message reactions"
  on public.message_reactions for select
  using (true);

-- Authenticated users can insert their own reaction
create policy "Users can insert their own reaction"
  on public.message_reactions for insert
  with check (auth.uid() = user_id);

-- Authenticated users can delete their own reaction
create policy "Users can delete their own reaction"
  on public.message_reactions for delete
  using (auth.uid() = user_id);
