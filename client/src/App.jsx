/**
 * Main Application Component (Optimized)
 * Integrated Features: Auth, Groups, Clubs, Sessions, Notes
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import Clubs from './pages/Clubs';
import ClubsDetails from './pages/ClubsDetails';
import Sessions from './pages/Sessions';
import Notes from './pages/Notes'; // This will be our landing page
import Chats from './pages/Chats';
import Help from './pages/Help';
import Profile from './pages/Profile';

// ── Notes Pages ──────────────────────────────────────────────────────────────
import MyNotes      from './pages/MyNotes';
import SharedNotes  from './pages/SharedNotes';
import StarredNotes from './pages/StarredNotes';
import Downloads    from './pages/Downloads';
import Quiz         from './pages/Quiz';

// ── Session Sub-Pages ─────────────────────────────────────────────────────────
import SessionDashboard from './components/Sessions/Session_org/SessionDashboard';
import StudentDashboard from './components/Sessions/Session_stu/StudentDashboard';
import AddSession       from './components/Sessions/Session_org/AddSession';
import Preview          from './components/Sessions/Session_org/Preview';
import ViewSession      from './components/Sessions/Session_org/ViewSession';
import UpdateSession    from './components/Sessions/Session_org/UpdateSession';
import ViewSession2     from './components/Sessions/Session_stu/ViewSession2';

/**
 * ProtectedRoute Component
 */
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* ── Public Routes ── */}
                <Route path="/login" element={<Auth />} />
                <Route path="/auth" element={<Navigate to="/login" replace />} />

                {/* ── Authenticated Routes (Wrapped in DashboardLayout) ── */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    {/* Default Redirect */}
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    
                    {/* General Pages */}
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="chats" element={<Chats />} />
                    <Route path="help" element={<Help />} />
                    <Route path="profile" element={<Profile />} />

                    {/* Groups Section */}
                    <Route path="groups">
                        <Route index element={<Groups />} />
                        <Route path=":id" element={<GroupDetails />} />
                    </Route>

                    {/* Clubs Section */}
                    <Route path="clubs">
                        <Route index element={<Clubs />} />
                        <Route path=":id" element={<ClubsDetails />} />
                    </Route>

                    {/* Sessions Section */}
                    <Route path="sessions">
                        <Route index element={<Sessions />} />
                    </Route>
                    {/* Flat Session Routes (as in original branch) */}
                    <Route path="SessionDashboard" element={<SessionDashboard />} />
                    <Route path="StudentDashboard" element={<StudentDashboard />} />
                    <Route path="AddSession" element={<AddSession />} />
                    <Route path="Preview" element={<Preview />} />
                    <Route path="ViewSession/:itemId" element={<ViewSession />} />
                    <Route path="UpdateSession/:id" element={<UpdateSession />} />
                    <Route path="ViewSession2/:itemId" element={<ViewSession2 />} />

                    {/* Notes Section */}
                    <Route path="notes" element={<Notes />} />
                    <Route path="my-notes" element={<MyNotes />} />
                    <Route path="shared-notes" element={<SharedNotes />} />
                    <Route path="starred-notes" element={<StarredNotes />} />
                    <Route path="downloads" element={<Downloads />} />
                    <Route path="quiz" element={<Quiz />} />
                </Route>

                {/* ── Fallback ── */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
