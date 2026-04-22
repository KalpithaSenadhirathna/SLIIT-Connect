// src/components/Topbar.jsx
// ── Shared topbar used by all pages ──────────────────────────────────────────
// Shows the logged-in user's name and email from AuthContext automatically.
// Usage:  <Topbar />   ← no props needed, reads from AuthContext itself

import { useAuth } from "../context/AuthContext";
import userAvatar from "../assets/user.png";

export default function Topbar() {
  const { user } = useAuth();

  return (
    <div style={{
      background: "#fff",
      borderBottom: "1px solid #e8eaf0",
      padding: "0 28px",
      height: 60,
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }} />

      {/* Notification + Chat icons */}
      {[
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      ].map((icon, i) => (
        <div key={i} style={{ width:36, height:36, borderRadius:8, background:"#f7f8fc", border:"1px solid #e8eaf0", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#4a5068", position:"relative", transition:"background 0.12s" }}
          onMouseEnter={e=>e.currentTarget.style.background="#e8eaf0"}
          onMouseLeave={e=>e.currentTarget.style.background="#f7f8fc"}>
          <span style={{ width:18, height:18, display:"flex" }}>{icon}</span>
          {i===0 && <span style={{ position:"absolute", top:6, right:6, width:7, height:7, background:"#ef4444", borderRadius:"50%", border:"1.5px solid #fff" }}/>}
        </div>
      ))}

      {/* ── User dropdown — shows name + email from AuthContext ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "5px 10px 5px 6px", borderRadius: 8,
        border: "1px solid #e8eaf0", background: "#f7f8fc", cursor: "pointer",
      }}>
        <img src={userAvatar} alt="User" style={{ width:26, height:26, borderRadius:6, objectFit:"cover", flexShrink:0 }} />
        <div style={{ display:"flex", flexDirection:"column" }}>
          {/* Shows user's name from backend, falls back to "SLIIT Connect" */}
          <span style={{ fontSize:13, fontWeight:600, color:"#1a1c2e", lineHeight:1.3 }}>
            {user?.name || "SLIIT Connect"}
          </span>
          {/* Shows email below the name if available */}
          {user?.email && (
            <span style={{ fontSize:11, color:"#8a91a8", lineHeight:1.2 }}>
              {user.email}
            </span>
          )}
        </div>
        <span style={{ color:"#8a91a8", fontSize:10 }}>▾</span>
      </div>
    </div>
  );
}