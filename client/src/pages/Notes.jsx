import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Search, Filter, Plus, FileText, Star, Share2, Download, MousePointer2, LayoutGrid, List, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const NOTES_DATA = [
  { id: 1, subject: "IT / SE", title: "DSA Week 5 Summary", author: "Asel Kumara", date: "Mar 18, 2026", color: "#4f6ef7" },
  { id: 2, subject: "Mathematics", title: "Calculus III Integration", author: "Nimal Perera", date: "Mar 15, 2026", color: "#10b981" },
  { id: 3, subject: "Database", title: "SQL Advanced Queries", author: "Sahan Madhawa", date: "Mar 14, 2026", color: "#f59e0b" },
  { id: 4, subject: "Networking", title: "OSI Model Breakdown", author: "Roshan J.", date: "Mar 9, 2026", color: "#8b5cf6" },
];

const Notes = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState('grid');

    return (
        <div className="notes-landing-container">
            {/* Header / Stats Section */}
            <div className="notes-header">
                <div className="header-info">
                    <h1 className="title">Notes Dashboard</h1>
                    <p className="subtitle">Explore, share, and manage your academic materials.</p>
                </div>
                
                <div className="quick-stats">
                    <div className="stat-card">
                        <span className="stat-value">42</span>
                        <span className="stat-label">Total Notes</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">12</span>
                        <span className="stat-label">My Uploads</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">8</span>
                        <span className="stat-label">Starred</span>
                    </div>
                </div>
            </div>

            {/* Quick Navigation Pills */}
            <div className="quick-nav">
                <button className="nav-pill active" onClick={() => navigate('/notes')}>
                    <LayoutGrid size={16} /> Discover
                </button>
                <button className="nav-pill" onClick={() => navigate('/my-notes')}>
                    <FileText size={16} /> My Notes
                </button>
                <button className="nav-pill" onClick={() => navigate('/shared-notes')}>
                    <Share2 size={16} /> Shared
                </button>
                <button className="nav-pill" onClick={() => navigate('/starred-notes')}>
                    <Star size={16} /> Starred
                </button>
                <button className="nav-pill" onClick={() => navigate('/quiz')}>
                    <MousePointer2 size={16} /> AI Quizzes
                </button>
            </div>

            {/* Search & Filters */}
            <div className="filter-bar">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search for notes, modules, or authors..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="filter-actions">
                    <button className="filter-btn">
                        <Filter size={18} /> Filter
                    </button>
                    <button className="create-note-btn" onClick={() => navigate('/my-notes')}>
                        <Plus size={18} /> Add Note
                    </button>
                </div>
            </div>

            {/* Notes Grid */}
            <div className={`notes-${viewMode}`}>
                {NOTES_DATA.map((note) => (
                    <motion.div 
                        key={note.id} 
                        className="note-card"
                        whileHover={{ y: -5 }}
                        onClick={() => navigate('/my-notes')} // Link to MyNotes for demo/interaction
                    >
                        <div className="note-accent" style={{ backgroundColor: note.color }} />
                        <div className="note-body">
                            <span className="note-subject" style={{ color: note.color, backgroundColor: `${note.color}15` }}>
                                {note.subject}
                            </span>
                            <h3 className="note-title">{note.title}</h3>
                            <div className="note-meta">
                                <span className="author">by {note.author}</span>
                                <span className="date">{note.date}</span>
                            </div>
                        </div>
                        <div className="note-footer">
                            <div className="footer-stats">
                                <Star size={14} /> 12
                                <Share2 size={14} /> 5
                            </div>
                            <button className="view-btn">View <ChevronRight size={14} /></button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <style jsx>{`
                .notes-landing-container {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .notes-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .title { font-size: 1.75rem; font-weight: 800; color: #1a1c2e; margin-bottom: 4px; }
                .subtitle { font-size: 0.95rem; color: #8a91a8; }

                .quick-stats { display: flex; gap: 16px; }
                .stat-card {
                    background: white;
                    padding: 12px 20px;
                    border-radius: 16px;
                    border: 1px solid #e8eaf0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 100px;
                }
                .stat-value { font-size: 1.5rem; font-weight: 800; color: #4f6ef7; line-height: 1; }
                .stat-label { font-size: 0.75rem; color: #8a91a8; font-weight: 600; text-transform: uppercase; margin-top: 4px; }

                .quick-nav {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .nav-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    background: white;
                    border: 1px solid #e8eaf0;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #4a5068;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .nav-pill:hover { background: #f8fafc; border-color: #4f6ef7; color: #4f6ef7; }
                .nav-pill.active { background: #4f6ef7; border-color: #4f6ef7; color: white; }

                .filter-bar {
                    display: flex;
                    gap: 16px;
                    justify-content: space-between;
                }
                .search-wrapper {
                    flex: 1;
                    max-width: 500px;
                    position: relative;
                    background: white;
                    border: 1px solid #e8eaf0;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    padding: 0 16px;
                }
                .search-wrapper input {
                    border: none;
                    background: transparent;
                    padding: 12px 8px;
                    width: 100%;
                    font-family: inherit;
                    outline: none;
                }
                .search-icon { color: #8a91a8; }

                .filter-actions { display: flex; gap: 12px; }
                .filter-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 20px;
                    background: white;
                    border: 1px solid #e8eaf0;
                    border-radius: 12px;
                    font-weight: 600;
                    color: #4a5068;
                    cursor: pointer;
                }
                .create-note-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 24px;
                    background: #4f6ef7;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(79, 110, 247, 0.2);
                }

                .notes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                }

                .note-card {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e8eaf0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    cursor: pointer;
                }

                .note-accent { height: 4px; }
                .note-body { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 12px; }
                .note-subject {
                    align-self: flex-start;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .note-title { font-size: 1.1rem; font-weight: 700; color: #1a1c2e; line-height: 1.4; }
                .note-meta { display: flex; justify-content: space-between; font-size: 0.8rem; color: #8a91a8; }

                .note-footer {
                    padding: 12px 20px;
                    border-top: 1px solid #f8fafc;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #fafbfc;
                }
                .footer-stats { display: flex; gap: 10px; color: #94a3b8; font-size: 0.8rem; align-items: center; }
                .view-btn {
                    background: none;
                    border: none;
                    color: #4f6ef7;
                    font-weight: 700;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                }

                @media (max-width: 768px) {
                    .notes-header { flex-direction: column; align-items: flex-start; gap: 20px; }
                    .filter-bar { flex-direction: column; }
                    .search-wrapper { max-width: none; }
                }
            `}</style>
        </div>
    );
};

export default Notes;
