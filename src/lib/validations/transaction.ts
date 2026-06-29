/**
 * transaction.ts
 * Zod schema for recording an income or expense transaction.
 * Mirrors the `transactions` table columns that a user can write.
 */

import { z } from 'zod'

/** Valid transaction types — must match DB check constraint */
const TRANSACTION_TYPES = ['income', 'expense'] as const

/** Valid payment methods — must match DB check constraint */
const PAYMENT_METHODS = ['cash', 'khata', 'esewa', 'khalti'] as const

/** Schema for the add-transaction form (hisab page) */
const transactionSchema = z.object({
  /** Whether this is money coming in (sale) or going out (expense) */
  type: z.enum(TRANSACTION_TYPES, {
    error: 'Select income or expense',
  }),

  /** Amount in Nepalese Rupees — must be greater than zero */
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),

  /** Short description of what the money was for */
  itemName: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be under 200 characters')
    .transform((value) => value.trim()),

  /** How the payment was made */
  paymentMethod: z.enum(PAYMENT_METHODS, {
    error: 'Select a payment method',
  }),

  /** Optional link to a product in the products table */
  productId: z.string().uuid().optional(),

  /** Optional link to a customer — required when paymentMethod is 'khata' */
  customerId: z.string().uuid().optional(),
})
  .refine(
    (data) => {
      // When paying on khata (credit), a customer must be selected
      const isKhata = data.paymentMethod === 'khata'
      const hasCustomer = Boolean(data.customerId)
      return !isKhata || hasCustomer
    },
    {
      message: 'Select a customer for khata (credit) transactions',
      path: ['customerId'],
    }
  )

export default transactionSchema

/** Inferred TypeScript type for the validated form data */
export type TransactionFormData = z.infer<typeof transactionSchema>
