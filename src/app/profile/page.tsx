"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, LogIn, Check, Bookmark,
  Calendar, Film, Camera, ExternalLink, Globe, Flame,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

function StatRing({ value, label, icon: Icon, color }: { value: number; label: string; icon: any; color: string }) {
  const r = 38, c = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(value, 10), 1);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[100px] h-[100px]">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`} className="transition-all duration-1000" style={{ filter: `drop-shadow(0 0 6px ${color}40)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={16} style={{ color }} className="mb-1 opacity-60" />
          <span className="text-[22px] font-bold tracking-tight text-white">{value}</span>
        </div>
      </div>
      <span className="text-[10px] tracking-[0.2em] uppercase text-white/20">{label}</span>
    </div>
  );
}

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({ watchlist: 0, upvotes: 0, films: 0 });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const isCreator = userType === "creator";

  useEffect(() => {
    if (!supabase) { setAuthChecking(false); setLoading(false); return; }
    async function load() {
      const { data: { session } } = await supabase!.auth.getSession();
      const u = session?.user || null;
      setUser(u); setAuthChecking(false);
      if (u) {
        const { data } = await supabase!.from("profiles").select("*").eq("id", u.id).single();
        if (data) {
          setDisplayName(data.display_name || ""); setBio(data.bio || "");
          setWebsite(data.website || ""); setSocialX(data.social_x || "");
          setSocialYoutube(data.social_youtube || ""); setSocialInstagram(data.social_instagram || "");
          setUserType(data.user_type || "viewer"); setBannerUrl(data.banner_url || "");
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
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim(), bio: bio.trim(),
      website: website.trim(), social_x: socialX.trim(), social_youtube: socialYoutube.trim(),
      social_instagram: socialInstagram.trim(), banner_url: bannerUrl.trim(),
    }).eq("id", user.id);
    if (!error) { showToast("Profile saved"); await supabase.auth.updateUser({ data: { display_name: displayName.trim() } }); }
    else showToast("Error saving");
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;
    if (file.size > 5 * 1024 * 1024) { showToast("Image must be under 5MB"); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = "avatars/" + user.id + "." + ext;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (upErr) { showToast("Upload failed"); setUploadingAvatar(false); return; }
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      showToast("Avatar updated");
    } catch { showToast("Upload error"); }
    setUploadingAvatar(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;
    if (file.size > 5 * 1024 * 1024) { showToast("Max file size is 5MB"); return; }
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

  if (authChecking || loading) return <div className="min-h-screen bg-[#08080c] flex items-center justify-center"><Loader2 className="w-5 h-5 text-white/10 animate-spin" /></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#08080c] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
      <div className="text-center relative z-10 prof-reveal">
        <LogIn size={32} className="text-white/10 mx-auto mb-6" />
        <h2 className="text-[32px] font-bold text-white tracking-tight mb-3">Sign in to continue</h2>
        <p className="text-[15px] text-[#555] mb-10 max-w-sm mx-auto leading-relaxed">Access your profile, films, and creator tools.</p>
        <button onClick={() => router.push("/auth")} className="px-10 py-4 bg-white text-black text-[14px] font-bold rounded-full hover:bg-white/90 transition-all cursor-pointer">Sign In</button>
      </div>
      <style jsx>{`@keyframes profReveal { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } } .prof-reveal { animation: profReveal 0.6s cubic-bezier(0.16,1,0.3,1); }`}</style>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#08080c] text-white relative overflow-hidden">
      {/* ── Full-page texture ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Noise grain */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        {/* Ambient glow */}
        <div className="absolute top-[5%] right-[15%] w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 65%)" }} />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] rounded-full opacity-[0.025]"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#08080c]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="w-full max-w-3xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-white/20 hover:text-white/50 transition-colors cursor-pointer"><ArrowLeft size={18} /></button>
            <span className="text-[14px] font-medium text-white/30">Profile</span>
          </div>
          {isCreator && (
            <button onClick={() => router.push(`/creator/${user.id}`)} className="text-[12px] text-white/15 hover:text-white/35 transition-colors flex items-center gap-1.5 cursor-pointer">
              <ExternalLink size={11} /> Public Profile
            </button>
          )}
        </div>
      </nav>

      {/* ═══ MAIN (centered) ═══ */}
      <div className="w-full flex justify-center">
      <div className="w-full max-w-3xl px-8 relative z-10 prof-reveal">

        {/* Banner */}
        <div className="relative h-[200px] rounded-2xl overflow-hidden mt-8 group">
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #0f0f18 0%, #08080c 50%, #0c0c15 100%)" }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-transparent to-transparent" />
          <label className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/[0.06] text-[11px] text-white/25 hover:text-white/50 hover:border-white/[0.12] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
            {uploadingBanner ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
            {uploadingBanner ? "Uploading..." : "Edit cover"}
            <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
          </label>
        </div>

        {/* ── Centered Header ── */}
        <div className="flex flex-col items-center text-center -mt-16 pb-10">
          <div className="relative group mb-6">
          <div className="w-[128px] h-[128px] rounded-full overflow-hidden border-4 border-[#08080c] shadow-2xl shadow-black/80">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white/25" style={{ background: "linear-gradient(135deg, #1a1a22 0%, #111116 100%)" }}>{initial}</div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-white/90 transition-all">
            {uploadingAvatar ? <Loader2 size={14} className="text-black/50 animate-spin" /> : <Camera size={14} className="text-black/70" />}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[32px] font-bold tracking-tight">{displayName || "User"}</h1>
            {isCreator && (
              <span className="px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.15em] uppercase text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/15">Creator</span>
            )}
          </div>
          <p className="text-[14px] text-[#555] mb-1">{user.email}</p>
          {memberSince && <p className="text-[12px] text-white/10 flex items-center gap-1.5"><Calendar size={10} /> Joined {memberSince}</p>}
        </div>

        {/* ── Stats Rings ── */}
        <div className="flex items-center justify-center gap-10 md:gap-16 mb-14">
          <StatRing value={stats.films} label="Films" icon={Film} color="#8b5cf6" />
          <StatRing value={stats.upvotes} label="Upvotes" icon={Flame} color="#f59e0b" />
          <StatRing value={stats.watchlist} label="Watchlist" icon={Bookmark} color="#3b82f6" />
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.04] mb-14" />

        {/* ── Form ── */}
        <div className="max-w-xl mx-auto space-y-10 pb-12">
          <div>
            <label className="block text-[10px] font-bold tracking-[0.25em] text-white/15 uppercase mb-3">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl px-6 py-4 text-[16px] text-white placeholder-white/10 focus:outline-none focus:border-[#8b5cf6]/30 transition-all"
              placeholder="Your name" />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.25em] text-white/15 uppercase mb-3">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl px-6 py-4 text-[16px] text-white placeholder-white/10 focus:outline-none focus:border-[#8b5cf6]/30 transition-all resize-none"
              placeholder="Tell the world who you are..." />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.25em] text-white/15 uppercase mb-3">Email</label>
            <div className="w-full bg-white/[0.015] border border-white/[0.03] rounded-2xl px-6 py-4 text-[16px] text-[#555]">{user.email}</div>
          </div>

          {isCreator && (
            <div className="pt-6">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1.5 h-6 rounded-full bg-[#22c55e]/50" />
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#22c55e]/50 uppercase">Creator Profile</span>
              </div>
              <div className="space-y-10">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.25em] text-white/15 uppercase mb-3">Website / Portfolio</label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10" />
                    <input value={website} onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-12 pr-6 py-4 text-[16px] text-white placeholder-white/10 focus:outline-none focus:border-[#8b5cf6]/30 transition-all"
                      placeholder="https://yoursite.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.25em] text-white/15 uppercase mb-4">Social Links</label>
                  <div className="space-y-4">
                    {[
                      { label: "X / Twitter", value: socialX, set: setSocialX, ph: "@username" },
                      { label: "YouTube", value: socialYoutube, set: setSocialYoutube, ph: "@channel" },
                      { label: "Instagram", value: socialInstagram, set: setSocialInstagram, ph: "@username" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-4">
                        <span className="text-[12px] text-[#555] w-24 flex-shrink-0 text-right">{s.label}</span>
                        <input value={s.value} onChange={(e) => s.set(e.target.value)}
                          className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-2xl px-5 py-3.5 text-[15px] text-white placeholder-white/10 focus:outline-none focus:border-[#8b5cf6]/30 transition-all"
                          placeholder={s.ph} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save */}
          <div className="pt-8">
            <button onClick={handleSave} disabled={saving}
              className="w-full py-[18px] bg-white text-[#08080c] text-[14px] font-bold rounded-2xl hover:bg-white/90 disabled:opacity-30 transition-all cursor-pointer flex items-center justify-center gap-2.5">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* ── My Films ── */}
        <div className="max-w-xl mx-auto pb-24">
          <div className="h-px bg-white/[0.04] mb-14" />
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[18px] font-bold tracking-tight">My Films</h2>
            {isCreator && (
              <button onClick={() => router.push("/submit")} className="text-[12px] text-[#555] hover:text-white/40 transition-colors flex items-center gap-2 cursor-pointer">
                <Film size={12} /> Submit Film
              </button>
            )}
          </div>
          {stats.films === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-white/[0.015] border border-white/[0.03]">
              <Film size={28} className="text-white/[0.06] mx-auto mb-4" />
              <p className="text-[14px] text-white/15 mb-1">No films yet</p>
              <p className="text-[12px] text-white/[0.08]">Submit your first AI film to see it here.</p>
            </div>
          ) : (
            <div className="text-center py-14 rounded-2xl bg-white/[0.015] border border-white/[0.03]">
              <p className="text-[15px] text-white/25">{stats.films} film{stats.films !== 1 ? "s" : ""} published</p>
              <button onClick={() => router.push(`/creator/${user.id}`)} className="mt-4 text-[13px] text-[#8b5cf6]/50 hover:text-[#8b5cf6]/80 transition-colors cursor-pointer">View all films →</button>
            </div>
          )}
        </div>

      </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-[#141418] border border-white/[0.06] text-white text-[13px] px-6 py-3 rounded-2xl font-medium shadow-2xl shadow-black/60 prof-reveal">
          <span className="flex items-center gap-2"><Check size={14} className="text-[#22c55e]" /> {toast}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes profReveal { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .prof-reveal { animation: profReveal 0.6s cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </div>
  );
}
