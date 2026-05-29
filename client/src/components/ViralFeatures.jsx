import React, { useState, useEffect, useRef } from 'react';
import {
  FiBarChart2, FiPlus, FiX, FiCheck, FiZap, FiUsers,
  FiTrendingUp, FiRefreshCw, FiThumbsUp,
} from 'react-icons/fi';

const COLORS = ['#4f61d2','#0ea5e9','#8b5cf6','#f43f5e','#10b981','#f59e0b','#ec4899','#f97316'];
const aC = (n) => COLORS[(n?.charCodeAt(0)||0) % COLORS.length];

/* ══════════════════════════════════════════════════════════
   1. POLL RENDERER
══════════════════════════════════════════════════════════ */
export function Poll({ poll, currentUser, onVote }) {
  const total    = poll.options.reduce((a,o)=>a+(o.votes||0),0);
  const userVote = poll.options.findIndex(o=>(o.voters||[]).includes(currentUser));
  const [localVote, setLocalVote] = useState(userVote);
  const [localOpts, setLocalOpts] = useState(poll.options);

  const vote=(idx)=>{
    if(localVote!==-1) return;
    const updated=localOpts.map((o,i)=>i===idx?{...o,votes:(o.votes||0)+1,voters:[...(o.voters||[]),currentUser]}:o);
    setLocalOpts(updated); setLocalVote(idx); onVote?.(poll.id,idx);
  };

  return (
    <div style={PS.wrap}>
      <div style={PS.hdr}>
        <FiBarChart2 size={13} style={{color:'var(--accent)'}}/>
        <span style={PS.hdrTxt}>Poll</span>
        {poll.endsIn&&<span style={PS.timer}>⏱ {poll.endsIn}</span>}
      </div>
      <p style={PS.q}>{poll.question}</p>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:12}}>
        {localOpts.map((opt,i)=>{
          const pct=total>0?Math.round((opt.votes||0)/total*100):0;
          const voted=localVote===i;
          const show=localVote!==-1;
          return (
            <button key={i} onClick={()=>vote(i)} disabled={show} style={{...PS.opt,...(voted?PS.optVoted:{}),...(show?{cursor:'default'}:{cursor:'pointer'}),position:'relative',overflow:'hidden'}}>
              {show&&<div style={{position:'absolute',left:0,top:0,bottom:0,width:`${pct}%`,background:voted?'rgba(79,97,210,0.18)':'rgba(79,97,210,0.07)',transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)',borderRadius:'inherit'}}/>}
              <span style={{position:'relative',flex:1,textAlign:'left',fontSize:13,fontWeight:600,color:'var(--text1)'}}>{opt.label}</span>
              {show&&<span style={{position:'relative',fontSize:12,fontWeight:700,color:voted?'var(--accent)':'var(--text3)'}}>{pct}%{voted&&' ✓'}</span>}
            </button>
          );
        })}
      </div>
      <div style={PS.footer}><FiUsers size={11}/> {total} votes · {poll.endsIn?`Ends ${poll.endsIn}`:'Open poll'}</div>
    </div>
  );
}

const PS={
  wrap:{background:'var(--bg2)',border:'1.5px solid var(--border)',borderRadius:14,padding:'14px 16px',margin:'8px 16px'},
  hdr:{display:'flex',alignItems:'center',gap:6,marginBottom:6},
  hdrTxt:{fontSize:11,fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.6px'},
  timer:{marginLeft:'auto',fontSize:11,color:'var(--text3)',background:'var(--bg3)',padding:'2px 8px',borderRadius:10},
  q:{fontSize:15,fontWeight:700,color:'var(--text1)',lineHeight:1.4},
  opt:{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,background:'var(--surface)',border:'1.5px solid var(--border)',width:'100%',transition:'all 0.15s',textAlign:'left'},
  optVoted:{borderColor:'var(--accent)',boxShadow:'0 0 0 3px var(--glow)'},
  footer:{display:'flex',alignItems:'center',gap:5,marginTop:10,fontSize:11.5,color:'var(--text3)'},
};

/* ══════════════════════════════════════════════════════════
   2. POLL CREATOR
══════════════════════════════════════════════════════════ */
export function PollCreator({ onSave, onClose }) {
  const [question,setQuestion]=useState('');
  const [options,setOptions]=useState(['','']);
  const addOpt=()=>options.length<4&&setOptions([...options,'']);
  const setOpt=(i,v)=>setOptions(options.map((o,idx)=>idx===i?v:o));
  const removeOpt=(i)=>options.length>2&&setOptions(options.filter((_,idx)=>idx!==i));
  const save=()=>{
    if(!question.trim()||options.filter(o=>o.trim()).length<2) return;
    onSave({question:question.trim(),options:options.filter(o=>o.trim()).map(label=>({label,votes:0,voters:[]})),endsIn:'24h'});
    onClose();
  };
  return (
    <div style={PC.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={PC.box}>
        <div style={PC.head}>
          <FiBarChart2 size={16} style={{color:'var(--accent)'}}/>
          <span style={{fontWeight:700,fontSize:15,color:'var(--text1)'}}>Create Poll</span>
          <button onClick={onClose} style={PC.closeBtn}><FiX size={14}/></button>
        </div>
        <div style={PC.body}>
          <input style={PC.input} placeholder="Ask something…" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={100}/>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
            {options.map((opt,i)=>(
              <div key={i} style={{display:'flex',gap:7,alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:700,color:'var(--text3)',width:16}}>{i+1}.</span>
                <input style={{...PC.input,margin:0,flex:1}} placeholder={`Option ${i+1}`} value={opt} onChange={e=>setOpt(i,e.target.value)} maxLength={50}/>
                {options.length>2&&<button onClick={()=>removeOpt(i)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer'}}><FiX size={13}/></button>}
              </div>
            ))}
          </div>
          {options.length<4&&<button onClick={addOpt} style={PC.addOpt}><FiPlus size={12}/> Add Option</button>}
        </div>
        <div style={PC.foot}>
          <button onClick={onClose} style={PC.cancelBtn}>Cancel</button>
          <button onClick={save} style={PC.saveBtn} disabled={!question.trim()||options.filter(o=>o.trim()).length<2}>
            <FiBarChart2 size={13}/> Create Poll
          </button>
        </div>
      </div>
    </div>
  );
}

const PC={
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'},
  box:{background:'var(--surface)',borderRadius:18,width:360,boxShadow:'var(--shadow-xl)',overflow:'hidden'},
  head:{display:'flex',alignItems:'center',gap:8,padding:'14px 16px',borderBottom:'1px solid var(--border)'},
  closeBtn:{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'var(--text2)',padding:4,borderRadius:6},
  body:{padding:'16px'},
  foot:{display:'flex',gap:8,padding:'12px 16px',borderTop:'1px solid var(--border)'},
  input:{width:'100%',background:'var(--bg2)',border:'1.5px solid var(--border)',borderRadius:10,padding:'9px 12px',fontSize:13.5,color:'var(--text1)',outline:'none',fontFamily:'var(--font)',transition:'border-color 0.2s',boxSizing:'border-box'},
  addOpt:{marginTop:10,display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'none',border:'1.5px dashed var(--border2)',borderRadius:9,color:'var(--accent)',fontSize:12.5,fontWeight:600,cursor:'pointer',width:'100%',justifyContent:'center'},
  cancelBtn:{flex:1,padding:'9px',borderRadius:10,background:'var(--bg2)',border:'none',color:'var(--text2)',fontSize:13,fontWeight:600,cursor:'pointer'},
  saveBtn:{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'9px',borderRadius:10,background:'var(--accent)',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'},
};

/* ══════════════════════════════════════════════════════════
   3. MOOD CHECK-IN WIDGET
══════════════════════════════════════════════════════════ */
const MOODS=[
  {emoji:'😄',label:'Excited', color:'#fbbf24'},
  {emoji:'😊',label:'Happy',   color:'#34d399'},
  {emoji:'😐',label:'Neutral', color:'#94a3b8'},
  {emoji:'😴',label:'Tired',   color:'#818cf8'},
  {emoji:'😤',label:'Stressed',color:'#f97316'},
  {emoji:'🔥',label:'Grinding',color:'#ef4444'},
];

export function MoodWidget() {
  const [selected,setSelected]=useState(null);
  const [saved,setSaved]=useState(false);
  const today=new Date().toDateString();
  useEffect(()=>{ const s=localStorage.getItem(`cc_mood_${today}`); if(s){setSelected(s);setSaved(true);} },[today]);
  const pick=(emoji)=>{ setSelected(emoji); setSaved(true); localStorage.setItem(`cc_mood_${today}`,emoji); window.dispatchEvent(new CustomEvent('moodUpdated',{detail:emoji})); };
  return (
    <div style={MW.wrap}>
      <div style={MW.head}><FiZap size={13} style={{color:'var(--amber)'}}/><span>How are you feeling today?</span></div>
      {saved&&selected?(
        <div style={MW.saved}>
          <span style={{fontSize:30}}>{selected}</span>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:13,color:'var(--text1)',fontWeight:600}}>Vibe set ✓</div>
            <button style={MW.changeBtn} onClick={()=>{setSaved(false);setSelected(null);}}>Change</button>
          </div>
        </div>
      ):(
        <div style={MW.grid}>
          {MOODS.map(m=>(
            <button key={m.emoji} onClick={()=>pick(m.emoji)} style={MW.moodBtn} title={m.label}>
              <span style={{fontSize:22}}>{m.emoji}</span>
              <span style={{fontSize:9.5,color:'var(--text3)',fontWeight:600}}>{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MW={
  wrap:{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:14,boxShadow:'var(--shadow-sm)'},
  head:{display:'flex',alignItems:'center',gap:7,fontSize:13,fontWeight:700,color:'var(--text1)',marginBottom:10},
  grid:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7},
  moodBtn:{display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'var(--bg2)',border:'1.5px solid var(--border)',borderRadius:12,padding:'9px 6px',cursor:'pointer',transition:'all 0.15s'},
  saved:{display:'flex',alignItems:'center',gap:12,padding:'4px 0'},
  changeBtn:{fontSize:11,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontWeight:600,marginTop:2},
};

/* ══════════════════════════════════════════════════════════
   4. CAMPUS VIBE WIDGET — with live polling
══════════════════════════════════════════════════════════ */
const VIBE_KEY = 'cc_campus_vibe_votes';
const VIBE_USER_KEY = 'cc_campus_vibe_my_vote';

const DEFAULT_VIBES = [
  { id:'study',   label:'Studying hard', emoji:'📚', votes:38 },
  { id:'canteen', label:'At canteen',    emoji:'🍕', votes:24 },
  { id:'events',  label:'At events',     emoji:'🎉', votes:15 },
  { id:'gaming',  label:'Gaming',        emoji:'🎮', votes:12 },
  { id:'chilling',label:'Chilling',      emoji:'😴', votes:8  },
  { id:'gym',     label:'At gym',        emoji:'💪', votes:6  },
];

export function VibeWidget() {
  const [vibes,    setVibes]    = useState(()=>{
    try{return JSON.parse(localStorage.getItem(VIBE_KEY))||DEFAULT_VIBES;}catch{return DEFAULT_VIBES;}
  });
  const [myVote,   setMyVote]   = useState(()=>localStorage.getItem(VIBE_USER_KEY)||null);
  const [showPoll, setShowPoll] = useState(false);
  const [animId,   setAnimId]   = useState(null);

  const total = vibes.reduce((a,v)=>a+v.votes,0);

  const vote=(id)=>{
    if(myVote) return;
    const updated=vibes.map(v=>v.id===id?{...v,votes:v.votes+1}:v);
    setVibes(updated);
    setMyVote(id);
    setAnimId(id);
    localStorage.setItem(VIBE_KEY,JSON.stringify(updated));
    localStorage.setItem(VIBE_USER_KEY,id);
    setTimeout(()=>setAnimId(null),600);
  };

  const reset=()=>{
    setVibes(DEFAULT_VIBES);
    setMyVote(null);
    localStorage.removeItem(VIBE_KEY);
    localStorage.removeItem(VIBE_USER_KEY);
  };

  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:14,boxShadow:'var(--shadow-sm)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:7,fontSize:13,fontWeight:700,color:'var(--text1)'}}>
          <FiTrendingUp size={13} style={{color:'var(--rose)'}}/> Campus Vibe Now
        </div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>setShowPoll(v=>!v)} title="Vote" style={{fontSize:10,fontWeight:700,color:'var(--accent)',background:'rgba(79,97,210,0.08)',border:'1px solid rgba(79,97,210,0.2)',borderRadius:8,padding:'3px 8px',cursor:'pointer'}}>
            {showPoll?'Hide':'Vote'}
          </button>
          <button onClick={reset} title="Reset" style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:3}}><FiRefreshCw size={11}/></button>
        </div>
      </div>

      {/* Poll mode — tap to vote */}
      {showPoll?(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:8}}>
          {vibes.map(v=>{
            const pct=total>0?Math.round(v.votes/total*100):0;
            const isMyVote=myVote===v.id;
            const hasVoted=!!myVote;
            return (
              <button key={v.id} onClick={()=>vote(v.id)} disabled={hasVoted} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'10px 8px',borderRadius:12,border:`1.5px solid ${isMyVote?'var(--accent)':'var(--border)'}`,background:isMyVote?'rgba(79,97,210,0.08)':'var(--bg2)',cursor:hasVoted?'default':'pointer',position:'relative',overflow:'hidden',transition:'all 0.2s',transform:animId===v.id?'scale(0.95)':'scale(1)'}}>
                {hasVoted&&<div style={{position:'absolute',bottom:0,left:0,height:3,width:`${pct}%`,background:isMyVote?'var(--accent)':'rgba(79,97,210,0.2)',transition:'width 0.6s ease',borderRadius:2}}/>}
                <span style={{fontSize:20}}>{v.emoji}</span>
                <span style={{fontSize:10.5,fontWeight:600,color:isMyVote?'var(--accent)':'var(--text2)',textAlign:'center',lineHeight:1.2}}>{v.label}</span>
                {hasVoted&&<span style={{fontSize:10,fontWeight:700,color:isMyVote?'var(--accent)':'var(--text3)'}}>{pct}%</span>}
                {isMyVote&&<span style={{position:'absolute',top:5,right:5,fontSize:10}}>✓</span>}
              </button>
            );
          })}
        </div>
      ):(
        /* Bar chart mode */
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:8}}>
          {vibes.map(v=>{
            const pct=total>0?Math.round(v.votes/total*100):0;
            return (
              <div key={v.id} style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:15,width:20,textAlign:'center',flexShrink:0}}>{v.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:11.5,color:'var(--text2)',fontWeight:500}}>{v.label}</span>
                    <span style={{fontSize:11,fontWeight:700,color:'var(--text1)'}}>{v.votes}</span>
                  </div>
                  <div style={{height:5,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:3,background:'linear-gradient(90deg,var(--accent),var(--violet))',width:`${pct}%`,transition:'width 1s ease'}}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{fontSize:11,color:'var(--text3)',textAlign:'center',marginTop:4}}>
        {myVote?'Thanks for voting! 🎉':`${total} students responded · Tap Vote to join`}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   5. STREAK BADGE
══════════════════════════════════════════════════════════ */
export function StreakBadge() {
  const streak=(()=>{
    try{
      let c=0;
      const today=new Date();
      for(let i=0;i<30;i++){
        const d=new Date(today); d.setDate(d.getDate()-i);
        const tasks=JSON.parse(localStorage.getItem(`cc_tasks_${d.toDateString()}`)||'[]');
        if(tasks.length>0) c++; else if(i>0) break;
      }
      return c;
    }catch{return 0;}
  })();
  if(streak<2) return null;
  const level=streak>=14?'🏆 Legend':streak>=7?'💎 Elite':streak>=3?'⚡ Rising':'🔥 Streak';
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'linear-gradient(135deg,#f97316,#ef4444)',color:'#fff',fontWeight:800,fontSize:12.5,padding:'7px 14px',borderRadius:20,boxShadow:'0 4px 14px rgba(249,115,22,0.4)',animation:'float 3s ease infinite',width:'fit-content'}}>
      {level}: {streak} days!
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   6. FLOATING REACTION BAR (for posts/stories)
══════════════════════════════════════════════════════════ */
export function FloatingReactions({ onReact, position='bottom' }) {
  const reacts=['❤️','🔥','😂','😮','👏','💯','🎉','👍'];
  return (
    <div style={{display:'flex',gap:4,padding:'6px 10px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:30,boxShadow:'var(--shadow-md)',animation:'fadeUp 0.15s ease'}}>
      {reacts.map(r=>(
        <button key={r} onClick={()=>onReact(r)} style={{fontSize:20,background:'none',border:'none',cursor:'pointer',padding:'2px 4px',borderRadius:8,lineHeight:1,transition:'transform 0.12s'}}
          onMouseEnter={e=>e.currentTarget.style.transform='scale(1.4)'}
          onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>{r}</button>
      ))}
    </div>
  );
}