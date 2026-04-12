'use client'

import { useState, useEffect } from 'react'
import { Upload, Film, Sparkles, ArrowLeft, Check, Image as ImageIcon, Loader2, AlertCircle, X, Play, Clock, Cpu } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const AI_MODELS = [
  'Runway Gen-4', 'Runway Gen-3', 'Midjourney', 'Stable Diffusion XL',
  'Sora', 'Kling AI', 'Pika Labs', 'Stable Video', 'ElevenLabs',
  'Hailuo', 'Luma Dream Machine', 'Seedance', 'Veo3', 'Wan 2.6', 'Other'
]

const GENRES = [
  'Sci-Fi', 'Drama', 'Horror', 'Comedy', 'Action', 'Thriller',
  'Romance', 'Documentary', 'Fantasy', 'Animation', 'Experimental', 'Music Video'
]

const CATEGORIES = [
  'Trending', 'AI Horror', 'Sci-Fi Visions', 'Award Winning',
  'AI Anime', 'Action', 'Fantasy', 'Runway Masterpieces'
]

/* ═══════════════════════════════════════════
   Toast
   ═══════════════════════════════════════════ */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'warning'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors: Record<string, string> = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  }

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl shadow-black/50 flex items-center gap-3 toast-enter ${colors[type]}`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */
export default function SubmitPage() {
  const [form, setForm] = useState({
    title: '', description: '', genre: '', category: '',
    duration: '', creator_name: '', video_url: '',
    trailer_url: '', poster_url: '', tagline: '', series_name: '', episode_number: '',
  })
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [accessChecking, setAccessChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  // ─── Creator/Admin Gate ───
  useEffect(() => {
    async function checkAccess() {
      if (!supabase) { setAccessChecking(false); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setAccessChecking(false); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, user_type')
        .eq('id', session.user.id)
        .single()
      if (profile?.role === 'admin' || profile?.user_type === 'creator') {
        setHasAccess(true)
      }
      setAccessChecking(false)
    }
    checkAccess()
  }, [])

  const isValid = !!(form.title && form.description && form.genre && form.category && form.creator_name)

  const toggleModel = (model: string) => {
    setSelectedModels(prev => prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model])
  }

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    // Validate video URL if provided
    if (form.video_url && !form.video_url.match(/^https?://(www.)?(youtube.com|youtu.be|vimeo.com)//)) {
      setToast({ message: 'Video URL must be a YouTube or Vimeo link', type: 'warning' });
      return;
    }

    if (!isValid) {
      const missing: string[] = []
      if (!form.title) missing.push('Title')
      if (!form.description) missing.push('Description')
      if (!form.genre) missing.push('Genre')
      if (!form.category) missing.push('Category')
      if (!form.creator_name) missing.push('Creator')
      setToast({ message: `Missing: ${missing.join(', ')}`, type: 'warning' })
      return
    }
    setSubmitting(true)
    try {
      if (!supabase) throw new Error('Service unavailable')
      const { error } = await supabase.from('movies').insert({
        title: form.title, description: form.description, genre: form.genre,
        category: form.category, duration: form.duration || null,
        creator_name: form.creator_name, video_url: form.video_url || null,
        trailer_url: form.trailer_url || null, poster_url: form.poster_url || null,
        tagline: form.tagline || null, ai_models: selectedModels, status: 'pending', series_name: form.series_name || null, episode_number: form.episode_number ? parseInt(form.episode_number) : null,
      })
      if (error) throw error
      setSubmitted(true)
      setCooldown(true)
      setTimeout(() => setCooldown(false), 30000)
    } catch (err) {

      setToast({ message: 'Submission failed. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // Get video thumbnail (YouTube instant, Vimeo async)
  const [vimeoThumb, setVimeoThumb] = useState<string | null>(null)

  const getYtThumb = (url: string) => {
    try {
      const u = new URL(url)
      let id = ''
      if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v') || ''
      else if (u.hostname === 'youtu.be') id = u.pathname.slice(1)
      return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null
    } catch { return null }
  }

  const getVimeoId = (url: string) => {
    try {
      const u = new URL(url)
      if (u.hostname.includes('vimeo.com')) return u.pathname.split('/').pop() || null
      return null
    } catch { return null }
  }

  // Fetch Vimeo thumbnail when URL changes
  useEffect(() => {
    if (!form.video_url) { setVimeoThumb(null); return }
    const vid = getVimeoId(form.video_url)
    if (!vid) { setVimeoThumb(null); return }
    fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vid}`)
      .then(r => r.json())
      .then(data => { if (data.thumbnail_url) setVimeoThumb(data.thumbnail_url) })
      .catch(() => setVimeoThumb(null))
  }, [form.video_url])

  const posterSrc = form.poster_url || (form.video_url ? (getYtThumb(form.video_url) || vimeoThumb) : null)

  /* ─── Loading Access Check ─── */
  if (accessChecking) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/20" />
      </div>
    )
  }

  /* ─── Access Denied ─── */
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-violet-500/[0.06] blur-[150px]" />
        </div>
        <div className="text-center max-w-md relative z-10">
          <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
            <Film className="w-10 h-10 text-violet-400/60" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Creator Access Only</h1>
          <p className="text-white/30 text-[15px] mb-8 leading-relaxed">
            Submitting films is available to approved creators. Apply to join our creator community and start sharing your AI cinema.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/spike_apply_en.html" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:brightness-110 transition-all">
              <Sparkles className="w-4 h-4" />
              Apply as Creator
            </a>
            <Link href="/" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ─── Success ─── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-emerald-500/[0.06] blur-[150px]" />
        </div>
        <div className="text-center max-w-md relative z-10 fade-up">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Film Submitted!</h1>
          <p className="text-white/30 text-lg mb-8 leading-relaxed">
            Your masterpiece is under review.<br />We&apos;ll notify you once it&apos;s approved.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 text-white hover:bg-white/15 transition-all border border-white/10 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Spike AI
          </Link>
        </div>
      </div>
    )
  }

  /* ─── Form ─── */
  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ═══ Ambient ═══ */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.6) 0%, rgba(99,102,241,0.3) 40%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-15%] w-[600px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.5) 0%, transparent 65%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* ═══ Nav ═══ */}
      <nav className="sticky top-0 z-50 bg-[#060608]/70 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/25 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[13px] font-medium tracking-wide uppercase">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-violet-400/60" />
            <span className="text-[13px] font-semibold tracking-[0.2em] uppercase text-white/40">Spike AI</span>
          </div>
        </div>
      </nav>

      {/* ═══ Content ═══ */}
      <main className="relative z-10 flex flex-col items-center w-full px-6 pb-24">

        {/* Hero */}
        <header className="text-center pt-10 pb-14 w-full max-w-[1100px]" style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1)" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/[0.08] border border-violet-400/[0.12] text-[10px] font-bold tracking-[0.25em] text-violet-300/60 uppercase mb-6">
            <Upload className="w-3.5 h-3.5" />
            Submit Film
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
            Share your <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">masterpiece.</span>
          </h1>
          <p className="text-[15px] text-white/20 max-w-md mx-auto leading-relaxed">
            Our team will review your submission and get back to you.
          </p>
        </header>

        {/* 2-column */}
        <div className="flex flex-col lg:flex-row justify-center gap-10 lg:gap-14 w-full max-w-[1100px]" style={{ animation: "fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}>

          {/* ─── LEFT: FORM ─── */}
          <div className="w-full lg:w-[560px] space-y-5">

            {/* Film Details */}
            <section className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 space-y-5">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/10 flex items-center justify-center">
                  <Film className="w-3.5 h-3.5 text-violet-400/60" />
                </div>
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/25">Film Details</span>
              </div>
              <InputField label="Film Title" required placeholder="Enter your film title" value={form.title} onChange={v => update('title', v)} />
              <TextareaField label="Description" required placeholder="Story, vision, what makes it unique..." value={form.description} onChange={v => update('description', v)} rows={4} />
              <InputField label="Tagline" placeholder="A short catchy line for the hero card" value={form.tagline} onChange={v => update('tagline', v)} />
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Genre" required value={form.genre} onChange={v => update('genre', v)} options={GENRES} placeholder="Select genre" />
                <SelectField label="Category" required value={form.category} onChange={v => update('category', v)} options={CATEGORIES} placeholder="Select category" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Duration" placeholder="e.g. 14m" value={form.duration} onChange={v => update('duration', v)} />
                <InputField label="Creator / Studio" required placeholder="Your name or studio" value={form.creator_name} onChange={v => update('creator_name', v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Series Name" placeholder="e.g. Breakup Letters AI" value={form.series_name} onChange={v => update('series_name', v)} hint="Leave empty for standalone films" />
                <InputField label="Episode #" placeholder="e.g. 1" value={form.episode_number} onChange={v => update('episode_number', v)} />
              </div>
            </section>

            {/* AI Models */}
            <section className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 space-y-4">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/10 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 text-violet-400/60" />
                </div>
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/25">AI Tools Used</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AI_MODELS.map(model => (
                  <button
                    key={model}
                    onClick={() => toggleModel(model)}
                    className={`px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-300 border cursor-pointer ${
                      selectedModels.includes(model)
                        ? 'bg-violet-500/15 border-violet-500/40 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.12)]'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/30 hover:border-white/[0.12] hover:text-white/50 hover:bg-white/[0.04]'
                    }`}
                  >
                    {selectedModels.includes(model) && <span className="mr-1 text-violet-400">✓</span>}
                    {model}
                  </button>
                ))}
              </div>
            </section>

            {/* Media Links */}
            <section className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 space-y-5">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/10 flex items-center justify-center">
                  <Upload className="w-3.5 h-3.5 text-violet-400/60" />
                </div>
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/25">Media Links</span>
              </div>
              <InputField label="Film Video URL" placeholder="YouTube or Vimeo link" value={form.video_url} onChange={v => update('video_url', v)} hint="We auto-detect the embed from YouTube and Vimeo" />
              <InputField label="Trailer URL" optional placeholder="Short trailer or teaser" value={form.trailer_url} onChange={v => update('trailer_url', v)} />
              <InputField label="Poster Image URL" optional placeholder="Direct link to poster image (2:3)" value={form.poster_url} onChange={v => update('poster_url', v)} />
            </section>
          </div>

          {/* ─── RIGHT: PREVIEW + SUBMIT ─── */}
          <div className="w-full lg:w-[400px] lg:flex-shrink-0 lg:sticky lg:top-20 lg:self-start">
            <div className="space-y-6">

              <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/15 text-center">Live Preview</p>

              {/* ── Netflix-style Card ── */}
              <div className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0c0c14] shadow-2xl shadow-black/60 transition-all duration-500 hover:border-white/[0.1] hover:shadow-[0_8px_60px_rgba(139,92,246,0.08)]">

                {/* Poster Area */}
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#12121f] to-[#0a0a14]">
                  {posterSrc ? (
                    <img src={posterSrc} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
                          <ImageIcon className="w-6 h-6 text-white/10" />
                        </div>
                        <p className="text-[11px] text-white/10 tracking-wide">Add a poster or video URL</p>
                      </div>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c14] via-transparent to-transparent" />

                  {/* Genre badge */}
                  {form.genre && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-violet-300 border border-violet-500/20">
                        {form.genre}
                      </span>
                    </div>
                  )}

                  {/* Play button overlay */}
                  {posterSrc && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-2xl shadow-black/40 scale-90 group-hover:scale-100 transition-transform duration-500">
                        <Play className="w-6 h-6 text-black ml-0.5" fill="black" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info section */}
                <div className="p-5 space-y-3">
                  {/* Title */}
                  <h3 className="text-[18px] font-bold text-white leading-tight truncate">
                    {form.title || <span className="text-white/10">Your Film Title</span>}
                  </h3>

                  {/* Tagline */}
                  <p className="text-[13px] leading-relaxed line-clamp-2 min-h-[2.5em]">
                    {form.tagline
                      ? <span className="text-white/35">{form.tagline}</span>
                      : <span className="text-white/8 italic">Add a tagline...</span>
                    }
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[11px] text-white/20">
                    {form.creator_name && <span className="text-white/35 font-medium">{form.creator_name}</span>}
                    {form.duration && <><span className="text-white/10">·</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{form.duration}</span></>}
                    {form.category && <><span className="text-white/10">·</span><span>{form.category}</span></>}
                  </div>

                  {/* AI Tools */}
                  {selectedModels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedModels.slice(0, 4).map(m => (
                        <span key={m} className="px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-violet-500/10 text-violet-400/70 border border-violet-500/15">
                          {m}
                        </span>
                      ))}
                      {selectedModels.length > 4 && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] bg-white/[0.04] text-white/20">+{selectedModels.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-white/[0.04] my-1" />

                  {/* Status indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-white/10'}`} />
                      <span className={`text-[10px] font-medium tracking-wide uppercase ${isValid ? 'text-emerald-400/70' : 'text-white/15'}`}>
                        {isValid ? 'Ready to submit' : 'Fill required fields'}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/10">
                      {[form.title, form.description, form.genre, form.category, form.creator_name].filter(Boolean).length}/5
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || cooldown}
                className={`w-full py-4 px-8 rounded-2xl text-[14px] font-bold tracking-wide uppercase flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
                  submitting
                    ? 'bg-white/[0.03] text-white/20 border border-white/[0.05] cursor-wait'
                    : isValid
                      ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.45)] hover:brightness-110 active:scale-[0.98] border border-violet-500/30'
                      : 'bg-white/[0.03] text-white/20 border border-white/[0.05] hover:border-white/[0.08] hover:text-white/30 active:scale-[0.98]'
                }`}
              >
                {submitting
                  ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting...</>
                  : <><Upload className="w-5 h-5" />Submit Film</>
                }
              </button>

              {!isValid && !submitting && (
                <p className="text-center text-[10px] text-white/10">
                  Fill required fields (<span className="text-violet-400/40">*</span>) to submit
                </p>
              )}
              <p className="text-center text-[10px] text-white/8">
                By submitting, you confirm this is your original AI-generated work and agree to our{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/30 underline">Terms of Service</a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .toast-enter { animation: toastIn 0.4s cubic-bezier(0.16,1,0.3,1); }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, -12px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Reusable Components
   ═══════════════════════════════════════════ */

function InputField({ label, placeholder, value, onChange, required, optional, hint }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
  required?: boolean; optional?: boolean; hint?: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-white/20">
        {label}
        {required && <span className="text-violet-400/60 ml-1">*</span>}
        {optional && <span className="text-white/10 ml-1.5 normal-case tracking-normal font-normal text-[10px]">(optional)</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-[13px] text-white placeholder-white/15 bg-white/[0.03] border border-white/[0.06] outline-none transition-all duration-300 focus:border-violet-500/30 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(139,92,246,0.08)]"
      />
      {hint && <p className="text-[10px] text-white/10 pl-1">{hint}</p>}
    </div>
  )
}

function TextareaField({ label, placeholder, value, onChange, required, rows = 3 }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
  required?: boolean; rows?: number
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-white/20">
        {label}
        {required && <span className="text-violet-400/60 ml-1">*</span>}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full px-4 py-3 rounded-xl text-[13px] text-white placeholder-white/15 bg-white/[0.03] border border-white/[0.06] outline-none resize-none transition-all duration-300 focus:border-violet-500/30 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(139,92,246,0.08)]"
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void
  options: string[]; placeholder: string; required?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-white/20">
        {label}
        {required && <span className="text-violet-400/60 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-[13px] bg-white/[0.03] border border-white/[0.06] outline-none appearance-none cursor-pointer transition-all duration-300 focus:border-violet-500/30 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] text-white/30"
        style={{ colorScheme: 'dark' }}
      >
        <option value="" disabled className="bg-[#0c0c14] text-white/20">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-[#0c0c14] text-white">{opt}</option>
        ))}
      </select>
    </div>
  )
}
