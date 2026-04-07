"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, LogIn, Check, Heart, Bookmark, Calendar, User, Film, BadgeCheck, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";

const AVATARS = [
  { id: "a1", gradient: "from-violet-500 to-indigo-700", emoji: "🎬" },
  { id: "a2", gradient: "from-cyan-400 to-blue-600", emoji: "🚀" },
  { id: "a3", gradient: "from-rose-400 to-pink-600", emoji: "🎭" },
  { id: "a4", gradient: "from-amber-400 to-orange-600", emoji: "⚡" },
  { id: "a5", gradient: "from-emerald-400 to-teal-600", emoji: "🌊" },
  { id: "a6", gradient: "from-fuchsia-400 to-purple-600", emoji: "🔮" },
  { id: "a7", gradient: "from-red-400 to-rose-700", emoji: "🎯" },
  { id: "a8", gradient: "from-sky-300 to-indigo-500", emoji: "✨" },
  { id: "a9", gradient: "from-lime-400 to-green-600", emoji: "🌿" },
  { id: "a10", gradient: "from-orange-300 to-red-500", emoji: "🔥" },
  { id: "a11", gradient: "from-indigo-300 to-violet-600", emoji: "🎵" },
  { id: "a12", gradient: "from-teal-300 to-cyan-600", emoji: "💎" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("a1");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "films">("edit");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (!supabase) { setAuthChecking(false); setLoading(false); return; }
    async function load() {
      const { data: { session } } = await supabase!.auth.getSession();
      const u = session?.user || null;
      setUser(u); setAuthChecking(false);
      if (u) {
        const { data } = await supabase!.from("profiles").select("*").eq("id", u.id).single();
        if (data) { setProfile(data); setDisplayName(data.display_name || ""); setBio(data.bio || ""); }
        else setDisplayName(u.user_metadata?.display_name || u.user_metadata?.full_name || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: displayName.trim(), bio: bio.trim(), email: user.email }, { onConflict: "id" });
    if (!error) { showToast("Profile saved"); await supabase.auth.updateUser({ data: { display_name: displayName.trim() } }); }
    else showToast("Error saving");
    setSaving(false);
  };

  const [stats, setStats] = useState({ watchlist: 0, upvotes: 0, films: 0 });
  useEffect(() => {
    if (!supabase || !user) return;
    async function loadStats() {
      const { count: w } = await supabase!.from("watchlist").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: u } = await supabase!.from("user_votes").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: f } = await supabase!.from("movies").select("*", { count: "exact", head: true }).eq("creator_id", user.id).eq("status", "approved");
      setStats({ watchlist: w || 0, upvotes: u || 0, films: f || 0 });
    }
    loadStats();
  }, [user]);

  const initial = (displayName || user?.email || "U")[0].toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
  const selAv = AVATARS.find(a => a.id === selectedAvatar);

  if (authChecking || loading) return <div className="min-h-screen bg-[#060608] flex items-center justify-center"><Loader2 className="w-6 h-6 text-white/15 animate-spin" /></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="w-24 h-24 rounded-[26px] bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-400/10 flex items-center justify-center">
        <LogIn size={36} className="text-violet-300/40" />
      </div>
      <h2 className="text-[36px] font-bold text-white tracking-tight">Your Profile</h2>
      <p className="text-[16px] text-white/25 max-w-sm">Sign in to manage your profile and see your stats.</p>
      <button onClick={() => router.push("/auth")} className="px-10 py-4 bg-white text-black text-[15px] font-semibold rounded-full hover:bg-white/90 transition-all cursor-pointer">Sign In</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060608] text-white">
      {/* ── Nav ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#060608]/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[900px] mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer">
            <ArrowLeft size={15} />
          </button>
          <span className="text-[15px] font-semibold tracking-wide text-white/50">Profile</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
           CINEMATIC BANNER
         ═══════════════════════════════════════════ */}
      <div className="relative h-[220px] md:h-[280px] overflow-hidden">
        {/* Banner gradient — changes with avatar color */}
        <div className={`absolute inset-0 bg-gradient-to-br ${selAv?.gradient || "from-zinc-800 to-zinc-900"} opacity-40 transition-all duration-1000`} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060608]" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        {/* Ambient glow */}
        <div className={`absolute top-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-[0.15] bg-gradient-to-r ${selAv?.gradient || "from-zinc-600 to-zinc-700"} transition-all duration-1000`} />
      </div>

      {/* ═══════════════════════════════════════════
           AVATAR — overlapping the banner
         ═══════════════════════════════════════════ */}
      <div className="relative max-w-[900px] mx-auto px-6" style={{ marginTop: "-72px" }}>
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="relative group cursor-pointer mb-6">
            <div className={`w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-[32px] md:rounded-[36px] flex items-center justify-center text-5xl md:text-6xl border-[3px] border-[#060608] ring-2 ring-white/[0.08] transition-all duration-500 shadow-2xl bg-gradient-to-br ${selAv?.gradient || "from-zinc-700 to-zinc-900"}`}
              style={{ boxShadow: "0 16px 64px rgba(0,0,0,0.7)" }}>
              {selAv ? selAv.emoji : <span className="text-4xl font-bold">{initial}</span>}
            </div>
            {/* Edit overlay */}
            <div className="absolute inset-0 rounded-[32px] md:rounded-[36px] bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <Pencil size={22} className="text-white/80" />
            </div>
          </button>

          {/* Avatar Picker */}
          {showAvatarPicker && (
            <div className="mb-8 p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl backdrop-blur-xl" style={{ animation: "reveal 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
              <p className="text-[10px] font-bold tracking-[0.3em] text-white/15 uppercase mb-4">Choose Avatar</p>
              <div className="grid grid-cols-6 gap-2.5">
                {AVATARS.map((av) => (
                  <button key={av.id} onClick={() => { setSelectedAvatar(av.id); setShowAvatarPicker(false); }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all duration-300 bg-gradient-to-br ${av.gradient} ${selectedAvatar === av.id ? "ring-2 ring-white/50 scale-110" : "opacity-50 hover:opacity-100 hover:scale-110"}`}>
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name + Badge */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[36px] md:text-[44px] font-bold tracking-tight">{displayName || "User"}</h1>
            <BadgeCheck size={24} className="text-blue-400/70 mt-1" />
          </div>

          {/* Email + Member date */}
          <p className="text-[14px] text-white/20 tracking-wide">{user.email}</p>

          {/* ── Inline Stats Row ── */}
          <div className="flex items-center gap-6 mt-5 mb-2">
            {[
              { value: stats.films, label: "Films" },
              { value: stats.upvotes, label: "Upvotes" },
              { value: stats.watchlist, label: "Watchlist" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-white/[0.06] mr-4">·</span>}
                <span className="text-[18px] font-bold text-white/80">{s.value}</span>
                <span className="text-[13px] text-white/20">{s.label}</span>
              </div>
            ))}
          </div>

          {memberSince && (
            <p className="text-[11px] text-white/10 tracking-[0.15em] mt-1 flex items-center gap-1.5">
              <Calendar size={10} /> Joined {memberSince}
            </p>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
           TABS
         ═══════════════════════════════════════════ */}
      <div className="max-w-[900px] mx-auto px-6 mt-10">
        <div className="flex items-center gap-1 border-b border-white/[0.04] mb-10">
          {[
            { id: "edit" as const, label: "Edit Profile", icon: Pencil },
            { id: "films" as const, label: "My Films", icon: Film },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-semibold tracking-wide transition-all cursor-pointer border-b-2 -mb-px ${activeTab === tab.id ? "text-white border-white" : "text-white/20 border-transparent hover:text-white/40"}`}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Edit Tab ── */}
        {activeTab === "edit" && (
          <div className="max-w-[480px] mx-auto pb-20" style={{ animation: "reveal 0.5s ease" }}>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.3em] text-white/10 uppercase mb-2.5 ml-1">Display Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-[15px] text-[17px] text-white placeholder-white/10 focus:outline-none focus:border-indigo-500/30 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(99,102,241,0.05)] transition-all tracking-wide"
                  placeholder="Your name" />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.3em] text-white/10 uppercase mb-2.5 ml-1">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-[15px] text-[17px] text-white placeholder-white/10 focus:outline-none focus:border-indigo-500/30 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(99,102,241,0.05)] transition-all resize-none tracking-wide"
                  placeholder="AI filmmaker, visual storyteller..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.3em] text-white/10 uppercase mb-2.5 ml-1">Email</label>
                <div className="w-full bg-white/[0.015] border border-white/[0.04] rounded-xl px-5 py-[15px] text-[16px] text-white/15 tracking-wide">{user.email}</div>
              </div>

              {/* Save — not full width, gradient, right-aligned */}
              <div className="flex justify-end pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="save-btn px-8 py-[13px] text-[14px] font-semibold rounded-full flex items-center gap-2.5 disabled:opacity-30 cursor-pointer transition-all active:scale-[0.97]">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Films Tab ── */}
        {activeTab === "films" && (
          <div className="text-center py-20" style={{ animation: "reveal 0.5s ease" }}>
            <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mx-auto mb-6">
              <Film size={32} className="text-white/10" />
            </div>
            <h3 className="text-[20px] font-semibold mb-2">No films yet</h3>
            <p className="text-[14px] text-white/20 max-w-sm mx-auto mb-8">Submit your first AI film and it will appear here with full stats and analytics.</p>
            <button onClick={() => router.push("/submit")}
              className="save-btn px-8 py-[13px] text-[14px] font-semibold rounded-full inline-flex items-center gap-2 cursor-pointer">
              Submit a Film <Film size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/[0.08] backdrop-blur-2xl border border-white/[0.06] text-white text-[14px] px-8 py-4 rounded-full z-[300] font-medium shadow-2xl" style={{ animation: "reveal 0.3s ease" }}>
          {toast}
        </div>
      )}

      <style jsx>{`
        .save-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 2px 12px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .save-btn:hover:not(:disabled) {
          box-shadow: 0 4px 24px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }
        @keyframes reveal { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}
