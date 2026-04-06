"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, LogIn, Bell, BellOff, Moon,
  Globe, Shield, Trash2, LogOut, ChevronRight, Monitor,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Local prefs (stored in localStorage)
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

    // Load prefs
    try {
      const n = localStorage.getItem("spike_notifs");
      if (n !== null) setNotificationsOn(n === "true");
      const a = localStorage.getItem("spike_autoplay");
      if (a !== null) setAutoplay(a === "true");
    } catch {}
  }, []);

  const toggleNotifs = () => {
    const val = !notificationsOn;
    setNotificationsOn(val);
    try { localStorage.setItem("spike_notifs", String(val)); } catch {}
    showToast(val ? "Notifications enabled" : "Notifications disabled");
  };

  const toggleAutoplay = () => {
    const val = !autoplay;
    setAutoplay(val);
    try { localStorage.setItem("spike_autoplay", String(val)); } catch {}
    showToast(val ? "Autoplay enabled" : "Autoplay disabled");
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    showToast("Signed out");
    setTimeout(() => router.push("/"), 500);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <LogIn size={24} className="text-white/30" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white tracking-wide">Sign in to access settings</h2>
          <p className="text-sm text-white/40 mt-2 tracking-wide">Manage your preferences and account.</p>
        </div>
        <button onClick={() => router.push("/auth")} className="px-8 py-3 bg-white text-black text-sm font-semibold tracking-wide rounded-full hover:bg-white/90 transition-all">
          Sign In
        </button>
      </div>
    );
  }

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-12 h-7 rounded-full transition-all duration-300 cursor-pointer relative ${on ? "bg-white" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 ${on ? "left-[22px] bg-black" : "left-0.5 bg-white/40"}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-white/40 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-[15px] font-semibold tracking-wide">Settings</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* ── Preferences ── */}
        <div>
          <h2 className="text-[11px] font-medium tracking-widest text-white/30 uppercase mb-3 px-1">Preferences</h2>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-white/30" />
                <div>
                  <p className="text-[14px] font-medium tracking-wide">Notifications</p>
                  <p className="text-[11px] text-white/30 tracking-wide">Show new film alerts</p>
                </div>
              </div>
              <Toggle on={notificationsOn} onToggle={toggleNotifs} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Monitor size={18} className="text-white/30" />
                <div>
                  <p className="text-[14px] font-medium tracking-wide">Autoplay Trailers</p>
                  <p className="text-[11px] text-white/30 tracking-wide">Play trailers on hover</p>
                </div>
              </div>
              <Toggle on={autoplay} onToggle={toggleAutoplay} />
            </div>
          </div>
        </div>

        {/* ── Account ── */}
        <div>
          <h2 className="text-[11px] font-medium tracking-widest text-white/30 uppercase mb-3 px-1">Account</h2>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-white/30" />
                <div>
                  <p className="text-[14px] font-medium tracking-wide">Email</p>
                  <p className="text-[11px] text-white/30 tracking-wide">{user.email}</p>
                </div>
              </div>
            </div>
            <div
              onClick={() => router.push("/profile")}
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-white/30" />
                <p className="text-[14px] font-medium tracking-wide">Edit Profile</p>
              </div>
              <ChevronRight size={16} className="text-white/20" />
            </div>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div>
          <h2 className="text-[11px] font-medium tracking-widest text-white/30 uppercase mb-3 px-1">Account Actions</h2>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            <div
              onClick={handleSignOut}
              className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <LogOut size={18} className="text-white/40" />
              <p className="text-[14px] font-medium tracking-wide text-white/60">Sign Out</p>
            </div>
          </div>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/[0.08] text-white text-sm tracking-wide px-6 py-3 rounded-full z-[300]" style={{ animation: "fadeInUp 0.3s ease" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
