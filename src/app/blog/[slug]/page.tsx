import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BLOG_POSTS, getPost } from '@/lib/blog/posts'
import { Store, ArrowLeft, Clock } from 'lucide-react'

export function generateStaticParams() {
  return BLOG_POSTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: 'Not found' }
  return {
    title: `${post.title} — PasalSathi Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const related = BLOG_POSTS
    .filter(p => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3)

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

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[#6B6560] hover:text-[#C84B2F] mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-[#C84B2F] bg-[#C84B2F]/10 px-2.5 py-1 rounded-full">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#9B948E]">
              <Clock size={12} />
              {post.readMin} min read
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#1C1917] leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-[#6B6560] text-lg leading-relaxed mb-4">{post.excerpt}</p>
          <p className="text-sm text-[#9B948E]">
            {new Date(post.date).toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        {/* Content */}
        <article
          className="prose prose-lg max-w-none blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="mt-16 bg-[#C84B2F] rounded-3xl p-8 text-white text-center">
          <h3 className="text-2xl font-black mb-2">Ready to manage your business better?</h3>
          <p className="text-white/80 mb-6">PasalSathi is free for Nepal small businesses — digital khata, POS, invoicing, and more.</p>
          <Link
            href="/signup"
            className="inline-block bg-white text-[#C84B2F] px-8 py-3 rounded-2xl font-bold hover:bg-[#F5F0E8] transition-colors"
          >
            Start free today →
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-bold text-[#1C1917] mb-6">More in {post.category}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {related.map(r => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group bg-white border border-[#D5CFC6] rounded-2xl p-5 hover:shadow-md transition-all hover:border-[#C84B2F]/30"
                >
                  <h4 className="font-semibold text-[#1C1917] text-sm leading-snug mb-2 group-hover:text-[#C84B2F] transition-colors">
                    {r.title}
                  </h4>
                  <span className="text-xs text-[#9B948E]">{r.readMin} min read</span>
                </Link>
              ))}
            </div>
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
            <Link href="/blog" className="hover:text-[#1C1917] transition-colors">Blog</Link>
            <Link href="/signup" className="hover:text-[#1C1917] transition-colors">Sign up</Link>
            <Link href="/privacy" className="hover:text-[#1C1917] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
