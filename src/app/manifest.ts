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
    theme_color: '#C84B2F',
    background_color: '#F5F0E8',
    icons: [
      {
        src: '/pwa-icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
