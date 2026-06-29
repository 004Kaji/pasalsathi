/**
 * transactions.ts
 * All Supabase queries for the `transactions` table.
 * No business logic here — only DB reads and writes.
 * Column names match 004_clean_schema.sql exactly.
 */

import { createClient } from './supabase'
import type { Transaction, TransactionType } from '@/lib/types/database'
import type { TransactionFormData } from '@/lib/validations/transaction'

/** Options for filtering the transaction list */
interface GetTransactionsOptions {
  /** Only return transactions from this date onward (ISO date string) */
  from?: string

  /** Only return transactions up to this date (ISO date string) */
  to?: string

  /** Filter by direction: income or expense */
  type?: TransactionType
}

/** Fetch transactions for a business, newest first, with optional filters */
export async function getTransactions(
  businessId: string,
  options: GetTransactionsOptions = {}
): Promise<Transaction[]> {
  const supabase = createClient()

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (options.from) {
    query = query.gte('created_at', options.from)
  }

  if (options.to) {
    query = query.lte('created_at', options.to)
  }

  if (options.type) {
    query = query.eq('type', options.type)
  }

  const { data } = await query

  return (data as Transaction[]) ?? []
}

/** Fetch a single transaction by primary key */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  return data as Transaction | null
}

/** Insert a new transaction row from validated form data */
export async function createTransaction(
  businessId: string,
  formData: TransactionFormData
) {
  const supabase = createClient()

  return supabase.from('transactions').insert({
    business_id:    businessId,
    type:           formData.type,
    amount:         formData.amount,
    item_name:      formData.itemName,
    payment_method: formData.paymentMethod,
    product_id:     formData.productId  ?? null,
    customer_id:    formData.customerId ?? null,
  })
}

/** Update a transaction's editable fields */
export async function updateTransaction(
  transactionId: string,
  formData: Partial<TransactionFormData>
) {
  const supabase = createClient()

  return supabase.from('transactions').update({
    type:           formData.type,
    amount:         formData.amount,
    item_name:      formData.itemName,
    payment_method: formData.paymentMethod,
    product_id:     formData.productId  ?? null,
    customer_id:    formData.customerId ?? null,
  }).eq('id', transactionId)
}

/** Hard-delete a transaction by primary key */
export async function deleteTransaction(transactionId: string) {
  const supabase = createClient()

  return supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
}

/**
 * Fetch today's income and expense totals for the dashboard KPI cards.
 * Filters by the date portion of created_at using a date cast.
 */
export async function getTodayTransactions(businessId: string) {
  const supabase = createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('business_id', businessId)
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())

  return data ?? []
}
