import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import fullLogo from "../assets/fulllogo.png";
import userAvatar from "../assets/user.png";

const API_BASE = "http://localhost:5000/api";
const USER_ID  = "default_user";

const fmtDate  = (d) => {if(!d)return"";try{return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}catch{return d||"";}};
const fmtBytes = (b) => {if(!b)return"—";if(b<1024)return b+" B";if(b<1048576)return(b/1024).toFixed(1)+" KB";return(b/1048576).toFixed(1)+" MB";};
const fileExt  = (name) => (name||"").split(".").pop().toLowerCase();
const FILE_ICON_EMOJI = (ext) => {const e=(ext||"").toLowerCase();if(e==="pdf")return"📕";if(["doc","docx"].includes(e))return"📘";if(["ppt","pptx"].includes(e))return"📙";if(["xls","xlsx","csv"].includes(e))return"📗";if(["txt","md"].includes(e))return"📄";return"📎";};

// ── DUPLICATE ALERT BANNER ────────────────────────────────────────────────────
function DupAlert({message,onDismiss}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),10);},[]);
  const dismiss=()=>{setVis(false);setTimeout(onDismiss,300);};
  return(
    <div style={{position:"fixed",top:24,left:"50%",transform:vis?"translateX(-50%) translateY(0)":"translateX(-50%) translateY(-80px)",opacity:vis?1:0,transition:"all 0.35s cubic-bezier(0.16,1,0.3,1)",zIndex:9999,pointerEvents:vis?"auto":"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,background:"#fff",border:"2px solid #fecaca",borderRadius:14,padding:"14px 20px",boxShadow:"0 8px 32px rgba(239,68,68,0.22)",maxWidth:500}}>
        <span style={{fontSize:22,flexShrink:0}}>🚫</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13.5,fontWeight:700,color:"#dc2626",marginBottom:2}}>Duplicate File Detected</div>
          <div style={{fontSize:12.5,color:"#374151",lineHeight:1.5}}>{message}</div>
        </div>
        <button onClick={dismiss} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:18,padding:4,flexShrink:0}}>✕</button>
      </div>
    </div>
  );
}

// ── FILE TYPE VISUAL ──────────────────────────────────────────────────────────
function FileTypeIcon({ext}){
  const isPDF=ext==="pdf";
  const bg=isPDF?"#fff1f2":"#eef1ff";
  const border=isPDF?"#fecaca":"#c7d2fe";
  const accent=isPDF?"#ef4444":"#4f6ef7";
  const label=isPDF?"PDF":"DOC";
  return(
    <div style={{width:44,height:50,borderRadius:8,overflow:"hidden",flexShrink:0,border:`1px solid ${border}`,background:bg}}>
      <svg viewBox="0 0 44 50" width="44" height="50">
        <rect width="44" height="50" fill={bg}/>
        <rect x="6" y="4" width="24" height="32" rx="3" fill="#fff" stroke={border} strokeWidth="1"/>
        <polygon points="30,4 38,12 30,12" fill={accent} opacity="0.4"/>
        <rect x="10" y="18" width="16" height="2" rx="1" fill={accent} opacity="0.5"/>
        <rect x="10" y="22" width="12" height="2" rx="1" fill={accent} opacity="0.35"/>
        <rect x="10" y="26" width="14" height="2" rx="1" fill={accent} opacity="0.35"/>
        <rect x="4" y="30" width="36" height="16" rx="3" fill={accent}/>
        <text x="22" y="42" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="Arial">{label}</text>
      </svg>
    </div>
  );
}

// ── FILE ROW ──────────────────────────────────────────────────────────────────
function FileRow({note,onDownload,onQuiz,onDelete}){
  const [hov,setHov]=useState(false);
  const ext=fileExt(note.fileName||note.title);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"center",gap:14,padding:"11px 16px",borderRadius:10,background:hov?"#f7f8fc":"transparent",transition:"background 0.15s"}}>
      <FileTypeIcon ext={ext}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13.5,fontWeight:600,color:"#1a1c2e",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{note.title}</div>
        <div style={{fontSize:11.5,color:"#8a91a8",marginTop:2,display:"flex",gap:8,alignItems:"center"}}>
          {note.fileName&&<span>{FILE_ICON_EMOJI(ext)} {note.fileName.length>28?note.fileName.slice(0,26)+"…":note.fileName}</span>}
          <span>·</span>
          <span>{fmtDate(note.createdAt)}</span>
          {note.fileSize&&<><span>·</span><span>{fmtBytes(note.fileSize)}</span></>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        {/* Download */}
        {note.fileData&&(
          <button onClick={()=>onDownload(note)}
            style={{display:"flex",alignItems:"center",gap:5,background:"#f0f2f8",color:"#4a5068",border:"1px solid #e8eaf0",borderRadius:7,padding:"5px 11px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.background="#e0e4f0"} onMouseLeave={e=>e.currentTarget.style.background="#f0f2f8"}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </button>
        )}
        {/* Quiz */}
        <button onClick={()=>onQuiz(note)}
          style={{display:"flex",alignItems:"center",gap:5,background:"linear-gradient(135deg,#4f6ef7,#6366f1)",color:"#fff",border:"none",borderRadius:7,padding:"5px 12px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 8px rgba(79,110,247,0.28)"}}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.88"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          🧠 Quiz
        </button>
        {/* Delete */}
        <button onClick={()=>onDelete(note._id)}
          style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,color:"#ef4444",opacity:0.5,display:"flex",alignItems:"center"}}
          onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.5"}
          title="Delete note">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5,6m3,0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── QUIZ MODAL (same as MyNotes, reads from fileData) ─────────────────────────
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

  const extractFileText=async()=>{
    if(!note.fileData||!note.fileName) return null;
    const ext=fileExt(note.fileName);
    if(["txt","md"].includes(ext)){try{const t=atob(note.fileData.split(",")[1]);return t.length>100?t:null;}catch{return null;}}
    if(ext==="pdf"){
      try{
        if(!window.pdfjsLib){
          await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});
          window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
        const bin=atob(note.fileData.split(",")[1]),bytes=new Uint8Array(bin.length);
        for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
        const pdf=await window.pdfjsLib.getDocument({data:bytes}).promise;
        let txt="";
        for(let p=1;p<=Math.min(pdf.numPages,15);p++){const pg=await pdf.getPage(p);const tc=await pg.getTextContent();txt+=tc.items.map(i=>i.str).join(" ")+"\n";}
        return txt.trim().length>100?txt.trim():null;
      }catch(e){console.warn("PDF extract:",e);return null;}
    }
    if(["doc","docx"].includes(ext)){
      try{
        if(!window.JSZip){await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
        const bin=atob(note.fileData.split(",")[1]),bytes=new Uint8Array(bin.length);
        for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
        const zip=await window.JSZip.loadAsync(bytes.buffer),xf=zip.file("word/document.xml");
        if(!xf)return null;
        const xml=await xf.async("string"),txt=xml.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
        return txt.length>100?txt:null;
      }catch(e){console.warn("DOCX extract:",e);return null;}
    }
    return null;
  };

  const buildQ=(body,title,tags,sem,rt)=>{
    const sh=a=>[...a].sort(()=>Math.random()-0.5),pk=a=>a[Math.floor(Math.random()*a.length)],L=["A","B","C","D"];
    const STOP=new Set("that this with have from they will been were their there which when what where into also more than then some each about after before other these those very just your much only both well even over such most many like here time used using often called refer known based uses use can its are for the and but not a an the is are".split(" "));
    const sents=body.split(/[.!?\n]+/).map(s=>s.trim()).filter(s=>s.length>25&&s.split(" ").length>=5);
    const aw=body.toLowerCase().match(/\b[a-z]{4,}\b/g)||[],freq={};
    aw.forEach(w=>{if(!STOP.has(w))freq[w]=(freq[w]||0)+1;});
    const kw=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,60).map(e=>e[0]);
    const bl=[],us=new Set();
    sents.forEach(sent=>{
      if(bl.length>=18||us.has(sent))return;
      const ws=sent.match(/\b[A-Za-z]{5,}\b/g)||[];
      const imp=ws.filter(w=>!STOP.has(w.toLowerCase())&&freq[w.toLowerCase()]>=1);
      if(!imp.length)return;
      const tg=pk(imp),bk=sent.replace(new RegExp(`\\b${tg}\\b`,"i"),"_____");
      const wp=kw.filter(k=>k!==tg.toLowerCase()).slice(0,10);
      if(wp.length<3)return;
      const wr=sh(wp).slice(0,3).map(w=>w.charAt(0).toUpperCase()+w.slice(1));
      const op=sh([tg,...wr]);
      bl.push({question:`Fill in the blank: "${bk.slice(0,120)}${bk.length>120?"…":""}"`,options:op.map((o,i)=>`${L[i]}) ${o}`),answer:L[op.indexOf(tg)]});
      us.add(sent);
    });
    if((tags||[]).length>=2){const c=pk(tags);const ex=["Networking","Recursion","Polymorphism","Hashing","Concurrency","Sorting","Searching"];const op=sh([c,...sh(ex.filter(e=>!tags.includes(e))).slice(0,3)]);bl.push({question:`Which topic is covered in "${title}"?`,options:op.map((o,i)=>`${L[i]}) ${o}`),answer:L[op.indexOf(c)]});}
    if(sem){const al=["Y1S1","Y1S2","Y2S1","Y2S2","Y3S1","Y3S2","Y4S1","Y4S2"];const op=sh([sem,...sh(al.filter(s=>s!==sem)).slice(0,3)]);bl.push({question:"Which semester does this note belong to?",options:op.map((o,i)=>`${L[i]}) ${o}`),answer:L[op.indexOf(sem)]});}
    if(rt){const tp=["Notes","Slides","Past Paper","Lab Report","Assignment","Cheat Sheet"];const op=sh([rt,...sh(tp.filter(t=>t!==rt)).slice(0,3)]);bl.push({question:`What resource type is "${title}"?`,options:op.map((o,i)=>`${L[i]}) ${o}`),answer:L[op.indexOf(rt)]});}
    const picked=sh(bl).slice(0,5);
    return picked.length<2?null:picked;
  };

  const generateQuiz=async()=>{
    setLoading(true);setExtracting(false);setError("");setQuestions([]);setAnswers({});setSubmitted(false);
    try{
      let bodyText=null;
      if(note.fileData&&note.fileName){setExtracting(true);bodyText=await extractFileText();setExtracting(false);if(bodyText&&bodyText.trim().length>100)setSourceLabel(`📄 ${note.fileName}`);}
      if(!bodyText){const fb=(note.content||note.excerpt||"").trim();if(fb.length>50){bodyText=fb;setSourceLabel("📝 Note content");}}
      if(!bodyText||bodyText.trim().length<50){setError(note.fileData?"Could not extract text from file (may be image-only PDF).":"No content to generate quiz from.");return;}
      const qs=buildQ(bodyText,note.title||"",note.tags||[],note.semester||"",note.resourceType||"");
      if(!qs||qs.length<2){setError("Not enough content to build quiz questions.");return;}
      setQuestions(qs);
    }catch(e){console.error(e);setError("Could not generate quiz. Please try again.");}
    finally{setLoading(false);setExtracting(false);}
  };
  const close=()=>{setVisible(false);setTimeout(onClose,220);};
  const score=submitted?questions.filter((q,i)=>answers[i]===q.answer).length:0;
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)close();}} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:400,opacity:visible?1:0,transition:"opacity 0.22s",padding:"30px 20px",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:20,width:660,boxShadow:"0 32px 80px rgba(0,0,0,0.22)",animation:visible?"modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both":"none",marginBottom:30}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #f0f2f8",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#4f6ef7,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🧠</div>
            <div><div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>AI Quiz</div><div style={{fontSize:12,color:"#64748b"}}>{note.title?.slice(0,50)}{note.title?.length>50?"…":""}</div></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {!loading&&<button onClick={generateQuiz} style={{padding:"7px 14px",borderRadius:8,background:"#f1f5f9",border:"1px solid #e2e8f0",fontSize:12.5,fontWeight:600,cursor:"pointer",color:"#374151",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>↻ New Quiz</button>}
            <button onClick={close} style={{width:32,height:32,borderRadius:8,background:"#f1f5f9",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:15,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </div>
        {sourceLabel&&!loading&&<div style={{padding:"10px 24px 0"}}><span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:11.5,fontWeight:600,padding:"4px 12px",borderRadius:20,background:"#eef1ff",color:"#4f6ef7",border:"1px solid #c7d2fe"}}>Quiz source: {sourceLabel}</span></div>}
        <div style={{padding:"20px 24px 24px"}}>
          {loading&&<div style={{textAlign:"center",padding:"50px 0"}}><div style={{width:40,height:40,border:"3px solid #e8eaf0",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/><div style={{fontSize:14,color:"#64748b",fontWeight:600}}>{extracting?"📄 Reading file content…":"🧠 Building questions…"}</div></div>}
          {!loading&&error&&<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:36,marginBottom:14}}>📭</div><div style={{fontSize:14,color:"#ef4444",fontWeight:600,marginBottom:8}}>Cannot generate quiz</div><div style={{fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:20}}>{error}</div><button onClick={generateQuiz} style={{background:"#4f6ef7",color:"#fff",border:"none",borderRadius:9,padding:"9px 20px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>Try Again</button></div>}
          {!loading&&!error&&submitted&&<div style={{background:score>=4?"#f0fdf4":score>=3?"#fffbeb":"#fef2f2",border:`1px solid ${score>=4?"#86efac":score>=3?"#fcd34d":"#fca5a5"}`,borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:26}}>{score>=4?"🎉":score>=3?"👍":"📚"}</span><div><div style={{fontSize:15,fontWeight:800}}>Score: {score}/{questions.length}</div><div style={{fontSize:12.5,color:"#64748b"}}>{score>=4?"Excellent!":score>=3?"Good effort!":"Keep studying!"}</div></div></div>}
          {!loading&&!error&&questions.length>0&&(<>
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
                      return<button key={oi} onClick={()=>{if(!submitted)setAnswers(a=>({...a,[qi]:letter}));}} style={{textAlign:"left",background:bg,border,borderRadius:8,padding:"9px 14px",fontSize:13,fontWeight:sel?600:400,color,cursor:submitted?"default":"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        <span style={{width:22,height:22,borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:submitted&&corr?"#4ade80":submitted&&sel?"#f87171":sel?"#4f6ef7":"#e2e8f0",color:(submitted&&(corr||sel))||sel?"#fff":"#64748b"}}>{letter}</span>
                        {opt.slice(2)}
                      </button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:20,display:"flex",justifyContent:"flex-end"}}>
              {submitted?<button onClick={generateQuiz} style={{background:"linear-gradient(135deg,#4f6ef7,#6366f1)",color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,fontWeight:700,cursor:"pointer"}}>↻ New Quiz</button>
              :<button onClick={()=>setSubmitted(true)} disabled={Object.keys(answers).length<questions.length} style={{background:Object.keys(answers).length<questions.length?"#e2e8f0":"linear-gradient(135deg,#4f6ef7,#6366f1)",color:Object.keys(answers).length<questions.length?"#94a3b8":"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,fontWeight:700,cursor:Object.keys(answers).length<questions.length?"not-allowed":"pointer"}}>Submit ({Object.keys(answers).length}/{questions.length})</button>}
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ── MAIN DOWNLOADS PAGE ───────────────────────────────────────────────────────
export default function Downloads(){
  const navigate=useNavigate();
  const [headerVisible,setHeaderVisible]=useState(false);
  const [notes,setNotes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [quizNote,setQuizNote]=useState(null);
  const [dupAlert,setDupAlert]=useState(null); // { message }
  const [deleteId,setDeleteId]=useState(null);
  const [deleteVis,setDeleteVis]=useState(false);
  const [search,setSearch]=useState("");

  useEffect(()=>{setTimeout(()=>setHeaderVisible(true),50);fetchNotes();},[]);

  const fetchNotes=async()=>{
    setLoading(true);
    try{
      const r=await fetch(`${API_BASE}/notes?userId=${USER_ID}`).then(x=>x.json());
      if(r.success) setNotes(r.data.filter(n=>n.fileName)); // only notes with files
    }catch{console.error("Failed to load notes");}
    setLoading(false);
  };

  const handleDownload=(note)=>{
    if(!note.fileData)return;
    const a=document.createElement("a");a.href=note.fileData;a.download=note.fileName;a.click();
  };

  const handleDelete=async()=>{
    if(!deleteId)return;
    try{
      const r=await fetch(`${API_BASE}/notes/${deleteId}`,{method:"DELETE"}).then(x=>x.json());
      if(r.success){setNotes(n=>n.filter(x=>x._id!==deleteId));setDeleteId(null);setDeleteVis(false);}
    }catch{console.error("Delete failed");}
  };

  const openDelete=(id)=>{setDeleteId(id);setTimeout(()=>setDeleteVis(true),10);};
  const closeDelete=()=>{setDeleteVis(false);setTimeout(()=>setDeleteId(null),220);};

  // ── Check for file duplicates when a file is dragged onto the page ──────────
  const handlePageDrop=(e)=>{
    e.preventDefault();
    const files=Array.from(e.dataTransfer.files);
    if(!files.length)return;
    files.forEach(file=>{
      const incomingName=file.name.trim().toLowerCase();
      const incomingSize=file.size;
      const dup=notes.find(n=>{
        if(!n.fileName)return false;
        const sameName=n.fileName.trim().toLowerCase()===incomingName;
        const sameSize=n.fileSize&&Math.abs(n.fileSize-incomingSize)/Math.max(incomingSize,1)<0.05;
        return sameName||sameSize;
      });
      if(dup){
        setDupAlert({
          message:`"${file.name}" already exists in your notes (found in: "${dup.title}"). Please delete the old note first if you want to upload an updated version.`
        });
      }
    });
  };

  const filtered=notes.filter(n=>
    n.title.toLowerCase().includes(search.toLowerCase())||
    (n.fileName||"").toLowerCase().includes(search.toLowerCase())||
    (n.tags||[]).some(t=>t.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by resource type
  const groups={};
  filtered.forEach(n=>{
    const key=n.resourceType||"Other";
    if(!groups[key])groups[key]=[];
    groups[key].push(n);
  });

  const totalSize=notes.reduce((a,n)=>a+(n.fileSize||0),0);

  return(
    <div
      onDragOver={e=>e.preventDefault()}
      onDrop={handlePageDrop}
      style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#f0f2f8",minHeight:"calc(100vh - 100px)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#dde0ea;border-radius:3px}
        @keyframes modalIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sub-hover:hover{background:#f0f2f8 !important;color:#1a1c2e !important}
        
        .notes-sub-nav { display: flex; gap: 8px; margin-bottom: 24px; padding: 0 36px; padding-top: 24px; }
        .sub-nav-btn { padding: 10px 18px; border-radius: 30px; background: white; border: 1px solid #e8eaf0; font-size: 0.9rem; font-weight: 600; color: #4a5068; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .sub-nav-btn:hover { background: #f8fafc; border-color: #4f6ef7; color: #4f6ef7; }
        .sub-nav-btn.active { background: #4f6ef7; color: white; border-color: #4f6ef7; }
      `}</style>
      
      {/* ── Sub Navigation ── */}
      <div className="notes-sub-nav">
          <button className="sub-nav-btn" onClick={() => navigate('/notes')}>All Notes</button>
          <button className="sub-nav-btn" onClick={() => navigate('/my-notes')}>My Notes</button>
          <button className="sub-nav-btn" onClick={() => navigate('/shared-notes')}>Shared</button>
          <button className="sub-nav-btn" onClick={() => navigate('/starred-notes')}>Starred</button>
          <button className="sub-nav-btn" onClick={() => navigate('/quiz')}>AI Quiz</button>
      </div>

      {/* Duplicate alert banner */}
      {dupAlert&&<DupAlert message={dupAlert.message} onDismiss={()=>setDupAlert(null)}/>}

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{flex:1,overflowY:"auto",padding:"0 0 40px"}}>
          {/* Header */}
          <div style={{padding:"24px 36px 20px",opacity:headerVisible?1:0,transform:headerVisible?"translateY(0)":"translateY(-12px)",transition:"opacity 0.5s ease,transform 0.5s cubic-bezier(0.16,1,0.3,1)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10,fontSize:13,color:"#8a91a8"}}>
                  <span style={{cursor:"pointer"}} onClick={()=>navigate("/my-notes")}>My Notes</span>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                  <span style={{color:"#4f6ef7",fontWeight:600}}>Downloads</span>
                </div>
                <div style={{height:3,width:36,borderRadius:2,background:"linear-gradient(90deg,#4f6ef7,#60a5fa)",marginBottom:10}}/>
                <h1 style={{fontSize:20,fontWeight:800,color:"#1a1c2e",letterSpacing:"-0.4px",marginBottom:3}}>My Library & Downloads</h1>
                <p style={{fontSize:13,color:"#8a91a8"}}>All your uploaded files — quiz them, download or delete.</p>
              </div>
              {/* Search */}
              <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:"1px solid #dde0ea",borderRadius:12,padding:"10px 18px",width:240,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{color:"#8a91a8",flexShrink:0}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search files…" style={{background:"none",border:"none",outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,color:"#1a1c2e",width:"100%"}}/>
              </div>
            </div>
          </div>

          {/* Duplicate notice banner */}
          <div style={{padding:"0 36px",marginBottom:16}}>
            <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,fontSize:12.5,color:"#92400e"}}>
              <span style={{fontSize:16}}>💡</span>
              <span><strong>Duplicate detection is active.</strong> Dragging a file onto this page will instantly check if it already exists in your notes.</span>
            </div>
          </div>

          <div style={{padding:"0 36px",display:"flex",gap:20,alignItems:"flex-start"}}>
            {/* File list */}
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:14}}>
              {loading?(
                <div style={{textAlign:"center",padding:"80px 0"}}><div style={{width:44,height:44,border:"3px solid #e8eaf0",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/><div style={{fontSize:14,color:"#8a91a8",fontWeight:600}}>Loading your files…</div></div>
              ):filtered.length===0?(
                <div style={{textAlign:"center",padding:"80px 0",color:"#8a91a8"}}><div style={{fontSize:40,marginBottom:14}}>📭</div><div style={{fontSize:15,fontWeight:600,marginBottom:6}}>No files found</div><div style={{fontSize:13}}>Upload files when adding notes in My Notes.</div></div>
              ):Object.entries(groups).map(([groupName,groupNotes])=>(
                <div key={groupName} style={{background:"#fff",border:"1px solid #e8eaf0",borderRadius:14,overflow:"hidden",animation:"fadeUp 0.4s ease both"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",borderBottom:"1px solid #f0f2f8"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:12,fontWeight:800,color:"#1a1c2e",letterSpacing:"0.06em"}}>{groupName.toUpperCase()}</span>
                      <span style={{fontSize:11,fontWeight:600,color:"#8a91a8",background:"#f0f2f8",padding:"2px 8px",borderRadius:20}}>{groupNotes.length} file{groupNotes.length!==1?"s":""}</span>
                    </div>
                  </div>
                  <div style={{padding:"4px 0 8px"}}>
                    {groupNotes.map((note,i)=>(
                      <div key={note._id}>
                        <FileRow note={note} onDownload={handleDownload} onQuiz={n=>setQuizNote(n)} onDelete={id=>openDelete(id)}/>
                        {i<groupNotes.length-1&&<div style={{height:1,background:"#f0f2f8",margin:"0 16px"}}/>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right panel */}
            <div style={{width:220,flexShrink:0,display:"flex",flexDirection:"column",gap:12}}>
              {/* Stats */}
              <div style={{background:"#fff",border:"1px solid #e8eaf0",borderRadius:14,padding:"18px 16px",animation:"fadeUp 0.4s ease 0.1s both"}}>
                <div style={{fontSize:12,fontWeight:800,color:"#1a1c2e",letterSpacing:"0.06em",marginBottom:14}}>STORAGE USED</div>
                <div style={{height:7,background:"#f0f2f8",borderRadius:4,marginBottom:8,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(100,(totalSize/(5*1024*1024))*100)}%`,background:"linear-gradient(90deg,#4f6ef7,#818cf8)",borderRadius:4}}/>
                </div>
                <div style={{fontSize:12.5,fontWeight:700,color:"#1a1c2e"}}>{fmtBytes(totalSize)}<span style={{color:"#8a91a8",fontWeight:500}}> used</span></div>
                <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8,borderTop:"1px solid #f0f2f8",paddingTop:12}}>
                  {[["📄","Total files",notes.length],["🗂️","Categories",Object.keys(groups).length]].map(([ic,lb,val])=>(
                    <div key={lb} style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:"#4a5068"}}>{ic} {lb}</span>
                      <span style={{fontWeight:700,color:"#1a1c2e"}}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Back */}
              <button onClick={()=>navigate("/my-notes")} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"#fff",color:"#4a5068",border:"1px solid #dde0ea",borderRadius:10,padding:"10px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#4f6ef7";e.currentTarget.style.color="#4f6ef7";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#dde0ea";e.currentTarget.style.color="#4a5068";}}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
                Back to My Notes
              </button>
              <button onClick={fetchNotes} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"#fff",color:"#4a5068",border:"1px solid #dde0ea",borderRadius:10,padding:"10px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#4f6ef7"} onMouseLeave={e=>e.currentTarget.style.borderColor="#dde0ea"}>
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteId&&<div onClick={e=>{if(e.target===e.currentTarget)closeDelete();}} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,opacity:deleteVis?1:0,transition:"opacity 0.2s ease",padding:"20px"}}>
        <div style={{background:"#fff",borderRadius:16,width:400,boxShadow:"0 24px 70px rgba(0,0,0,0.18)",overflow:"hidden"}}>
          <div style={{padding:"28px 28px 20px",textAlign:"center"}}>
            <div style={{width:52,height:52,borderRadius:14,background:"#fff1f2",border:"2px solid #fecaca",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 14px"}}>🗑️</div>
            <div style={{fontSize:16,fontWeight:800,color:"#1a1c2e",marginBottom:8}}>Delete Note & File?</div>
            <div style={{fontSize:13,color:"#64748b",lineHeight:1.6}}>This will permanently delete the note and its attached file. This <strong>cannot be undone</strong>.</div>
          </div>
          <div style={{padding:"0 28px 24px",display:"flex",gap:10}}>
            <button onClick={closeDelete} style={{flex:1,background:"#fff",color:"#4a5068",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"11px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={handleDelete} style={{flex:1,background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,fontWeight:700,cursor:"pointer"}}>🗑 Delete</button>
          </div>
        </div>
      </div>}

      {quizNote&&<QuizModal note={quizNote} onClose={()=>setQuizNote(null)}/>}
    </div>
  );
}
