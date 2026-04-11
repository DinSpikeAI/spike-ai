"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, LogIn, Check, Heart, Bookmark, Calendar, User, Film, BadgeCheck, Pencil, Sparkles } from "lucide-react";
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
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [socialX, setSocialX] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [userType, setUserType] = useState("viewer");
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
        if (data) {
          setDisplayName(data.display_name || "");
          setBio(data.bio || "");
          setWebsite(data.website || "");
          setSocialX(data.social_x || "");
          setSocialYoutube(data.social_youtube || "");
          setSocialInstagram(data.social_instagram || "");
          setUserType(data.user_type || "viewer");
        }
        else setDisplayName(u.user_metadata?.display_name || u.user_metadata?.full_name || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName.trim(),
      bio: bio.trim(),
      email: user.email,
      website: website.trim(),
      social_x: socialX.trim(),
      social_youtube: socialYoutube.trim(),
      social_instagram: socialInstagram.trim(),
    }, { onConflict: "id" });
    if (!error) { showToast("Profile saved"); await supabase.auth.updateUser({ data: { display_name: displayName.trim() } }); }
    else showToast("Error saving");
    setSaving(false);
  };

  const [stats, setStats] = useState({ watchlist: 0, upvotes: 0, films: 0 });
  useEffect(() => {
    if (!supabase || !user) return;
    async function s() {
      const { count: w } = await supabase!.from("watchlist").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: u } = await supabase!.from("user_votes").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: f } = await supabase!.from("movies").select("*", { count: "exact", head: true }).eq("creator_id", user.id).eq("status", "approved");
      setStats({ watchlist: w || 0, upvotes: u || 0, films: f || 0 });
    }
    s();
  }, [user]);

  const initial = (displayName || user?.email || "U")[0].toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
  const selAv = AVATARS.find(a => a.id === selectedAvatar);

  if (authChecking || loading) return <div className="min-h-screen bg-[#060608] flex items-center justify-center"><Loader2 className="w-6 h-6 text-indigo-400/30 animate-spin" /></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"><div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.8) 0%, transparent 70%)" }} /></div>
      <div className="text-center relative z-10" style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-400/10 flex items-center justify-center mx-auto mb-8"><LogIn size={36} className="text-violet-300/40" /></div>
        <h2 className="text-[40px] font-bold text-white tracking-[-0.02em] mb-3">Your Profile</h2>
        <p className="text-[16px] text-white/20 mb-10 max-w-sm mx-auto">Sign in to manage your profile and see your stats.</p>
        <button onClick={() => router.push("/auth")} className="cta-btn px-10 py-4 text-black text-[15px] font-bold rounded-full cursor-pointer">Sign In</button>
      </div>
      <style jsx>{`.cta-btn{background:linear-gradient(180deg,#fff 0%,#e4e4e7 100%);box-shadow:0 4px 24px rgba(255,255,255,0.08),0 0 60px rgba(99,102,241,0.06),inset 0 1px 0 rgba(255,255,255,0.9)} @keyframes reveal{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden">
      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />

      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#060608]/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[850px] mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer"><ArrowLeft size={15} /></button>
          <span className="text-[15px] font-semibold tracking-wide text-white/40">Profile</span>
        </div>
      </div>

      {/* ═══ CENTERED CONTAINER — 850px ═══ */}
      <div className="max-w-[850px] mx-auto relative" style={{ animation: "reveal 0.7s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* ═══ CINEMATIC BANNER ═══ */}
        <div className="relative h-[240px] md:h-[300px] overflow-hidden rounded-b-3xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${selAv?.gradient || "from-zinc-800 to-zinc-900"} opacity-50 transition-all duration-1000`} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060608]" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className={`absolute top-[30%] left-[50%] -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[100px] opacity-30 bg-gradient-to-r ${selAv?.gradient || "from-zinc-600 to-zinc-700"} transition-all duration-1000`} />
        </div>

        {/* ═══ AVATAR — Circle, centered, neon glow, overlapping banner ═══ */}
        <div className="flex flex-col items-center text-center" style={{ marginTop: "-80px" }}>
          <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="relative group cursor-pointer mb-6">
            {/* Neon rim glow */}
            <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${selAv?.gradient || "from-zinc-600 to-zinc-700"} opacity-60 blur-sm transition-all duration-500 group-hover:opacity-80`} />
            {/* Avatar circle */}
            <div className={`relative w-[130px] h-[130px] md:w-[150px] md:h-[150px] rounded-full flex items-center justify-center text-5xl md:text-6xl border-[4px] border-[#060608] transition-all duration-500 bg-gradient-to-br ${selAv?.gradient || "from-zinc-700 to-zinc-900"}`}
              style={{ boxShadow: "0 12px 48px rgba(0,0,0,0.7)" }}>
              {selAv ? selAv.emoji : <span className="text-4xl font-bold">{initial}</span>}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Pencil size={24} className="text-white/80" /></div>
          </button>

          {/* Avatar Picker */}
          {showAvatarPicker && (
            <div className="mb-8 p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl backdrop-blur-xl" style={{ animation: "reveal 0.3s ease" }}>
              <div className="grid grid-cols-6 gap-2.5">
                {AVATARS.map((av) => (
                  <button key={av.id} onClick={() => { setSelectedAvatar(av.id); setShowAvatarPicker(false); }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl cursor-pointer transition-all duration-300 bg-gradient-to-br ${av.gradient} ${selectedAvatar === av.id ? "ring-2 ring-white/50 scale-110" : "opacity-50 hover:opacity-100 hover:scale-110"}`}>
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name + Verified + Creator Badge */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[38px] md:text-[48px] font-bold tracking-[-0.02em]">{displayName || "User"}</h1>
            <div className="relative">
              <BadgeCheck size={26} className="text-blue-400" />
              <div className="absolute -inset-1 bg-blue-400/20 rounded-full blur-md -z-10" />
            </div>
            {userType === "creator" && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase bg-green-500/10 border border-green-500/20 text-green-400">Creator</span>
            )}
          </div>
          <p className="text-[15px] text-white/20 tracking-wide">{user.email}</p>
          {userType === "creator" && (
            <button onClick={() => router.push(`/creator/${user.id}`)} className="mt-2 text-[12px] text-indigo-400/50 hover:text-indigo-400/80 tracking-wide transition-colors flex items-center gap-1">
              View Public Profile →
            </button>
          )}

          {/* ═══ GLASS STAT CARDS ═══ */}
          <div className="flex items-center gap-4 mt-8 mb-3">
            {[
              { value: stats.films, label: "Films", icon: Film },
              { value: stats.upvotes, label: "Upvotes", icon: Heart },
              { value: stats.watchlist, label: "Watchlist", icon: Bookmark },
            ].map((s) => (
              <div key={s.label} className="glass-card px-6 py-4 rounded-2xl text-center min-w-[110px]">
                <s.icon size={16} className="text-white/20 mx-auto mb-2" />
                <p className="text-[24px] font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-white/20 tracking-[0.15em] uppercase mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {memberSince && (
            <p className="text-[11px] text-white/10 tracking-[0.15em] mt-2 flex items-center gap-1.5"><Calendar size={10} /> Joined {memberSince}</p>
          )}
        </div>

        {/* ═══ TABS — centered, purple indicator ═══ */}
        <div className="flex items-center justify-center gap-1 mt-10 mb-10">
          {[
            { id: "edit" as const, label: "Edit Profile", icon: Pencil },
            { id: "films" as const, label: "My Films", icon: Film },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-[14px] font-semibold tracking-wide transition-all cursor-pointer rounded-full ${activeTab === tab.id ? "text-white bg-white/[0.06] shadow-lg shadow-indigo-500/5" : "text-white/20 hover:text-white/40"}`}>
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ EDIT TAB ═══ */}
        {activeTab === "edit" && (
          <div className="max-w-[500px] mx-auto px-6 pb-20" style={{ animation: "reveal 0.5s ease" }}>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold tracking-[0.3em] text-white/15 uppercase mb-3 ml-1">Display Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl px-6 py-[16px] text-[17px] text-white placeholder-white/12 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_30px_rgba(99,102,241,0.08)] transition-all tracking-wide"
                  placeholder="Your name" />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-[0.3em] text-white/15 uppercase mb-3 ml-1">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl px-6 py-[16px] text-[17px] text-white placeholder-white/12 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_30px_rgba(99,102,241,0.08)] transition-all resize-none tracking-wide"
                  placeholder="AI filmmaker, visual storyteller..." />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-[0.3em] text-white/15 uppercase mb-3 ml-1">Email</label>
                <div className="w-full bg-white/[0.015] border border-white/[0.04] rounded-2xl px-6 py-[16px] text-[16px] text-white/15 tracking-wide">{user.email}</div>
              </div>

              {/* ═══ Creator Fields (only for creators) ═══ */}
              {userType === "creator" && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-2" />
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-green-400/60" />
                    <span className="text-[11px] font-bold tracking-[0.2em] text-green-400/50 uppercase">Creator Profile</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.3em] text-white/15 uppercase mb-3 ml-1">Website / Portfolio</label>
                    <input value={website} onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl px-6 py-[16px] text-[17px] text-white placeholder-white/12 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_30px_rgba(99,102,241,0.08)] transition-all tracking-wide"
                      placeholder="https://yoursite.com" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold tracking-[0.3em] text-white/15 uppercase mb-3 ml-1">X / Twitter</label>
                      <input value={socialX} onChange={(e) => setSocialX(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl px-6 py-[14px] text-[15px] text-white placeholder-white/12 focus:outline-none focus:border-indigo-500/40 transition-all tracking-wide"
                        placeholder="@username" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-[0.3em] text-white/15 uppercase mb-3 ml-1">YouTube</label>
                      <input value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl px-6 py-[14px] text-[15px] text-white placeholder-white/12 focus:outline-none focus:border-indigo-500/40 transition-all tracking-wide"
                        placeholder="@channel" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-[0.3em] text-white/15 uppercase mb-3 ml-1">Instagram</label>
                      <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl px-6 py-[14px] text-[15px] text-white placeholder-white/12 focus:outline-none focus:border-indigo-500/40 transition-all tracking-wide"
                        placeholder="@username" />
                    </div>
                  </div>
                </>
              )}

              {/* Save — pill, centered, not full width */}
              <div className="flex justify-center pt-4">
                <button onClick={handleSave} disabled={saving}
                  className="save-btn px-10 py-[15px] text-[14px] font-bold rounded-full flex items-center gap-2.5 disabled:opacity-30 cursor-pointer transition-all active:scale-[0.97]">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FILMS TAB ═══ */}
        {activeTab === "films" && (
          <div className="text-center py-24 px-6" style={{ animation: "reveal 0.5s ease" }}>
            <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mx-auto mb-6">
              <Film size={32} className="text-white/12" />
            </div>
            <h3 className="text-[22px] font-bold mb-3">No films yet</h3>
            <p className="text-[14px] text-white/20 max-w-sm mx-auto mb-10">Submit your first AI film and it will appear here.</p>
            <button onClick={() => router.push("/submit")}
              className="save-btn px-8 py-[14px] text-[14px] font-bold rounded-full inline-flex items-center gap-2.5 cursor-pointer">
              Submit a Film <Film size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-white/[0.06] backdrop-blur-2xl border border-white/[0.06] text-white text-[14px] px-8 py-4 rounded-full font-medium shadow-2xl" style={{ animation: "reveal 0.3s ease" }}>{toast}</div>
      )}

      <style jsx>{`
        .glass-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .save-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .save-btn:hover:not(:disabled) {
          box-shadow: 0 6px 30px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }
        .cta-btn{background:linear-gradient(180deg,#fff 0%,#e4e4e7 100%);box-shadow:0 4px 24px rgba(255,255,255,0.08),inset 0 1px 0 rgba(255,255,255,0.9)}
        @keyframes reveal { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}
