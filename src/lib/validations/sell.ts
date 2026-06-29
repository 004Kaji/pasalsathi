/**
 * sell.ts
 * Validation helpers for the POS sell flow.
 * These are UI validations — not Zod schemas — because
 * they operate on the cart state, not on a form submission.
 */

import type { CartItem } from '@/lib/types/app'
import type { Customer } from '@/lib/types/database'

/**
 * Returns an error message if the cart cannot be checked out.
 * Returns null if the cart is valid and ready for payment.
 */
export function validateCart(
  cart: CartItem[],
  paymentMethod: string,
  selectedCustomer: Customer | null
): string | null {
  if (cart.length === 0) {
    return 'Add at least one item to sell'
  }

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  )

  if (totalAmount <= 0) {
    return 'Total must be greater than 0'
  }

  const isKhataPayment = paymentMethod === 'khata'
  const hasCustomerSelected = selectedCustomer !== null

  if (isKhataPayment && !hasCustomerSelected) {
    return 'Select a customer for khata (credit) sale'
  }

  return null
}

/**
 * Returns an error string if the discount percentage is out of range.
 * Returns null if the discount is valid (or empty).
 */
export function validateDiscount(value: string): string | null {
  if (!value) return null

  const discountAmount = parseFloat(value)
  const isOutOfRange = isNaN(discountAmount) || discountAmount < 0 || discountAmount > 100

  if (isOutOfRange) {
    return 'Discount must be between 0 and 100'
  }

  return null
}
