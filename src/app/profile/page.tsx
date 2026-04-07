"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, LogIn, Check, Heart, Bookmark, Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (!supabase) { setAuthChecking(false); setLoading(false); return; }
    async function load() {
      const { data: { session } } = await supabase!.auth.getSession();
      const u = session?.user || null;
      setUser(u);
      setAuthChecking(false);
      if (u) {
        const { data } = await supabase!.from("profiles").select("*").eq("id", u.id).single();
        if (data) {
          setProfile(data);
          setDisplayName(data.display_name || u.user_metadata?.display_name || "");
          setBio(data.bio || "");
        } else {
          setDisplayName(u.user_metadata?.display_name || u.user_metadata?.full_name || "");
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName.trim(), bio: bio.trim(), email: user.email }, { onConflict: "id" });
    if (!error) {
      showToast("Profile saved");
      await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
    } else showToast("Error saving profile");
    setSaving(false);
  };

  const [stats, setStats] = useState({ watchlist: 0, upvotes: 0 });
  useEffect(() => {
    if (!supabase || !user) return;
    async function loadStats() {
      const { count: wCount } = await supabase!.from("watchlist").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: uCount } = await supabase!.from("user_votes").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      setStats({ watchlist: wCount || 0, upvotes: uCount || 0 });
    }
    loadStats();
  }, [user]);

  const initial = (displayName || user?.email || "U")[0].toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  if (authChecking || loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-6 h-6 text-white/20 animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-8 px-6">
        <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
          <LogIn size={36} className="text-white/15" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-white tracking-tight">Your Profile</h2>
          <p className="text-[16px] text-white/30 mt-3">Sign in to manage your profile and see your stats.</p>
        </div>
        <button onClick={() => router.push("/auth")} className="px-10 py-4 bg-white text-black text-[15px] font-semibold tracking-wide rounded-full hover:bg-white/90 transition-all cursor-pointer">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-white/30 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-[17px] font-semibold tracking-wide">Profile</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-16 pb-20">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-6 mb-16">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-4xl font-semibold text-white border-2 border-white/[0.06] shadow-2xl shadow-black/50">
            {user.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              : initial
            }
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight">{displayName || "User"}</h1>
            <p className="text-[15px] text-white/25 tracking-wide mt-2">{user.email}</p>
            {memberSince && (
              <p className="text-[13px] text-white/15 tracking-wider mt-3 flex items-center justify-center gap-2">
                <Calendar size={12} /> Member since {memberSince}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-5 mb-16">
          {[
            { label: "Watchlist", value: stats.watchlist, icon: Bookmark },
            { label: "Upvotes Given", value: stats.upvotes, icon: Heart },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-7 text-center">
              <s.icon size={20} className="text-white/15 mx-auto mb-3" />
              <p className="text-3xl font-semibold tracking-tight">{s.value}</p>
              <p className="text-[12px] text-white/20 tracking-[0.15em] uppercase mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Edit Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-[12px] font-semibold tracking-[0.2em] text-white/20 uppercase mb-3">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4 text-[16px] text-white tracking-wide placeholder-white/15 focus:outline-none focus:border-white/15 transition-colors"
              placeholder="Your name" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold tracking-[0.2em] text-white/20 uppercase mb-3">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4 text-[16px] text-white tracking-wide placeholder-white/15 focus:outline-none focus:border-white/15 transition-colors resize-none"
              placeholder="Tell us about yourself..." />
          </div>
          <div>
            <label className="block text-[12px] font-semibold tracking-[0.2em] text-white/20 uppercase mb-3">Email</label>
            <div className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl px-5 py-4 text-[16px] text-white/20 tracking-wide">{user.email}</div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 bg-white text-black text-[15px] font-semibold tracking-wide rounded-full hover:bg-white/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-4">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/[0.08] backdrop-blur-2xl border border-white/[0.06] text-white text-[14px] tracking-wide px-8 py-4 rounded-full z-[300] font-medium" style={{ animation: "fadeInUp 0.3s ease" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
