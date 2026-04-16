import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

/* ═══════════════════════════════════════════
   Spike AI — Markdown Blog Engine v3
   Sources:
     1. src/content/blog/*.md  (hand-curated)
     2. blog_drafts table      (AI-generated weekly)
   ═══════════════════════════════════════════ */

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  dateFormatted: string
  readTime: string
  image: string
  featured: boolean
  content: string
  headings: { id: string; text: string; level: number }[]
  wordCount: number
  source?: 'file' | 'draft'
}

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog')

function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const data: Record<string, string> = {}
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':')
    if (idx === -1) return
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    data[key] = val
  })
  return { data, content: match[2].trim() }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function extractHeadings(md: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = []
  md.split('\n').forEach(line => {
    const m = line.match(/^(#{2,3}) (.+)$/)
    if (m) {
      headings.push({ id: slugify(m[2]), text: m[2], level: m[1].length })
    }
  })
  return headings
}

function markdownToHtml(md: string): string {
  const blocks = md.split('\n\n')
  const htmlBlocks: string[] = []

  for (const raw of blocks) {
    const block = raw.trim()
    if (!block) continue

    // Code blocks (```)
    if (block.startsWith('```')) {
      const lines = block.split('\n')
      const code = lines.slice(1, lines[lines.length - 1] === '```' ? -1 : undefined).join('\n')
      htmlBlocks.push(`<pre class="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 overflow-x-auto my-6"><code class="text-[13.5px] text-purple-300/80 leading-relaxed">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
      continue
    }

    // Blockquotes
    if (block.startsWith('>')) {
      const text = block.replace(/^>\s?/gm, '').trim()
      htmlBlocks.push(`<blockquote class="border-l-2 border-purple-500/30 pl-6 py-2 my-8 text-white/50 italic text-[17px] leading-relaxed">${inlineFormat(text)}</blockquote>`)
      continue
    }

    // Unordered lists
    if (/^[-*] /.test(block)) {
      const items = block.split('\n').filter(l => /^[-*] /.test(l)).map(l => l.replace(/^[-*] /, ''))
      htmlBlocks.push(`<ul class="space-y-2.5 my-6 pl-1">${items.map(i => `<li class="flex gap-3 text-white/55 text-[16.5px] leading-relaxed"><span class="text-purple-400/50 mt-1.5 text-[8px]">●</span><span>${inlineFormat(i)}</span></li>`).join('')}</ul>`)
      continue
    }

    // Headings
    const h3 = block.match(/^### (.+)$/)
    if (h3) { htmlBlocks.push(`<h3 id="${slugify(h3[1])}">${escapeHtml(h3[1])}</h3>`); continue }
    const h2 = block.match(/^## (.+)$/)
    if (h2) { htmlBlocks.push(`<h2 id="${slugify(h2[1])}">${escapeHtml(h2[1])}</h2>`); continue }
    const h1 = block.match(/^# (.+)$/)
    if (h1) { htmlBlocks.push(`<h1>${escapeHtml(h1[1])}</h1>`); continue }

    // Horizontal rule
    if (/^---+$/.test(block)) { htmlBlocks.push('<hr />'); continue }

    // Images
    const img = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (img) { htmlBlocks.push(`<img src="${safeUrl(img[2])}" alt="${escapeHtml(img[1])}" class="rounded-xl w-full my-8" />`); continue }

    // Paragraph (default)
    htmlBlocks.push(`<p>${inlineFormat(block.replace(/\n/g, '<br />'))}</p>`)
  }

  return htmlBlocks.join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function safeUrl(url: string): string {
  const trimmed = url.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed
  return '#'
}

function inlineFormat(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="text-[13px] bg-white/[0.06] px-1.5 py-0.5 rounded text-purple-300/70">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => `<a href="${safeUrl(href)}">${label}</a>`)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function buildPost(slug: string, raw: string, source: 'file' | 'draft' = 'file'): BlogPost {
  const { data, content } = parseFrontmatter(raw)
  const wordCount = content.split(/\s+/).filter(Boolean).length
  return {
    slug,
    title: data.title || 'Untitled',
    excerpt: data.excerpt || '',
    category: data.category || 'General',
    date: data.date || '2026-01-01',
    dateFormatted: formatDate(data.date || '2026-01-01'),
    readTime: data.readTime || `${Math.max(1, Math.round(wordCount / 230))} min read`,
    image: data.image || `https://picsum.photos/seed/${slug}/1200/540`,
    featured: data.featured === 'true',
    content: markdownToHtml(content),
    headings: extractHeadings(content),
    wordCount,
    source,
  }
}

// ─── File-based posts ─────────────────────────

function getFilePosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))
  return files.map(file => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8')
    return buildPost(file.replace('.md', ''), raw, 'file')
  })
}

// ─── DB-based posts (auto-generated) ─────────

async function getDraftPosts(): Promise<BlogPost[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  try {
    const supabase = createClient(url, key)
    const { data } = await supabase
      .from('blog_drafts')
      .select('slug, content')
      .eq('published', true)
    if (!data) return []
    return data.map((row: any) => buildPost(row.slug, row.content, 'draft'))
  } catch {
    return []
  }
}

// ─── Public API (now async) ──────────────────

export async function getAllPosts(): Promise<BlogPost[]> {
  const [files, drafts] = await Promise.all([
    Promise.resolve(getFilePosts()),
    getDraftPosts(),
  ])

  // Dedup by slug — files win if there's a collision
  const seen = new Set<string>()
  const combined: BlogPost[] = []
  for (const p of files) { seen.add(p.slug); combined.push(p) }
  for (const p of drafts) { if (!seen.has(p.slug)) combined.push(p) }

  combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return combined
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  // Check filesystem first
  const filePath = path.join(BLOG_DIR, `${slug}.md`)
  if (fs.existsSync(filePath)) {
    return buildPost(slug, fs.readFileSync(filePath, 'utf-8'), 'file')
  }

  // Fall back to DB
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  try {
    const supabase = createClient(url, key)
    const { data } = await supabase
      .from('blog_drafts')
      .select('slug, content')
      .eq('slug', slug)
      .eq('published', true)
      .single()
    if (!data) return null
    return buildPost(data.slug, data.content, 'draft')
  } catch {
    return null
  }
}

export async function getAllSlugs(): Promise<string[]> {
  const posts = await getAllPosts()
  return posts.map(p => p.slug)
}

export async function getRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const all = await getAllPosts()
  const sameCategory = all.filter(p => p.slug !== post.slug && p.category === post.category)
  const others = all.filter(p => p.slug !== post.slug && p.category !== post.category)
  return [...sameCategory, ...others].slice(0, limit)
}
