-- ============================================================
-- Al Kawser LMS - Supabase SQL Editor Setup
-- Paste this whole file into Supabase Dashboard -> SQL Editor
-- Safe to rerun: functions, triggers, indexes, buckets, and
-- policies are recreated idempotently where practical.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text,
  avatar_url text,
  role text not null default 'student' check (role in ('admin', 'student')),
  streak integer not null default 0 check (streak >= 0),
  last_active date,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  thumbnail_url text,
  level text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  language text not null default 'English',
  category text not null default 'Islamic Studies',
  is_free boolean not null default true,
  price numeric(10, 2) not null default 0 check (price >= 0),
  is_published boolean not null default false,
  playlist_id text,
  instructor_id uuid references public.profiles(id) on delete set null,
  total_lessons integer not null default 0 check (total_lessons >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid not null references public.modules(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  youtube_id text not null,
  thumbnail_url text,
  duration_sec integer not null default 0 check (duration_sec >= 0),
  description text,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  watched_secs integer not null default 0 check (watched_secs >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.certificates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  certificate_id text not null unique default 'AK-' || upper(substring(md5(random()::text), 1, 8)),
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.certificate_settings (
  id uuid primary key default uuid_generate_v4(),
  logo_url text,
  seal_url text,
  signature_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  category text not null default 'other' check (category in ('certificate', 'payment', 'course_access', 'technical', 'other')),
  subject text not null,
  message text not null,
  payment_amount numeric(10, 2) check (payment_amount is null or payment_amount >= 0),
  screenshot_path text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  admin_response text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

create index if not exists idx_courses_published_created on public.courses(is_published, created_at desc);
create index if not exists idx_courses_instructor on public.courses(instructor_id);
create index if not exists idx_courses_category on public.courses(category);
create index if not exists idx_courses_level on public.courses(level);

create index if not exists idx_modules_course_order on public.modules(course_id, "order");
create index if not exists idx_lessons_course_order on public.lessons(course_id, "order");
create index if not exists idx_lessons_module_order on public.lessons(module_id, "order");
create index if not exists idx_lessons_youtube_id on public.lessons(youtube_id);

create index if not exists idx_enrollments_user on public.enrollments(user_id, enrolled_at desc);
create index if not exists idx_enrollments_course on public.enrollments(course_id);
create index if not exists idx_progress_user_course on public.progress(user_id, course_id);
create index if not exists idx_progress_lesson on public.progress(lesson_id);
create index if not exists idx_certificates_user on public.certificates(user_id, issued_at desc);
create index if not exists idx_certificates_course on public.certificates(course_id);
create index if not exists idx_notes_user_lesson on public.lesson_notes(user_id, lesson_id);
create index if not exists idx_bookmarks_user_created on public.bookmarks(user_id, created_at desc);
create index if not exists idx_support_tickets_user_created on public.support_tickets(user_id, created_at desc);
create index if not exists idx_support_tickets_status_created on public.support_tickets(status, created_at desc);
create index if not exists idx_support_tickets_course on public.support_tickets(course_id);

-- ============================================================
-- Functions and triggers
-- ============================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      name = case
        when coalesce(profiles.name, '') = '' then excluded.name
        else profiles.name
      end;

  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_enrolled_in_course(target_course_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    where e.course_id = target_course_id
      and e.user_id = target_user_id
  );
$$;

create or replace function public.can_access_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = target_course_id
      and (
        c.is_published = true
        or public.is_admin()
        or public.is_enrolled_in_course(c.id)
      )
  );
$$;

create or replace function public.lesson_belongs_to_course(target_lesson_id uuid, target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lessons l
    where l.id = target_lesson_id
      and l.course_id = target_course_id
  );
$$;

create or replace function public.lesson_is_in_enrolled_course(target_lesson_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lessons l
    join public.enrollments e
      on e.course_id = l.course_id
     and e.user_id = target_user_id
    where l.id = target_lesson_id
  );
$$;

create or replace function public.has_completed_course(target_user_id uuid, target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select
      c.total_lessons > 0
      and (
        select count(*)
        from public.progress p
        where p.user_id = target_user_id
          and p.course_id = target_course_id
          and p.completed = true
      ) >= c.total_lessons
    from public.courses c
    where c.id = target_course_id
  ), false);
$$;

create or replace function public.verify_certificate(public_certificate_id text)
returns table (
  certificate_id text,
  issued_at timestamptz,
  student_name text,
  course_title text,
  course_category text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.certificate_id,
    c.issued_at,
    p.name as student_name,
    cr.title as course_title,
    cr.category as course_category
  from public.certificates c
  join public.profiles p on p.id = c.user_id
  join public.courses cr on cr.id = c.course_id
  where c.certificate_id = public_certificate_id
  limit 1;
$$;

grant execute on function public.verify_certificate(text) to anon, authenticated;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id <> old.id then
    raise exception 'Profile id cannot be changed';
  end if;

  if auth.role() <> 'service_role' and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only admins can change roles';
    end if;

    if new.email is distinct from old.email then
      raise exception 'Email must be changed through Supabase Auth';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_course_lesson_count()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  affected_course_id uuid;
begin
  if tg_op = 'DELETE' then
    affected_course_id := old.course_id;
  else
    affected_course_id := new.course_id;
  end if;

  update public.courses c
  set total_lessons = (
    select count(*)
    from public.lessons l
    where l.course_id = affected_course_id
  )
  where c.id = affected_course_id;

  if tg_op = 'UPDATE' and old.course_id is distinct from new.course_id then
    update public.courses c
    set total_lessons = (
      select count(*)
      from public.lessons l
      where l.course_id = old.course_id
    )
    where c.id = old.course_id;
  end if;

  return null;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.update_updated_at();

drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated
  before update on public.courses
  for each row execute function public.update_updated_at();

drop trigger if exists trg_progress_updated on public.progress;
create trigger trg_progress_updated
  before update on public.progress
  for each row execute function public.update_updated_at();

drop trigger if exists trg_notes_updated on public.lesson_notes;
create trigger trg_notes_updated
  before update on public.lesson_notes
  for each row execute function public.update_updated_at();

drop trigger if exists trg_support_tickets_updated on public.support_tickets;
create trigger trg_support_tickets_updated
  before update on public.support_tickets
  for each row execute function public.update_updated_at();

drop trigger if exists trg_certificate_settings_updated on public.certificate_settings;
create trigger trg_certificate_settings_updated
  before update on public.certificate_settings
  for each row execute function public.update_updated_at();

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

drop trigger if exists trg_lesson_count on public.lessons;
create trigger trg_lesson_count
  after insert or delete or update of course_id on public.lessons
  for each row execute function public.sync_course_lesson_count();

-- Backfill profiles for users who already signed up before running this script.
insert into public.profiles (id, email, name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'name', split_part(coalesce(u.email, ''), '@', 1))
from auth.users u
on conflict (id) do update
set email = excluded.email;

-- Recalculate lesson totals for existing courses.
update public.courses c
set total_lessons = (
  select count(*)
  from public.lessons l
  where l.course_id = c.id
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.progress enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_settings enable row level security;
alter table public.lesson_notes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;

create policy "Authenticated users can view profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can update any profile"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can view accessible courses" on public.courses;
drop policy if exists "Admins can insert courses" on public.courses;
drop policy if exists "Admins can update courses" on public.courses;
drop policy if exists "Admins can delete courses" on public.courses;

create policy "Users can view accessible courses"
  on public.courses
  for select
  to authenticated
  using (public.can_access_course(id));

create policy "Admins can insert courses"
  on public.courses
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update courses"
  on public.courses
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete courses"
  on public.courses
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Users can view accessible modules" on public.modules;
drop policy if exists "Admins can insert modules" on public.modules;
drop policy if exists "Admins can update modules" on public.modules;
drop policy if exists "Admins can delete modules" on public.modules;

create policy "Users can view accessible modules"
  on public.modules
  for select
  to authenticated
  using (public.can_access_course(course_id));

create policy "Admins can insert modules"
  on public.modules
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update modules"
  on public.modules
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete modules"
  on public.modules
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Users can view accessible lessons" on public.lessons;
drop policy if exists "Admins can insert lessons" on public.lessons;
drop policy if exists "Admins can update lessons" on public.lessons;
drop policy if exists "Admins can delete lessons" on public.lessons;

create policy "Users can view accessible lessons"
  on public.lessons
  for select
  to authenticated
  using (public.can_access_course(course_id));

create policy "Admins can insert lessons"
  on public.lessons
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update lessons"
  on public.lessons
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete lessons"
  on public.lessons
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Users can view own enrollments" on public.enrollments;
drop policy if exists "Users can insert own enrollments" on public.enrollments;
drop policy if exists "Users can update own enrollments" on public.enrollments;
drop policy if exists "Users can delete own enrollments" on public.enrollments;

create policy "Users can view own enrollments"
  on public.enrollments
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can insert own enrollments"
  on public.enrollments
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and exists (
        select 1
        from public.courses c
        where c.id = course_id
          and c.is_published = true
      )
    )
  );

create policy "Users can update own enrollments"
  on public.enrollments
  for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users can delete own enrollments"
  on public.enrollments
  for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can view own progress" on public.progress;
drop policy if exists "Users can insert own progress" on public.progress;
drop policy if exists "Users can update own progress" on public.progress;
drop policy if exists "Users can delete own progress" on public.progress;

create policy "Users can view own progress"
  on public.progress
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can insert own progress"
  on public.progress
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and public.is_enrolled_in_course(course_id, user_id)
      and public.lesson_belongs_to_course(lesson_id, course_id)
    )
  );

create policy "Users can update own progress"
  on public.progress
  for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and public.is_enrolled_in_course(course_id, user_id)
      and public.lesson_belongs_to_course(lesson_id, course_id)
    )
  );

create policy "Users can delete own progress"
  on public.progress
  for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can view own certificates" on public.certificates;
drop policy if exists "Users can insert earned certificates" on public.certificates;
drop policy if exists "Authenticated users can view certificate settings" on public.certificate_settings;
drop policy if exists "Admins can insert certificate settings" on public.certificate_settings;
drop policy if exists "Admins can update certificate settings" on public.certificate_settings;

create policy "Users can view own certificates"
  on public.certificates
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can insert earned certificates"
  on public.certificates
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and public.is_enrolled_in_course(course_id, user_id)
      and public.has_completed_course(user_id, course_id)
    )
  );

create policy "Authenticated users can view certificate settings"
  on public.certificate_settings
  for select
  to authenticated
  using (true);

create policy "Admins can insert certificate settings"
  on public.certificate_settings
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update certificate settings"
  on public.certificate_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can view own notes" on public.lesson_notes;
drop policy if exists "Users can insert own notes" on public.lesson_notes;
drop policy if exists "Users can update own notes" on public.lesson_notes;
drop policy if exists "Users can delete own notes" on public.lesson_notes;

create policy "Users can view own notes"
  on public.lesson_notes
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can insert own notes"
  on public.lesson_notes
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and public.lesson_is_in_enrolled_course(lesson_id, user_id)
    )
  );

create policy "Users can update own notes"
  on public.lesson_notes
  for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and public.lesson_is_in_enrolled_course(lesson_id, user_id)
    )
  );

create policy "Users can delete own notes"
  on public.lesson_notes
  for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can view own bookmarks" on public.bookmarks;
drop policy if exists "Users can insert own bookmarks" on public.bookmarks;
drop policy if exists "Users can delete own bookmarks" on public.bookmarks;

create policy "Users can view own bookmarks"
  on public.bookmarks
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can insert own bookmarks"
  on public.bookmarks
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and public.lesson_is_in_enrolled_course(lesson_id, user_id)
    )
  );

create policy "Users can delete own bookmarks"
  on public.bookmarks
  for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can view own support tickets" on public.support_tickets;
drop policy if exists "Users can insert own support tickets" on public.support_tickets;
drop policy if exists "Admins can view all support tickets" on public.support_tickets;
drop policy if exists "Admins can update support tickets" on public.support_tickets;
drop policy if exists "Admins can delete support tickets" on public.support_tickets;

create policy "Users can view own support tickets"
  on public.support_tickets
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can insert own support tickets"
  on public.support_tickets
  for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy "Admins can view all support tickets"
  on public.support_tickets
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update support tickets"
  on public.support_tickets
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete support tickets"
  on public.support_tickets
  for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- Storage buckets and storage policies
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('thumbnails', 'thumbnails', true),
  ('certificates', 'certificates', true),
  ('certificate-assets', 'certificate-assets', true),
  ('avatars', 'avatars', true),
  ('support-attachments', 'support-attachments', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can read thumbnails" on storage.objects;
drop policy if exists "Admins can upload thumbnails" on storage.objects;
drop policy if exists "Admins can update thumbnails" on storage.objects;
drop policy if exists "Admins can delete thumbnails" on storage.objects;
drop policy if exists "Public can read certificates" on storage.objects;
drop policy if exists "Users can manage own certificates" on storage.objects;
drop policy if exists "Public can read certificate assets" on storage.objects;
drop policy if exists "Admins can manage certificate assets" on storage.objects;
drop policy if exists "Public can read avatars" on storage.objects;
drop policy if exists "Users can manage own avatars" on storage.objects;
drop policy if exists "Users can view own support attachments" on storage.objects;
drop policy if exists "Users can upload own support attachments" on storage.objects;
drop policy if exists "Admins can update support attachments" on storage.objects;
drop policy if exists "Admins can delete support attachments" on storage.objects;

create policy "Public can read thumbnails"
  on storage.objects
  for select
  to public
  using (bucket_id = 'thumbnails');

create policy "Admins can upload thumbnails"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'thumbnails' and public.is_admin());

create policy "Admins can update thumbnails"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin())
  with check (bucket_id = 'thumbnails' and public.is_admin());

create policy "Admins can delete thumbnails"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin());

create policy "Public can read certificates"
  on storage.objects
  for select
  to public
  using (bucket_id = 'certificates');

create policy "Users can manage own certificates"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'certificates'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'certificates'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "Public can read certificate assets"
  on storage.objects
  for select
  to public
  using (bucket_id = 'certificate-assets');

create policy "Admins can manage certificate assets"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'certificate-assets' and public.is_admin())
  with check (bucket_id = 'certificate-assets' and public.is_admin());

create policy "Public can read avatars"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy "Users can manage own avatars"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'avatars'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "Users can view own support attachments"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'support-attachments'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "Users can upload own support attachments"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'support-attachments'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "Admins can update support attachments"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'support-attachments' and public.is_admin())
  with check (bucket_id = 'support-attachments' and public.is_admin());

create policy "Admins can delete support attachments"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'support-attachments' and public.is_admin());

-- ============================================================
-- First admin
-- Replace the email below after you sign up through the app.
-- ============================================================

-- update public.profiles
-- set role = 'admin'
-- where email = 'your@email.com';
