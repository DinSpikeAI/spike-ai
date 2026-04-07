"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, LogIn, Bell, Globe, Shield,
  LogOut, ChevronRight, Monitor,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [autoplay, setAutoplay] = useState(true);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (!supabase) { setAuthChecking(false); return; }
    async function check() {
      const { data: { session } } = await supabase!.auth.getSession();
      setUser(session?.user || null);
      setAuthChecking(false);
    }
    check();
    try {
      const n = localStorage.getItem("spike_notifs");
      if (n !== null) setNotificationsOn(n === "true");
      const a = localStorage.getItem("spike_autoplay");
      if (a !== null) setAutoplay(a === "true");
    } catch {}
  }, []);

  const toggleNotifs = () => { const v = !notificationsOn; setNotificationsOn(v); try { localStorage.setItem("spike_notifs", String(v)); } catch {} showToast(v ? "Notifications enabled" : "Notifications disabled"); };
  const toggleAutoplay = () => { const v = !autoplay; setAutoplay(v); try { localStorage.setItem("spike_autoplay", String(v)); } catch {} showToast(v ? "Autoplay enabled" : "Autoplay disabled"); };
  const handleSignOut = async () => { if (supabase) await supabase.auth.signOut(); showToast("Signed out"); setTimeout(() => router.push("/"), 500); };

  if (authChecking) return <div className="min-h-screen bg-[#060608] flex items-center justify-center"><Loader2 className="w-6 h-6 text-white/15 animate-spin" /></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center gap-8 px-6 text-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"><div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.8) 0%, transparent 70%)" }} /></div>
      <div className="relative z-10">
        <div className="w-24 h-24 rounded-[26px] bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-400/10 flex items-center justify-center mx-auto mb-8"><LogIn size={36} className="text-violet-300/40" /></div>
        <h2 className="text-[40px] font-bold text-white tracking-tight mb-3">Settings</h2>
        <p className="text-[16px] text-white/20 max-w-sm mx-auto mb-10">Sign in to manage your preferences.</p>
        <button onClick={() => router.push("/auth")} className="cta-btn px-10 py-4 text-black text-[15px] font-semibold rounded-full cursor-pointer">Sign In</button>
      </div>
    </div>
  );

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className={`w-[52px] h-[30px] rounded-full transition-all duration-300 cursor-pointer relative flex-shrink-0 ${on ? "bg-indigo-500" : "bg-white/[0.08]"}`}>
      <span className={`absolute top-[3px] w-[24px] h-[24px] rounded-full transition-all duration-300 shadow-md ${on ? "left-[25px] bg-white" : "left-[3px] bg-white/40"}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden">
      {/* ═══ Ambient Background ═══ */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7) 0%, rgba(139,92,246,0.3) 30%, transparent 70%)", animation: "glow 15s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* ── Nav ── */}
      <div className="sticky top-0 z-50 bg-[#060608]/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[600px] mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer"><ArrowLeft size={15} /></button>
          <span className="text-[15px] font-semibold tracking-wide text-white/50">Settings</span>
        </div>
      </div>

      {/* ═══ CENTERED CONTENT ═══ */}
      <div className="relative z-10 max-w-[600px] mx-auto px-6 pt-16 pb-20" style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Title */}
        <div className="text-center mb-14">
          <h1 className="text-[42px] md:text-[52px] font-bold tracking-tight mb-3">
            Prefer<span className="bg-gradient-to-r from-white/40 via-indigo-300/50 to-violet-400/40 bg-clip-text text-transparent">ences</span>
          </h1>
          <p className="text-[16px] text-white/20">Customize your spike AI experience.</p>
        </div>

        <div className="space-y-8">
          {/* ═══ GENERAL ═══ */}
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.25em] text-white/25 uppercase mb-3 ml-1">General</h2>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden divide-y divide-white/[0.04] backdrop-blur-xl">
              <div className="flex items-center justify-between px-5 py-[18px] hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20"><Bell size={16} className="text-white" /></div>
                  <div><p className="text-[15px] font-medium">Notifications</p><p className="text-[12px] text-white/20 mt-0.5">New film alerts and updates</p></div>
                </div>
                <Toggle on={notificationsOn} onToggle={toggleNotifs} />
              </div>
              <div className="flex items-center justify-between px-5 py-[18px] hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20"><Monitor size={16} className="text-white" /></div>
                  <div><p className="text-[15px] font-medium">Autoplay Trailers</p><p className="text-[12px] text-white/20 mt-0.5">Play trailers on hover</p></div>
                </div>
                <Toggle on={autoplay} onToggle={toggleAutoplay} />
              </div>
            </div>
          </div>

          {/* ═══ ACCOUNT ═══ */}
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.25em] text-white/25 uppercase mb-3 ml-1">Account</h2>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden divide-y divide-white/[0.04] backdrop-blur-xl">
              <div className="flex items-center justify-between px-5 py-[18px]">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"><Globe size={16} className="text-white" /></div>
                  <div><p className="text-[15px] font-medium">Email</p><p className="text-[12px] text-white/20 mt-0.5">{user.email}</p></div>
                </div>
              </div>
              <div onClick={() => router.push("/profile")} className="flex items-center justify-between px-5 py-[18px] cursor-pointer hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20"><Shield size={16} className="text-white" /></div>
                  <p className="text-[15px] font-medium group-hover:text-white transition-colors">Edit Profile</p>
                </div>
                <ChevronRight size={17} className="text-white/12 group-hover:text-white/25 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SIGN OUT ═══ */}
        <div className="mt-16 text-center">
          <button onClick={handleSignOut} className="inline-flex items-center gap-2.5 px-8 py-3.5 text-[14px] font-medium text-red-400/50 hover:text-red-400/80 border border-red-500/[0.06] hover:border-red-500/15 rounded-full hover:bg-red-500/[0.04] transition-all cursor-pointer">
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="mt-20 text-center"><span className="text-[14px] font-semibold tracking-[0.2em] text-white/[0.04]">spike AI</span></div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/[0.06] backdrop-blur-2xl border border-white/[0.06] text-white text-[14px] px-8 py-4 rounded-full z-[300] font-medium shadow-2xl" style={{ animation: "reveal 0.3s ease" }}>{toast}</div>
      )}

      <style jsx>{`
        .cta-btn { background: linear-gradient(180deg, #fff 0%, #e4e4e7 100%); box-shadow: 0 4px 20px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.9); }
        @keyframes reveal { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes glow { 0%,100% { opacity:0.04; transform:translate(-50%,0) scale(1) } 50% { opacity:0.07; transform:translate(-50%,0) scale(1.1) } }
      `}</style>
    </div>
  );
}
