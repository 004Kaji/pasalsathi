export type Plan = 'sano' | 'madhyam' | 'thulo'
export type BillingCycle = 'monthly' | 'annual'
export type SubscriptionStatus = 'trial' | 'active' | 'grace' | 'expired'
export type TransactionType = 'in' | 'out'
export type TransactionCategory = 'sales' | 'purchase' | 'expense' | 'salary' | 'other'
export type PaymentMethod = 'cash' | 'bank' | 'esewa' | 'khalti'
export type KhataEntryType = 'credit' | 'payment'
export type StockMovementType = 'in' | 'out'
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'holiday'
export type SalaryStatus = 'pending' | 'paid'
export type BusinessUserRole = 'owner' | 'manager' | 'staff'
export type BusinessType = 'kirana' | 'hardware' | 'pharmacy' | 'clothing' | 'wholesale' | 'other'

export interface Business {
  id: string
  owner_id: string
  name: string
  type: BusinessType | null
  address: string | null
  phone: string | null
  pan_number: string | null
  logo_url: string | null
  plan: Plan
  billing_cycle: BillingCycle
  trial_ends_at: string
  subscription_status: SubscriptionStatus
  subscription_started_at: string | null
  subscription_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  business_id: string
  name: string
  address: string | null
  phone: string | null
  is_main: boolean
  created_at: string
}

export interface Transaction {
  id: string
  business_id: string
  branch_id: string | null
  type: TransactionType
  amount: number
  category: TransactionCategory
  description: string | null
  payment_method: PaymentMethod
  transaction_date: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  business_id: string
  name: string
  phone: string | null
  address: string | null
  notes: string | null
  total_credit: number
  total_paid: number
  created_at: string
  updated_at: string
}

export interface KhataEntry {
  id: string
  business_id: string
  customer_id: string
  type: KhataEntryType
  amount: number
  description: string | null
  entry_date: string
  sms_sent: boolean
  sms_sent_at: string | null
  created_by: string | null
  created_at: string
}

export interface Product {
  id: string
  business_id: string
  name: string
  unit: string
  buying_price: number
  selling_price: number
  current_stock: number
  low_stock_threshold: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  business_id: string
  product_id: string
  type: StockMovementType
  quantity: number
  unit_price: number | null
  total_price: number | null
  supplier_name: string | null
  notes: string | null
  movement_date: string
  created_by: string | null
  created_at: string
}

export interface Staff {
  id: string
  business_id: string
  name: string
  role: string | null
  phone: string | null
  monthly_salary: number
  join_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  business_id: string
  staff_id: string
  attendance_date: string
  status: AttendanceStatus
  note: string | null
  created_at: string
}

export interface SalaryPayment {
  id: string
  business_id: string
  staff_id: string
  month: number
  year: number
  working_days: number | null
  present_days: number | null
  payable_amount: number
  paid_amount: number | null
  payment_date: string | null
  payment_method: PaymentMethod | null
  status: SalaryStatus
  created_at: string
}

export interface SmsLog {
  id: string
  business_id: string
  phone: string
  message: string
  status: 'sent' | 'failed' | null
  sent_at: string
}

export interface PaymentHistory {
  id: string
  business_id: string
  plan: Plan
  billing_cycle: BillingCycle
  amount: number
  payment_method: PaymentMethod | null
  transaction_id: string | null
  status: 'pending' | 'success' | 'failed'
  paid_at: string | null
  period_start: string | null
  period_end: string | null
  created_at: string
}
