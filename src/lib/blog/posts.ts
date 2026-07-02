export interface BlogPost {
  slug:     string
  title:    string
  excerpt:  string
  category: string
  date:     string
  readMin:  number
  content:  string
}

import { content as c1  } from './content/digital-khata-book-nepal'
import { content as c2  } from './content/vat-registration-nepal-small-business'
import { content as c3  } from './content/pos-system-nepal-restaurant-shop'
import { content as c4  } from './content/inventory-management-nepal-shop'
import { content as c5  } from './content/esewa-khalti-fonepay-for-business-nepal'
import { content as c6  } from './content/accounting-software-nepal-small-business'
import { content as c7  } from './content/fiscal-year-nepal-business'
import { content as c8  } from './content/send-invoice-whatsapp-nepal'
import { content as c9  } from './content/reduce-udhari-nepal-business'
import { content as c10 } from './content/pan-registration-nepal-business'
import { content as c11 } from './content/payroll-management-nepal-small-business'
import { content as c12 } from './content/going-digital-nepal-small-business-2082'
import { content as c13 } from './content/stock-shrinkage-theft-prevention-nepal'
import { content as c14 } from './content/customer-loyalty-nepal-small-business'
import { content as c15 } from './content/restaurant-management-nepal'

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'digital-khata-book-nepal',
    title: "Digital Khata Book: Why Nepal's Shopkeepers Are Switching from Paper",
    excerpt: "Millions of Nepali businesses still track credit in paper notebooks. Here's why digital khata is safer, faster, and earns you more money back.",
    category: 'Khata Management',
    date: '2026-06-15',
    readMin: 9,
    content: c1,
  },
  {
    slug: 'vat-registration-nepal-small-business',
    title: "VAT Registration in Nepal: Should Your Small Business Register?",
    excerpt: "Nepal's 13% VAT threshold is NPR 50 lakh annual turnover. But voluntary registration has real benefits. Here's everything small business owners need to know.",
    category: 'Tax & Compliance',
    date: '2026-06-10',
    readMin: 10,
    content: c2,
  },
  {
    slug: 'pos-system-nepal-restaurant-shop',
    title: "POS System for Nepal: What Restaurants and Shops Actually Need",
    excerpt: "Most POS systems are built for the West. Here's what a Nepal-specific point-of-sale system must handle: BS dates, Nepali language, eSewa/Khalti, and offline mode.",
    category: 'Point of Sale',
    date: '2026-06-05',
    readMin: 9,
    content: c3,
  },
  {
    slug: 'inventory-management-nepal-shop',
    title: "How to Track Inventory for Your Nepal Shop Without Losing Money",
    excerpt: "Stock shrinkage, expired goods, and stockouts cost Nepal's small businesses thousands per year. A simple digital inventory system pays for itself in weeks.",
    category: 'Inventory',
    date: '2026-05-28',
    readMin: 8,
    content: c4,
  },
  {
    slug: 'esewa-khalti-fonepay-for-business-nepal',
    title: "eSewa vs Khalti vs FonePay: Which Digital Payment is Best for Your Nepal Business?",
    excerpt: "Nepal's digital payment ecosystem has three major players. Here's a practical breakdown for business owners on which to accept, how to set up, and what fees to expect.",
    category: 'Payments',
    date: '2026-05-20',
    readMin: 9,
    content: c5,
  },
  {
    slug: 'accounting-software-nepal-small-business',
    title: "Best Accounting Software for Small Businesses in Nepal (2082 BS)",
    excerpt: "From Tally to cloud apps, Nepal's small businesses have more options than ever. Here's an honest comparison for business owners who don't have an accounting degree.",
    category: 'Accounting',
    date: '2026-05-12',
    readMin: 10,
    content: c6,
  },
  {
    slug: 'fiscal-year-nepal-business',
    title: "Nepal Fiscal Year Guide: What Every Business Owner Must Know",
    excerpt: "Nepal's fiscal year runs Shrawan to Ashad. Missing deadlines means penalties. Here's your complete calendar for taxes, audits, and compliance.",
    category: 'Tax & Compliance',
    date: '2026-05-05',
    readMin: 9,
    content: c7,
  },
  {
    slug: 'send-invoice-whatsapp-nepal',
    title: "How to Send Professional Invoices via WhatsApp in Nepal",
    excerpt: "Email invoices don't work in Nepal. Customers don't check email — they check WhatsApp. Here's how to send professional PDF invoices directly to your customers' phones.",
    category: 'Invoicing',
    date: '2026-04-28',
    readMin: 8,
    content: c8,
  },
  {
    slug: 'reduce-udhari-nepal-business',
    title: "How to Reduce Udhari Losses in Your Nepal Business",
    excerpt: "Udhari (credit) is part of Nepali business culture — you can't refuse it. But you can manage it. These strategies help recover outstanding credit without damaging relationships.",
    category: 'Khata Management',
    date: '2026-04-20',
    readMin: 9,
    content: c9,
  },
  {
    slug: 'pan-registration-nepal-business',
    title: "PAN Registration in Nepal: Step-by-Step Guide for Business Owners",
    excerpt: "A Permanent Account Number (PAN) is mandatory for all Nepal businesses. Here's how to register, what documents you need, and what happens if you don't have one.",
    category: 'Tax & Compliance',
    date: '2026-04-12',
    readMin: 8,
    content: c10,
  },
  {
    slug: 'payroll-management-nepal-small-business',
    title: "Payroll for Small Businesses in Nepal: SSF, TDS, and How to Do It Right",
    excerpt: "Paying your staff in Nepal involves Social Security Fund (SSF) contributions and TDS. Here's a practical guide for small business owners managing their first employees.",
    category: 'HR & Payroll',
    date: '2026-04-05',
    readMin: 10,
    content: c11,
  },
  {
    slug: 'going-digital-nepal-small-business-2082',
    title: "Going Digital in 2082: A Practical Guide for Nepal's Small Business Owners",
    excerpt: "Digital tools are no longer optional for Nepal's competitive small business market. Here's a realistic, low-cost digital transformation plan for a typical pasal.",
    category: 'Business Growth',
    date: '2026-03-28',
    readMin: 9,
    content: c12,
  },
  {
    slug: 'stock-shrinkage-theft-prevention-nepal',
    title: "Preventing Stock Shrinkage and Theft in Nepal Retail Businesses",
    excerpt: "Stock shrinkage costs Nepal retailers 3-8% of inventory value annually. Here's how to identify where stock is disappearing and practical steps to reduce losses.",
    category: 'Inventory',
    date: '2026-03-15',
    readMin: 8,
    content: c13,
  },
  {
    slug: 'customer-loyalty-nepal-small-business',
    title: "Building Customer Loyalty for Your Nepal Business: What Actually Works",
    excerpt: "In Nepal's relationship-driven economy, loyalty isn't built with points programs — it's built with trust, memory, and personal connection. Here's the practical playbook.",
    category: 'Business Growth',
    date: '2026-03-05',
    readMin: 9,
    content: c14,
  },
  {
    slug: 'restaurant-management-nepal',
    title: "Restaurant Management in Nepal: From Order to Closing Count",
    excerpt: "Nepal's restaurant industry is growing fast. Here's how smart owners manage tables, orders, daily cash counts, and staff — without expensive restaurant software.",
    category: 'Point of Sale',
    date: '2026-02-20',
    readMin: 9,
    content: c15,
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug)
}

export function getRecentPosts(n = 3): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n)
}
