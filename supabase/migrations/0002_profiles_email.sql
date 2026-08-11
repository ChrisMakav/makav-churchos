-- MAKAV ChurchOS — Incrément 1 (suite) : dénormalise l'email dans profiles.
-- Nécessaire pour afficher la liste des utilisateurs (parametres/utilisateurs)
-- sans accès au schéma auth (non exposé via l'API REST/anon).

alter table profiles add column email text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  );

  update memberships
  set user_id = new.id, status = 'active', invited_email = null
  where invited_email = lower(new.email) and user_id is null;

  return new;
end;
$$;
