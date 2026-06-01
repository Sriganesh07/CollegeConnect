import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api';
import { FiUserPlus, FiUserCheck } from 'react-icons/fi';

const COLORS = ['#2563eb','#0891b2','#7c3aed','#e11d48','#059669','#d97706','#db2777','#f97316'];
const aC = (n) => COLORS[(n?.charCodeAt(0)||0) % COLORS.length];

const DEPT_SHORT = {
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
const shorten = (dept) => {
  if (!dept) return '';
  return DEPT_SHORT[dept] || dept.split(' ').map(w => w[0]).join('').slice(0, 4);
};

/* ── Individual person row — checks real follow status on mount ── */
function PersonRow({ user: u, onDismiss }) {
  const navigate = useNavigate();

  // three states: 'loading' | 'following' | 'not_following'
  const [followState, setFollowState] = useState('loading');
  const [busy, setBusy] = useState(false);

  // On mount: ask the server whether we already follow this person
  useEffect(() => {
    userAPI.isFollowing(u.username)
      .then(d => setFollowState(d.following ? 'following' : 'not_following'))
      .catch(() => setFollowState('not_following'));
  }, [u.username]);

  const handleToggle = async () => {
    if (busy || followState === 'loading') return;
    setBusy(true);
    const wasFollowing = followState === 'following';
    // Optimistic update
    setFollowState(wasFollowing ? 'not_following' : 'following');
    try {
      if (wasFollowing) {
        await userAPI.unfollow(u.username);
      } else {
        await userAPI.follow(u.username);
      }
    } catch {
      // Revert on failure
      setFollowState(wasFollowing ? 'following' : 'not_following');
    } finally {
      setBusy(false);
    }
  };

  const isLoading    = followState === 'loading';
  const isFollowing  = followState === 'following';

  return (
    <div style={S.row}>
      {/* Avatar */}
      <div
        style={{ ...S.avatar, background: aC(u.username) }}
        onClick={() => navigate(`/profile/${u.username}`)}
      >
        {u.username?.slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div style={S.info} onClick={() => navigate(`/profile/${u.username}`)}>
        <div style={S.name}>@{u.username}</div>
        <div style={S.meta}>
          {u.department && <span style={S.deptBadge}>{shorten(u.department)}</span>}
          {u.collegeName && (
            <span style={S.college} title={u.collegeName}>
              {u.collegeName.length > 14 ? u.collegeName.slice(0, 13) + '…' : u.collegeName}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={S.actions}>
        <button
          onClick={handleToggle}
          disabled={isLoading || busy}
          style={{
            ...S.followBtn,
            ...(isFollowing ? S.followingBtn : {}),
            opacity: isLoading ? 0.5 : 1,
            cursor: isLoading || busy ? 'default' : 'pointer',
          }}
          title={isFollowing ? 'Unfollow' : 'Follow'}
        >
          {isLoading ? (
            <span style={S.spinner} />
          ) : isFollowing ? (
            <><FiUserCheck size={11} style={{ flexShrink: 0 }} /><span>Following</span></>
          ) : (
            <><FiUserPlus size={11} style={{ flexShrink: 0 }} /><span>Follow</span></>
          )}
        </button>

        {/* Only show dismiss when not already following */}
        {!isFollowing && (
          <button
            style={S.dismissBtn}
            onClick={() => onDismiss(u.username)}
            title="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main widget ── */
export default function SuggestedPeople() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_dismissed_suggestions') || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(true);

  const me = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  useEffect(() => {
    userAPI.getAll()
      .then(users => {
        if (!Array.isArray(users)) return;
        const candidates = users.filter(u =>
          u.username !== me?.username &&
          !dismissed.includes(u.username)
        );
        // Score: same dept = +3, same college = +2, shuffle the rest
        const scored = candidates.map(u => ({
          ...u,
          score:
            (u.department === me?.department ? 3 : 0) +
            (u.collegeName === me?.collegeName ? 2 : 0) +
            Math.random(),
        }));
        scored.sort((a, b) => b.score - a.score);
        setSuggestions(scored.slice(0, 6));
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const handleDismiss = (username) => {
    const updated = [...dismissed, username];
    setDismissed(updated);
    localStorage.setItem('cc_dismissed_suggestions', JSON.stringify(updated));
    setSuggestions(prev => prev.filter(u => u.username !== username));
  };

  if (loading) {
    return (
      <div style={S.wrap}>
        <div style={S.header}>
          <span style={S.headerTitle}>✨ People You May Know</span>
          <span style={S.headerSub}>Based on your profile</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} style={S.skeletonRow}>
            <div style={S.skeletonAvatar} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ ...S.skeletonLine, width: '55%' }} />
              <div style={{ ...S.skeletonLine, width: '38%' }} />
            </div>
            <div style={{ ...S.skeletonLine, width: 70, height: 28, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={S.headerTitle}>✨ People You May Know</span>
        <span style={S.headerSub}>Based on your profile</span>
      </div>

      <div style={S.list}>
        {suggestions.map(u => (
          <PersonRow key={u.username} user={u} onDismiss={handleDismiss} />
        ))}
      </div>

      <button style={S.seeAllBtn} onClick={() => navigate('/clubs')}>
        See more people →
      </button>
    </div>
  );
}

/* ── Styles ── */
const S = {
  wrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: 16,
  },
  header: {
    padding: '14px 16px 10px',
    borderBottom: '1px solid var(--border)',
    background: 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(124,58,237,0.04))',
  },
  headerTitle: {
    display: 'block',
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--text1)',
    letterSpacing: '-0.2px',
  },
  headerSub: {
    display: 'block',
    fontSize: 10.5,
    color: 'var(--text3)',
    marginTop: 2,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.12s',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 12,
    color: '#fff',
    flexShrink: 0,
    cursor: 'pointer',
  },
  info: {
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
  },
  name: {
    fontSize: 12.5,
    fontWeight: 700,
    color: 'var(--text1)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  deptBadge: {
    fontSize: 9.5,
    fontWeight: 700,
    color: 'var(--accent)',
    background: 'rgba(37,99,235,0.08)',
    padding: '1px 5px',
    borderRadius: 4,
  },
  college: {
    fontSize: 10,
    color: 'var(--text3)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  followBtn: {
    height: 28,
    padding: '0 10px',
    borderRadius: 8,
    border: '1.5px solid var(--accent)',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    whiteSpace: 'nowrap',
    transition: 'all 0.18s',
    minWidth: 80,
    justifyContent: 'center',
  },
  followingBtn: {
    background: 'rgba(5,150,105,0.08)',
    color: '#059669',
    border: '1.5px solid rgba(5,150,105,0.35)',
  },
  dismissBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: 'none',
    background: 'none',
    color: 'var(--text3)',
    fontSize: 17,
    fontWeight: 400,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    transition: 'color 0.12s',
  },
  spinner: {
    display: 'inline-block',
    width: 12,
    height: 12,
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  seeAllBtn: {
    width: '100%',
    padding: '10px 16px',
    background: 'none',
    border: 'none',
    borderTop: '1px solid var(--border)',
    color: 'var(--accent)',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center',
  },
  skeletonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
  },
  skeletonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'var(--bg3)',
    flexShrink: 0,
    animation: 'shimmer 1.4s infinite',
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    background: 'var(--bg3)',
    animation: 'shimmer 1.4s infinite',
  },
};