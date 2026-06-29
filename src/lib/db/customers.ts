/**
 * customers.ts
 * All Supabase queries for the `customers` and `khata_entries` tables.
 * No business logic here — only DB reads and writes.
 * Column names match 004_clean_schema.sql exactly.
 */

import { createClient } from './supabase'
import type { Customer, KhataEntry } from '@/lib/types/database'
import type { CustomerFormData } from '@/lib/validations/customer'
import type { KhataFormData } from '@/lib/validations/khata'

/** Fetch all customers for a business, newest first */
export async function getCustomers(businessId: string): Promise<Customer[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  return (data as Customer[]) ?? []
}

/** Fetch a single customer by primary key */
export async function getCustomer(customerId: string): Promise<Customer | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()

  return data as Customer | null
}

/** Count all customers for a business (used for plan limit checks) */
export async function countCustomers(businessId: string): Promise<number> {
  const supabase = createClient()

  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)

  return count ?? 0
}

/** Insert a new customer row from validated form data */
export async function createCustomer(
  businessId: string,
  formData: CustomerFormData
) {
  const supabase = createClient()

  return supabase.from('customers').insert({
    business_id: businessId,
    name:        formData.name,
    phone:       formData.phone || null,
    address:     formData.address || null,
    balance:     0,
  })
}

/** Update editable fields on a customer */
export async function updateCustomer(
  customerId: string,
  formData: Partial<CustomerFormData>
) {
  const supabase = createClient()

  return supabase.from('customers').update({
    name:    formData.name,
    phone:   formData.phone || null,
    address: formData.address || null,
  }).eq('id', customerId)
}

/**
 * Adjust a customer's running balance.
 * Positive delta = customer owes more (credit given).
 * Negative delta = customer paid back (balance reduced).
 */
export async function adjustCustomerBalance(
  customerId: string,
  delta: number
) {
  const supabase = createClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('balance')
    .eq('id', customerId)
    .single()

  if (!customer) return null

  const newBalance = Number(customer.balance) + delta

  return supabase
    .from('customers')
    .update({ balance: newBalance })
    .eq('id', customerId)
}

/** Fetch khata entries for a customer, newest first */
export async function getKhataEntries(customerId: string): Promise<KhataEntry[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('khata_entries')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  return (data as KhataEntry[]) ?? []
}

/** Insert a khata entry from validated form data */
export async function createKhataEntry(
  businessId: string,
  formData: KhataFormData
) {
  const supabase = createClient()

  return supabase.from('khata_entries').insert({
    business_id:    businessId,
    customer_id:    formData.customerId,
    amount:         formData.amount,
    type:           formData.type,
    transaction_id: formData.transactionId ?? null,
  })
}
