import {
  Home,
  Users,
  HeartHandshake,
  Building2,
  CircleUserRound,
  HeartPulse,
  BadgeCheck,
  CalendarDays,
  Wallet,
  PiggyBank,
  Settings,
  BarChart3,
  CalendarClock,
  MessageSquare,
  ClipboardList,
  Car,
} from "lucide-react";
import type { NavSection } from "@/components/nav/sidebar";

export const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: "nav.pilotage",
    items: [
      { labelKey: "nav.tableauDeBord", href: "/tableau-de-bord", icon: Home },
      { labelKey: "nav.rapports", href: "/rapports", icon: BarChart3 },
    ],
  },
  {
    labelKey: "nav.communaute",
    items: [
      { labelKey: "nav.membres", href: "/membres", icon: Users },
      { labelKey: "nav.familles", href: "/familles", icon: HeartHandshake },
      { labelKey: "nav.departements", href: "/departements", icon: Building2 },
      { labelKey: "nav.groupes", href: "/groupes", icon: CircleUserRound },
      { labelKey: "nav.suiviPastoral", href: "/suivi-pastoral", icon: HeartPulse },
      { labelKey: "nav.checkin", href: "/checkin", icon: BadgeCheck },
    ],
  },
  {
    labelKey: "nav.operations",
    items: [
      { labelKey: "nav.evenements", href: "/evenements", icon: CalendarDays },
      { labelKey: "nav.statistiques", href: "/statistiques", icon: ClipboardList },
      { labelKey: "nav.benevoles", href: "/benevoles", icon: CalendarClock },
      { labelKey: "nav.covoiturage", href: "/covoiturage", icon: Car },
      { labelKey: "nav.communication", href: "/communication", icon: MessageSquare },
      { labelKey: "nav.finances", href: "/finances", icon: Wallet },
      { labelKey: "nav.budgets", href: "/budgets", icon: PiggyBank },
    ],
  },
];

export const SETTINGS_NAV_ITEM = {
  labelKey: "nav.parametres" as const,
  href: "/parametres/organisation",
  icon: Settings,
};
