/**
 * app.ts
 * Runtime types used in the UI — not tied to DB rows directly.
 * These live here (not in database.ts) because they are UI concerns.
 */

import type { Product, Customer, PaymentMethod } from './database'

/** A single line item sitting in the POS cart before checkout */
export interface CartItem {
  /** Unique key for React — equals product.id for real products, a uuid for quick items */
  id: string

  /** Display label in the cart */
  name: string

  /** Unit label shown next to quantity: piece, kg, litre, etc. */
  unit: string

  /** Linked product from DB — absent for manually typed "quick" items */
  product?: Product

  /** Quantity the customer is buying */
  qty: number

  /** Price per unit at time of sale (may differ from product.price after edits) */
  unitPrice: number

  /** True when the item was typed in manually, not selected from product list */
  isQuick: boolean
}

/** Display metadata for each payment method in the POS checkout UI */
export interface PaymentMethodOption {
  value: PaymentMethod
  label: string
  emoji: string
}

/** Data returned after a successful checkout — used on the success screen */
export interface SaleResult {
  total: number
  subtotalBeforeVat: number
  vatAmount: number
  vatNumber: string
  discountPercent: number
  discountType: 'percent' | 'amount'
  items: CartItem[]
  paymentMethod: PaymentMethod
  customer: Customer | null
  splitMethod?: PaymentMethod
  splitAmount?: number
  offline?: boolean
}
