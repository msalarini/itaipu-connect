-- Create a new bucket for avatars if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up RLS for avatars bucket
-- Everyone can view avatars
create policy "Everyone can view avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Authenticated users can upload their own avatar
-- We'll use a folder structure typically or just file naming. 
-- Policy to allow insert if user is authenticated. 
-- For better security we could restrict path to match userid, but strictly simple for now:
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Users can update their own avatars
create policy "Users can update their own avatars"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner )
  with check ( bucket_id = 'avatars' and auth.uid() = owner );

-- Users can delete their own avatars
create policy "Users can delete their own avatars"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.uid() = owner );
