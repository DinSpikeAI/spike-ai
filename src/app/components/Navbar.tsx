"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Bell, X, Shield, Menu, Plus,
  User as UserIcon, List as ListIcon, Settings as SettingsIcon, HelpCircle, LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Category } from "./types";

const GOLD = "#D4A857";
const ACCENT = "#C4B5FD";
const MONO = "ui-monospace, 'JetBrains Mono', Menlo, Monaco, monospace";
const SERIF = "'Fraunces', 'Instrument Serif', Georgia, serif";

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

  // Admin beats Creator when both are true
  const isGoldUser = isAdmin || isCreator;

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

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowProfile(false);
        setShowNotifs(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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

  // DB-driven notifications
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

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "User");
  const firstLetter = (displayName || "U").charAt(0).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="flex items-center gap-6 md:gap-12">
        <div className="select-none cursor-pointer flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="inline-flex items-center gap-3 font-serif font-light tracking-[-0.01em] text-[22px] text-white">
            <svg width="28" height="28" viewBox="0 0 60 60" style={{ borderRadius: 7, background: "#0a0a10", flexShrink: 0 }} aria-label="Spike AI">
              <rect x="20" y="20" width="4" height="20" rx="1" fill="#8B5CF6" />
              <rect x="28" y="16" width="4" height="28" rx="1" fill="#6366F1" />
              <rect x="36" y="23" width="4" height="14" rx="1" fill="#6366F1" opacity="0.75" />
            </svg>
            <span>spike<em className="not-italic [font-style:italic] font-light opacity-80">&nbsp;AI</em></span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: "My List", href: "/my-list" },
            { label: "Creators", href: "/creators" },
            ...(isCreator ? [{ label: "Submit Film", href: "/submit", special: true }] : []),
            ...(!isCreator ? [{ label: "Join as Creator", href: "/become-creator", special: true }] : []),
          ].map((link) => (
            link.special ? (
              <a key={link.label} href={link.href} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, textDecoration: "none", padding: "8px 16px", border: "1px solid rgba(212,168,87,0.4)", background: "rgba(212,168,87,0.05)", marginLeft: 4, transition: "all 0.25s ease" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,87,0.12)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,87,0.05)"; }}>{link.label}</a>
            ) : (
              <a key={link.label} href={link.href} style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", textDecoration: "none", transition: "color 0.25s ease" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#FAFAFA"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}>{link.label}</a>
            )
          ))}
        </div>
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
            <button onClick={toggleSearch} className="text-white/40 hover:text-white transition-colors">
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
              <button onClick={() => { onSearchOpen(); toggleSearch(); }} className="w-full py-2.5 text-xs font-medium tracking-wide text-[#ffffff] hover:bg-white/[0.04] transition-colors">
                See all results →
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div ref={notifsRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            className="text-white/40 hover:text-white transition-colors relative cursor-pointer"
          >
            <Bell size={19} />
            {dbNotifs.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-white/20 rounded-full" />}
          </button>

          {showNotifs && (
            <div
              className="absolute top-full right-0 mt-3 w-[320px] overflow-hidden z-[200]"
              style={{
                background: "rgba(12,12,18,0.94)",
                backdropFilter: "blur(24px) saturate(1.2)",
                WebkitBackdropFilter: "blur(24px) saturate(1.2)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 2,
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                animation: "fadeInUp 0.25s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 400, color: "#FAFAFA" }}>Notifications</span>
                <span
                  onClick={() => showToast("All notifications marked as read")}
                  style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
                >
                  Mark read
                </span>
              </div>
              {NOTIFICATIONS.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <Bell size={18} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 10px" }} />
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em", margin: 0 }}>No notifications yet</p>
                </div>
              ) : (
                NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => showToast(n.text)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 20px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <span style={{ width: 6, height: 6, background: n.unread ? ACCENT : "transparent", borderRadius: "50%", marginTop: 7, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, lineHeight: 1.4, color: n.unread ? "#FAFAFA" : "rgba(255,255,255,0.5)", margin: 0, fontWeight: n.unread ? 500 : 400 }}>
                        {n.text}
                      </p>
                      <p style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", marginTop: 4, textTransform: "uppercase" }}>
                        {n.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            USER AVATAR + PROFILE DROPDOWN (editorial)
           ═══════════════════════════════════════════════════════════ */}
        <div ref={profileRef} className="relative">
          {user ? (
            <>
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                aria-expanded={showProfile}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: 0,
                  cursor: "pointer",
                  background: isGoldUser
                    ? `linear-gradient(135deg, ${GOLD} 0%, #7A5A28 100%)`
                    : `linear-gradient(135deg, ${ACCENT} 0%, #7C3AED 100%)`,
                  color: "#FAFAFA",
                  fontFamily: SERIF,
                  fontWeight: 400,
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.05)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  firstLetter
                )}
                {/* Admin indicator dot */}
                {isGoldUser && (
                  <span
                    style={{
                      position: "absolute",
                      top: -1,
                      right: -1,
                      width: 10,
                      height: 10,
                      background: GOLD,
                      border: "2px solid #050610",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </button>

              {showProfile && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 12,
                    width: 280,
                    background: "rgba(12,12,18,0.94)",
                    backdropFilter: "blur(24px) saturate(1.2)",
                    WebkitBackdropFilter: "blur(24px) saturate(1.2)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 2,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset",
                    overflow: "hidden",
                    zIndex: 200,
                    animation: "fadeInUp 0.22s cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  {/* Hair-thin stroke at top */}
                  <div
                    style={{
                      position: "absolute",
                      top: -1,
                      right: 12,
                      width: 24,
                      height: 1,
                      background: `linear-gradient(90deg, transparent, ${isGoldUser ? "rgba(212,168,87,0.7)" : "rgba(196,181,253,0.6)"}, transparent)`,
                    }}
                  />

                  {/* ── Header: avatar + name + email + badge ── */}
                  <div style={{ padding: "20px 20px 18px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: isGoldUser
                          ? `linear-gradient(135deg, ${GOLD} 0%, #7A5A28 100%)`
                          : `linear-gradient(135deg, ${ACCENT} 0%, #7C3AED 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: SERIF,
                        fontWeight: 400,
                        fontSize: 18,
                        color: "#FAFAFA",
                        flexShrink: 0,
                      }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        firstLetter
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 17, letterSpacing: "-0.01em", lineHeight: 1.2, color: "#FAFAFA", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {displayName}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.06em", color: "rgba(255,255,255,0.45)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {user.email}
                      </div>
                    </div>
                    {isAdmin && (
                      <div
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          fontFamily: MONO,
                          fontSize: 8.5,
                          letterSpacing: "0.24em",
                          textTransform: "uppercase",
                          color: GOLD,
                          padding: "3px 7px",
                          border: "1px solid rgba(212,168,87,0.35)",
                          borderRadius: 2,
                          background: "rgba(212,168,87,0.06)",
                        }}
                      >
                        Admin
                      </div>
                    )}
                    {!isAdmin && isCreator && (
                      <div
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          fontFamily: MONO,
                          fontSize: 8.5,
                          letterSpacing: "0.24em",
                          textTransform: "uppercase",
                          color: GOLD,
                          padding: "3px 7px",
                          border: "1px solid rgba(212,168,87,0.35)",
                          borderRadius: 2,
                          background: "rgba(212,168,87,0.06)",
                        }}
                      >
                        Creator
                      </div>
                    )}
                  </div>

                  {/* ── ADMIN/CREATOR BLOCK ── */}
                  {isGoldUser && (
                    <div
                      style={{
                        padding: "14px 20px 12px",
                        background: "linear-gradient(180deg, rgba(212,168,87,0.05), rgba(212,168,87,0))",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: 9,
                          letterSpacing: "0.32em",
                          textTransform: "uppercase",
                          color: "rgba(212,168,87,0.75)",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ width: 14, height: 1, background: "rgba(212,168,87,0.5)" }} />
                        {isAdmin ? "Administration" : "Creator Studio"}
                      </div>

                      {/* Admin Dashboard — admin only */}
                      {isAdmin && (
                        <div
                          onClick={() => { setShowProfile(false); router.push("/admin/dashboard"); }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "11px 20px",
                            margin: "0 -20px",
                            color: GOLD,
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 500,
                            transition: "background 0.12s ease",
                          }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(212,168,87,0.08)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                        >
                          <Shield size={16} style={{ color: GOLD, flexShrink: 0 }} />
                          <span>Admin Dashboard</span>
                          <span style={{ marginLeft: "auto", fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, color: "rgba(212,168,87,0.7)" }}>↗</span>
                        </div>
                      )}

                      {/* Add New Film — admin + creator */}
                      <div
                        onClick={() => { setShowProfile(false); router.push("/submit"); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginTop: 6,
                          padding: "11px 14px",
                          background: "#FAFAFA",
                          color: "#050610",
                          fontWeight: 600,
                          fontSize: 13.5,
                          borderRadius: 2,
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "transform 0.12s ease",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateY(-1px)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "translateY(0)")}
                      >
                        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 16, lineHeight: 1 }}>+</span>
                        Add New Film
                      </div>
                    </div>
                  )}

                  {/* ── Regular items ── */}
                  <div style={{ padding: "6px 0" }}>
                    {[
                      { label: "My Profile", icon: UserIcon, href: "/profile", kbd: "⌘ P" },
                      { label: "My List", icon: ListIcon, href: "/my-list", kbd: "⌘ L" },
                      { label: "Settings", icon: SettingsIcon, href: "/settings" },
                      { label: "Help Center", icon: HelpCircle, href: "/help" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          onClick={() => { setShowProfile(false); router.push(item.href); }}
                          className="menu-item"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 20px",
                            color: "rgba(255,255,255,0.85)",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 400,
                            transition: "background 0.12s ease, color 0.12s ease",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.background = "rgba(255,255,255,0.04)";
                            el.style.color = "#FAFAFA";
                            const iconEl = el.querySelector(".menu-icon") as HTMLElement | null;
                            if (iconEl) iconEl.style.color = isGoldUser ? GOLD : ACCENT;
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.background = "transparent";
                            el.style.color = "rgba(255,255,255,0.85)";
                            const iconEl = el.querySelector(".menu-icon") as HTMLElement | null;
                            if (iconEl) iconEl.style.color = "rgba(255,255,255,0.5)";
                          }}
                        >
                          <Icon size={16} className="menu-icon" style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0, transition: "color 0.12s ease" }} />
                          <span>{item.label}</span>
                          {item.kbd && (
                            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
                              {item.kbd}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />

                  {/* Sign out */}
                  <div style={{ padding: "6px 0" }}>
                    <div
                      onClick={async () => {
                        if (supabase) await supabase.auth.signOut();
                        setShowProfile(false);
                        showToast("Signed out");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 20px",
                        color: "rgba(255,255,255,0.75)",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 400,
                        transition: "background 0.12s ease, color 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "rgba(255,255,255,0.04)";
                        el.style.color = "#E8AE6C";
                        const iconEl = el.querySelector(".signout-icon") as HTMLElement | null;
                        if (iconEl) iconEl.style.color = "#E8AE6C";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "transparent";
                        el.style.color = "rgba(255,255,255,0.75)";
                        const iconEl = el.querySelector(".signout-icon") as HTMLElement | null;
                        if (iconEl) iconEl.style.color = "rgba(212,168,87,0.55)";
                      }}
                    >
                      <LogOut size={16} className="signout-icon" style={{ color: "rgba(212,168,87,0.55)", flexShrink: 0, transition: "color 0.12s ease" }} />
                      <span>Sign out</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      padding: "10px 20px 12px",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      fontFamily: MONO,
                      fontSize: 9,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Vol · I · 2026</span>
                    <span>v1.0.3</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, background: "rgba(212,168,87,0.05)", border: "1px solid rgba(212,168,87,0.4)", padding: "8px 18px", cursor: "pointer", transition: "background 0.25s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,87,0.12)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,87,0.05)"; }}
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
                <span className="inline-flex items-center gap-3 font-serif font-light tracking-[-0.01em] text-[18px] text-white">
                  <svg width="22" height="22" viewBox="0 0 60 60" style={{ borderRadius: 7, background: "#0a0a10", flexShrink: 0 }}>
                    <rect x="20" y="20" width="4" height="20" rx="1" fill="#8B5CF6" />
                    <rect x="28" y="16" width="4" height="28" rx="1" fill="#6366F1" />
                    <rect x="36" y="23" width="4" height="14" rx="1" fill="#6366F1" opacity="0.75" />
                  </svg>
                  <span>spike<em className="not-italic [font-style:italic] font-light opacity-80">&nbsp;AI</em></span>
                </span>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="text-white/30 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="py-3">
              {[
                { label: "Home", href: "/" },
                { label: "Blog", href: "/blog" },
                { label: "My List", href: "/my-list" },
                { label: "Creators", href: "/creators" },
                ...(isCreator ? [{ label: "Submit Film", href: "/submit" }] : []),
                ...(!isCreator ? [{ label: "Join as Creator", href: "/become-creator" }] : []),
              ].map((item) => (
                <a key={item.label} href={item.href} className="flex items-center gap-3 px-5 py-3.5 text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors" onClick={() => setShowMobileMenu(false)}>
                  <span className="text-[14px] font-medium tracking-wide">{item.label}</span>
                </a>
              ))}
              {isAdmin && (
                <div className="border-t border-white/[0.06] mt-2 pt-2">
                  <a href="/admin/dashboard" className="flex items-center gap-3 px-5 py-3.5 transition-colors" style={{ color: GOLD }} onClick={() => setShowMobileMenu(false)}>
                    <Shield size={16} />
                    <span className="text-[14px] font-medium tracking-wide">Admin Dashboard</span>
                  </a>
                </div>
              )}
              {isGoldUser && (
                <div className="border-t border-white/[0.06] mt-2 pt-2">
                  <a href="/submit" className="flex items-center gap-3 px-5 py-3.5 transition-colors" style={{ color: GOLD }} onClick={() => setShowMobileMenu(false)}>
                    <Plus size={16} />
                    <span className="text-[14px] font-medium tracking-wide">Add New Film</span>
                  </a>
                </div>
              )}
              <div className="border-t border-white/[0.06] mt-2 pt-2">
                {user ? (
                  <button
                    onClick={async () => { if (supabase) await supabase.auth.signOut(); setShowMobileMenu(false); }}
                    className="flex items-center gap-3 px-5 py-3.5 text-white/75 hover:text-white hover:bg-white/[0.04] transition-colors w-full"
                  >
                    <LogOut size={16} />
                    <span className="text-[14px] font-medium tracking-wide">Sign out</span>
                  </button>
                ) : (
                  <a href="/auth" className="flex items-center gap-3 px-5 py-3.5 text-white hover:bg-white/[0.04] transition-colors" onClick={() => setShowMobileMenu(false)}>
                    <span className="text-[14px] font-medium tracking-wide">Sign in</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
