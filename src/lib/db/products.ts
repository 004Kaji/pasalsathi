/**
 * products.ts
 * All Supabase queries for the `products` table.
 * No business logic here — only DB reads and writes.
 * Column names match 004_clean_schema.sql exactly.
 */

import { createClient } from './supabase'
import type { Product } from '@/lib/types/database'
import type { ProductFormData } from '@/lib/validations/product'

/** Fetch all products for a business, ordered alphabetically by name */
export async function getProducts(businessId: string): Promise<Product[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .order('name')

  return (data as Product[]) ?? []
}

/** Fetch a single product by its primary key */
export async function getProduct(productId: string): Promise<Product | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  return data as Product | null
}

/** Count all products for a business (used for plan limit enforcement) */
export async function countProducts(businessId: string): Promise<number> {
  const supabase = createClient()

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)

  return count ?? 0
}

/** Insert a new product row from validated form data */
export async function createProduct(
  businessId: string,
  formData: ProductFormData
) {
  const supabase = createClient()

  return supabase.from('products').insert({
    business_id: businessId,
    name:        formData.name,
    price:       formData.price,
    unit:        formData.unit,
    type:        formData.type,
    stock:       formData.stock,
    track_stock: formData.trackStock,
  })
}

/** Update editable fields on a product */
export async function updateProduct(
  productId: string,
  formData: Partial<ProductFormData>
) {
  const supabase = createClient()

  return supabase.from('products').update({
    name:        formData.name,
    price:       formData.price,
    unit:        formData.unit,
    type:        formData.type,
    stock:       formData.stock,
    track_stock: formData.trackStock,
  }).eq('id', productId)
}

/** Hard-delete a product. Cascade will nullify any transaction references. */
export async function deleteProduct(productId: string) {
  const supabase = createClient()

  return supabase
    .from('products')
    .delete()
    .eq('id', productId)
}

/**
 * Decrement a product's stock by the sold quantity.
 * Only runs when track_stock is true — callers must check before calling.
 */
export async function decrementStock(
  productId: string,
  quantitySold: number
) {
  const supabase = createClient()

  // Read current stock first, then write the decremented value.
  // Supabase does not support server-side arithmetic in the JS client,
  // so we do a read-then-write. Race conditions are acceptable for
  // a single-merchant POS with low concurrent usage.
  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single()

  if (!product) return null

  const newStock = Math.max(0, Number(product.stock) - quantitySold)

  return supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId)
}
