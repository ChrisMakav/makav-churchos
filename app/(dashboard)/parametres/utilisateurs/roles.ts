// Rôles proposés à l'invitation en P1 (voir docs/architecture/rbac.md pour le
// catalogue complet des 11 rôles système). volunteer_manager et
// communications_manager ajoutés avec les modules Bénévoles (0018) et
// Communication (0019) — sans quoi leurs permissions câblées en base
// resteraient inatteignables depuis l'UI (aucun org_admin ne peut assigner un
// rôle absent de cette liste).
export const P1_ROLE_OPTIONS = [
  { code: "org_admin", label: "Administrateur d'église" },
  { code: "pastor", label: "Pasteur" },
  { code: "finance_manager", label: "Responsable financier" },
  { code: "dept_head", label: "Responsable de département" },
  { code: "volunteer_manager", label: "Responsable RH / bénévoles" },
  { code: "communications_manager", label: "Responsable communication" },
  { code: "member", label: "Membre" },
] as const;
