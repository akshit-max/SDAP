import { z } from 'zod';

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100, 'Name must be 100 chars or fewer'),
  expiresAt: z.coerce.date().optional(),
});
export type CreateApiKeyDto = z.infer<typeof CreateApiKeySchema>;
