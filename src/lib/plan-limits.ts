import type { Plan } from '@/types/database'

export type LimitKey = 'staff' | 'customers' | 'products' | 'suppliers' | 'sms_per_month' | 'branches' | 'users'
export type ReportType = 'basic' | 'pdf' | 'excel' | 'ird'

export const PLAN_LIMITS: Record<Plan, Record<LimitKey, number> & { reports: ReportType[] }> = {
  sano: {
    staff: 2,
    customers: 50,
    products: 100,
    suppliers: 20,
    sms_per_month: 20,
    branches: 1,
    users: 1,
    reports: ['basic'],
  },
  madhyam: {
    staff: 10,
    customers: 300,
    products: 500,
    suppliers: 100,
    sms_per_month: 100,
    branches: 1,
    users: 3,
    reports: ['basic', 'pdf'],
  },
  thulo: {
    staff: Infinity,
    customers: Infinity,
    products: Infinity,
    suppliers: Infinity,
    sms_per_month: Infinity,
    branches: 5,
    users: 10,
    reports: ['basic', 'pdf', 'excel', 'ird'],
  },
}

export function getPlanLimit(plan: Plan, limitKey: LimitKey): number {
  return PLAN_LIMITS[plan][limitKey]
}

export function canUseReport(plan: Plan, reportType: ReportType): boolean {
  return PLAN_LIMITS[plan].reports.includes(reportType)
}
