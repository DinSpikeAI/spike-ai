"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, ArrowLeft, Loader2, RefreshCw, Plus, Search,
  Users, Send, Clock, Check, X, Flame, Star, Eye,
  ChevronDown, ExternalLink, Copy, Trash2, Filter,
  MessageSquare, UserPlus, Zap, Target, AlertCircle,
} from "lucide-react";
import { supabase, checkIsAdmin } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface Lead {
  id: string;
  name: string;
  platform: string;
  profile_url: string | null;
  work_url: string | null;
  work_title: string | null;
  ai_tools: string[];
  genre: string | null;
  score: number;
  notes: string | null;
  status: string;
  found_at: string;
  contacted_at: string | null;
  replied_at: string | null;
  signed_up_at: string | null;
  profile_id: string | null;
}

interface OutreachEntry {
  id: string;
  lead_id: string;
  platform: string;
  message_type: string;
  message_text: string | null;
  sent_at: string;
  got_reply: boolean;
  reply_sentiment: string;
}

const PLATFORMS = ["youtube", "tiktok", "instagram", "reddit", "twitter", "vimeo", "other"] as const;
const STATUSES = ["new", "contacted", "followed_up", "replied", "interested", "signed_up", "active", "declined", "no_response"] as const;
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  new: { bg: "bg-white/5 border-white/10", text: "text-white/50", dot: "bg-white/30" },
  contacted: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400", dot: "bg-blue-400" },
  followed_up: { bg: "bg-indigo-500/10 border-indigo-500/20", text: "text-indigo-400", dot: "bg-indigo-400" },
  replied: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
  interested: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
  signed_up: { bg: "bg-green-500/10 border-green-500/20", text: "text-green-400", dot: "bg-green-400" },
  active: { bg: "bg-green-500/15 border-green-400/30", text: "text-green-300", dot: "bg-green-300" },
  declined: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
  no_response: { bg: "bg-gray-500/10 border-gray-500/20", text: "text-gray-500", dot: "bg-gray-500" },
};
const PLATFORM_ICONS: Record<string, string> = {
  youtube: "YT", tiktok: "TT", instagram: "IG", reddit: "RD", twitter: "X", vimeo: "VM", other: "?",
};
const AI_TOOLS = ["Runway Gen-4", "Runway Gen-3", "Kling AI", "Sora", "Pika Labs", "Hailuo", "Luma Dream Machine", "Seedance", "Veo3", "Midjourney", "Stable Diffusion XL", "ElevenLabs", "Wan 2.6", "Other"];
const GENRES = ["Sci-Fi", "Horror", "Drama", "Thriller", "Fantasy", "Action", "Anime", "Cyberpunk", "Romance", "Art House", "Comedy", "Documentary", "Experimental"];

/* ═══════════════════════════════════════════════════════════════
   PIPELINE PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function PipelinePage() {
  const router = useRouter();

  // Auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "date" | "status">("score");

  // Add lead
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "", platform: "youtube" as string, profile_url: "", work_url: "", work_title: "",
    ai_tools: [] as string[], genre: "", score: 5, notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Outreach
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [outreachLog, setOutreachLog] = useState<OutreachEntry[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [draftPlatform, setDraftPlatform] = useState("twitter");

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ─── Auth Check ───
  useEffect(() => {
    async function verify() {
      const result = await checkIsAdmin();
      setIsAdmin(result.isAdmin);
      setAuthChecking(false);
    }
    verify();
  }, []);

  // ─── Fetch Leads ───
  const fetchLeads = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("creator_leads")
      .select("*")
      .order("score", { ascending: false });
    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authChecking && isAdmin) fetchLeads();
  }, [isAdmin, authChecking, fetchLeads]);

  // ─── Fetch Outreach for Selected Lead ───
  const fetchOutreach = async (leadId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("outreach_log")
      .select("*")
      .eq("lead_id", leadId)
      .order("sent_at", { ascending: true });
    if (data) setOutreachLog(data as OutreachEntry[]);
  };

  // ─── Add Lead ───
  const addLead = async () => {
    if (!supabase || !newLead.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("creator_leads").insert({
      name: newLead.name.trim(),
      platform: newLead.platform,
      profile_url: newLead.profile_url || null,
      work_url: newLead.work_url || null,
      work_title: newLead.work_title || null,
      ai_tools: newLead.ai_tools,
      genre: newLead.genre || null,
      score: newLead.score,
      notes: newLead.notes || null,
    });
    if (!error) {
      showToast(`Added "${newLead.name}"`);
      setNewLead({ name: "", platform: "youtube", profile_url: "", work_url: "", work_title: "", ai_tools: [], genre: "", score: 5, notes: "" });
      setShowAddForm(false);
      fetchLeads();
    } else {
      showToast(`Error: ${error.message}`);
    }
    setSaving(false);
  };

  // ─── Update Lead Status ───
  const updateStatus = async (lead: Lead, newStatus: string) => {
    if (!supabase) return;
    const updates: any = { status: newStatus };
    if (newStatus === "contacted" && !lead.contacted_at) updates.contacted_at = new Date().toISOString();
    if (newStatus === "replied" && !lead.replied_at) updates.replied_at = new Date().toISOString();
    if (newStatus === "signed_up" && !lead.signed_up_at) updates.signed_up_at = new Date().toISOString();
    const { error } = await supabase.from("creator_leads").update(updates).eq("id", lead.id);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...updates } : l));
      showToast(`${lead.name} → ${newStatus}`);
    }
  };

  // ─── Update Lead Score ───
  const updateScore = async (lead: Lead, newScore: number) => {
    if (!supabase) return;
    const { error } = await supabase.from("creator_leads").update({ score: newScore }).eq("id", lead.id);
    if (!error) setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, score: newScore } : l));
  };

  // ─── Delete Lead ───
  const deleteLead = async (lead: Lead) => {
    if (!supabase) return;
    const { error } = await supabase.from("creator_leads").delete().eq("id", lead.id);
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      showToast(`Deleted "${lead.name}"`);
      if (selectedLead?.id === lead.id) setSelectedLead(null);
    }
  };

  // ─── Log Outreach ───
  const logOutreach = async () => {
    if (!supabase || !selectedLead || !draftMessage.trim()) return;
    const attempts = outreachLog.filter(o => o.message_type !== "reply").length;
    const msgType = attempts === 0 ? "initial" : attempts === 1 ? "follow_up_1" : "follow_up_2";

    if (attempts >= 3) {
      showToast("Max 3 attempts reached for this lead");
      return;
    }

    const { error } = await supabase.from("outreach_log").insert({
      lead_id: selectedLead.id,
      platform: draftPlatform,
      message_type: msgType,
      message_text: draftMessage.trim(),
    });
    if (!error) {
      showToast("Outreach logged");
      setDraftMessage("");
      fetchOutreach(selectedLead.id);
      // Auto-update lead status
      if (selectedLead.status === "new") updateStatus(selectedLead, "contacted");
      else if (selectedLead.status === "contacted" && msgType !== "initial") updateStatus(selectedLead, "followed_up");
    }
  };

  // ─── Log Reply ───
  const logReply = async (sentiment: string) => {
    if (!supabase || !selectedLead || !draftMessage.trim()) return;
    const { error } = await supabase.from("outreach_log").insert({
      lead_id: selectedLead.id,
      platform: draftPlatform,
      message_type: "reply",
      message_text: draftMessage.trim(),
      got_reply: true,
      reply_sentiment: sentiment,
    });
    if (!error) {
      showToast("Reply logged");
      setDraftMessage("");
      fetchOutreach(selectedLead.id);
      if (sentiment === "positive") updateStatus(selectedLead, "interested");
      else if (sentiment === "negative") updateStatus(selectedLead, "declined");
      else updateStatus(selectedLead, "replied");
    }
  };

  // ─── Copy to clipboard ───
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  // ─── Filter & Sort ───
  const filtered = leads.filter(l => {
    const matchSearch = search === "" ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.work_title?.toLowerCase().includes(search.toLowerCase()) ||
      l.notes?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchPlatform = platformFilter === "all" || l.platform === platformFilter;
    return matchSearch && matchStatus && matchPlatform;
  }).sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    if (sortBy === "date") return new Date(b.found_at).getTime() - new Date(a.found_at).getTime();
    return STATUSES.indexOf(a.status as any) - STATUSES.indexOf(b.status as any);
  });

  // ─── Pipeline Stats ───
  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.score >= 8 && l.status === "new").length,
    contacted: leads.filter(l => ["contacted", "followed_up"].includes(l.status)).length,
    replied: leads.filter(l => l.status === "replied").length,
    interested: leads.filter(l => l.status === "interested").length,
    signed_up: leads.filter(l => l.status === "signed_up").length,
    active: leads.filter(l => l.status === "active").length,
    needFollowUp: leads.filter(l => {
      if (!["contacted", "followed_up"].includes(l.status)) return false;
      if (!l.contacted_at) return false;
      const days = (Date.now() - new Date(l.contacted_at).getTime()) / (1000 * 60 * 60 * 24);
      return days >= 3;
    }).length,
  };

  /* ═════════════ AUTH STATES ═════════════ */
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-purple-500" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield size={36} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Access Denied</h1>
          <p className="text-gray-500 text-sm mb-6">Admin access required.</p>
          <button onClick={() => router.push("/")} className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-medium">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  /* ═════════════ MAIN UI ═════════════ */
  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 backdrop-blur-xl shadow-2xl shadow-black/50 flex items-center gap-3">
          <Check className="w-4 h-4 text-purple-300" />
          <span className="text-sm font-medium text-purple-200">{toast}</span>
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-50 px-4 md:px-8 py-3 bg-[#08080a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin/dashboard")} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold tracking-[0.15em] text-white/80">spike</span>
              <span className="text-[16px] font-semibold tracking-[0.15em] text-white">AI</span>
            </div>
            <div className="h-5 w-px bg-gray-700" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Target size={12} className="text-purple-400" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-purple-400">Pipeline</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-500 transition-all"
            >
              <Plus size={14} /> Add Lead
            </button>
            <button onClick={fetchLeads} className="p-2 text-gray-400 hover:text-white transition-colors">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">

        {/* ─── Stats ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { label: "Total Leads", value: stats.total, color: "text-white", accent: "border-white/[0.08]" },
            { label: "Hot Leads", value: stats.hot, color: "text-orange-400", accent: "border-orange-500/20" },
            { label: "Contacted", value: stats.contacted, color: "text-blue-400", accent: "border-blue-500/20" },
            { label: "Replied", value: stats.replied, color: "text-amber-400", accent: "border-amber-500/20" },
            { label: "Interested", value: stats.interested, color: "text-emerald-400", accent: "border-emerald-500/20" },
            { label: "Signed Up", value: stats.signed_up, color: "text-green-400", accent: "border-green-500/20" },
            { label: "Active", value: stats.active, color: "text-green-300", accent: "border-green-400/20" },
            { label: "Need Follow-up", value: stats.needFollowUp, color: "text-red-400", accent: "border-red-500/20" },
          ].map(s => (
            <div key={s.label} className={`bg-[#111114] border rounded-2xl p-4 ${s.accent}`}>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ─── Filters ─── */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-[400px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#111114] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/70 outline-none focus:border-purple-500/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#111114] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none"
            style={{ colorScheme: "dark" }}
          >
            <option value="all">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="bg-[#111114] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none"
            style={{ colorScheme: "dark" }}
          >
            <option value="all">All Platforms</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-[#111114] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none"
            style={{ colorScheme: "dark" }}
          >
            <option value="score">Sort: Score</option>
            <option value="date">Sort: Newest</option>
            <option value="status">Sort: Status</option>
          </select>
          <span className="text-[12px] text-white/20 ml-2">{filtered.length} leads</span>
        </div>

        {/* ─── Main Layout: Lead List + Detail Panel ─── */}
        <div className="flex gap-6">

          {/* ── Lead List ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-white/20" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Target size={32} className="text-white/10 mx-auto mb-4" />
                <p className="text-white/20">{leads.length === 0 ? "No leads yet. Add your first one!" : "No leads match filters"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(lead => {
                  const style = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  const isSelected = selectedLead?.id === lead.id;
                  return (
                    <div
                      key={lead.id}
                      onClick={() => { setSelectedLead(lead); fetchOutreach(lead.id); }}
                      className={`bg-[#111114] border rounded-xl p-4 cursor-pointer transition-all hover:bg-[#161619] ${
                        isSelected ? "border-purple-500/30 bg-[#161619]" : "border-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Platform badge */}
                        <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[10px] font-black text-white/40 flex-shrink-0">
                          {PLATFORM_ICONS[lead.platform] || "?"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[14px] font-semibold text-white/80 truncate">{lead.name}</p>
                            {lead.score >= 8 && <Flame size={12} className="text-orange-400 flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-white/25">
                            {lead.work_title && <span className="truncate max-w-[200px]">{lead.work_title}</span>}
                            {lead.genre && <><span>·</span><span>{lead.genre}</span></>}
                            {lead.ai_tools.length > 0 && <><span>·</span><span className="truncate max-w-[150px]">{lead.ai_tools.join(", ")}</span></>}
                          </div>
                        </div>

                        {/* Score */}
                        <div className={`text-[18px] font-black w-8 text-center flex-shrink-0 ${
                          lead.score >= 8 ? "text-orange-400" : lead.score >= 5 ? "text-white/40" : "text-white/15"
                        }`}>
                          {lead.score}
                        </div>

                        {/* Status */}
                        <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase flex-shrink-0 ${style.bg} ${style.text}`}>
                          {lead.status.replace("_", " ")}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {lead.work_url && (
                            <a href={lead.work_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 text-white/15 hover:text-purple-400 transition-colors">
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <button onClick={e => { e.stopPropagation(); deleteLead(lead); }} className="p-1.5 text-white/10 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Detail / Outreach Panel ── */}
          {selectedLead && (
            <div className="w-[420px] flex-shrink-0 sticky top-[70px] h-[calc(100vh-110px)] overflow-y-auto hidden lg:block">
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-6 space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-[18px] font-bold text-white">{selectedLead.name}</h2>
                      {selectedLead.score >= 8 && <Flame size={14} className="text-orange-400" />}
                    </div>
                    <p className="text-[12px] text-white/25">{selectedLead.platform} · Found {new Date(selectedLead.found_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  <button onClick={() => setSelectedLead(null)} className="text-white/15 hover:text-white/50 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-2">
                  {selectedLead.profile_url && (
                    <a href={selectedLead.profile_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-purple-400/70 hover:text-purple-300 flex items-center gap-1 transition-colors">
                      <ExternalLink size={10} /> Profile
                    </a>
                  )}
                  {selectedLead.work_url && (
                    <a href={selectedLead.work_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-purple-400/70 hover:text-purple-300 flex items-center gap-1 transition-colors">
                      <Eye size={10} /> {selectedLead.work_title || "Work"}
                    </a>
                  )}
                </div>

                {/* Score */}
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider font-medium mb-2">Score</p>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => updateScore(selectedLead, n)}
                        className={`w-8 h-8 rounded-lg text-[12px] font-bold transition-all ${
                          n <= selectedLead.score
                            ? n >= 8 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                              n >= 5 ? "bg-white/[0.08] text-white/60 border border-white/[0.1]" :
                              "bg-white/[0.04] text-white/30 border border-white/[0.06]"
                            : "bg-white/[0.02] text-white/10 border border-white/[0.03]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider font-medium mb-2">Status</p>
                  <select
                    value={selectedLead.status}
                    onChange={e => updateStatus(selectedLead, e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/70 outline-none"
                    style={{ colorScheme: "dark" }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>

                {/* Tools & Genre */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedLead.ai_tools.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/30">{t}</span>
                  ))}
                  {selectedLead.genre && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400">{selectedLead.genre}</span>
                  )}
                </div>

                {/* Notes */}
                {selectedLead.notes && (
                  <div>
                    <p className="text-[10px] text-white/20 uppercase tracking-wider font-medium mb-1">Notes</p>
                    <p className="text-[12px] text-white/40 whitespace-pre-line">{selectedLead.notes}</p>
                  </div>
                )}

                {/* Outreach History */}
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                    <MessageSquare size={10} /> Outreach History
                  </p>
                  {outreachLog.length === 0 ? (
                    <p className="text-[11px] text-white/15">No outreach yet</p>
                  ) : (
                    <div className="space-y-2">
                      {outreachLog.map(o => (
                        <div key={o.id} className={`p-3 rounded-lg border text-[12px] ${
                          o.message_type === "reply"
                            ? "bg-amber-500/5 border-amber-500/15 text-amber-300/70"
                            : "bg-white/[0.02] border-white/[0.04] text-white/40"
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/20">
                              {o.message_type === "reply" ? "Their reply" : o.message_type.replace("_", " ")}
                            </span>
                            <span className="text-[9px] text-white/10">
                              {new Date(o.sent_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                            </span>
                            <span className="text-[9px] text-white/10">{o.platform}</span>
                          </div>
                          <p className="whitespace-pre-line">{o.message_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Compose Outreach */}
                <div className="border-t border-white/[0.04] pt-4">
                  <p className="text-[10px] text-white/20 uppercase tracking-wider font-medium mb-2">Log Message</p>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={draftPlatform}
                      onChange={e => setDraftPlatform(e.target.value)}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white/50 outline-none"
                      style={{ colorScheme: "dark" }}
                    >
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="email">email</option>
                    </select>
                  </div>
                  <textarea
                    value={draftMessage}
                    onChange={e => setDraftMessage(e.target.value)}
                    placeholder="Paste the message you sent (or their reply)..."
                    rows={4}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[12px] text-white/60 outline-none resize-none focus:border-purple-500/30 placeholder:text-white/10"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={logOutreach}
                      disabled={!draftMessage.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-[11px] font-bold rounded-lg hover:bg-purple-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Send size={10} /> Log Sent
                    </button>
                    <button
                      onClick={() => logReply("positive")}
                      disabled={!draftMessage.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/80 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Check size={10} /> Log Reply +
                    </button>
                    <button
                      onClick={() => logReply("neutral")}
                      disabled={!draftMessage.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/80 text-white text-[11px] font-bold rounded-lg hover:bg-amber-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Reply ~
                    </button>
                    <button
                      onClick={() => logReply("negative")}
                      disabled={!draftMessage.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 text-white text-[11px] font-bold rounded-lg hover:bg-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Reply -
                    </button>
                  </div>
                  {draftMessage.trim() && (
                    <button
                      onClick={() => copyToClipboard(draftMessage)}
                      className="flex items-center gap-1.5 mt-2 text-[10px] text-white/20 hover:text-white/40 transition-colors"
                    >
                      <Copy size={10} /> Copy to clipboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Add Lead Modal ─── */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-[#111114] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><UserPlus size={18} className="text-purple-400" /> Add Lead</h2>
              <button onClick={() => setShowAddForm(false)} className="text-white/20 hover:text-white/50"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium block mb-1">Name *</label>
                <input type="text" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none focus:border-purple-500/30" placeholder="Creator name or handle" />
              </div>

              {/* Platform + Profile URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium block mb-1">Platform</label>
                  <select value={newLead.platform} onChange={e => setNewLead({ ...newLead, platform: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none" style={{ colorScheme: "dark" }}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium block mb-1">Profile URL</label>
                  <input type="url" value={newLead.profile_url} onChange={e => setNewLead({ ...newLead, profile_url: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none focus:border-purple-500/30" placeholder="https://..." />
                </div>
              </div>

              {/* Work URL + Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium block mb-1">Work URL</label>
                  <input type="url" value={newLead.work_url} onChange={e => setNewLead({ ...newLead, work_url: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none focus:border-purple-500/30" placeholder="Link to their film" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium block mb-1">Work Title</label>
                  <input type="text" value={newLead.work_title} onChange={e => setNewLead({ ...newLead, work_title: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none focus:border-purple-500/30" placeholder="Film name" />
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium block mb-1">Genre</label>
                <select value={newLead.genre} onChange={e => setNewLead({ ...newLead, genre: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none" style={{ colorScheme: "dark" }}>
                  <option value="">Select genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* AI Tools */}
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium block mb-2">AI Tools</label>
                <div className="flex flex-wrap gap-1.5">
                  {AI_TOOLS.map(tool => (
                    <button
                      key={tool}
                      onClick={() => {
                        const tools = newLead.ai_tools.includes(tool)
                          ? newLead.ai_tools.filter(t => t !== tool)
                          : [...newLead.ai_tools, tool];
                        setNewLead({ ...newLead, ai_tools: tools });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        newLead.ai_tools.includes(tool)
                          ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
                          : "bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white/50"
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score */}
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium block mb-2">Score: {newLead.score}/10</label>
                <input
                  type="range" min="1" max="10" value={newLead.score}
                  onChange={e => setNewLead({ ...newLead, score: parseInt(e.target.value) })}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-[9px] text-white/15 mt-1">
                  <span>Skip</span><span>Warm</span><span>Hot</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium block mb-1">Notes</label>
                <textarea value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                  rows={3} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none resize-none focus:border-purple-500/30"
                  placeholder="Why this creator? What stood out?" />
              </div>

              {/* Submit */}
              <button
                onClick={addLead}
                disabled={saving || !newLead.name.trim()}
                className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add to Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
