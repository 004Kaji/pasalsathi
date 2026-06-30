/**
 * database.ts
 * TypeScript types that mirror the Supabase database schema exactly.
 * One interface per table. No extra fields.
 * Source of truth: supabase/migrations/004_clean_schema.sql
 */

// ------------------------------------------------------------------
// Scalar union types — map to the check constraints in the DB
// ------------------------------------------------------------------

/** Valid units for a product */
export type ProductUnit = 'piece' | 'kg' | 'litre' | 'box' | 'dozen'

/** Whether an item is a physical product, a service, or a menu/food item */
export type ProductType = 'product' | 'service' | 'menu'

/** Direction of a transaction */
export type TransactionType = 'income' | 'expense'

/** How the customer paid */
export type PaymentMethod = 'cash' | 'khata' | 'esewa' | 'khalti' | 'fonepay'

/** Direction of a khata ledger entry */
export type KhataEntryType = 'credit' | 'payment'


// ------------------------------------------------------------------
// Table interfaces — column names and types match the DB exactly
// ------------------------------------------------------------------

/**
 * TABLE: businesses
 * One row per merchant. owner_id is the Supabase auth user ID.
 */
export interface Business {
  id: string
  owner_id: string
  name: string
  phone: string | null
  address: string | null
  pan_number: string | null
  vat_number: string | null
  business_reg_number: string | null
  created_at: string
}

/**
 * TABLE: products
 * Items and services the business sells.
 * stock is only meaningful when track_stock = true.
 */
export interface Product {
  id: string
  business_id: string
  name: string
  price: number
  unit: ProductUnit
  type: ProductType
  stock: number
  track_stock: boolean
  category: string | null
  created_at: string
}

/**
 * TABLE: customers
 * People who buy from the business.
 * balance > 0 means the customer still owes money.
 * balance < 0 means the customer has overpaid.
 */
export interface Customer {
  id: string
  business_id: string
  name: string
  phone: string | null
  address: string | null
  balance: number
  created_at: string
}

/**
 * TABLE: transactions
 * Every income (sale) or expense recorded by the business.
 * product_id and customer_id are optional foreign keys.
 */
export interface Transaction {
  id: string
  business_id: string
  type: TransactionType
  amount: number
  item_name: string
  product_id: string | null
  payment_method: PaymentMethod
  customer_id: string | null
  created_at: string
}

/**
 * TABLE: staff
 * POS-only staff members with PIN login. Not Supabase auth users.
 */
export interface Staff {
  id: string
  business_id: string
  name: string
  pin_hash: string
  active: boolean
  created_at: string
}

/**
 * TABLE: khata_entries
 * Ledger entries for customer credit accounts.
 * type = 'credit'  → money lent to the customer
 * type = 'payment' → customer paid back
 * transaction_id links back to the sale that created the credit.
 */
export interface KhataEntry {
  id: string
  business_id: string
  customer_id: string
  amount: number
  type: KhataEntryType
  transaction_id: string | null
  created_at: string
}
