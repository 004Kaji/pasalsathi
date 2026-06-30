import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — PasalSathi',
  description: 'How PasalSathi collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-2xl mx-auto px-5 py-10">

        <Link href="/" className="text-sm text-[#C84B2F] font-semibold mb-8 inline-block">
          ← Back to PasalSathi
        </Link>

        <h1 className="text-3xl font-black text-[#1C1917] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#6B6560] mb-8">Last updated: 30 June 2026</p>

        <div className="space-y-8 text-[#1C1917]">

          <section>
            <h2 className="text-lg font-bold mb-2">1. Who We Are</h2>
            <p className="text-sm text-[#6B6560] leading-relaxed">
              PasalSathi is a business management app for Nepali shopkeepers and small businesses,
              operated by Sanjog Basnet (ABN 49 541 449 108). Our app is available at{' '}
              <a href="https://pasalsathi.net" className="text-[#C84B2F] underline">pasalsathi.net</a>.
              Contact us at{' '}
              <a href="mailto:hello@pasalsathi.net" className="text-[#C84B2F] underline">hello@pasalsathi.net</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">2. Data We Collect</h2>
            <div className="space-y-3 text-sm text-[#6B6560] leading-relaxed">
              <p><strong className="text-[#1C1917]">Account information:</strong> Your name and email address when you sign in with Google.</p>
              <p><strong className="text-[#1C1917]">Business information:</strong> Business name, phone number, address, PAN/VAT number, and business registration number that you enter in the app.</p>
              <p><strong className="text-[#1C1917]">Transaction data:</strong> Sales records, payment amounts, payment methods, and expense records you create in POS.</p>
              <p><strong className="text-[#1C1917]">Customer data:</strong> Names and credit balances of customers you add to Khata.</p>
              <p><strong className="text-[#1C1917]">Product data:</strong> Product names, prices, and stock quantities you add to inventory.</p>
              <p><strong className="text-[#1C1917]">Device and usage data:</strong> IP address, device type, browser type, and app usage patterns collected automatically by our hosting provider.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside text-sm text-[#6B6560] leading-relaxed space-y-1.5">
              <li>To provide POS, Khata, inventory, and reporting features</li>
              <li>To authenticate your account securely</li>
              <li>To generate sales receipts and reports for your business</li>
              <li>To improve app performance and fix bugs</li>
              <li>To send important service notifications (no marketing without consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">4. Third Parties We Share Data With</h2>
            <div className="space-y-3 text-sm text-[#6B6560] leading-relaxed">
              <p>
                <strong className="text-[#1C1917]">Supabase (supabase.com):</strong> Our database and authentication provider.
                Your data is stored on Supabase servers. See their{' '}
                <a href="https://supabase.com/privacy" className="text-[#C84B2F] underline" target="_blank" rel="noopener noreferrer">privacy policy</a>.
              </p>
              <p>
                <strong className="text-[#1C1917]">Vercel (vercel.com):</strong> Our hosting provider.
                Handles web traffic and may log IP addresses. See their{' '}
                <a href="https://vercel.com/legal/privacy-policy" className="text-[#C84B2F] underline" target="_blank" rel="noopener noreferrer">privacy policy</a>.
              </p>
              <p>
                <strong className="text-[#1C1917]">Google (google.com):</strong> Used for sign-in (OAuth).
                We access your name and email only. We do not access your Google Drive, contacts, or other Google data. See{' '}
                <a href="https://policies.google.com/privacy" className="text-[#C84B2F] underline" target="_blank" rel="noopener noreferrer">Google&apos;s privacy policy</a>.
              </p>
              <p>We do <strong className="text-[#1C1917]">not</strong> sell your data to any third party.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">5. Data Retention</h2>
            <p className="text-sm text-[#6B6560] leading-relaxed">
              We retain your data for as long as your account is active. If you delete your account,
              all your business data, transactions, customers, and products are permanently deleted
              within 24 hours. Backups may retain data for up to 30 days after deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">6. Your Rights</h2>
            <ul className="list-disc list-inside text-sm text-[#6B6560] leading-relaxed space-y-1.5">
              <li><strong className="text-[#1C1917]">Access:</strong> Request a copy of your data via the Export feature in Settings → Data.</li>
              <li><strong className="text-[#1C1917]">Deletion:</strong> Delete your account and all data permanently via Settings → Account → Delete Account.</li>
              <li><strong className="text-[#1C1917]">Correction:</strong> Update your business details at any time in Settings → Business.</li>
              <li><strong className="text-[#1C1917]">Portability:</strong> Export all transactions as CSV from Settings → Data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">7. Security</h2>
            <p className="text-sm text-[#6B6560] leading-relaxed">
              All data is transmitted over HTTPS (TLS 1.3). Passwords are never stored — we use
              Google OAuth only. Database access is protected by Supabase Row Level Security (RLS)
              so each user can only access their own business data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">8. Children&apos;s Privacy</h2>
            <p className="text-sm text-[#6B6560] leading-relaxed">
              PasalSathi is intended for adults (18+) running a business. We do not knowingly
              collect data from anyone under 18. If you believe a minor has created an account,
              contact us to remove it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">9. Changes to This Policy</h2>
            <p className="text-sm text-[#6B6560] leading-relaxed">
              We may update this policy as we add new features. We will notify you of significant
              changes via email or an in-app notice. Continued use of PasalSathi after changes
              means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">10. Contact</h2>
            <p className="text-sm text-[#6B6560] leading-relaxed">
              Questions about this policy? Email us at{' '}
              <a href="mailto:hello@pasalsathi.net" className="text-[#C84B2F] underline">hello@pasalsathi.net</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-[#D5CFC6]">
          <Link href="/" className="text-sm text-[#C84B2F] font-semibold">← Back to PasalSathi</Link>
        </div>
      </div>
    </div>
  )
}
