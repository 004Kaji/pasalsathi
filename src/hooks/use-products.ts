'use client'
/**
 * use-products.ts
 * Fetches and caches all products for the current user's business.
 * Exposes a refetch function so product pages can trigger a reload.
 */

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/db/supabase'
import type { Product } from '@/lib/types/database'

interface ProductsState {
  products: Product[]
  businessId: string
  loading: boolean
  refetch: () => void
}

/** Returns all products for the current user's business, sorted by name */
export function useProducts(): ProductsState {
  const [products,   setProducts]   = useState<Product[]>([])
  const [businessId, setBusinessId] = useState('')
  const [loading,    setLoading]    = useState(true)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!business) { setLoading(false); return }

    setBusinessId(business.id)

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', business.id)
      .order('name')

    setProducts((data as Product[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  return { products, businessId, loading, refetch: fetchProducts }
}
