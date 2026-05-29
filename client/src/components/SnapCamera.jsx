import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiX, FiZap, FiRotateCcw, FiDownload, FiSend,
  FiClock, FiRefreshCw, FiMic, FiMicOff,
} from 'react-icons/fi';

/* ─────────────────────────────────────────────
   Snapchat-style Camera with:
   • Live CSS filters + canvas overlay filters
   • AR-style face stickers (emoji overlays)
   • Boomerang / timer countdown modes
   • Front/back camera toggle
   • Photo + Video capture
   • Download & Share
───────────────────────────────────────────── */

const FILTERS = [
  { id: 'normal',    label: 'Normal',   css: 'none',                                     emoji: '😐' },
  { id: 'vivid',     label: 'Vivid',    css: 'saturate(2) contrast(1.15)',               emoji: '🌈' },
  { id: 'golden',    label: 'Golden',   css: 'sepia(0.5) saturate(1.5) brightness(1.1)', emoji: '✨' },
  { id: 'cool',      label: 'Cool',     css: 'hue-rotate(180deg) saturate(1.4)',          emoji: '❄️' },
  { id: 'fire',      label: 'Fire',     css: 'hue-rotate(320deg) saturate(2) contrast(1.2)', emoji: '🔥' },
  { id: 'bw',        label: 'Noir',     css: 'grayscale(1) contrast(1.3)',               emoji: '🎬' },
  { id: 'neon',      label: 'Neon',     css: 'saturate(3) brightness(0.85) contrast(1.3)',emoji: '💜' },
  { id: 'fade',      label: 'Fade',     css: 'brightness(1.15) saturate(0.6)',           emoji: '🌫️' },
  { id: 'dramatic',  label: 'Drama',    css: 'contrast(1.6) brightness(0.85) saturate(1.2)', emoji: '🎭' },
  { id: 'retro',     label: 'Retro',    css: 'sepia(0.8) saturate(1.2) hue-rotate(-20deg)', emoji: '📷' },
  { id: 'bubblegum', label: 'Candy',    css: 'hue-rotate(280deg) saturate(2.5) brightness(1.1)', emoji: '🍬' },
  { id: 'matrix',    label: 'Matrix',   css: 'hue-rotate(100deg) saturate(3) brightness(0.7)', emoji: '💚' },
];

const STICKERS = [
  { id: 'crown',    emoji: '👑', label: 'Crown',    top: '5%',  left: '30%',  size: 80  },
  { id: 'glasses',  emoji: '🕶️', label: 'Cool',     top: '28%', left: '25%',  size: 60  },
  { id: 'dog',      emoji: '🐶', label: 'Dog',      top: '0%',  left: '20%',  size: 100 },
  { id: 'alien',    emoji: '👾', label: 'Alien',    top: '2%',  left: '35%',  size: 75  },
  { id: 'fire_hat', emoji: '🎩', label: 'Hat',      top: '1%',  left: '30%',  size: 80  },
  { id: 'stars',    emoji: '⭐', label: 'Stars',    top: '5%',  left: '10%',  size: 50  },
  { id: 'hearts',   emoji: '💕', label: 'Hearts',   top: '15%', left: '5%',   size: 45  },
  { id: 'rainbow',  emoji: '🌈', label: 'Rainbow',  top: '0%',  left: '0%',   size: 120 },
  { id: 'party',    emoji: '🎉', label: 'Party',    top: '5%',  left: '60%',  size: 60  },
  { id: 'sparkle',  emoji: '✨', label: 'Sparkle',  top: '10%', left: '60%',  size: 50  },
  { id: 'clown',    emoji: '🤡', label: 'Clown',    top: '5%',  left: '30%',  size: 80  },
  { id: 'ghost',    emoji: '👻', label: 'Ghost',    top: '0%',  left: '28%',  size: 90  },
];

const CAPTION_COLORS = ['#ffffff', '#000000', '#f43f5e', '#fbbf24', '#34d399', '#818cf8', '#fb923c'];

export default function SnapCamera({ onClose, onCapture, username }) {
  const videoRef    = useRef();
  const canvasRef   = useRef();
  const streamRef   = useRef();
  const recorderRef = useRef();
  const chunksRef   = useRef([]);
  const timerRef    = useRef();

  const [filter,      setFilter]    = useState('normal');
  const [sticker,     setSticker]   = useState(null);
  const [mode,        setMode]      = useState('photo');   // photo | video | boomerang
  const [facing,      setFacing]    = useState('user');    // user | environment
  const [recording,   setRecording] = useState(false);
  const [captured,    setCaptured]  = useState(null);
  const [capturedType,setCaptType]  = useState(null);
  const [countdown,   setCountdown] = useState(null);     // null | 3 | 2 | 1
  const [tab,         setTab]       = useState('filters'); // filters | stickers | text
  const [caption,     setCaption]   = useState('');
  const [captionColor,setCaptColor] = useState('#ffffff');
  const [recDuration, setRecDur]    = useState(0);
  const [muted,       setMuted]     = useState(false);
  const [flash,       setFlash]     = useState(false);
  const [loading,     setLoading]   = useState(true);

  const currentFilter = FILTERS.find(f => f.id === filter);
  const currentSticker = STICKERS.find(s => s.id === sticker);

  const startCamera = useCallback(async () => {
    setLoading(true);
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, [facing]);

  useEffect(() => {
    startCamera();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [startCamera]);

  // Mute toggle
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !muted; });
  }, [muted]);

  const takePhoto = () => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    canvas.width  = video.videoWidth  || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.filter = currentFilter?.css || 'none';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (facing === 'user') ctx.setTransform(1,0,0,1,0,0);

    // Draw sticker
    if (currentSticker) {
      ctx.filter = 'none';
      const stickerSize = Math.min(canvas.width, canvas.height) * 0.2;
      const x = parseFloat(currentSticker.left) / 100 * canvas.width;
      const y = parseFloat(currentSticker.top)  / 100 * canvas.height;
      ctx.font = `${stickerSize}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(currentSticker.emoji, x + stickerSize/2, y + stickerSize);
    }

    // Draw caption
    if (caption.trim()) {
      ctx.filter = 'none';
      const fontSize = Math.round(canvas.width / 14);
      ctx.font = `bold ${fontSize}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = captionColor;
      ctx.strokeStyle = captionColor === '#ffffff' ? '#000' : '#fff';
      ctx.lineWidth = fontSize / 10;
      ctx.strokeText(caption, canvas.width/2, canvas.height * 0.88);
      ctx.fillText(caption, canvas.width/2, canvas.height * 0.88);
    }

    setCaptured(canvas.toDataURL('image/jpeg', 0.92));
    setCaptType('photo');
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    recorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8,opus' });
    recorderRef.current.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data);
    recorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url  = URL.createObjectURL(blob);
      setCaptured(url);
      setCaptType('video');
      setRecDur(0);
    };
    recorderRef.current.start(100);
    setRecording(true);
    timerRef.current = setInterval(() => setRecDur(d => d + 1), 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const triggerCapture = () => {
    if (mode === 'photo') {
      takePhoto();
    } else if (mode === 'video') {
      recording ? stopRecording() : startRecording();
    } else if (mode === 'boomerang') {
      // 2-second boomerang
      startRecording();
      setTimeout(() => { stopRecording(); }, 2000);
    }
  };

  const triggerWithTimer = (seconds = 3) => {
    setCountdown(seconds);
    let c = seconds;
    const iv = setInterval(() => {
      c--;
      setCountdown(c > 0 ? c : null);
      if (c <= 0) { clearInterval(iv); takePhoto(); }
    }, 1000);
  };

  const handleShare = () => {
    if (onCapture && captured) {
      onCapture(captured, capturedType);
      onClose();
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = captured;
    a.download = `collegeconnect-${Date.now()}.${capturedType === 'video' ? 'webm' : 'jpg'}`;
    a.click();
  };

  const fmtDur = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={S.overlay}>
      <div style={S.wrapper}>
        {/* ── Viewfinder ── */}
        <div style={S.viewfinder}>
          {loading && (
            <div style={S.loadingScreen}>
              <div style={S.loadSpinner}/>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginTop:12 }}>Starting camera…</p>
            </div>
          )}

          {/* Flash overlay */}
          {flash && <div style={S.flashOverlay}/>}

          {/* Countdown */}
          {countdown !== null && (
            <div style={S.countdown}>{countdown}</div>
          )}

          <video
            ref={videoRef}
            autoPlay muted playsInline
            style={{
              ...S.video,
              filter: currentFilter?.css || 'none',
              transform: facing === 'user' ? 'scaleX(-1)' : 'none',
              opacity: loading ? 0 : 1,
            }}
          />
          <canvas ref={canvasRef} style={{ display:'none' }}/>

          {/* Sticker overlay */}
          {currentSticker && (
            <div style={{
              position:'absolute',
              top:currentSticker.top,
              left:currentSticker.left,
              fontSize: currentSticker.size,
              lineHeight:1,
              pointerEvents:'none',
              filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
              userSelect:'none',
              zIndex:10,
            }}>
              {currentSticker.emoji}
            </div>
          )}

          {/* Caption preview */}
          {caption && (
            <div style={{
              position:'absolute', bottom:'15%', left:0, right:0,
              textAlign:'center', padding:'0 16px', zIndex:10,
              fontSize:22, fontWeight:800,
              color: captionColor,
              textShadow: captionColor==='#ffffff'?'0 2px 8px rgba(0,0,0,0.9)':'0 2px 8px rgba(255,255,255,0.6)',
              pointerEvents:'none',
            }}>
              {caption}
            </div>
          )}

          {/* Recording indicator */}
          {recording && (
            <div style={S.recBadge}>
              <span style={S.recDot}/>
              {fmtDur(recDuration)}
            </div>
          )}

          {/* Top controls */}
          <div style={S.topBar}>
            <button style={S.glassBtn} onClick={onClose}><FiX size={18}/></button>
            <div style={{ display:'flex', gap:8 }}>
              <button style={S.glassBtn} onClick={() => setMuted(v=>!v)}>
                {muted ? <FiMicOff size={16}/> : <FiMic size={16}/>}
              </button>
              <button style={S.glassBtn} onClick={() => setFacing(f => f==='user'?'environment':'user')}>
                <FiRefreshCw size={16}/>
              </button>
              <button style={S.glassBtn} onClick={() => triggerWithTimer(3)}>
                <FiClock size={16}/>
              </button>
            </div>
          </div>

          {/* Mode selector */}
          <div style={S.modeBar}>
            {['photo','video','boomerang'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                ...S.modeBtn,
                ...(mode===m ? S.modeBtnActive : {}),
              }}>
                {m === 'boomerang' ? '🔁' : m === 'video' ? '🎥' : '📸'} {m.charAt(0).toUpperCase()+m.slice(1)}
              </button>
            ))}
          </div>

          {/* Shutter */}
          <button
            style={{
              ...S.shutter,
              ...(mode!=='photo' && recording ? S.shutterRec : {}),
            }}
            onClick={triggerCapture}
          >
            <div style={{
              ...S.shutterInner,
              ...(mode!=='photo' && recording ? { borderRadius:6, width:28, height:28 } : {}),
            }}/>
          </button>
        </div>

        {/* ── Bottom panel ── */}
        {!captured ? (
          <div style={S.panel}>
            {/* Tabs */}
            <div style={S.tabRow}>
              {[['filters','✨ Filters'],['stickers','🎭 Stickers'],['text','💬 Text']].map(([id,label]) => (
                <button key={id} onClick={() => setTab(id)} style={{ ...S.tabBtn, ...(tab===id?S.tabActive:{}) }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Filters */}
            {tab === 'filters' && (
              <div style={S.filterScroll}>
                {FILTERS.map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)} style={{
                    ...S.filterItem,
                    ...(filter===f.id ? S.filterItemActive : {}),
                  }}>
                    <div style={{
                      ...S.filterPreview,
                      filter: f.css,
                      background: 'linear-gradient(135deg,#667eea,#764ba2)',
                    }}>
                      <span style={{ fontSize:18 }}>{f.emoji}</span>
                    </div>
                    <span style={S.filterLabel}>{f.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Stickers */}
            {tab === 'stickers' && (
              <div style={S.stickerGrid}>
                <button onClick={() => setSticker(null)} style={{
                  ...S.stickerBtn,
                  ...(sticker===null ? S.stickerActive : {}),
                  fontSize:20,
                }}>
                  🚫
                  <span style={S.filterLabel}>None</span>
                </button>
                {STICKERS.map(sk => (
                  <button key={sk.id} onClick={() => setSticker(sk.id === sticker ? null : sk.id)} style={{
                    ...S.stickerBtn,
                    ...(sticker===sk.id ? S.stickerActive : {}),
                  }}>
                    <span style={{ fontSize:28, lineHeight:1 }}>{sk.emoji}</span>
                    <span style={S.filterLabel}>{sk.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Text */}
            {tab === 'text' && (
              <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                <input
                  style={S.captionInput}
                  placeholder="Add caption…"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  maxLength={50}
                />
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginRight:4 }}>Color:</span>
                  {CAPTION_COLORS.map(c => (
                    <button key={c} onClick={() => setCaptColor(c)} style={{
                      width:24, height:24, borderRadius:'50%', background:c,
                      border: captionColor===c ? '2px solid #fff' : '2px solid transparent',
                      cursor:'pointer', flexShrink:0,
                    }}/>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Preview after capture ── */
          <div style={S.previewPanel}>
            <div style={S.previewMedia}>
              {capturedType === 'video'
                ? <video src={captured} controls autoPlay loop style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <img src={captured} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              }
            </div>
            <div style={S.previewActions}>
              <button style={S.previewBtn} onClick={() => setCaptured(null)}>
                <FiRotateCcw size={16}/> Retake
              </button>
              <button style={S.previewBtn} onClick={handleDownload}>
                <FiDownload size={16}/> Save
              </button>
              <button style={S.previewBtnPrimary} onClick={handleShare}>
                <FiSend size={16}/> Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.95)',
    zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center',
  },
  wrapper: {
    width: '100%', maxWidth: 420,
    height: '100vh', maxHeight: 780,
    display:'flex', flexDirection:'column',
    background:'#000', borderRadius:0, overflow:'hidden',
    position:'relative',
  },

  // Viewfinder
  viewfinder: {
    flex:1, position:'relative', overflow:'hidden', background:'#000',
  },
  loadingScreen: {
    position:'absolute', inset:0, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', zIndex:20,
  },
  loadSpinner: {
    width:36, height:36, borderRadius:'50%',
    border:'3px solid rgba(255,255,255,0.15)',
    borderTopColor:'#fff',
    animation:'spin 0.8s linear infinite',
  },
  flashOverlay: {
    position:'absolute', inset:0, background:'#fff', zIndex:30, opacity:0.9,
    animation:'fadeIn 0.05s ease',
  },
  countdown: {
    position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
    fontSize:100, fontWeight:900, color:'#fff',
    textShadow:'0 0 40px rgba(255,255,255,0.5)', zIndex:20,
    animation:'pop 0.4s ease',
  },
  video: {
    width:'100%', height:'100%', objectFit:'cover',
    transition:'filter 0.3s, opacity 0.3s',
  },
  recBadge: {
    position:'absolute', top:60, left:'50%', transform:'translateX(-50%)',
    display:'flex', alignItems:'center', gap:6,
    background:'rgba(0,0,0,0.55)', borderRadius:20,
    padding:'4px 12px', fontSize:13, fontWeight:700, color:'#fff',
    zIndex:15,
  },
  recDot: {
    width:8, height:8, borderRadius:'50%', background:'#ef4444',
    animation:'pulse-dot 1s infinite',
  },

  topBar: {
    position:'absolute', top:0, left:0, right:0,
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'12px 14px', zIndex:20,
    background:'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
  },
  glassBtn: {
    width:36, height:36, borderRadius:'50%',
    background:'rgba(0,0,0,0.4)', border:'1.5px solid rgba(255,255,255,0.25)',
    color:'#fff', cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    backdropFilter:'blur(8px)',
    transition:'all 0.15s',
  },
  modeBar: {
    position:'absolute', bottom:86, left:0, right:0,
    display:'flex', justifyContent:'center', gap:8, zIndex:20,
  },
  modeBtn: {
    padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
    background:'rgba(0,0,0,0.4)', border:'1.5px solid rgba(255,255,255,0.2)',
    color:'rgba(255,255,255,0.7)', cursor:'pointer',
    backdropFilter:'blur(8px)',
    transition:'all 0.2s',
  },
  modeBtnActive: {
    background:'rgba(255,255,255,0.2)', borderColor:'rgba(255,255,255,0.8)',
    color:'#fff',
  },
  shutter: {
    position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)',
    width:72, height:72, borderRadius:'50%',
    background:'transparent', border:'4px solid #fff',
    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
    zIndex:20, transition:'all 0.2s',
  },
  shutterRec: { borderColor:'#ef4444' },
  shutterInner: {
    width:54, height:54, borderRadius:'50%', background:'#fff',
    transition:'all 0.2s',
  },

  // Bottom panel
  panel: {
    height:170, background:'#0a0a0a', flexShrink:0,
    display:'flex', flexDirection:'column',
    borderTop:'1px solid rgba(255,255,255,0.08)',
  },
  tabRow: {
    display:'flex', borderBottom:'1px solid rgba(255,255,255,0.08)',
  },
  tabBtn: {
    flex:1, padding:'10px 6px', background:'none', border:'none',
    color:'rgba(255,255,255,0.45)', fontSize:12, fontWeight:600, cursor:'pointer',
    transition:'color 0.15s',
  },
  tabActive: { color:'#fff', borderBottom:'2px solid #818cf8' },

  // Filters
  filterScroll: {
    display:'flex', gap:10, padding:'10px 12px',
    overflowX:'auto', scrollbarWidth:'none', flex:1, alignItems:'center',
  },
  filterItem: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
    background:'none', border:'none', cursor:'pointer', flexShrink:0,
  },
  filterItemActive: {},
  filterPreview: {
    width:52, height:52, borderRadius:12,
    display:'flex', alignItems:'center', justifyContent:'center',
    border:'2.5px solid transparent',
    transition:'border-color 0.15s, transform 0.15s',
    overflow:'hidden',
  },
  filterLabel: {
    fontSize:9.5, color:'rgba(255,255,255,0.55)', fontWeight:600,
    textTransform:'uppercase', letterSpacing:'0.4px',
  },

  // Stickers
  stickerGrid: {
    display:'grid', gridTemplateColumns:'repeat(6,1fr)',
    gap:6, padding:'8px 12px', overflowY:'auto', flex:1,
  },
  stickerBtn: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:3,
    background:'rgba(255,255,255,0.05)', border:'1.5px solid transparent',
    borderRadius:10, padding:'6px 4px', cursor:'pointer',
    transition:'all 0.15s',
  },
  stickerActive: { background:'rgba(129,140,248,0.2)', borderColor:'#818cf8' },

  // Text
  captionInput: {
    background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.15)',
    borderRadius:10, padding:'9px 13px', color:'#fff', fontSize:14,
    outline:'none', width:'100%',
    fontFamily:'Plus Jakarta Sans, sans-serif',
  },

  // Preview
  previewPanel: {
    height:180, background:'#0a0a0a', flexShrink:0,
    display:'flex', flexDirection:'column',
  },
  previewMedia: {
    flex:1, overflow:'hidden',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  previewActions: {
    display:'flex', gap:10, padding:'10px 14px',
    borderTop:'1px solid rgba(255,255,255,0.08)',
  },
  previewBtn: {
    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
    padding:'9px', borderRadius:10,
    background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.15)',
    color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer',
  },
  previewBtnPrimary: {
    flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
    padding:'9px', borderRadius:10,
    background:'linear-gradient(135deg,#4f61d2,#818cf8)',
    border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
    boxShadow:'0 4px 14px rgba(79,97,210,0.4)',
  },
};