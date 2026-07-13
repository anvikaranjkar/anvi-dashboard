-- Run once in Supabase > SQL Editor.
-- The app uses one shared dashboard record and syncs it automatically.

create extension if not exists pgcrypto;

create table if not exists public.student_dashboards (
  access_hash text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.student_dashboards enable row level security;
revoke all on public.student_dashboards from anon, authenticated;

drop function if exists public.load_student_dashboard(text);
drop function if exists public.save_student_dashboard(text, jsonb);

create or replace function public.load_student_dashboard()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select payload from public.student_dashboards where access_hash = 'anvis-dashboard-primary'),
    '{}'::jsonb
  );
$$;

create or replace function public.save_student_dashboard(new_payload jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.student_dashboards (access_hash, payload, updated_at)
  values ('anvis-dashboard-primary', new_payload, now())
  on conflict (access_hash) do update
  set payload = excluded.payload, updated_at = excluded.updated_at;
$$;

revoke all on function public.load_student_dashboard() from public;
revoke all on function public.save_student_dashboard(jsonb) from public;
grant execute on function public.load_student_dashboard() to anon, authenticated;
grant execute on function public.save_student_dashboard(jsonb) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vision-board',
  'vision-board',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "Public vision images" on storage.objects;
drop policy if exists "Upload vision images" on storage.objects;

create policy "Public vision images"
on storage.objects for select
to public
using (bucket_id = 'vision-board');

create policy "Upload vision images"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'vision-board');
