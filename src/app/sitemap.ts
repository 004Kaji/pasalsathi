import type { MetadataRoute } from 'next'
import { BLOG_POSTS } from '@/lib/blog/posts'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://pasalsathi.net'

  const blogPosts: MetadataRoute.Sitemap = BLOG_POSTS.map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    { url: base,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/signup`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/login`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...blogPosts,
  ]
}
