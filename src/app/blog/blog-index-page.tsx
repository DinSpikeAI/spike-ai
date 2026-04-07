import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog — Spike AI | AI Cinema News & Insights',
  description: 'The latest news, tutorials, and insights from the world of AI-generated cinema. Discover how creators are using Sora, Runway, Kling AI and more.',
  keywords: ['AI cinema blog', 'AI filmmaking tutorials', 'Sora news', 'Runway Gen-4', 'AI short films'],
}

const TRENDING_TOOLS = [
  'Runway Gen-4', 'Sora 2', 'Kling AI 2.0', 'Seedance 2.0',
  'ElevenLabs', 'Midjourney', 'Veo 3.1', 'Pika Labs',
]

const CATEGORY_COLORS: Record<string, string> = {
  'Industry News': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'AI Tutorials': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Tool Comparison': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Tool Review': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Opinion': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
}

export default function BlogPage() {
  const posts = getAllPosts()
  const featured = posts.find(p => p.featured) || posts[0]
  const rest = posts.filter(p => p.slug !== featured?.slug)
  const categories = [...new Set(posts.map(p => p.category))]

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-300px] left-1/4 w-[700px] h-[500px] rounded-full bg-purple-600/[0.04] blur-[150px]" />
        <div className="absolute bottom-[-200px] right-1/4 w-[600px] h-[400px] rounded-full bg-indigo-600/[0.03] blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 px-6 md:px-12 py-5 flex items-center justify-between max-w-[1300px] mx-auto">
        <Link href="/" className="text-[20px] font-semibold tracking-[0.18em] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>spike AI</Link>
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[13px] text-white/40 hover:text-white transition-colors tracking-[0.04em]">Home</Link>
          <span className="text-[13px] text-white font-medium tracking-[0.04em]">Blog</span>
          <Link href="/submit" className="text-[12.5px] font-medium tracking-[0.04em] px-5 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10 hover:text-white transition-all">Submit Film</Link>
        </div>
      </nav>

      {/* Trending Ticker */}
      <div className="relative z-10 border-y border-white/[0.04] bg-white/[0.01] overflow-hidden">
        <div className="max-w-[1300px] mx-auto px-6 md:px-12 py-3 flex items-center gap-4">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-purple-400 whitespace-nowrap flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Trending
          </span>
          <div className="flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TRENDING_TOOLS.map(tool => (
              <span key={tool} className="text-[11px] font-medium text-white/25 whitespace-nowrap px-3 py-1 rounded-full border border-white/[0.05] bg-white/[0.02] hover:text-white/50 transition-all cursor-default">{tool}</span>
            ))}
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-[1300px] mx-auto px-6 md:px-12 pt-10 pb-24">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">The Journal</h1>
          <p className="text-base text-white/30 max-w-lg tracking-wide">News, tutorials, and insights from the frontier of AI cinema.</p>
        </header>

        {/* Category pills */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <span className="text-[11px] font-semibold px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/10 cursor-default whitespace-nowrap">All</span>
          {categories.map(cat => (
            <span key={cat} className="text-[11px] font-medium px-4 py-1.5 rounded-full bg-white/[0.03] text-white/35 border border-white/[0.06] cursor-default whitespace-nowrap hover:text-white/60 hover:border-white/10 transition-all">{cat}</span>
          ))}
        </div>

        {/* Hero Post */}
        {featured && (
          <Link href={`/blog/${featured.slug}`}>
            <article className="group relative rounded-2xl overflow-hidden mb-14 cursor-pointer border border-white/[0.06] hover:border-purple-500/20 transition-all duration-700">
              <div className="aspect-[21/9] md:aspect-[21/8] relative overflow-hidden">
                <img src={featured.image} alt={featured.title} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full border ${CATEGORY_COLORS[featured.category] || 'text-white/50 bg-white/5 border-white/10'}`}>{featured.category}</span>
                  <span className="text-[11px] text-white/25">{featured.dateFormatted}</span>
                  <span className="text-[11px] text-white/15">•</span>
                  <span className="text-[11px] text-white/25">{featured.readTime}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3 max-w-2xl leading-[1.12] group-hover:text-purple-100 transition-colors duration-500">{featured.title}</h2>
                <p className="text-sm md:text-base text-white/35 max-w-xl leading-relaxed">{featured.excerpt}</p>
              </div>
            </article>
          </Link>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article className="group h-full rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm cursor-pointer hover:border-purple-500/20 hover:bg-white/[0.04] transition-all duration-500 hover:shadow-[0_0_40px_rgba(139,92,246,0.06)]">
                <div className="aspect-[16/9] overflow-hidden relative">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/80 to-transparent opacity-60" />
                  <span className={`absolute top-3 left-3 text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-md border backdrop-blur-sm ${CATEGORY_COLORS[post.category] || 'text-white/50 bg-white/5 border-white/10'}`}>{post.category}</span>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-[11px] text-white/20">
                    <time>{post.dateFormatted}</time><span>•</span><span>{post.readTime}</span>
                  </div>
                  <h2 className="text-[17px] font-bold text-white leading-snug tracking-tight group-hover:text-purple-200 transition-colors duration-300">{post.title}</h2>
                  <p className="text-[13px] text-white/30 leading-relaxed line-clamp-2">{post.excerpt}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Article count */}
        <div className="mt-12 text-center">
          <p className="text-[12px] text-white/15 tracking-wide">{posts.length} articles published</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-10">
        <div className="max-w-[1300px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-[20px] font-semibold tracking-[0.18em] text-white/20" style={{ fontFamily: "'Inter', sans-serif" }}>spike AI</Link>
          <p className="text-[12px] text-white/15 tracking-wide">The world&apos;s first streaming platform for AI-generated cinema.</p>
        </div>
      </footer>
    </div>
  )
}
