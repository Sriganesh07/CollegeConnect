import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiGithub, FiEdit3, FiCamera, FiMapPin, FiCalendar,
  FiCode, FiStar, FiGitBranch, FiUpload, FiHeart,
  FiMessageCircle, FiBookmark, FiAward, FiUsers,
  FiUserPlus, FiGrid, FiList, FiX, FiSave,
  FiPlus, FiTrash2, FiPhone, FiLink, FiRefreshCw,
  FiAlertCircle, FiZap, FiTrendingUp,
} from 'react-icons/fi';
import useProfile from '../hooks/useProfile';
import { userAPI } from '../api';
import './ProfilePage.css';

const getMe  = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const COLORS  = ['#4f61d2','#0ea5e9','#8b5cf6','#f43f5e','#10b981','#f59e0b'];
const SK_CLR  = ['#0ea5e9','#10b981','#4f61d2','#f43f5e','#8b5cf6','#f59e0b','#ec4899','#f97316'];
const aC      = (n) => COLORS[(n?.charCodeAt(0)||0) % COLORS.length];

function Skel({ w='100%', h=14, r=6 }) {
  return <div className="skeleton" style={{ width:w, height:h, borderRadius:r }}/>;
}

/* ── Daily XP tasks — auto-tracked, NOT manually clicked ─────── */
const XP_TASKS = [
  { id:'post',    icon:'✍️', label:'Make a post',            xp:10 },
  { id:'like',    icon:'❤️', label:'Like a post',            xp:5  },
  { id:'comment', icon:'💬', label:'Leave a comment',        xp:8  },
  { id:'follow',  icon:'👥', label:'Follow someone',         xp:5  },
  { id:'message', icon:'💌', label:'Send a message',         xp:5  },
  { id:'story',   icon:'⭐', label:'Add a story',            xp:7  },
  { id:'repo',    icon:'📦', label:'Upload a repository',    xp:15 },
];

const getTodayDone = () => {
  try {
    const today = new Date().toDateString();
    return JSON.parse(localStorage.getItem(`cc_tasks_${today}`) || '[]');
  } catch { return []; }
};

export default function ProfilePage() {
  const { username: paramUser } = useParams();
  const me = getMe();
  const {
    profile, posts, repos, skills, loading, error, saving,
    saveProfile, addRepo, removeRepo, updateSkills, isOwn, reload,
  } = useProfile(paramUser);

  const [editMode,     setEditMode]    = useState(false);
  const [editFields,   setEditFields]  = useState({});
  const [activeTab,    setActiveTab]   = useState('posts');
  const [gridView,     setGridView]    = useState(true);
  const [following,    setFollowing]   = useState(false);
  const [checkFollow,  setCheckFollow] = useState(false);
  const [photoUrl,     setPhotoUrl]    = useState(null);
  const [coverUrl,     setCoverUrl]    = useState(null);
  const [uploadModal,  setUploadModal] = useState(false);
  const [newRepo,      setNewRepo]     = useState({ name:'', desc:'', lang:'JavaScript', file:null });
  const [skillModal,   setSkillModal]  = useState(false);
  const [editSkills,   setEditSkills]  = useState([]);
  const [toast,        setToast]       = useState('');
  const [doneTasks,    setDoneTasks]   = useState(getTodayDone);
  const [xpAnim,       setXpAnim]      = useState(false);
  const photoRef    = useRef();
  const coverRef    = useRef();
  const repoFileRef = useRef();

  // Listen for activity events fired by HomeFeed/Messages
  useEffect(() => {
    const onXp = (e) => {
      setDoneTasks(getTodayDone());
      setXpAnim(true);
      setTimeout(() => setXpAnim(false), 1000);
    };
    window.addEventListener('xpEarned', onXp);
    return () => window.removeEventListener('xpEarned', onXp);
  }, []);

  // Also refresh done tasks whenever tab becomes active
  useEffect(() => {
    const onFocus = () => setDoneTasks(getTodayDone());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const totalXP = doneTasks.reduce((sum, id) => {
    const t = XP_TASKS.find(x => x.id === id);
    return sum + (t?.xp || 0);
  }, 0);
  const maxXP   = XP_TASKS.reduce((s,t) => s+t.xp, 0);
  const xpPct   = Math.round((totalXP / maxXP) * 100);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  useEffect(() => {
    if (!isOwn && profile?.username && me?.username) {
      setCheckFollow(true);
      userAPI.isFollowing(profile.username)
        .then(d => setFollowing(d.following||false))
        .catch(()=>{})
        .finally(()=>setCheckFollow(false));
    }
  }, [profile?.username, isOwn, me?.username]);

  const toggleFollow = async () => {
    const was = following; setFollowing(!was);
    try {
      was ? await userAPI.unfollow(profile.username) : await userAPI.follow(profile.username);
    } catch { setFollowing(was); }
  };

  const startEdit = () => {
    setEditFields({
      bio:                   profile?.bio||'',
      location:              profile?.location||'',
      github_url:            profile?.github_url||'',
      website:               profile?.website||'',
      phone_no:              profile?.phone_no||'',
      collegeName:           profile?.collegeName||'',
      hobbies:               (profile?.hobbies||[]).filter(v=>v!=='nil').join(', '),
      clubs_joined:          (profile?.clubs_joined||[]).filter(v=>v!=='nil').join(', '),
      professional_societies:(profile?.professional_societies||[]).filter(v=>v!=='nil').join(', '),
    });
    setEditMode(true);
  };

  const handleSave = async () => {
    const toArr = v => v ? v.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const ok = await saveProfile({
      bio:                   editFields.bio,
      location:              editFields.location,
      github_url:            editFields.github_url,
      website:               editFields.website,
      phone_no:              editFields.phone_no,
      collegeName:           editFields.collegeName,
      hobbies:               toArr(editFields.hobbies),
      clubs_joined:          toArr(editFields.clubs_joined),
      professional_societies:toArr(editFields.professional_societies),
    });
    ok ? (showToast('Profile saved! ✨'), setEditMode(false)) : showToast('Save failed — check server.');
  };

  const handlePhoto = e => { const f=e.target.files[0]; if(f) setPhotoUrl(URL.createObjectURL(f)); };
  const handleCover = e => { const f=e.target.files[0]; if(f) setCoverUrl(URL.createObjectURL(f)); };

  const handleAddRepo = async () => {
    if (!newRepo.name.trim()) return;
    await addRepo(newRepo);
    setNewRepo({ name:'', desc:'', lang:'JavaScript', file:null });
    setUploadModal(false);
    showToast('Repository published! 🚀');
  };

  const openSkillModal = () => {
    setEditSkills(skills.length ? [...skills] : [{ name:'', level:50 }]);
    setSkillModal(true);
  };

  const handleSaveSkills = async () => {
    const valid = editSkills.filter(s => s.name.trim());
    await updateSkills(valid);
    setSkillModal(false);
    showToast('Skills updated!');
  };

  // Derived values
  const displayName    = profile?.username || paramUser || me?.username || '';
  const displayDept    = profile?.department || '';
  const displayCollege = profile?.collegeName || '';
  const totalStars     = repos.reduce((a,r) => a+(r.stars||0), 0);
  const hobbies        = (profile?.hobbies||[]).filter(h=>h&&h!=='nil');
  const clubsList      = (profile?.clubs_joined||[]).filter(c=>c&&c!=='nil');
  const societiesList  = (profile?.professional_societies||[]).filter(s=>s&&s!=='nil');

  const achievements = [
    ...(posts.length>=1   ?[{icon:'🌱',label:'First Post',     sub:'Started sharing'}]           :[]),
    ...(posts.length>=5   ?[{icon:'✍️',label:'Active Poster',  sub:`${posts.length} posts`}]      :[]),
    ...(repos.length>=1   ?[{icon:'📦',label:'Open Source',    sub:`${repos.length} repos`}]      :[]),
    ...(totalStars>=5     ?[{icon:'⭐',label:'Rising Star',     sub:`${totalStars} stars`}]         :[]),
    ...(skills.length>=3  ?[{icon:'🎯',label:'Multi-Skilled',  sub:`${skills.length} skills`}]    :[]),
    ...(clubsList.length  ?[{icon:'🏛️',label:'Club Member',    sub:clubsList[0]}]                 :[]),
    ...(societiesList.length?[{icon:'🏅',label:'Society Member',sub:societiesList[0]}]            :[]),
    ...((profile?.followers_count||0)>=10?[{icon:'👥',label:'Influential',sub:`${profile.followers_count} followers`}]:[]),
  ];

  if (loading) return (
    <div className="profile-root">
      <div className="profile-cover"/>
      <div className="profile-header">
        <div className="profile-av-wrap"><div className="profile-av skeleton" style={{background:'var(--bg3)'}}/></div>
        <div className="profile-info" style={{display:'flex',flexDirection:'column',gap:10,paddingTop:14}}>
          <Skel w={160} h={22}/><Skel w={100} h={13}/><Skel w="90%" h={13}/><Skel w="70%" h={13}/>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="profile-root" style={{display:'flex',alignItems:'center',justifyContent:'center',padding:60}}>
      <div style={{textAlign:'center'}}>
        <FiAlertCircle size={36} style={{color:'var(--rose)',marginBottom:12}}/>
        <p style={{fontWeight:700,fontSize:16,color:'var(--text1)'}}>{error}</p>
        <button className="p-btn p-btn-primary" style={{marginTop:16}} onClick={reload}><FiRefreshCw size={13}/> Retry</button>
      </div>
    </div>
  );

  return (
    <div className="profile-root">
      {/* Cover */}
      <div className="profile-cover" style={coverUrl?{backgroundImage:`url(${coverUrl})`,backgroundSize:'cover',backgroundPosition:'center'}:{}}>
        <div className="profile-cover-overlay"/>
        {isOwn && (
          <>
            <input ref={coverRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleCover}/>
            <button className="cover-edit-btn" onClick={()=>coverRef.current?.click()}><FiCamera size={12}/> Change Cover</button>
          </>
        )}
      </div>

      {/* Header */}
      <div className="profile-header">
        <div className="profile-av-wrap">
          <div className="profile-av" style={{background:photoUrl?'transparent':`linear-gradient(135deg,${aC(displayName)},${COLORS[(displayName?.charCodeAt(0)||0+2)%COLORS.length]})`}}>
            {photoUrl?<img src={photoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit'}}/>:<span>{displayName.slice(0,2).toUpperCase()}</span>}
          </div>
          {isOwn && (
            <><input ref={photoRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto}/>
            <button className="av-edit-btn" onClick={()=>photoRef.current?.click()}><FiCamera size={11}/></button></>
          )}
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <div>
              <h1 className="profile-name">{displayName}</h1>
              <div className="profile-handle">@{displayName}</div>
            </div>
            <div className="profile-actions-row">
              {isOwn ? (
                !editMode
                  ? <button className="p-btn p-btn-outline" onClick={startEdit}><FiEdit3 size={12}/> Edit Profile</button>
                  : <div style={{display:'flex',gap:6}}>
                      <button className="p-btn p-btn-primary" onClick={handleSave} disabled={saving}><FiSave size={12}/> {saving?'Saving…':'Save'}</button>
                      <button className="p-btn p-btn-outline" onClick={()=>setEditMode(false)}>Cancel</button>
                    </div>
              ) : (
                <>
                  <button className={`p-btn ${following?'p-btn-outline':'p-btn-primary'}`} onClick={toggleFollow} disabled={checkFollow}>
                    {following?<><FiUsers size={12}/> Following</>:<><FiUserPlus size={12}/> Follow</>}
                  </button>
                  <Link to="/messages" className="p-btn p-btn-outline"><FiMessageCircle size={12}/> Message</Link>
                </>
              )}
            </div>
          </div>

          {editMode ? (
            <div className="bio-edit-inline">
              <textarea className="bio-textarea" value={editFields.bio} onChange={e=>setEditFields({...editFields,bio:e.target.value})} rows={3} maxLength={200} autoFocus placeholder="Write a short bio…"/>
              <span className="bio-char-count">{(editFields.bio||'').length}/200</span>
            </div>
          ) : (
            <p className="profile-bio">{profile?.bio||(isOwn?'Click Edit Profile to add your bio.':'No bio yet.')}</p>
          )}

          {editMode && (
            <div className="edit-fields-grid">
              {[
                {key:'location',   label:'📍 Location',  ph:'City, Country'},
                {key:'phone_no',   label:'📞 Phone',     ph:'+91 XXXXXXXXXX'},
                {key:'github_url', label:'🐙 GitHub',    ph:'https://github.com/username'},
                {key:'website',    label:'🔗 Website',   ph:'https://yoursite.com'},
                {key:'collegeName',label:'🏫 College',   ph:'Your college name'},
              ].map(f=>(
                <div key={f.key} className="edit-field">
                  <label>{f.label}</label>
                  <input className="edit-input" value={editFields[f.key]||''} placeholder={f.ph} onChange={e=>setEditFields({...editFields,[f.key]:e.target.value})}/>
                </div>
              ))}
              {[
                {key:'hobbies',label:'🎯 Hobbies'},
                {key:'clubs_joined',label:'🏛️ Clubs Joined'},
                {key:'professional_societies',label:'🏅 Professional Societies'},
              ].map(f=>(
                <div key={f.key} className="edit-field edit-field-full">
                  <label>{f.label} <span className="ef-hint">(comma separated)</span></label>
                  <input className="edit-input" value={editFields[f.key]||''} placeholder="Item 1, Item 2" onChange={e=>setEditFields({...editFields,[f.key]:e.target.value})}/>
                </div>
              ))}
            </div>
          )}

          {!editMode && (
            <div className="profile-meta">
              {profile?.location   && <span className="meta-chip"><FiMapPin size={11}/> {profile.location}</span>}
              <span className="meta-chip"><FiCalendar size={11}/> {profile?.joined}</span>
              {displayDept         && <span className="meta-chip dept-chip"><FiCode size={11}/> {displayDept}</span>}
              {displayCollege      && <span className="meta-chip college-chip">🏫 {displayCollege}</span>}
              {profile?.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="meta-chip meta-link"><FiGithub size={11}/> GitHub</a>}
              {profile?.website    && <a href={profile.website}    target="_blank" rel="noopener noreferrer" className="meta-chip meta-link"><FiLink size={11}/> Website</a>}
              {clubsList.map(c    => <span key={c} className="meta-chip club-chip">{c}</span>)}
              {societiesList.map(s=> <span key={s} className="meta-chip society-chip">{s}</span>)}
            </div>
          )}
          {!editMode && hobbies.length>0 && (
            <div className="hobbies-row">{hobbies.map(h=><span key={h} className="hobby-tag">{h}</span>)}</div>
          )}

          <div className="profile-stats">
            {[
              {label:'Posts',val:posts.length},
              {label:'Followers',val:profile?.followers_count||0},
              {label:'Following',val:profile?.following_count||0},
              {label:'Repos',val:repos.length},
              {label:'Stars',val:totalStars},
            ].map(s=>(
              <div key={s.label} className="profile-stat">
                <span className="profile-stat-val">{s.val}</span>
                <span className="profile-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <div className="tabs-row">
          {[
            {id:'posts',label:'Posts',count:posts.length},
            {id:'repos',label:'Repos',count:repos.length},
            {id:'skills',label:'Skills',count:skills.length},
            {id:'achievements',label:'Achievements',count:achievements.length},
            ...(isOwn?[{id:'xp',label:'Daily XP 🔥',count:''}]:[]),
          ].map(t=>(
            <button key={t.id} className={`tab-btn ${activeTab===t.id?'tab-active':''}`} onClick={()=>setActiveTab(t.id)}>
              {t.label}{t.count!==''&&<span className="tab-count">{t.count}</span>}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:6}}>
          {activeTab==='posts' && <div className="view-toggle"><button className={gridView?'vt-active':''} onClick={()=>setGridView(true)}><FiGrid size={13}/></button><button className={!gridView?'vt-active':''} onClick={()=>setGridView(false)}><FiList size={13}/></button></div>}
          {activeTab==='repos'&&isOwn && <button className="p-btn p-btn-primary p-btn-sm" onClick={()=>setUploadModal(true)}><FiUpload size={11}/> Upload</button>}
          {activeTab==='skills'&&isOwn && <button className="p-btn p-btn-primary p-btn-sm" onClick={openSkillModal}><FiEdit3 size={11}/> Edit</button>}
        </div>
      </div>

      <div className="profile-body">
        {/* Posts */}
        {activeTab==='posts' && (
          posts.length===0
            ? <div className="empty-state">{isOwn?'📝 No posts yet. Share something on the feed!':'No posts yet.'}</div>
            : gridView
              ? <div className="posts-grid">{posts.map(p=>(
                  <div key={p.id} className="grid-post">
                    {p.media?<img src={p.media} alt="" className="grid-post-img"/>:<div className="grid-post-text">{p.content}</div>}
                    <div className="grid-post-overlay"><span><FiHeart size={12}/> {p.likes_count||0}</span><span><FiMessageCircle size={12}/> {p.comments_count||0}</span></div>
                  </div>
                ))}</div>
              : <div className="posts-list">{posts.map(p=>(
                  <div key={p.id} className="list-post">
                    <p className="list-post-text">{p.content}</p>
                    {p.media&&<img src={p.media} alt="" className="list-post-img"/>}
                    <div className="list-post-actions">
                      <span><FiHeart size={13}/> {p.likes_count||0}</span>
                      <span><FiMessageCircle size={13}/> {p.comments_count||0}</span>
                      <span><FiBookmark size={13}/></span>
                      <span style={{marginLeft:'auto',color:'var(--text3)',fontSize:11}}>{p.time}</span>
                    </div>
                  </div>
                ))}</div>
        )}

        {/* Repos */}
        {activeTab==='repos' && (
          repos.length===0
            ? <div className="empty-state">{isOwn?'📦 Upload your first project!':'No repos yet.'}</div>
            : <div className="repos-grid">{repos.map(r=>(
                <div key={r.id||r.name} className="repo-card">
                  <div className="repo-head">
                    <FiGithub size={13} style={{color:'var(--text2)'}}/>
                    <span className="repo-name">{r.name}</span>
                    <span className="repo-lang" style={{background:`${aC(r.name)}18`,color:aC(r.name)}}>{r.lang}</span>
                    {isOwn&&<button className="repo-del-btn" onClick={()=>removeRepo(r.id)}><FiTrash2 size={11}/></button>}
                  </div>
                  <p className="repo-desc">{r.desc||'No description.'}</p>
                  <div className="repo-meta"><span><FiStar size={11}/> {r.stars||0}</span><span><FiGitBranch size={11}/> {r.forks||0}</span><span style={{marginLeft:'auto',fontSize:10.5,color:'var(--text3)'}}>Updated {r.updated||'recently'}</span></div>
                </div>
              ))}</div>
        )}

        {/* Skills */}
        {activeTab==='skills' && (
          skills.length===0
            ? <div className="empty-state">{isOwn?<><p>No skills yet.</p><button className="p-btn p-btn-primary p-btn-sm" style={{marginTop:12}} onClick={openSkillModal}><FiPlus size={11}/> Add Skills</button></>:'No skills listed.'}</div>
            : <div className="skills-wrap">
                {skills.map((sk,i)=>(
                  <div key={sk.name} className="skill-row">
                    <div className="skill-label"><span className="skill-name">{sk.name}</span><span className="skill-pct" style={{color:SK_CLR[i%SK_CLR.length]}}>{sk.level}%</span></div>
                    <div className="skill-bar"><div className="skill-fill" style={{width:`${sk.level}%`,background:SK_CLR[i%SK_CLR.length]}}/></div>
                  </div>
                ))}
              </div>
        )}

        {/* Achievements */}
        {activeTab==='achievements' && (
          achievements.length===0
            ? <div className="empty-state">Keep posting, following and uploading repos to unlock achievements!</div>
            : <div className="achievements-grid">{achievements.map(a=>(
                <div key={a.label} className="achievement-card">
                  <span className="achievement-icon">{a.icon}</span>
                  <div className="achievement-label">{a.label}</div>
                  <div className="achievement-sub">{a.sub}</div>
                </div>
              ))}</div>
        )}

        {/* Daily XP — auto-tracked, read-only display */}
        {activeTab==='xp' && isOwn && (
          <div className="xp-section">
            {/* XP progress bar */}
            <div className="xp-header">
              <div className="xp-title-row">
                <h3 className="xp-title">🔥 Daily XP</h3>
                <span className={`xp-total ${xpAnim?'xp-pop':''}`}>{totalXP} / {maxXP} XP</span>
              </div>
              <p className="xp-subtitle">XP is earned automatically as you use the app — no manual steps needed!</p>
              <div className="xp-bar-bg">
                <div className="xp-bar-fill" style={{width:`${xpPct}%`}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text3)',marginTop:4}}>
                <span>{xpPct}% complete today</span>
                <span>Resets midnight</span>
              </div>
            </div>

            {/* Task checklist — shows auto status */}
            <div className="xp-tasks">
              {XP_TASKS.map(task => {
                const done = doneTasks.includes(task.id);
                return (
                  <div key={task.id} className={`xp-task-row ${done?'xp-task-done':''}`}>
                    <span className="xp-task-icon">{task.icon}</span>
                    <div className="xp-task-info">
                      <span className="xp-task-label">{task.label}</span>
                      <span className="xp-task-hint">{done ? 'Completed ✓' : 'Not yet done today'}</span>
                    </div>
                    <span className="xp-task-pts" style={{color:done?'var(--emerald)':'var(--text3)'}}>
                      {done?`+${task.xp} XP`:`+${task.xp} XP`}
                    </span>
                    <span className={`xp-task-check ${done?'done':''}`}>{done?'✅':'○'}</span>
                  </div>
                );
              })}
            </div>

            {/* Tips */}
            <div className="xp-tips">
              <div className="xp-tip"><FiTrendingUp size={13}/> Post something on the feed to earn +10 XP</div>
              <div className="xp-tip"><FiAward size={13}/> Upload a repository for the biggest XP reward (+15)</div>
              <div className="xp-tip"><FiZap size={13}/> Complete all tasks to reach max XP today!</div>
            </div>
          </div>
        )}
      </div>

      {/* Upload repo modal */}
      {uploadModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setUploadModal(false)}>
          <div className="modal-box">
            <div className="modal-head"><span>Upload Project</span><button className="modal-close" onClick={()=>setUploadModal(false)}><FiX size={14}/></button></div>
            <div className="modal-body">
              <label className="modal-label">Name *</label>
              <input className="modal-input" placeholder="my-project" value={newRepo.name} onChange={e=>setNewRepo({...newRepo,name:e.target.value})}/>
              <label className="modal-label">Description</label>
              <textarea className="modal-input" rows={3} placeholder="What does it do?" value={newRepo.desc} onChange={e=>setNewRepo({...newRepo,desc:e.target.value})}/>
              <label className="modal-label">Language</label>
              <select className="modal-input" value={newRepo.lang} onChange={e=>setNewRepo({...newRepo,lang:e.target.value})}>
                {['JavaScript','TypeScript','Python','C++','Java','Rust','Go','Dart','Kotlin','Swift'].map(l=><option key={l}>{l}</option>)}
              </select>
              <label className="modal-label">Upload ZIP</label>
              <input ref={repoFileRef} type="file" accept=".zip,.tar,.gz" style={{display:'none'}} onChange={e=>setNewRepo({...newRepo,file:e.target.files[0]?.name})}/>
              <button className="file-upload-btn" onClick={()=>repoFileRef.current?.click()}><FiUpload size={13}/> {newRepo.file||'Choose ZIP…'}</button>
            </div>
            <div className="modal-foot">
              <button className="p-btn p-btn-outline" onClick={()=>setUploadModal(false)}>Cancel</button>
              <button className="p-btn p-btn-primary" onClick={handleAddRepo}><FiGithub size={12}/> Publish</button>
            </div>
          </div>
        </div>
      )}

      {/* Skills modal */}
      {skillModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setSkillModal(false)}>
          <div className="modal-box">
            <div className="modal-head"><span>Edit Skills</span><button className="modal-close" onClick={()=>setSkillModal(false)}><FiX size={14}/></button></div>
            <div className="modal-body">
              {editSkills.map((sk,i)=>(
                <div key={i} className="skill-edit-row">
                  <input className="modal-input" style={{flex:1}} placeholder="Skill name" value={sk.name} onChange={e=>{const n=[...editSkills];n[i]={...n[i],name:e.target.value};setEditSkills(n);}}/>
                  <input type="range" min={5} max={100} value={sk.level} style={{width:80}} onChange={e=>{const n=[...editSkills];n[i]={...n[i],level:+e.target.value};setEditSkills(n);}}/>
                  <span style={{width:32,fontSize:12,fontWeight:700,color:'var(--accent)'}}>{sk.level}%</span>
                  <button className="skill-del-btn" onClick={()=>setEditSkills(editSkills.filter((_,j)=>j!==i))}><FiTrash2 size={12}/></button>
                </div>
              ))}
              <button className="p-btn p-btn-outline" style={{width:'100%',justifyContent:'center',marginTop:4}} onClick={()=>setEditSkills([...editSkills,{name:'',level:50}])}><FiPlus size={12}/> Add Skill</button>
            </div>
            <div className="modal-foot">
              <button className="p-btn p-btn-outline" onClick={()=>setSkillModal(false)}>Cancel</button>
              <button className="p-btn p-btn-primary" onClick={handleSaveSkills}><FiSave size={12}/> Save</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="profile-toast"><FiZap size={12}/> {toast}</div>}
    </div>
  );
}