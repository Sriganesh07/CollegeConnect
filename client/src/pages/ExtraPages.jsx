// src/pages/ExtraPages.jsx
// All stub pages that make the sidebar links work
// At the top of ExtraPages.jsx — add this line:
export { SettingsPage } from './SettingsPage';

// Then remove the old `export function SettingsPage() { ... }` block
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCode, FiStar, FiGitBranch, FiExternalLink, FiTrendingUp,
  FiBookOpen, FiDownload, FiCalendar, FiMapPin, FiCpu,
  FiAward, FiBookmark, FiTrash2, FiSettings, FiUser,
  FiBell, FiShield, FiMoon, FiSun, FiGlobe, FiSave,
} from 'react-icons/fi';
import { postAPI, eventAPI } from '../api';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const COLORS  = ['#2563eb','#0891b2','#7c3aed','#e11d48','#059669','#d97706'];
const aC      = (n) => COLORS[(n?.charCodeAt(0)||0) % COLORS.length];

// ─── Shared page wrapper ──────────────────────────────────────────────────
function PageWrap({ icon, title, subtitle, children }) {
  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 20px 60px', animation:'fadeUp 0.35s ease both' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:800, color:'var(--text1)', letterSpacing:'-0.5px' }}>
          {icon} {title}
        </h1>
        {subtitle && <p style={{ fontSize:13.5, color:'var(--text2)', marginTop:5 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── PROJECTS PAGE ────────────────────────────────────────────────────────
export function ProjectsPage() {
  const PROJECTS = [
    { id:1, name:'ML Attendance System', author:'vikram_r', dept:'CSE', stars:24, forks:6, lang:'Python', desc:'Face recognition attendance system using OpenCV and Flask.', color:'#2563eb' },
    { id:2, name:'CollegeConnect',       author:'Sri',      dept:'CSE', stars:18, forks:3, lang:'JavaScript', desc:'Social platform for college students. React + Node.js + Firebase.', color:'#059669' },
    { id:3, name:'DSA Solutions',        author:'arjun_m',  dept:'CSE', stars:41, forks:12, lang:'C++', desc:'Curated solutions for LeetCode, Codeforces and HackerRank.', color:'#e11d48' },
    { id:4, name:'Campus Navigator',     author:'priya_k',  dept:'IT',  stars:9,  forks:2, lang:'Flutter', desc:'Indoor navigation app for college campuses using AR.', color:'#7c3aed' },
    { id:5, name:'Smart Canteen',        author:'davin_b',  dept:'CSE', stars:15, forks:4, lang:'TypeScript', desc:'Pre-order food from canteen, skip the queue.', color:'#d97706' },
    { id:6, name:'EV Charge Tracker',    author:'ravi_s',   dept:'ECE', stars:7,  forks:1, lang:'Python', desc:'Track EV charging stations on campus in real-time.', color:'#0891b2' },
  ];

  const [filter, setFilter] = useState('All');
  const langs = ['All', ...new Set(PROJECTS.map(p => p.lang))];
  const filtered = filter === 'All' ? PROJECTS : PROJECTS.filter(p => p.lang === filter);

  return (
    <PageWrap icon="💻" title="Projects" subtitle="Explore student projects from across campus">
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {langs.map(l => (
          <button key={l} onClick={() => setFilter(l)} style={{
            padding:'5px 14px', borderRadius:20, border:'1.5px solid var(--border)',
            background: filter===l ? 'var(--accent)' : 'var(--surface)',
            color: filter===l ? '#fff' : 'var(--text2)',
            fontSize:12.5, fontWeight:600, cursor:'pointer',
          }}>{l}</button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background:'var(--surface)', border:`1.5px solid var(--border)`, borderLeft:`4px solid ${p.color}`, borderRadius:14, padding:16, boxShadow:'var(--shadow-sm)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <FiCode size={14} style={{ color:p.color }}/>
              <span style={{ fontWeight:700, fontSize:14, color:'var(--text1)' }}>{p.name}</span>
              <span style={{ marginLeft:'auto', background:`${p.color}18`, color:p.color, fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:8 }}>{p.lang}</span>
            </div>
            <p style={{ fontSize:12.5, color:'var(--text2)', lineHeight:1.5, marginBottom:10 }}>{p.desc}</p>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Link to={`/profile/${p.author}`} style={{ fontSize:12, color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>@{p.author}</Link>
              <span style={{ fontSize:11.5, color:'var(--text3)' }}>{p.dept}</span>
              <span style={{ marginLeft:'auto', display:'flex', gap:10, color:'var(--text3)', fontSize:12 }}>
                <span><FiStar size={11}/> {p.stars}</span>
                <span><FiGitBranch size={11}/> {p.forks}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </PageWrap>
  );
}

// ─── TRENDING PAGE ────────────────────────────────────────────────────────
export function TrendingPage() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postAPI.getFeed()
      .then(data => {
        if (Array.isArray(data)) {
          // Sort by likes for trending
          const sorted = [...data].sort((a,b) => (b.likes_count||0) - (a.likes_count||0));
          setPosts(sorted.slice(0,10));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const TAGS = ['#ReactJS','#MachineLearning','#OpenSource','#WebDev','#CPP','#IEEE','#GDSC','#Python','#Flutter','#Blockchain','#AI','#IoT'];

  return (
    <PageWrap icon="🔥" title="Trending" subtitle="What's hot on campus right now">
      <div style={{ display:'flex', gap:18, alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text1)', marginBottom:12 }}>Top Posts This Week</h3>
          {loading && [1,2,3].map(i => <div key={i} style={{ background:'var(--surface)', borderRadius:12, height:80, marginBottom:10, animation:'shimmer 1.4s infinite' }}/>)}
          {posts.map((p,i) => (
            <div key={p.id} style={{ display:'flex', gap:12, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:10, boxShadow:'var(--shadow-sm)' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--text3)', minWidth:28, textAlign:'center', alignSelf:'center' }}>#{i+1}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:aC(p.username), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff' }}>
                    {p.username?.slice(0,2).toUpperCase()}
                  </div>
                  <Link to={`/profile/${p.username}`} style={{ fontSize:13, fontWeight:700, color:'var(--accent)', textDecoration:'none' }}>@{p.username}</Link>
                  <span style={{ fontSize:11, color:'var(--text3)' }}>{p.time}</span>
                </div>
                <p style={{ fontSize:13.5, color:'var(--text1)', margin:0, lineHeight:1.5 }}>{p.content?.slice(0,120)}{p.content?.length > 120 ? '…' : ''}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, fontSize:12, color:'var(--text3)', flexShrink:0 }}>
                <span>❤️ {p.likes_count||0}</span>
                <span>💬 {p.comments_count||0}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ width:220, flexShrink:0 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text1)', marginBottom:12 }}>Trending Tags</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {TAGS.map((t,i) => (
              <span key={t} style={{ fontSize:12, fontWeight:600, color:'var(--accent)', background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.2)', padding:'4px 11px', borderRadius:20, cursor:'pointer' }}>
                {t} <span style={{ fontSize:10, color:'var(--text3)' }}>{Math.floor(Math.random()*200)+20}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── RESOURCES PAGE ───────────────────────────────────────────────────────
export function ResourcesPage() {
  const RESOURCES = [
    { cat:'Study Materials', icon:'📚', items:[
      { title:'Data Structures & Algorithms',   link:'#', type:'PDF',    size:'4.2 MB' },
      { title:'Computer Networks Notes',        link:'#', type:'PDF',    size:'2.8 MB' },
      { title:'DBMS Complete Guide',            link:'#', type:'PDF',    size:'3.1 MB' },
      { title:'Operating Systems Handout',      link:'#', type:'PDF',    size:'1.9 MB' },
    ]},
    { cat:'Video Tutorials', icon:'🎬', items:[
      { title:'React JS Full Course 2024',      link:'https://youtube.com', type:'Video', size:'8h 20m' },
      { title:'Machine Learning Crash Course',  link:'https://youtube.com', type:'Video', size:'4h 15m' },
      { title:'System Design for Beginners',    link:'https://youtube.com', type:'Video', size:'2h 45m' },
    ]},
    { cat:'Coding Platforms', icon:'💻', items:[
      { title:'LeetCode — Daily Challenges',    link:'https://leetcode.com',     type:'Link', size:'' },
      { title:'Codeforces — Contests',          link:'https://codeforces.com',   type:'Link', size:'' },
      { title:'HackerRank — Practice',          link:'https://hackerrank.com',   type:'Link', size:'' },
      { title:'GeeksForGeeks — Articles',       link:'https://geeksforgeeks.org',type:'Link', size:'' },
    ]},
    { cat:'Tools & Docs', icon:'🛠️', items:[
      { title:'React Documentation',            link:'https://react.dev',        type:'Link', size:'' },
      { title:'Node.js Documentation',          link:'https://nodejs.org',       type:'Link', size:'' },
      { title:'Firebase Documentation',         link:'https://firebase.google.com', type:'Link', size:'' },
    ]},
  ];

  return (
    <PageWrap icon="📖" title="Resources" subtitle="Study materials, tutorials and tools curated for students">
      {RESOURCES.map(section => (
        <div key={section.cat} style={{ marginBottom:28 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text1)', marginBottom:12, display:'flex', alignItems:'center', gap:7 }}>
            {section.icon} {section.cat}
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {section.items.map(item => (
              <a key={item.title} href={item.link} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:10, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 14px', textDecoration:'none', boxShadow:'var(--shadow-sm)', transition:'all 0.15s' }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'rgba(37,99,235,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {item.type==='PDF' ? <FiBookOpen size={16} style={{ color:'#e11d48' }}/> : item.type==='Video' ? <span style={{ fontSize:16 }}>▶️</span> : <FiExternalLink size={16} style={{ color:'#2563eb' }}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.title}</div>
                  {item.size && <div style={{ fontSize:11, color:'var(--text3)' }}>{item.size}</div>}
                </div>
                {item.type==='PDF' && <FiDownload size={14} style={{ color:'var(--text3)', flexShrink:0 }}/>}
              </a>
            ))}
          </div>
        </div>
      ))}
    </PageWrap>
  );
}

// ─── EVENTS PAGE ──────────────────────────────────────────────────────────
export function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpd, setRsvpd] = useState({});

  useEffect(() => {
    eventAPI.getAll()
      .then(d => { if (Array.isArray(d)) setEvents(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const FALLBACK = [
    { id:'f1', name:'CodeFest 2026', date:'Apr 20, 2026', club:'Coding Club', icon:'💻', color:'#2563eb', desc:'24-hour hackathon open to all students. Solo and team entries welcome.' },
    { id:'f2', name:'UI/UX Designathon', date:'May 5, 2026', club:'Design Club', icon:'🎨', color:'#7c3aed', desc:'Design a mobile app interface from scratch in 6 hours.' },
    { id:'f3', name:'IEEE Tech Talk', date:'May 12, 2026', club:'IEEE Student Branch', icon:'⚡', color:'#0891b2', desc:'Industry experts from Texas Instruments and Qualcomm.' },
    { id:'f4', name:'Research Symposium', date:'Jun 2, 2026', club:'ACM Chapter', icon:'🔬', color:'#059669', desc:'Present your research papers to faculty and industry judges.' },
    { id:'f5', name:'Robotics Expo', date:'Jun 15, 2026', club:'Robotics Club', icon:'🤖', color:'#e11d48', desc:'Live robot demonstrations and competitions.' },
  ];

  const display = events.length > 0 ? events : FALLBACK;

  return (
    <PageWrap icon="📅" title="Events" subtitle="Upcoming campus events, workshops and competitions">
      {loading && <p style={{ color:'var(--text3)', fontSize:13 }}>Loading events…</p>}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {display.map(ev => (
          <div key={ev.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderLeft:`4px solid ${ev.color||'#2563eb'}`, borderRadius:14, padding:18, boxShadow:'var(--shadow-sm)', display:'flex', gap:16 }}>
            <div style={{ fontSize:32, flexShrink:0, alignSelf:'center' }}>{ev.icon||'📅'}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text1)', marginBottom:4 }}>{ev.name}</div>
              {ev.desc && <p style={{ fontSize:13, color:'var(--text2)', margin:'0 0 10px', lineHeight:1.5 }}>{ev.desc}</p>}
              <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--text3)' }}>
                <span><FiCalendar size={11}/> {ev.date}</span>
                {ev.club && <span style={{ color:ev.color||'#2563eb', fontWeight:600 }}>🏛️ {ev.club}</span>}
              </div>
            </div>
            <button
              style={{ alignSelf:'center', padding:'8px 18px', borderRadius:9, border:`1.5px solid ${ev.color||'#2563eb'}`, background: rsvpd[ev.id] ? (ev.color||'#2563eb') : 'transparent', color: rsvpd[ev.id] ? '#fff' : (ev.color||'#2563eb'), fontWeight:700, fontSize:12.5, cursor:'pointer', flexShrink:0, transition:'all 0.15s' }}
              onClick={() => setRsvpd(p => ({ ...p, [ev.id]: !p[ev.id] }))}
            >
              {rsvpd[ev.id] ? '✓ RSVP\'d' : 'RSVP'}
            </button>
          </div>
        ))}
      </div>
    </PageWrap>
  );
}

// ─── HACKATHONS PAGE ──────────────────────────────────────────────────────
export function HackathonsPage() {
  const HACKS = [
    { name:'Smart India Hackathon 2026', org:'Govt. of India', prize:'₹1,00,000', date:'Aug 2026', mode:'Offline', desc:'National level hackathon to solve real-world problems. Open to all engineering students.', tags:['National','Government','₹1L Prize'], color:'#e11d48' },
    { name:'Google Solution Challenge', org:'Google',          prize:'Global Recognition', date:'Mar 2026', mode:'Online', desc:'Build a solution using Google technologies to address one of the UN Sustainable Development Goals.', tags:['International','Google','SDGs'], color:'#2563eb' },
    { name:'HackMIT 2026',              org:'MIT',             prize:'$10,000',   date:'Sep 2026', mode:'Online', desc:'One of the most prestigious student hackathons. Top teams get mentored by MIT alumni.', tags:['International','$10K Prize'], color:'#059669' },
    { name:'CodeFest Campus 2026',       org:'CollegeConnect',  prize:'₹20,000',   date:'Apr 2026', mode:'Offline', desc:'Our very own 24-hour campus hackathon. All departments welcome.', tags:['Campus','₹20K Prize','24hr'], color:'#7c3aed' },
    { name:'Flipkart Grid 6.0',          org:'Flipkart',        prize:'Pre-Placement Offer', date:'Jun 2026', mode:'Online', desc:'Engineering challenge by Flipkart. Top performers get PPO.', tags:['Industry','PPO','E-commerce'], color:'#d97706' },
  ];

  return (
    <PageWrap icon="⚡" title="Hackathons" subtitle="Competitions and challenges to build, learn and win">
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {HACKS.map(h => (
          <div key={h.name} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderLeft:`4px solid ${h.color}`, borderRadius:14, padding:18, boxShadow:'var(--shadow-sm)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <span style={{ fontSize:16, fontWeight:800, color:'var(--text1)' }}>{h.name}</span>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:h.mode==='Online'?'rgba(5,150,105,0.1)':'rgba(37,99,235,0.1)', color:h.mode==='Online'?'#059669':'#2563eb' }}>{h.mode}</span>
                </div>
                <p style={{ fontSize:13, color:'var(--text2)', margin:'0 0 10px', lineHeight:1.5 }}>{h.desc}</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                  {h.tags.map(t => <span key={t} style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, background:`${h.color}18`, color:h.color }}>{t}</span>)}
                </div>
                <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text3)' }}>
                  <span>🏆 {h.prize}</span>
                  <span><FiCalendar size={11}/> {h.date}</span>
                  <span>🏛️ {h.org}</span>
                </div>
              </div>
              <button style={{ flexShrink:0, padding:'9px 18px', borderRadius:9, background:h.color, border:'none', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', marginTop:4 }}>
                Register
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageWrap>
  );
}

// ─── SAVED PAGE ───────────────────────────────────────────────────────────
export function SavedPage() {
  const user   = getUser();
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postAPI.getFeed()
      .then(data => {
        if (Array.isArray(data)) setPosts(data.filter(p => p.isSaved));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unsave = async (postId) => {
    await postAPI.unsave(postId).catch(() => {});
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <PageWrap icon="🔖" title="Saved Posts" subtitle="Posts you've bookmarked">
      {loading && <p style={{ color:'var(--text3)', fontSize:13 }}>Loading saved posts…</p>}
      {!loading && posts.length===0 && (
        <div style={{ textAlign:'center', padding:60, color:'var(--text3)', fontSize:14 }}>
          <div style={{ fontSize:44, marginBottom:12 }}>🔖</div>
          <p>No saved posts yet. Tap the bookmark on any post to save it here.</p>
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {posts.map(p => (
          <div key={p.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16, boxShadow:'var(--shadow-sm)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:aC(p.username), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>
                {p.username?.slice(0,2).toUpperCase()}
              </div>
              <div>
                <Link to={`/profile/${p.username}`} style={{ fontSize:13.5, fontWeight:700, color:'var(--text1)', textDecoration:'none' }}>{p.username}</Link>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{p.time}</div>
              </div>
              <button style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--rose)', cursor:'pointer', padding:6, borderRadius:7 }} onClick={() => unsave(p.id)} title="Remove">
                <FiTrash2 size={14}/>
              </button>
            </div>
            <p style={{ fontSize:14, color:'var(--text1)', lineHeight:1.6, margin:0 }}>{p.content}</p>
            {p.media && <img src={p.media} alt="" style={{ width:'100%', borderRadius:10, marginTop:10, maxHeight:240, objectFit:'cover' }}/>}
          </div>
        ))}
      </div>
    </PageWrap>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────
/*export function SettingsPage() {
  const user    = getUser();
  const [saved, setSaved] = useState(false);
  const [form,  setForm]  = useState({
    displayName:    user?.username || '',
    email:          '',
    phone:          user?.phone_no || '',
    notifications:  true,
    emailDigest:    false,
    darkMode:       false,
    language:       'English',
    privacy:        'public',
  });

  const handleSave = () => {
    // In production, call PUT /api/users/:username with these fields
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Row = ({ label, children }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:14, fontWeight:600, color:'var(--text1)' }}>{label}</span>
      {children}
    </div>
  );

  const Toggle = ({ checked, onChange }) => (
    <div onClick={onChange} style={{ width:42, height:22, borderRadius:11, background: checked ? 'var(--accent)' : 'var(--bg3)', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left: checked ? 22 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }}/>
    </div>
  );

  const SECTIONS = [
    {
      title:'👤 Account', icon:FiUser,
      rows: [
        { label:'Username',   el: <span style={{ color:'var(--text3)', fontSize:13 }}>@{user?.username}</span> },
        { label:'Department', el: <span style={{ color:'var(--text3)', fontSize:13 }}>{user?.department||'—'}</span> },
        { label:'College',    el: <span style={{ color:'var(--text3)', fontSize:13 }}>{user?.collegeName||'—'}</span> },
        { label:'Phone',      el: <input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} style={{ background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:8, padding:'6px 11px', fontSize:13, color:'var(--text1)', outline:'none', width:180 }}/> },
      ],
    },
    {
      title:'🔔 Notifications', icon:FiBell,
      rows: [
        { label:'Push Notifications', el: <Toggle checked={form.notifications} onChange={() => setForm(f => ({...f, notifications:!f.notifications}))}/> },
        { label:'Email Digest',       el: <Toggle checked={form.emailDigest}    onChange={() => setForm(f => ({...f, emailDigest:!f.emailDigest}))}/> },
      ],
    },
    {
      title:'🔒 Privacy', icon:FiShield,
      rows: [
        { label:'Profile Visibility', el: (
          <select value={form.privacy} onChange={e => setForm({...form,privacy:e.target.value})} style={{ background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:8, padding:'6px 11px', fontSize:13, color:'var(--text1)', outline:'none' }}>
            <option value="public">Public</option>
            <option value="followers">Followers only</option>
            <option value="private">Private</option>
          </select>
        )},
      ],
    },
    {
      title:'🌐 Preferences', icon:FiGlobe,
      rows: [
        { label:'Language', el: (
          <select value={form.language} onChange={e => setForm({...form,language:e.target.value})} style={{ background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:8, padding:'6px 11px', fontSize:13, color:'var(--text1)', outline:'none' }}>
            <option>English</option>
            <option>Tamil</option>
            <option>Hindi</option>
          </select>
        )},
      ],
    },
  ];

  return (
    <PageWrap icon="⚙️" title="Settings" subtitle="Manage your account preferences">
      <div style={{ maxWidth:600 }}>
        {SECTIONS.map(sec => (
          <div key={sec.title} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'0 18px', marginBottom:16, boxShadow:'var(--shadow-sm)' }}>
            <div style={{ padding:'14px 0 10px', fontSize:14, fontWeight:800, color:'var(--text1)', borderBottom:'1px solid var(--border)' }}>{sec.title}</div>
            {sec.rows.map(r => <Row key={r.label} label={r.label}>{r.el}</Row>)}
          </div>
        ))}

        <button onClick={handleSave} style={{ display:'flex', alignItems:'center', gap:7, padding:'11px 24px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px var(--glow)', transition:'opacity 0.15s' }}>
          <FiSave size={15}/> {saved ? 'Saved!' : 'Save Changes'}
        </button>

        <div style={{ marginTop:20, padding:16, background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--rose)', marginBottom:6 }}>⚠️ Danger Zone</div>
          <p style={{ fontSize:13, color:'#be123c', marginBottom:12 }}>These actions are permanent and cannot be undone.</p>
          <button style={{ padding:'8px 16px', borderRadius:9, border:'1.5px solid var(--rose)', background:'none', color:'var(--rose)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            Delete Account
          </button>
        </div>
      </div>
    </PageWrap>
  );
} */
