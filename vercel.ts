import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  crons: [
    { path: "/api/cron/budget-alerts", schedule: "0 6 * * *" },
    { path: "/api/cron/send-communications", schedule: "0 7 * * *" },
  ],
};
