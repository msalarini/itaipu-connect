-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  global_role text check (global_role in ('MEMBER', 'LEADER', 'PASTOR')) default 'MEMBER',
  preferences jsonb default '{"push_notifications": true}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. MINISTRIES
create table public.ministries (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MINISTRY_MEMBERS
create table public.ministry_members (
  id uuid default uuid_generate_v4() primary key,
  ministry_id uuid references public.ministries(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ministry_role text check (ministry_role in ('MEMBER', 'LEADER')) default 'MEMBER',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(ministry_id, user_id)
);

-- 4. MESSAGES
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  ministry_id uuid references public.ministries(id) on delete cascade not null,
  author_id uuid references public.profiles(id) not null,
  content text,
  parent_message_id uuid references public.messages(id) on delete cascade, -- NULL = root, NOT NULL = thread
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MESSAGE_ATTACHMENTS
create table public.message_attachments (
  id uuid default uuid_generate_v4() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  file_url text not null,
  file_name text,
  file_type text,
  file_size integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ANNOUNCEMENTS
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  author_id uuid references public.profiles(id) not null,
  ministry_id uuid references public.ministries(id) on delete cascade, -- NULL if global
  is_global boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. EVENTS
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  location text,
  event_date timestamp with time zone not null,
  ministry_id uuid references public.ministries(id) on delete cascade, -- NULL if global
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. INVITES
create table public.invites (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  code text unique not null,
  global_role text check (global_role in ('MEMBER', 'LEADER', 'PASTOR')),
  ministries_default jsonb, -- Array of ministry_ids to auto-join
  created_by uuid references public.profiles(id),
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. PUSH_TOKENS
create table public.push_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  expo_push_token text not null,
  platform text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, expo_push_token)
);

-- ENABLE RLS
alter table public.profiles enable row level security;
alter table public.ministries enable row level security;
alter table public.ministry_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.invites enable row level security;
alter table public.push_tokens enable row level security;

-- POLICIES

-- Profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Ministries
create policy "Ministries are viewable by everyone"
  on ministries for select
  using ( true );

create policy "Only PASTOR can insert ministries"
  on ministries for insert
  with check ( exists (
    select 1 from profiles
    where id = auth.uid() and global_role = 'PASTOR'
  ));

create policy "Only PASTOR can update ministries"
  on ministries for update
  using ( exists (
    select 1 from profiles
    where id = auth.uid() and global_role = 'PASTOR'
  ));

create policy "Only PASTOR can delete ministries"
  on ministries for delete
  using ( exists (
    select 1 from profiles
    where id = auth.uid() and global_role = 'PASTOR'
  ));

-- Ministry Members
create policy "Members viewable by ministry members or PASTOR"
  on ministry_members for select
  using (
    exists (
      select 1 from ministry_members mm
      where mm.ministry_id = ministry_members.ministry_id
      and mm.user_id = auth.uid()
    ) or exists (
      select 1 from profiles
      where id = auth.uid() and global_role = 'PASTOR'
    )
  );

-- Messages
create policy "Messages viewable by ministry members"
  on messages for select
  using (
    exists (
      select 1 from ministry_members mm
      where mm.ministry_id = messages.ministry_id
      and mm.user_id = auth.uid()
    )
  );

create policy "Members can insert messages"
  on messages for insert
  with check (
    exists (
      select 1 from ministry_members mm
      where mm.ministry_id = messages.ministry_id
      and mm.user_id = auth.uid()
    )
  );

-- Announcements
create policy "Announcements viewable by everyone"
  on announcements for select
  using ( true );

-- Events
create policy "Events viewable by everyone"
  on events for select
  using ( true );

-- Message Attachments
create policy "Attachments viewable by ministry members"
  on message_attachments for select
  using (
    exists (
      select 1 from messages m
      join ministry_members mm on mm.ministry_id = m.ministry_id
      where m.id = message_attachments.message_id
      and mm.user_id = auth.uid()
    )
  );

create policy "Members can insert attachments"
  on message_attachments for insert
  with check (
    exists (
      select 1 from messages m
      join ministry_members mm on mm.ministry_id = m.ministry_id
      where m.id = message_attachments.message_id
      and mm.user_id = auth.uid()
    )
  );

create policy "Authors can delete their attachments"
  on message_attachments for delete
  using (
    exists (
      select 1 from messages m
      where m.id = message_attachments.message_id
      and m.author_id = auth.uid()
    )
  );

-- Storage Buckets (Create if not exists via dashboard, but policies here if possible)
-- Note: Storage policies are usually handled in Storage section, but we can define standard RLS if table wrappers are used.
-- For now, we assume Storage will be configured in Dashboard.
