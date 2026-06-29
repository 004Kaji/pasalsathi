/**
 * business.ts
 * Zod schema for creating or updating a business profile.
 * Mirrors the `businesses` table columns that a user can write.
 * (id, owner_id, created_at are set by the DB — not validated here.)
 */

import { z } from 'zod'

/** Schema for the business creation / onboarding form */
const businessSchema = z.object({
  /** Business display name — required, max 120 chars */
  name: z
    .string()
    .min(1, 'Business name is required')
    .max(120, 'Name must be under 120 characters')
    .transform((value) => value.trim()),

  /** Contact phone — optional, must be 10 digits if provided */
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit phone number')
    .optional()
    .or(z.literal('')),

  /** Physical address — optional, max 200 chars */
  address: z
    .string()
    .max(200, 'Address must be under 200 characters')
    .optional()
    .or(z.literal('')),
})

export default businessSchema

/** Inferred TypeScript type for the validated form data */
export type BusinessFormData = z.infer<typeof businessSchema>
