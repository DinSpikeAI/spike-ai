"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, LogIn, Check, Heart, Bookmark, Calendar, User } from "lucide-react";
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
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>("a1");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (!supabase) { setAuthChecking(false); setLoading(false); return; }
    async function load() {
      const { data: { session } } = await supabase!.auth.getSession();
      const u = session?.user || null;
      setUser(u); setAuthChecking(false);
      if (u) {
        const { data } = await supabase!.from("profiles").select("*").eq("id", u.id).single();
        if (data) { setDisplayName(data.display_name || ""); setBio(data.bio || ""); }
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

  const [stats, setStats] = useState({ watchlist: 0, upvotes: 0 });
  useEffect(() => {
    if (!supabase || !user) return;
    async function loadStats() {
      const { count: w } = await supabase!.from("watchlist").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: u } = await supabase!.from("user_votes").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      setStats({ watchlist: w || 0, upvotes: u || 0 });
    }
    loadStats();
  }, [user]);

  const initial = (displayName || user?.email || "U")[0].toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";
  const selAv = AVATARS.find(a => a.id === selectedAvatar);

  if (authChecking || loading) return <div className="min-h-screen bg-[#060608] flex items-center justify-center"><Loader2 className="w-6 h-6 text-white/15 animate-spin" /></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="w-24 h-24 rounded-[26px] bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-400/10 flex items-center justify-center shadow-lg shadow-violet-500/5">
        <LogIn size={36} className="text-violet-300/40" />
      </div>
      <h2 className="text-[36px] font-bold text-white tracking-tight">Your Profile</h2>
      <p className="text-[16px] text-white/25 max-w-sm">Sign in to manage your profile, see your stats, and customize your experience.</p>
      <button onClick={() => router.push("/auth")} className="px-10 py-4 bg-white text-black text-[15px] font-semibold rounded-full hover:bg-white/90 transition-all cursor-pointer">Sign In</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        {selAv && <div className={`absolute top-[5%] left-[50%] -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.04] blur-[100px] bg-gradient-to-br ${selAv.gradient} transition-all duration-1000`} />}
      </div>

      {/* Nav */}
      <div className="sticky top-0 z-50 bg-[#060608]/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[800px] mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white hover:border-white/20 transition-all cursor-pointer">
            <ArrowLeft size={16} />
          </button>
          <span className="text-[16px] font-semibold tracking-wide">Profile</span>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 pt-16 pb-20 relative z-10">
        {/* Avatar + Identity — CENTERED */}
        <div className="text-center mb-16">
          {/* Avatar with picker */}
          <div className="flex justify-center mb-7">
            <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="relative group cursor-pointer">
              <div className={`w-28 h-28 rounded-[28px] flex items-center justify-center text-4xl border-2 transition-all duration-500 shadow-2xl ${selAv ? `border-white/15 bg-gradient-to-br ${selAv.gradient}` : "border-white/[0.06] bg-gradient-to-br from-zinc-700 to-zinc-900"}`}
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                {selAv ? selAv.emoji : <span className="text-3xl font-semibold">{initial}</span>}
              </div>
              <div className="absolute inset-0 rounded-[28px] bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[11px] font-bold text-white tracking-wider uppercase">Change</p>
              </div>
              {selAv && <div className={`absolute -inset-6 rounded-[40px] blur-2xl -z-10 opacity-20 bg-gradient-to-br ${selAv.gradient}`} />}
            </button>
          </div>

          {/* Avatar Picker */}
          {showAvatarPicker && (
            <div className="mb-8" style={{ animation: "reveal 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="grid grid-cols-6 gap-2.5 max-w-[320px] mx-auto">
                {AVATARS.map((av) => (
                  <button key={av.id} onClick={() => { setSelectedAvatar(av.id); setShowAvatarPicker(false); }}
                    className={`aspect-square rounded-xl flex items-center justify-center text-lg cursor-pointer transition-all duration-300 bg-gradient-to-br ${av.gradient} ${selectedAvatar === av.id ? "ring-2 ring-white/40 scale-110" : "opacity-60 hover:opacity-100 hover:scale-110"}`}>
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <h1 className="text-[32px] font-bold tracking-tight">{displayName || "User"}</h1>
          <p className="text-[15px] text-white/25 mt-2">{user.email}</p>
          {memberSince && (
            <p className="text-[12px] text-white/12 mt-3 flex items-center justify-center gap-2 tracking-wider">
              <Calendar size={12} /> Member since {memberSince}
            </p>
          )}
        </div>

        {/* Stats — CENTERED */}
        <div className="grid grid-cols-2 gap-4 max-w-[400px] mx-auto mb-16">
          {[
            { label: "Watchlist", value: stats.watchlist, icon: Bookmark, gradient: "from-blue-500/10 to-indigo-500/5" },
            { label: "Upvotes", value: stats.upvotes, icon: Heart, gradient: "from-rose-500/10 to-pink-500/5" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.gradient} border border-white/[0.05] rounded-2xl p-6 text-center`}>
              <s.icon size={20} className="text-white/15 mx-auto mb-3" />
              <p className="text-[32px] font-bold tracking-tight">{s.value}</p>
              <p className="text-[11px] text-white/15 tracking-[0.2em] uppercase mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Form — CENTERED */}
        <div className="max-w-[460px] mx-auto space-y-5">
          <div>
            <label className="block text-[10px] font-bold tracking-[0.3em] text-white/12 uppercase mb-2.5 ml-1">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-[15px] text-[16px] text-white placeholder-white/12 focus:outline-none focus:border-white/15 transition-all tracking-wide"
              placeholder="Your name" />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-[0.3em] text-white/12 uppercase mb-2.5 ml-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-[15px] text-[16px] text-white placeholder-white/12 focus:outline-none focus:border-white/15 transition-all resize-none tracking-wide"
              placeholder="Tell us about yourself..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-[0.3em] text-white/12 uppercase mb-2.5 ml-1">Email</label>
            <div className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-5 py-[15px] text-[16px] text-white/15 tracking-wide">{user.email}</div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-[16px] bg-white text-black text-[15px] font-semibold rounded-full hover:bg-white/90 transition-all disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer mt-2"
            style={{ boxShadow: "0 4px 16px rgba(255,255,255,0.06)" }}>
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/[0.08] backdrop-blur-2xl border border-white/[0.06] text-white text-[14px] px-8 py-4 rounded-full z-[300] font-medium" style={{ animation: "reveal 0.3s ease" }}>
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes reveal { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}
