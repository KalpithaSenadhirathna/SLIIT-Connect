import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import fullLogo from "../assets/fulllogo.png";
import userAvatar from "../assets/user.png";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:5000/api";
const USER_ID  = "default_user";

const api = {
  getNotes:         ()          => fetch(`${API_BASE}/notes?userId=${USER_ID}`).then(r=>r.json()),
  getStats:         ()          => fetch(`${API_BASE}/notes/stats/summary?userId=${USER_ID}`).then(r=>r.json()),
  createNote:       (data)      => fetch(`${API_BASE}/notes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
  updateNote:       (id,data)   => fetch(`${API_BASE}/notes/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
  deleteNote:       (id)        => fetch(`${API_BASE}/notes/${id}`,{method:"DELETE"}).then(r=>r.json()),
  toggleLike:       (id)        => fetch(`${API_BASE}/notes/${id}/like`,{method:"PATCH"}).then(r=>r.json()),
  toggleSave:       (id)        => fetch(`${API_BASE}/notes/${id}/save`,{method:"PATCH"}).then(r=>r.json()),
  togglePin:        (id)        => fetch(`${API_BASE}/notes/${id}/pin`,{method:"PATCH"}).then(r=>r.json()),
  addComment:       (id,data)   => fetch(`${API_BASE}/notes/${id}/comments`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
  deleteComment:    (nId,cId)   => fetch(`${API_BASE}/notes/${nId}/comments/${cId}`,{method:"DELETE"}).then(r=>r.json()),
  getCollections:   ()          => fetch(`${API_BASE}/collections?userId=${USER_ID}`).then(r=>r.json()),
  createCollection: (data)      => fetch(`${API_BASE}/collections`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
  deleteCollection: (id)        => fetch(`${API_BASE}/collections/${id}`,{method:"DELETE"}).then(r=>r.json()),
  addToCollection:  (id,noteId) => fetch(`${API_BASE}/collections/${id}/add`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({noteId})}).then(r=>r.json()),
  removeFromCol:    (id,noteId) => fetch(`${API_BASE}/collections/${id}/remove`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({noteId})}).then(r=>r.json()),
  checkDuplicate:   (data)      => fetch(`${API_BASE}/collections/check-duplicate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
  archiveNote:      (id)        => fetch(`${API_BASE}/collections/archive/${id}`,{method:"PATCH"}).then(r=>r.json()),
  restoreNote:      (id)        => fetch(`${API_BASE}/collections/restore/${id}`,{method:"PATCH"}).then(r=>r.json()),
  getArchived:      ()          => fetch(`${API_BASE}/collections/archived?userId=${USER_ID}`).then(r=>r.json()),
  autoArchive:      ()          => fetch(`${API_BASE}/collections/auto-archive`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:USER_ID})}).then(r=>r.json()),
};

const fileToBase64 = (file) => new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});

// removed internal NAV_ITEMS


// ── SUBJECT CONFIG — matches screenshot badge colors exactly ──────────────────
const SUBJECT_MAP = {
  it:   {label:"IT / SE",      icon:"💻", barColor:"#4f6ef7", badgeBg:"#eef1ff", badgeColor:"#4f6ef7"},
  math: {label:"Mathematics",  icon:"📐", barColor:"#10b981", badgeBg:"#ecfdf5", badgeColor:"#059669"},
  db:   {label:"Database",     icon:"🗄️", barColor:"#f59e0b", badgeBg:"#fffbeb", badgeColor:"#d97706"},
  eng:  {label:"English",      icon:"✍️", barColor:"#ec4899", badgeBg:"#fdf2f8", badgeColor:"#db2777"},
  net:  {label:"Networking",   icon:"🌐", barColor:"#8b5cf6", badgeBg:"#f5f3ff", badgeColor:"#7c3aed"},
  oop:  {label:"OOP / Java",   icon:"☕", barColor:"#ef4444", badgeBg:"#fff1f2", badgeColor:"#dc2626"},
  ds:   {label:"Data Science",  icon:"📊", barColor:"#14b8a6", badgeBg:"#f0fdfa", badgeColor:"#0d9488"},
  other:{label:"General",      icon:"📝", barColor:"#64748b", badgeBg:"#f8fafc", badgeColor:"#475569"},
};
// detect subject key from subject string
const detectSubjectKey = (subjectStr) => {
  const s = (subjectStr||"").toLowerCase();
  if(s.includes("math")) return "math";
  if(s.includes("data") && s.includes("base")) return "db";
  if(s.includes("english") || s.includes("eng")) return "eng";
  if(s.includes("network")) return "net";
  if(s.includes("oop") || s.includes("java")) return "oop";
  if(s.includes("data science") || s.includes("ds")) return "ds";
  if(s.includes("it") || s.includes("se") || s.includes("software")) return "it";
  return "other";
};
const getSubject = (note) => {
  const key = note.subjectKey || detectSubjectKey(note.subject);
  return SUBJECT_MAP[key] || SUBJECT_MAP.other;
};

// for Collections panel color dots
const COL_COLORS = {
  blue:  {bg:"#eef1ff",border:"#4f6ef7",text:"#4f6ef7"},
  green: {bg:"#ecfdf5",border:"#10b981",text:"#059669"},
  yellow:{bg:"#fffbeb",border:"#f59e0b",text:"#d97706"},
  pink:  {bg:"#fdf2f8",border:"#ec4899",text:"#db2777"},
  purple:{bg:"#f5f3ff",border:"#8b5cf6",text:"#7c3aed"},
  orange:{bg:"#fff7ed",border:"#f97316",text:"#ea580c"},
};
const getColColor = (c) => COL_COLORS[c] || COL_COLORS.blue;

const FILE_ICON = (ext) => {const e=(ext||"").toLowerCase();if(e==="pdf")return"📕";if(["doc","docx"].includes(e))return"📘";if(["ppt","pptx"].includes(e))return"📙";if(["xls","xlsx","csv"].includes(e))return"📗";if(["txt","md"].includes(e))return"📄";return"📎";};
const formatBytes = (b) => {if(!b)return"";if(b<1024)return b+" B";if(b<1048576)return(b/1024).toFixed(1)+" KB";return(b/1048576).toFixed(1)+" MB";};
const fmtDate = (d) => {if(!d)return"";try{return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}catch{return d||"";}};

function useAnimateIn(delay=0){
  const [visible,setVisible]=useState(false);const ref=useRef();
  useEffect(()=>{const t=setTimeout(()=>setVisible(true),delay);return()=>clearTimeout(t);},[delay]);
  return [ref,visible];
}

// ── DUPLICATE BLOCKED MODAL — hard block, shows file OR text duplicate ────────
function DuplicateBlockedModal({matches,onClose}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),10);},[]);
  const close=()=>{setVis(false);setTimeout(onClose,220);};

  const isFileDup = matches[0]?.dupType==="file";
  const icon      = isFileDup ? "📄" : "📝";
  const headline  = isFileDup ? "Duplicate File Detected" : "Duplicate Note Detected";
  const subtitle  = isFileDup
    ? "This file has already been uploaded"
    : "You've already uploaded this note";
  const bodyText  = isFileDup
    ? `The file "${matches[0]?.fileName||matches[0]?.title}" already exists in your notes. Uploading the same file twice is not allowed.`
    : `This note is ${matches[0]?.similarity}% similar to one you already uploaded. Duplicate uploads are not allowed to keep your notes organised.`;
  const tip = isFileDup
    ? "If this is an updated version of the file, delete the old note first, then upload the new one."
    : "If this is a newer version, delete the old note first then re-upload.";

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:700,opacity:vis?1:0,transition:"opacity 0.22s",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,width:500,boxShadow:"0 32px 80px rgba(0,0,0,0.28)",animation:vis?"modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both":"none",overflow:"hidden"}}>
        <div style={{height:5,background:"linear-gradient(90deg,#ef4444,#f87171)"}}/>
        <div style={{padding:"28px 28px 24px"}}>

          {/* Icon + headline */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
            <div style={{width:56,height:56,borderRadius:14,background:"#fff1f2",border:"2px solid #fecaca",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🚫</div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:"#0f172a",marginBottom:4}}>{headline}</div>
              <div style={{fontSize:13,color:"#ef4444",fontWeight:600}}>{subtitle}</div>
            </div>
          </div>

          {/* File type badge */}
          {isFileDup&&(
            <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
              <span style={{fontSize:20}}>📄</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#c2410c",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:2}}>Duplicate File</div>
                <div style={{fontSize:13,fontWeight:600,color:"#374151"}}>{matches[0]?.fileName||matches[0]?.title}</div>
              </div>
              <span style={{marginLeft:"auto",fontSize:11,fontWeight:700,color:"#ef4444",background:"#fff1f2",padding:"3px 10px",borderRadius:6,flexShrink:0}}>Already uploaded</span>
            </div>
          )}

          {/* Description */}
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"14px 16px",marginBottom:14,fontSize:13.5,color:"#374151",lineHeight:1.7}}>
            {bodyText}
          </div>

          {/* Matching notes list — for text duplicates */}
          {!isFileDup&&(
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {matches.map(m=>(
                <div key={m._id} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:600,color:"#374151",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:10}}>
                    📝 {m.title}
                  </span>
                  <span style={{fontSize:12,fontWeight:700,color:"#ef4444",background:"#fff1f2",padding:"2px 9px",borderRadius:6,flexShrink:0,whiteSpace:"nowrap"}}>
                    {m.similarity}% match
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Matching note for file dup */}
          {isFileDup&&(
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {matches.map(m=>(
                <div key={m._id} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:600,color:"#374151",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:10}}>
                    📝 Found in: {m.title}
                  </span>
                  <span style={{fontSize:11,fontWeight:700,color:"#ef4444",background:"#fff1f2",padding:"2px 9px",borderRadius:6,flexShrink:0}}>
                    Exact file match
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tip */}
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",marginBottom:20,fontSize:12.5,color:"#92400e",lineHeight:1.6}}>
            💡 <strong>Tip:</strong> {tip}
          </div>

          <button onClick={close} style={{width:"100%",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",border:"none",borderRadius:11,padding:"13px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(239,68,68,0.4)"}}>
            Got it — I'll check my notes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── COLLECTIONS PANEL ─────────────────────────────────────────────────────────
function CollectionsPanel({collections,notes,onClose,onRefresh,fireToast}){
  const [vis,setVis]=useState(false);
  const [newName,setNewName]=useState("");
  const [newIcon,setNewIcon]=useState("📁");
  const [newColor,setNewColor]=useState("blue");
  const [creating,setCreating]=useState(false);
  const [expandedCol,setExpandedCol]=useState(null);
  useEffect(()=>{setTimeout(()=>setVis(true),10);},[]);
  const close=()=>{setVis(false);setTimeout(onClose,220);};
  const ICONS=["📁","📚","🧪","💡","📊","🎯","🧠","⚡","📌","🔬","🖥️","🔭"];
  const COLORS=["blue","green","yellow","pink","purple","orange"];
  const handleCreate=async()=>{
    if(!newName.trim())return;setCreating(true);
    try{const res=await api.createCollection({userId:USER_ID,name:newName.trim(),icon:newIcon,color:newColor});if(res.success){onRefresh();setNewName("");fireToast("📁 Collection created!");}else fireToast(res.message||"Failed.","error");}
    catch{fireToast("Server error.","error");}
    setCreating(false);
  };
  const handleDelete=async(id)=>{try{await api.deleteCollection(id);onRefresh();fireToast("Collection deleted.");}catch{fireToast("Failed.","error");}};
  const notesInCol=(col)=>notes.filter(n=>col.noteIds?.includes(n._id));
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)close();}} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",backdropFilter:"blur(10px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:500,opacity:vis?1:0,transition:"opacity 0.22s",padding:"28px 20px",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:22,width:620,boxShadow:"0 32px 80px rgba(0,0,0,0.25)",animation:vis?"modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both":"none",marginBottom:30,overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#8b5cf6,#a78bfa)",padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📁</div>
            <div><div style={{fontSize:16,fontWeight:800,color:"#fff"}}>Collections</div><div style={{fontSize:12,color:"rgba(255,255,255,0.75)"}}>Organise your notes into folders</div></div>
          </div>
          <button onClick={close} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",cursor:"pointer",fontSize:15,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:24}}>
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:14,padding:"16px",marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:12}}>➕ Create New Collection</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Collection name…" onKeyDown={e=>e.key==="Enter"&&handleCreate()}
                style={{flex:1,background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 13px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,color:"#111827",outline:"none"}}
                onFocus={e=>e.target.style.borderColor="#8b5cf6"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
              <button onClick={handleCreate} disabled={!newName.trim()||creating}
                style={{background:"linear-gradient(135deg,#8b5cf6,#a78bfa)",color:"#fff",border:"none",borderRadius:9,padding:"9px 18px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:newName.trim()?"pointer":"not-allowed",opacity:newName.trim()?1:0.5}}>
                {creating?"…":"Create"}
              </button>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:12,color:"#64748b",fontWeight:600,minWidth:32}}>Icon:</span>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{ICONS.map(ic=><button key={ic} onClick={()=>setNewIcon(ic)} style={{width:30,height:30,borderRadius:7,border:newIcon===ic?"2px solid #8b5cf6":"1px solid #e2e8f0",background:newIcon===ic?"#f5f3ff":"#fff",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>{ic}</button>)}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:"#64748b",fontWeight:600,minWidth:32}}>Color:</span>
              <div style={{display:"flex",gap:6}}>{COLORS.map(c=>{const cc=getColColor(c);return<button key={c} onClick={()=>setNewColor(c)} style={{width:22,height:22,borderRadius:"50%",background:cc.border,border:newColor===c?"3px solid #0f172a":"2px solid transparent",cursor:"pointer"}}/>;})}</div>
            </div>
          </div>
          {collections.length===0?(
            <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:10}}>📁</div><div style={{fontSize:14,fontWeight:600}}>No collections yet</div><div style={{fontSize:12,marginTop:4}}>Create one above</div></div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {collections.map(col=>{const cc=getColColor(col.color);const colNotes=notesInCol(col);const isOpen=expandedCol===col._id;return(
                <div key={col._id} style={{border:`1.5px solid ${cc.border}`,borderRadius:12,overflow:"hidden"}}>
                  <div style={{background:cc.bg,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setExpandedCol(isOpen?null:col._id)}>
                    <span style={{fontSize:20}}>{col.icon}</span>
                    <div style={{flex:1}}><div style={{fontSize:13.5,fontWeight:700,color:"#0f172a"}}>{col.name}</div><div style={{fontSize:11,color:cc.text}}>{colNotes.length} note{colNotes.length!==1?"s":""}</div></div>
                    <span style={{fontSize:12,color:cc.text,transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.22s"}}>▾</span>
                    <button onClick={e=>{e.stopPropagation();handleDelete(col._id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#ef4444",opacity:0.6,padding:4}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.6"}>🗑</button>
                  </div>
                  {isOpen&&<div style={{padding:"10px 16px 12px",background:"#fff"}}>
                    {colNotes.length===0?<div style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:"8px 0"}}>No notes yet.</div>
                    :<div style={{display:"flex",flexDirection:"column",gap:6}}>{colNotes.map(n=><div key={n._id} style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",borderRadius:8,padding:"7px 10px"}}>
                      <span style={{fontSize:12}}>📝</span>
                      <span style={{fontSize:12.5,fontWeight:500,color:"#374151",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</span>
                      <button onClick={()=>api.removeFromCol(col._id,n._id).then(()=>{onRefresh();fireToast("Removed.");})} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:12}}>✕</button>
                    </div>)}</div>}
                  </div>}
                </div>
              );})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ADD TO COLLECTION MODAL ───────────────────────────────────────────────────
function AddToCollectionModal({note,collections,onClose,onAdded,fireToast}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),10);},[]);
  const close=()=>{setVis(false);setTimeout(onClose,220);};
  const handleAdd=async(colId)=>{
    try{const res=await api.addToCollection(colId,note._id);if(res.success){fireToast("📁 Added!");onAdded();close();}else fireToast(res.message||"Failed.","error");}
    catch{fireToast("Server error.","error");}
  };
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)close();}} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.65)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,opacity:vis?1:0,transition:"opacity 0.22s",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,width:400,boxShadow:"0 32px 80px rgba(0,0,0,0.25)",animation:vis?"modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both":"none",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#8b5cf6,#a78bfa)",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>📁 Add to Collection</div>
          <button onClick={close} style={{width:28,height:28,borderRadius:7,background:"rgba(255,255,255,0.15)",border:"none",cursor:"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:20}}>
          <div style={{fontSize:12.5,color:"#64748b",marginBottom:14}}>Adding: <strong style={{color:"#0f172a"}}>"{note.title?.slice(0,38)}{note.title?.length>38?"…":""}"</strong></div>
          {collections.length===0?<div style={{textAlign:"center",padding:"20px 0",color:"#94a3b8",fontSize:13}}>No collections yet. Create one first!</div>
          :<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {collections.map(col=>{const cc=getColColor(col.color);const inIt=col.noteIds?.includes(note._id);return(
              <button key={col._id} onClick={()=>!inIt&&handleAdd(col._id)} disabled={inIt}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:`1.5px solid ${inIt?"#e2e8f0":cc.border}`,background:inIt?"#f8fafc":cc.bg,cursor:inIt?"default":"pointer",textAlign:"left",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                <span style={{fontSize:18}}>{col.icon}</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:inIt?"#94a3b8":cc.text}}>{col.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>{col.noteIds?.length||0} notes</div></div>
                {inIt&&<span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>Already added</span>}
              </button>
            );})}
          </div>}
        </div>
      </div>
    </div>
  );
}

// ── ARCHIVE PANEL ─────────────────────────────────────────────────────────────
function ArchivePanel({onClose,fireToast,onRefreshMain}){
  const [vis,setVis]=useState(false);
  const [archived,setArchived]=useState([]);
  const [loading,setLoading]=useState(true);
  const [autoRunning,setAutoRunning]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),10);loadArchived();},[]);
  const loadArchived=async()=>{setLoading(true);try{const r=await api.getArchived();if(r.success)setArchived(r.data);}catch{fireToast("Failed.","error");}setLoading(false);};
  const close=()=>{setVis(false);setTimeout(onClose,220);};
  const handleRestore=async(id)=>{
    try{const r=await api.restoreNote(id);if(r.success){setArchived(a=>a.filter(n=>n._id!==id));onRefreshMain();fireToast("✅ Note restored!");}}
    catch{fireToast("Server error.","error");}
  };
  const handleAutoArchive=async()=>{
    setAutoRunning(true);
    try{const r=await api.autoArchive();if(r.success){fireToast(`📦 Auto-archived ${r.archivedCount} note(s).`);loadArchived();onRefreshMain();}}
    catch{fireToast("Server error.","error");}
    setAutoRunning(false);
  };
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)close();}} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",backdropFilter:"blur(10px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:500,opacity:vis?1:0,transition:"opacity 0.22s",padding:"28px 20px",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:22,width:660,boxShadow:"0 32px 80px rgba(0,0,0,0.25)",animation:vis?"modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both":"none",marginBottom:30,overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#64748b,#94a3b8)",padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📦</div>
            <div><div style={{fontSize:16,fontWeight:800,color:"#fff"}}>Archived Notes</div><div style={{fontSize:12,color:"rgba(255,255,255,0.75)"}}>{archived.length} note{archived.length!==1?"s":""} archived</div></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={handleAutoArchive} disabled={autoRunning} style={{padding:"7px 14px",borderRadius:8,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",fontSize:12.5,fontWeight:600,cursor:"pointer",color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{autoRunning?"…":"📦 Auto-Archive Old"}</button>
            <button onClick={close} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",cursor:"pointer",fontSize:15,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </div>
        <div style={{padding:24}}>
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
            <span>💡</span><div style={{fontSize:12.5,color:"#64748b",lineHeight:1.6}}><strong style={{color:"#374151"}}>Auto-Archive</strong> moves notes from old semesters (Y1, Y2) out of active notes. Restore anytime.</div>
          </div>
          {loading?<div style={{textAlign:"center",padding:"60px 0"}}><div style={{width:40,height:40,border:"3px solid #e8eaf0",borderTopColor:"#64748b",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 14px"}}/><div style={{fontSize:13,color:"#94a3b8"}}>Loading…</div></div>
          :archived.length===0?<div style={{textAlign:"center",padding:"60px 0",color:"#94a3b8"}}><div style={{fontSize:40,marginBottom:14}}>📭</div><div style={{fontSize:15,fontWeight:600,marginBottom:6}}>No archived notes</div><div style={{fontSize:13}}>Use "Auto-Archive Old" above.</div></div>
          :<div style={{display:"flex",flexDirection:"column",gap:10}}>
            {archived.map(note=><div key={note._id} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📝</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:700,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{note.title}</div>
                <div style={{fontSize:11.5,color:"#94a3b8",marginTop:2,display:"flex",gap:8}}>
                  {note.moduleCode&&<span>📘 {note.moduleCode}</span>}
                  {note.semester&&<span>📅 {note.semester}</span>}
                </div>
              </div>
              <button onClick={()=>handleRestore(note._id)} style={{display:"flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#4f6ef7,#6366f1)",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12.5,fontWeight:700,cursor:"pointer",flexShrink:0}}>↩ Restore</button>
            </div>)}
          </div>}
        </div>
      </div>
    </div>
  );
}

// ── NOTE CARD — exact screenshot style ───────────────────────────────────────
function NoteCard({note,index,onLike,onSave,onPin,onView,onArchive,onAddToCollection}){
  const [ref,visible]=useAnimateIn(60+index*45);
  const [hovered,setHovered]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const subj = getSubject(note);

  return(
    <div ref={ref}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>{setHovered(false);setMenuOpen(false);}}
      onClick={()=>onView(note)}
      style={{
        background:"#fff",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",
        cursor:"pointer",
        border:`1.5px solid ${hovered?"#cbd5e1":"#e8eaf0"}`,
        boxShadow:hovered?"0 6px 24px rgba(0,0,0,0.09)":"0 1px 3px rgba(0,0,0,0.06)",
        transform:visible?(hovered?"translateY(-2px)":"translateY(0)"):"translateY(14px)",
        opacity:visible?1:0,transition:"all 0.24s ease",
      }}>

      {/* TOP COLOR BAR — matches screenshot */}
      <div style={{height:5,background:subj.barColor,flexShrink:0}}/>

      <div style={{padding:"16px 18px 12px",flex:1,display:"flex",flexDirection:"column"}}>

        {/* Row 1: Subject badge + pin + menu */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11.5,fontWeight:600,padding:"4px 10px",borderRadius:20,background:subj.badgeBg,color:subj.badgeColor}}>
            {subj.icon} {subj.label}
          </span>
          <div style={{display:"flex",alignItems:"center",gap:2}} onClick={e=>e.stopPropagation()}>
            {/* Pin — grey when unpinned, red when pinned, matches screenshot */}
            <button onClick={e=>{e.stopPropagation();onPin(note._id);}}
              style={{background:"none",border:"none",cursor:"pointer",padding:"3px 5px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,transition:"background 0.12s"}}
              title="Pin note">
              <svg width="15" height="15" viewBox="0 0 24 24" fill={note.pinned?"#ef4444":"none"} stroke={note.pinned?"#ef4444":"#9ca3af"} strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </button>
            {/* Three-dot menu */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setMenuOpen(o=>!o)}
                style={{background:"none",border:"none",cursor:"pointer",padding:"3px 5px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,color:"#9ca3af"}}
                title="More options">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                </svg>
              </button>
              {menuOpen&&(
                <div style={{position:"absolute",right:0,top:"100%",background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"4px",zIndex:50,minWidth:175,boxShadow:"0 8px 24px rgba(0,0,0,0.13)"}}>
                  {[
                    {icon:"📁",label:"Add to Collection",action:()=>{setMenuOpen(false);onAddToCollection(note);}},
                    {icon:"📦",label:"Archive Note",     action:()=>{setMenuOpen(false);onArchive(note._id);}},
                  ].map(item=>(
                    <button key={item.label} onClick={item.action}
                      style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 12px",borderRadius:7,border:"none",background:"none",cursor:"pointer",fontSize:13,fontWeight:500,color:"#374151",fontFamily:"'Plus Jakarta Sans',sans-serif",textAlign:"left"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
                      onMouseLeave={e=>e.currentTarget.style.background="none"}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{fontSize:14.5,fontWeight:700,color:"#0f172a",marginBottom:8,lineHeight:1.35}}>{note.title}</div>

        {/* Description — 3 line clamp */}
        <div style={{fontSize:13,color:"#64748b",lineHeight:1.65,marginBottom:14,flex:1,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>
          {note.excerpt||note.content}
        </div>

        {/* File badge */}
        {note.fileName&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11.5,fontWeight:500,padding:"3px 9px",borderRadius:6,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",marginBottom:10,alignSelf:"flex-start"}}>
            {FILE_ICON(note.fileName.split(".").pop())} {note.fileName.length>26?note.fileName.slice(0,24)+"…":note.fileName}
          </div>
        )}

        {/* Tags — plain grey pill style matching screenshot exactly */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {(note.tags||[]).map(t=>(
            <span key={t} style={{fontSize:12,fontWeight:500,padding:"4px 11px",borderRadius:7,background:"#f1f5f9",color:"#475569",border:"1px solid #e2e8f0",lineHeight:1}}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* FOOTER — avatar + name + date + like/save — matches screenshot */}
      <div style={{borderTop:"1px solid #f1f5f9",padding:"11px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        {/* Left: colored avatar + name + date */}
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{
            width:32,height:32,borderRadius:9,
            background:note.avColor||subj.barColor,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:11,fontWeight:800,color:"#fff",flexShrink:0,letterSpacing:"0.03em",
          }}>
            {note.av||"??"}
          </div>
          <div>
            <div style={{fontSize:12.5,fontWeight:600,color:"#1e293b",lineHeight:1.25}}>{note.author}</div>
            <div style={{fontSize:11.5,color:"#94a3b8",marginTop:1}}>{fmtDate(note.createdAt)||note.date}</div>
          </div>
        </div>

        {/* Right: heart + count, bookmark + count */}
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={e=>{e.stopPropagation();onLike(note._id);}}
            style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",padding:0}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill={note.liked?"#ef4444":"none"} stroke={note.liked?"#ef4444":"#9ca3af"} strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{fontSize:12.5,color:note.liked?"#ef4444":"#9ca3af",fontWeight:500}}>{note.likes||0}</span>
          </button>
          <button onClick={e=>{e.stopPropagation();onSave(note._id);}}
            style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",padding:0}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={note.saved?"#4f6ef7":"none"} stroke={note.saved?"#4f6ef7":"#9ca3af"} strokeWidth="1.8">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{fontSize:12.5,color:note.saved?"#4f6ef7":"#9ca3af",fontWeight:500}}>{note.saves||0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QUIZ MODAL — quizzes from UPLOADED FILE content, falls back to note text ──
function QuizModal({note,onClose}){
  const [visible,setVisible]=useState(false);
  const [loading,setLoading]=useState(true);
  const [extracting,setExtracting]=useState(false);
  const [questions,setQuestions]=useState([]);
  const [answers,setAnswers]=useState({});
  const [submitted,setSubmitted]=useState(false);
  const [error,setError]=useState("");
  const [sourceLabel,setSourceLabel]=useState("");

  useEffect(()=>{setTimeout(()=>setVisible(true),10);},[]);
  useEffect(()=>{generateQuiz();},[]);

  // ── Extract plain text from the stored base64 file ───────────────────────
  const extractFileText=async()=>{
    if(!note.fileData||!note.fileName) return null;
    const ext=(note.fileName||"").split(".").pop().toLowerCase();

    // TXT / MD — direct decode
    if(["txt","md"].includes(ext)){
      try{
        const base64=note.fileData.split(",")[1];
        const text=atob(base64);
        return text.length>100?text:null;
      }catch{return null;}
    }

    // PDF — use PDF.js via CDN to extract text from each page
    if(ext==="pdf"){
      try{
        // Load PDF.js if not already loaded
        if(!window.pdfjsLib){
          await new Promise((res,rej)=>{
            const s=document.createElement("script");
            s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            s.onload=res; s.onerror=rej;
            document.head.appendChild(s);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc=
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
        const base64=note.fileData.split(",")[1];
        const binary=atob(base64);
        const bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
        const pdf=await window.pdfjsLib.getDocument({data:bytes}).promise;
        let fullText="";
        for(let p=1;p<=Math.min(pdf.numPages,15);p++){
          const page=await pdf.getPage(p);
          const tc=await page.getTextContent();
          fullText+=tc.items.map(i=>i.str).join(" ")+"\n";
        }
        return fullText.trim().length>100?fullText.trim():null;
      }catch(e){
        console.warn("PDF extract failed:",e);
        return null;
      }
    }

    // DOCX — extract raw text from the XML inside the zip
    if(["doc","docx"].includes(ext)){
      try{
        // Load JSZip
        if(!window.JSZip){
          await new Promise((res,rej)=>{
            const s=document.createElement("script");
            s.src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            s.onload=res; s.onerror=rej;
            document.head.appendChild(s);
          });
        }
        const base64=note.fileData.split(",")[1];
        const binary=atob(base64);
        const bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
        const zip=await window.JSZip.loadAsync(bytes.buffer);
        const xmlFile=zip.file("word/document.xml");
        if(!xmlFile) return null;
        const xmlText=await xmlFile.async("string");
        // Strip XML tags, keep text
        const text=xmlText.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
        return text.length>100?text:null;
      }catch(e){
        console.warn("DOCX extract failed:",e);
        return null;
      }
    }

    return null; // unsupported file type for text extraction
  };

  // ── Build questions from text ─────────────────────────────────────────────
  const buildQ=(body,title,tags,sem,rt)=>{
    const sh=a=>[...a].sort(()=>Math.random()-0.5);
    const pk=a=>a[Math.floor(Math.random()*a.length)];
    const L=["A","B","C","D"];
    const STOP=new Set("that this with have from they will been were their there which when what where into also more than then some each about after before other these those very just your much only both well even over such most many like here time used using often called refer known based uses use can its are for the and but not a an the is are".split(" "));

    const sents=body.split(/[.!?\n]+/).map(s=>s.trim()).filter(s=>s.length>25&&s.split(" ").length>=5);
    const aw=body.toLowerCase().match(/\b[a-z]{4,}\b/g)||[];
    const freq={};
    aw.forEach(w=>{if(!STOP.has(w))freq[w]=(freq[w]||0)+1;});
    const kw=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,60).map(e=>e[0]);

    const bl=[],us=new Set();
    sents.forEach(sent=>{
      if(bl.length>=18||us.has(sent))return;
      const ws=sent.match(/\b[A-Za-z]{5,}\b/g)||[];
      const imp=ws.filter(w=>!STOP.has(w.toLowerCase())&&freq[w.toLowerCase()]>=1);
      if(!imp.length)return;
      const tg=pk(imp);
      const bk=sent.replace(new RegExp(`\\b${tg}\\b`,"i"),"_____");
      const wp=kw.filter(k=>k!==tg.toLowerCase()).slice(0,10);
      if(wp.length<3)return;
      const wr=sh(wp).slice(0,3).map(w=>w.charAt(0).toUpperCase()+w.slice(1));
      const op=sh([tg,...wr]);
      bl.push({
        question:`Fill in the blank: "${bk.slice(0,120)}${bk.length>120?"…":""}"`,
        options:op.map((o,i)=>`${L[i]}) ${o}`),
        answer:L[op.indexOf(tg)],
      });
      us.add(sent);
    });

    // Add metadata questions
    if((tags||[]).length>=2){
      const c=pk(tags);
      const ex=["Networking","Recursion","Polymorphism","Hashing","Concurrency","Sorting","Searching"];
      const op=sh([c,...sh(ex.filter(e=>!tags.includes(e))).slice(0,3)]);
      bl.push({question:`Which of these is a topic covered in "${title}"?`,options:op.map((o,i)=>`${L[i]}) ${o}`),answer:L[op.indexOf(c)]});
    }
    if(sem){
      const al=["Y1S1","Y1S2","Y2S1","Y2S2","Y3S1","Y3S2","Y4S1","Y4S2"];
      const op=sh([sem,...sh(al.filter(s=>s!==sem)).slice(0,3)]);
      bl.push({question:"Which semester does this note belong to?",options:op.map((o,i)=>`${L[i]}) ${o}`),answer:L[op.indexOf(sem)]});
    }
    if(rt){
      const tp=["Notes","Slides","Past Paper","Lab Report","Assignment","Cheat Sheet"];
      const op=sh([rt,...sh(tp.filter(t=>t!==rt)).slice(0,3)]);
      bl.push({question:`What type of resource is "${title}"?`,options:op.map((o,i)=>`${L[i]}) ${o}`),answer:L[op.indexOf(rt)]});
    }

    const picked=sh(bl).slice(0,5);
    if(picked.length<3) return null;
    return picked;
  };

  const generateQuiz=async()=>{
    setLoading(true);setExtracting(false);setError("");
    setQuestions([]);setAnswers({});setSubmitted(false);
    try{
      const title=note.title||"";
      const tags=note.tags||[];
      const sem=note.semester||"";
      const rt=note.resourceType||"";

      let bodyText=null;

      // Try file first
      if(note.fileData&&note.fileName){
        setExtracting(true);
        bodyText=await extractFileText();
        setExtracting(false);
        if(bodyText&&bodyText.trim().length>100){
          setSourceLabel(`📄 ${note.fileName}`);
        } else {
          bodyText=null;
        }
      }

      // Fall back to note content/excerpt
      if(!bodyText){
        const fallback=(note.content||note.excerpt||"").trim();
        if(fallback.length>50){
          bodyText=fallback;
          setSourceLabel("📝 Note content");
        }
      }

      if(!bodyText||bodyText.trim().length<50){
        setError(note.fileData
          ?"Could not extract text from the file (PDF may be image-only or encrypted). The quiz needs readable text."
          :"No content found to generate quiz from. Upload a file or add note content first."
        );
        return;
      }

      const qs=buildQ(bodyText,title,tags,sem,rt);
      if(!qs||qs.length<2){
        setError("Not enough content in the file to build quiz questions. Try a longer document.");
        return;
      }
      setQuestions(qs);
    }catch(e){
      console.error("Quiz generation error:",e);
      setError("Could not generate quiz. Please try again.");
    }finally{
      setLoading(false);
      setExtracting(false);
    }
  };

  const close=()=>{setVisible(false);setTimeout(onClose,220);};
  const score=submitted?questions.filter((q,i)=>answers[i]===q.answer).length:0;

  return(
    <div onClick={e=>{if(e.target===e.currentTarget)close();}} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:400,opacity:visible?1:0,transition:"opacity 0.22s",padding:"30px 20px",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:20,width:660,boxShadow:"0 32px 80px rgba(0,0,0,0.22)",animation:visible?"modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both":"none",marginBottom:30}}>

        {/* Header */}
        <div style={{padding:"20px 24px",borderBottom:"1px solid #f0f2f8",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#4f6ef7,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🧠</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>AI Quiz</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:1}}>{note.title?.slice(0,50)}{note.title?.length>50?"…":""}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {!loading&&<button onClick={generateQuiz} style={{padding:"7px 14px",borderRadius:8,background:"#f1f5f9",border:"1px solid #e2e8f0",fontSize:12.5,fontWeight:600,cursor:"pointer",color:"#374151",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>↻ New Quiz</button>}
            <button onClick={close} style={{width:32,height:32,borderRadius:8,background:"#f1f5f9",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:15,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </div>

        {/* Source badge */}
        {sourceLabel&&!loading&&(
          <div style={{padding:"10px 24px 0"}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:11.5,fontWeight:600,padding:"4px 12px",borderRadius:20,background:"#eef1ff",color:"#4f6ef7",border:"1px solid #c7d2fe"}}>
              Quiz source: {sourceLabel}
            </span>
          </div>
        )}

        <div style={{padding:"20px 24px 24px"}}>
          {/* Loading / extracting state */}
          {loading&&(
            <div style={{textAlign:"center",padding:"50px 0"}}>
              <div style={{width:40,height:40,border:"3px solid #e8eaf0",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/>
              <div style={{fontSize:14,color:"#64748b",fontWeight:600}}>
                {extracting?"📄 Reading file content…":"🧠 Building questions…"}
              </div>
              {extracting&&<div style={{fontSize:12,color:"#94a3b8",marginTop:6}}>Extracting text from {note.fileName}</div>}
            </div>
          )}

          {/* Error state */}
          {!loading&&error&&(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:36,marginBottom:14}}>📭</div>
              <div style={{fontSize:14,color:"#ef4444",fontWeight:600,marginBottom:8}}>Cannot generate quiz</div>
              <div style={{fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:20}}>{error}</div>
              <button onClick={generateQuiz} style={{background:"#4f6ef7",color:"#fff",border:"none",borderRadius:9,padding:"9px 20px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>Try Again</button>
            </div>
          )}

          {/* Score banner */}
          {!loading&&!error&&submitted&&(
            <div style={{background:score>=4?"#f0fdf4":score>=3?"#fffbeb":"#fef2f2",border:`1px solid ${score>=4?"#86efac":score>=3?"#fcd34d":"#fca5a5"}`,borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:26}}>{score>=4?"🎉":score>=3?"👍":"📚"}</span>
              <div>
                <div style={{fontSize:15,fontWeight:800}}>Score: {score}/{questions.length}</div>
                <div style={{fontSize:12.5,color:"#64748b"}}>{score>=4?"Excellent — you know this material!":score>=3?"Good effort — review the misses.":"Keep studying the file content!"}</div>
              </div>
            </div>
          )}

          {/* Questions */}
          {!loading&&!error&&questions.length>0&&(
            <>
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                {questions.map((q,qi)=>(
                  <div key={qi} style={{background:"#f8fafc",borderRadius:12,padding:"16px 18px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:13.5,fontWeight:700,color:"#0f172a",marginBottom:12}}>{qi+1}. {q.question}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {q.options.map((opt,oi)=>{
                        const letter=opt.charAt(0),sel=answers[qi]===letter,corr=q.answer===letter;
                        let bg="#fff",border="1px solid #e2e8f0",color="#374151";
                        if(submitted){if(corr){bg="#f0fdf4";border="1.5px solid #4ade80";color="#166534";}else if(sel){bg="#fef2f2";border="1.5px solid #f87171";color="#991b1b";}}
                        else if(sel){bg="#eef1ff";border="1.5px solid #4f6ef7";color="#4f6ef7";}
                        return(
                          <button key={oi} onClick={()=>{if(!submitted)setAnswers(a=>({...a,[qi]:letter}));}}
                            style={{textAlign:"left",background:bg,border,borderRadius:8,padding:"9px 14px",fontSize:13,fontWeight:sel?600:400,color,cursor:submitted?"default":"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                            <span style={{width:22,height:22,borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,
                              background:submitted&&corr?"#4ade80":submitted&&sel?"#f87171":sel?"#4f6ef7":"#e2e8f0",
                              color:(submitted&&(corr||sel))||sel?"#fff":"#64748b"}}>
                              {letter}
                            </span>
                            {opt.slice(2)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:20,display:"flex",justifyContent:"flex-end"}}>
                {submitted
                  ?<button onClick={generateQuiz} style={{background:"linear-gradient(135deg,#4f6ef7,#6366f1)",color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,fontWeight:700,cursor:"pointer"}}>↻ New Quiz</button>
                  :<button onClick={()=>setSubmitted(true)} disabled={Object.keys(answers).length<questions.length}
                    style={{background:Object.keys(answers).length<questions.length?"#e2e8f0":"linear-gradient(135deg,#4f6ef7,#6366f1)",color:Object.keys(answers).length<questions.length?"#94a3b8":"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,fontWeight:700,cursor:Object.keys(answers).length<questions.length?"not-allowed":"pointer"}}>
                    Submit ({Object.keys(answers).length}/{questions.length})
                  </button>
                }
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FILE VIEWER ───────────────────────────────────────────────────────────────
function FileViewer({note,onDownload}){
  const ext=(note.fileName||"").split(".").pop().toLowerCase();
  const isPDF=ext==="pdf",isTxt=["txt","md"].includes(ext);
  const [txt,setTxt]=useState("");
  useEffect(()=>{if(isTxt&&note.fileData){try{setTxt(atob(note.fileData.split(",")[1]));}catch{setTxt("Could not read.");}}},[note.fileData,isTxt]);
  const dl=()=>{
    if(!note.fileData)return;
    // Trigger browser download
    const a=document.createElement("a");a.href=note.fileData;a.download=note.fileName;a.click();
    // Save to downloads list in localStorage
    try{
      const existing=JSON.parse(localStorage.getItem("sliit_downloads")||"[]");
      const entry={
        id:note._id,title:note.title,fileName:note.fileName,
        fileSize:note.fileSize,fileType:note.fileType,
        moduleCode:note.moduleCode,semester:note.semester,
        subjectKey:note.subjectKey,subject:note.subject,
        downloadedAt:new Date().toISOString(),
        fileData:note.fileData,
      };
      const updated=[entry,...existing.filter(e=>e.id!==note._id)].slice(0,50);
      localStorage.setItem("sliit_downloads",JSON.stringify(updated));
    }catch{}
    // Navigate to downloads page
    if(onDownload) onDownload();
  };
  if(!note.fileData)return<div style={{border:"2px dashed #e2e8f0",borderRadius:14,padding:"60px 20px",textAlign:"center",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:10}}>📎</div><div style={{fontSize:13,fontWeight:500}}>No file attached</div></div>;
  return<div style={{border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden"}}>
    <div style={{background:"#1e293b",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:12,color:"#94a3b8",fontWeight:500}}>{FILE_ICON(ext)} {note.fileName}</span>
      <button onClick={dl} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600}}>⬇ Download</button>
    </div>
    {isPDF?<iframe src={note.fileData} title="PDF" style={{width:"100%",height:360,border:"none"}}/>
      :isTxt?<div style={{maxHeight:320,overflowY:"auto",padding:16,background:"#f8fafc",fontSize:13,fontFamily:"monospace",whiteSpace:"pre-wrap",lineHeight:1.7}}>{txt||"Loading…"}</div>
        :<div style={{padding:"40px 20px",background:"#f8fafc",textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>{FILE_ICON(ext)}</div><div style={{fontSize:14,fontWeight:700}}>{note.fileName}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:6}}>{formatBytes(note.fileSize)}</div></div>}
  </div>;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function MyNotes(){
  const navigate=useNavigate();
  const {user}=useAuth();

  const [collections,setCollections]=useState([]);
  const [showCollections,setShowCollections]=useState(false);
  const [showArchive,setShowArchive]=useState(false);
  const [addToColNote,setAddToColNote]=useState(null);
  const [dupMatches,setDupMatches]=useState(null);

  const [notes,setNotes]=useState([]);
  const [stats,setStats]=useState({count:0,totalLikes:0,totalSaves:0});
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [notesOpen,setNotesOpen]=useState(true);
  const [headerVisible,setHeaderVisible]=useState(false);

  const [showModal,setShowModal]=useState(false);
  const [modalVisible,setModalVisible]=useState(false);
  const [form,setForm]=useState({title:"",faculty:"",moduleCode:"",moduleName:"",resourceType:"",semester:"",tags:"",content:"",subject:"IT / SE"});
  const [formErrors,setFormErrors]=useState({});
  const [touched,setTouched]=useState({});
  const [droppedFiles,setDroppedFiles]=useState([]);
  const [dragOver,setDragOver]=useState(false);
  const [submitting,setSubmitting]=useState(false);

  const [viewNote,setViewNote]=useState(null);
  const [viewVisible,setViewVisible]=useState(false);
  const [viewTab,setViewTab]=useState("details");
  const [editForm,setEditForm]=useState({});
  const [deleteId,setDeleteId]=useState(null);
  const [deleteVisible,setDeleteVisible]=useState(false);
  const [commentText,setCommentText]=useState("");
  const [quizNote,setQuizNote]=useState(null);
  const [showToast,setShowToast]=useState(false);
  const [toastMsg,setToastMsg]=useState("");
  const [toastType,setToastType]=useState("success");

  useEffect(()=>{setTimeout(()=>setHeaderVisible(true),50);fetchNotes();fetchCollections();},[]);

  const fireToast=(msg,type="success")=>{setToastMsg(msg);setToastType(type);setShowToast(true);setTimeout(()=>setShowToast(false),type==="info"?2200:3500);};
  const fetchNotes=async()=>{setLoading(true);try{const [nr,sr]=await Promise.all([api.getNotes(),api.getStats()]);if(nr.success)setNotes(nr.data);if(sr.success)setStats(sr.data);}catch{fireToast("Failed to load. Is the server running?","error");}finally{setLoading(false);} };
  const fetchCollections=async()=>{try{const r=await api.getCollections();if(r.success)setCollections(r.data);}catch{}};
  const handleArchive=async(id)=>{try{const r=await api.archiveNote(id);if(r.success){setNotes(n=>n.filter(x=>x._id!==id));fireToast("📦 Note archived.");}}catch{fireToast("Failed.","error");}};

  const openModal=()=>{setForm({title:"",faculty:"",moduleCode:"",moduleName:"",resourceType:"",semester:"",tags:"",content:"",subject:"IT / SE"});setDroppedFiles([]);setFormErrors({});setTouched({});setShowModal(true);setTimeout(()=>setModalVisible(true),10);};
  const closeModal=()=>{setModalVisible(false);setTimeout(()=>setShowModal(false),220);};

  const ALLOWED=["pdf","doc","docx","ppt","pptx","txt","md","xls","xlsx","csv"];
  const isAcademicFile=(f)=>{const e=f.name.split(".").pop().toLowerCase();if(f.type.startsWith("image/")||f.type.startsWith("video/")||f.type.startsWith("audio/"))return{ok:false,reason:"Media files not accepted."};if(!ALLOWED.includes(e))return{ok:false,reason:`".${e}" not accepted.`};return{ok:true};};
  const handleFileDrop=(files)=>{const big=files.filter(f=>f.size>5*1024*1024);big.forEach(f=>fireToast(`❌ "${f.name}" exceeds 5 MB.`,"error"));const ok=files.filter(f=>f.size<=5*1024*1024);const acc=[],rej=[];ok.forEach(f=>{const c=isAcademicFile(f);if(c.ok)acc.push(f);else rej.push({file:f,reason:c.reason});});rej.forEach(r=>fireToast(`❌ "${r.file.name}" — ${r.reason}`,"error"));if(acc.length){setDroppedFiles(p=>[...p,...acc]);fireToast(`✅ ${acc.length} file(s) accepted!`);}};

  const vf=(n,v)=>{if(n==="title"&&!v.trim())return"Note title is required.";if(n==="moduleCode"&&!v.trim())return"Module code is required.";if(n==="moduleName"&&!v.trim())return"Module name is required.";if(n==="content"&&!v.trim())return"Content is required.";if(n==="tags"&&!v.trim())return"At least one tag is required.";if(n==="faculty"&&!v)return"Please select a faculty.";if(n==="semester"&&!v)return"Please select a semester.";if(n==="resourceType"&&!v)return"Please select a resource type.";return"";};
  const handleChange=(n,v)=>{setForm(f=>({...f,[n]:v}));if(touched[n])setFormErrors(e=>({...e,[n]:vf(n,v)}));};
  const handleBlur=(n)=>{setTouched(t=>({...t,[n]:true}));setFormErrors(e=>({...e,[n]:vf(n,form[n])}));};

  // ── SAVE — duplicate = HARD BLOCK (text + file) ─────────────────────────
  const handleSave=async()=>{
    const req=["title","moduleCode","moduleName","content","tags","faculty","semester","resourceType"];
    const nt={},ne={};req.forEach(k=>{nt[k]=true;ne[k]=vf(k,form[k]);});
    setTouched(t=>({...t,...nt}));setFormErrors(e=>({...e,...ne}));
    if(req.some(k=>ne[k])){fireToast("Please fill in all required fields.","error");return;}
    setSubmitting(true);

    // ── STEP 1: FILE DUPLICATE CHECK — check by filename + size ─────────────
    if(droppedFiles[0]){
      const incomingName = droppedFiles[0].name.trim().toLowerCase();
      const incomingSize = droppedFiles[0].size;
      // Check against all existing notes for same filename + similar size (±5%)
      const fileDup = notes.find(n=>{
        if(!n.fileName) return false;
        const sameName = n.fileName.trim().toLowerCase() === incomingName;
        const sameSize = n.fileSize && Math.abs(n.fileSize - incomingSize) / incomingSize < 0.05;
        return sameName || (sameSize && incomingSize > 0);
      });
      if(fileDup){
        setDupMatches([{
          _id:        fileDup._id,
          title:      fileDup.title,
          similarity: 100,
          fileName:   fileDup.fileName,
          dupType:    "file",
        }]);
        setSubmitting(false);
        return; // HARD STOP
      }
    }

    // ── STEP 2: TEXT DUPLICATE CHECK via backend ──────────────────────────────
    try{
      const dup = await api.checkDuplicate({
        userId:  USER_ID,
        title:   form.title.trim(),
        content: form.content.trim(),
      });
      if(dup.isDuplicate){
        setDupMatches(dup.matches.map(m=>({...m,dupType:"text"})));
        setSubmitting(false);
        return; // HARD STOP
      }
    }catch(err){
      console.error("[handleSave] duplicate check error:", err);
      fireToast("❌ Could not verify duplicate status. Check your backend is running.","error");
      setSubmitting(false);
      return;
    }

    // ── STEP 3: No duplicate — proceed to save ────────────────────────────────
    try{
      let fileData=null,fileName=null,fileType=null,fileSize=null;
      if(droppedFiles[0]){
        fileData=await fileToBase64(droppedFiles[0]);
        fileName=droppedFiles[0].name;
        fileType=droppedFiles[0].type;
        fileSize=droppedFiles[0].size;
      }

      const subjKey = detectSubjectKey(form.subject);

      const payload={
        userId:      USER_ID,
        title:       form.title.trim(),
        content:     form.content.trim(),
        subject:     form.subject,
        subjectKey:  subjKey,
        tags:        form.tags.split(",").map(t=>t.trim()).filter(Boolean),
        author:      user?.name||"You",
        av:          (user?.name||"YO").slice(0,2).toUpperCase(),
        avColor:     "#4f6ef7",
        moduleCode:  form.moduleCode,
        moduleName:  form.moduleName,
        faculty:     form.faculty,
        semester:    form.semester,
        resourceType:form.resourceType,
        fileData, fileName, fileType, fileSize,
      };

      const res=await api.createNote(payload);
      if(res.success){
        setNotes(n=>[res.data,...n]);
        setStats(s=>({...s,count:s.count+1}));
        closeModal();
        fireToast("✅ Note saved successfully!");
      } else {
        fireToast(res.message||"Failed to save note.","error");
      }
    }catch{
      fireToast("Server error. Check if backend is running.","error");
    }
    setSubmitting(false);
  };

  const toggleLike=async(id)=>{try{const r=await api.toggleLike(id);if(r.success){setNotes(n=>n.map(x=>x._id===id?{...x,liked:r.data.liked,likes:r.data.likes}:x));setStats(s=>({...s,totalLikes:r.data.liked?s.totalLikes+1:Math.max(0,s.totalLikes-1)}));}}catch{fireToast("Failed.","error");}};
  const toggleSave=async(id)=>{try{const r=await api.toggleSave(id);if(r.success){setNotes(n=>n.map(x=>x._id===id?{...x,saved:r.data.saved,saves:r.data.saves}:x));setStats(s=>({...s,totalSaves:r.data.saved?s.totalSaves+1:Math.max(0,s.totalSaves-1)}));}}catch{fireToast("Failed.","error");}};
  const togglePin=async(id)=>{try{const r=await api.togglePin(id);if(r.success)setNotes(n=>n.map(x=>x._id===id?{...x,pinned:r.data.pinned}:x));}catch{fireToast("Failed.","error");}};

  const openView=(note)=>{setViewNote(note);setViewTab("details");setEditForm({title:note.title,content:note.content||note.excerpt,tags:(note.tags||[]).join(", "),moduleCode:note.moduleCode,moduleName:note.moduleName,semester:note.semester,resourceType:note.resourceType});setCommentText("");setTimeout(()=>setViewVisible(true),10);};
  const closeView=()=>{setViewVisible(false);setTimeout(()=>setViewNote(null),220);};
  const handleViewUpdate=async()=>{if(!editForm.title?.trim()||!editForm.content?.trim()){fireToast("Title and content required.","error");return;}try{const r=await api.updateNote(viewNote._id,{title:editForm.title.trim(),content:editForm.content.trim(),tags:editForm.tags,moduleCode:editForm.moduleCode,moduleName:editForm.moduleName,semester:editForm.semester,resourceType:editForm.resourceType});if(r.success){setNotes(n=>n.map(x=>x._id===viewNote._id?r.data:x));setViewNote(r.data);setViewTab("details");fireToast("Note updated! ✏️");}else fireToast(r.message||"Update failed.","error");}catch{fireToast("Server error.","error");}};
  const openDelete=(id)=>{setDeleteId(id);setTimeout(()=>setDeleteVisible(true),10);};
  const closeDelete=()=>{setDeleteVisible(false);setTimeout(()=>setDeleteId(null),220);};
  const confirmDelete=async()=>{try{const r=await api.deleteNote(deleteId);if(r.success){setNotes(n=>n.filter(x=>x._id!==deleteId));setStats(s=>({...s,count:Math.max(0,s.count-1)}));closeDelete();closeView();fireToast("Note deleted.");}else fireToast(r.message||"Delete failed.","error");}catch{fireToast("Server error.","error");}};
  const addComment=async()=>{if(!commentText.trim())return;try{const r=await api.addComment(viewNote._id,{text:commentText.trim(),author:user?.name||"You",av:(user?.name||"YO").slice(0,2).toUpperCase(),avColor:"#4f6ef7"});if(r.success){const up={...viewNote,comments:[...(viewNote.comments||[]),r.data]};setNotes(n=>n.map(x=>x._id===viewNote._id?up:x));setViewNote(up);setCommentText("");fireToast("Comment added!");}}catch{fireToast("Failed.","error");}};
  const deleteComment=async(cId)=>{try{const r=await api.deleteComment(viewNote._id,cId);if(r.success){const up={...viewNote,comments:viewNote.comments.filter(c=>c._id!==cId)};setNotes(n=>n.map(x=>x._id===viewNote._id?up:x));setViewNote(up);}}catch{fireToast("Failed.","error");}};

  const filtered=notes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase())||(n.tags||[]).some(t=>t.toLowerCase().includes(search.toLowerCase())));

  const inp={width:"100%",background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"11px 14px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,color:"#111827",outline:"none"};
  const getInp=k=>({...inp,borderColor:formErrors[k]&&touched[k]?"#ef4444":touched[k]&&!formErrors[k]?"#22c55e":"#e5e7eb",boxShadow:formErrors[k]&&touched[k]?"0 0 0 3px rgba(239,68,68,0.1)":touched[k]&&!formErrors[k]?"0 0 0 3px rgba(34,197,94,0.1)":"none"});
  const getSel=k=>({...getInp(k),appearance:"none",paddingRight:36,cursor:"pointer",color:form[k]?"#111827":"#9ca3af"});
  const Err=({f})=>formErrors[f]&&touched[f]?<div style={{fontSize:11.5,color:"#ef4444",marginTop:5}}>⚠ {formErrors[f]}</div>:null;
  const Lbl=({text,req})=><label style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block"}}>{text}{req&&<span style={{color:"#ef4444"}}> *</span>}</label>;
  const ChevDown=()=><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"#94a3b8"}}><polyline points="6,9 12,15 18,9"/></svg>;
  const TAB_BTN=(id,lbl,icon)=><button key={id} onClick={()=>setViewTab(id)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif",background:viewTab===id?"#4f6ef7":"transparent",color:viewTab===id?"#fff":"#64748b"}}>{icon}{lbl}</button>;
  const vSubj = viewNote ? getSubject(viewNote) : null;

  return(
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#f0f2f8", minHeight:"calc(100vh - 100px)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #dde0ea; border-radius: 3px; }
        @keyframes modalIn { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        
        /* Sub-navigation buttons */
        .notes-sub-nav {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
            padding: 0 36px;
            padding-top: 24px;
        }
        .sub-nav-btn {
            padding: 10px 18px;
            border-radius: 30px;
            background: white;
            border: 1px solid #e8eaf0;
            font-size: 0.9rem;
            font-weight: 600;
            color: #4a5068;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .sub-nav-btn:hover { background: #f8fafc; border-color: #4f6ef7; color: #4f6ef7; }
        .sub-nav-btn.active { background: #4f6ef7; color: white; border-color: #4f6ef7; }
      `}</style>

      {/* ── Sub Navigation ── */}
      <div className="notes-sub-nav">
          <button className="sub-nav-btn" onClick={() => navigate('/notes')}>All Notes</button>
          <button className="sub-nav-btn active" onClick={() => navigate('/my-notes')}>My Notes</button>
          <button className="sub-nav-btn" onClick={() => navigate('/shared-notes')}>Shared</button>
          <button className="sub-nav-btn" onClick={() => navigate('/starred-notes')}>Starred</button>
          <button className="sub-nav-btn" onClick={() => navigate('/quiz')}>AI Quiz</button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ display:"flex", flexDirection:"column" }}>

        <div style={{flex:1,overflowY:"auto",padding:"0 0 40px"}}>
          {/* Header */}
          <div style={{padding:"24px 36px 16px",opacity:headerVisible?1:0,transform:headerVisible?"translateY(0)":"translateY(-12px)",transition:"opacity 0.5s ease,transform 0.5s cubic-bezier(0.16,1,0.3,1)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10,fontSize:13,color:"#8a91a8"}}>
                  <span style={{cursor:"pointer"}} onClick={()=>navigate("/notes")}>Notes</span>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                  <span style={{color:"#4f6ef7",fontWeight:600}}>My Notes</span>
                </div>
                <div style={{height:3,width:36,borderRadius:2,background:"linear-gradient(90deg,#4f6ef7,#60a5fa)",marginBottom:10}}/>
                <h1 style={{fontSize:20,fontWeight:800,color:"#1a1c2e",letterSpacing:"-0.4px",lineHeight:1.2,marginBottom:3}}>My Notes & Downloads</h1>
                <p style={{fontSize:13,color:"#8a91a8"}}>Notes you've created and uploaded.</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:"1px solid #dde0ea",borderRadius:12,padding:"10px 18px",width:240,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{color:"#8a91a8",flexShrink:0}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search my notes…" style={{background:"none",border:"none",outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,color:"#1a1c2e",width:"100%"}}/>
                </div>
                <button onClick={openModal} style={{display:"flex",alignItems:"center",gap:7,background:"#4f6ef7",color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(79,110,247,0.35)",transition:"transform 0.18s,box-shadow 0.18s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(79,110,247,0.45)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 14px rgba(79,110,247,0.35)";}}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Note
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{padding:"0 36px",display:"flex",gap:12,marginBottom:14}}>
            {[{icon:"📝",bg:"#eef1ff",value:`${stats.count} Notes`,label:"Total uploaded"},{icon:"❤️",bg:"#fff1f2",value:`${stats.totalLikes} Likes`,label:"Across all notes"},{icon:"🔖",bg:"#f5f3ff",value:`${stats.totalSaves} Saves`,label:"By other students"}].map((s,i)=>(
              <div key={i} style={{background:"#fff",border:"1px solid #e8eaf0",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,flex:1,animation:`fadeUp 0.4s ease ${i*80}ms both`}}>
                <div style={{width:38,height:38,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{s.icon}</div>
                <div><div style={{fontSize:18,fontWeight:800,color:"#1a1c2e",lineHeight:1}}>{s.value}</div><div style={{fontSize:11.5,color:"#8a91a8",marginTop:3}}>{s.label}</div></div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{padding:"0 36px",display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
            <button style={{display:"flex",alignItems:"center",gap:8,background:"#4f6ef7",color:"#fff",border:"none",borderRadius:10,padding:"10px 22px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(79,110,247,0.32)"}}>📝 My Notes</button>
            <button onClick={()=>navigate("/downloads")} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",color:"#4a5068",border:"1px solid #dde0ea",borderRadius:10,padding:"10px 22px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#4f6ef7";e.currentTarget.style.color="#4f6ef7";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#dde0ea";e.currentTarget.style.color="#4a5068";}}>⬇ Downloads</button>
            <button onClick={()=>setShowCollections(true)}
              style={{display:"flex",alignItems:"center",gap:7,background:"#fff",color:"#8b5cf6",border:"1.5px solid #8b5cf6",borderRadius:10,padding:"10px 18px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f5f3ff"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              📁 Collections <span style={{background:"#8b5cf6",color:"#fff",borderRadius:20,padding:"1px 7px",fontSize:11,marginLeft:2}}>{collections.length}</span>
            </button>
            <button onClick={()=>setShowArchive(true)}
              style={{display:"flex",alignItems:"center",gap:7,background:"#fff",color:"#64748b",border:"1.5px solid #94a3b8",borderRadius:10,padding:"10px 18px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              📦 Archive
            </button>
            <button onClick={fetchNotes} style={{display:"flex",alignItems:"center",gap:6,background:"#fff",color:"#4a5068",border:"1px solid #dde0ea",borderRadius:10,padding:"10px 16px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",marginLeft:"auto"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#4f6ef7"} onMouseLeave={e=>e.currentTarget.style.borderColor="#dde0ea"}>↻ Refresh</button>
          </div>

          {/* Grid */}
          <div style={{padding:"0 32px"}}>
            {loading?(<div style={{textAlign:"center",padding:"80px 0"}}><div style={{width:44,height:44,border:"3px solid #e8eaf0",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/><div style={{fontSize:14,color:"#8a91a8",fontWeight:600}}>Loading from database…</div></div>)
            :filtered.length===0?(<div style={{textAlign:"center",padding:"80px 0",color:"#8a91a8"}}><div style={{fontSize:40,marginBottom:14}}>📭</div><div style={{fontSize:15,fontWeight:600,marginBottom:6}}>No notes found</div><div style={{fontSize:13}}>Try a different search or add a new note.</div></div>)
            :(<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
              {filtered.map((note,i)=>(
                <NoteCard key={note._id} note={note} index={i}
                  onLike={toggleLike} onSave={toggleSave} onPin={togglePin}
                  onView={openView} onArchive={handleArchive}
                  onAddToCollection={n=>setAddToColNote(n)}/>
              ))}
            </div>)}
          </div>
        </div>
      </div>

      {/* ── ADD NOTE MODAL ──────────────────────────────────────────────────── */}
      {showModal&&(
        <div onClick={e=>{if(e.target===e.currentTarget)closeModal();}} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.45)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:100,opacity:modalVisible?1:0,transition:"opacity 0.22s ease",padding:"30px 20px",overflowY:"auto"}}>
          <div style={{background:"#fff",borderRadius:20,width:780,boxShadow:"0 32px 80px rgba(0,0,0,0.18)",animation:modalVisible?"modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both":"none",border:"1px solid #e5e7eb",marginBottom:30,overflow:"hidden"}}>
            <div style={{padding:"20px 26px",borderBottom:"1px solid #f0f2f8",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>📝</span>
                <div><div style={{fontSize:17,fontWeight:800,color:"#0f172a"}}>Add New Note</div><div style={{fontSize:12.5,color:"#94a3b8",marginTop:1}}>Saved to MongoDB · Duplicate-checked automatically</div></div>
              </div>
              <button onClick={closeModal} style={{width:34,height:34,borderRadius:9,background:"#f8fafc",border:"1.5px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:15,color:"#64748b"}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:0}}>
              {/* Left col */}
              <div style={{padding:"24px 20px 24px 26px",borderRight:"1px solid #f0f2f8",display:"flex",flexDirection:"column",gap:16}}>
                <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>📎 Attach File</div>
                <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);handleFileDrop(Array.from(e.dataTransfer.files));}}
                  onClick={()=>document.getElementById("mn-fi").click()}
                  style={{border:`2px dashed ${dragOver?"#4f6ef7":"#c7d2e8"}`,borderRadius:16,padding:"28px 14px",textAlign:"center",cursor:"pointer",background:dragOver?"#eef1ff":"#fafbff",display:"flex",flexDirection:"column",alignItems:"center",gap:10,minHeight:200}}>
                  <input id="mn-fi" type="file" multiple style={{display:"none"}} onChange={e=>{handleFileDrop(Array.from(e.target.files));e.target.value="";}}/>
                  <div style={{width:52,height:52,borderRadius:14,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={dragOver?"#4f6ef7":"#94a3b8"} strokeWidth="1.5"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                  </div>
                  <div><div style={{fontSize:13.5,fontWeight:700,color:dragOver?"#4f6ef7":"#111827",marginBottom:3}}>Drag & Drop</div><div style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>PDF, DOCX, PPTX, TXT<br/>Max 5 MB</div></div>
                  <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#fff",border:"1.5px solid #d1d5db",borderRadius:9,padding:"7px 18px",fontSize:13,fontWeight:600,color:"#374151"}}>Browse Files</div>
                </div>
                {droppedFiles.length>0&&<div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {droppedFiles.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 10px"}}>
                    <span style={{fontSize:11.5,color:"#374151",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{FILE_ICON(f.name.split(".").pop())} {f.name}</span>
                    <button onClick={e=>{e.stopPropagation();setDroppedFiles(p=>p.filter((_,j)=>j!==i));}} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:14,marginLeft:6}}>✕</button>
                  </div>)}
                </div>}
                <div>
                  <div style={{fontSize:11,fontWeight:800,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7}}>SUBJECT</div>
                  <div style={{position:"relative"}}>
                    <select value={form.subject} onChange={e=>handleChange("subject",e.target.value)} className="mf" style={{...inp,appearance:"none",paddingRight:36,cursor:"pointer"}}>
                      {["IT / SE","OOP / Java","Mathematics","Database","Networking","English","Business"].map(s=><option key={s}>{s}</option>)}
                    </select><ChevDown/>
                  </div>
                </div>
              </div>
              {/* Right col */}
              <div style={{padding:"24px 26px",display:"flex",flexDirection:"column",gap:14}}>
                <div><Lbl text="🏠 Faculty"/><div style={{position:"relative"}}><select value={form.faculty} onChange={e=>handleChange("faculty",e.target.value)} onBlur={()=>handleBlur("faculty")} className="mf" style={getSel("faculty")}><option value="">-- Select Faculty --</option>{["IT","DS","SE","CSNE","AI"].map(o=><option key={o} value={o}>{o}</option>)}</select><ChevDown/></div><Err f="faculty"/></div>
                <div><Lbl text="📄 Note Title" req/><input value={form.title} onChange={e=>handleChange("title",e.target.value)} onBlur={()=>handleBlur("title")} placeholder="e.g. Week 6 — Sorting Algorithms" className="mf" style={getInp("title")}/><Err f="title"/></div>
                <div><Lbl text="💬 Summary / Content" req/><textarea value={form.content} onChange={e=>handleChange("content",e.target.value)} onBlur={()=>handleBlur("content")} placeholder="Write a summary or paste your note content…" className="mf" rows={4} style={{...getInp("content"),resize:"vertical",minHeight:100,lineHeight:1.65}}/><Err f="content"/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12}}>
                  <div><Lbl text="Module Code" req/><input value={form.moduleCode} onChange={e=>handleChange("moduleCode",e.target.value)} onBlur={()=>handleBlur("moduleCode")} placeholder="IT2040" className="mf" style={getInp("moduleCode")}/><Err f="moduleCode"/></div>
                  <div><Lbl text="Module Name" req/><input value={form.moduleName} onChange={e=>handleChange("moduleName",e.target.value)} onBlur={()=>handleBlur("moduleName")} placeholder="Data Structures & Algorithms" className="mf" style={getInp("moduleName")}/><Err f="moduleName"/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><Lbl text="Year / Semester"/><div style={{position:"relative"}}><select value={form.semester} onChange={e=>handleChange("semester",e.target.value)} onBlur={()=>handleBlur("semester")} className="mf" style={getSel("semester")}><option value="">-- Select --</option>{["Y1S1","Y1S2","Y2S1","Y2S2","Y3S1","Y3S2","Y4S1","Y4S2"].map(y=><option key={y}>{y}</option>)}</select><ChevDown/></div><Err f="semester"/></div>
                  <div><Lbl text="Tags" req/><input value={form.tags} onChange={e=>handleChange("tags",e.target.value)} onBlur={()=>handleBlur("tags")} placeholder="Sorting, Arrays, Midterm" className="mf" style={getInp("tags")}/>{formErrors.tags&&touched.tags?<Err f="tags"/>:<div style={{fontSize:11.5,color:"#94a3b8",marginTop:5}}>Comma-separated</div>}</div>
                </div>
                <div><Lbl text="Resource Type"/><div style={{position:"relative"}}><select value={form.resourceType} onChange={e=>handleChange("resourceType",e.target.value)} onBlur={()=>handleBlur("resourceType")} className="mf" style={getSel("resourceType")}><option value="">-- Select Type --</option>{["Notes","Slides","Past Paper","Lab Report","Assignment","Cheat Sheet","Other"].map(r=><option key={r}>{r}</option>)}</select><ChevDown/></div><Err f="resourceType"/></div>
              </div>
            </div>
            <div style={{padding:"16px 26px 22px",borderTop:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:12.5,color:"#94a3b8",display:"flex",alignItems:"center",gap:6}}><span style={{color:"#ef4444"}}>*</span> Required · Saved to MongoDB · 🔁 Duplicate-checked</div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={closeModal} disabled={submitting} style={{background:"#fff",color:"#374151",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 22px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                <button onClick={handleSave} disabled={submitting} style={{display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#4f6ef7,#6366f1)",color:"#fff",border:"none",borderRadius:10,padding:"10px 26px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,fontWeight:700,cursor:submitting?"not-allowed":"pointer",opacity:submitting?0.8:1}}>
                  {submitting?(<><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,0.35)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Checking…</>)
                  :(<><svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>Save Note</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW NOTE MODAL ─────────────────────────────────────────────────── */}
      {viewNote&&(
        <div onClick={e=>{if(e.target===e.currentTarget)closeView();}} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:200,opacity:viewVisible?1:0,transition:"opacity 0.22s ease",padding:"30px 20px",overflowY:"auto"}}>
          <div style={{background:"#fff",borderRadius:20,width:960,boxShadow:"0 32px 80px rgba(0,0,0,0.22)",animation:viewVisible?"modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both":"none",marginBottom:30}}>
            <div style={{height:5,background:vSubj?.barColor||"#4f6ef7",borderRadius:"20px 20px 0 0"}}/>
            <div style={{padding:"18px 24px",borderBottom:"1px solid #f0f2f8",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:36,height:36,borderRadius:10,background:vSubj?.badgeBg||"#eef1ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{vSubj?.icon||"📝"}</div>
                <div><div style={{fontSize:15,fontWeight:800,color:"#0f172a",maxWidth:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{viewNote.title}</div><div style={{fontSize:12,color:"#64748b"}}>{viewNote.moduleCode} · {viewNote.semester} · {viewNote.resourceType}</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>setAddToColNote(viewNote)} style={{display:"flex",alignItems:"center",gap:6,background:"#f5f3ff",color:"#8b5cf6",border:"1.5px solid #ddd6fe",borderRadius:9,padding:"7px 14px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12.5,fontWeight:700,cursor:"pointer"}}>📁 Add to Collection</button>
                <button onClick={()=>{closeView();setTimeout(()=>openDelete(viewNote._id),250);}} style={{display:"flex",alignItems:"center",gap:6,background:"#fff",color:"#ef4444",border:"1.5px solid #fecaca",borderRadius:9,padding:"7px 14px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12.5,fontWeight:700,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#fff1f2"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>🗑 Delete</button>
                <button onClick={closeView} style={{width:32,height:32,borderRadius:8,background:"#f1f5f9",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:15,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
            </div>
            <div style={{padding:"12px 24px 0",borderBottom:"1px solid #f0f2f8",display:"flex",gap:4}}>
              {TAB_BTN("details","Details",<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>)}
              {TAB_BTN("file",`File${viewNote.fileName?" 📎":""}`,<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>)}
              {TAB_BTN("comments",`Comments (${(viewNote.comments||[]).length})`,<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>)}
              {TAB_BTN("edit","Edit",<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>)}
              <button onClick={()=>{closeView();setTimeout(()=>setQuizNote(viewNote),250);}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif",background:"linear-gradient(135deg,#4f6ef7,#6366f1)",color:"#fff",marginLeft:"auto"}}>🧠 AI Quiz</button>
            </div>
            <div style={{padding:"24px",minHeight:300}}>
              {viewTab==="details"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                    <div style={{width:32,height:32,borderRadius:9,background:viewNote.avColor||vSubj?.barColor||"#4f6ef7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{viewNote.av}</div>
                    <div style={{fontSize:13,fontWeight:600}}>{viewNote.author}</div>
                    <span style={{color:"#cbd5e1"}}>·</span>
                    <div style={{fontSize:12,color:"#64748b"}}>{fmtDate(viewNote.createdAt)||viewNote.date}</div>
                  </div>
                  <div style={{fontSize:14,color:"#374151",lineHeight:1.8,marginBottom:18}}>{viewNote.content||viewNote.excerpt}</div>
                  {(viewNote.moduleCode||viewNote.moduleName)&&<div style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",marginBottom:16,border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>MODULE INFO</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><div style={{fontSize:11.5,color:"#94a3b8",marginBottom:3}}>Code</div><div style={{fontSize:15,fontWeight:700}}>{viewNote.moduleCode||"—"}</div></div>
                      <div><div style={{fontSize:11.5,color:"#94a3b8",marginBottom:3}}>Module</div><div style={{fontSize:14,fontWeight:700}}>{viewNote.moduleName||"—"}</div></div>
                    </div>
                  </div>}
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(viewNote.tags||[]).map(t=><span key={t} style={{fontSize:12,fontWeight:500,padding:"4px 11px",borderRadius:7,background:"#f1f5f9",color:"#475569",border:"1px solid #e2e8f0"}}>{t}</span>)}</div>
                </div>
                <div>
                  <div style={{background:"#f8fafc",borderRadius:14,padding:"20px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>NOTE STATS</div>
                    {[["❤️","Likes",viewNote.likes||0],["🔖","Saves",viewNote.saves||0],["💬","Comments",(viewNote.comments||[]).length],["🏷️","Tags",(viewNote.tags||[]).length]].map(([ic,lb,val])=>(
                      <div key={lb} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #f0f2f8"}}><span style={{fontSize:13,color:"#64748b"}}>{ic} {lb}</span><span style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>{val}</span></div>
                    ))}
                  </div>
                  {collections.filter(c=>c.noteIds?.includes(viewNote._id)).length>0&&<div style={{background:"#f5f3ff",borderRadius:12,padding:"14px 16px",border:"1px solid #ddd6fe",marginTop:12}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#8b5cf6",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>📁 In Collections</div>
                    {collections.filter(c=>c.noteIds?.includes(viewNote._id)).map(c=><div key={c._id} style={{fontSize:13,color:"#7c3aed",fontWeight:500,display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span>{c.icon}</span>{c.name}</div>)}
                  </div>}
                </div>
              </div>}
              {viewTab==="file"&&<FileViewer note={viewNote} onDownload={()=>{closeView();navigate('/downloads');}}/>}
              {viewTab==="comments"&&<div>
                <div style={{display:"flex",gap:10,marginBottom:20}}>
                  <div style={{width:34,height:34,borderRadius:8,background:"#4f6ef7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>{(user?.name||"YO").slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <textarea value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add a comment…" rows={3}
                      style={{width:"100%",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,color:"#111827",outline:"none",resize:"vertical",lineHeight:1.6}}
                      onFocus={e=>e.target.style.borderColor="#4f6ef7"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                    <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
                      <button onClick={addComment} disabled={!commentText.trim()} style={{display:"flex",alignItems:"center",gap:6,background:commentText.trim()?"#4f6ef7":"#e2e8f0",color:commentText.trim()?"#fff":"#94a3b8",border:"none",borderRadius:9,padding:"8px 18px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:commentText.trim()?"pointer":"not-allowed"}}>Post Comment</button>
                    </div>
                  </div>
                </div>
                {(viewNote.comments||[]).length===0?<div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}><div style={{fontSize:32,marginBottom:10}}>💬</div><div style={{fontSize:14,fontWeight:500}}>No comments yet.</div></div>
                :<div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {(viewNote.comments||[]).map(c=><div key={c._id} style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",border:"1px solid #e2e8f0",display:"flex",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:c.avColor||"#4f6ef7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0}}>{c.av}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:700}}>{c.author}</span><span style={{fontSize:12,color:"#94a3b8"}}>{c.date}</span></div>
                        {c.author===user?.name&&<button onClick={()=>deleteComment(c._id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:13,opacity:0.6}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.6"}>✕</button>}
                      </div>
                      <div style={{fontSize:13.5,color:"#374151",lineHeight:1.65}}>{c.text}</div>
                    </div>
                  </div>)}
                </div>}
              </div>}
              {viewTab==="edit"&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div style={{gridColumn:"1 / -1"}}><label style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block"}}>Note Title *</label><input value={editForm.title||""} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} style={{...inp}} onFocus={e=>e.target.style.borderColor="#4f6ef7"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/></div>
                  <div style={{gridColumn:"1 / -1"}}><label style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block"}}>Content *</label><textarea value={editForm.content||""} onChange={e=>setEditForm(f=>({...f,content:e.target.value}))} style={{...inp,resize:"vertical",minHeight:110}} onFocus={e=>e.target.style.borderColor="#4f6ef7"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/></div>
                  <div><label style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block"}}>Module Code</label><input value={editForm.moduleCode||""} onChange={e=>setEditForm(f=>({...f,moduleCode:e.target.value}))} style={{...inp}} onFocus={e=>e.target.style.borderColor="#4f6ef7"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/></div>
                  <div><label style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block"}}>Module Name</label><input value={editForm.moduleName||""} onChange={e=>setEditForm(f=>({...f,moduleName:e.target.value}))} style={{...inp}} onFocus={e=>e.target.style.borderColor="#4f6ef7"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/></div>
                  <div><label style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block"}}>Semester</label><div style={{position:"relative"}}><select value={editForm.semester||""} onChange={e=>setEditForm(f=>({...f,semester:e.target.value}))} style={{...inp,appearance:"none",paddingRight:36,cursor:"pointer"}}><option value="">-- Select --</option>{["Y1S1","Y1S2","Y2S1","Y2S2","Y3S1","Y3S2","Y4S1","Y4S2"].map(y=><option key={y}>{y}</option>)}</select><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"#94a3b8"}}><polyline points="6,9 12,15 18,9"/></svg></div></div>
                  <div><label style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block"}}>Resource Type</label><div style={{position:"relative"}}><select value={editForm.resourceType||""} onChange={e=>setEditForm(f=>({...f,resourceType:e.target.value}))} style={{...inp,appearance:"none",paddingRight:36,cursor:"pointer"}}><option value="">-- Select --</option>{["Notes","Slides","Past Paper","Lab Report","Assignment","Cheat Sheet","Other"].map(r=><option key={r}>{r}</option>)}</select><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"#94a3b8"}}><polyline points="6,9 12,15 18,9"/></svg></div></div>
                  <div style={{gridColumn:"1 / -1"}}><label style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:6,display:"block"}}>Tags (comma-separated)</label><input value={editForm.tags||""} onChange={e=>setEditForm(f=>({...f,tags:e.target.value}))} style={{...inp}} onFocus={e=>e.target.style.borderColor="#4f6ef7"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/></div>
                </div>
                <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
                  <button onClick={()=>setViewTab("details")} style={{background:"#fff",color:"#374151",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 20px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                  <button onClick={handleViewUpdate} style={{display:"flex",alignItems:"center",gap:7,background:"linear-gradient(135deg,#4f6ef7,#6366f1)",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>Save Changes</button>
                </div>
              </div>}
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ──────────────────────────────────────────────────── */}
      {deleteId&&<div onClick={e=>{if(e.target===e.currentTarget)closeDelete();}} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,opacity:deleteVisible?1:0,transition:"opacity 0.2s ease",padding:"20px"}}>
        <div style={{background:"#fff",borderRadius:16,width:420,boxShadow:"0 24px 70px rgba(0,0,0,0.18)",animation:deleteVisible?"modalIn 0.22s ease both":"none",overflow:"hidden"}}>
          <div style={{padding:"28px 28px 20px",textAlign:"center"}}>
            <div style={{width:56,height:56,borderRadius:16,background:"#fff1f2",border:"2px solid #fecaca",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 16px"}}>🗑️</div>
            <div style={{fontSize:17,fontWeight:800,color:"#1a1c2e",marginBottom:8}}>Delete Note?</div>
            <div style={{fontSize:13.5,color:"#64748b",lineHeight:1.6}}>This action <strong>cannot be undone</strong>. The note will be permanently removed.</div>
          </div>
          <div style={{padding:"0 28px 24px",display:"flex",gap:10}}>
            <button onClick={closeDelete} style={{flex:1,background:"#fff",color:"#4a5068",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"11px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={confirmDelete} style={{flex:1,background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>🗑 Yes, Delete</button>
          </div>
        </div>
      </div>}

      {/* ── DUPLICATE BLOCKED — hard stop ────────────────────────────────────── */}
      {dupMatches&&<DuplicateBlockedModal matches={dupMatches} onClose={()=>setDupMatches(null)}/>}

      {/* ── COLLECTIONS ──────────────────────────────────────────────────────── */}
      {showCollections&&<CollectionsPanel collections={collections} notes={notes} onClose={()=>setShowCollections(false)} onRefresh={fetchCollections} fireToast={fireToast}/>}
      {addToColNote&&<AddToCollectionModal note={addToColNote} collections={collections} onClose={()=>setAddToColNote(null)} onAdded={fetchCollections} fireToast={fireToast}/>}

      {/* ── ARCHIVE ──────────────────────────────────────────────────────────── */}
      {showArchive&&<ArchivePanel onClose={()=>setShowArchive(false)} fireToast={fireToast} onRefreshMain={fetchNotes}/>}

      {quizNote&&<QuizModal note={quizNote} onClose={()=>setQuizNote(null)}/>}

      {/* ── TOAST ───────────────────────────────────────────────────────────── */}
      {showToast&&<div style={{position:"fixed",bottom:28,right:28,zIndex:9999,display:"flex",alignItems:"center",gap:12,background:toastType==="success"?"#0f172a":toastType==="info"?"#1e3a8a":"#fff1f2",border:toastType==="error"?"1.5px solid #fca5a5":"none",color:toastType==="error"?"#dc2626":"#fff",padding:"14px 20px",borderRadius:14,boxShadow:"0 10px 40px rgba(0,0,0,0.2)",animation:"slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both",fontSize:13.5,fontWeight:600,maxWidth:420}}>
        <span style={{fontSize:22,flexShrink:0}}>{toastType==="success"?"✅":toastType==="info"?"🔍":"⚠️"}</span>
        <span style={{flex:1}}>{toastMsg}</span>
        <button onClick={()=>setShowToast(false)} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",fontSize:17,opacity:0.55,padding:"0 0 0 10px"}}>✕</button>
      </div>}
    </div>
  );
}
