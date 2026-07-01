import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/blog/posts'
import { Store } from 'lucide-react'

const CATEGORIES = ['All', 'Khata Management', 'Tax & Compliance', 'Point of Sale', 'Inventory', 'Payments', 'Accounting', 'Invoicing', 'HR & Payroll', 'Business Growth']

export const metadata = {
  title: 'Blog — PasalSathi',
  description: 'Practical guides for Nepal small business owners: digital khata, VAT, payroll, inventory, and digital payments.',
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const activeCategory = category ?? 'All'
  const posts = activeCategory === 'All'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === activeCategory)

  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="min-h-screen" style={{ background: '#F5F0E8', color: '#1C1917' }}>
      {/* Nav */}
      <nav className="border-b border-[#D5CFC6] bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#C84B2F] rounded-lg flex items-center justify-center">
              <Store size={14} className="text-white" />
            </div>
            <span className="font-bold text-[#1C1917]">PasalSathi</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[#6B6560] hover:text-[#1C1917] transition-colors">Sign in</Link>
            <Link href="/signup" className="text-sm bg-[#C84B2F] text-white px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity">Start free</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-[#C84B2F]/10 text-[#C84B2F] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-4">
            PasalSathi Blog
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1C1917] mb-4">
            Guides for Nepal<br />Business Owners
          </h1>
          <p className="text-[#6B6560] text-lg max-w-2xl mx-auto">
            Practical advice on digital khata, VAT compliance, inventory, payroll, and growing your Nepal business.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={cat === 'All' ? '/blog' : `/blog?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#C84B2F] text-white'
                  : 'bg-white border border-[#D5CFC6] text-[#6B6560] hover:text-[#1C1917]'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Post Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white border border-[#D5CFC6] rounded-2xl p-6 hover:shadow-md transition-all hover:border-[#C84B2F]/30 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#C84B2F] bg-[#C84B2F]/10 px-2.5 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="text-xs text-[#9B948E]">{post.readMin} min read</span>
              </div>
              <h2 className="font-bold text-[#1C1917] text-lg leading-snug mb-3 group-hover:text-[#C84B2F] transition-colors flex-1">
                {post.title}
              </h2>
              <p className="text-[#6B6560] text-sm leading-relaxed line-clamp-3 mb-4">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-[#EDE8DF]">
                <span className="text-xs text-[#9B948E]">{new Date(post.date).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <span className="text-sm font-semibold text-[#C84B2F] group-hover:translate-x-1 transition-transform inline-block">Read →</span>
              </div>
            </Link>
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-20 text-[#6B6560]">
            No posts in this category yet.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D5CFC6] py-10 px-6 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#C84B2F] rounded-lg flex items-center justify-center">
              <Store size={14} className="text-white" />
            </div>
            <span className="font-bold text-[#1C1917]">PasalSathi</span>
          </Link>
          <p className="text-[#6B6560] text-sm">© 2082 PasalSathi. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-[#6B6560]">
            <Link href="/" className="hover:text-[#1C1917] transition-colors">Home</Link>
            <Link href="/signup" className="hover:text-[#1C1917] transition-colors">Sign up</Link>
            <Link href="/privacy" className="hover:text-[#1C1917] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
