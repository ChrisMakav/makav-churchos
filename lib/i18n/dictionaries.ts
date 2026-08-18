export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

// Dictionnaire plat (clés à points, ex. "nav.membres") — volontairement pas
// de librairie i18n (next-intl, etc.) : un seul cookie de préférence, pas de
// routes préfixées par locale (voir overview.md, convention "UI en
// français"). Périmètre de ce premier passage : chrome partagé (nav, en-tête,
// actions communes) + Tableau de bord + Membres, traduits intégralement.
// Chaque écran restant est encore 100% français tant qu'il n'a pas reçu le
// même traitement — pas de traduction partielle à l'intérieur d'un même
// écran.
const fr = {
  "nav.pilotage": "Pilotage",
  "nav.tableauDeBord": "Tableau de bord",
  "nav.rapports": "Rapports",
  "nav.communaute": "Communauté",
  "nav.membres": "Membres",
  "nav.familles": "Familles",
  "nav.departements": "Départements",
  "nav.groupes": "Groupes & Cellules",
  "nav.suiviPastoral": "Suivi pastoral",
  "nav.checkin": "Check-in enfants",
  "nav.operations": "Opérations",
  "nav.evenements": "Événements",
  "nav.statistiques": "Statistiques",
  "nav.benevoles": "Bénévoles",
  "nav.covoiturage": "Covoiturage",
  "nav.communication": "Communication",
  "nav.finances": "Dons & finances",
  "nav.budgets": "Budgets",
  "nav.systeme": "Système",
  "nav.parametres": "Paramètres",

  "common.search": "Rechercher un membre, un don, un événement…",
  "common.notifications": "Notifications",
  "common.settings": "Paramètres",
  "common.signOut": "Se déconnecter",
  "common.save": "Enregistrer",
  "common.saving": "Enregistrement…",
  "common.add": "Ajouter",
  "common.member": "membre",
  "common.members": "membres",

  "dashboard.title": "Tableau de bord",
  "dashboard.overviewOf": "Vue d'ensemble de",
  "dashboard.activeMembers": "Membres actifs",
  "dashboard.donationsThisMonth": "Dons du mois",
  "dashboard.upcomingEventsCount": "Événements à venir",
  "dashboard.pendingExpenses": "Dépenses à approuver",
  "dashboard.needsAttention": "Nécessite votre attention",
  "dashboard.upcomingEvents": "Prochains événements",
  "dashboard.noEvents": "Aucun événement planifié",
  "dashboard.noEventsHint": "Créez votre prochain culte ou réunion depuis le module Événements.",

  "membres.title": "Membres",
  "membres.newMember": "Nouveau membre",
  "membres.columnMember": "Membre",
  "membres.columnFamily": "Famille",
  "membres.columnStatus": "Statut",
  "membres.searchPlaceholder": "Rechercher un membre…",
  "membres.emptyTitle": "Aucun membre",
  "membres.emptyDescription": "Ajoutez votre premier membre pour commencer.",
} as const;

type DictionaryKey = keyof typeof fr;
type Dictionary = Record<DictionaryKey, string>;

const en: Dictionary = {
  "nav.pilotage": "Overview",
  "nav.tableauDeBord": "Dashboard",
  "nav.rapports": "Reports",
  "nav.communaute": "Community",
  "nav.membres": "Members",
  "nav.familles": "Families",
  "nav.departements": "Departments",
  "nav.groupes": "Groups & Cells",
  "nav.suiviPastoral": "Pastoral care",
  "nav.checkin": "Kids check-in",
  "nav.operations": "Operations",
  "nav.evenements": "Events",
  "nav.statistiques": "Attendance stats",
  "nav.benevoles": "Volunteers",
  "nav.covoiturage": "Carpooling",
  "nav.communication": "Communication",
  "nav.finances": "Donations & finance",
  "nav.budgets": "Budgets",
  "nav.systeme": "System",
  "nav.parametres": "Settings",

  "common.search": "Search a member, a donation, an event…",
  "common.notifications": "Notifications",
  "common.settings": "Settings",
  "common.signOut": "Sign out",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.add": "Add",
  "common.member": "member",
  "common.members": "members",

  "dashboard.title": "Dashboard",
  "dashboard.overviewOf": "Overview of",
  "dashboard.activeMembers": "Active members",
  "dashboard.donationsThisMonth": "Donations this month",
  "dashboard.upcomingEventsCount": "Upcoming events",
  "dashboard.pendingExpenses": "Expenses to approve",
  "dashboard.needsAttention": "Needs your attention",
  "dashboard.upcomingEvents": "Upcoming events",
  "dashboard.noEvents": "No events scheduled",
  "dashboard.noEventsHint": "Create your next service or meeting from the Events module.",

  "membres.title": "Members",
  "membres.newMember": "New member",
  "membres.columnMember": "Member",
  "membres.columnFamily": "Family",
  "membres.columnStatus": "Status",
  "membres.searchPlaceholder": "Search a member…",
  "membres.emptyTitle": "No members",
  "membres.emptyDescription": "Add your first member to get started.",
};

export const dictionaries: Record<Locale, Dictionary> = { fr, en };
export type { DictionaryKey };
