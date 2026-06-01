import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { messageAPI, userAPI, postAPI } from '../api';
import {
  FiSearch, FiMessageSquare, FiBell, FiLogOut, FiZap,
  FiShield, FiSun, FiMoon, FiX, FiUser, FiHash,
  FiTrendingUp, FiClock, FiCode,
} from 'react-icons/fi';

const COLORS = ['#2563eb','#0891b2','#7c3aed','#e11d48','#059669','#d97706'];
const aC = (n) => COLORS[(n?.charCodeAt(0)||0) % COLORS.length];

const TRENDING_SEARCHES = [
  '#ReactJS', '#MachineLearning', '#Hackathon2026', '#OpenSource',
  '#IEEE', '#GDSC', '#Python', '#Flutter',
];

export default function Topbar({ currentUserId }) {
  const navigate = useNavigate();
  const [activeUsers, setActiveUsers] = useState(1);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState(0);
  const [focus, setFocus] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], tags: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_recent_searches') || '[]'); } catch { return []; }
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('cc_theme') || 'light');
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const registered = useRef(false);
  const searchRef = useRef();
  const searchDebounce = useRef();
  const dropdownRef = useRef();

  // ── FIX: track mouse-down inside dropdown so blur doesn't fire prematurely
  const mouseInDropdown = useRef(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const isAdmin = user?.role === 'admin';
  const initials = currentUserId?.slice(0, 2).toUpperCase() || 'ME';
  const avatarBg = aC(currentUserId);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cc_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // Socket setup
  useEffect(() => {
    if (!currentUserId || registered.current) return;
    registered.current = true;
    socket.emit('registerUser', currentUserId);
    socket.on('connect', () => socket.emit('registerUser', currentUserId));
    socket.on('userCountUpdate', (count) => setActiveUsers(count));
    socket.on('receiveMessage', () => setUnread(prev => prev + 1));
    socket.on('unreadCountUpdate', () => {
      messageAPI.getUnreadCount?.()
        .then(d => setUnread(d.count || 0))
        .catch(() => {});
    });
    fetch(`http://localhost:5000/api/messages/unread-count`, {
      headers: { 'x-username': currentUserId },
    }).then(r => r.json()).then(d => setUnread(d.count || 0)).catch(() => {});

    return () => {
      socket.off('connect');
      socket.off('userCountUpdate');
      socket.off('receiveMessage');
      socket.off('unreadCountUpdate');
    };
  }, [currentUserId]);

  // Search logic
  const doSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ users: [], posts: [], tags: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const [users, posts] = await Promise.allSettled([
        userAPI.getAll(),
        postAPI.getFeed(),
      ]);
      const q = query.toLowerCase();
      const matchedUsers = users.status === 'fulfilled'
        ? (users.value || []).filter(u =>
            u.username?.toLowerCase().includes(q) ||
            u.department?.toLowerCase().includes(q) ||
            u.collegeName?.toLowerCase().includes(q)
          ).slice(0, 5)
        : [];
      const matchedPosts = posts.status === 'fulfilled'
        ? (posts.value || []).filter(p =>
            p.content?.toLowerCase().includes(q) ||
            p.tags?.some(t => t.toLowerCase().includes(q))
          ).slice(0, 3)
        : [];
      const matchedTags = TRENDING_SEARCHES.filter(t => t.toLowerCase().includes(q));
      setSearchResults({ users: matchedUsers, posts: matchedPosts, tags: matchedTags });
    } catch {}
    setSearchLoading(false);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => doSearch(val), 300);
  };

  // ── FIX: save to recent and navigate properly
  const handleUserSelect = (username) => {
    const updated = [username, ...recentSearches.filter(r => r !== username)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('cc_recent_searches', JSON.stringify(updated));
    setSearchVal('');
    setFocus(false);
    navigate(`/profile/${username}`);
  };

  const handlePostSelect = (postId, content) => {
    const snippet = content?.slice(0, 30) || '';
    const updated = [snippet, ...recentSearches.filter(r => r !== snippet)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('cc_recent_searches', JSON.stringify(updated));
    setFocus(false);
    // Navigate to home with post highlighted (or just home)
    navigate(`/home`);
  };

  const handleTagSelect = (tag) => {
    const updated = [tag, ...recentSearches.filter(r => r !== tag)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('cc_recent_searches', JSON.stringify(updated));
    setSearchVal(tag);
    setFocus(false);
    doSearch(tag);
  };

  const handleSearchSelect = (query) => {
    setSearchVal(query);
    const updated = [query, ...recentSearches.filter(r => r !== query)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('cc_recent_searches', JSON.stringify(updated));
    setFocus(false);
  };

  const clearRecent = (item) => {
    const updated = recentSearches.filter(r => r !== item);
    setRecentSearches(updated);
    localStorage.setItem('cc_recent_searches', JSON.stringify(updated));
  };

  const handleMessagesClick = () => setUnread(0);

  const handleLogout = () => {
    localStorage.removeItem('user');
    socket.disconnect();
    navigate('/');
  };

  const hasResults = searchVal.trim() && (
    searchResults.users.length > 0 ||
    searchResults.posts.length > 0 ||
    searchResults.tags.length > 0
  );

  return (
    <>
      <header style={S.bar}>
        {/* Logo */}
        <Link to="/home" style={S.logo}>
          <span style={S.logoIcon}><FiZap size={17} /></span>
          <span style={S.logoText}>CollegeConnect</span>
        </Link>

        {/* Search */}
        <div style={{ ...S.searchContainer, zIndex: focus ? 500 : 1 }} ref={dropdownRef}>
          <div style={{
            ...S.searchWrap,
            ...(focus ? S.searchFocus : {}),
            borderBottomLeftRadius: focus && (searchVal || recentSearches.length) ? 0 : 12,
            borderBottomRightRadius: focus && (searchVal || recentSearches.length) ? 0 : 12,
          }}>
            <FiSearch size={14} style={{ color: focus ? 'var(--accent)' : 'var(--text3)', flexShrink: 0, transition: 'color 0.2s' }} />
            <input
              ref={searchRef}
              style={S.searchInput}
              placeholder="Search students, posts, clubs, tags…"
              value={searchVal}
              onChange={handleSearchChange}
              onFocus={() => setFocus(true)}
              // ── FIX: only close if mouse isn't inside dropdown
              onBlur={() => {
                if (!mouseInDropdown.current) setFocus(false);
              }}
            />
            {searchVal && (
              <button onClick={() => { setSearchVal(''); setSearchResults({ users: [], posts: [], tags: [] }); searchRef.current?.focus(); }} style={S.clearBtn}>
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {focus && (
            <div
              style={S.searchDropdown}
              onMouseEnter={() => { mouseInDropdown.current = true; }}
              onMouseLeave={() => { mouseInDropdown.current = false; }}
            >
              {searchLoading && (
                <div style={S.dropSection}>
                  <div style={S.dropLoader}>Searching…</div>
                </div>
              )}

              {!searchVal && !searchLoading && (
                <>
                  {recentSearches.length > 0 && (
                    <div style={S.dropSection}>
                      <div style={S.dropLabel}><FiClock size={11} /> Recent</div>
                      {recentSearches.map(r => (
                        <div
                          key={r}
                          style={S.dropRow}
                          // ── FIX: use onMouseDown to fire before onBlur
                          onMouseDown={(e) => { e.preventDefault(); handleSearchSelect(r); searchRef.current?.blur(); }}
                        >
                          <FiClock size={13} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                          <span style={S.dropText}>{r}</span>
                          <button
                            style={S.dropRemove}
                            onMouseDown={e => { e.stopPropagation(); e.preventDefault(); clearRecent(r); }}
                          ><FiX size={11} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={S.dropSection}>
                    <div style={S.dropLabel}><FiTrendingUp size={11} /> Trending</div>
                    <div style={S.trendGrid}>
                      {TRENDING_SEARCHES.map(t => (
                        <span
                          key={t}
                          style={S.trendChip}
                          onMouseDown={(e) => { e.preventDefault(); handleTagSelect(t); }}
                        >{t}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {searchVal && !searchLoading && (
                <>
                  {searchResults.users.length > 0 && (
                    <div style={S.dropSection}>
                      <div style={S.dropLabel}><FiUser size={11} /> People</div>
                      {searchResults.users.map(u => (
                        // ── FIX: use onMouseDown + navigate instead of Link + onMouseDown conflict
                        <div
                          key={u.username}
                          style={{ ...S.dropRow, cursor: 'pointer' }}
                          onMouseDown={(e) => { e.preventDefault(); handleUserSelect(u.username); }}
                        >
                          <div style={{ ...S.dropAvatar, background: aC(u.username) }}>
                            {u.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={S.dropText}>@{u.username}</div>
                            <div style={S.dropSub}>{u.department?.split(' & ')[0]} · {u.collegeName}</div>
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>View →</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.tags.length > 0 && (
                    <div style={S.dropSection}>
                      <div style={S.dropLabel}><FiHash size={11} /> Tags</div>
                      <div style={S.trendGrid}>
                        {searchResults.tags.map(t => (
                          <span
                            key={t}
                            style={S.trendChip}
                            onMouseDown={(e) => { e.preventDefault(); handleTagSelect(t); }}
                          >{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.posts.length > 0 && (
                    <div style={S.dropSection}>
                      <div style={S.dropLabel}><FiCode size={11} /> Posts</div>
                      {searchResults.posts.map(p => (
                        <div
                          key={p.id}
                          style={{ ...S.dropRow, cursor: 'pointer' }}
                          onMouseDown={(e) => { e.preventDefault(); handlePostSelect(p.id, p.content); }}
                        >
                          <div style={{ ...S.dropAvatar, background: aC(p.username) }}>
                            {p.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={S.dropText}>{p.content?.slice(0, 60)}{p.content?.length > 60 ? '…' : ''}</div>
                            <div style={S.dropSub}>by @{p.username}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!hasResults && !searchLoading && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                      No results for "<strong>{searchVal}</strong>"
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right side */}
        <div style={S.right}>
          <div style={S.livePill}>
            <span style={S.liveDot} />
            <span style={S.liveText}>{activeUsers} online</span>
          </div>

          <button style={S.themeBtn} onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            <div style={{ ...S.themeBall, transform: theme === 'dark' ? 'translateX(18px)' : 'translateX(0)' }} />
            <FiSun size={10} style={{ position: 'absolute', left: 5, color: theme === 'light' ? '#f59e0b' : '#64748b', transition: 'color 0.3s' }} />
            <FiMoon size={10} style={{ position: 'absolute', right: 5, color: theme === 'dark' ? '#818cf8' : '#64748b', transition: 'color 0.3s' }} />
          </button>

          <Link to="/messages" style={S.iconBtn} title="Messages" onClick={handleMessagesClick}>
            <FiMessageSquare size={18} />
            {unread > 0 && <span style={S.badge}>{unread > 99 ? '99+' : unread}</span>}
          </Link>

          <button style={S.iconBtn} title="Notifications" onClick={() => { setShowNotifPanel(v => !v); setNotifs(0); }}>
            <FiBell size={18} />
            {notifs > 0 && <span style={{ ...S.badge, background: 'var(--rose)' }}>{notifs}</span>}
          </button>

          {isAdmin && (
            <Link to="/admin" style={{ ...S.iconBtn, background: '#fef3c7', border: '1px solid #fbbf24', color: '#92400e' }} title="Admin Panel">
              <FiShield size={17} />
            </Link>
          )}

          <Link to="/profile" style={{ ...S.avatar, background: avatarBg }}>{initials}</Link>
          <button style={S.logoutBtn} onClick={handleLogout} title="Logout">
            <FiLogOut size={16} />
          </button>
        </div>
      </header>

      {showNotifPanel && (
        <div style={S.notifPanel}>
          <div style={S.notifHead}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Notifications</span>
            <button onClick={() => setShowNotifPanel(false)} style={S.notifClose}><FiX size={14} /></button>
          </div>
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            🎉 You're all caught up!
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  bar: {
    height: 'var(--topbar-h)', minHeight: 'var(--topbar-h)',
    display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px',
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 0, zIndex: 200, flexShrink: 0,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 9,
    background: 'linear-gradient(135deg,#2563eb,#0891b2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
  },
  logoText: { fontSize: 16, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.4px', whiteSpace: 'nowrap' },
  searchContainer: { flex: 1, maxWidth: 460, position: 'relative' },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg)', border: '1.5px solid var(--border)',
    borderRadius: 12, padding: '0 14px', transition: 'all 0.2s',
  },
  searchFocus: { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--glow)', background: 'var(--surface)' },
  searchInput: { flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text1)', padding: '10px 0' },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', padding: 2, borderRadius: 4 },
  searchDropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    background: 'var(--surface)', border: '1.5px solid var(--accent)',
    borderTop: 'none', borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: 420, overflowY: 'auto',
    zIndex: 500,
  },
  dropSection: { padding: '8px 0', borderBottom: '1px solid var(--border)' },
  dropLabel: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 10, fontWeight: 700, color: 'var(--text3)',
    textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 14px 6px',
  },
  dropRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 14px', cursor: 'pointer', textDecoration: 'none',
    transition: 'background 0.12s',
  },
  dropText: { fontSize: 13, fontWeight: 600, color: 'var(--text1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  dropSub: { fontSize: 11, color: 'var(--text3)', marginTop: 1 },
  dropAvatar: {
    width: 28, height: 28, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  dropRemove: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, borderRadius: 4 },
  dropLoader: { padding: '12px 14px', fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' },
  trendGrid: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 14px 8px' },
  trendChip: {
    fontSize: 12, fontWeight: 600, color: 'var(--accent)',
    background: 'rgba(79,97,210,0.08)', border: '1px solid rgba(79,97,210,0.2)',
    padding: '3px 10px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
  },
  right: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 },
  livePill: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 20, padding: '5px 11px',
  },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--emerald)', animation: 'pulse-dot 2s infinite' },
  liveText: { fontSize: 12, fontWeight: 600, color: 'var(--emerald)' },
  themeBtn: {
    position: 'relative', width: 46, height: 24, borderRadius: 12,
    background: 'var(--bg3)', border: '1.5px solid var(--border)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0,
    transition: 'all 0.3s', flexShrink: 0,
  },
  themeBall: {
    position: 'absolute', left: 3, width: 16, height: 16, borderRadius: '50%',
    background: 'var(--accent)', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  iconBtn: {
    position: 'relative', width: 36, height: 36, borderRadius: 9,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text2)', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s',
  },
  badge: {
    position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16,
    borderRadius: 8, background: 'var(--accent)', color: '#fff',
    fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center',
    justifyContent: 'center', border: '2px solid var(--surface)', padding: '0 2px',
  },
  avatar: {
    width: 34, height: 34, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 12, color: '#fff', textDecoration: 'none',
    flexShrink: 0, boxShadow: '0 0 0 2px var(--border2)',
  },
  logoutBtn: {
    width: 34, height: 34, borderRadius: 9,
    background: '#fff1f2', border: '1px solid #fecdd3',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--rose)', cursor: 'pointer',
  },
  notifPanel: {
    position: 'fixed', top: 'var(--topbar-h)', right: 16, width: 320,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, boxShadow: 'var(--shadow-lg)', zIndex: 300,
    animation: 'fadeUp 0.2s ease both',
  },
  notifHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', borderBottom: '1px solid var(--border)',
  },
  notifClose: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 4, borderRadius: 6 },
};