/**
 * product.ts
 * Zod schema for creating or editing a product / service.
 * Mirrors the `products` table columns that a user can write.
 */

import { z } from 'zod'

/** All valid units — must match the DB comment in 004_clean_schema.sql */
const PRODUCT_UNITS = ['piece', 'kg', 'litre', 'box', 'dozen'] as const

/** All valid types — must match the DB comment in 004_clean_schema.sql */
const PRODUCT_TYPES = ['product', 'service'] as const

/** Schema for the add-product / edit-product form */
const productSchema = z.object({
  /** Product or service display name */
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(120, 'Name must be under 120 characters')
    .transform((value) => value.trim()),

  /** Selling price — must be a positive number */
  price: z
    .number({ error: 'Price must be a number' })
    .min(0, 'Price cannot be negative'),

  /** Unit of measurement */
  unit: z.enum(PRODUCT_UNITS, {
    error: 'Select a valid unit',
  }),

  /** Product (physical) or service (no stock) */
  type: z.enum(PRODUCT_TYPES, {
    error: 'Select product or service',
  }),

  /** Opening stock — only meaningful when track_stock is true */
  stock: z
    .number({ error: 'Stock must be a number' })
    .min(0, 'Stock cannot be negative'),

  /** Whether to deduct stock on each sale */
  trackStock: z.boolean(),
})

export default productSchema

/** Inferred TypeScript type for the validated form data */
export type ProductFormData = z.infer<typeof productSchema>
