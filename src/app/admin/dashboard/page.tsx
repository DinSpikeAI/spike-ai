"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield, Film, Trash2, Pencil, Check, X, Loader2, RefreshCw,
  ArrowLeft, ChevronDown, Search, Zap, Clock, XCircle, Eye,
  Save, Plus, AlertTriangle, Inbox, CheckCircle, Ban,
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

const CATEGORIES = ["Trending", "Sora Masterpieces", "AI Horror", "Sci-Fi Visions", "Award Winning", "AI Anime"];
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

    if (!error && data) setMovies(data as Movie[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authChecking && isAdmin) fetchMovies();
  }, [isAdmin, authChecking, fetchMovies]);

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
              <img src="/mascot.png" alt="Spike" className="h-7 w-auto" />
              <span className="text-[16px] font-black tracking-tight text-white">spike</span>
              <span className="text-[16px] font-black tracking-tight text-[#E50914]" style={{ marginLeft: "-4px" }}>AI</span>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Films", value: stats.total, color: "text-white", filter: "all" },
            { label: "Approved", value: stats.approved, color: "text-green-400", filter: "approved" },
            { label: "Pending", value: stats.pending, color: "text-yellow-400", filter: "pending" },
            { label: "Rejected", value: stats.rejected, color: "text-red-400", filter: "rejected" },
          ].map((s) => (
            <div
              key={s.label}
              onClick={() => setStatusFilter(s.filter)}
              className={`bg-white/[0.02] border rounded-xl p-4 cursor-pointer transition-all hover:bg-white/[0.04] ${
                statusFilter === s.filter ? "border-white/[0.12]" : "border-white/[0.05]"
              } ${s.filter === "pending" && stats.pending > 0 ? "ring-1 ring-yellow-500/20" : ""}`}
            >
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{s.label}</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                {s.filter === "pending" && stats.pending > 0 && (
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                )}
              </div>
            </div>
          ))}
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
                  className="flex items-center gap-4 p-3 md:p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition-colors group"
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
