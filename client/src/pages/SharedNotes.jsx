import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SHARED_NOTES = [
  { id:1, color:"green",  subject:"📐 Mathematics",    subjectKey:"math", title:"Calculus III — Integration Techniques Full Notes",       excerpt:"Triple integrals, surface integrals, Green's and Stokes' theorems with diagrams. Step-by-step worked exam examples for every technique.", tags:["Calculus","Integrals","Y2S2"],    author:"Nimal Perera",   av:"NP", avColor:"#10b981", date:"Mar 15, 2026", likes:17, saves:8,  liked:false, saved:false, pinned:false },
  { id:2, color:"yellow", subject:"🗄️ Database",       subjectKey:"db",   title:"SQL Advanced Queries — Joins, Subqueries & Indexes",    excerpt:"INNER/LEFT/RIGHT/FULL JOINs, CTEs, window functions and index optimization. Essential cheat sheet with real exam examples.",         tags:["SQL","Joins","Indexing","Y3S1"], author:"Sahan Madhawa",  av:"SM", avColor:"#f59e0b", date:"Mar 14, 2026", likes:31, saves:19, liked:false, saved:true,  pinned:true  },
  { id:3, color:"pink",   subject:"✍️ English",        subjectKey:"eng",  title:"Technical Report Writing — Structure & Tips",           excerpt:"Executive summaries, methodology sections and findings writing. Grammar mistakes, APA citations and reference list guidelines.",      tags:["Writing","Reports","Y1S2"],      author:"Dilani Fernando",av:"DF", avColor:"#ec4899", date:"Mar 11, 2026", likes:11, saves:5,  liked:true,  saved:false, pinned:false },
  { id:4, color:"purple", subject:"🌐 Networking",     subjectKey:"net",  title:"OSI Model & TCP/IP — Layer-by-Layer Breakdown",         excerpt:"All 7 OSI layers vs 4-layer TCP/IP model. Protocol mapping, common port numbers table and CIDR subnetting practice problems.",      tags:["OSI","TCP/IP","Protocols"],      author:"Roshan J.",      av:"RJ", avColor:"#8b5cf6", date:"Mar 9, 2026",  likes:22, saves:14, liked:false, saved:true,  pinned:false },
  { id:5, color:"green",  subject:"📐 Mathematics",    subjectKey:"math", title:"Discrete Maths — Graph Theory Notes",                   excerpt:"Euler and Hamiltonian paths, Dijkstra and Bellman-Ford, Kruskal and Prim spanning trees with annotated past exam solutions.",         tags:["Graphs","Dijkstra","Y2S1"],      author:"Thilini W.",     av:"TW", avColor:"#059669", date:"Feb 28, 2026", likes:19, saves:7,  liked:true,  saved:false, pinned:false },
  { id:6, color:"purple", subject:"🌐 Networking",     subjectKey:"net",  title:"Network Security — Cryptography & Firewalls",           excerpt:"RSA key exchange, TLS handshake, firewall rule design, MITM/DDoS/SQL injection attack types. Exam-ready summaries.",               tags:["Security","RSA","Firewalls"],    author:"Malith R.",      av:"MR", avColor:"#7c3aed", date:"Feb 24, 2026", likes:29, saves:16, liked:false, saved:true,  pinned:true  },
];

const colorBar = { blue:"linear-gradient(90deg,#4f6ef7,#818cf8)", green:"linear-gradient(90deg,#10b981,#34d399)", yellow:"linear-gradient(90deg,#f59e0b,#fbbf24)", pink:"linear-gradient(90deg,#ec4899,#f472b6)", purple:"linear-gradient(90deg,#8b5cf6,#a78bfa)", red:"linear-gradient(90deg,#ef4444,#f87171)" };
const subjectStyle = { it:{bg:"#eef1ff",color:"#4f6ef7"}, math:{bg:"#ecfdf5",color:"#059669"}, db:{bg:"#fffbeb",color:"#d97706"}, eng:{bg:"#fdf2f8",color:"#db2777"}, net:{bg:"#f5f3ff",color:"#7c3aed"}, oop:{bg:"#fff1f2",color:"#e11d48"} };

function useAnimateIn(delay=0) {
  const [visible, setVisible] = useState(false);
  const ref = useRef();
  useEffect(()=>{ const t=setTimeout(()=>setVisible(true),delay); return ()=>clearTimeout(t); },[delay]);
  return [ref, visible];
}

function NoteCard({ note, index, onLike, onSave, onPin }) {
  const [ref, visible] = useAnimateIn(180+index*60);
  const [hovered, setHovered] = useState(false);
  const ss = subjectStyle[note.subjectKey];
  return (
    <div ref={ref} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background:"#fff", border:`1px solid ${hovered?"#dde0ea":"#e8eaf0"}`, borderRadius:14, overflow:"hidden", display:"flex", flexDirection:"column", cursor:"pointer", boxShadow:hovered?"0 8px 30px rgba(0,0,0,0.10)":"0 1px 4px rgba(0,0,0,0.04)", transform:visible?(hovered?"translateY(-4px)":"translateY(0)"):"translateY(16px)", opacity:visible?1:0, transition:"opacity 0.45s ease, transform 0.35s ease, box-shadow 0.25s ease" }}>
      <div style={{ height:4, background:colorBar[note.color], flexShrink:0 }} />
      <div style={{ padding:"15px 17px", flex:1 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, background:ss.bg, color:ss.color }}>{note.subject}</span>
          <button onClick={e=>{ e.stopPropagation(); onPin(note.id); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, padding:2, transform:note.pinned?"rotate(-45deg) scale(1.15)":"none", filter:note.pinned?"none":"grayscale(1) opacity(0.4)" }}>📌</button>
        </div>
        <div style={{ fontSize:13.5, fontWeight:700, color:"#1a1c2e", marginBottom:7, lineHeight:1.35 }}>{note.title}</div>
        <div style={{ fontSize:12, color:"#8a91a8", lineHeight:1.65, marginBottom:12 }}>{note.excerpt}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {note.tags.map(t=><span key={t} style={{ background:"#f0f2f8", color:"#4a5068", fontSize:11, padding:"2px 8px", borderRadius:4, fontWeight:500, border:"1px solid #e8eaf0" }}>{t}</span>)}
        </div>
      </div>
      <div style={{ borderTop:"1px solid #e8eaf0", padding:"10px 17px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:22, height:22, borderRadius:6, background:note.avColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff", flexShrink:0 }}>{note.av}</div>
          <div>
            <div style={{ fontSize:12, color:"#4a5068", fontWeight:500 }}>{note.author}</div>
            <div style={{ fontSize:11, color:"#b0b5c8" }}>{note.date}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button onClick={e=>{ e.stopPropagation(); onLike(note.id); }} style={{ display:"flex", alignItems:"center", gap:3, fontSize:11.5, color:note.liked?"#ef4444":"#8a91a8", background:"none", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {note.liked?<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
            {note.likes}
          </button>
          <button onClick={e=>{ e.stopPropagation(); onSave(note.id); }} style={{ display:"flex", alignItems:"center", gap:3, fontSize:11.5, color:note.saved?"#4f6ef7":"#8a91a8", background:"none", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={note.saved?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            {note.saves}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SharedNotes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState(SHARED_NOTES);
  const [search, setSearch] = useState("");
  const [headerVisible, setHeaderVisible] = useState(false);
  useEffect(()=>{ setTimeout(()=>setHeaderVisible(true),50); },[]);
  const toggleLike = id=>setNotes(n=>n.map(x=>x.id===id?{...x,liked:!x.liked,likes:x.liked?x.likes-1:x.likes+1}:x));
  const toggleSave = id=>setNotes(n=>n.map(x=>x.id===id?{...x,saved:!x.saved,saves:x.saved?x.saves-1:x.saves+1}:x));
  const togglePin  = id=>setNotes(n=>n.map(x=>x.id===id?{...x,pinned:!x.pinned}:x));
  const filtered = notes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase())||n.tags.some(t=>t.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#f0f2f8", minHeight:"calc(100vh - 100px)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#dde0ea;border-radius:3px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        
        .notes-sub-nav { display: flex; gap: 8px; margin-bottom: 24px; padding: 0 36px; padding-top: 24px; }
        .sub-nav-btn { padding: 10px 18px; border-radius: 30px; background: white; border: 1px solid #e8eaf0; font-size: 0.9rem; font-weight: 600; color: #4a5068; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .sub-nav-btn:hover { background: #f8fafc; border-color: #4f6ef7; color: #4f6ef7; }
        .sub-nav-btn.active { background: #4f6ef7; color: white; border-color: #4f6ef7; }
      `}</style>
      
      {/* ── Sub Navigation ── */}
      <div className="notes-sub-nav">
          <button className="sub-nav-btn" onClick={() => navigate('/notes')}>All Notes</button>
          <button className="sub-nav-btn" onClick={() => navigate('/my-notes')}>My Notes</button>
          <button className="sub-nav-btn active" onClick={() => navigate('/shared-notes')}>Shared</button>
          <button className="sub-nav-btn" onClick={() => navigate('/starred-notes')}>Starred</button>
          <button className="sub-nav-btn" onClick={() => navigate('/quiz')}>AI Quiz</button>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ flex:1, overflowY:"auto", padding:"0 0 40px" }}>
          <div style={{ padding:"24px 36px 16px", marginBottom:8, opacity:headerVisible?1:0, transform:headerVisible?"translateY(0)":"translateY(-14px)", transition:"opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, fontSize:13, color:"#8a91a8" }}>
                  <span style={{ cursor:"pointer" }} onClick={()=>navigate("/my-notes")}>My Notes</span>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                  <span style={{ color:"#10b981", fontWeight:600 }}>Shared With Me</span>
                </div>
                <div style={{ height:3, width:36, borderRadius:2, background:"linear-gradient(90deg,#10b981,#34d399)", marginBottom:10 }} />
                <h1 style={{ fontSize:20, fontWeight:800, color:"#1a1c2e", letterSpacing:"-0.4px", lineHeight:1.2, marginBottom:3 }}>Shared With Me</h1>
                <p style={{ fontSize:13, color:"#8a91a8" }}>Notes shared by other SLIIT students.</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fff", border:"1px solid #dde0ea", borderRadius:12, padding:"10px 18px", width:240, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{color:"#8a91a8",flexShrink:0}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search shared notes…" style={{ background:"none", border:"none", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, color:"#1a1c2e", width:"100%" }} />
              </div>
            </div>
          </div>

          <div style={{ padding:"0 36px", display:"flex", gap:12, marginBottom:24 }}>
            {[{icon:"🤝",bg:"#ecfdf5",value:`${SHARED_NOTES.length} Notes`,label:"Shared with you"},{icon:"👥",bg:"#eef1ff",value:"6 Students",label:"Who shared notes"},{icon:"🔖",bg:"#fffbeb",value:"42 Saves",label:"You've saved"}].map((s,i)=>(
              <div key={i} style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", gap:12, flex:1, animation:`fadeUp 0.4s ease ${i*80}ms both` }}>
                <div style={{ width:38, height:38, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{s.icon}</div>
                <div><div style={{ fontSize:18, fontWeight:800, color:"#1a1c2e", lineHeight:1 }}>{s.value}</div><div style={{ fontSize:11.5, color:"#8a91a8", marginTop:3 }}>{s.label}</div></div>
              </div>
            ))}
          </div>

          <div style={{ padding:"0 32px" }}>
            {filtered.length===0
              ? <div style={{ textAlign:"center", padding:"80px 0", color:"#8a91a8" }}><div style={{ fontSize:40, marginBottom:14 }}>📭</div><div style={{ fontSize:15, fontWeight:600 }}>No shared notes found</div></div>
              : <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>{filtered.map((note,i)=><NoteCard key={note.id} note={note} index={i} onLike={toggleLike} onSave={toggleSave} onPin={togglePin}/>)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}