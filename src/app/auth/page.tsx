'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight, Sparkles, Eye, EyeOff, Film, Mail } from 'lucide-react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const handleSignIn = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Enter your email first')
      return
    }
    setMagicLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setMagicSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link')
    } finally {
      setMagicLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSignIn()
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-white flex flex-col relative overflow-hidden">

      {/* ── Ambient lighting ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Center glow behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-600/[0.04] blur-[160px]" />
        {/* Subtle accent */}
        <div className="absolute bottom-[-150px] left-[-100px] w-[400px] h-[400px] rounded-full bg-indigo-600/[0.03] blur-[120px]" />
        <div className="absolute top-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-violet-600/[0.03] blur-[100px]" />
      </div>

      {/* ── Top nav ── */}
      <nav className="relative z-10 px-6 py-5 flex items-center justify-between max-w-screen-xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <Film className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
          <span className="text-sm font-semibold tracking-[0.25em] uppercase text-zinc-300 group-hover:text-white transition-colors">
            Spike AI
          </span>
        </Link>
        <Link
          href="/signup"
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          Create account
        </Link>
      </nav>

      {/* ── Main centered content ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div
          className="w-full max-w-[420px]"
          style={{
            animation: 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            opacity: 0,
          }}
        >
          {/* Headline */}
          <header className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-6 backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h1
              className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-3"
              style={{
                textShadow: '0 0 80px rgba(139, 92, 246, 0.15)',
              }}
            >
              Welcome<br />back.
            </h1>
            <p className="text-base text-zinc-500">
              Sign in to continue to Spike AI.
            </p>
          </header>

          {/* Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-7 space-y-5 shadow-[0_0_60px_rgba(0,0,0,0.3)]">

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Magic link sent */}
            {magicSent && (
              <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 text-center">
                Magic link sent! Check your inbox.
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500">
                Email
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="
                  w-full px-4 py-3.5 rounded-xl text-[15px] text-white placeholder-zinc-600
                  bg-white/[0.03] backdrop-blur-sm
                  border border-white/[0.07]
                  outline-none transition-all duration-200
                  focus:border-purple-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(139,92,246,0.08)]
                "
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="
                    w-full px-4 py-3.5 pr-12 rounded-xl text-[15px] text-white placeholder-zinc-600
                    bg-white/[0.03] backdrop-blur-sm
                    border border-white/[0.07]
                    outline-none transition-all duration-200
                    focus:border-purple-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(139,92,246,0.08)]
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              onClick={handleSignIn}
              disabled={loading || !email || !password}
              className={`
                w-full py-3.5 px-6 rounded-xl text-[15px] font-semibold
                flex items-center justify-center gap-2.5
                transition-all duration-300 cursor-pointer
                ${loading || !email || !password
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-zinc-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-[0.98]'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-zinc-600 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Magic link button */}
            <button
              onClick={handleMagicLink}
              disabled={magicLoading}
              className="
                w-full py-3.5 px-6 rounded-xl text-[15px] font-medium
                flex items-center justify-center gap-2.5
                bg-white/[0.04] border border-white/[0.07] text-zinc-300
                hover:bg-white/[0.07] hover:border-white/[0.12] hover:text-white
                transition-all duration-200 cursor-pointer
              "
            >
              {magicLoading ? (
                <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mail className="w-4 h-4 text-purple-400" />
              )}
              {magicLoading ? 'Sending...' : 'Magic link'}
            </button>
          </div>

          {/* Bottom links */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-zinc-500">
              New to Spike AI?{' '}
              <Link href="/signup" className="text-white font-medium hover:underline underline-offset-4">
                Create account
              </Link>
            </p>
            <p className="text-[11px] text-zinc-700">
              By continuing you agree to Spike AI&apos;s{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-500 transition-colors">Terms</Link>
              {' & '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-500 transition-colors">Privacy</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Fade-up animation */}
      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
