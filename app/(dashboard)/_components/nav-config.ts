import {
  Home,
  Users,
  HeartHandshake,
  Building2,
  CalendarDays,
  Wallet,
  HandCoins,
  PiggyBank,
  Settings,
} from "lucide-react";
import type { NavSection } from "@/components/nav/sidebar";

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Pilotage",
    items: [{ label: "Tableau de bord", href: "/tableau-de-bord", icon: Home }],
  },
  {
    label: "Communauté",
    items: [
      { label: "Membres", href: "/membres", icon: Users },
      { label: "Familles", href: "/familles", icon: HeartHandshake },
      { label: "Départements", href: "/departements", icon: Building2 },
    ],
  },
  {
    label: "Opérations",
    items: [
      { label: "Événements", href: "/evenements", icon: CalendarDays },
      { label: "Finances", href: "/finances", icon: Wallet },
      { label: "Dons", href: "/dons", icon: HandCoins },
      { label: "Budgets", href: "/budgets", icon: PiggyBank },
    ],
  },
];

export const SETTINGS_NAV_ITEM = {
  label: "Paramètres",
  href: "/parametres/organisation",
  icon: Settings,
};
