import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiCalendar, FiPlusCircle, FiTrash2,
  FiDatabase, FiShield, FiArrowLeft, FiCheck,
  FiCpu, FiAward, FiEdit2, FiX,
} from 'react-icons/fi';
import './AdminPanel.css';

/* ── Shared event store — same key HomeFeed reads ── */
const EVENTS_KEY = 'cc_events';
const loadEvents = () => { try { return JSON.parse(localStorage.getItem(EVENTS_KEY)) || []; } catch { return []; } };
const saveEvents = (evs) => localStorage.setItem(EVENTS_KEY, JSON.stringify(evs));

/* ── Seed "database" users from localStorage logins ── */
const SEED_USERS = [
  { username:'vikram_r',  dept:'Computer Science & Engineering', clubs:['Coding Club'],  role:'student', joined:'2024-03-10' },
  { username:'ananya_s',  dept:'Information Technology',         clubs:['Design Club'],  role:'student', joined:'2024-03-12' },
  { username:'ravi_s',    dept:'Electronics & Communication',    clubs:['IEEE','Robotics Club'], role:'student', joined:'2024-03-15' },
  { username:'arjun_m',   dept:'Computer Science & Engineering', clubs:['GDSC','ACM'],   role:'student', joined:'2024-03-18' },
  { username:'priya_k',   dept:'Information Technology',         clubs:['CSI','Design Club'], role:'student', joined:'2024-03-20' },
];

const ORG_OPTIONS = [
  'Coding Club','Design Club','Robotics Club','Photography Club',
  'IEEE Student Branch','ACM Student Chapter','GDSC','CSI Student Chapter',
  'IEEE','ACM','ASME','SAE India',
];

const EMOJI_OPTIONS = ['💻','🎨','🤖','📸','⚡','🌐','📡','🏅','💡','⚙️','🚗','🔬','🎤','📱'];

const TAB_LIST = [
  { id:'users',    icon:FiUsers,    label:'All Users' },
  { id:'clubs',    icon:FiUsers,    label:'Clubs' },
  { id:'chapters', icon:FiCpu,      label:'Student Chapters' },
  { id:'societies',icon:FiAward,    label:'Prof. Societies' },
  { id:'events',   icon:FiCalendar, label:'Events' },
];

const BLANK_ORG   = { name:'', desc:'', lead:'', members:'', color:'#2563eb', icon:'💻' };
const BLANK_EVENT = { name:'', date:'', club:'', icon:'💻', color:'#2563eb' };

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background:`${color}12`, color }}><Icon size={18}/></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab]         = useState('users');
  const [events, setEvents]   = useState(loadEvents);
  const [newEvent, setNewEvent] = useState(BLANK_EVENT);
  const [addingEvent, setAddingEvent] = useState(false);
  const [toast, setToast]     = useState('');

  /* Club/chapter/society CRUD state */
  const [clubs, setClubs]         = useState([
    { id:'c1', name:'Coding Club',     desc:'Competitive programming & hackathons.', lead:'Vikram R.',  members:'120', color:'#2563eb', icon:'💻' },
    { id:'c2', name:'Design Club',     desc:'UI/UX, graphic & motion design.',       lead:'Priya K.',   members:'85',  color:'#7c3aed', icon:'🎨' },
    { id:'c3', name:'Robotics Club',   desc:'Robots, drones and hardware.',          lead:'Ravi S.',    members:'60',  color:'#059669', icon:'🤖' },
  ]);
  const [chapters, setChapters]   = useState([
    { id:'ch1', name:'IEEE Student Branch', desc:'Workshops, seminars, project funding.', lead:'Amaan K.', members:'200', color:'#0891b2', icon:'⚡' },
    { id:'ch2', name:'ACM Chapter',         desc:'Algorithms, AI, software engineering.', lead:'Davin B.', members:'150', color:'#7c3aed', icon:'🖥️' },
    { id:'ch3', name:'GDSC',               desc:'Google technologies & cloud.',           lead:'Arjun M.', members:'180', color:'#e11d48', icon:'🌐' },
  ]);
  const [societies, setSocieties] = useState([
    { id:'s1', name:'IEEE',     desc:'International professional body.',  lead:'Faculty', members:'95', color:'#0891b2', icon:'🏅' },
    { id:'s2', name:'ACM',      desc:'Global computing society.',         lead:'Faculty', members:'68', color:'#7c3aed', icon:'💡' },
  ]);

  const [addingOrg, setAddingOrg]  = useState(null); // 'clubs'|'chapters'|'societies'|null
  const [newOrg, setNewOrg]        = useState(BLANK_ORG);
  const [editOrg, setEditOrg]      = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const persistEvents = (evs) => { setEvents(evs); saveEvents(evs); };

  const addEvent = () => {
    if (!newEvent.name.trim() || !newEvent.date.trim()) return;
    const ev = { ...newEvent, id: Date.now() };
    persistEvents([...events, ev]);
    setNewEvent(BLANK_EVENT);
    setAddingEvent(false);
    showToast('Event added — will appear on the Home page immediately!');
  };

  const deleteEvent = (id) => {
    persistEvents(events.filter(e => e.id !== id));
    showToast('Event removed.');
  };

  /* generic org CRUD */
  const getSetList = (type) => ({ clubs:[clubs,setClubs], chapters:[chapters,setChapters], societies:[societies,setSocieties] }[type]);
  const addOrg = (type) => {
    if (!newOrg.name.trim()) return;
    const [list, setList] = getSetList(type);
    setList([...list, { ...newOrg, id: `${type[0]}${Date.now()}` }]);
    setNewOrg(BLANK_ORG); setAddingOrg(null);
    showToast(`${newOrg.name} added to ${type}!`);
  };
  const deleteOrg = (type, id) => {
    const [list, setList] = getSetList(type);
    setList(list.filter(o => o.id !== id));
    showToast('Removed.');
  };
  const saveEditOrg = (type) => {
    const [list, setList] = getSetList(type);
    setList(list.map(o => o.id === editOrg.id ? editOrg : o));
    setEditOrg(null);
    showToast('Updated!');
  };

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  return (
    <div className="admin-root">
      {/* Topbar */}
      <div className="admin-topbar">
        <Link to="/home" className="admin-back"><FiArrowLeft size={16}/> Back to App</Link>
        <div className="admin-title-wrap">
          <FiShield size={18} style={{ color:'#d97706' }}/>
          <span className="admin-title">Admin Panel</span>
        </div>
        <div className="admin-user">
          Signed in as <strong>{user?.username}</strong>
        </div>
      </div>

      <div className="admin-body">
        {/* Sidebar */}
        <nav className="admin-nav">
          {TAB_LIST.map(t => (
            <button
              key={t.id}
              className={`admin-nav-btn ${tab===t.id ? 'admin-nav-active':''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={16}/> {t.label}
            </button>
          ))}
        </nav>

        {/* Main */}
        <div className="admin-main">
          {/* Stats row */}
          {tab === 'users' && (
            <div className="stats-row">
              <StatCard icon={FiUsers}    label="Total Users"     value={SEED_USERS.length} color="#2563eb"/>
              <StatCard icon={FiUsers}    label="Clubs"           value={clubs.length}      color="#7c3aed"/>
              <StatCard icon={FiCpu}      label="Chapters"        value={chapters.length}   color="#0891b2"/>
              <StatCard icon={FiAward}    label="Societies"       value={societies.length}  color="#d97706"/>
              <StatCard icon={FiCalendar} label="Events"          value={events.length}     color="#059669"/>
            </div>
          )}

          {/* ── Users tab ── */}
          {tab === 'users' && (
            <div className="admin-section">
              <div className="admin-section-head">
                <h2 className="admin-section-title"><FiDatabase size={15}/> Registered Students</h2>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th><th>Department</th><th>Clubs / Memberships</th><th>Role</th><th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {SEED_USERS.map(u => (
                    <tr key={u.username}>
                      <td><strong>@{u.username}</strong></td>
                      <td>{u.dept}</td>
                      <td>{u.clubs.join(', ')}</td>
                      <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                      <td>{u.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Clubs / Chapters / Societies tabs ── */}
          {['clubs','chapters','societies'].includes(tab) && (() => {
            const [list] = getSetList(tab);
            const label  = tab === 'clubs' ? 'Club' : tab === 'chapters' ? 'Student Chapter' : 'Professional Society';
            return (
              <div className="admin-section">
                <div className="admin-section-head">
                  <h2 className="admin-section-title">{label}s</h2>
                  <button className="admin-add-btn" onClick={() => { setAddingOrg(tab); setNewOrg(BLANK_ORG); }}>
                    <FiPlusCircle size={14}/> Add {label}
                  </button>
                </div>

                {/* Add form */}
                {addingOrg === tab && (
                  <div className="org-form">
                    <div className="org-form-row">
                      <input className="admin-input" placeholder="Name *" value={newOrg.name} onChange={e=>setNewOrg({...newOrg,name:e.target.value})}/>
                      <input className="admin-input" placeholder="Lead / Advisor" value={newOrg.lead} onChange={e=>setNewOrg({...newOrg,lead:e.target.value})}/>
                      <input className="admin-input" placeholder="Members count" value={newOrg.members} onChange={e=>setNewOrg({...newOrg,members:e.target.value})}/>
                    </div>
                    <textarea className="admin-input" placeholder="Description" rows={2} value={newOrg.desc} onChange={e=>setNewOrg({...newOrg,desc:e.target.value})}/>
                    <div className="org-form-row">
                      <div>
                        <label className="admin-label">Colour</label>
                        <input type="color" value={newOrg.color} onChange={e=>setNewOrg({...newOrg,color:e.target.value})} style={{ width:44, height:34, borderRadius:8, border:'1px solid var(--border)', cursor:'pointer' }}/>
                      </div>
                      <div>
                        <label className="admin-label">Icon</label>
                        <div className="emoji-picker">
                          {EMOJI_OPTIONS.map(em => (
                            <button key={em} className={`emoji-btn ${newOrg.icon===em?'emoji-active':''}`} onClick={()=>setNewOrg({...newOrg,icon:em})}>{em}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="admin-save-btn" onClick={() => addOrg(tab)}><FiCheck size={13}/> Save</button>
                      <button className="admin-cancel-btn" onClick={()=>setAddingOrg(null)}><FiX size={13}/> Cancel</button>
                    </div>
                  </div>
                )}

                <div className="org-cards">
                  {list.map(org => (
                    <div key={org.id} className="org-admin-card" style={{ borderLeftColor: org.color }}>
                      {editOrg?.id === org.id ? (
                        <div className="org-form" style={{ border:'none', margin:0 }}>
                          <div className="org-form-row">
                            <input className="admin-input" value={editOrg.name} onChange={e=>setEditOrg({...editOrg,name:e.target.value})}/>
                            <input className="admin-input" value={editOrg.lead} onChange={e=>setEditOrg({...editOrg,lead:e.target.value})}/>
                            <input className="admin-input" value={editOrg.members} onChange={e=>setEditOrg({...editOrg,members:e.target.value})}/>
                          </div>
                          <textarea className="admin-input" rows={2} value={editOrg.desc} onChange={e=>setEditOrg({...editOrg,desc:e.target.value})}/>
                          <div style={{ display:'flex', gap:8 }}>
                            <button className="admin-save-btn" onClick={()=>saveEditOrg(tab)}><FiCheck size={13}/> Save</button>
                            <button className="admin-cancel-btn" onClick={()=>setEditOrg(null)}><FiX size={13}/> Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:22 }}>{org.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:700, color:'var(--text1)' }}>{org.name}</div>
                              <div style={{ fontSize:12, color:'var(--text2)' }}>{org.desc}</div>
                              <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>Lead: {org.lead} · {org.members} members</div>
                            </div>
                            <div style={{ display:'flex', gap:6 }}>
                              <button className="icon-action-btn" onClick={()=>setEditOrg(org)}><FiEdit2 size={13}/></button>
                              <button className="icon-action-btn danger" onClick={()=>deleteOrg(tab,org.id)}><FiTrash2 size={13}/></button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Events tab ── */}
          {tab === 'events' && (
            <div className="admin-section">
              <div className="admin-section-head">
                <h2 className="admin-section-title"><FiCalendar size={15}/> Upcoming Events</h2>
                <button className="admin-add-btn" onClick={()=>setAddingEvent(true)}>
                  <FiPlusCircle size={14}/> Add Event
                </button>
              </div>
              <p className="admin-hint">Events added here appear immediately in the <strong>Upcoming Events</strong> panel on the Home Feed for all users.</p>

              {addingEvent && (
                <div className="org-form">
                  <div className="org-form-row">
                    <input className="admin-input" placeholder="Event name *" value={newEvent.name} onChange={e=>setNewEvent({...newEvent,name:e.target.value})}/>
                    <input className="admin-input" placeholder="Date (e.g. May 20)" value={newEvent.date} onChange={e=>setNewEvent({...newEvent,date:e.target.value})}/>
                  </div>
                  <div className="org-form-row">
                    <div style={{ flex:1 }}>
                      <label className="admin-label">Organising Club / Society</label>
                      <select className="admin-input" value={newEvent.club} onChange={e=>setNewEvent({...newEvent,club:e.target.value})}>
                        <option value="">Select organisation…</option>
                        {ORG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="admin-label">Icon</label>
                      <div className="emoji-picker">
                        {EMOJI_OPTIONS.slice(0,8).map(em => (
                          <button key={em} className={`emoji-btn ${newEvent.icon===em?'emoji-active':''}`} onClick={()=>setNewEvent({...newEvent,icon:em})}>{em}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="admin-label">Colour</label>
                      <input type="color" value={newEvent.color} onChange={e=>setNewEvent({...newEvent,color:e.target.value})} style={{ width:44, height:34, borderRadius:8, border:'1px solid var(--border)', cursor:'pointer' }}/>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="admin-save-btn" onClick={addEvent}><FiCheck size={13}/> Publish Event</button>
                    <button className="admin-cancel-btn" onClick={()=>setAddingEvent(false)}><FiX size={13}/> Cancel</button>
                  </div>
                </div>
              )}

              {events.length === 0 && !addingEvent && (
                <div className="admin-empty">No events yet. Click "Add Event" to publish one.</div>
              )}

              <div className="events-list">
                {events.map(ev => (
                  <div key={ev.id} className="event-admin-row" style={{ borderLeftColor: ev.color }}>
                    <span style={{ fontSize:22 }}>{ev.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:'var(--text1)' }}>{ev.name}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{ev.club} · {ev.date}</div>
                    </div>
                    <button className="icon-action-btn danger" onClick={()=>deleteEvent(ev.id)}><FiTrash2 size={13}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="admin-toast"><FiCheck size={14}/> {toast}</div>}
    </div>
  );
}