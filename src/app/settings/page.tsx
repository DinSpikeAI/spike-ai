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
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-8 px-6">
        <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
          <LogIn size={36} className="text-white/15" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-white tracking-tight">Settings</h2>
          <p className="text-[16px] text-white/30 mt-3 tracking-wide">Sign in to manage your preferences.</p>
        </div>
        <button onClick={() => router.push("/auth")} className="px-10 py-4 bg-white text-black text-[15px] font-semibold tracking-wide rounded-full hover:bg-white/90 transition-all cursor-pointer">
          Sign In
        </button>
      </div>
    );
  }

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle}
      className={`w-14 h-8 rounded-full transition-all duration-300 cursor-pointer relative ${on ? "bg-white" : "bg-white/[0.08]"}`}>
      <span className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 shadow-sm ${on ? "left-[26px] bg-black" : "left-1 bg-white/30"}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-white/30 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-[17px] font-semibold tracking-wide">Settings</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-12 pb-20">

        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight">Preferences</h1>
          <p className="text-[16px] text-white/25 mt-2">Customize your spike AI experience.</p>
        </div>

        <div className="space-y-10">

          {/* Preferences */}
          <div>
            <h2 className="text-[12px] font-semibold tracking-[0.2em] text-white/20 uppercase mb-4 px-1">General</h2>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <Bell size={18} className="text-white/30" />
                  </div>
                  <div>
                    <p className="text-[15px] font-medium tracking-wide">Notifications</p>
                    <p className="text-[13px] text-white/25 tracking-wide mt-0.5">Show new film alerts</p>
                  </div>
                </div>
                <Toggle on={notificationsOn} onToggle={toggleNotifs} />
              </div>
              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <Monitor size={18} className="text-white/30" />
                  </div>
                  <div>
                    <p className="text-[15px] font-medium tracking-wide">Autoplay Trailers</p>
                    <p className="text-[13px] text-white/25 tracking-wide mt-0.5">Play trailers on hover</p>
                  </div>
                </div>
                <Toggle on={autoplay} onToggle={toggleAutoplay} />
              </div>
            </div>
          </div>

          {/* Account */}
          <div>
            <h2 className="text-[12px] font-semibold tracking-[0.2em] text-white/20 uppercase mb-4 px-1">Account</h2>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <Globe size={18} className="text-white/30" />
                  </div>
                  <div>
                    <p className="text-[15px] font-medium tracking-wide">Email</p>
                    <p className="text-[13px] text-white/25 tracking-wide mt-0.5">{user.email}</p>
                  </div>
                </div>
              </div>
              <div onClick={() => router.push("/profile")} className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <Shield size={18} className="text-white/30" />
                  </div>
                  <p className="text-[15px] font-medium tracking-wide">Edit Profile</p>
                </div>
                <ChevronRight size={18} className="text-white/15" />
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <div>
            <h2 className="text-[12px] font-semibold tracking-[0.2em] text-white/20 uppercase mb-4 px-1">Session</h2>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
              <div onClick={handleSignOut} className="flex items-center gap-4 px-6 py-5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <LogOut size={18} className="text-white/30" />
                </div>
                <p className="text-[15px] font-medium tracking-wide text-white/50">Sign Out</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/[0.08] backdrop-blur-2xl border border-white/[0.06] text-white text-[14px] tracking-wide px-8 py-4 rounded-full z-[300] font-medium" style={{ animation: "fadeInUp 0.3s ease" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
