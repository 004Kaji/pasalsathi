import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/', '/home', '/sell', '/khata', '/products', '/staff', '/reports', '/settings', '/supplier', '/hisab'],
      },
    ],
    sitemap: 'https://pasalsathi.net/sitemap.xml',
  }
}
