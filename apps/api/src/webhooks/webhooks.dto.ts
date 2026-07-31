import { z } from 'zod';

export const WEBHOOK_EVENTS = [
  'session.created',
  'session.revoked',
  'session.expired',
  'secret.revealed',
  'approval.approved',
  'approval.rejected',
  'integration.connected',
  'integration.disconnected',
  'api_key.created',
  'api_key.revoked',
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

export const CreateWebhookSchema = z.object({
  url: z.string().url('Must be a valid HTTPS URL').refine((u) => u.startsWith('https://'), {
    message: 'Webhook URL must use HTTPS',
  }),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, 'Select at least one event'),
  description: z.string().max(200).optional(),
});
export type CreateWebhookDto = z.infer<typeof CreateWebhookSchema>;
