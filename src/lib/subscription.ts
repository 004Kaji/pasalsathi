import type { Business } from '@/types/database'

export type SubscriptionState =
  | { status: 'trial'; daysLeft: number }
  | { status: 'trial_expired' }
  | { status: 'active' }
  | { status: 'grace'; daysLeft: number }
  | { status: 'expired' }

export function getSubscriptionStatus(business: Business): SubscriptionState {
  const now = new Date()

  if (business.subscription_status === 'trial') {
    const trialEnd = new Date(business.trial_ends_at)
    if (now < trialEnd) {
      return {
        status: 'trial',
        daysLeft: Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000),
      }
    }
    return { status: 'trial_expired' }
  }

  if (business.subscription_status === 'active') {
    if (!business.subscription_ends_at) return { status: 'active' }
    const subEnd = new Date(business.subscription_ends_at)
    if (now < subEnd) return { status: 'active' }
    const graceEnd = new Date(subEnd.getTime() + 3 * 86400000)
    const daysLeft = Math.ceil((graceEnd.getTime() - now.getTime()) / 86400000)
    return { status: 'grace', daysLeft: Math.max(0, daysLeft) }
  }

  if (business.subscription_status === 'grace') {
    return { status: 'grace', daysLeft: 0 }
  }

  return { status: 'expired' }
}

export function isAccessBlocked(state: SubscriptionState): boolean {
  return state.status === 'trial_expired' || state.status === 'expired'
}
