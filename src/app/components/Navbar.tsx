"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search, Bell, Star, X, Shield, Menu, Plus, Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Category } from "./types";

export default function Navbar({ onSearchOpen, categories, isAdmin, isCreator }: { onSearchOpen: () => void; categories: Category[]; isAdmin: boolean; isCreator: boolean }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setShowProfile(false);
    setShowNotifs(false);
    setTimeout(() => setToast(null), 2500);
  };

  // Auth state listener
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleSearch = () => {
    if (searchExpanded) {
      setSearchExpanded(false);
      setQuickSearch("");
    } else {
      setSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const allMovies = categories.flatMap((c) => c.movies).filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);
  const quickResults = quickSearch.length > 1
    ? allMovies.filter((m) =>
        m.title.toLowerCase().includes(quickSearch.toLowerCase()) ||
        m.genre?.toLowerCase().includes(quickSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  // ── DB-driven notifications (admin adds via Supabase) ──
  const [dbNotifs, setDbNotifs] = useState<{ id: string; title: string; body: string | null; created_at: string }[]>([]);
  useEffect(() => {
    if (!supabase) return;
    async function loadNotifs() {
      const { data } = await supabase!
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setDbNotifs(data);
    }
    loadNotifs();
  }, []);

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const NOTIFICATIONS = dbNotifs.map((n, i) => ({
    id: n.id,
    text: n.title,
    time: timeAgo(n.created_at),
    unread: i < 2,
  }));

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="flex items-center gap-6 md:gap-12">
        <div className="select-none cursor-pointer flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="text-[20px] font-semibold tracking-[0.18em] text-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>spike AI</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: "My List", href: "/my-list" },
            { label: "Creators", href: "/creators" },
            ...(isCreator ? [{ label: "Submit Film", href: "/submit", special: true }] : []),
            ...(!isCreator ? [{ label: "Join as Creator", href: "/spike_apply_en.html", special: true }] : []),
          ].map((link) => (
            link.special ? (
              <a key={link.label} href={link.href} className="text-[12.5px] font-medium tracking-[0.04em] px-5 py-1.5 rounded-full border border-white/30 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300 ml-1">{link.label}</a>
            ) : (
              <a key={link.label} href={link.href} className="text-[13px] text-white/50 hover:text-white transition-colors duration-300 font-normal tracking-[0.04em]">{link.label}</a>
            )
          ))}
        </div>
        {/* Mobile Hamburger */}
        <button onClick={() => setShowMobileMenu(true)} className="md:hidden text-white/50 hover:text-white transition-colors">
          <Menu size={22} />
        </button>
      </div>
      <div className="flex items-center gap-3 md:gap-5 relative">
        {/* Inline Search */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <input
              ref={searchInputRef}
              id="navbar-search"
              name="navbar-search"
              type="text"
              autoComplete="off"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") toggleSearch(); if (e.key === "Enter" && quickSearch) onSearchOpen(); }}
              placeholder="Search films..."
              className={`navbar-search ${searchExpanded ? "expanded" : ""}`}
            />
            <button
              onClick={toggleSearch}
              className="text-white/40 hover:text-white transition-colors"
            >
              {searchExpanded ? <X size={19} /> : <Search size={19} />}
            </button>
          </div>

          {searchExpanded && quickResults.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-[280px] bg-[#0c0c0e] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
              {quickResults.map((m) => (
                <div
                  key={m.id}
                  onClick={() => { router.push(`/movie/${m.id}`); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors border-b border-white/[0.04] last:border-0"
                >
                  <img src={m.poster} alt={m.title} className="w-8 h-12 rounded object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium tracking-wide text-white truncate">{m.title}</p>
                    <p className="text-[10px] font-light tracking-wider text-white/30">{m.year} · {m.genre} · ★ {m.rating}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => { onSearchOpen(); toggleSearch(); }}
                className="w-full py-2.5 text-xs font-medium tracking-wide text-[#ffffff] hover:bg-white/[0.04] transition-colors"
              >
                See all results →
              </button>
            </div>
          )}
        </div>

        {/* ── Notifications Bell (Interactive) ── */}
        <div ref={notifsRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            className="text-white/40 hover:text-white transition-colors relative cursor-pointer"
          >
            <Bell size={19} />
            {dbNotifs.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-white/20 rounded-full" />}
          </button>

          {showNotifs && (
            <div className="absolute top-full right-0 mt-3 w-[320px] bg-[#0c0c0e] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-[200]" style={{ animation: "fadeInUp 0.25s cubic-bezier(0.22,1,0.36,1)" }}>
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wide text-white">Notifications</span>
                <span onClick={() => showToast("All notifications marked as read")} className="text-[10px] font-medium tracking-wide text-[#ffffff] cursor-pointer hover:text-[#e0e0e0] transition-colors">Mark all read</span>
              </div>
              {NOTIFICATIONS.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={20} className="text-white/10 mx-auto mb-2" />
                  <p className="text-[12px] text-white/25 tracking-wide">No notifications yet</p>
                </div>
              ) : (
                <>
                  {NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => showToast(n.text)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors border-b border-white/[0.04] last:border-0 active:scale-[0.98]"
                    >
                      {n.unread && <span className="w-1.5 h-1.5 bg-[#ffffff] rounded-full mt-1.5 flex-shrink-0" />}
                      {!n.unread && <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className={`text-[13px] leading-snug tracking-wide ${n.unread ? "text-white font-medium" : "text-white/50 font-normal"}`}>{n.text}</p>
                        <p className="text-[10px] font-light tracking-wider text-white/25 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── User Avatar (Auth-aware) ── */}
        <div ref={profileRef} className="relative">
          {user ? (
            <>
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white/[0.15] transition-all"
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-[11px] font-bold text-white">
                    {(user.user_metadata?.display_name || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </button>

              {showProfile && (
                <div className="absolute top-full right-0 mt-3 w-[240px] bg-[#0c0c0e] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-[200]" style={{ animation: "fadeInUp 0.25s cubic-bezier(0.22,1,0.36,1)" }}>
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-bold">
                          {(user.user_metadata?.display_name || user.email || "U")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-wide text-white truncate">{user.user_metadata?.display_name || user.user_metadata?.full_name || "User"}</p>
                      <p className="text-[10px] font-light tracking-wider text-white/30 truncate">{user.email}</p>
                    </div>
                  </div>
                  {/* Admin-Only Links — Split Reality */}
                  {(isAdmin || isCreator) && (
                    <div className="border-b border-white/[0.06]">
                      {isAdmin && (
                      <div
                        onClick={() => { setShowProfile(false); router.push("/admin/dashboard"); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#ffffff]/[0.06] cursor-pointer transition-colors active:scale-[0.98]"
                      >
                        <Shield size={14} className="text-[#ffffff]" />
                        <span className="text-[13px] font-semibold tracking-wide text-[#ffffff]">Admin Dashboard</span>
                      </div>
                      )}
                      <div
                        onClick={() => { setShowProfile(false); router.push("/submit"); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-500/[0.04] cursor-pointer transition-colors active:scale-[0.98]"
                      >
                        <Plus size={14} className="text-green-400" />
                        <span className="text-[13px] font-medium tracking-wide text-green-400">Add New Film</span>
                      </div>
                    </div>
                  )}
                  {[
                    { label: "My Profile", icon: "👤", href: "/profile" },
                    { label: "My List", icon: "📋", href: "/my-list" },
                    { label: "Settings", icon: "⚙️", href: "/settings" },
                    { label: "Help Center", icon: "❓", href: "/help" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      onClick={() => { setShowProfile(false); router.push(item.href); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] cursor-pointer transition-colors text-white/60 hover:text-white active:scale-[0.98]"
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-[13px] font-normal tracking-wide">{item.label}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/[0.06]">
                    <div
                      onClick={async () => {
                        if (supabase) await supabase.auth.signOut();
                        setShowProfile(false);
                        showToast("Signed out");
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] cursor-pointer transition-colors text-[#ffffff] hover:text-[#e0e0e0] active:scale-[0.98]"
                    >
                      <span className="text-sm">🚪</span>
                      <span className="text-[13px] font-medium tracking-wide">Sign Out</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-sm font-medium text-white/70 hover:text-white hover:border-white/20 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* ═══ MOBILE MENU ═══ */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[250] md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" style={{ animation: "fadeIn 0.2s ease" }} />
          <div
            className="absolute top-0 right-0 w-[280px] h-full bg-[#0a0a0c] border-l border-white/[0.06] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideInRight 0.3s cubic-bezier(0.22,1,0.36,1)" }}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center">
                <span className="text-[16px] font-semibold tracking-[0.18em] text-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>spike AI</span>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="text-white/30 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="py-3">
              {[
                { label: "Home", href: "/", icon: "🏠" },
                { label: "Blog", href: "/blog", icon: "📝" },
                { label: "My List", href: "/my-list", icon: "📋" },
                { label: "Creators", href: "/creators", icon: "🎭" },
                ...(isCreator ? [{ label: "Submit Film", href: "/submit", icon: "🎥" }] : []),
                ...(!isCreator ? [{ label: "Join as Creator", href: "/spike_apply_en.html", icon: "⭐" }] : []),
              ].map((item) => (
                <a key={item.label} href={item.href} className="flex items-center gap-3 px-5 py-3.5 text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors" onClick={() => setShowMobileMenu(false)}>
                  <span className="text-base">{item.icon}</span>
                  <span className="text-[14px] font-medium tracking-wide">{item.label}</span>
                </a>
              ))}
              {isAdmin && (
                <div className="border-t border-white/[0.06] mt-2 pt-2">
                  <a href="/admin/dashboard" className="flex items-center gap-3 px-5 py-3.5 text-green-400 hover:bg-green-500/5 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    <Shield size={16} />
                    <span className="text-[14px] font-medium tracking-wide">Admin Dashboard</span>
                  </a>
                </div>
              )}
              <div className="border-t border-white/[0.06] mt-2 pt-2">
                {user ? (
                  <button
                    onClick={async () => { if (supabase) await supabase.auth.signOut(); setShowMobileMenu(false); }}
                    className="flex items-center gap-3 px-5 py-3.5 text-[#ffffff] hover:bg-white/15/5 transition-colors w-full"
                  >
                    <span className="text-base">🚪</span>
                    <span className="text-[14px] font-medium tracking-wide">Sign Out</span>
                  </button>
                ) : (
                  <a href="/auth" className="flex items-center gap-3 px-5 py-3.5 text-[#ffffff] hover:bg-white/15/5 transition-colors" onClick={() => setShowMobileMenu(false)}>
                    <span className="text-base">🔑</span>
                    <span className="text-[14px] font-medium tracking-wide">Sign In</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-xl bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 flex items-center gap-3"
          style={{ animation: "fadeInUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}
        >
          <span className="text-[13px] font-medium tracking-wide text-white/80">{toast}</span>
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO CAROUSEL — Dynamic Top 10 from Supabase
   Crossfade transitions, YouTube thumbnails, auto-rotation
   ═══════════════════════════════════════════════════════════════ */

