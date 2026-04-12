"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield, Film, Trash2, Pencil, Check, X, Loader2, RefreshCw,
  ArrowLeft, ChevronDown, Search, Zap, Clock, XCircle, Eye,
  Save, Plus, AlertTriangle, Inbox, CheckCircle, Ban, Bell, Users,
  Sparkles,
} from "lucide-react";
import { supabase, getSmartPoster, checkIsAdmin } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface Movie {
  id: string;
  title: string;
  description: string | null;
  tagline: string | null;
  video_url: string | null;
  trailer_url: string | null;
  poster_url: string | null;
  hero_image: string | null;
  category: string;
  genre: string | null;
  duration: string | null;
  year: number;
  rating: number;
  maturity: string;
  ai_models: string[];
  creator_name: string | null;
  upvotes_count: number;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUSES = ["pending", "approved", "rejected"] as const;
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  approved: { bg: "bg-green-500/15 border-green-500/30", text: "text-green-400", icon: Check },
  pending: { bg: "bg-yellow-500/15 border-yellow-500/30", text: "text-yellow-400", icon: Clock },
  rejected: { bg: "bg-red-500/15 border-red-500/30", text: "text-red-400", icon: XCircle },
};

const CATEGORIES = ["Trending", "AI Horror", "Sci-Fi Visions", "Award Winning", "AI Anime", "Action", "Fantasy", "Runway Masterpieces"];
const GENRES = ["Sci-Fi", "Horror", "Drama", "Thriller", "Fantasy", "Action", "Cyberpunk", "Romance", "Art House", "Animation", "Comedy", "Mystery", "Musical", "Documentary"];
const AI_MODELS = ["Runway Gen-4", "Runway Gen-3", "Midjourney", "Stable Diffusion XL", "Stable Video", "Kling AI", "Pika Labs", "ElevenLabs", "Other"];

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminMethod, setAdminMethod] = useState<string>("none");
  const [authChecking, setAuthChecking] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editMovie, setEditMovie] = useState<Movie | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [totalUpvotes, setTotalUpvotes] = useState(0);
  const [recentUsers, setRecentUsers] = useState<{ id: string; email: string; created_at: string }[]>([]);

  // ── Notifications Management ──
  const [notifs, setNotifs] = useState<{ id: string; title: string; created_at: string }[]>([]);
  const [newNotif, setNewNotif] = useState("");
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("films")  // films | creators | analytics;
  const [creators, setCreators] = useState([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [smartNotifs, setSmartNotifs] = useState([]);
  const [lastSeenNotif, setLastSeenNotif] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ─── Auth-based Admin Check ───
  useEffect(() => {
    async function verifyAdmin() {
      const urlKey = searchParams.get("admin");
      const result = await checkIsAdmin(urlKey);
      setIsAdmin(result.isAdmin);
      setAdminUser(result.user);
      setAdminMethod(result.method);
      setAuthChecking(false);

      if (result.isAdmin) {
        // Clean the URL — remove ?admin= key if auth-based
        if (result.method === "auth" && urlKey) {
          window.history.replaceState({}, "", "/admin/dashboard");
        }
      }
    }
    verifyAdmin();
  }, [searchParams]);

  /* ── Fetch ALL movies (admin sees everything) ── */
  const fetchMovies = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    // Admin needs to see all statuses — use a special RPC or direct query
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMovies(data as Movie[]);
      setTotalUpvotes(data.reduce((sum: number, m: any) => sum + (m.upvotes_count || 0), 0));
    }
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    if (!supabase) return;
    const { data: profiles, count } = await supabase.from("profiles").select("id, email, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(10);
    if (count !== null) setUserCount(count);
    if (profiles) setRecentUsers(profiles as any);
  }, []);

  const fetchCreators = async () => {
    if (!supabase) return;
    setCreatorsLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (profiles) {
      const { data: allMovies } = await supabase.from("movies").select("creator_name, status");
      const filmCounts = {};
      (allMovies || []).forEach(m => {
        const name = m.creator_name || "Unknown";
        if (!filmCounts[name]) filmCounts[name] = { total: 0, approved: 0, pending: 0 };
        filmCounts[name].total++;
        if (m.status === "approved") filmCounts[name].approved++;
        if (m.status === "pending") filmCounts[name].pending++;
      });
      setCreators(profiles.map(p => ({ ...p, films: filmCounts[p.display_name] || { total: 0, approved: 0, pending: 0 } })));
    }
    setCreatorsLoading(false);
  };

  // Smart Notifications
  React.useEffect(() => {
    const saved = localStorage.getItem("spike_last_seen_notif");
    if (saved) setLastSeenNotif(saved);
  }, []);

  React.useEffect(() => {
    if (!movies.length && !recentUsers.length) return;
    const smart = [];
    movies.filter(m => m.status === "pending").forEach(m => {
      smart.push({ id: "pending-" + m.id, type: "pending", title: 'New submission: "' + m.title + '" by ' + (m.creator_name || "Unknown"), time: m.created_at, icon: "film" });
    });
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();
    recentUsers.filter(u => u.created_at > weekAgo).forEach(u => {
      smart.push({ id: "user-" + u.id, type: "user", title: "New user: " + u.email, time: u.created_at, icon: "user" });
    });
    smart.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setSmartNotifs(smart);
  }, [movies, recentUsers]);

  const unreadCount = smartNotifs.filter(n => n.time > lastSeenNotif).length + notifs.filter(n => n.created_at > lastSeenNotif).length;
  const markAllRead = () => { const now = new Date().toISOString(); setLastSeenNotif(now); localStorage.setItem("spike_last_seen_notif", now); };

  useEffect(() => {
    if (!authChecking && isAdmin) { fetchMovies(); fetchStats(); fetchCreators(); }
  }, [isAdmin, authChecking, fetchMovies, fetchStats]);

  /* ── Notifications CRUD ── */
  const fetchNotifs = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
    if (data) setNotifs(data);
  }, []);

  useEffect(() => { if (isAdmin) fetchNotifs(); }, [isAdmin, fetchNotifs]);

  const addNotif = async () => {
    if (!supabase || !newNotif.trim()) return;
    const { error } = await supabase.from("notifications").insert({ title: newNotif.trim() });
    if (!error) { setNewNotif(""); fetchNotifs(); showToast("Notification sent"); }
    else showToast("Error: " + error.message);
  };

  const deleteNotif = async (id: string) => {
    if (!supabase) return;
    await supabase.from("notifications").delete().eq("id", id);
    setNotifs((p) => p.filter((n) => n.id !== id));
    showToast("Notification deleted");
  };

  /* ── Status Change ── */
  const updateStatus = async (movie: Movie, newStatus: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("movies")
      .update({ status: newStatus })
      .eq("id", movie.id);
    if (!error) {
      setMovies((prev) => prev.map((m) => m.id === movie.id ? { ...m, status: newStatus } : m));
      showToast(`"${movie.title}" → ${newStatus}`);
    } else {
      showToast(`Error: ${error.message}`);
    }
  };

  /* ── Delete Movie ── */
  const deleteMovie = async () => {
    if (!supabase || !deleteTarget) return;
    setSaving(true);
    const { error } = await supabase
      .from("movies")
      .delete()
      .eq("id", deleteTarget.id);
    if (!error) {
      setMovies((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      showToast(`"${deleteTarget.title}" deleted`);
    } else {
      showToast(`Error: ${error.message}`);
    }
    setDeleteTarget(null);
    setSaving(false);
  };

  /* ── Save Edit ── */
  const saveEdit = async () => {
    if (!supabase || !editMovie) return;
    setSaving(true);
    const { error } = await supabase
      .from("movies")
      .update({
        title: editMovie.title,
        description: editMovie.description,
        video_url: editMovie.video_url,
        poster_url: editMovie.poster_url,
        category: editMovie.category,
        genre: editMovie.genre,
        duration: editMovie.duration,
        creator_name: editMovie.creator_name,
        ai_models: editMovie.ai_models,
        rating: editMovie.rating,
        sort_order: editMovie.sort_order || 0,
      })
      .eq("id", editMovie.id);
    if (!error) {
      setMovies((prev) => prev.map((m) => m.id === editMovie.id ? { ...editMovie } : m));
      showToast(`"${editMovie.title}" saved`);
      setEditMovie(null);
    } else {
      showToast(`Error: ${error.message}`);
    }
    setSaving(false);
  };

  /* ── Filtered movies ── */
  const filtered = movies.filter((m) => {
    const matchesSearch = search === "" ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.creator_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: movies.length,
    approved: movies.filter((m) => m.status === "approved").length,
    pending: movies.filter((m) => m.status === "pending").length,
    rejected: movies.filter((m) => m.status === "rejected").length,
  };

  /* ═════════════ LOADING AUTH ═════════════ */
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="animate-spin text-[#E50914]" />
          <p className="text-white/30 text-sm tracking-wide">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  /* ═════════════ ACCESS DENIED ═════════════ */
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield size={36} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Access Denied</h1>
          <p className="text-gray-500 text-sm mb-6">
            {adminUser
              ? "Your account doesn't have admin privileges. Contact the site owner."
              : "You need to sign in with an admin account to access this page."}
          </p>
          <div className="flex gap-3 justify-center">
            {!adminUser && (
              <button onClick={() => router.push("/auth")} className="px-6 py-3 bg-[#E50914] text-white rounded-lg hover:bg-[#f6121d] transition-all font-bold">
                Sign In
              </button>
            )}
            <button onClick={() => router.push("/")} className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-medium">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════ DASHBOARD ═════════════ */
  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 px-4 md:px-8 py-3 bg-[#08080a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
              
              <span className="text-[16px] font-semibold tracking-[0.15em] text-white/80">spike</span>
              <span className="text-[16px] font-semibold tracking-[0.15em] text-white" >AI</span>
            </div>
            <div className="h-5 w-px bg-gray-700" />
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${adminMethod === "auth" ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"}`}>
              <Shield size={12} className={adminMethod === "auth" ? "text-green-400" : "text-yellow-400"} />
              <span className={`text-[10px] font-bold tracking-wider uppercase ${adminMethod === "auth" ? "text-green-400" : "text-yellow-400"}`}>
                {adminMethod === "auth" ? "Admin" : "Key Access"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Bell */}
            <div className="relative">
              <button onClick={() => { setShowNotifDropdown(!showNotifDropdown); if (!showNotifDropdown) markAllRead(); }} className="relative p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <Bell size={18} />
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white animate-pulse">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 top-12 w-[380px] max-h-[500px] bg-[#111114] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                    <span className="text-[13px] font-bold text-white/70">Notifications</span>
                    <button onClick={markAllRead} className="text-[10px] text-white/20 hover:text-white/40 cursor-pointer">Mark all read</button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {smartNotifs.length === 0 && notifs.length === 0 ? (
                      <div className="py-10 text-center text-white/15 text-[13px]">No notifications</div>
                    ) : (<>
                      {smartNotifs.map(n => (
                        <div key={n.id} className={"flex items-start gap-3 px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors " + (n.time > lastSeenNotif ? "bg-white/[0.03]" : "")}>
                          <span className="text-[14px] mt-0.5">{n.icon === "film" ? <Film size={14} className="text-yellow-400" /> : <Users size={14} className="text-purple-400" />}</span>
                          <div className="min-w-0 flex-1">
                            <p className={"text-[12px] leading-relaxed " + (n.time > lastSeenNotif ? "text-white/70" : "text-white/35")}>{n.title}</p>
                            <p className="text-[10px] text-white/15 mt-1">{new Date(n.time).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          {n.type === "pending" && <button onClick={() => { setStatusFilter("pending"); setShowNotifDropdown(false); }} className="text-[10px] text-yellow-400 hover:text-yellow-300 cursor-pointer flex-shrink-0 mt-1">Review</button>}
                        </div>
                      ))}
                      {notifs.map(n => (
                        <div key={n.id} className={"flex items-start gap-3 px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.02] " + (n.created_at > lastSeenNotif ? "bg-white/[0.03]" : "")}>
                          <Bell size={14} className="text-yellow-400 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className={"text-[12px] leading-relaxed " + (n.created_at > lastSeenNotif ? "text-white/70" : "text-white/35")}>{n.title}</p>
                            <p className="text-[10px] text-white/15 mt-1">{new Date(n.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <button onClick={() => deleteNotif(n.id)} className="text-white/10 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0 mt-1"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </>)}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push("/submit")}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-500 transition-all"
            >
              <Plus size={14} /> Add Film
            </button>
            <button onClick={fetchMovies} className="p-2 text-gray-400 hover:text-white transition-colors">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {[
            { label: "Total Films", value: stats.total, color: "text-white", filter: "all", accent: "border-white/[0.08]" },
            { label: "Approved", value: stats.approved, color: "text-green-400", filter: "approved", accent: "border-green-500/20" },
            { label: "Pending", value: stats.pending, color: "text-yellow-400", filter: "pending", accent: "border-yellow-500/20" },
            { label: "Rejected", value: stats.rejected, color: "text-red-400", filter: "rejected", accent: "border-red-500/20" },
            { label: "Users", value: userCount, color: "text-purple-400", filter: null, accent: "border-purple-500/20" },
            { label: "Total Upvotes", value: totalUpvotes, color: "text-blue-400", filter: null, accent: "border-blue-500/20" },
          ].map((s) => (
            <div
              key={s.label}
              onClick={() => s.filter !== null && setStatusFilter(s.filter)}
              className={`bg-[#111114] border rounded-2xl p-5 transition-all hover:bg-[#161619] ${s.filter !== null ? "cursor-pointer" : ""} ${
                statusFilter === s.filter ? "border-white/[0.15] bg-[#161619]" : s.accent
              } ${s.filter === "pending" && stats.pending > 0 ? "ring-1 ring-yellow-500/20" : ""}`}
            >
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-2">{s.label}</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                {s.filter === "pending" && stats.pending > 0 && (
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>


        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <button onClick={() => setActiveTab("films")} className={"px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all cursor-pointer " + (activeTab === "films" ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-white/30 hover:text-white/50")}><Film size={14} className="inline mr-2" />Films ({movies.length})</button>
          <button onClick={() => setActiveTab("creators")} className={"px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all cursor-pointer " + (activeTab === "creators" ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-white/30 hover:text-white/50")}><Users size={14} className="inline mr-2" />Creators ({creators.length})</button>
          <button onClick={() => setActiveTab("analytics")} className={"px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all cursor-pointer " + (activeTab === "analytics" ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-white/30 hover:text-white/50")}><Sparkles size={14} className="inline mr-2" />Analytics</button>
        </div>

        {/* CREATORS TAB */}
        {activeTab === "creators" && (
          <div className="space-y-4">
            {creatorsLoading ? <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-white/20" /></div> : creators.length === 0 ? <div className="text-center py-20 text-white/20">No creators yet</div> : (
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-white/20 border-b border-white/[0.04]"><div className="col-span-1"></div><div className="col-span-2">Name</div><div className="col-span-2">Email</div><div className="col-span-1 text-center">Films</div><div className="col-span-2">Type</div><div className="col-span-2">Role</div><div className="col-span-2">Joined</div></div>
                {creators.map(c => (
                  <div key={c.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-1">{c.avatar_url ? <img src={c.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/[0.06]" /> : <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[12px] text-white/30 font-bold">{(c.display_name||"?")[0].toUpperCase()}</div>}</div>
                    <div className="col-span-2"><p className="text-[14px] font-semibold text-white/80 truncate">{c.display_name||"No name"}</p></div>
                    <div className="col-span-2"><p className="text-[12px] text-white/30 truncate">{c.email||"-"}</p></div>
                    <div className="col-span-1 text-center"><span className={"text-[13px] font-bold "+(c.films.total>0?"text-green-400":"text-white/15")}>{c.films.total}</span>{c.films.pending>0&&<span className="text-[10px] text-yellow-400 ml-1">({c.films.pending})</span>}</div>
                    <div className="col-span-2"><select value={c.user_type||"viewer"} onChange={async(e)=>{await supabase.from("profiles").update({user_type:e.target.value}).eq("id",c.id);showToast(c.display_name+" → "+e.target.value);fetchCreators();}} className={"bg-white/[0.04] border text-[11px] rounded-lg px-2 py-1.5 outline-none cursor-pointer "+(c.user_type==="creator"?"border-green-500/30 text-green-400":"border-white/[0.08] text-white/60")} style={{colorScheme:"dark"}}><option value="viewer">Viewer</option><option value="creator">Creator</option></select></div>
                    <div className="col-span-2"><select value={c.role||"user"} onChange={async(e)=>{await supabase.from("profiles").update({role:e.target.value}).eq("id",c.id);showToast(c.display_name+" > "+e.target.value);fetchCreators();}} className="bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/60 rounded-lg px-2 py-1.5 outline-none cursor-pointer" style={{colorScheme:"dark"}}><option value="user">User</option><option value="admin">Admin</option></select></div>
                    <div className="col-span-2"><p className="text-[11px] text-white/20">{new Date(c.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(()=>{const am=movies.filter(m=>m.status==="approved");const tu=movies.reduce((s,m)=>s+(m.upvotes_count||0),0);const avg=am.length>0?(tu/am.length).toFixed(1):"0";const g={};am.forEach(m=>{if(m.genre)g[m.genre]=(g[m.genre]||0)+1;});const tg=Object.entries(g).sort((a,b)=>b[1]-a[1])[0];const uc=new Set(am.map(m=>m.creator_name).filter(Boolean)).size;return [{label:"Approved Films",value:am.length,color:"text-green-400"},{label:"Avg Upvotes",value:avg,color:"text-blue-400"},{label:"Unique Creators",value:uc,color:"text-purple-400"},{label:"Top Genre",value:tg?tg[0]:"-",color:"text-yellow-400"}].map(s=>(<div key={s.label} className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5"><p className="text-[10px] text-white/20 uppercase tracking-wider font-medium mb-2">{s.label}</p><p className={"text-2xl font-black "+s.color}>{s.value}</p></div>));})()}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5"><h3 className="text-[13px] font-bold text-white/70 mb-4 flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> Top Films</h3><div className="space-y-2">{movies.filter(m=>m.status==="approved").sort((a,b)=>(b.upvotes_count||0)-(a.upvotes_count||0)).slice(0,5).map((m,i)=>(<div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03]"><span className={"text-[14px] font-black w-6 text-center "+(i===0?"text-yellow-400":"text-white/15")}>{i+1}</span><div className="min-w-0 flex-1"><p className="text-[13px] text-white/70 font-medium truncate">{m.title}</p><p className="text-[10px] text-white/20">{m.creator_name||"Unknown"}</p></div><span className="text-[13px] font-bold text-blue-400">{m.upvotes_count||0}</span></div>))}</div></div>
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5"><h3 className="text-[13px] font-bold text-white/70 mb-4 flex items-center gap-2"><Users size={14} className="text-purple-400" /> Top Creators</h3><div className="space-y-2">{(()=>{const cf={};movies.filter(m=>m.status==="approved").forEach(m=>{const n=m.creator_name||"Unknown";cf[n]=(cf[n]||0)+1;});return Object.entries(cf).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count],i)=>(<div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03]"><span className={"text-[14px] font-black w-6 text-center "+(i===0?"text-purple-400":"text-white/15")}>{i+1}</span><p className="text-[13px] text-white/70 flex-1 truncate">{name}</p><span className="text-[13px] font-bold text-purple-400">{count}</span></div>));})()}</div></div>
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5"><h3 className="text-[13px] font-bold text-white/70 mb-4 flex items-center gap-2"><Film size={14} className="text-green-400" /> Genres</h3><div className="space-y-2">{(()=>{const g={};movies.filter(m=>m.status==="approved").forEach(m=>{if(m.genre)g[m.genre]=(g[m.genre]||0)+1;});const t=Object.values(g).reduce((s,v)=>s+v,0);const c=["bg-green-400","bg-blue-400","bg-purple-400","bg-yellow-400","bg-pink-400"];return Object.entries(g).sort((a,b)=>b[1]-a[1]).map(([genre,count],i)=>(<div key={genre} className="flex items-center gap-3"><p className="text-[12px] text-white/50 w-24 truncate">{genre}</p><div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden"><div className={"h-full rounded-full "+c[i%c.length]} style={{width:(t>0?(count/t*100):0)+"%"}}></div></div><span className="text-[11px] text-white/30 w-8 text-right">{count}</span></div>));})()}</div></div>
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5"><h3 className="text-[13px] font-bold text-white/70 mb-4 flex items-center gap-2"><Sparkles size={14} className="text-cyan-400" /> AI Tools</h3><div className="space-y-2">{(()=>{const t={};movies.filter(m=>m.status==="approved").forEach(m=>{(m.ai_models||[]).forEach(x=>{t[x]=(t[x]||0)+1;});});const total=Object.values(t).reduce((s,v)=>s+v,0);const c=["bg-cyan-400","bg-violet-400","bg-emerald-400","bg-amber-400","bg-rose-400"];return Object.entries(t).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([tool,count],i)=>(<div key={tool} className="flex items-center gap-3"><p className="text-[12px] text-white/50 w-28 truncate">{tool}</p><div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden"><div className={"h-full rounded-full "+c[i%c.length]} style={{width:(total>0?(count/total*100):0)+"%"}}></div></div><span className="text-[11px] text-white/30 w-8 text-right">{count}</span></div>));})()}</div></div>
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5 lg:col-span-2"><h3 className="text-[13px] font-bold text-white/70 mb-4 flex items-center gap-2"><Clock size={14} className="text-white/40" /> Recent Activity</h3><div className="space-y-1">{(()=>{const ev=[];movies.slice(0,10).forEach(m=>{ev.push({time:m.created_at,text:(m.status==="pending"?"Submitted":m.status==="approved"?"Approved":"Rejected")+": "+m.title,type:m.status});});recentUsers.slice(0,5).forEach(u=>{ev.push({time:u.created_at,text:"New user: "+u.email,type:"user"});});ev.sort((a,b)=>new Date(b.time)-new Date(a.time));return ev.slice(0,12).map((e,i)=>(<div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02]"><div className={"w-2 h-2 rounded-full flex-shrink-0 "+(e.type==="approved"?"bg-green-400":e.type==="pending"?"bg-yellow-400":e.type==="rejected"?"bg-red-400":"bg-purple-400")}></div><p className={"text-[12px] flex-1 truncate "+(e.type==="approved"?"text-green-400/70":e.type==="pending"?"text-yellow-400/70":e.type==="user"?"text-purple-400/70":"text-red-400/70")}>{e.text}</p><p className="text-[10px] text-white/15 flex-shrink-0">{new Date(e.time).toLocaleDateString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p></div>));})()}</div></div>
            </div>
          </div>
        )}

        {activeTab === "films" && (<>

        {/* ═══════ Users & Notifications — Side by Side ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
          {/* Recent Users */}
          <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-purple-400" />
                <span className="text-[13px] font-semibold tracking-wide text-white/70">Recent Users</span>
                <span className="text-[11px] text-purple-400 font-bold">{userCount}</span>
              </div>
              <button onClick={() => setShowUsers(!showUsers)} className="text-white/30 hover:text-white transition-colors cursor-pointer">
                <ChevronDown size={14} className={`transition-transform ${showUsers ? "rotate-180" : ""}`} />
              </button>
            </div>
            {showUsers && recentUsers.length > 0 ? (
              <div className="space-y-1">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <span className="text-[13px] text-white/60">{u.email || "No email"}</span>
                    <span className="text-[11px] text-white/20">{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : !showUsers ? (
              <p className="text-[12px] text-white/20 text-center py-2">Click to expand</p>
            ) : (
              <p className="text-[12px] text-white/20 text-center py-2">No users yet</p>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-yellow-400" />
                <span className="text-[13px] font-semibold tracking-wide text-white/70">Notifications</span>
                <span className="text-[11px] text-yellow-400 font-bold">{notifs.length}</span>
              </div>
              <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="text-white/30 hover:text-white transition-colors cursor-pointer">
                <ChevronDown size={14} className={`transition-transform ${showNotifPanel ? "rotate-180" : ""}`} />
              </button>
            </div>
            {showNotifPanel && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={newNotif}
                    onChange={(e) => setNewNotif(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addNotif()}
                    placeholder="Write a notification..."
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <button
                    onClick={addNotif}
                    disabled={!newNotif.trim()}
                    className="px-4 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-white/90 transition-all disabled:opacity-30 cursor-pointer"
                  >
                    Send
                  </button>
                </div>
                {notifs.length === 0 ? (
                  <p className="text-[12px] text-white/20 text-center py-3">No notifications yet</p>
                ) : (
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {notifs.map((n) => (
                      <div key={n.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] group">
                        <div className="min-w-0">
                          <p className="text-[13px] text-white/70 truncate">{n.title}</p>
                          <p className="text-[10px] text-white/20">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => deleteNotif(n.id)} className="text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer flex-shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════ REVIEW QUEUE — Pending Submissions ═══════ */}
        {stats.pending > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Inbox size={14} className="text-yellow-400" />
                <span className="text-[12px] font-bold tracking-wider uppercase text-yellow-400">
                  Review Queue
                </span>
                <span className="ml-1 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-[10px] font-black text-yellow-300">
                  {stats.pending}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {movies
                .filter((m) => m.status === "pending")
                .map((movie) => (
                  <div
                    key={`queue-${movie.id}`}
                    className="flex items-center gap-4 p-4 bg-yellow-500/[0.03] border border-yellow-500/[0.08] rounded-xl hover:border-yellow-500/[0.15] transition-colors"
                  >
                    {/* Poster */}
                    <div className="w-12 h-16 md:w-14 md:h-20 rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 border border-white/5">
                      <img src={getSmartPoster(movie.poster_url, movie.video_url, movie.id)} alt={movie.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base font-bold text-white truncate">{movie.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-gray-500">{movie.creator_name || "Unknown"}</span>
                        <span className="text-[11px] text-gray-700">·</span>
                        <span className="text-[11px] text-gray-500">{movie.category}</span>
                        <span className="text-[11px] text-gray-700">·</span>
                        <span className="text-[11px] text-gray-600">{new Date(movie.created_at).toLocaleDateString()}</span>
                      </div>
                      {movie.description && (
                        <p className="text-[11px] text-gray-600 mt-1 line-clamp-1">{movie.description}</p>
                      )}
                    </div>

                    {/* Preview */}
                    <button
                      onClick={() => window.open(`/movie/${movie.id}`, "_blank")}
                      className="p-2 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5 flex-shrink-0"
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Approve Button */}
                    <button
                      onClick={() => updateStatus(movie, "approved")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600/90 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex-shrink-0 shadow-lg shadow-green-500/10 hover:shadow-green-500/20"
                    >
                      <CheckCircle size={14} />
                      Approve
                    </button>

                    {/* Reject Button */}
                    <button
                      onClick={() => updateStatus(movie, "rejected")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 text-gray-400 hover:text-red-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex-shrink-0"
                    >
                      <Ban size={14} />
                      Reject
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or creator..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-[#E50914]/40"
            />
          </div>
          <div className="flex gap-2">
            {["all", ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                  statusFilter === s
                    ? s === "approved" ? "bg-green-500/15 border-green-500/30 text-green-400"
                      : s === "pending" ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                      : s === "rejected" ? "bg-red-500/15 border-red-500/30 text-red-400"
                      : "bg-white/10 border-white/20 text-white"
                    : "bg-white/[0.02] border-white/[0.05] text-gray-500 hover:text-white hover:border-white/15"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#E50914]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Film size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">{movies.length === 0 ? "No films in database yet" : "No films match your filter"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((movie) => {
              const st = STATUS_STYLES[movie.status] || STATUS_STYLES.pending;
              const StatusIcon = st.icon;
              return (
                <div
                  key={movie.id}
                  className="flex items-center gap-4 p-4 md:p-5 bg-[#111114] border border-white/[0.04] rounded-2xl hover:bg-[#161619] hover:border-white/[0.08] transition-all group"
                >
                  {/* Poster Thumbnail — auto YouTube thumbnail */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] font-bold text-gray-600 w-5 text-center">{movie.sort_order || "–"}</span>
                    <div className="w-12 h-16 md:w-14 md:h-20 rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
                      <img src={getSmartPoster(movie.poster_url, movie.video_url, movie.id)} alt={movie.title} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-base font-bold text-white truncate">{movie.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-gray-500">{movie.creator_name || "Unknown"}</span>
                      <span className="text-[11px] text-gray-700">·</span>
                      <span className="text-[11px] text-gray-500">{movie.category}</span>
                      <span className="text-[11px] text-gray-700">·</span>
                      <span className="text-[11px] text-gray-600">{new Date(movie.created_at).toLocaleDateString()}</span>
                      {movie.video_url && <span className="text-[10px] text-green-500/60">▶ Video</span>}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative flex-shrink-0">
                    <select
                      value={movie.status}
                      onChange={(e) => updateStatus(movie, e.target.value)}
                      className={`appearance-none px-3 py-1.5 pr-7 text-[11px] font-bold uppercase tracking-wider rounded-lg border cursor-pointer outline-none ${st.bg} ${st.text}`}
                      style={{ backgroundImage: "none" }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-[#0c0c0e] text-white">{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${st.text}`} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => window.open(`/movie/${movie.id}`, "_blank")}
                      className="p-2 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                      title="Preview"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => setEditMovie({ ...movie })}
                      className="p-2 text-gray-600 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/5"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(movie)}
                      className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>)}
      </div>

      {/* ═══════ EDIT MODAL ═══════ */}
      {editMovie && (
        <div className="fixed inset-0 z-[500] flex items-start justify-center pt-10 pb-10 overflow-y-auto" onClick={() => setEditMovie(null)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-2xl bg-[#0c0c0e] border border-white/[0.06] rounded-2xl shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeInUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-lg font-black text-white">Edit Film</h2>
              <button onClick={() => setEditMovie(null)} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Title</label>
                <input value={editMovie.title} onChange={(e) => setEditMovie({ ...editMovie, title: e.target.value })} className="submit-input" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea value={editMovie.description || ""} onChange={(e) => setEditMovie({ ...editMovie, description: e.target.value })} className="submit-textarea" rows={4} />
              </div>

              {/* Category + Genre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Category</label>
                  <select value={editMovie.category} onChange={(e) => setEditMovie({ ...editMovie, category: e.target.value })} className="submit-select">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Genre</label>
                  <select value={editMovie.genre || ""} onChange={(e) => setEditMovie({ ...editMovie, genre: e.target.value })} className="submit-select">
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {/* Duration + Rating + Creator + Position */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Duration</label>
                  <input value={editMovie.duration || ""} onChange={(e) => setEditMovie({ ...editMovie, duration: e.target.value })} className="submit-input" placeholder="1h 45m" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Rating</label>
                  <input type="number" min="0" max="10" step="0.1" value={editMovie.rating} onChange={(e) => setEditMovie({ ...editMovie, rating: parseFloat(e.target.value) || 0 })} className="submit-input" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Creator</label>
                  <input value={editMovie.creator_name || ""} onChange={(e) => setEditMovie({ ...editMovie, creator_name: e.target.value })} className="submit-input" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Position</label>
                  <input type="number" min="0" max="100" value={editMovie.sort_order || 0} onChange={(e) => setEditMovie({ ...editMovie, sort_order: parseInt(e.target.value) || 0 })} className="submit-input" placeholder="1 = first" />
                  <span className="text-[9px] text-gray-600 mt-0.5 block">Lower = higher on page</span>
                </div>
              </div>

              {/* Video URL + Poster URL */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">YouTube / Vimeo URL</label>
                <input value={editMovie.video_url || ""} onChange={(e) => setEditMovie({ ...editMovie, video_url: e.target.value })} className="submit-input" placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Poster Image URL</label>
                <input value={editMovie.poster_url || ""} onChange={(e) => setEditMovie({ ...editMovie, poster_url: e.target.value })} className="submit-input" placeholder="https://..." />
              </div>

              {/* AI Models */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">AI Models</label>
                <div className="flex flex-wrap gap-2">
                  {AI_MODELS.map((model) => {
                    const selected = editMovie.ai_models?.includes(model);
                    return (
                      <button
                        key={model}
                        onClick={() => {
                          const models = selected
                            ? editMovie.ai_models.filter((m) => m !== model)
                            : [...(editMovie.ai_models || []), model];
                          setEditMovie({ ...editMovie, ai_models: models });
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                          selected ? "bg-[#E50914]/15 border-[#E50914] text-white" : "bg-white/[0.03] border-white/10 text-gray-500 hover:text-white"
                        }`}
                      >
                        {selected && <span className="mr-1">✓</span>}{model}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="p-5 border-t border-white/[0.06] flex justify-end gap-3">
              <button onClick={() => setEditMovie(null)} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-[#E50914] text-white text-sm font-bold rounded-lg hover:bg-[#f6121d] transition-all disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DELETE CONFIRMATION ═══════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center" onClick={() => setDeleteTarget(null)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md bg-[#0c0c0e] border border-white/[0.06] rounded-2xl shadow-2xl mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeInUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Film</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to permanently delete <strong className="text-white">&ldquo;{deleteTarget.title}&rdquo;</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={deleteMovie} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-500 transition-all disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] px-5 py-3 rounded-xl bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl" style={{ animation: "fadeInUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
          <span className="text-[13px] font-medium tracking-wide text-white/80">{toast}</span>
        </div>
      )}
    </div>
  );
}
