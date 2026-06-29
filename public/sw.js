const CACHE = 'pasalsathi-v1'
const SHELL = ['/home', '/sell', '/khata', '/products', '/settings']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      for (const url of SHELL) {
        try { await cache.add(url) } catch (_) {}
      }
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request } = e

  // Only handle GET — skip API, Supabase, and extension calls
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) return

  e.respondWith(
    fetch(request)
      .then(res => {
        // Cache successful navigation responses
        if (request.mode === 'navigate' && res.ok) {
          caches.open(CACHE).then(c => c.put(request, res.clone()))
        }
        return res
      })
      .catch(() =>
        caches.match(request)
          .then(cached => cached ?? caches.match('/home'))
          .then(fallback => fallback ?? new Response('Offline — open the app when connected', { status: 503 }))
      )
  )
})
