/**
 * offline-queue.ts
 * IndexedDB wrapper for queuing POS sales when the device has no internet.
 * Pending sales are replayed automatically when the `online` event fires.
 */

import type { CartItem } from '@/lib/types/app'
import type { Customer, PaymentMethod } from '@/lib/types/database'

const DB_NAME    = 'pasalsathi_offline'
const DB_VERSION = 1
const STORE      = 'pending_sales'

/** A full sale record serialized to IndexedDB while offline */
export interface PendingSale {
  id:               string          // crypto.randomUUID()
  bizId:            string
  total:            number
  itemSummary:      string          // "Rice x2, Daal x1"
  items:            CartItem[]
  paymentMethod:    PaymentMethod
  discountPercent:  number
  selectedCustomer: Customer | null
  customerName:     string
  createdAt:        string          // ISO timestamp
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

/** Add a pending sale to the queue */
export async function queueSale(sale: PendingSale): Promise<void> {
  const db  = await openDB()
  const tx  = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(sale)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

/** Retrieve all queued sales (FIFO order) */
export async function getPendingSales(): Promise<PendingSale[]> {
  const db  = await openDB()
  const tx  = db.transaction(STORE, 'readonly')
  const req = tx.objectStore(STORE).getAll()
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve((req.result as PendingSale[]).sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt)
    ))
    req.onerror   = () => reject(req.error)
  })
}

/** Remove a successfully synced sale from the queue */
export async function removePendingSale(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(id)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

/** Count how many sales are waiting to sync */
export async function countPendingSales(): Promise<number> {
  const db  = await openDB()
  const tx  = db.transaction(STORE, 'readonly')
  const req = tx.objectStore(STORE).count()
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}
