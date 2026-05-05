
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated"
  on public.profiles for select to authenticated using (true);
create policy "Users insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tasks status enum
create type public.task_status as enum ('open','in_progress','complete','cancelled');

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  tags text[] not null default '{}',
  scheduled_at timestamptz,
  volunteers_needed int not null default 1 check (volunteers_needed >= 1),
  status public.task_status not null default 'open',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;

create policy "Tasks viewable by authenticated"
  on public.tasks for select to authenticated using (true);
create policy "Authenticated can create tasks"
  on public.tasks for insert to authenticated with check (auth.uid() = created_by);
create policy "Creators can update tasks"
  on public.tasks for update to authenticated using (auth.uid() = created_by);
create policy "Creators can delete tasks"
  on public.tasks for delete to authenticated using (auth.uid() = created_by);

-- Task claims
create table public.task_claims (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (task_id, user_id)
);
alter table public.task_claims enable row level security;

create policy "Claims viewable by authenticated"
  on public.task_claims for select to authenticated using (true);
create policy "Users create own claims"
  on public.task_claims for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own claims"
  on public.task_claims for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own claims"
  on public.task_claims for delete to authenticated using (auth.uid() = user_id);

-- Task notes
create table public.task_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.task_notes enable row level security;

create policy "Notes viewable by authenticated"
  on public.task_notes for select to authenticated using (true);
create policy "Users create own notes"
  on public.task_notes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete own notes"
  on public.task_notes for delete to authenticated using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create index tasks_status_idx on public.tasks(status);
create index task_claims_user_idx on public.task_claims(user_id);
create index task_claims_task_idx on public.task_claims(task_id);
