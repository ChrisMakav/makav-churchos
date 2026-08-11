import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  crons: [{ path: "/api/cron/budget-alerts", schedule: "0 6 * * *" }],
};
