"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Camera, Loader2, LogIn,
  Check, Film, Heart, Bookmark, Calendar,
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

  // Editable fields
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
        const { data } = await supabase!
          .from("profiles")
          .select("*")
          .eq("id", u.id)
          .single();
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
      .upsert({
        id: user.id,
        display_name: displayName.trim(),
        bio: bio.trim(),
        email: user.email,
      }, { onConflict: "id" });

    if (!error) {
      showToast("Profile saved");
      // Also update auth metadata
      await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
    } else {
      showToast("Error saving profile");
    }
    setSaving(false);
  };

  // ── Stats ──
  const [stats, setStats] = useState({ watchlist: 0, upvotes: 0 });
  useEffect(() => {
    if (!supabase || !user) return;
    async function loadStats() {
      const { count: wCount } = await supabase!
        .from("watchlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      const { count: uCount } = await supabase!
        .from("user_votes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setStats({ watchlist: wCount || 0, upvotes: uCount || 0 });
    }
    loadStats();
  }, [user]);

  const initial = (displayName || user?.email || "U")[0].toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  if (authChecking || loading) {
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
          <h2 className="text-xl font-semibold text-white tracking-wide">Sign in to view your profile</h2>
          <p className="text-sm text-white/40 mt-2 tracking-wide">Your profile, stats, and preferences — all in one place.</p>
        </div>
        <button
          onClick={() => router.push("/auth")}
          className="px-8 py-3 bg-white text-black text-sm font-semibold tracking-wide rounded-full hover:bg-white/90 transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-white/40 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-[15px] font-semibold tracking-wide">My Profile</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-5 mb-12">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-3xl font-bold text-white border-2 border-white/[0.06]">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-wide">{displayName || "User"}</h1>
            <p className="text-sm text-white/30 tracking-wide mt-1">{user.email}</p>
            {memberSince && (
              <p className="text-xs text-white/20 tracking-wider mt-2 flex items-center justify-center gap-1.5">
                <Calendar size={11} /> Member since {memberSince}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          {[
            { label: "Watchlist", value: stats.watchlist, icon: Bookmark },
            { label: "Upvotes Given", value: stats.upvotes, icon: Heart },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center">
              <s.icon size={18} className="text-white/20 mx-auto mb-2" />
              <p className="text-2xl font-semibold tracking-wide">{s.value}</p>
              <p className="text-[11px] text-white/30 tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Edit Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-[11px] font-medium tracking-widest text-white/30 uppercase mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[15px] text-white tracking-wide placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium tracking-widest text-white/30 uppercase mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[15px] text-white tracking-wide placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium tracking-widest text-white/30 uppercase mb-2">Email</label>
            <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-[15px] text-white/30 tracking-wide">
              {user.email}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-white text-black text-sm font-semibold tracking-wide rounded-full hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
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
