const SHELL_CACHE = 'ps-shell-v2'
const ASSET_CACHE = 'ps-assets-v2'

const SHELL = ['/', '/home', '/sell', '/khata', '/products', '/settings']

// Install: pre-cache app shell pages
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(async cache => {
      for (const url of SHELL) {
        try { await cache.add(url) } catch (_) {}
      }
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Skip non-local requests (Supabase, analytics, etc.)
  if (url.hostname !== self.location.hostname) return

  // Skip API routes — always fetch fresh
  if (url.pathname.startsWith('/api/')) return

  // _next/static assets are content-hashed → cache-first (safe to cache forever)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(ASSET_CACHE).then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached
        const fresh = await fetch(request)
        if (fresh.ok) cache.put(request, fresh.clone())
        return fresh
      })
    )
    return
  }

  // Navigation + other assets: network-first, fall back to cache
  e.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok && (request.mode === 'navigate' || url.pathname.match(/\.(js|css|png|svg|ico|webmanifest)$/))) {
          caches.open(SHELL_CACHE).then(c => c.put(request, res.clone()))
        }
        return res
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        if (request.mode === 'navigate') {
          const fallback = await caches.match('/home')
          if (fallback) return fallback
        }
        return new Response('Offline', { status: 503 })
      })
  )
})
