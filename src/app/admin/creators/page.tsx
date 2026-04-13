"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowUp, ArrowDown, Save, Eye, EyeOff,
  Loader2, Trash2, Plus, Check, X, Pencil,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PioneerCreator {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  bio: string;
  highlight: string;
  toolkit: string[];
  website: string;
  social_x: string;
  social_youtube: string;
  social_instagram: string;
  social_facebook: string;
  email: string;
  sort_order: number;
  visible: boolean;
}

export default function AdminCreatorsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<PioneerCreator[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PioneerCreator | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    async function check() {
      if (!supabase) { setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role === "admin") {
        setIsAdmin(true);
        await fetchCreators();
      }
      setLoading(false);
    }
    check();
  }, []);

  const fetchCreators = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("pioneer_creators")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setCreators(data);
  };

  const moveCreator = async (id: string, direction: "up" | "down") => {
    const idx = creators.findIndex(c => c.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === creators.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const a = creators[idx];
    const b = creators[swapIdx];

    if (!supabase) return;
    await supabase.from("pioneer_creators").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("pioneer_creators").update({ sort_order: a.sort_order }).eq("id", b.id);
    await fetchCreators();
    showToast(`Moved ${a.name} ${direction}`);
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    if (!supabase) return;
    await supabase.from("pioneer_creators").update({ visible: !current }).eq("id", id);
    await fetchCreators();
    showToast(!current ? "Now visible" : "Now hidden");
  };

  const startEdit = (creator: PioneerCreator) => {
    setEditingId(creator.id);
    setEditForm({ ...creator });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!supabase || !editForm) return;
    setSaving(true);
    const { error } = await supabase.from("pioneer_creators").update({
      name: editForm.name,
      role: editForm.role,
      bio: editForm.bio,
      highlight: editForm.highlight,
      toolkit: editForm.toolkit,
      website: editForm.website,
      social_x: editForm.social_x,
      social_youtube: editForm.social_youtube,
      social_instagram: editForm.social_instagram,
      social_facebook: editForm.social_facebook,
      email: editForm.email,
    }).eq("id", editForm.id);

    if (!error) {
      showToast(`${editForm.name} updated`);
      setEditingId(null);
      setEditForm(null);
      await fetchCreators();
    } else {
      showToast("Error saving");
    }
    setSaving(false);
  };

  const deleteCreator = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    if (!supabase) return;
    await supabase.from("pioneer_creators").delete().eq("id", id);
    await fetchCreators();
    showToast(`${name} deleted`);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-white/10 animate-spin" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
      <p className="text-white/20">Admin access required</p>
    </div>
  );

  const inputClass = "w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder-white/15 focus:outline-none focus:border-purple-500/30 transition-all";
  const labelClass = "block text-[9px] font-bold tracking-[0.15em] text-white/20 uppercase mb-1";

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      {/* Nav */}
      <div className="sticky top-0 z-50 bg-[#08080c]/90 backdrop-blur-xl border-b border-white/[0.04] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin/dashboard")} className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all cursor-pointer">
              <ArrowLeft size={15} />
            </button>
            <h1 className="text-lg font-bold">Manage Pioneer Creators</h1>
            <span className="text-xs text-white/20">{creators.length} creators</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-3">
        {creators.map((creator, idx) => (
          <div key={creator.id} className={`rounded-xl border p-5 transition-all ${creator.visible ? "border-white/[0.06] bg-white/[0.02]" : "border-red-500/10 bg-red-500/[0.02] opacity-50"}`}>

            {editingId === creator.id && editForm ? (
              /* ═══ EDIT MODE ═══ */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-purple-400">Editing: {creator.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/25 transition-all">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                    </button>
                    <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs rounded-lg hover:text-white/60 transition-all">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Role</label>
                    <input value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className={inputClass} placeholder="e.g. AI Creative Director" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Bio</label>
                  <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} rows={3} className={inputClass + " resize-none"} />
                </div>

                <div>
                  <label className={labelClass}>Highlight</label>
                  <textarea value={editForm.highlight} onChange={e => setEditForm({ ...editForm, highlight: e.target.value })} rows={2} className={inputClass + " resize-none"} placeholder="Key achievement or unique selling point" />
                </div>

                <div>
                  <label className={labelClass}>Toolkit (comma separated)</label>
                  <input value={(editForm.toolkit || []).join(", ")} onChange={e => setEditForm({ ...editForm, toolkit: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} className={inputClass} placeholder="Kling, Runway, Midjourney" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Website</label>
                    <input value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} className={inputClass} placeholder="https://..." />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} placeholder="email@..." />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={labelClass}>Instagram</label>
                    <input value={editForm.social_instagram} onChange={e => setEditForm({ ...editForm, social_instagram: e.target.value })} className={inputClass} placeholder="@user" />
                  </div>
                  <div>
                    <label className={labelClass}>YouTube</label>
                    <input value={editForm.social_youtube} onChange={e => setEditForm({ ...editForm, social_youtube: e.target.value })} className={inputClass} placeholder="@channel" />
                  </div>
                  <div>
                    <label className={labelClass}>Facebook</label>
                    <input value={editForm.social_facebook} onChange={e => setEditForm({ ...editForm, social_facebook: e.target.value })} className={inputClass} placeholder="username" />
                  </div>
                  <div>
                    <label className={labelClass}>X / Twitter</label>
                    <input value={editForm.social_x} onChange={e => setEditForm({ ...editForm, social_x: e.target.value })} className={inputClass} placeholder="@handle" />
                  </div>
                </div>
              </div>
            ) : (
              /* ═══ VIEW MODE ═══ */
              <div className="flex items-center gap-4">
                {/* Sort Order */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => moveCreator(creator.id, "up")} disabled={idx === 0}
                    className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/20 hover:text-white/60 disabled:opacity-20 transition-all cursor-pointer">
                    <ArrowUp size={12} />
                  </button>
                  <span className="text-center text-[10px] text-white/15 font-bold">{idx + 1}</span>
                  <button onClick={() => moveCreator(creator.id, "down")} disabled={idx === creators.length - 1}
                    className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/20 hover:text-white/60 disabled:opacity-20 transition-all cursor-pointer">
                    <ArrowDown size={12} />
                  </button>
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center text-sm font-bold text-white/30">
                      {creator.name[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">{creator.name}</h3>
                  <p className="text-xs text-white/30 truncate">{creator.role}</p>
                  <p className="text-[10px] text-white/15 truncate mt-0.5">{creator.bio?.slice(0, 80)}...</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(creator)} className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/25 hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer" title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => toggleVisibility(creator.id, creator.visible)} className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center transition-all cursor-pointer" title={creator.visible ? "Hide" : "Show"}>
                    {creator.visible ? <Eye size={13} className="text-green-400/50" /> : <EyeOff size={13} className="text-red-400/50" />}
                  </button>
                  <button onClick={() => deleteCreator(creator.id, creator.name)} className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/15 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm backdrop-blur-xl">
          <Check size={14} className="inline mr-2" />{toast}
        </div>
      )}
    </div>
  );
}
