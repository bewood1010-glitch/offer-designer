-- Offer Designer member gate (nickname + password, admin approval)
-- Stores only: nickname, bcrypt password hash, status, timestamps. No e-mail, no pay data.
-- All access goes through SECURITY DEFINER RPC functions; tables are closed to the anon role.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.od_users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  pw_hash text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_admin boolean not null default false,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  last_login timestamptz
);
create unique index if not exists od_users_nick_uq on public.od_users (lower(nickname));

create table if not exists public.od_sessions (
  token_hash text primary key,
  user_id uuid not null references public.od_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists od_sessions_user_idx on public.od_sessions(user_id);

alter table public.od_users enable row level security;
alter table public.od_sessions enable row level security;
revoke all on public.od_users, public.od_sessions from anon, authenticated;

-- helpers -------------------------------------------------------------------
create or replace function public.od__session_user(p_token text)
returns public.od_users language plpgsql security definer set search_path = public, extensions as $$
declare u public.od_users;
begin
  delete from od_sessions where expires_at < now();
  select us.* into u from od_sessions s join od_users us on us.id = s.user_id
   where s.token_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex') and us.status = 'approved';
  return u;
end $$;

create or replace function public.od__valid_pw(p text) returns boolean language sql immutable set search_path = public as $$
  select length(p) between 8 and 72 and p ~ '[A-Za-z]' and p ~ '[0-9]'
$$;

-- public RPCs ---------------------------------------------------------------
create or replace function public.od_signup(p_nick text, p_pw text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare n text := btrim(coalesce(p_nick,''));
begin
  if n !~ '^[가-힣A-Za-z0-9_]{2,20}$' then return json_build_object('ok',false,'error','bad_nick'); end if;
  if not od__valid_pw(coalesce(p_pw,'')) then return json_build_object('ok',false,'error','bad_pw'); end if;
  if (select count(*) from od_users where status = 'pending') >= 50 then return json_build_object('ok',false,'error','too_many_pending'); end if;
  if exists (select 1 from od_users where lower(nickname) = lower(n)) then return json_build_object('ok',false,'error','nick_taken'); end if;
  insert into od_users(nickname, pw_hash) values (n, crypt(p_pw, gen_salt('bf', 10)));
  return json_build_object('ok',true);
end $$;

create or replace function public.od_login(p_nick text, p_pw text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare u od_users; tok text;
begin
  select * into u from od_users where lower(nickname) = lower(btrim(coalesce(p_nick,'')));
  if not found then perform crypt('x', gen_salt('bf', 10)); return json_build_object('ok',false,'error','bad_login'); end if;
  if u.locked_until is not null and u.locked_until > now() then return json_build_object('ok',false,'error','locked'); end if;
  if u.pw_hash <> crypt(coalesce(p_pw,''), u.pw_hash) then
    update od_users set
      locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end,
      failed_attempts = case when failed_attempts + 1 >= 5 then 0 else failed_attempts + 1 end
     where id = u.id;
    return json_build_object('ok',false,'error','bad_login');
  end if;
  update od_users set failed_attempts = 0, locked_until = null where id = u.id;
  if u.status = 'pending' then return json_build_object('ok',false,'error','pending'); end if;
  if u.status = 'rejected' then return json_build_object('ok',false,'error','rejected'); end if;
  tok := encode(gen_random_bytes(32), 'hex');
  insert into od_sessions(token_hash, user_id, expires_at) values (encode(digest(tok,'sha256'),'hex'), u.id, now() + interval '12 hours');
  update od_users set last_login = now() where id = u.id;
  return json_build_object('ok',true,'token',tok,'nickname',u.nickname,'is_admin',u.is_admin);
end $$;

create or replace function public.od_me(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare u od_users;
begin
  u := od__session_user(p_token);
  if u.id is null then return json_build_object('ok',false,'error','expired'); end if;
  return json_build_object('ok',true,'nickname',u.nickname,'is_admin',u.is_admin);
end $$;

create or replace function public.od_logout(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from od_sessions where token_hash = encode(digest(coalesce(p_token,''),'sha256'),'hex');
  return json_build_object('ok',true);
end $$;

create or replace function public.od_change_password(p_token text, p_old text, p_new text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare u od_users;
begin
  u := od__session_user(p_token);
  if u.id is null then return json_build_object('ok',false,'error','expired'); end if;
  if u.pw_hash <> crypt(coalesce(p_old,''), u.pw_hash) then return json_build_object('ok',false,'error','bad_login'); end if;
  if not od__valid_pw(coalesce(p_new,'')) then return json_build_object('ok',false,'error','bad_pw'); end if;
  update od_users set pw_hash = crypt(p_new, gen_salt('bf', 10)) where id = u.id;
  delete from od_sessions where user_id = u.id and token_hash <> encode(digest(p_token,'sha256'),'hex');
  return json_build_object('ok',true);
end $$;

create or replace function public.od_withdraw(p_token text, p_pw text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare u od_users;
begin
  u := od__session_user(p_token);
  if u.id is null then return json_build_object('ok',false,'error','expired'); end if;
  if u.pw_hash <> crypt(coalesce(p_pw,''), u.pw_hash) then return json_build_object('ok',false,'error','bad_login'); end if;
  if u.is_admin and (select count(*) from od_users where is_admin and status = 'approved') <= 1 then
    return json_build_object('ok',false,'error','last_admin'); end if;
  delete from od_users where id = u.id;
  return json_build_object('ok',true);
end $$;

-- admin RPCs ----------------------------------------------------------------
create or replace function public.od_admin_list(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare u od_users;
begin
  u := od__session_user(p_token);
  if u.id is null or not u.is_admin then return json_build_object('ok',false,'error','expired'); end if;
  return json_build_object('ok',true,'users', coalesce((
    select json_agg(json_build_object('id',x.id,'nickname',x.nickname,'status',x.status,'is_admin',x.is_admin,
      'created_at',x.created_at,'last_login',x.last_login,'self',x.id = u.id)
      order by (x.status = 'pending') desc, x.created_at desc)
    from od_users x), '[]'::json));
end $$;

create or replace function public.od_admin_set(p_token text, p_user uuid, p_action text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare u od_users;
begin
  u := od__session_user(p_token);
  if u.id is null or not u.is_admin then return json_build_object('ok',false,'error','expired'); end if;
  if p_user = u.id and p_action <> 'approve' then return json_build_object('ok',false,'error','self'); end if;
  if p_action = 'approve' then update od_users set status = 'approved', approved_at = now() where id = p_user;
  elsif p_action = 'reject' then update od_users set status = 'rejected', is_admin = false where id = p_user; delete from od_sessions where user_id = p_user;
  elsif p_action = 'admin' then update od_users set is_admin = true where id = p_user and status = 'approved';
  elsif p_action = 'unadmin' then update od_users set is_admin = false where id = p_user;
  elsif p_action = 'delete' then delete from od_users where id = p_user;
  else return json_build_object('ok',false,'error','bad_action'); end if;
  return json_build_object('ok',true);
end $$;

-- only the public RPCs are callable from the browser
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.od_signup(text,text), public.od_login(text,text), public.od_me(text), public.od_logout(text),
  public.od_change_password(text,text,text), public.od_withdraw(text,text),
  public.od_admin_list(text), public.od_admin_set(text,uuid,text) to anon;

-- first administrator: after signing up in the app, run once in the SQL editor
-- update public.od_users set status = 'approved', is_admin = true, approved_at = now() where nickname = '<your nickname>';
