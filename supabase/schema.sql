-- CIPL database bootstrap. Run once in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  client_name text not null,
  company_name text not null,
  username text not null unique,
  length_ft numeric not null check (length_ft > 0),
  width_ft numeric not null check (width_ft > 0),
  height_ft numeric not null check (height_ft > 0),
  total_sqft numeric not null check (total_sqft > 0),
  warehouse_type text not null,
  current_stage text not null default 'Awaiting the first site update',
  pdf_plan_url text,
  created_at timestamptz not null default now()
);

-- Existing installations used a fixed seven-stage check constraint. Site updates
-- are now written freely by the project team.
alter table public.clients drop constraint if exists clients_current_stage_check;
alter table public.clients alter column current_stage set default 'Awaiting the first site update';

create table if not exists public.project_model_updates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  milestone_title text not null check (char_length(milestone_title) between 1 and 120),
  site_update text not null check (char_length(site_update) between 1 and 2000),
  model_path text not null unique,
  original_filename text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 524288000),
  uploaded_at timestamptz not null default now()
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  photo_url text not null,
  caption text,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  company text,
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) <= 40),
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.inquiry_rate_limits (
  fingerprint text primary key,
  window_started timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0)
);

alter table public.clients drop constraint if exists clients_client_name_length;
alter table public.clients add constraint clients_client_name_length check (char_length(client_name) between 1 and 120);
alter table public.clients drop constraint if exists clients_company_name_length;
alter table public.clients add constraint clients_company_name_length check (char_length(company_name) between 1 and 160);
alter table public.clients drop constraint if exists clients_username_format;
alter table public.clients add constraint clients_username_format check (username ~ '^[a-zA-Z0-9._-]{3,40}$');
alter table public.progress_photos drop constraint if exists progress_photos_caption_length;
alter table public.progress_photos add constraint progress_photos_caption_length check (caption is null or char_length(caption) <= 240);

create index if not exists clients_auth_user_idx on public.clients(auth_user_id);
create index if not exists photos_client_idx on public.progress_photos(client_id);
create index if not exists model_updates_client_date_idx on public.project_model_updates(client_id, uploaded_at desc);
create index if not exists inquiries_created_idx on public.inquiries(created_at desc);
create index if not exists inquiry_rate_limits_window_idx on public.inquiry_rate_limits(window_started);

alter table public.clients enable row level security;
alter table public.progress_photos enable row level security;
alter table public.project_model_updates enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_rate_limits enable row level security;

grant select on public.clients to authenticated;
grant insert, update, delete on public.clients to authenticated;
grant select, insert, delete on public.progress_photos to authenticated;
grant select, insert, delete on public.project_model_updates to authenticated;
grant select on public.inquiries to authenticated;
revoke insert, update, delete on public.inquiries from anon, authenticated;
revoke all on public.inquiry_rate_limits from anon, authenticated;

create or replace function public.consume_inquiry_rate_limit(
  p_fingerprint text,
  p_limit integer default 5,
  p_window_seconds integer default 900
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  if p_fingerprint is null or char_length(p_fingerprint) <> 64
    or p_limit < 1 or p_limit > 100
    or p_window_seconds < 60 or p_window_seconds > 86400 then
    return false;
  end if;

  delete from public.inquiry_rate_limits
  where window_started < now() - interval '1 day';

  insert into public.inquiry_rate_limits (fingerprint, window_started, attempts)
  values (p_fingerprint, now(), 1)
  on conflict (fingerprint) do update
  set
    window_started = case
      when inquiry_rate_limits.window_started < now() - make_interval(secs => p_window_seconds) then now()
      else inquiry_rate_limits.window_started
    end,
    attempts = case
      when inquiry_rate_limits.window_started < now() - make_interval(secs => p_window_seconds) then 1
      else inquiry_rate_limits.attempts + 1
    end
  returning attempts <= p_limit into allowed;

  return allowed;
end;
$$;

revoke all on function public.consume_inquiry_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_inquiry_rate_limit(text, integer, integer) to service_role;

drop policy if exists "clients_read_own_or_admin" on public.clients;
drop policy if exists "admin_insert_clients" on public.clients;
drop policy if exists "admin_update_clients" on public.clients;
drop policy if exists "admin_delete_clients" on public.clients;
drop policy if exists "photos_read_own_or_admin" on public.progress_photos;
drop policy if exists "admin_insert_photos" on public.progress_photos;
drop policy if exists "admin_delete_photos" on public.progress_photos;
drop policy if exists "model_updates_read_own_or_admin" on public.project_model_updates;
drop policy if exists "admin_insert_model_updates" on public.project_model_updates;
drop policy if exists "admin_delete_model_updates" on public.project_model_updates;
drop policy if exists "public_create_inquiry" on public.inquiries;
drop policy if exists "admin_read_inquiries" on public.inquiries;

create policy "clients_read_own_or_admin" on public.clients for select to authenticated
using ((select auth.uid()) = auth_user_id or (select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "admin_insert_clients" on public.clients for insert to authenticated
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "admin_update_clients" on public.clients for update to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "admin_delete_clients" on public.clients for delete to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

create policy "photos_read_own_or_admin" on public.progress_photos for select to authenticated
using (exists(select 1 from public.clients c where c.id=client_id and (c.auth_user_id=(select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role')='admin')));
create policy "admin_insert_photos" on public.progress_photos for insert to authenticated
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "admin_delete_photos" on public.progress_photos for delete to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

create policy "model_updates_read_own_or_admin" on public.project_model_updates for select to authenticated
using (exists(
  select 1 from public.clients c
  where c.id = client_id
    and (c.auth_user_id = (select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'role') = 'admin')
));
create policy "admin_insert_model_updates" on public.project_model_updates for insert to authenticated
with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy "admin_delete_model_updates" on public.project_model_updates for delete to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') = 'admin');

create policy "admin_read_inquiries" on public.inquiries for select to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('warehouse-plans','warehouse-plans',false,10485760,array['application/pdf'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "storage_clients_read_own" on storage.objects;
drop policy if exists "storage_admin_insert" on storage.objects;
drop policy if exists "storage_admin_update" on storage.objects;
drop policy if exists "storage_admin_delete" on storage.objects;
drop policy if exists "construction_models_read_own_or_admin" on storage.objects;
drop policy if exists "construction_models_admin_insert" on storage.objects;
drop policy if exists "construction_models_admin_update" on storage.objects;
drop policy if exists "construction_models_admin_delete" on storage.objects;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('progress-photos','progress-photos',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('construction-models','construction-models',false,524288000,array['model/gltf-binary','application/octet-stream'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "storage_clients_read_own" on storage.objects for select to authenticated
using (bucket_id in ('warehouse-plans','progress-photos') and ((storage.foldername(name))[1]=(select auth.uid())::text or (select auth.jwt()->'app_metadata'->>'role')='admin'));
create policy "storage_admin_insert" on storage.objects for insert to authenticated
with check (bucket_id in ('warehouse-plans','progress-photos') and (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "storage_admin_update" on storage.objects for update to authenticated
using (bucket_id in ('warehouse-plans','progress-photos') and (select auth.jwt()->'app_metadata'->>'role')='admin')
with check (bucket_id in ('warehouse-plans','progress-photos') and (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy "storage_admin_delete" on storage.objects for delete to authenticated
using (bucket_id in ('warehouse-plans','progress-photos') and (select auth.jwt()->'app_metadata'->>'role')='admin');

create policy "construction_models_read_own_or_admin" on storage.objects for select to authenticated
using (
  bucket_id = 'construction-models'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or ((select auth.jwt())->'app_metadata'->>'role') = 'admin'
);
create policy "construction_models_admin_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'construction-models' and ((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy "construction_models_admin_update" on storage.objects for update to authenticated
using (bucket_id = 'construction-models' and ((select auth.jwt())->'app_metadata'->>'role') = 'admin')
with check (bucket_id = 'construction-models' and ((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy "construction_models_admin_delete" on storage.objects for delete to authenticated
using (bucket_id = 'construction-models' and ((select auth.jwt())->'app_metadata'->>'role') = 'admin');

-- Create the one admin in Authentication, then run this with their email:
-- update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}') || '{"role":"admin"}'::jsonb where email='admin@example.com';
