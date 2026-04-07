import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog — Spike AI | AI Cinema News & Insights',
  description: 'The latest news, tutorials, and insights from the world of AI-generated cinema. Discover how creators are using Sora, Runway, Kling AI and more.',
  keywords: ['AI cinema blog', 'AI filmmaking tutorials', 'Sora news', 'Runway Gen-4', 'AI short films'],
}

/* ═══════════════════════════════════════════
   Blog Data (hardcoded for now — replace with CMS/Supabase later)
   ═══════════════════════════════════════════ */

interface Post {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
  image: string
  featured?: boolean
}

const POSTS: Post[] = [
  {
    slug: 'runway-aiff-2025-recap',
    title: 'Inside AIFF 2025: How 10 AI Films Made It to IMAX',
    excerpt: 'From 6,000 submissions to Lincoln Center and 10 IMAX theaters across America — a look at the films and creators that defined the biggest AI film festival yet.',
    category: 'Industry News',
    date: 'Mar 28, 2026',
    readTime: '8 min read',
    image: 'https://picsum.photos/seed/blog-aiff/1200/540',
    featured: true,
  },
  {
    slug: 'sora-2-filmmaking-guide',
    title: 'Sora 2 for Filmmakers: A Complete Production Guide',
    excerpt: 'Character consistency, 25-second clips, and native audio — everything you need to know about using Sora 2 for your next AI short film.',
    category: 'AI Tutorials',
    date: 'Mar 22, 2026',
    readTime: '12 min read',
    image: 'https://picsum.photos/seed/blog-sora/800/360',
  },
  {
    slug: 'kling-ai-vs-runway-gen4',
    title: 'Kling AI 2.0 vs Runway Gen-4: Which Should You Use?',
    excerpt: 'We put both tools through a real production pipeline. Here\'s what we found about quality, cost, and creative control.',
    category: 'Tool Comparison',
    date: 'Mar 18, 2026',
    readTime: '10 min read',
    image: 'https://picsum.photos/seed/blog-kling/800/360',
  },
  {
    slug: 'ai-cinema-distribution-2026',
    title: 'The Distribution Problem: Where Do AI Films Live?',
    excerpt: 'YouTube buries them. Instagram crops them. The case for dedicated AI cinema platforms and why creators need a real home.',
    category: 'Opinion',
    date: 'Mar 14, 2026',
    readTime: '6 min read',
    image: 'https://picsum.photos/seed/blog-dist/800/360',
  },
  {
    slug: 'elevenlabs-voice-acting-ai',
    title: 'How ElevenLabs Changed AI Film Dialogue Forever',
    excerpt: 'From robotic text-to-speech to emotional performances — the evolution of AI voice acting and what it means for indie filmmakers.',
    category: 'AI Tutorials',
    date: 'Mar 10, 2026',
    readTime: '7 min read',
    image: 'https://picsum.photos/seed/blog-eleven/800/360',
  },
  {
    slug: 'world-ai-film-festival-cannes',
    title: 'WAiFF 2026: AI Cinema Arrives at Cannes',
    excerpt: 'The World AI Film Festival brings AI-generated films to the French Riviera. Here\'s what to expect and how to submit.',
    category: 'Industry News',
    date: 'Mar 5, 2026',
    readTime: '5 min read',
    image: 'https://picsum.photos/seed/blog-cannes/800/360',
  },
  {
    slug: 'seedance-character-consistency',
    title: 'Seedance 2.0: The Character Consistency Breakthrough',
    excerpt: 'ByteDance\'s new model finally solves the biggest problem in AI filmmaking. We tested it on a 3-minute narrative short.',
    category: 'Tool Review',
    date: 'Feb 28, 2026',
    readTime: '9 min read',
    image: 'https://picsum.photos/seed/blog-seedance/800/360',
  },
]

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

/* ═══════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════ */

export default function BlogPage() {
  const featured = POSTS.find(p => p.featured)!
  const rest = POSTS.filter(p => !p.featured)

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-300px] left-1/4 w-[700px] h-[500px] rounded-full bg-purple-600/[0.04] blur-[150px]" />
        <div className="absolute bottom-[-200px] right-1/4 w-[600px] h-[400px] rounded-full bg-indigo-600/[0.03] blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 px-6 md:px-12 py-5 flex items-center justify-between max-w-[1300px] mx-auto">
        <Link href="/" className="text-[20px] font-semibold tracking-[0.18em] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
          spike AI
        </Link>
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
            Trending Tools
          </span>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {TRENDING_TOOLS.map(tool => (
              <span key={tool} className="text-[11px] font-medium text-white/30 whitespace-nowrap px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] hover:text-white/60 hover:border-white/10 transition-all cursor-default">
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-[1300px] mx-auto px-6 md:px-12 pt-10 pb-24">

        {/* Page Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-white">The Journal</span>
          </h1>
          <p className="text-base text-white/30 max-w-lg tracking-wide">
            News, tutorials, and insights from the frontier of AI cinema.
          </p>
        </header>

        {/* ─── HERO POST ─── */}
        <article className="group relative rounded-2xl overflow-hidden mb-14 cursor-pointer border border-white/[0.06] hover:border-purple-500/20 transition-all duration-500">
          <div className="aspect-[21/9] md:aspect-[21/8] relative overflow-hidden">
            <img
              src={featured.image}
              alt={featured.title}
              className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full border ${CATEGORY_COLORS[featured.category] || 'text-white/50 bg-white/5 border-white/10'}`}>
                {featured.category}
              </span>
              <span className="text-[11px] text-white/30">{featured.date}</span>
              <span className="text-[11px] text-white/20">•</span>
              <span className="text-[11px] text-white/30">{featured.readTime}</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3 max-w-2xl leading-[1.15]">
              {featured.title}
            </h2>
            <p className="text-sm md:text-base text-white/40 max-w-xl leading-relaxed">
              {featured.excerpt}
            </p>
          </div>
        </article>

        {/* ─── GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map(post => (
            <article
              key={post.slug}
              className="group rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm cursor-pointer hover:border-purple-500/20 hover:bg-white/[0.04] transition-all duration-500 hover:shadow-[0_0_40px_rgba(139,92,246,0.06)]"
            >
              {/* Image */}
              <div className="aspect-[16/9] overflow-hidden relative">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/80 to-transparent opacity-60" />
                <span className={`absolute top-3 left-3 text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-md border backdrop-blur-sm ${CATEGORY_COLORS[post.category] || 'text-white/50 bg-white/5 border-white/10'}`}>
                  {post.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-[11px] text-white/25">
                  <time>{post.date}</time>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-[17px] font-bold text-white leading-snug tracking-tight group-hover:text-purple-200 transition-colors duration-300">
                  {post.title}
                </h2>
                <p className="text-[13px] text-white/30 leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-10">
        <div className="max-w-[1300px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[20px] font-semibold tracking-[0.18em] text-white/20" style={{ fontFamily: "'Inter', sans-serif" }}>spike AI</span>
          <p className="text-[12px] text-white/15 tracking-wide">
            The world&apos;s first streaming platform for AI-generated cinema.
          </p>
        </div>
      </footer>

      {/* Scrollbar hide */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
