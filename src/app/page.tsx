import type { Metadata } from 'next'
import LandingClient from '@/components/landing/landing-client'

export const metadata: Metadata = {
  title: 'PasalSathi — POS, Khata & Inventory App for Nepali Shops',
  description:
    'Digital khata book, POS billing, inventory and staff management for Nepali kirana shops, hardware stores and pharmacies. Works offline, sends SMS reminders. Free 30-day trial.',
  alternates: { canonical: 'https://pasalsathi.net' },
  openGraph: {
    title: 'PasalSathi — POS, Khata & Inventory App for Nepali Shops',
    description:
      'Digital khata book, POS billing, inventory and staff management for Nepali businesses. Works offline. Free 30-day trial.',
    url: 'https://pasalsathi.net',
    siteName: 'PasalSathi',
    locale: 'en_US',
    type: 'website',
    images: [{ url: 'https://pasalsathi.net/pwa-icon/512', width: 512, height: 512, alt: 'PasalSathi' }],
  },
  twitter: {
    card: 'summary',
    title: 'PasalSathi — POS, Khata & Inventory App for Nepali Shops',
    description: 'Digital khata, POS billing and inventory for Nepali shops. Free 30-day trial.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PasalSathi',
  url: 'https://pasalsathi.net',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, Android, iOS',
  description:
    'POS, digital khata, inventory and staff management for Nepali small businesses.',
  offers: [
    { '@type': 'Offer', name: 'सानो', price: '499', priceCurrency: 'NPR' },
    { '@type': 'Offer', name: 'मध्यम', price: '1199', priceCurrency: 'NPR' },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient />
    </>
  )
}
