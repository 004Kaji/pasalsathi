/**
 * plan-limits.ts
 * Feature limit stubs.
 * The simplified schema has no plan tiers, so all limits are unlimited.
 * Keeping the function signatures so existing call sites compile without changes.
 */

export type LimitKey = 'staff' | 'customers' | 'products' | 'suppliers' | 'sms_per_month' | 'branches' | 'users'
export type ReportType = 'basic' | 'pdf' | 'excel' | 'ird'

/** Returns the feature limit for a given key — always unlimited in the simplified schema */
export function getPlanLimit(_limitKey: LimitKey): number {
  return Infinity
}

/** Returns true if the given report type can be used — always true in the simplified schema */
export function canUseReport(_reportType: ReportType): boolean {
  return true
}
