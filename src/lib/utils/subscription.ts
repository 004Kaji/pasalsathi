/**
 * subscription.ts
 * Subscription state logic.
 * The simplified Business schema has no subscription/plan fields,
 * so every business is considered active. This stub keeps the
 * SubscriptionBanner component working without changes.
 */

import type { Business } from '@/lib/types/database'

export type SubscriptionState =
  | { status: 'trial'; daysLeft: number }
  | { status: 'trial_expired' }
  | { status: 'active' }
  | { status: 'grace'; daysLeft: number }
  | { status: 'expired' }

/**
 * Returns the subscription state for a business.
 * Simplified schema has no billing fields — always active.
 */
export function getSubscriptionStatus(_business: Business): SubscriptionState {
  return { status: 'active' }
}

/**
 * Returns true when the subscription state should block app access.
 * Always false in the simplified schema.
 */
export function isAccessBlocked(_state: SubscriptionState): boolean {
  return false
}
