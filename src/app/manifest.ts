import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PasalSathi',
    short_name: 'PasalSathi',
    description: 'Nepali business management — POS, Khata, Inventory',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#ea580c',
    background_color: '#0a0a0a',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
