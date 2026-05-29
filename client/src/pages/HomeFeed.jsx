import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark,
  FiImage, FiFilm, FiCode, FiSmile, FiSend, FiX,
  FiMoreHorizontal, FiTrendingUp, FiCalendar, FiAward,
  FiZap, FiRefreshCw, FiAlertCircle, FiUserPlus, FiPlus,
  FiChevronLeft, FiChevronRight, FiCamera, FiBarChart2,
} from 'react-icons/fi';
import { postAPI, eventAPI, userAPI } from '../api';
import SnapCamera from '../components/SnapCamera';
import { Poll, PollCreator, MoodWidget, VibeWidget, StreakBadge } from '../components/ViralFeatures';
import './HomeFeed.css';

const getUser  = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const COLORS   = ['#4f61d2','#0ea5e9','#8b5cf6','#f43f5e','#10b981','#f59e0b','#ec4899','#f97316'];
const aC       = (n) => COLORS[(n?.charCodeAt(0)||0) % COLORS.length];
const TRENDING = ['#ReactJS','#MachineLearning','#OpenSource','#WebDev','#CPP','#IEEE','#GDSC','#Python','#Flutter','#Blockchain'];
const REACTIONS= ['❤️','😂','😮','😢','😡','👏','🔥','💯'];

export const trackTask = (id) => {
  try {
    const today = new Date().toDateString();
    const key   = `cc_tasks_${today}`;
    const done  = JSON.parse(localStorage.getItem(key) || '[]');
    if (!done.includes(id)) {
      localStorage.setItem(key, JSON.stringify([...done, id]));
      window.dispatchEvent(new CustomEvent('xpEarned', { detail: { id, today } }));
    }
  } catch {}
};

/* ── Story viewer ─────────────────────────────────────────────── */
function StoryViewer({ stories, startIndex, onClose }) {
  const [idx, setIdx]           = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef();
  const story = stories[idx];

  useEffect(() => {
    setProgress(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timerRef.current);
          if (idx < stories.length - 1) setIdx(i => i + 1);
          else onClose();
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [idx]); // eslint-disable-line

  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="story-modal" onClick={e => e.stopPropagation()}>
        <div className="story-progress-row">
          {stories.map((_, i) => (
            <div key={i} className="story-progress-bg">
              <div className="story-progress-fill" style={{ width: i<idx?'100%':i===idx?`${progress}%`:'0%' }}/>
            </div>
          ))}
        </div>
        <div className="story-head">
          <div className="story-av" style={{ background: aC(story.username) }}>{story.username?.slice(0,2).toUpperCase()}</div>
          <div>
            <div className="story-username">{story.username}</div>
            <div className="story-time">{story.time || 'Today'}</div>
          </div>
          <button className="story-close" onClick={onClose}><FiX size={18}/></button>
        </div>
        <div className="story-body">
          {story.image
            ? <img src={story.image} alt="" className="story-img"/>
            : <div className="story-text-card" style={{ background:`linear-gradient(135deg,${aC(story.username)},${COLORS[(story.username?.charCodeAt(0)||0+2)%COLORS.length]})` }}>
                <p className="story-text-content">{story.text}</p>
              </div>
          }
        </div>
        {idx > 0 && <button className="story-nav story-nav-left" onClick={()=>{setIdx(i=>i-1);setProgress(0);}}><FiChevronLeft size={22}/></button>}
        {idx < stories.length-1 && <button className="story-nav story-nav-right" onClick={()=>{setIdx(i=>i+1);setProgress(0);}}><FiChevronRight size={22}/></button>}
      </div>
    </div>
  );
}

/* ── Add story modal ──────────────────────────────────────────── */
function AddStoryModal({ onClose, onAdd, username }) {
  const [text, setText]       = useState('');
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();
  const handleFile = (e) => { const f=e.target.files[0]; if(f) setPreview(URL.createObjectURL(f)); };
  const handlePost = () => {
    if (!text.trim() && !preview) return;
    const story = { id:Date.now(), username, text:text.trim(), image:preview||null, time:'Just now', isOwn:true };
    const today = new Date().toDateString();
    const existing = JSON.parse(localStorage.getItem(`cc_stories_${today}`)||'[]');
    localStorage.setItem(`cc_stories_${today}`, JSON.stringify([story,...existing]));
    onAdd(story); trackTask('story'); onClose();
  };
  const bg = `linear-gradient(135deg,${aC(username)},${COLORS[(username?.charCodeAt(0)||0+2)%COLORS.length]})`;
  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="add-story-modal" onClick={e=>e.stopPropagation()}>
        <div className="add-story-head">
          <h3>Add to Your Story</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text2)',padding:6,borderRadius:8}}><FiX size={16}/></button>
        </div>
        <div className="add-story-preview" style={{ background:preview?'transparent':bg }}>
          {preview ? <img src={preview} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:12}}/> : <p style={{color:'#fff',fontSize:18,fontWeight:700,textAlign:'center',padding:20}}>{text||'Type something…'}</p>}
        </div>
        <textarea className="add-story-input" placeholder="What's on your mind?" value={text} onChange={e=>setText(e.target.value)} rows={3}/>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
        <div className="add-story-actions">
          <button className="story-upload-btn" onClick={()=>fileRef.current?.click()}><FiImage size={15}/> {preview?'Change':'Add Image'}</button>
          {preview && <button className="story-upload-btn" style={{color:'var(--rose)',borderColor:'var(--rose)'}} onClick={()=>setPreview(null)}><FiX size={13}/> Remove</button>}
          <button className={`story-post-btn ${(text.trim()||preview)?'active':''}`} onClick={handlePost} disabled={!text.trim()&&!preview}>Share Story ✨</button>
        </div>
      </div>
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="post-card" style={{padding:18}}>
      <div style={{display:'flex',gap:12,marginBottom:14}}>
        <div className="skeleton" style={{width:40,height:40,borderRadius:12,flexShrink:0}}/>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
          <div className="skeleton" style={{width:130,height:14}}/>
          <div className="skeleton" style={{width:85,height:11}}/>
        </div>
      </div>
      <div className="skeleton" style={{width:'90%',height:14,marginBottom:9}}/>
      <div className="skeleton" style={{width:'72%',height:14,marginBottom:14}}/>
      <div className="skeleton" style={{width:'100%',height:220,borderRadius:12}}/>
    </div>
  );
}

/* ── Post card ────────────────────────────────────────────────── */
function PostCard({ post: init, currentUser, onDelete }) {
  const [post, setPost]             = useState(init);
  const [openComments, setOpen]     = useState(false);
  const [comments, setComments]     = useState([]);
  const [commentText, setCmtText]   = useState('');
  const [loadingCmts, setLdCmts]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [showReact, setShowReact]   = useState(false);
  const [myReaction, setMyReact]    = useState(null);
  const reactTimeout = useRef();
  const isMyPost = post.username === currentUser?.username;

  const toggleLike = async () => {
    const was = post.isLiked;
    setPost(p=>({...p,isLiked:!was,likes_count:was?Math.max(0,p.likes_count-1):p.likes_count+1}));
    try { was ? await postAPI.unlike(post.id) : await postAPI.like(post.id); if(!was) trackTask('like'); }
    catch { setPost(p=>({...p,isLiked:was,likes_count:was?p.likes_count+1:Math.max(0,p.likes_count-1)})); }
  };
  const toggleSave = async () => {
    const was = post.isSaved; setPost(p=>({...p,isSaved:!was}));
    try { was ? await postAPI.unsave(post.id) : await postAPI.save(post.id); }
    catch { setPost(p=>({...p,isSaved:was})); }
  };
  const openCommentSection = async () => {
    setOpen(!openComments);
    if (!openComments && comments.length===0) {
      setLdCmts(true);
      try { setComments((await postAPI.getComments(post.id))||[]); } catch { setComments([]); } finally { setLdCmts(false); }
    }
  };
  const submitComment = async () => {
    if (!commentText.trim()||submitting) return;
    setSubmitting(true); const txt=commentText.trim();
    try {
      await postAPI.addComment(post.id, txt);
      setComments(prev=>[...prev,{id:Date.now(),author:currentUser?.username,username:currentUser?.username,text:txt,time:'Just now'}]);
      setPost(p=>({...p,comments_count:(p.comments_count||0)+1}));
      setCmtText(''); trackTask('comment');
    } catch {} finally { setSubmitting(false); }
  };
  const reactTo = (emoji) => { setMyReact(emoji); setShowReact(false); if(!post.isLiked) toggleLike(); };
  useEffect(() => {
    if (!showMenu&&!showReact) return;
    const h=()=>{setShowMenu(false);setShowReact(false);};
    const t=setTimeout(()=>document.addEventListener('click',h),0);
    return ()=>{clearTimeout(t);document.removeEventListener('click',h);};
  }, [showMenu,showReact]);

  return (
    <article className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.username}`} className="post-author-link">
          <div className="post-av" style={{background:`linear-gradient(135deg,${aC(post.username)},${COLORS[(post.username?.charCodeAt(0)||0+2)%COLORS.length]})`}}>
            {(post.author||post.username||'?').slice(0,2).toUpperCase()}
          </div>
          <div>
            <div className="post-author-name">{post.author||post.username}</div>
            <div className="post-meta">{post.dept?`${post.dept} · `:''}{post.time}</div>
          </div>
        </Link>
        <div style={{position:'relative'}}>
          <button className="post-more" onClick={e=>{e.stopPropagation();setShowMenu(v=>!v);}}><FiMoreHorizontal size={15}/></button>
          {showMenu && (
            <div className="post-dropdown">
              {isMyPost && <button className="post-dropdown-item danger" onClick={async()=>{try{await postAPI.delete(post.id);onDelete(post.id);}catch{}setShowMenu(false);}}>🗑️ Delete</button>}
              <button className="post-dropdown-item" onClick={()=>{navigator.clipboard.writeText(`${location.origin}/profile/${post.username}`);setShowMenu(false);}}>🔗 Copy Link</button>
              <button className="post-dropdown-item" onClick={()=>setShowMenu(false)}>🚩 Report</button>
            </div>
          )}
        </div>
      </div>

      <p className="post-text">{post.content}</p>

      {/* ── Inline Poll ── */}
      {post.poll && <Poll poll={post.poll} currentUser={currentUser?.username} onVote={()=>{}}/>}

      {post.tags?.length>0 && <div className="post-tags">{post.tags.map(t=><span key={t} className="post-tag">{t}</span>)}</div>}

      {post.media && (
        <div className="post-media-wrap">
          {post.mediaType==='video'?<video src={post.media} controls className="post-media"/>:<img src={post.media} alt="" className="post-media" loading="lazy"/>}
        </div>
      )}

      <div className="post-stats">
        <span>{myReaction||''}{myReaction?' ':''}{post.likes_count||0} likes</span>
        <span>{post.comments_count||0} comments</span>
      </div>

      <div className="post-actions">
        <div style={{flex:1,position:'relative'}}>
          <button className={`post-action-btn ${post.isLiked?'liked':''}`} style={{width:'100%',justifyContent:'center'}} onClick={toggleLike}
            onMouseEnter={()=>{clearTimeout(reactTimeout.current);reactTimeout.current=setTimeout(()=>setShowReact(true),400);}}
            onMouseLeave={()=>clearTimeout(reactTimeout.current)}>
            <span style={{fontSize:16}}>{myReaction||(post.isLiked?'❤️':'🤍')}</span><span>Like</span>
          </button>
          {showReact && (
            <div className="reaction-picker" onMouseEnter={()=>clearTimeout(reactTimeout.current)} onMouseLeave={()=>setShowReact(false)}>
              {REACTIONS.map(e=><button key={e} className="reaction-btn" onClick={ev=>{ev.stopPropagation();reactTo(e);}}>{e}</button>)}
            </div>
          )}
        </div>
        <button className="post-action-btn" onClick={openCommentSection}><FiMessageCircle size={15}/><span>Comment</span></button>
        <button className="post-action-btn" onClick={()=>navigator.clipboard.writeText(location.origin)}><FiShare2 size={15}/><span>Share</span></button>
        <button className={`post-action-btn save-btn ${post.isSaved?'saved':''}`} onClick={toggleSave}>
          <FiBookmark size={15} style={post.isSaved?{fill:'#f59e0b',color:'#f59e0b'}:{}}/>
        </button>
      </div>

      {openComments && (
        <div className="comments-section">
          {loadingCmts && <div className="skeleton" style={{width:'100%',height:44,borderRadius:10}}/>}
          {comments.map((c,i)=>(
            <div key={c.id||i} className="comment-item">
              <div className="comment-av" style={{background:`linear-gradient(135deg,${aC(c.author||c.username)},${COLORS[(c.author?.charCodeAt(0)||0+2)%COLORS.length]})`}}>
                {(c.author||c.username||'?').slice(0,2).toUpperCase()}
              </div>
              <div className="comment-bubble">
                <span className="comment-author">{c.author||c.username}</span>
                <span className="comment-text"> {c.text}</span>
              </div>
            </div>
          ))}
          <div className="comment-input-row">
            <div className="comment-av" style={{background:`linear-gradient(135deg,${aC(currentUser?.username)},${COLORS[(currentUser?.username?.charCodeAt(0)||0+2)%COLORS.length]})`}}>
              {(currentUser?.username||'ME').slice(0,2).toUpperCase()}
            </div>
            <input className="comment-input" placeholder="Write a comment…" value={commentText} onChange={e=>setCmtText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&submitComment()}/>
            <button className="comment-send" onClick={submitComment} disabled={submitting||!commentText.trim()}><FiSend size={13}/></button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN HOME FEED
══════════════════════════════════════════════════════════════ */
export default function HomeFeed() {
  const user   = getUser();
  const myName = user?.username || '';

  const [posts,         setPosts]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [feedError,     setFeedError]     = useState('');
  const [text,          setText]          = useState('');
  const [mediaPreview,  setMediaPreview]  = useState(null);
  const [mediaType,     setMediaType]     = useState(null);
  const [posting,       setPosting]       = useState(false);
  const [postError,     setPostError]     = useState('');
  const [events,        setEvents]        = useState([]);
  const [suggested,     setSuggested]     = useState([]);
  const [myStats,       setMyStats]       = useState({ posts:0, followers:0, following:0 });
  const [stories,       setStories]       = useState([]);
  const [storyViewer,   setStoryViewer]   = useState({ open:false, idx:0 });
  const [showAddStory,  setShowAddStory]  = useState(false);
  const [rsvpd,         setRsvpd]         = useState({});

  /* New feature state */
  const [showSnapCamera,  setShowSnapCamera]  = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pendingPoll,     setPendingPoll]     = useState(null);

  const fileRef = useRef();

  const loadStories = useCallback(() => {
    const today = new Date().toDateString();
    const saved = JSON.parse(localStorage.getItem(`cc_stories_${today}`)||'[]');
    const own   = saved.find(s=>s.username===myName&&s.isOwn);
    const others= saved.filter(s=>s.username!==myName);
    setStories([{ id:'own', username:myName, isOwn:true, text:own?.text||'', image:own?.image||null, time:'Your story' }, ...others]);
  }, [myName]);

  const loadFeed = useCallback(async () => {
    setLoading(true); setFeedError('');
    try { const data=await postAPI.getFeed(); setPosts(Array.isArray(data)?data:[]); }
    catch { setFeedError('Cannot load feed — is the server running on port 5000?'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadFeed(); loadStories();
    eventAPI.getAll().then(d=>{ if(Array.isArray(d)) setEvents(d.slice(0,5)); }).catch(()=>{});
    userAPI.getSuggested().then(d=>{ if(Array.isArray(d)) setSuggested(d.slice(0,4)); }).catch(()=>{});
    if (myName) {
      postAPI.getUserPosts(myName).then(d=>setMyStats(p=>({...p,posts:Array.isArray(d)?d.length:0}))).catch(()=>{});
      userAPI.getProfile(myName).then(d=>setMyStats(p=>({...p,followers:d.followers_count||0,following:d.following_count||0}))).catch(()=>{});
    }
  }, [loadFeed, loadStories, myName]);

  const handleFilePick = (e) => {
    const f=e.target.files[0]; if(!f) return;
    setMediaPreview(URL.createObjectURL(f));
    setMediaType(f.type.startsWith('video')?'video':'image');
  };
  const removeMedia = () => { setMediaPreview(null); setMediaType(null); if(fileRef.current) fileRef.current.value=''; };

  /* Snap camera callback — attach captured media to compose */
  const handleSnapCapture = (dataUrl, type) => {
    setMediaPreview(dataUrl);
    setMediaType(type === 'video' ? 'video' : 'image');
    setShowSnapCamera(false);
  };

  const handlePost = async () => {
    if (!text.trim()&&!mediaPreview&&!pendingPoll) return;
    if (!myName) { setPostError('Not logged in. Please refresh.'); return; }
    setPosting(true); setPostError('');
    try {
      const created = await postAPI.create({
        content:   text.trim() || (pendingPoll ? `📊 Poll: ${pendingPoll.question}` : ''),
        media:     mediaPreview||null,
        mediaType: mediaType||null,
        tags:      text.match(/#\w+/g)||[],
      });
      /* Attach poll locally even if API doesn't support it yet */
      if (pendingPoll) created.poll = pendingPoll;
      setPosts(prev=>[created,...prev]);
      setMyStats(p=>({...p,posts:p.posts+1}));
      setText(''); removeMedia(); setPendingPoll(null);
      trackTask('post');
    } catch(e) { setPostError(e.message||'Post failed — check server.'); }
    finally { setPosting(false); }
  };

  const handleStoryClick = (idx) => {
    if (stories[idx]?.isOwn) { setShowAddStory(true); return; }
    const viewable=stories.filter(s=>!s.isOwn&&(s.text||s.image));
    const viewIdx=viewable.findIndex(s=>s.id===stories[idx]?.id);
    if (viewable.length>0&&viewIdx>=0) setStoryViewer({ open:true, stories:viewable, idx:viewIdx });
    else setShowAddStory(true);
  };

  const handleStoryAdded = (story) => {
    setStories(prev=>[{ id:'own', username:myName, isOwn:true, text:story.text, image:story.image, time:'Just now' }, ...prev.filter(s=>!s.isOwn)]);
  };

  const hasContent = text.trim()||mediaPreview||pendingPoll;

  return (
    <div className="feed-root">
      <div className="feed-col">

        {/* Stories */}
        <div className="stories-bar">
          {stories.map((s,i)=>(
            <div key={s.id||s.username} className="story-ring-wrap" onClick={()=>handleStoryClick(i)}>
              <div className={`story-ring ${s.isOwn?'story-ring-own':s.text||s.image?'story-ring-new':'story-ring-empty'}`}>
                <div className="story-ring-av" style={{background:`linear-gradient(135deg,${aC(s.username)},${COLORS[(s.username?.charCodeAt(0)||0+2)%COLORS.length]})`}}>
                  {s.isOwn?<FiPlus size={18} style={{color:'#fff'}}/>:s.username?.slice(0,2).toUpperCase()}
                </div>
              </div>
              <span className="story-ring-label">{s.isOwn?'Add Story':s.username}</span>
            </div>
          ))}
        </div>

        {/* ── Compose card ── */}
        <div className="compose-card">
          <div className="compose-top">
            <Link to="/profile" className="compose-av" style={{background:`linear-gradient(135deg,${aC(myName)},${COLORS[(myName?.charCodeAt(0)||0+2)%COLORS.length]})`,textDecoration:'none',color:'#fff',flexShrink:0}}>
              {myName.slice(0,2).toUpperCase()||'ME'}
            </Link>
            <textarea className="compose-input" placeholder="What's on your mind? Share a project, ask a question…" value={text} onChange={e=>setText(e.target.value)} rows={text.length>80?4:2}/>
          </div>

          {mediaPreview && (
            <div className="media-preview-wrap">
              {mediaType==='video'?<video src={mediaPreview} controls className="media-preview"/>:<img src={mediaPreview} alt="" className="media-preview"/>}
              <button className="media-remove" onClick={removeMedia}><FiX size={12}/></button>
            </div>
          )}

          {/* Poll preview badge */}
          {pendingPoll && (
            <div style={{margin:'0 0 10px',padding:'12px 14px',background:'var(--bg2)',borderRadius:12,border:'1.5px solid var(--border)',position:'relative'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <FiBarChart2 size={13} style={{color:'var(--teal)'}}/>
                <span style={{fontSize:12,fontWeight:700,color:'var(--teal)',textTransform:'uppercase',letterSpacing:'0.6px'}}>Poll attached</span>
                <button onClick={()=>setPendingPoll(null)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:2}}><FiX size={13}/></button>
              </div>
              <p style={{fontSize:14,fontWeight:600,color:'var(--text1)',marginBottom:6}}>{pendingPoll.question}</p>
              {pendingPoll.options.map((o,i)=>(
                <div key={i} style={{fontSize:13,color:'var(--text2)',padding:'5px 10px',background:'var(--surface)',borderRadius:8,marginBottom:4,border:'1px solid var(--border)'}}>
                  {i+1}. {o.label}
                </div>
              ))}
            </div>
          )}

          {postError && <div className="post-error"><FiAlertCircle size={13}/> {postError}</div>}

          <div className="compose-actions">
            <div className="compose-media-btns">
              <input ref={fileRef} type="file" accept="image/*,video/*,.gif" style={{display:'none'}} onChange={handleFilePick}/>

              {/* ★ SNAP CAMERA button */}
              <button
                className="compose-media-btn"
                onClick={() => setShowSnapCamera(true)}
                style={{color:'var(--violet)',borderColor:'rgba(139,92,246,0.35)',background:'rgba(139,92,246,0.08)',fontWeight:700}}
              >
                <FiCamera size={15}/><span>Camera</span>
              </button>

              <button className="compose-media-btn" onClick={()=>fileRef.current?.click()}><FiImage size={15}/><span>Photo</span></button>
              <button className="compose-media-btn" onClick={()=>fileRef.current?.click()}><FiFilm size={15}/><span>Video</span></button>

              {/* ★ POLL button */}
              <button
                className="compose-media-btn"
                onClick={() => setShowPollCreator(true)}
                style={{color:'var(--teal)',borderColor:'rgba(14,165,233,0.35)',background:'rgba(14,165,233,0.08)',fontWeight:700}}
              >
                <FiBarChart2 size={15}/><span>Poll</span>
              </button>

              <button className="compose-media-btn"><FiCode size={15}/><span>Code</span></button>
              <button className="compose-media-btn"><FiSmile size={15}/></button>
            </div>
            <button className={`compose-post-btn ${hasContent?'active':''}`} onClick={handlePost} disabled={posting||!hasContent}>
              {posting?<span className="spin-icon"/>:<><FiSend size={13}/> Post</>}
            </button>
          </div>
        </div>

        {/* Feed */}
        {loading && [1,2,3].map(i=><PostSkeleton key={i}/>)}
        {feedError && (
          <div className="feed-error-card">
            <FiAlertCircle size={20} style={{color:'var(--rose)'}}/>
            <p>{feedError}</p>
            <button className="retry-btn" onClick={loadFeed}><FiRefreshCw size={13}/> Retry</button>
          </div>
        )}
        {!loading&&!feedError&&posts.length===0 && (
          <div className="feed-empty"><div style={{fontSize:48}}>🌱</div><p>No posts yet — be the first to share something!</p></div>
        )}
        {posts.map(post=>(
          <PostCard key={post.id} post={post} currentUser={user} onDelete={id=>setPosts(prev=>prev.filter(p=>p.id!==id))}/>
        ))}
      </div>

      {/* ── Right aside ── */}
      <aside className="feed-aside">

        {/* ★ STREAK BADGE */}
        <div style={{display:'flex',justifyContent:'center'}}>
          <StreakBadge/>
        </div>

        {/* ★ MOOD CHECK-IN */}
        <MoodWidget/>

        {/* Trending */}
        <div className="aside-card">
          <div className="aside-head"><FiTrendingUp size={13} style={{color:'var(--rose)'}}/><span>Trending</span></div>
          <div className="trend-tags">{TRENDING.map(t=><span key={t} className="trend-tag">{t}</span>)}</div>
        </div>

        {/* ★ CAMPUS VIBE METER */}
        <VibeWidget/>

        {events.length>0 && (
          <div className="aside-card">
            <div className="aside-head"><FiCalendar size={13} style={{color:'var(--teal)'}}/><span>Upcoming Events</span></div>
            {events.map(ev=>(
              <div key={ev.id} className="event-row">
                <span className="event-icon">{ev.icon||'📅'}</span>
                <div className="event-info">
                  <span className="event-name">{ev.name}</span>
                  {ev.club&&<span className="event-club" style={{color:ev.color||'var(--accent)'}}>{ev.club}</span>}
                  <span className="event-date">{ev.date}</span>
                </div>
                <button
                  className="event-rsvp"
                  style={{borderColor:ev.color||'var(--accent)',color:rsvpd[ev.id]?'#fff':(ev.color||'var(--accent)'),background:rsvpd[ev.id]?(ev.color||'var(--accent)'):'transparent'}}
                  onClick={()=>setRsvpd(p=>({...p,[ev.id]:!p[ev.id]}))}
                >
                  {rsvpd[ev.id]?'✓ RSVP\'d':'RSVP'}
                </button>
              </div>
            ))}
          </div>
        )}

        {suggested.length>0 && (
          <div className="aside-card">
            <div className="aside-head"><FiAward size={13} style={{color:'var(--violet)'}}/><span>People You May Know</span></div>
            {suggested.map(p=><SuggestCard key={p.username} person={p} onFollowed={u=>setSuggested(prev=>prev.filter(x=>x.username!==u))}/>)}
          </div>
        )}

        <div className="aside-card">
          <div className="aside-head"><FiZap size={13} style={{color:'var(--amber)'}}/><span>Your Activity</span></div>
          <div className="stats-grid">
            {[{label:'Posts',val:myStats.posts,color:'var(--accent)'},{label:'Followers',val:myStats.followers,color:'var(--violet)'},{label:'Following',val:myStats.following,color:'var(--teal)'}].map(s=>(
              <div key={s.label} className="stat-tile">
                <span className="stat-val" style={{color:s.color}}>{s.val}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          ALL MODALS — rendered here so they overlay the page
      ══════════════════════════════════════════════════════ */}

      {/* ★ SNAP CAMERA — opens when Camera button clicked */}
      {showSnapCamera && (
        <SnapCamera
          username={myName}
          onClose={() => setShowSnapCamera(false)}
          onCapture={handleSnapCapture}
        />
      )}

      {/* ★ POLL CREATOR — opens when Poll button clicked */}
      {showPollCreator && (
        <PollCreator
          onSave={(poll) => { setPendingPoll(poll); setShowPollCreator(false); }}
          onClose={() => setShowPollCreator(false)}
        />
      )}

      {storyViewer.open && (
        <StoryViewer stories={storyViewer.stories} startIndex={storyViewer.idx} onClose={()=>setStoryViewer({open:false,idx:0})}/>
      )}
      {showAddStory && (
        <AddStoryModal username={myName} onClose={()=>setShowAddStory(false)} onAdd={handleStoryAdded}/>
      )}
    </div>
  );
}

/* ── Suggest card ─────────────────────────────────────────────── */
function SuggestCard({ person, onFollowed }) {
  const [following, setFollowing] = useState(false);
  const [checking,  setChecking]  = useState(true);
  useEffect(() => {
    userAPI.isFollowing(person.username).then(d=>setFollowing(d.following||false)).catch(()=>setFollowing(false)).finally(()=>setChecking(false));
  }, [person.username]);
  const toggle = async () => {
    const was=following; setFollowing(!was);
    try { was?await userAPI.unfollow(person.username):await userAPI.follow(person.username); if(!was){trackTask('follow');setTimeout(()=>onFollowed?.(person.username),700);} }
    catch { setFollowing(was); }
  };
  return (
    <div className="suggest-row">
      <Link to={`/profile/${person.username}`} className="suggest-info">
        <div className="suggest-av" style={{background:`linear-gradient(135deg,${aC(person.username)},${COLORS[(person.username?.charCodeAt(0)||0+2)%COLORS.length]})`}}>
          {person.username.slice(0,2).toUpperCase()}
        </div>
        <div><div className="suggest-name">{person.username}</div><div className="suggest-sub">{person.department?.split(' ')[0]||'Student'}</div></div>
      </Link>
      <button className={`suggest-btn ${following?'following':''}`} onClick={toggle} disabled={checking} style={{minWidth:78}}>
        {checking?'…':following?'✓ Following':<><FiUserPlus size={11}/> Follow</>}
      </button>
    </div>
  );
}