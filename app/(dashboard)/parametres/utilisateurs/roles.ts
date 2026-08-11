// Rôles proposés à l'invitation en P1 (voir docs/architecture/rbac.md pour le
// catalogue complet des 11 rôles système, dont 6 seulement sont câblés en UI).
export const P1_ROLE_OPTIONS = [
  { code: "org_admin", label: "Administrateur d'église" },
  { code: "pastor", label: "Pasteur" },
  { code: "finance_manager", label: "Responsable financier" },
  { code: "dept_head", label: "Responsable de département" },
  { code: "member", label: "Membre" },
] as const;
