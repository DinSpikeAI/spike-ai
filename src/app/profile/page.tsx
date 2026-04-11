"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, LogIn, Check, Heart, Bookmark,
  Calendar, Film, Sparkles, Camera,
  ExternalLink, Globe,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  const [bannerUrl, setBannerUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [stats, setStats] = useState({ watchlist: 0, upvotes: 0, films: 0 });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const isCreator = userType === "creator";

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
          setDisplayName(data.display_name || "");
          setBio(data.bio || "");
          setWebsite(data.website || "");
          setSocialX(data.social_x || "");
          setSocialYoutube(data.social_youtube || "");
          setSocialInstagram(data.social_instagram || "");
          setUserType(data.user_type || "viewer");
          setBannerUrl(data.banner_url || "");
          setAvatarUrl(data.avatar_url || u.user_metadata?.avatar_url || "");
        } else {
          setDisplayName(u.user_metadata?.display_name || u.user_metadata?.full_name || "");
          setAvatarUrl(u.user_metadata?.avatar_url || "");
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    async function s() {
      const { count: w } = await supabase!.from("watchlist").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: u } = await supabase!.from("user_votes").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: f } = await supabase!.from("movies").select("*", { count: "exact", head: true }).eq("creator_name", displayName).eq("status", "approved");
      setStats({ watchlist: w || 0, upvotes: u || 0, films: f || 0 });
    }
    s();
  }, [user, displayName]);

  const handleSave = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, display_name: displayName.trim(), bio: bio.trim(), email: user.email,
      website: website.trim(), social_x: socialX.trim(), social_youtube: socialYoutube.trim(),
      social_instagram: socialInstagram.trim(), banner_url: bannerUrl.trim(),
    }, { onConflict: "id" });
    if (!error) { showToast("Profile saved"); await supabase.auth.updateUser({ data: { display_name: displayName.trim() } }); }
    else showToast("Error saving");
    setSaving(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;
    setUploadingBanner(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `banners/${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (upErr) { showToast("Upload failed"); setUploadingBanner(false); return; }
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setBannerUrl(url);
      await supabase.from("profiles").update({ banner_url: url }).eq("id", user.id);
      showToast("Banner updated");
    } catch { showToast("Upload error"); }
    setUploadingBanner(false);
  };

  const initial = (displayName || user?.email || "U")[0].toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  if (authChecking || loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="w-5 h-5 text-white/15 animate-spin" /></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }} />
      </div>
      <div className="text-center relative z-10 prof-reveal">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-8">
          <LogIn size={28} className="text-white/20" />
        </div>
        <h2 className="text-3xl font-semibold text-white tracking-tight mb-3">Sign in to continue</h2>
        <p className="text-[15px] text-white/30 mb-10 max-w-xs mx-auto leading-relaxed">Access your profile, films, and creator tools.</p>
        <button onClick={() => router.push("/auth")} className="px-8 py-3.5 bg-white text-black text-[14px] font-semibold rounded-xl hover:bg-white/90 transition-all cursor-pointer">Sign In</button>
      </div>
      <style jsx>{`@keyframes profReveal { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } } .prof-reveal { animation: profReveal 0.5s cubic-bezier(0.16,1,0.3,1); }`}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%)" }} />
      </div>

      <nav className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-white/25 hover:text-white/60 transition-colors cursor-pointer"><ArrowLeft size={18} /></button>
            <span className="text-[14px] font-medium text-white/40">Profile</span>
          </div>
          {isCreator && (
            <button onClick={() => router.push(`/creator/${user.id}`)} className="text-[12px] text-white/20 hover:text-white/40 transition-colors flex items-center gap-1.5 cursor-pointer">
              <ExternalLink size={11} /> Public Profile
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 relative z-10 prof-reveal">

        {/* Banner */}
        <div className="relative h-[180px] -mx-6 overflow-hidden group">
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#111113] to-[#09090b]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/30 to-transparent" />
          <label className="absolute bottom-4 right-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/[0.08] text-[11px] text-white/30 hover:text-white/60 hover:border-white/15 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
            {uploadingBanner ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
            {uploadingBanner ? "Uploading..." : "Edit cover"}
            <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
          </label>
        </div>

        {/* Header */}
        <div className="flex items-start gap-5 -mt-12 mb-10">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-[3px] border-[#09090b] shadow-2xl shadow-black/60 bg-[#18181b]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white/40 bg-gradient-to-br from-[#1a1a1e] to-[#111114]">{initial}</div>
              )}
            </div>
          </div>
          <div className="pt-14 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight truncate">{displayName || "User"}</h1>
              {isCreator && (
                <span className="flex-shrink-0 px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">Creator</span>
              )}
            </div>
            <p className="text-[13px] text-white/25 truncate">{user.email}</p>
            {memberSince && <p className="text-[12px] text-white/15 mt-1 flex items-center gap-1.5"><Calendar size={10} /> Joined {memberSince}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          {[
            { value: stats.films, label: "Films" },
            { value: stats.upvotes, label: "Upvotes" },
            { value: stats.watchlist, label: "Watchlist" },
          ].map((s) => (
            <div key={s.label} className="text-center py-5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-xl font-bold tracking-tight">{s.value}</p>
              <p className="text-[11px] text-white/25 tracking-wider uppercase mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="h-px bg-white/[0.04] mb-10" />

        {/* Form */}
        <div className="space-y-8 pb-24">
          <div>
            <label className="block text-[11px] font-medium tracking-widest text-white/25 uppercase mb-2">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 text-[15px] text-white placeholder-white/15 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04] transition-all"
              placeholder="Your name" />
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-widest text-white/25 uppercase mb-2">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 text-[15px] text-white placeholder-white/15 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04] transition-all resize-none"
              placeholder="Tell the world who you are..." />
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-widest text-white/25 uppercase mb-2">Email</label>
            <div className="w-full bg-white/[0.015] border border-white/[0.03] rounded-xl px-5 py-4 text-[15px] text-white/20">{user.email}</div>
          </div>

          {isCreator && (
            <div className="pt-2">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-1 h-5 rounded-full bg-emerald-500/40" />
                <span className="text-[12px] font-semibold tracking-widest text-emerald-400/60 uppercase">Creator Profile</span>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-medium tracking-widest text-white/25 uppercase mb-2">Website / Portfolio</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" />
                    <input value={website} onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-5 py-4 text-[15px] text-white placeholder-white/15 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04] transition-all"
                      placeholder="https://yoursite.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium tracking-widest text-white/25 uppercase mb-3">Social Links</label>
                  <div className="space-y-3">
                    {[
                      { label: "X / Twitter", value: socialX, set: setSocialX, ph: "@username" },
                      { label: "YouTube", value: socialYoutube, set: setSocialYoutube, ph: "@channel" },
                      { label: "Instagram", value: socialInstagram, set: setSocialInstagram, ph: "@username" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-3">
                        <span className="text-[12px] text-white/20 w-20 flex-shrink-0">{s.label}</span>
                        <input value={s.value} onChange={(e) => s.set(e.target.value)}
                          className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/15 focus:outline-none focus:border-white/[0.12] transition-all"
                          placeholder={s.ph} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <button onClick={handleSave} disabled={saving}
              className="w-full py-4 bg-white text-black text-[14px] font-semibold rounded-xl hover:bg-white/90 disabled:opacity-30 transition-all cursor-pointer flex items-center justify-center gap-2">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="pt-8">
            <div className="h-px bg-white/[0.04] mb-10" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[16px] font-semibold tracking-tight">My Films</h2>
              {isCreator && (
                <button onClick={() => router.push("/submit")} className="text-[12px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Film size={12} /> Submit Film
                </button>
              )}
            </div>
            {stats.films === 0 ? (
              <div className="text-center py-16 rounded-xl bg-white/[0.015] border border-white/[0.03]">
                <Film size={28} className="text-white/10 mx-auto mb-3" />
                <p className="text-[14px] text-white/20 mb-1">No films yet</p>
                <p className="text-[12px] text-white/10">Submit your first AI film to see it here.</p>
              </div>
            ) : (
              <div className="text-center py-12 rounded-xl bg-white/[0.015] border border-white/[0.03]">
                <p className="text-[14px] text-white/30">{stats.films} film{stats.films !== 1 ? "s" : ""} published</p>
                <button onClick={() => router.push(`/creator/${user.id}`)} className="mt-3 text-[12px] text-white/20 hover:text-white/40 transition-colors cursor-pointer">View all →</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-[#18181b] border border-white/[0.06] text-white text-[13px] px-6 py-3 rounded-xl font-medium shadow-2xl shadow-black/60 prof-reveal">
          <span className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> {toast}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes profReveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .prof-reveal { animation: profReveal 0.5s cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </div>
  );
}
