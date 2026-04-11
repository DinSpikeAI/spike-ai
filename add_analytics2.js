const fs = require("fs");
const file = "src/app/admin/dashboard/page.tsx";
let f = fs.readFileSync(file, "utf8");

// Check if analytics already exists
if (f.includes("Analytics")) {
  console.log("Analytics already exists - skipping");
  process.exit(0);
}

// Add Sparkles import
if (!f.includes("Sparkles")) {
  f = f.replace('} from "lucide-react"', '  Sparkles,\n} from "lucide-react"');
}

// Find the Creators tab button line and add Analytics button after it
const creatorsButtonEnd = f.indexOf("Creators ({creators.length})");
if (creatorsButtonEnd === -1) {
  console.log("ERROR: Could not find Creators button");
  process.exit(1);
}
const afterCreatorsButton = f.indexOf("</button>", creatorsButtonEnd);
const insertTabAt = f.indexOf("\n", afterCreatorsButton);

const analyticsButton = `
          <button onClick={() => setActiveTab("analytics")} className={"px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all " + (activeTab === "analytics" ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-white/30 hover:text-white/50")}>
            <Sparkles size={14} className="inline mr-2" />Analytics
          </button>`;

f = f.slice(0, insertTabAt) + analyticsButton + f.slice(insertTabAt);

// Find where to insert the analytics panel - after creators panel, before films tab
const filmsTabMarker = f.indexOf('activeTab === "films"');
if (filmsTabMarker === -1) {
  // Try single quotes
  const filmsTabMarker2 = f.indexOf("activeTab === 'films'");
  if (filmsTabMarker2 === -1) {
    console.log("ERROR: Could not find films tab marker");
    console.log("Searching for alternatives...");
    // Search for the pattern more broadly
    const lines = f.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("films") && lines[i].includes("activeTab")) {
        console.log("Found at line " + (i+1) + ": " + lines[i].trim().substring(0, 80));
      }
    }
    process.exit(1);
  }
}

// Find the line with activeTab films and insert before it
const lines = f.split("\n");
let insertLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("activeTab") && lines[i].includes("films") && lines[i].includes("&&")) {
    insertLine = i;
    break;
  }
}

if (insertLine === -1) {
  console.log("ERROR: Could not find films conditional line");
  process.exit(1);
}

const analyticsPanel = `
        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const am = movies.filter(m => m.status === "approved");
                const tu = movies.reduce((s, m) => s + (m.upvotes_count || 0), 0);
                const avg = am.length > 0 ? (tu / am.length).toFixed(1) : "0";
                const g = {}; am.forEach(m => { if (m.genre) g[m.genre] = (g[m.genre] || 0) + 1; });
                const tg = Object.entries(g).sort((a, b) => b[1] - a[1])[0];
                const uc = new Set(am.map(m => m.creator_name).filter(Boolean)).size;
                return [
                  { label: "Approved Films", value: am.length, color: "text-green-400" },
                  { label: "Avg Upvotes", value: avg, color: "text-blue-400" },
                  { label: "Unique Creators", value: uc, color: "text-purple-400" },
                  { label: "Top Genre", value: tg ? tg[0] : "-", color: "text-yellow-400" },
                ].map(s => (
                  <div key={s.label} className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5">
                    <p className="text-[10px] text-white/20 uppercase tracking-wider font-medium mb-2">{s.label}</p>
                    <p className={"text-2xl font-black " + s.color}>{s.value}</p>
                  </div>
                ));
              })()}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-[13px] font-bold text-white/70 mb-4 flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> Top Films by Upvotes</h3>
                <div className="space-y-2">
                  {movies.filter(m => m.status === "approved").sort((a, b) => (b.upvotes_count||0) - (a.upvotes_count||0)).slice(0, 5).map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03]">
                      <span className={"text-[14px] font-black w-6 text-center " + (i===0?"text-yellow-400":i===1?"text-white/40":i===2?"text-amber-600":"text-white/15")}>{i+1}</span>
                      <div className="min-w-0 flex-1"><p className="text-[13px] text-white/70 font-medium truncate">{m.title}</p><p className="text-[10px] text-white/20">{m.creator_name||"Unknown"}</p></div>
                      <span className="text-[13px] font-bold text-blue-400">{m.upvotes_count||0}</span>
                    </div>
                  ))}
                  {movies.filter(m => m.status === "approved").length === 0 && <p className="text-[12px] text-white/15 text-center py-4">No data yet</p>}
                </div>
              </div>
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-[13px] font-bold text-white/70 mb-4 flex items-center gap-2"><Users size={14} className="text-purple-400" /> Top Creators</h3>
                <div className="space-y-2">
                  {(() => { const cf={}; movies.filter(m=>m.status==="approved").forEach(m=>{const n=m.creator_name||"Unknown";cf[n]=(cf[n]||0)+1;}); return Object.entries(cf).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count],i)=>(<div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03]"><span className={"text-[14px] font-black w-6 text-center "+(i===0?"text-purple-400":"text-white/15")}>{i+1}</span><p className="text-[13px] text-white/70 font-medium flex-1 truncate">{name}</p><span className="text-[13px] font-bold text-purple-400">{count}</span></div>)); })()}
                </div>
              </div>
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-[13px] font-bold text-white/70 mb-4 flex items-center gap-2"><Film size={14} className="text-green-400" /> Genres</h3>
                <div className="space-y-2">
                  {(() => { const g={}; movies.filter(m=>m.status==="approved").forEach(m=>{if(m.genre)g[m.genre]=(g[m.genre]||0)+1;}); const t=Object.values(g).reduce((s,v)=>s+v,0); const c=["bg-green-400","bg-blue-400","bg-purple-400","bg-yellow-400","bg-pink-400","bg-cyan-400"]; return Object.entries(g).sort((a,b)=>b[1]-a[1]).map(([genre,count],i)=>(<div key={genre} className="flex items-center gap-3"><p className="text-[12px] text-white/50 w-24 truncate">{genre}</p><div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden"><div className={"h-full rounded-full "+c[i%c.length]} style={{width:(t>0?(count/t*100):0)+"%"}}></div></div><span className="text-[11px] text-white/30 w-8 text-right">{count}</span></div>)); })()}
                </div>
              </div>
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-[13px] font-bold text-white/70 mb-4 flex items-center gap-2"><Sparkles size={14} className="text-cyan-400" /> AI Tools</h3>
                <div className="space-y-2">
                  {(() => { const t={}; movies.filter(m=>m.status==="approved").forEach(m=>{(m.ai_models||[]).forEach(x=>{t[x]=(t[x]||0)+1;});}); const total=Object.values(t).reduce((s,v)=>s+v,0); const c=["bg-cyan-400","bg-violet-400","bg-emerald-400","bg-amber-400","bg-rose-400"]; return Object.entries(t).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([tool,count],i)=>(<div key={tool} className="flex items-center gap-3"><p className="text-[12px] text-white/50 w-28 truncate">{tool}</p><div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden"><div className={"h-full rounded-full "+c[i%c.length]} style={{width:(total>0?(count/total*100):0)+"%"}}></div></div><span className="text-[11px] text-white/30 w-8 text-right">{count}</span></div>)); })()}
                </div>
              </div>
              <div className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5 lg:col-span-2">
                <h3 className="text-[13px] font-bold text-white/70 mb-4 flex items-center gap-2"><Clock size={14} className="text-white/40" /> Recent Activity</h3>
                <div className="space-y-1">
                  {(() => { const ev=[]; movies.slice(0,10).forEach(m=>{ev.push({time:m.created_at,text:(m.status==="pending"?"Submitted":m.status==="approved"?"Approved":"Rejected")+": "+m.title,type:m.status});}); recentUsers.slice(0,5).forEach(u=>{ev.push({time:u.created_at,text:"New user: "+u.email,type:"user"});}); ev.sort((a,b)=>new Date(b.time)-new Date(a.time)); return ev.slice(0,12).map((e,i)=>(<div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02]"><div className={"w-2 h-2 rounded-full flex-shrink-0 "+(e.type==="approved"?"bg-green-400":e.type==="pending"?"bg-yellow-400":e.type==="rejected"?"bg-red-400":"bg-purple-400")}></div><p className={"text-[12px] flex-1 truncate "+(e.type==="approved"?"text-green-400/70":e.type==="pending"?"text-yellow-400/70":e.type==="user"?"text-purple-400/70":"text-red-400/70")}>{e.text}</p><p className="text-[10px] text-white/15 flex-shrink-0">{new Date(e.time).toLocaleDateString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p></div>)); })()}
                </div>
              </div>
            </div>
          </div>
        )}
`;

lines.splice(insertLine, 0, analyticsPanel);
f = lines.join("\n");

fs.writeFileSync(file, f, "utf8");
console.log("Analytics tab added successfully!");
console.log("Total lines: " + f.split("\n").length);
