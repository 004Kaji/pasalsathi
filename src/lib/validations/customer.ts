/**
 * customer.ts
 * Zod schema for creating or editing a customer record.
 * Mirrors the `customers` table columns that a user can write.
 */

import { z } from 'zod'

/** Schema for the add-customer / edit-customer form */
const customerSchema = z.object({
  /** Customer full name */
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be under 100 characters')
    .transform((value) => value.trim()),

  /** Contact phone — optional, must be 10 digits if provided */
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit phone number')
    .optional()
    .or(z.literal('')),

  /** Home or business address — optional */
  address: z
    .string()
    .max(200, 'Address must be under 200 characters')
    .optional()
    .or(z.literal('')),
})

export default customerSchema

/** Inferred TypeScript type for the validated form data */
export type CustomerFormData = z.infer<typeof customerSchema>
