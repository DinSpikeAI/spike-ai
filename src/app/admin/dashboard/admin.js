const fs = require('fs');
const file = 'src/app/admin/dashboard/page.tsx';
let f = fs.readFileSync(file, 'utf8');

// 1. Add new state variables after showUsers
f = f.replace(
  'const [showUsers, setShowUsers] = useState(false);',
  `const [showUsers, setShowUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("films");
  const [creators, setCreators] = useState([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [smartNotifs, setSmartNotifs] = useState([]);
  const [lastSeenNotif, setLastSeenNotif] = useState("");`
);

// 2. Add fetchCreators after fetchStats
f = f.replace(
  '  useEffect(() => {\n    if (!authChecking && isAdmin) { fetchMovies(); fetchStats(); }\n  }, [isAdmin, authChecking, fetchMovies, fetchStats]);',
  `  const fetchCreators = async () => {
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
  }, [isAdmin, authChecking, fetchMovies, fetchStats]);`
);

// 3. Add Bell icon before Add Film button
f = f.replace(
  '<button\n              onClick={() => router.push("/submit")}',
  `{/* Bell */}
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
              onClick={() => router.push("/submit")}`
);

// 4. Add Tabs + Creators panel before Users & Notifications section
const CREATORS_PANEL = `
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <button onClick={() => setActiveTab("films")} className={"px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all " + (activeTab === "films" ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-white/30 hover:text-white/50")}>
            <Film size={14} className="inline mr-2" />Films ({movies.length})
          </button>
          <button onClick={() => setActiveTab("creators")} className={"px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all " + (activeTab === "creators" ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-white/30 hover:text-white/50")}>
            <Users size={14} className="inline mr-2" />Creators ({creators.length})
          </button>
        </div>

        {/* CREATORS TAB */}
        {activeTab === "creators" && (
          <div className="space-y-4">
            {creatorsLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-white/20" /></div>
            ) : creators.length === 0 ? (
              <div className="text-center py-20 text-white/20">No creators yet</div>
            ) : (
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-white/20 border-b border-white/[0.04]">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-1 text-center">Films</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Joined</div>
                </div>
                {creators.map((c) => (
                  <div key={c.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-1">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/[0.06]" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[12px] text-white/30 font-bold">
                          {(c.display_name || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="col-span-3"><p className="text-[14px] font-semibold text-white/80 truncate">{c.display_name || "No name"}</p></div>
                    <div className="col-span-3"><p className="text-[12px] text-white/30 truncate">{c.email || "-"}</p></div>
                    <div className="col-span-1 text-center">
                      <span className={"text-[13px] font-bold " + (c.films.total > 0 ? "text-green-400" : "text-white/15")}>{c.films.total}</span>
                      {c.films.pending > 0 && <span className="text-[10px] text-yellow-400 ml-1">({c.films.pending})</span>}
                    </div>
                    <div className="col-span-2">
                      <select value={c.role || "user"} onChange={async (e) => { await supabase.from("profiles").update({ role: e.target.value }).eq("id", c.id); showToast(c.display_name + " -> " + e.target.value); fetchCreators(); }} className="bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/60 rounded-lg px-2 py-1.5 outline-none cursor-pointer" style={{ colorScheme: "dark" }}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="col-span-2"><p className="text-[11px] text-white/20">{new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "films" && (<>`;

f = f.replace(
  /\{\/\* ={5,} Users & Notifications/,
  CREATORS_PANEL + '\n        {/* Users & Notifications'
);

// 5. Close the films tab before the edit modal
f = f.replace(
  /\{\/\* ={5,} EDIT MODAL/,
  '</>)}\n\n      {/* EDIT MODAL'
);

// 6. Add React import if missing
if (!f.includes("import React")) {
  f = f.replace("import { useState,", "import React, { useState,");
}

fs.writeFileSync(file, f, 'utf8');
console.log('Admin dashboard upgraded successfully!');
console.log('Lines: ' + f.split('\n').length);
