import { z } from "zod";

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  // Slug is generated on the backend
});

export type CreateOrganizationDto = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationSchema>;

export const CreateInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type CreateInvitationDto = z.infer<typeof CreateInvitationSchema>;
