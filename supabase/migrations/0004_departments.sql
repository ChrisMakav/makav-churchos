-- MAKAV ChurchOS — Incrément 3 : Départements

create table departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id),
  parent_department_id uuid references departments(id) on delete set null,
  name text not null,
  description text,
  leader_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now()
);

create index departments_organization_id_idx on departments (organization_id);
create unique index departments_org_site_name_uq on departments (organization_id, site_id, lower(name));

create table department_members (
  department_id uuid not null references departments(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  role_in_department text not null default 'member', -- head|assistant|member
  primary key (department_id, member_id)
);

-- Complète la table memberships (incrément 1) : les rôles scopés à un
-- département (dept_head) peuvent maintenant référencer un vrai département.
alter table memberships
  add constraint memberships_department_id_fkey foreign key (department_id) references departments(id) on delete set null;

alter table departments enable row level security;
alter table department_members enable row level security;

create policy departments_select on departments for select
  to authenticated using (is_org_member(organization_id));
create policy departments_insert on departments for insert
  to authenticated with check (is_org_member(organization_id) and has_permission(organization_id, 'departments.write'));
create policy departments_update on departments for update
  to authenticated using (is_org_member(organization_id)) with check (has_permission(organization_id, 'departments.write'));
create policy departments_delete on departments for delete
  to authenticated using (is_org_member(organization_id) and has_permission(organization_id, 'departments.write'));

-- department_members n'a pas organization_id directement : on passe par la
-- fonction is_org_member/has_permission via une sous-requête sur departments.
create policy department_members_select on department_members for select
  to authenticated using (
    exists (select 1 from departments d where d.id = department_members.department_id and is_org_member(d.organization_id))
  );
create policy department_members_write on department_members for all
  to authenticated using (
    exists (
      select 1 from departments d
      where d.id = department_members.department_id
        and is_org_member(d.organization_id)
        and has_permission(d.organization_id, 'departments.write')
    )
  )
  with check (
    exists (
      select 1 from departments d
      where d.id = department_members.department_id
        and has_permission(d.organization_id, 'departments.write')
    )
  );
