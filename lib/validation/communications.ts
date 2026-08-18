import { z } from "zod";

export const COMMUNICATION_CHANNELS = ["app", "email", "sms"] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  app: "Notification app",
  email: "Email",
  sms: "SMS",
};

// Seul "app" est branché en P1 (voir 0019_communication.sql) — email/sms
// restent visibles dans l'UI mais non sélectionnables tant qu'aucun
// fournisseur n'est provisionné (Resend pour l'email ; pas de fournisseur SMS
// natif au Marketplace Vercel au moment de l'écriture).
export const ACTIVE_CHANNELS: readonly CommunicationChannel[] = ["app"];

export const SEGMENT_TYPES = ["department", "site", "all"] as const;

export const segmentSchema = z.object({
  type: z.enum(SEGMENT_TYPES),
  id: z.string().uuid().nullable(),
  label: z.string().min(1),
});

export type SegmentInput = z.infer<typeof segmentSchema>;

export const sendCommunicationSchema = z.object({
  channel: z.enum(COMMUNICATION_CHANNELS),
  title: z.string().trim().min(1, "Le titre est requis").max(150),
  body: z.string().trim().min(1, "Le message est requis").max(2000),
  segments: z.array(segmentSchema).min(1, "Sélectionnez au moins un segment"),
  scheduledAt: z.string().trim().min(1).nullable().optional(),
});

export type SendCommunicationValues = z.infer<typeof sendCommunicationSchema>;
