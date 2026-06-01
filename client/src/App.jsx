import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import AuthPage    from './pages/AuthPage';
import HomeFeed    from './pages/HomeFeed';
import Messages    from './pages/Messages';
import ProfilePage from './pages/ProfilePage';
import ClubsPage   from './pages/ClubsPage';
import AdminPanel  from './pages/AdminPanel';
import Topbar      from './components/Topbar';
import Sidebar     from './components/Sidebar';
import {
  ProjectsPage, TrendingPage, ResourcesPage,
  EventsPage, HackathonsPage, SavedPage, SettingsPage,
} from './pages/ExtraPages';
import './App.css';

const getUser  = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const isAdmin  = () => getUser()?.role === 'admin';

const ProtectedRoute = ({ children }) => getUser() ? children : <Navigate to="/" replace />;

const DashboardLayout = () => {
  const u = getUser();
  return (
    <div className="app-shell">
      <Topbar currentUserId={u?.username || 'guest'} />
      <div className="app-body">
        <Sidebar />
        <main className="app-content"><Outlet /></main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={getUser() ? <Navigate to="/home" replace /> : <AuthPage />} />

        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/home"              element={<HomeFeed />} />
          <Route path="/messages"          element={<Messages />} />
          <Route path="/profile"           element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/clubs"             element={<ClubsPage />} />
          <Route path="/projects"          element={<ProjectsPage />} />
          <Route path="/trending"          element={<TrendingPage />} />
          <Route path="/resources"         element={<ResourcesPage />} />
          <Route path="/events"            element={<EventsPage />} />
          <Route path="/hackathons"        element={<HackathonsPage />} />
          <Route path="/saved"             element={<SavedPage />} />
          <Route path="/settings"          element={<SettingsPage />} />
          <Route path="/leaderboard"       element={<LeaderboardPage />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// ── Inline leaderboard (small enough to keep here) ──────────────────────
import { FiAward, FiTrendingUp, FiStar } from 'react-icons/fi';
const COLORS = ['#2563eb','#0891b2','#7c3aed','#e11d48','#059669','#d97706'];
const aC = (n) => COLORS[(n?.charCodeAt(0)||0) % COLORS.length];

function LeaderboardPage() {
  const [data, setData] = useState({ posts: [], likes: [], repos: [] });

useEffect(() => {
  userAPI.getAll().then(users => {
    if (!Array.isArray(users)) return;
    // Sort by posts_count, likes_count, repos_count from user objects
    setData({
      posts:  [...users].sort((a,b) => (b.posts_count||0)  - (a.posts_count||0) ).slice(0,5),
      likes:  [...users].sort((a,b) => (b.likes_count||0)  - (a.likes_count||0) ).slice(0,5),
      repos:  [...users].sort((a,b) => (b.repos_count||0)  - (a.repos_count||0) ).slice(0,5),
    });
  }).catch(() => {});
}, []);
  const medals = ['🥇','🥈','🥉'];

  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'28px 20px 60px' }}>
      <h1 style={{ fontSize:26, fontWeight:800, color:'var(--text1)', marginBottom:6 }}>🏆 Leaderboard</h1>
      <p style={{ fontSize:13.5, color:'var(--text2)', marginBottom:20 }}>Top students on CollegeConnect</p>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['posts','Posts'],['likes','Likes'],['repos','Repos']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'6px 16px', borderRadius:20, border:'1.5px solid var(--border)', background: tab===id?'var(--accent)':'var(--surface)', color:tab===id?'#fff':'var(--text2)', fontSize:13, fontWeight:600, cursor:'pointer' }}>{label}</button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {MOCK[tab].map((row, i) => (
          <div key={row.u} style={{ display:'flex', alignItems:'center', gap:14, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 16px', boxShadow:'var(--shadow-sm)' }}>
            <span style={{ fontSize:22, minWidth:28, textAlign:'center' }}>{medals[i] || `#${i+1}`}</span>
            <div style={{ width:36, height:36, borderRadius:10, background:aC(row.u), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff', flexShrink:0 }}>
              {row.u.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'var(--text1)' }}>@{row.u}</div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>{row.dept}</div>
            </div>
            <div style={{ fontWeight:800, fontSize:18, color: i===0?'#d97706':i===1?'#94a3b8':'#d97706' }}>{row.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}