import { Metadata } from 'next'
import Link from 'next/link'
import { getPostBySlug, getAllSlugs, getAllPosts, getRelatedPosts } from '@/lib/blog'
import { notFound } from 'next/navigation'
import ArticleClient from './ArticleClient'

const CATEGORY_COLORS: Record<string, string> = {
  'Industry News': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'AI Tutorials': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Tool Comparison': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Tool Review': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Opinion': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Not Found' }
  return {
    title: `${post.title} — Spike AI Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.image, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: post.date,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post, 3)
  const allPosts = await getAllPosts()
  const currentIndex = allPosts.findIndex(p => p.slug === slug)
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-300px] left-1/3 w-[600px] h-[400px] rounded-full bg-purple-600/[0.03] blur-[150px]" />
      </div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.excerpt,
            image: post.image,
            datePublished: post.date,
            dateModified: post.date,
            author: { '@type': 'Organization', name: 'Spike AI', url: 'https://spikeai.studio' },
            publisher: { '@type': 'Organization', name: 'Spike AI', url: 'https://spikeai.studio', logo: { '@type': 'ImageObject', url: 'https://spikeai.studio/icons/icon-512.png' } },
            mainEntityOfPage: { '@type': 'WebPage', '@id': `https://spikeai.studio/blog/${post.slug}` },
            wordCount: post.wordCount,
            articleSection: post.category,
          }),
        }}
      />

      {/* Reading progress bar */}
      <ArticleClient />

      {/* Nav */}
      <nav className="relative z-20 px-6 md:px-12 py-5 flex items-center justify-between max-w-[1300px] mx-auto">
        <Link href="/" className="text-[20px] font-semibold tracking-[0.18em] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>spike AI</Link>
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[13px] text-white/40 hover:text-white transition-colors tracking-[0.04em]">Home</Link>
          <Link href="/blog" className="text-[13px] text-white/40 hover:text-white transition-colors tracking-[0.04em]">Blog</Link>
          <Link href="/submit" className="text-[12.5px] font-medium tracking-[0.04em] px-5 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10 hover:text-white transition-all">Submit Film</Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero image */}
        <div className="relative w-full aspect-[21/7] max-h-[480px] overflow-hidden">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-[#050505]/10" />
        </div>

        {/* Article body */}
        <article className="max-w-[740px] mx-auto px-6 -mt-28 relative z-10 pb-16">

          {/* Meta */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className={`text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full border ${CATEGORY_COLORS[post.category] || 'text-white/50 bg-white/5 border-white/10'}`}>
              {post.category}
            </span>
            <time className="text-[12px] text-white/30">{post.dateFormatted}</time>
            <span className="text-[12px] text-white/15">•</span>
            <span className="text-[12px] text-white/30">{post.readTime}</span>
            <span className="text-[12px] text-white/15">•</span>
            <span className="text-[12px] text-white/25">{post.wordCount.toLocaleString()} words</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-[46px] font-extrabold tracking-[-0.025em] leading-[1.08] text-white mb-8">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-[17px] text-white/35 leading-[1.9] mb-12 border-l-2 border-purple-500/20 pl-6">
            {post.excerpt}
          </p>

          {/* Author */}
          <div className="flex items-center gap-4 mb-12 pb-8 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-white/10 flex items-center justify-center text-sm font-bold text-white/60">S</div>
            <div>
              <p className="text-[13px] font-semibold text-white/80">Spike AI Editorial</p>
              <p className="text-[11px] text-white/30">The frontier of AI-generated cinema</p>
            </div>
          </div>

          {/* Table of Contents */}
          {post.headings.length > 2 && (
            <div className="mb-12 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30 mb-4">In this article</p>
              <div className="space-y-2">
                {post.headings.map(h => (
                  <a key={h.id} href={`#${h.id}`} className={`block text-[13.5px] text-white/40 hover:text-purple-400 transition-colors ${h.level === 3 ? 'pl-4' : ''}`}>
                    {h.text}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="prose-spike" dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Share */}
          <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/25">Share this article</p>
            <div className="flex items-center gap-3">
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://spikeai.studio/blog/${post.slug}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-[12px] font-medium text-white/40 hover:text-white hover:border-white/20 transition-all">
                𝕏 Post
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://spikeai.studio/blog/${post.slug}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-[12px] font-medium text-white/40 hover:text-white hover:border-white/20 transition-all">
                LinkedIn
              </a>
              <button
                onClick={undefined}
                className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-[12px] font-medium text-white/40 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                data-copy-url={`https://spikeai.studio/blog/${post.slug}`}>
                Copy Link
              </button>
            </div>
          </div>

          {/* Prev / Next */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevPost && (
              <Link href={`/blog/${prevPost.slug}`} className="group p-5 rounded-xl border border-white/[0.06] hover:border-purple-500/20 transition-all bg-white/[0.01] hover:bg-white/[0.03]">
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/20 mb-2">← Previous</p>
                <p className="text-[14px] font-semibold text-white/60 group-hover:text-white transition-colors leading-snug">{prevPost.title}</p>
              </Link>
            )}
            {nextPost && (
              <Link href={`/blog/${nextPost.slug}`} className="group p-5 rounded-xl border border-white/[0.06] hover:border-purple-500/20 transition-all bg-white/[0.01] hover:bg-white/[0.03] sm:text-right">
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/20 mb-2">Next →</p>
                <p className="text-[14px] font-semibold text-white/60 group-hover:text-white transition-colors leading-snug">{nextPost.title}</p>
              </Link>
            )}
          </div>

          {/* Newsletter CTA */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-purple-500/[0.06] to-indigo-500/[0.04] border border-purple-500/10 text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-purple-400/60 mb-3">Stay in the loop</p>
            <h3 className="text-xl font-bold text-white mb-2">Get the latest on AI cinema</h3>
            <p className="text-[14px] text-white/35 mb-6 max-w-md mx-auto">New articles, creator spotlights, and platform updates delivered to your inbox.</p>
            <div className="flex gap-3 max-w-sm mx-auto">
              <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 outline-none focus:border-purple-500/30 transition-all" />
              <button className="px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition-all cursor-pointer">Subscribe</button>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-20">
              <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/25 mb-6">More from The Journal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {related.map(r => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="group">
                    <div className="rounded-xl overflow-hidden border border-white/[0.06] hover:border-purple-500/20 transition-all duration-500">
                      <div className="aspect-[16/9] overflow-hidden">
                        <img src={r.image} alt={r.title} className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-[1.05]" />
                      </div>
                      <div className="p-4 space-y-1.5">
                        <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-white/20">{r.category}</span>
                        <p className="text-[13px] font-semibold text-white/70 leading-snug group-hover:text-purple-200 transition-colors">{r.title}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </article>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-10 mt-8">
        <div className="max-w-[1300px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-[20px] font-semibold tracking-[0.18em] text-white/20" style={{ fontFamily: "'Inter', sans-serif" }}>spike AI</Link>
          <p className="text-[12px] text-white/15 tracking-wide">The home for AI-generated cinema.</p>
          <div className="flex gap-4 text-[11px] text-white/15"><a href="/terms" className="hover:text-white/30 transition-colors">Terms</a><a href="/privacy" className="hover:text-white/30 transition-colors">Privacy</a><a href="/community-guidelines" className="hover:text-white/30 transition-colors">Guidelines</a></div>
        </div>
      </footer>

      {/* Article typography */}
      <style>{`
        .prose-spike p { color: rgba(255,255,255,0.5); font-size: 17.5px; line-height: 2; margin-bottom: 1.8em; letter-spacing: 0.005em; }
        .prose-spike h2 { color: #fff; font-size: 28px; font-weight: 800; margin-top: 3.2em; margin-bottom: 1em; letter-spacing: -0.025em; scroll-margin-top: 80px; line-height: 1.25; }
        .prose-spike h3 { color: rgba(255,255,255,0.9); font-size: 21px; font-weight: 700; margin-top: 2.6em; margin-bottom: 0.8em; scroll-margin-top: 80px; line-height: 1.3; }
        .prose-spike strong { color: rgba(255,255,255,0.82); font-weight: 600; }
        .prose-spike em { color: rgba(255,255,255,0.55); font-style: italic; }
        .prose-spike hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 3.5em 0; }
        .prose-spike a { color: #a78bfa; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(167,139,250,0.3); transition: all 0.2s; }
        .prose-spike a:hover { color: #c4b5fd; text-decoration-color: rgba(196,181,253,0.5); }
        .prose-spike img { border-radius: 16px; margin: 2.8em 0; }
        .prose-spike p:first-child::first-letter { font-size: 3.4em; float: left; line-height: 0.8; margin-right: 0.1em; margin-top: 0.06em; color: rgba(255,255,255,0.75); font-weight: 700; }
        .prose-spike ul, .prose-spike ol { color: rgba(255,255,255,0.5); font-size: 17px; line-height: 2; margin-bottom: 1.8em; padding-left: 1.5em; }
        .prose-spike li { margin-bottom: 0.5em; }
        .prose-spike blockquote { border-left: 2px solid rgba(167,139,250,0.3); padding-left: 1.5em; margin: 2em 0; color: rgba(255,255,255,0.45); font-style: italic; }
      `}</style>
    </div>
  )
}
