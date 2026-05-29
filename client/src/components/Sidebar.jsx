import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiMessageSquare, FiUser, FiUsers, FiFolder,
  FiTrendingUp, FiCalendar, FiCode, FiBookmark, FiSettings,
  FiAward, FiCpu, FiShield, FiStar,
} from 'react-icons/fi';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const COLORS  = ['#2563eb','#0891b2','#7c3aed','#e11d48','#059669','#d97706'];
const aC      = (n) => COLORS[(n?.charCodeAt(0)||0) % COLORS.length];

const NAV_BASE = [
  {
    section: 'MAIN',
    items: [
      { to:'/home',     icon:FiHome,         label:'Feed',           color:'#2563eb' },
      { to:'/messages', icon:FiMessageSquare, label:'Messages',       color:'#0891b2', badge:true },
      { to:'/profile',  icon:FiUser,          label:'My Profile',     color:'#7c3aed' },
    ],
  },
  {
    section: 'DISCOVER',
    items: [
      { to:'/clubs',    icon:FiUsers,      label:'Clubs & Societies', color:'#059669' },
      { to:'/projects', icon:FiCode,       label:'Projects',          color:'#e11d48' },
      { to:'/trending', icon:FiTrendingUp, label:'Trending',          color:'#f97316' },
      { to:'/resources',icon:FiFolder,     label:'Resources',         color:'#d97706' },
    ],
  },
  {
    section: 'CAMPUS',
    items: [
      { to:'/events',      icon:FiCalendar, label:'Events',      color:'#7c3aed' },
      { to:'/hackathons',  icon:FiCpu,      label:'Hackathons',  color:'#db2777' },
      { to:'/leaderboard', icon:FiAward,    label:'Leaderboard', color:'#d97706' },
    ],
  },
  {
    section: 'YOU',
    items: [
      { to:'/saved',    icon:FiBookmark, label:'Saved',    color:'#64748b' },
      { to:'/settings', icon:FiSettings, label:'Settings', color:'#64748b' },
    ],
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const loc  = useLocation();
  const user = getUser();

  const nav = user?.role === 'admin'
    ? [...NAV_BASE, { section:'ADMIN', items:[{ to:'/admin', icon:FiShield, label:'Admin Panel', color:'#d97706' }] }]
    : NAV_BASE;

  // Dept abbreviation for compact display
  const deptShort = (dept) => {
    if (!dept) return '';
    const map = {
      'Computer Science & Engineering': 'CSE',
      'Electronics & Communication': 'ECE',
      'Electrical Engineering': 'EEE',
      'Mechanical Engineering': 'MECH',
      'Civil Engineering': 'CIVIL',
      'Information Technology': 'IT',
      'Biotechnology': 'BT',
      'Chemical Engineering': 'CHEM',
      'Aerospace Engineering': 'AERO',
    };
    return map[dept] || dept.split(' ').map(w => w[0]).join('').slice(0,4);
  };

  return (
    <aside
      style={{ ...S.sidebar, width: open ? 'var(--sidebar-open)' : 'var(--sidebar-w)' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div style={S.inner}>
        {nav.map(({ section, items }) => (
          <div key={section} style={S.section}>
            {open && <span style={S.sectionLabel}>{section}</span>}
            {items.map(({ to, icon:Icon, label, color, badge }) => {
              const active = loc.pathname === to || (to !== '/home' && loc.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  title={!open ? label : undefined}
                  style={{ ...S.link, ...(active ? { background:'var(--bg2)' } : {}) }}
                >
                  {active && <span style={{ ...S.pip, background: color }}/>}
                  <span style={{ ...S.iconWrap, background: active ? `${color}18` : 'transparent', color: active ? color : 'var(--text3)' }}>
                    <Icon size={18}/>
                    {/* Unread dot on messages icon when collapsed */}
                    {badge && !open && (
                      <span style={S.miniDot}/>
                    )}
                  </span>
                  <span style={{ ...S.label, opacity: open ? 1 : 0, color: active ? 'var(--text1)' : 'var(--text2)' }}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom user card — shows data collected at registration */}
      {open && user && (
        <div style={S.userCard}>
          <div style={{ ...S.userAv, background: aC(user.username) }}>
            {user.username?.slice(0,2).toUpperCase() || 'ME'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={S.userName}>{user.username}</div>
            {/* Department from registration */}
            {user.department && (
              <div style={S.userTag}>
                {deptShort(user.department)}
              </div>
            )}
            {/* College from registration */}
            {user.collegeName && (
              <div style={S.userCollege} title={user.collegeName}>
                {user.collegeName.length > 22
                  ? user.collegeName.slice(0,20) + '…'
                  : user.collegeName}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed: just avatar */}
      {!open && user && (
        <div style={{ padding:'12px 0 14px', display:'flex', justifyContent:'center', borderTop:'1px solid var(--border)' }}>
          <div style={{ ...S.userAv, background: aC(user.username), width:34, height:34, borderRadius:9 }}>
            {user.username?.slice(0,2).toUpperCase() || 'ME'}
          </div>
        </div>
      )}
    </aside>
  );
}

const S = {
  sidebar: {
    display:'flex', flexDirection:'column',
    height:'calc(100vh - var(--topbar-h))',
    background:'var(--surface)',
    borderRight:'1px solid var(--border)',
    boxShadow:'var(--shadow-sm)',
    transition:'width 0.26s cubic-bezier(0.4,0,0.2,1)',
    overflow:'hidden', position:'sticky', top:'var(--topbar-h)',
    flexShrink:0, zIndex:100,
  },
  inner: { flex:1, overflowY:'auto', overflowX:'hidden', padding:'14px 0 8px', display:'flex', flexDirection:'column', gap:2, scrollbarWidth:'none' },
  section: { display:'flex', flexDirection:'column', gap:1, padding:'0 8px', marginBottom:6 },
  sectionLabel: { fontSize:9, fontWeight:700, letterSpacing:'1.2px', color:'var(--text3)', padding:'4px 10px 4px', textTransform:'uppercase', whiteSpace:'nowrap' },
  link: { position:'relative', display:'flex', alignItems:'center', gap:10, padding:'7px 8px', borderRadius:10, textDecoration:'none', transition:'background 0.15s', overflow:'hidden', cursor:'pointer' },
  pip:  { position:'absolute', left:0, top:'18%', width:3, height:'64%', borderRadius:'0 3px 3px 0' },
  iconWrap: { width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s', position:'relative' },
  miniDot: { position:'absolute', top:3, right:3, width:6, height:6, borderRadius:'50%', background:'var(--accent)', border:'1.5px solid var(--surface)' },
  label: { fontSize:13, fontWeight:600, whiteSpace:'nowrap', transition:'opacity 0.15s' },
  userCard: { display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', borderTop:'1px solid var(--border)', flexShrink:0 },
  userAv:   { width:32, height:32, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#fff' },
  userName: { fontSize:12.5, fontWeight:700, color:'var(--text1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  userTag:  { fontSize:10, fontWeight:700, color:'var(--accent)', marginTop:1, background:'rgba(37,99,235,0.08)', padding:'1px 6px', borderRadius:4, display:'inline-block' },
  userCollege: { fontSize:10, color:'var(--text3)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
};