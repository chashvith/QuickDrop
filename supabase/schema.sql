-- ============================================================
-- QuickDrop — Supabase SQL Setup
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create the drops table
create table if not exists public.drops (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('text', 'file')),
  content     text,
  file_url    text,
  file_name   text,
  file_type   text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '7 days')
);

-- 2. Index for fast user queries ordered by time
create index if not exists drops_user_created_idx
  on public.drops (user_id, created_at desc);

-- 3. Enable Row Level Security
alter table public.drops enable row level security;

-- 4. RLS Policies — users can only CRUD their own drops
create policy "Users can view own drops"
  on public.drops for select
  using (auth.uid() = user_id);

create policy "Users can insert own drops"
  on public.drops for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own drops"
  on public.drops for delete
  using (auth.uid() = user_id);

-- 5. Enable realtime for the drops table
alter publication supabase_realtime add table public.drops;

-- ============================================================
-- Storage Setup — run these policies in Dashboard > Storage
-- Create a bucket called: files
-- Set it to PUBLIC so file URLs work
-- Then add the following storage policies:
-- ============================================================

-- Allow authenticated users to upload to their own folder
-- (objects path: {user_id}/*)
create policy "Users can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own files"
  on storage.objects for select
  using (
    bucket_id = 'files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- Optional: Auto-delete expired drops (pg_cron extension)
-- Enable pg_cron in Supabase > Database > Extensions first
-- ============================================================
-- select cron.schedule(
--   'delete-expired-drops',
--   '0 * * * *',  -- every hour
--   $$delete from public.drops where expires_at < now()$$
-- );
