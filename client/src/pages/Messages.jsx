import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSend, FiPhone, FiVideo, FiMoreVertical, FiSmile,
  FiSearch, FiCheck, FiMessageSquare, FiRefreshCw, FiX,
  FiCamera, FiImage, FiMic, FiMicOff, FiPhoneOff, FiVideoOff,
  FiCheckCircle, FiClock, FiWifi,
} from 'react-icons/fi';
import { socket } from '../socket';
import { messageAPI, userAPI } from '../api';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const COLORS  = ['#4f61d2','#0ea5e9','#8b5cf6','#f43f5e','#10b981','#f59e0b','#ec4899','#f97316'];
const aC      = (n) => COLORS[(n?.charCodeAt(0)||0) % COLORS.length];
const nowStr  = () => new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

const formatLastSeen = (ts) => {
  if (!ts) return 'Offline';
  const d = Date.now() - ts;
  if (d < 60000)    return 'Just now';
  if (d < 3600000)  return `${Math.floor(d/60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d/3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
};

const markMessageTask = () => {
  try {
    const done = JSON.parse(localStorage.getItem('cc_done_tasks')||'[]');
    if (!done.includes('message')) localStorage.setItem('cc_done_tasks', JSON.stringify([...done,'message']));
  } catch {}
};

const DoubleCheck = () => (
  <span style={{ display:'inline-flex', alignItems:'center', opacity:0.7 }}>
    <FiCheck size={10} style={{ marginRight:-4 }}/><FiCheck size={10}/>
  </span>
);

function Skel({ w='100%', h=14 }) {
  return <div style={{ width:w, height:h, borderRadius:6, background:'var(--bg3)', backgroundImage:'linear-gradient(90deg,var(--bg3) 25%,var(--bg2) 50%,var(--bg3) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s ease infinite' }}/>;
}

/* ── Online status pill ───────────────────────────────────────── */
function OnlineStatus({ isOnline, lastSeen, size='md' }) {
  const fs = size==='sm' ? 10 : 11.5;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <div style={{ width: size==='sm'?7:9, height: size==='sm'?7:9, borderRadius:'50%', background:isOnline?'#34d399':'#6b7280', boxShadow:isOnline?'0 0 6px rgba(52,211,153,0.7)':'none', flexShrink:0, transition:'all 0.3s' }}/>
      <span style={{ fontSize:fs, color:isOnline?'#34d399':'var(--text3)', fontWeight:600 }}>
        {isOnline ? 'Online now' : lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Offline'}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SNAP CAMERA — inline (no external import needed)
══════════════════════════════════════════════════════════ */
const CAM_FILTERS = [
  { id:'normal',  label:'Normal', css:'none' },
  { id:'vivid',   label:'Vivid',  css:'saturate(2) contrast(1.15)' },
  { id:'golden',  label:'Golden', css:'sepia(0.5) saturate(1.5) brightness(1.1)' },
  { id:'cool',    label:'Cool',   css:'hue-rotate(180deg) saturate(1.4)' },
  { id:'noir',    label:'Noir',   css:'grayscale(1) contrast(1.3)' },
  { id:'neon',    label:'Neon',   css:'saturate(3) brightness(0.85) contrast(1.3)' },
  { id:'warm',    label:'Warm',   css:'sepia(0.35) saturate(1.5)' },
  { id:'drama',   label:'Drama',  css:'contrast(1.6) brightness(0.85)' },
];

function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(); const canvasRef = useRef(); const streamRef = useRef();
  const recRef   = useRef(); const chunksRef = useRef([]); const timerRef = useRef();
  const [filter,    setFilter]    = useState('normal');
  const [mode,      setMode]      = useState('photo');
  const [facing,    setFacing]    = useState('user');
  const [recording, setRecording] = useState(false);
  const [captured,  setCaptured]  = useState(null);
  const [capType,   setCapType]   = useState(null);
  const [recSecs,   setRecSecs]   = useState(0);
  const [flash,     setFlash]     = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [muted,     setMuted]     = useState(false);
  const [countdown, setCountdown] = useState(null);
  const css = CAM_FILTERS.find(f=>f.id===filter)?.css||'none';

  const startCam = useCallback(async () => {
    setLoading(true);
    try {
      streamRef.current?.getTracks().forEach(t=>t.stop());
      const s = await navigator.mediaDevices.getUserMedia({ video:{facingMode:facing}, audio:true });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject=s; videoRef.current.onloadeddata=()=>setLoading(false); }
    } catch { setLoading(false); }
  }, [facing]);

  useEffect(()=>{ startCam(); return()=>streamRef.current?.getTracks().forEach(t=>t.stop()); },[startCam]);
  useEffect(()=>{ streamRef.current?.getAudioTracks().forEach(t=>{t.enabled=!muted;}); },[muted]);

  const snap = () => {
    const c=canvasRef.current, v=videoRef.current; if(!c||!v) return;
    c.width=v.videoWidth||640; c.height=v.videoHeight||480;
    const ctx=c.getContext('2d');
    if (facing==='user') { ctx.translate(c.width,0); ctx.scale(-1,1); }
    ctx.filter=css; ctx.drawImage(v,0,0,c.width,c.height);
    setFlash(true); setTimeout(()=>setFlash(false),180);
    setCaptured(c.toDataURL('image/jpeg',0.92)); setCapType('photo');
  };

  const snapWithTimer=()=>{
    let c=3; setCountdown(c);
    const iv=setInterval(()=>{ c--; if(c>0) setCountdown(c); else{clearInterval(iv);setCountdown(null);snap();} },1000);
  };

  const startRec=()=>{
    chunksRef.current=[];
    recRef.current=new MediaRecorder(streamRef.current,{mimeType:'video/webm;codecs=vp8,opus'});
    recRef.current.ondataavailable=e=>e.data.size>0&&chunksRef.current.push(e.data);
    recRef.current.onstop=()=>{ const url=URL.createObjectURL(new Blob(chunksRef.current,{type:'video/webm'})); setCaptured(url); setCapType('video'); setRecSecs(0); };
    recRef.current.start(100); setRecording(true);
    timerRef.current=setInterval(()=>setRecSecs(s=>s+1),1000);
  };
  const stopRec=()=>{ recRef.current?.stop(); setRecording(false); clearInterval(timerRef.current); };
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={CM.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={CM.box}>
        <div style={CM.hdr}>
          <button style={CM.gb} onClick={onClose}><FiX size={16}/></button>
          <span style={{color:'#fff',fontWeight:700,fontSize:14}}>📷 Camera</span>
          <div style={{display:'flex',gap:6}}>
            <button style={CM.gb} onClick={()=>setMuted(v=>!v)}>{muted?<FiMicOff size={13}/>:<FiMic size={13}/>}</button>
            <button style={CM.gb} onClick={()=>setFacing(f=>f==='user'?'environment':'user')}><FiRefreshCw size={13}/></button>
          </div>
        </div>
        <div style={CM.vf}>
          {loading&&<div style={CM.loadBox}><div style={CM.spin}/></div>}
          {flash&&<div style={{position:'absolute',inset:0,background:'#fff',zIndex:10,opacity:0.9}}/>}
          {countdown!==null&&<div style={CM.cd}>{countdown}</div>}
          {recording&&<div style={CM.recBadge}><span style={CM.recDot}/>{fmt(recSecs)}</div>}
          {!captured
            ?<video ref={videoRef} autoPlay muted playsInline style={{width:'100%',height:'100%',objectFit:'cover',filter:css,transform:facing==='user'?'scaleX(-1)':'none',opacity:loading?0:1,transition:'opacity 0.3s'}}/>
            :capType==='video'
              ?<video src={captured} controls autoPlay loop style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              :<img src={captured} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          }
          <canvas ref={canvasRef} style={{display:'none'}}/>
        </div>
        {!captured&&(
          <div style={CM.filtersRow}>
            {CAM_FILTERS.map(f=>(
              <button key={f.id} onClick={()=>setFilter(f.id)} style={{...CM.fc,...(filter===f.id?CM.fcOn:{})}}>{f.label}</button>
            ))}
          </div>
        )}
        {!captured?(
          <div style={CM.controls}>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <button onClick={()=>setMode('photo')} style={{...CM.mb,...(mode==='photo'?CM.mbOn:{})}}>📸 Photo</button>
              <button onClick={()=>setMode('video')} style={{...CM.mb,...(mode==='video'?CM.mbOn:{})}}>🎥 Video</button>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              {mode==='photo'&&<button onClick={snapWithTimer} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'rgba(255,255,255,0.7)'}}>⏱</button>}
              <button style={{...CM.shutter,...(recording?CM.shutterRec:{})}} onClick={mode==='photo'?snap:recording?stopRec:startRec}>
                <div style={{...CM.shutterIn,...(recording?{borderRadius:4,width:22,height:22}:{})}}/>
              </button>
              <div style={{width:32}}/>
            </div>
          </div>
        ):(
          <div style={{display:'flex',gap:10,padding:'12px 14px',background:'rgba(0,0,0,0.9)'}}>
            <button style={CM.retake} onClick={()=>setCaptured(null)}>↩ Retake</button>
            <button style={CM.sendBtn} onClick={()=>{onCapture(captured,capType);onClose();}}>Send ✈️</button>
          </div>
        )}
      </div>
    </div>
  );
}
const CM={
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'},
  box:{width:'min(390px,100vw)',background:'#000',borderRadius:20,overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,0.8)',display:'flex',flexDirection:'column'},
  hdr:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'rgba(255,255,255,0.05)'},
  gb:{width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,0.4)',border:'1.5px solid rgba(255,255,255,0.2)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'},
  vf:{width:'100%',height:280,position:'relative',overflow:'hidden',background:'#111'},
  loadBox:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:5},
  spin:{width:30,height:30,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.15)',borderTopColor:'#fff',animation:'spin 0.8s linear infinite'},
  cd:{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontSize:72,fontWeight:900,color:'#fff',textShadow:'0 0 30px rgba(255,255,255,0.5)',zIndex:10},
  recBadge:{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',display:'flex',alignItems:'center',gap:6,background:'rgba(0,0,0,0.6)',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:700,color:'#fff',zIndex:5},
  recDot:{width:7,height:7,borderRadius:'50%',background:'#ef4444',animation:'pulse-dot 1s infinite'},
  filtersRow:{display:'flex',gap:6,padding:'8px 10px',overflowX:'auto',scrollbarWidth:'none',background:'rgba(0,0,0,0.85)'},
  fc:{flexShrink:0,padding:'4px 10px',borderRadius:20,border:'1.5px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.6)',fontSize:11,fontWeight:600,cursor:'pointer'},
  fcOn:{borderColor:'#818cf8',color:'#818cf8',background:'rgba(129,140,248,0.15)'},
  controls:{background:'rgba(0,0,0,0.9)',padding:'10px 16px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:4},
  mb:{padding:'5px 14px',borderRadius:20,border:'1.5px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:600,cursor:'pointer'},
  mbOn:{background:'rgba(255,255,255,0.15)',borderColor:'rgba(255,255,255,0.5)',color:'#fff'},
  shutter:{width:58,height:58,borderRadius:'50%',background:'transparent',border:'4px solid #fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'},
  shutterRec:{border:'4px solid #ef4444'},
  shutterIn:{width:44,height:44,borderRadius:'50%',background:'#fff',transition:'all 0.2s'},
  retake:{flex:1,padding:'9px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.2)',background:'transparent',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'},
  sendBtn:{flex:2,padding:'9px',borderRadius:10,background:'linear-gradient(135deg,#4f61d2,#8b5cf6)',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'},
};

/* ── Wallpaper picker ─────────────────────────────────────────── */
const WALLPAPERS=[
  {id:'default', label:'Default',  preview:'var(--bg)',  bg:'var(--bg)'},
  {id:'midnight',label:'Midnight', preview:'#1e1b4b',   bg:'linear-gradient(160deg,#0f172a,#1e1b4b)'},
  {id:'aurora',  label:'Aurora',   preview:'#047857',   bg:'linear-gradient(160deg,#064e3b,#047857)'},
  {id:'sunset',  label:'Sunset',   preview:'#c2410c',   bg:'linear-gradient(160deg,#7c2d12,#c2410c)'},
  {id:'ocean',   label:'Ocean',    preview:'#0284c7',   bg:'linear-gradient(160deg,#0c4a6e,#0284c7)'},
  {id:'violet',  label:'Violet',   preview:'#7c3aed',   bg:'linear-gradient(160deg,#4c1d95,#7c3aed)'},
  {id:'rose',    label:'Rose',     preview:'#e11d48',   bg:'linear-gradient(160deg,#881337,#e11d48)'},
  {id:'dots',    label:'Dots',     preview:'#eef1fb',   bg:'radial-gradient(circle,rgba(79,97,210,0.15) 1px,transparent 1px) var(--bg)'},
];
function WallpaperPicker({ current, onSelect, onClose }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:8000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'var(--surface)',borderRadius:16,width:320,boxShadow:'var(--shadow-xl)',overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 15px',borderBottom:'1px solid var(--border)'}}>
          <span style={{fontWeight:700,fontSize:14,color:'var(--text1)'}}>🎨 Chat Wallpaper</span>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text2)',padding:4,borderRadius:6}}><FiX size={14}/></button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,padding:14}}>
          {WALLPAPERS.map(w=>(
            <div key={w.id} onClick={()=>{onSelect(w.id);onClose();}} style={{cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{width:52,height:52,borderRadius:12,background:w.preview,border:current===w.id?'2.5px solid var(--accent)':'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
                {current===w.id&&<FiCheckCircle size={16} style={{color:'#fff'}}/>}
              </div>
              <span style={{fontSize:9.5,color:'var(--text3)',fontWeight:600}}>{w.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Call modal ───────────────────────────────────────────────── */
function CallModal({ type, withUser, onEnd }) {
  const [secs,setSeconds]=useState(0);
  const [muted,setMuted]=useState(false);
  useEffect(()=>{ const iv=setInterval(()=>setSeconds(s=>s+1),1000); return()=>clearInterval(iv); },[]);
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:9500,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:290,borderRadius:28,background:'linear-gradient(160deg,#1e1b4b,#312e81)',padding:36,display:'flex',flexDirection:'column',alignItems:'center',gap:20,position:'relative',overflow:'hidden',boxShadow:'0 40px 80px rgba(0,0,0,0.8)'}}>
        {[140,200,260].map((sz,i)=>(
          <div key={i} style={{position:'absolute',width:sz,height:sz,borderRadius:'50%',border:'1.5px solid rgba(148,163,255,0.2)',top:'50%',left:'50%',transform:'translate(-50%,-70%)',animation:`callRing 2.5s ease-out ${i*0.5}s infinite'`}}/>
        ))}
        <div style={{width:78,height:78,borderRadius:22,background:aC(withUser),display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',border:'3px solid rgba(255,255,255,0.2)',position:'relative',zIndex:2}}>
          {withUser?.slice(0,2).toUpperCase()}
        </div>
        <div style={{textAlign:'center',position:'relative',zIndex:2}}>
          <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>{withUser}</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginTop:4}}>{type==='video'?'📹 Video':'📞 Voice'} · {fmt(secs)}</div>
        </div>
        <div style={{display:'flex',gap:12,position:'relative',zIndex:2}}>
          <button onClick={()=>setMuted(v=>!v)} style={{width:50,height:50,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'2px solid rgba(255,255,255,0.2)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <FiMic size={18} style={{opacity:muted?0.3:1}}/>
          </button>
          <button onClick={onEnd} style={{width:50,height:50,borderRadius:'50%',background:'#ef4444',border:'2px solid #ef4444',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <FiPhoneOff size={18}/>
          </button>
          {type==='video'&&<button style={{width:50,height:50,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'2px solid rgba(255,255,255,0.2)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><FiVideoOff size={18}/></button>}
        </div>
      </div>
      <style>{`@keyframes callRing{0%{transform:translate(-50%,-70%) scale(0.8);opacity:.7}100%{transform:translate(-50%,-70%) scale(1.4);opacity:0}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN MESSAGES PAGE
══════════════════════════════════════════════════════════ */
const QUICK_EMOJIS=['👍','❤️','😂','😮','🔥','🎉','👏','💯','✅','🙏'];

export default function Messages() {
  const user  = getUser();
  const MY_ID = user?.username||'';

  const [contacts,      setContacts]     = useState([]);
  const [allUsers,      setAllUsers]     = useState([]);
  const [activeId,      setActiveId]     = useState(null);
  const [messages,      setMessages]     = useState([]);
  const [input,         setInput]        = useState('');
  const [search,        setSearch]       = useState('');
  const [unreadOnly,    setUnreadOnly]   = useState(false);
  const [loadingConvs,  setLdConvs]      = useState(true);
  const [loadingMsgs,   setLdMsgs]       = useState(false);
  const [sending,       setSending]      = useState(false);
  const [typingUser,    setTypingUser]   = useState(null);
  const [showNewChat,   setShowNewChat]  = useState(false);
  const [newSearch,     setNewSearch]    = useState('');
  const [convError,     setConvError]    = useState('');
  const [onlineMap,     setOnlineMap]    = useState({});
  const [lastSeenMap,   setLastSeenMap]  = useState({});
  const [showCamera,    setShowCamera]   = useState(false);
  const [showWallpaper, setShowWallpaper]= useState(false);
  const [callState,     setCallState]    = useState(null);
  const [showMenu,      setShowMenu]     = useState(false);
  const [showEmoji,     setShowEmoji]    = useState(false);
  const [pendingMedia,  setPendingMedia] = useState(null);
  const [wallpapers,    setWallpapers]   = useState(()=>{ try{return JSON.parse(localStorage.getItem('cc_wallpapers')||'{}');}catch{return{};} });

  const bottomRef=useRef(); const inputRef=useRef(); const typingTimer=useRef();
  const activeRef=useRef(null); const socketReady=useRef(false); const openedFirst=useRef(false);
  const fileRef=useRef();

  useEffect(()=>{ activeRef.current=activeId; },[activeId]);

  const loadConvs=useCallback(async()=>{
    if(!MY_ID)return; setLdConvs(true); setConvError('');
    try{ const d=await messageAPI.getConversations(); setContacts(Array.isArray(d)?d:[]); }
    catch{ setConvError('Cannot load conversations.'); setContacts([]); }
    finally{ setLdConvs(false); }
  },[MY_ID]);

  const loadAllUsers=useCallback(async()=>{ try{const d=await userAPI.getContacts();setAllUsers(Array.isArray(d)?d:[]);}catch{} },[]);

  useEffect(()=>{ loadConvs(); loadAllUsers(); },[]);// eslint-disable-line
  useEffect(()=>{ if(!openedFirst.current&&contacts.length>0){openedFirst.current=true;openChat(contacts[0].withUser);} },[contacts]);// eslint-disable-line
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages,typingUser]);

  /* Socket */
  useEffect(()=>{
    if(!MY_ID||socketReady.current)return; socketReady.current=true;
    socket.emit('registerUser',MY_ID);
    socket.emit('getOnlineUsers');

    socket.on('receiveMessage',data=>{
      const from=data.senderId;
      if(from===activeRef.current){
        setMessages(prev=>[...prev,{id:data.id||Date.now(),sender:'them',text:data.text,media:data.media||null,mediaType:data.mediaType||null,read:true,time:data.time||nowStr()}]);
        messageAPI.markRead(from).catch(()=>{});
      }
      setContacts(prev=>{
        const ex=prev.find(c=>c.withUser===from);
        if(ex)return prev.map(c=>c.withUser===from?{...c,lastMessage:data.text,unreadCount:from===activeRef.current?0:(c.unreadCount||0)+1}:c);
        return[{withUser:from,lastMessage:data.text,unreadCount:1},...prev];
      });
    });
    socket.on('userTyping',({from})=>{if(from===activeRef.current)setTypingUser(from);});
    socket.on('userStopTyping',({from})=>{if(from===activeRef.current)setTypingUser(null);});
    socket.on('userOnline', ({userId})=>setOnlineMap(m=>({...m,[userId]:true})));
    socket.on('userOffline',({userId,lastSeen})=>{ setOnlineMap(m=>({...m,[userId]:false})); setLastSeenMap(m=>({...m,[userId]:lastSeen})); });
    socket.on('onlineUsers',(list)=>{ const m={}; list.forEach(u=>{m[u]=true;}); setOnlineMap(m); });
    socket.on('incomingCall',({from,type})=>{ if(window.confirm(`📞 Incoming ${type} call from @${from}. Accept?`))setCallState({type,withUser:from}); });
    return()=>{ ['receiveMessage','userTyping','userStopTyping','userOnline','userOffline','onlineUsers','incomingCall'].forEach(e=>socket.off(e)); };
  },[MY_ID]);// eslint-disable-line

  const openChat=useCallback(async(withUser)=>{
    if(!withUser)return;
    setActiveId(withUser); activeRef.current=withUser; setTypingUser(null); setLdMsgs(true); setShowMenu(false); setShowEmoji(false);
    try{
      const data=await messageAPI.getMessages(withUser);
      setMessages(Array.isArray(data)?data:[]);
      await messageAPI.markRead(withUser).catch(()=>{});
      setContacts(prev=>prev.map(c=>c.withUser===withUser?{...c,unreadCount:0}:c));
    }catch{setMessages([]);}finally{setLdMsgs(false);}
    setTimeout(()=>inputRef.current?.focus(),100);
  },[]);

  const send=async(overrideText=null,mediaUrl=null,mType=null)=>{
    const text=overrideText||input.trim();
    const media=mediaUrl||pendingMedia?.url||null;
    const mediaType=mType||pendingMedia?.type||null;
    if((!text&&!media)||sending||!activeId)return;
    const finalText=text||(media?'📎':' ');
    if(!overrideText)setInput('');
    setPendingMedia(null);
    setSending(true);
    socket.emit('stopTyping',{to:activeId}); clearTimeout(typingTimer.current);
    const tempId=`temp_${Date.now()}`;
    setMessages(prev=>[...prev,{id:tempId,sender:'me',text:finalText,media,mediaType,read:false,time:nowStr()}]);
    try{
      const saved=await messageAPI.send(activeId,finalText);
      setMessages(prev=>prev.map(m=>m.id===tempId?{...saved,sender:'me',media,mediaType}:m));
      socket.emit('privateMessage',{senderId:MY_ID,receiverId:activeId,text:finalText,media,mediaType});
      setContacts(prev=>{
        const ex=prev.find(c=>c.withUser===activeId);
        if(ex)return prev.map(c=>c.withUser===activeId?{...c,lastMessage:finalText}:c);
        return[{withUser:activeId,lastMessage:finalText,unreadCount:0},...prev];
      });
      markMessageTask();
    }catch{setMessages(prev=>prev.filter(m=>m.id!==tempId));if(!overrideText)setInput(text);}
    finally{setSending(false);}
  };

  const handleInput=e=>{
    setInput(e.target.value);
    if(activeId){socket.emit('typing',{to:activeId});clearTimeout(typingTimer.current);typingTimer.current=setTimeout(()=>socket.emit('stopTyping',{to:activeId}),1500);}
  };

  const handleFileSelect=e=>{
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader();
    r.onload=ev=>setPendingMedia({url:ev.target.result,type:f.type.startsWith('video')?'video':'image'});
    r.readAsDataURL(f); e.target.value='';
  };

  const handleCameraCapture=(url,type)=>{ setPendingMedia({url,type}); setShowCamera(false); };

  const saveWallpaper=(id)=>{ const u={...wallpapers,[activeId]:id}; setWallpapers(u); localStorage.setItem('cc_wallpapers',JSON.stringify(u)); };
  const startCall=(type)=>{ setCallState({type,withUser:activeId}); socket.emit('callUser',{userToCall:activeId,from:MY_ID,type}); setShowMenu(false); };
  const startChat=(username)=>{ setShowNewChat(false); setNewSearch(''); if(!contacts.find(c=>c.withUser===username))setContacts(prev=>[{withUser:username,lastMessage:'',unreadCount:0},...prev]); openedFirst.current=true; openChat(username); };

  const wallId=wallpapers[activeId]||'default';
  const wallBg=WALLPAPERS.find(w=>w.id===wallId)?.bg||'var(--bg)';
  const isDark=['midnight','aurora','sunset','ocean','violet','rose'].includes(wallId);
  const meBg   =isDark?'rgba(255,255,255,0.9)':'var(--accent)';
  const meClr  =isDark?'#111':'#fff';
  const themBg =isDark?'rgba(0,0,0,0.5)':'var(--surface)';
  const themClr=isDark?'#fff':'var(--text1)';
  const isOn   =onlineMap[activeId];
  const lastSeen=lastSeenMap[activeId];
  const totalUnread=contacts.reduce((a,c)=>a+(c.unreadCount||0),0);
  const filtConvs=contacts.filter(c=>(unreadOnly?c.unreadCount>0:true)&&c.withUser?.toLowerCase().includes(search.toLowerCase()));
  const filtUsers=allUsers.filter(u=>u.username?.toLowerCase().includes(newSearch.toLowerCase()));

  return (
    <div style={S.root}>
      {/* ──── LEFT PANEL ──── */}
      <div style={S.panel}>
        <div style={S.panelHead}>
          <div style={{flex:1}}>
            <div style={S.panelTitle}>Messages {totalUnread>0&&<span style={{background:'var(--accent)',color:'#fff',fontSize:11,fontWeight:700,padding:'1px 7px',borderRadius:10,marginLeft:6}}>{totalUnread}</span>}</div>
          </div>
          <button style={S.newBtn} onClick={()=>{setShowNewChat(v=>!v);if(!showNewChat)loadAllUsers();setNewSearch('');}} title="New chat">
            {showNewChat?<FiX size={15}/>:'✏️'}
          </button>
        </div>

        <div style={S.searchRow}>
          <FiSearch size={13} style={{color:'var(--text3)',flexShrink:0}}/>
          <input style={S.searchIn} placeholder="Search conversations…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>

        <div style={{padding:'0 10px 6px'}}>
          <button style={{...S.filterBtn,...(unreadOnly?S.filterActive:{})}} onClick={()=>setUnreadOnly(v=>!v)}>
            {unreadOnly?'● Unread only':'○ All messages'}
          </button>
        </div>

        {/* New chat */}
        {showNewChat&&(
          <div style={{background:'var(--bg2)',borderBottom:'1px solid var(--border)',maxHeight:260,overflowY:'auto'}}>
            <div style={{padding:'8px 12px 4px',fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.8px'}}>Start new chat</div>
            <div style={{padding:'0 10px 8px'}}>
              <input autoFocus style={{...S.searchIn,border:'1px solid var(--border)',borderRadius:8,padding:'6px 10px',width:'100%',background:'var(--surface)'}} placeholder="Search users…" value={newSearch} onChange={e=>setNewSearch(e.target.value)}/>
            </div>
            {filtUsers.length===0
              ?<div style={{padding:'12px',fontSize:12,color:'var(--text3)',textAlign:'center'}}>{allUsers.length===0?'No other users yet.':'No users match.'}</div>
              :filtUsers.map(u=>(
                <div key={u.username} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',cursor:'pointer',borderBottom:'1px solid rgba(0,0,0,0.04)',transition:'background 0.15s'}} onClick={()=>startChat(u.username)}>
                  <div style={{position:'relative',flexShrink:0}}>
                    <div style={{...S.av,background:aC(u.username),width:34,height:34,borderRadius:9,fontSize:11}}>{u.username.slice(0,2).toUpperCase()}</div>
                    <span style={{position:'absolute',bottom:0,right:0,width:9,height:9,borderRadius:'50%',background:onlineMap[u.username]?'#34d399':'#6b7280',border:'2px solid var(--surface)'}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text1)'}}>{u.username}</div>
                    <OnlineStatus isOnline={!!onlineMap[u.username]} lastSeen={lastSeenMap[u.username]} size="sm"/>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Conversation list */}
        <div style={S.list}>
          {loadingConvs&&[1,2,3].map(i=>(
            <div key={i} style={{padding:'12px 14px',display:'flex',gap:10}}>
              <Skel w={42} h={42}/><div style={{flex:1,display:'flex',flexDirection:'column',gap:7}}><Skel w={110} h={13}/><Skel w={150} h={11}/></div>
            </div>
          ))}
          {!loadingConvs&&convError&&(
            <div style={{padding:16,textAlign:'center'}}>
              <p style={{fontSize:12,color:'var(--rose)',marginBottom:10}}>{convError}</p>
              <button onClick={loadConvs} style={{fontSize:12,padding:'5px 12px',borderRadius:7,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer'}}><FiRefreshCw size={11}/> Retry</button>
            </div>
          )}
          {!loadingConvs&&!convError&&filtConvs.length===0&&(
            <div style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:13,lineHeight:1.8}}>
              {contacts.length===0?<>No conversations yet.<br/>Click ✏️ to start chatting!</>:'No matches.'}
            </div>
          )}
          {filtConvs.map(c=>(
            <div key={c.withUser} style={{...S.contactRow,...(activeId===c.withUser?S.contactActive:{})}} onClick={()=>openChat(c.withUser)}>
              <div style={{position:'relative',flexShrink:0}}>
                <div style={{...S.av,background:aC(c.withUser)}}>{c.withUser?.slice(0,2).toUpperCase()}</div>
                <span style={{position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',background:onlineMap[c.withUser]?'#34d399':'#6b7280',border:'2px solid var(--surface)',boxShadow:onlineMap[c.withUser]?'0 0 6px rgba(52,211,153,0.6)':'none',transition:'all 0.3s'}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}>
                  <span style={{fontSize:13.5,fontWeight:c.unreadCount?700:600,color:'var(--text1)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.withUser}</span>
                  {onlineMap[c.withUser]
                    ?<span style={{fontSize:9.5,color:'#34d399',fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',gap:2}}><FiWifi size={8}/>Online</span>
                    :lastSeenMap[c.withUser]?<span style={{fontSize:9.5,color:'var(--text4)',flexShrink:0,display:'flex',alignItems:'center',gap:2}}><FiClock size={8}/>{formatLastSeen(lastSeenMap[c.withUser])}</span>:null
                  }
                </div>
                <div style={{fontSize:12,color:c.unreadCount?'var(--text1)':'var(--text3)',fontWeight:c.unreadCount?600:400,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>
                  {c.lastMessage||'No messages yet'}
                </div>
              </div>
              {c.unreadCount>0&&<span style={{minWidth:18,height:18,borderRadius:9,background:'var(--accent)',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px',flexShrink:0}}>{c.unreadCount}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ──── CHAT WINDOW ──── */}
      <div style={{...S.chat,background:wallBg,backgroundSize:wallId==='dots'?'20px 20px':'auto'}}>
        {!activeId?(
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,color:'var(--text3)'}}>
            <FiMessageSquare size={52} style={{opacity:0.12}}/>
            <p style={{fontSize:15,fontWeight:600}}>Select a conversation to start chatting</p>
            <button style={{...S.sendBtn,...S.sendActive,padding:'10px 22px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',width:'auto'}} onClick={()=>{setShowNewChat(true);loadAllUsers();}}>✏️ New Chat</button>
          </div>
        ):(
          <>
            {/* Chat header */}
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',background:isDark?'rgba(0,0,0,0.65)':'var(--surface)',backdropFilter:'blur(12px)',borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.08)':'var(--border)'}`,flexShrink:0}}>
              <div style={{position:'relative',flexShrink:0}}>
                <div style={{...S.av,background:aC(activeId),width:38,height:38,borderRadius:10}}>{activeId?.slice(0,2).toUpperCase()}</div>
                <span style={{position:'absolute',bottom:0,right:0,width:10,height:10,borderRadius:'50%',background:isOn?'#34d399':'#6b7280',border:'2px solid var(--surface)',boxShadow:isOn?'0 0 6px rgba(52,211,153,0.6)':'none'}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,color:isDark?'#fff':'var(--text1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{activeId}</div>
                <OnlineStatus isOnline={isOn} lastSeen={lastSeen} size="sm"/>
              </div>
              <div style={{display:'flex',gap:6}}>
                {[{icon:<FiPhone size={14}/>,action:()=>startCall('audio'),title:'Voice Call'},{icon:<FiVideo size={14}/>,action:()=>startCall('video'),title:'Video Call'}].map((b,i)=>(
                  <button key={i} onClick={b.action} title={b.title} style={{width:32,height:32,borderRadius:8,background:isDark?'rgba(255,255,255,0.08)':'var(--surface2)',border:`1px solid ${isDark?'rgba(255,255,255,0.15)':'var(--border)'}`,color:isDark?'#fff':'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>{b.icon}</button>
                ))}
                <div style={{position:'relative'}}>
                  <button style={{width:32,height:32,borderRadius:8,background:isDark?'rgba(255,255,255,0.08)':'var(--surface2)',border:`1px solid ${isDark?'rgba(255,255,255,0.15)':'var(--border)'}`,color:isDark?'#fff':'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowMenu(v=>!v)}><FiMoreVertical size={14}/></button>
                  {showMenu&&(
                    <div style={{position:'absolute',right:0,top:'110%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,boxShadow:'var(--shadow-md)',zIndex:50,minWidth:170,overflow:'hidden'}}>
                      {[{icon:'🎨',label:'Change Wallpaper',action:()=>{setShowWallpaper(true);setShowMenu(false);}},{icon:'📞',label:'Voice Call',action:()=>startCall('audio')},{icon:'📹',label:'Video Call',action:()=>startCall('video')},{icon:'🗑️',label:'Clear Chat',action:()=>{setMessages([]);setShowMenu(false);}}].map(item=>(
                        <button key={item.label} onClick={item.action} style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'10px 14px',background:'none',border:'none',color:'var(--text1)',fontSize:13,cursor:'pointer',textAlign:'left'}}>{item.icon} {item.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:'auto',padding:'16px 18px',display:'flex',flexDirection:'column'}}>
              <div style={{alignSelf:'center',marginBottom:14,background:isDark?'rgba(0,0,0,0.45)':'var(--surface)',border:`1px solid ${isDark?'rgba(255,255,255,0.08)':'var(--border)'}`,borderRadius:20,padding:'3px 13px',fontSize:11,color:isDark?'rgba(255,255,255,0.5)':'var(--text3)',fontWeight:600,boxShadow:'var(--shadow-sm)'}}>Today</div>

              {loadingMsgs&&[1,2,3].map(i=>(
                <div key={i} style={{display:'flex',justifyContent:i%2===0?'flex-end':'flex-start',marginBottom:10}}><Skel w={180} h={50}/></div>
              ))}

              {!loadingMsgs&&messages.length===0&&(
                <div style={{textAlign:'center',color:isDark?'rgba(255,255,255,0.35)':'var(--text3)',fontSize:13.5,marginTop:60}}>No messages yet. Say hello! 👋</div>
              )}

              {messages.map(msg=>{
                const isMe=msg.sender===MY_ID||msg.sender==='me';
                const isTemp=String(msg.id).startsWith('temp_');
                return (
                  <div key={msg.id} style={{display:'flex',justifyContent:isMe?'flex-end':'flex-start',marginBottom:10,alignItems:'flex-end',gap:6}}>
                    {!isMe&&<div style={{...S.av,width:26,height:26,borderRadius:7,fontSize:9,flexShrink:0,background:aC(activeId)}}>{activeId?.slice(0,2).toUpperCase()}</div>}
                    <div style={{maxWidth:'65%'}}>
                      {msg.media&&(
                        <div style={{borderRadius:12,overflow:'hidden',marginBottom:4,cursor:'pointer'}} onClick={()=>msg.mediaType!=='video'&&window.open(msg.media,'_blank')}>
                          {msg.mediaType==='video'
                            ?<video src={msg.media} controls style={{width:'100%',maxHeight:200,borderRadius:12,display:'block'}}/>
                            :<img src={msg.media} alt="" style={{width:'100%',maxHeight:220,objectFit:'cover',borderRadius:12,display:'block'}}/>
                          }
                        </div>
                      )}
                      {msg.text&&msg.text!=='📎'&&(
                        <div style={{padding:'10px 14px',background:isMe?meBg:themBg,color:isMe?meClr:themClr,border:isMe?'none':`1px solid ${isDark?'rgba(255,255,255,0.1)':'var(--border)'}`,borderRadius:isMe?'14px 4px 14px 14px':'4px 14px 14px 14px',fontSize:14,lineHeight:1.5,boxShadow:isMe?'0 2px 8px var(--glow)':'var(--shadow-sm)',opacity:isTemp?0.55:1,transition:'opacity 0.3s',backdropFilter:isDark?'blur(8px)':'none',wordBreak:'break-word'}}>
                          <p style={{margin:0}}>{msg.text}</p>
                          <div style={{display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end',marginTop:4}}>
                            <span style={{fontSize:10,opacity:0.6}}>{msg.time}</span>
                            {isMe&&(msg.read?<DoubleCheck/>:<FiCheck size={10} style={{opacity:0.4}}/>)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {typingUser&&(
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
                  <div style={{...S.av,width:26,height:26,borderRadius:7,fontSize:9,background:aC(activeId)}}>{activeId?.slice(0,2).toUpperCase()}</div>
                  <div style={{background:themBg,border:`1px solid ${isDark?'rgba(255,255,255,0.1)':'var(--border)'}`,borderRadius:'4px 14px 14px 14px',padding:'10px 14px',backdropFilter:isDark?'blur(8px)':'none'}}>
                    <div style={{display:'flex',gap:4}}>{[0,.2,.4].map(d=><span key={d} style={{width:6,height:6,borderRadius:'50%',background:isDark?'rgba(255,255,255,0.6)':'var(--text3)',display:'inline-block',animation:`typingBounce 0.9s ease ${d}s infinite`}}/>)}</div>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Pending media preview */}
            {pendingMedia&&(
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',background:isDark?'rgba(0,0,0,0.6)':'var(--surface)',borderTop:`1px solid ${isDark?'rgba(255,255,255,0.08)':'var(--border)'}`,flexShrink:0}}>
                {pendingMedia.type==='video'
                  ?<video src={pendingMedia.url} style={{height:56,borderRadius:8,objectFit:'cover'}}/>
                  :<img src={pendingMedia.url} alt="" style={{height:56,width:56,borderRadius:8,objectFit:'cover'}}/>
                }
                <span style={{fontSize:12,color:isDark?'rgba(255,255,255,0.6)':'var(--text2)',flex:1}}>📎 Ready to send</span>
                <button onClick={()=>setPendingMedia(null)} style={{background:'none',border:'none',cursor:'pointer',color:isDark?'rgba(255,255,255,0.5)':'var(--text3)',padding:4}}><FiX size={14}/></button>
              </div>
            )}

            {/* Quick emoji bar */}
            {showEmoji&&(
              <div style={{display:'flex',gap:2,padding:'8px 14px',background:isDark?'rgba(0,0,0,0.65)':'var(--surface)',borderTop:`1px solid ${isDark?'rgba(255,255,255,0.08)':'var(--border)'}`,flexShrink:0,overflowX:'auto',scrollbarWidth:'none'}}>
                {QUICK_EMOJIS.map(e=>(
                  <button key={e} onClick={()=>{send(e);setShowEmoji(false);}} style={{fontSize:22,background:'none',border:'none',cursor:'pointer',padding:'3px 6px',borderRadius:8,transition:'transform 0.12s',flexShrink:0}}
                    onMouseEnter={ev=>ev.currentTarget.style.transform='scale(1.35)'}
                    onMouseLeave={ev=>ev.currentTarget.style.transform='scale(1)'}>{e}</button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'10px 12px',background:isDark?'rgba(0,0,0,0.65)':'var(--surface)',backdropFilter:isDark?'blur(12px)':'none',borderTop:`1px solid ${isDark?'rgba(255,255,255,0.08)':'var(--border)'}`,flexShrink:0}}>
              {/* Camera button */}
              <button title="Take photo/video" onClick={()=>setShowCamera(true)} style={{...S.iconBtn,...(isDark?S.iconBtnDark:{})}}>
                <FiCamera size={15}/>
              </button>
              {/* File upload */}
              <input ref={fileRef} type="file" accept="image/*,video/*" style={{display:'none'}} onChange={handleFileSelect}/>
              <button title="Attach photo or video" onClick={()=>fileRef.current?.click()} style={{...S.iconBtn,...(isDark?S.iconBtnDark:{})}}>
                <FiImage size={15}/>
              </button>
              {/* Emoji */}
              <button onClick={()=>setShowEmoji(v=>!v)} style={{...S.iconBtn,...(isDark?S.iconBtnDark:{}),...(showEmoji?{background:'var(--accent)',color:'#fff',borderColor:'var(--accent)'}:{})}}>
                <FiSmile size={15}/>
              </button>

              <input
                ref={inputRef}
                style={{flex:1,background:isDark?'rgba(255,255,255,0.1)':'var(--bg2)',border:`1.5px solid ${isDark?'rgba(255,255,255,0.15)':'var(--border)'}`,borderRadius:10,padding:'8px 12px',fontSize:13.5,color:isDark?'#fff':'var(--text1)',outline:'none',fontFamily:'var(--font)',transition:'all 0.2s'}}
                placeholder={`Message ${activeId}…`}
                value={input}
                onChange={handleInput}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
              />

              <button
                style={{...S.sendBtn,...((input.trim()||pendingMedia)&&!sending?S.sendActive:{})}}
                onClick={()=>send()}
                disabled={(!input.trim()&&!pendingMedia)||sending}
              >
                {sending?<FiRefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/>:<FiSend size={14}/>}
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      {showCamera&&<CameraModal onCapture={handleCameraCapture} onClose={()=>setShowCamera(false)}/>}
      {showWallpaper&&<WallpaperPicker current={wallId} onSelect={saveWallpaper} onClose={()=>setShowWallpaper(false)}/>}
      {callState&&<CallModal type={callState.type} withUser={callState.withUser} onEnd={()=>setCallState(null)}/>}
    </div>
  );
}

const S={
  root:{display:'flex',height:'calc(100vh - var(--topbar-h))',background:'var(--bg)',overflow:'hidden'},
  panel:{width:290,flexShrink:0,display:'flex',flexDirection:'column',background:'var(--surface)',borderRight:'1px solid var(--border)',boxShadow:'var(--shadow-sm)'},
  panelHead:{display:'flex',alignItems:'center',gap:8,padding:'14px 14px 10px'},
  panelTitle:{fontSize:17,fontWeight:800,color:'var(--text1)',flex:1},
  newBtn:{background:'none',border:'none',cursor:'pointer',fontSize:17,padding:5,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text2)'},
  searchRow:{display:'flex',alignItems:'center',gap:7,margin:'0 10px 6px',background:'var(--bg2)',border:'1.5px solid var(--border)',borderRadius:10,padding:'0 11px'},
  searchIn:{flex:1,background:'none',border:'none',outline:'none',fontSize:13,color:'var(--text1)',padding:'8px 0',fontFamily:'var(--font)'},
  filterBtn:{width:'100%',padding:'6px 12px',borderRadius:8,background:'none',border:'1.5px solid var(--border)',color:'var(--text3)',fontSize:12,fontWeight:600,cursor:'pointer',textAlign:'left',transition:'all 0.15s',fontFamily:'var(--font)'},
  filterActive:{background:'rgba(79,97,210,0.07)',borderColor:'var(--accent)',color:'var(--accent)'},
  list:{flex:1,overflowY:'auto'},
  contactRow:{display:'flex',alignItems:'center',gap:10,padding:'10px 13px',cursor:'pointer',transition:'background 0.15s',borderBottom:'1px solid rgba(0,0,0,0.04)'},
  contactActive:{background:'var(--bg2)'},
  av:{width:42,height:42,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#fff'},
  chat:{flex:1,display:'flex',flexDirection:'column',minWidth:0,transition:'background 0.4s'},
  sendBtn:{width:34,height:34,borderRadius:9,background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.2s'},
  sendActive:{background:'var(--accent)',borderColor:'var(--accent)',color:'#fff',boxShadow:'0 3px 10px var(--glow)'},
  iconBtn:{width:32,height:32,borderRadius:8,background:'none',border:'1px solid var(--border)',color:'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'},
  iconBtnDark:{background:'rgba(255,255,255,0.07)',borderColor:'rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.75)'},
};