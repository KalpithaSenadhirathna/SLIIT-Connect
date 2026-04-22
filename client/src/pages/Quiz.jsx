import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const FALLBACK_QUIZ = {
  title: "General Knowledge Quiz",
  questions: [
    {
      q: "What does SLIIT stand for?",
      options: ["Sri Lanka Institute of Information Technology", "South Lanka Institute of IT", "Sri Lanka International Institute of Technology", "Standard Lanka IT"],
      answer: 0,
      explanation: "SLIIT stands for Sri Lanka Institute of Information Technology."
    },
    {
      q: "Which department handles Software Engineering at SLIIT?",
      options: ["Business", "Computing", "Engineering", "Humanities"],
      answer: 1,
      explanation: "The Faculty of Computing handles Software Engineering."
    }
  ]
};

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();

  const noteTitle   = location.state?.noteTitle   || FALLBACK_QUIZ.title;
  const noteContent = location.state?.noteContent || "";

  const [loading, setLoading]       = useState(true);
  const [quiz, setQuiz]             = useState(null);
  const [current, setCurrent]       = useState(0);
  const [selected, setSelected]     = useState(null);
  const [answered, setAnswered]     = useState(false);
  const [score, setScore]           = useState(0);
  const [finished, setFinished]     = useState(false);
  const [history, setHistory]       = useState([]); 
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => { setTimeout(() => setHeaderVisible(true), 50); }, []);

  const generateQuiz = async () => {
    setLoading(true);
    // Simulating API call or complex logic
    setTimeout(() => {
      setQuiz(FALLBACK_QUIZ);
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    generateQuiz();
  }, []);

  const handleSelect = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === quiz.questions[current].answer;
    if (correct) setScore(s => s + 1);
    setHistory([...history, { selected: idx, correct }]);
  };

  const handleNext = () => {
    if (current + 1 < quiz.questions.length) {
      setCurrent(current + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const getScoreLabel = (s, t) => {
    const pct = (s / t) * 100;
    if (pct === 100) return { label: "Perfect!", sub: "You're a master of this topic." };
    if (pct >= 80) return { label: "Excellent!", sub: "Great job understanding the core concepts." };
    if (pct >= 50) return { label: "Good Start", sub: "You have a solid foundation, but there's room to grow." };
    return { label: "Keep Learning", sub: "Review your notes and try again to improve your score." };
  };

  const getScoreColor = (s, t) => {
    const pct = (s / t) * 100;
    if (pct >= 80) return "#10b981";
    if (pct >= 50) return "#4f6ef7";
    return "#ef4444";
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#f0f2f8", minHeight:"calc(100vh - 100px)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#dde0ea; border-radius:3px; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pop      { 0%{transform:scale(0.85)} 60%{transform:scale(1.06)} 100%{transform:scale(1)} }
        .opt-btn { transition: all 0.18s ease; cursor:pointer; }
        .opt-btn:hover { transform:translateX(4px); }
        .sub-hover:hover { background:#f0f2f8 !important; color:#1a1c2e !important; }
        
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
          <button className="sub-nav-btn active" onClick={() => navigate('/quiz')}>AI Quiz</button>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ flex:1, overflowY:"auto", padding:"0 0 60px" }}>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"28px 40px 60px" }}>

          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:20, fontSize:13, color:"#8a91a8", opacity:headerVisible?1:0, transition:"opacity 0.5s ease" }}>
            <span style={{ cursor:"pointer" }} onClick={()=>navigate("/my-notes")}
              onMouseEnter={e=>e.currentTarget.style.color="#4f6ef7"} onMouseLeave={e=>e.currentTarget.style.color="#8a91a8"}>My Notes</span>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
            <span style={{ color:"#4f6ef7", fontWeight:600 }}>Quiz</span>
          </div>

          {/* ── LOADING STATE ── */}
          {loading && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 0", gap:20 }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#4f6ef7,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(79,110,247,0.35)" }}>
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" style={{ animation:"spin 1s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#1a1c2e", marginBottom:6 }}>Generating Your Quiz...</div>
                <div style={{ fontSize:13, color:"#8a91a8" }}>AI is reading your note and creating questions</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#4f6ef7", animation:`pulse 1.2s ease ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          )}

          {/* ── QUIZ ── */}
          {!loading && quiz && !finished && (
            <div style={{ maxWidth:680, margin:"0 auto" }}>

              {/* Quiz header */}
              <div style={{ marginBottom:28, animation:"fadeUp 0.5s ease both" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#4f6ef7,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, boxShadow:"0 4px 14px rgba(79,110,247,0.3)" }}>🧠</div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:800, color:"#1a1c2e" }}>{quiz.title}</div>
                    <div style={{ fontSize:12.5, color:"#8a91a8" }}>AI-Generated Quiz • {quiz.questions.length} Questions</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height:6, background:"#e8eaf0", borderRadius:3, overflow:"hidden", marginTop:16 }}>
                  <div style={{ height:"100%", width:`${((current+1)/quiz.questions.length)*100}%`, background:"linear-gradient(90deg,#4f6ef7,#818cf8)", borderRadius:3, transition:"width 0.4s ease" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:12, color:"#8a91a8" }}>
                  <span>Question {current+1} of {quiz.questions.length}</span>
                  <span style={{ color:"#4f6ef7", fontWeight:600 }}>Score: {score}/{current + (answered?1:0)}</span>
                </div>
              </div>

              {/* Question card */}
              <div key={current} style={{ background:"#fff", borderRadius:16, border:"1px solid #e8eaf0", padding:"28px 28px 24px", boxShadow:"0 4px 20px rgba(0,0,0,0.06)", animation:"fadeUp 0.4s ease both" }}>

                {/* Question number badge */}
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#eef1ff", color:"#4f6ef7", fontSize:11.5, fontWeight:700, padding:"4px 10px", borderRadius:20, marginBottom:14 }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Question {current + 1}
                </div>

                <div style={{ fontSize:16, fontWeight:700, color:"#1a1c2e", lineHeight:1.5, marginBottom:22 }}>
                  {quiz.questions[current].q}
                </div>

                {/* Options */}
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {quiz.questions[current].options.map((opt, idx) => {
                    const isCorrect  = idx === quiz.questions[current].answer;
                    const isSelected = idx === selected;
                    let bg = "#f7f8fc", border = "#e8eaf0", color = "#1a1c2e", iconEl = null;

                    if (answered) {
                      if (isCorrect) {
                        bg = "#f0fdf4"; border = "#86efac"; color = "#166534";
                        iconEl = <span style={{ marginLeft:"auto", color:"#10b981", fontSize:16 }}>✓</span>;
                      } else if (isSelected && !isCorrect) {
                        bg = "#fef2f2"; border = "#fca5a5"; color = "#991b1b";
                        iconEl = <span style={{ marginLeft:"auto", color:"#ef4444", fontSize:16 }}>✗</span>;
                      }
                    } else if (isSelected) {
                      bg = "#eef1ff"; border = "#4f6ef7"; color = "#1a1c2e";
                    }

                    return (
                      <div key={idx} className="opt-btn"
                        onClick={() => handleSelect(idx)}
                        style={{
                          display:"flex", alignItems:"center", gap:12,
                          padding:"13px 16px", borderRadius:10,
                          background: bg, border:`1.5px solid ${border}`, color,
                          cursor: answered ? "default" : "pointer",
                          animation: answered && (isCorrect || isSelected) ? "pop 0.3s ease both" : "none",
                        }}
                      >
                        <div style={{
                          width:26, height:26, borderRadius:"50%", flexShrink:0,
                          background: answered && isCorrect ? "#10b981" : answered && isSelected ? "#ef4444" : "#e8eaf0",
                          color: answered && (isCorrect || isSelected) ? "#fff" : "#4a5068",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:12, fontWeight:700, transition:"all 0.2s",
                        }}>
                          {["A","B","C","D"][idx]}
                        </div>
                        <span style={{ fontSize:13.5, fontWeight:500, flex:1 }}>{opt}</span>
                        {iconEl}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {answered && (
                  <div style={{ marginTop:18, padding:"14px 16px", background: selected === quiz.questions[current].answer ? "#f0fdf4" : "#fef9ec", border:`1px solid ${selected === quiz.questions[current].answer ? "#86efac" : "#fde68a"}`, borderRadius:10, animation:"fadeUp 0.3s ease both" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                      <span style={{ fontSize:16, flexShrink:0 }}>{selected === quiz.questions[current].answer ? "💡" : "📖"}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color: selected === quiz.questions[current].answer ? "#166534" : "#92400e", marginBottom:3 }}>
                          {selected === quiz.questions[current].answer ? "Correct!" : "Explanation"}
                        </div>
                        <div style={{ fontSize:12.5, color:"#4a5068", lineHeight:1.6 }}>{quiz.questions[current].explanation}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next button */}
                {answered && (
                  <div style={{ marginTop:20, display:"flex", justifyContent:"flex-end" }}>
                    <button onClick={handleNext}
                      style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#4f6ef7,#6366f1)", color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13.5, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(79,110,247,0.38)", transition:"transform 0.15s ease, box-shadow 0.15s ease", animation:"fadeUp 0.3s ease both" }}
                      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(79,110,247,0.45)"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 14px rgba(79,110,247,0.38)"; }}
                    >
                      {current + 1 >= quiz.questions.length ? "See Results" : "Next Question"}
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Question dots */}
              <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:20 }}>
                {quiz.questions.map((_, i) => {
                  const done = i < history.length;
                  const correct = done && history[i].correct;
                  return (
                    <div key={i} style={{
                      width: i === current ? 24 : 10, height:10, borderRadius:5,
                      background: done ? (correct ? "#10b981" : "#ef4444") : i === current ? "#4f6ef7" : "#e8eaf0",
                      transition:"all 0.3s ease",
                    }}/>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {!loading && finished && quiz && (
            <div style={{ maxWidth:600, margin:"0 auto", animation:"fadeUp 0.5s ease both" }}>
              {(() => {
                const { label, sub } = getScoreLabel(score, quiz.questions.length);
                const scoreColor = getScoreColor(score, quiz.questions.length);
                const pct = Math.round((score / quiz.questions.length) * 100);
                return (
                  <>
                    {/* Score card */}
                    <div style={{ background:"#fff", borderRadius:20, border:"1px solid #e8eaf0", padding:"36px 32px", textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.08)", marginBottom:20 }}>
                      <div style={{ width:90, height:90, borderRadius:"50%", background:`${scoreColor}18`, border:`4px solid ${scoreColor}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:`0 0 0 8px ${scoreColor}10` }}>
                        <span style={{ fontSize:32, fontWeight:900, color:scoreColor }}>{score}</span>
                      </div>
                      <div style={{ fontSize:13, color:"#8a91a8", marginBottom:4 }}>out of {quiz.questions.length} questions</div>
                      <div style={{ fontSize:22, fontWeight:800, color:"#1a1c2e", marginBottom:6 }}>{label}</div>
                      <div style={{ fontSize:13.5, color:"#64748b", marginBottom:20 }}>{sub}</div>

                      {/* Score bar */}
                      <div style={{ height:10, background:"#f0f2f8", borderRadius:5, overflow:"hidden", marginBottom:8 }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${scoreColor},${scoreColor}99)`, borderRadius:5, transition:"width 0.8s ease" }}/>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:scoreColor }}>{pct}% Correct</div>
                    </div>

                    {/* Answer review */}
                    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e8eaf0", padding:"20px 24px", marginBottom:20 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1a1c2e", marginBottom:14, letterSpacing:"0.04em" }}>ANSWER REVIEW</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {quiz.questions.map((q, i) => {
                          const h = history[i];
                          const correct = h?.correct;
                          return (
                            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"11px 14px", borderRadius:10, background: correct ? "#f0fdf4" : "#fef2f2", border:`1px solid ${correct ? "#86efac" : "#fca5a5"}` }}>
                              <div style={{ width:24, height:24, borderRadius:"50%", background: correct ? "#10b981" : "#ef4444", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#fff", fontSize:13, fontWeight:700 }}>
                                {correct ? "✓" : "✗"}
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:12.5, fontWeight:600, color:"#1a1c2e", marginBottom:3 }}>{q.q}</div>
                                <div style={{ fontSize:11.5, color:"#4a5068" }}>
                                  Correct: <span style={{ fontWeight:600, color:"#10b981" }}>{q.options[q.answer]}</span>
                                  {!correct && h && <span style={{ color:"#ef4444" }}> · Your answer: {q.options[h.selected]}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display:"flex", gap:12 }}>
                      <button onClick={generateQuiz}
                        style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:"linear-gradient(135deg,#4f6ef7,#6366f1)", color:"#fff", border:"none", borderRadius:12, padding:"13px", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(79,110,247,0.38)" }}
                        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        Retake Quiz
                      </button>
                      <button onClick={()=>navigate("/my-notes")}
                        style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:"#fff", color:"#4a5068", border:"1px solid #dde0ea", borderRadius:12, padding:"13px", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:700, cursor:"pointer" }}
                        onMouseEnter={e=>{ e.currentTarget.style.borderColor="#4f6ef7"; e.currentTarget.style.color="#4f6ef7"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.borderColor="#dde0ea"; e.currentTarget.style.color="#4a5068"; }}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
                        Back to Notes
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
