/**
 * khata.ts
 * Zod schema for creating a khata ledger entry.
 * Mirrors the `khata_entries` table columns that a user can write.
 *
 * Khata entries are created in two situations:
 *   - 'credit'  : a sale was made on credit (customer owes the business)
 *   - 'payment' : the customer paid back some or all of what they owe
 */

import { z } from 'zod'

/** Valid khata entry types — must match DB check constraint */
const KHATA_ENTRY_TYPES = ['credit', 'payment'] as const

/** Schema for the add-khata-entry form */
const khataSchema = z.object({
  /** The customer this entry belongs to */
  customerId: z
    .string()
    .uuid('Invalid customer ID'),

  /** Amount in Nepalese Rupees — must be greater than zero */
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),

  /** credit = new debt, payment = customer paying back */
  type: z.enum(KHATA_ENTRY_TYPES, {
    error: 'Select credit or payment',
  }),

  /** Optional: the sale transaction that triggered this credit entry */
  transactionId: z.string().uuid().optional(),
})

export default khataSchema

/** Inferred TypeScript type for the validated form data */
export type KhataFormData = z.infer<typeof khataSchema>
