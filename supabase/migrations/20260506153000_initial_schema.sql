create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default '',
  canvas_ids uuid[] not null default '{}',
  personal_canvas_id uuid,
  shared_canvas_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.canvases (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Untitled canvas',
  owner_id uuid not null references auth.users(id) on delete cascade,
  members uuid[] not null default '{}',
  type text not null default 'personal' check (type in ('personal', 'shared')),
  items jsonb not null default '[]'::jsonb,
  join_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists canvases_join_code_key on public.canvases(join_code);
create index if not exists canvases_owner_id_idx on public.canvases(owner_id);
create index if not exists canvases_members_idx on public.canvases using gin(members);

alter table public.profiles
  add constraint profiles_personal_canvas_fk
  foreign key (personal_canvas_id)
  references public.canvases(id)
  on delete set null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists canvases_set_updated_at on public.canvases;
create trigger canvases_set_updated_at
before update on public.canvases
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.join_canvas_by_code(p_join_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canvas_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id
  into v_canvas_id
  from public.canvases
  where join_code = upper(trim(p_join_code))
  limit 1;

  if v_canvas_id is null then
    raise exception 'Invalid join code';
  end if;

  update public.canvases
  set members = case
    when auth.uid() = any(members) then members
    else array_append(members, auth.uid())
  end,
  type = case
    when owner_id = auth.uid() then type
    else 'shared'
  end
  where id = v_canvas_id;

  update public.profiles
  set
    canvas_ids = case
      when v_canvas_id = any(canvas_ids) then canvas_ids
      else array_append(canvas_ids, v_canvas_id)
    end,
    shared_canvas_ids = case
      when v_canvas_id = any(shared_canvas_ids) then shared_canvas_ids
      else array_append(shared_canvas_ids, v_canvas_id)
    end
  where id = auth.uid();

  return v_canvas_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.canvases enable row level security;

drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy "Profiles are readable by their owner"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Profiles are editable by their owner" on public.profiles;
create policy "Profiles are editable by their owner"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Canvas members can read canvases" on public.canvases;
create policy "Canvas members can read canvases"
on public.canvases for select
to authenticated
using (auth.uid() = any(members));

drop policy if exists "Users can create their own canvases" on public.canvases;
create policy "Users can create their own canvases"
on public.canvases for insert
to authenticated
with check (auth.uid() = owner_id and auth.uid() = any(members));

drop policy if exists "Canvas members can update canvases" on public.canvases;
create policy "Canvas members can update canvases"
on public.canvases for update
to authenticated
using (auth.uid() = any(members))
with check (auth.uid() = any(members));

drop policy if exists "Canvas owners can delete canvases" on public.canvases;
create policy "Canvas owners can delete canvases"
on public.canvases for delete
to authenticated
using (auth.uid() = owner_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.canvases to authenticated;
grant execute on function public.join_canvas_by_code(text) to authenticated;
