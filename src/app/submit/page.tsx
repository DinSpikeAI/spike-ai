'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Upload, Film, Sparkles, ArrowLeft, Check, Image as ImageIcon, Loader2, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const AI_MODELS = [
  'Runway Gen-4', 'Runway Gen-3', 'Midjourney', 'Stable Diffusion XL',
  'Sora', 'Kling AI', 'Pika Labs', 'Stable Video', 'ElevenLabs',
  'Hailuo', 'Luma Dream Machine', 'Other'
]

const GENRES = [
  'Sci-Fi', 'Drama', 'Horror', 'Comedy', 'Action', 'Thriller',
  'Romance', 'Documentary', 'Fantasy', 'Animation', 'Experimental', 'Music Video'
]

const CATEGORIES = [
  'Trending', 'New Releases', "Editor's Choice", 'Most Upvoted',
  'Shorts', 'Feature Films', 'Series', 'Music Videos'
]

/* ═══════════════════════════════════════════
   Toast Notification
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
  const icons: Record<string, React.ReactNode> = {
    success: <Check className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
    warning: <AlertCircle className="w-4 h-4" />,
  }

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl shadow-black/50 flex items-center gap-3 toast-enter ${colors[type]}`}
    >
      {icons[type]}
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
    title: '',
    description: '',
    genre: '',
    category: '',
    duration: '',
    creator_name: '',
    video_url: '',
    trailer_url: '',
    poster_url: '',
    tagline: '',
  })
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

  const isValid = !!(form.title && form.description && form.genre && form.category && form.creator_name)

  const toggleModel = (model: string) => {
    setSelectedModels(prev =>
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    )
  }

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
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
      const { error } = await supabase.from('movies').insert({
        title: form.title,
        description: form.description,
        genre: form.genre,
        category: form.category,
        duration: form.duration || null,
        creator_name: form.creator_name,
        video_url: form.video_url || null,
        trailer_url: form.trailer_url || null,
        poster_url: form.poster_url || null,
        tagline: form.tagline || null,
        ai_models: selectedModels,
        status: 'pending',
      })
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setToast({ message: 'Submission failed. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  /* ─── Success Screen ─── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center px-4">
        <div className="text-center max-w-md fade-up">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Film Submitted!</h1>
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
            Your masterpiece is under review.<br />We&apos;ll notify you once it&apos;s approved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 text-white hover:bg-white/15 transition-all border border-white/10 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Spike AI
          </Link>
        </div>
      </div>
    )
  }

  /* ─── Main Form ─── */
  return (
    <div className="min-h-screen bg-[#08080c] text-white relative overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-purple-600/[0.07] blur-[150px]" />
        <div className="absolute bottom-[-100px] right-[-200px] w-[500px] h-[400px] rounded-full bg-indigo-600/[0.05] blur-[120px]" />
      </div>

      {/* Top nav */}
      <nav className="relative z-10 px-6 py-5 flex items-center gap-4 max-w-[1100px] mx-auto">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium tracking-wide uppercase">Back</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Film className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold tracking-widest uppercase text-zinc-300">Spike AI</span>
        </div>
      </nav>

      {/* Master container */}
      <main className="relative z-10 max-w-[1100px] mx-auto px-6 sm:px-8 pb-24">
        {/* Hero */}
        <header className="text-center pt-2 pb-12 sm:pb-16">
          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none mb-5"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(139, 92, 246, 0.3))',
            }}
          >
            Submit Your Film.
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Share your AI-generated masterpiece with the world.
            <br />
            <span className="text-zinc-500">Our team will review your submission.</span>
          </p>
        </header>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start max-w-[960px] mx-auto">

          {/* ─── LEFT: FORM ─── */}
          <div className="space-y-8">

            <section className="space-y-5">
              <SectionLabel icon={<Film className="w-4 h-4" />} text="Film Details" />
              <InputField label="Film Title" required placeholder="Enter your film title" value={form.title} onChange={v => update('title', v)} />
              <TextareaField label="Description" required placeholder="Describe your film — story, vision, what makes it unique..." value={form.description} onChange={v => update('description', v)} rows={4} />
              <InputField label="Tagline" placeholder="A short catchy line for the hero card" value={form.tagline} onChange={v => update('tagline', v)} />
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Genre" required value={form.genre} onChange={v => update('genre', v)} options={GENRES} placeholder="Select genre" />
                <SelectField label="Category" required value={form.category} onChange={v => update('category', v)} options={CATEGORIES} placeholder="Select category" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Duration" placeholder="e.g. 1h 45m" value={form.duration} onChange={v => update('duration', v)} />
                <InputField label="Creator / Studio" required placeholder="Your name or studio" value={form.creator_name} onChange={v => update('creator_name', v)} />
              </div>
            </section>

            <section className="space-y-4">
              <SectionLabel icon={<Sparkles className="w-4 h-4" />} text="AI Models Used" />
              <div className="flex flex-wrap gap-2">
                {AI_MODELS.map(model => (
                  <button
                    key={model}
                    onClick={() => toggleModel(model)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 border cursor-pointer ${
                      selectedModels.includes(model)
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-500 hover:border-white/15 hover:text-zinc-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    {selectedModels.includes(model) && <span className="mr-1.5 text-purple-400">✓</span>}
                    {model}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <SectionLabel icon={<Upload className="w-4 h-4" />} text="Media Links" />
              <InputField label="Film Video URL" placeholder="YouTube or Vimeo link" value={form.video_url} onChange={v => update('video_url', v)} hint="We auto-detect the embed from YouTube and Vimeo" />
              <InputField label="Trailer URL" optional placeholder="Short trailer or teaser" value={form.trailer_url} onChange={v => update('trailer_url', v)} />
              <InputField label="Poster Image URL" optional placeholder="Direct link to poster image (2:3)" value={form.poster_url} onChange={v => update('poster_url', v)} />
            </section>
          </div>

          {/* ─── RIGHT: STICKY PREVIEW ─── */}
          <div className="lg:sticky lg:top-8">
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3">Live Preview</p>
                <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/40">
                  <div className="aspect-[2/3] bg-gradient-to-b from-zinc-800/50 to-zinc-900/80 relative flex items-center justify-center overflow-hidden">
                    {form.poster_url ? (
                      <img src={form.poster_url} alt="Poster" className="w-full h-full object-cover transition-opacity duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="text-center space-y-2">
                        <ImageIcon className="w-10 h-10 text-zinc-700 mx-auto" />
                        <p className="text-xs text-zinc-600">Poster preview</p>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 transition-all duration-300" style={{ opacity: form.genre ? 1 : 0, transform: form.genre ? 'translateY(0)' : 'translateY(-8px)' }}>
                      <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-[10px] font-semibold uppercase tracking-wider text-purple-300 border border-purple-500/20">{form.genre || ''}</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-lg font-bold text-white leading-tight truncate transition-all duration-300">
                      {form.title || <span className="text-zinc-600">Your Film Title</span>}
                    </h3>
                    <div className="transition-all duration-300">
                      {form.tagline
                        ? <p className="text-sm text-zinc-400 line-clamp-2">{form.tagline}</p>
                        : <p className="text-sm text-zinc-700 italic">Start typing to see your tagline...</p>
                      }
                    </div>
                    <div className="flex items-center gap-3 pt-1 text-xs text-zinc-500">
                      {form.creator_name && <span>{form.creator_name}</span>}
                      {form.duration && <span>• {form.duration}</span>}
                      {form.category && <span>• {form.category}</span>}
                    </div>
                    {selectedModels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {selectedModels.slice(0, 3).map(m => (
                          <span key={m} className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">{m}</span>
                        ))}
                        {selectedModels.length > 3 && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-500">+{selectedModels.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit — always clickable, shows toast if invalid */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`w-full py-4 px-8 rounded-full text-[15px] font-bold tracking-wide uppercase flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
                  submitting
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-wait'
                    : isValid
                      ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-[0_0_30px_rgba(139,92,246,0.35)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] hover:brightness-110 active:scale-[0.97] border border-purple-500/30'
                      : 'bg-gradient-to-r from-zinc-800 to-zinc-700 text-zinc-400 border border-zinc-600/30 hover:border-zinc-500/40 hover:text-zinc-300 active:scale-[0.97]'
                }`}
              >
                {submitting
                  ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting...</>
                  : <><Upload className="w-5 h-5" />Submit Film for Review</>
                }
              </button>

              {!isValid && !submitting && (
                <p className="text-center text-[11px] text-zinc-600">
                  Fill in all required fields (<span className="text-purple-400/60">*</span>) to enable submission.
                </p>
              )}
              <p className="text-center text-[11px] text-zinc-600">
                By submitting, you confirm this is your original AI-generated work.
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

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-1">
      <span className="text-purple-400/80">{icon}</span>
      <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500">{text}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
    </div>
  )
}

function InputField({ label, placeholder, value, onChange, required, optional, hint }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
  required?: boolean; optional?: boolean; hint?: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
        {label}
        {required && <span className="text-purple-400 ml-1">*</span>}
        {optional && <span className="text-zinc-600 ml-1.5 normal-case tracking-normal font-normal text-[11px]">(optional)</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-zinc-600 bg-white/[0.04] border border-white/[0.07] outline-none transition-all duration-300 focus:border-purple-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(139,92,246,0.12),0_0_0_1px_rgba(139,92,246,0.15)]"
      />
      {hint && <p className="text-[11px] text-zinc-600 pl-1">{hint}</p>}
    </div>
  )
}

function TextareaField({ label, placeholder, value, onChange, required, rows = 3 }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
  required?: boolean; rows?: number
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
        {label}
        {required && <span className="text-purple-400 ml-1">*</span>}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-zinc-600 bg-white/[0.04] border border-white/[0.07] outline-none resize-none transition-all duration-300 focus:border-purple-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(139,92,246,0.12),0_0_0_1px_rgba(139,92,246,0.15)]"
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
      <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
        {label}
        {required && <span className="text-purple-400 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-[14px] bg-white/[0.04] border border-white/[0.07] outline-none appearance-none cursor-pointer transition-all duration-300 focus:border-purple-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(139,92,246,0.12),0_0_0_1px_rgba(139,92,246,0.15)] text-zinc-400"
        style={{ colorScheme: 'dark' }}
      >
        <option value="" disabled className="bg-zinc-900 text-zinc-500">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>
        ))}
      </select>
    </div>
  )
}
