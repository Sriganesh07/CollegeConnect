// src/api.js
const BASE = 'http://localhost:5000/api';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

// ── All requests attach x-username so server always knows who is calling ──
const h = () => ({
  'Content-Type': 'application/json',
  'x-username': getUser()?.username || '',
});

const req = async (method, path, body) => {
  const opts = { method, headers: h() };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const r = await fetch(`${BASE}${path}`, opts);
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.message || json.error || `HTTP ${r.status}`);
  return json;
};

const get  = (p)    => req('GET',    p);
const post = (p, b) => req('POST',   p, b);
const put  = (p, b) => req('PUT',    p, b);
const del  = (p, b) => req('DELETE', p, b);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (d) => post('/auth/register', d),
  login:    (d) => post('/auth/login', d),
};

// ── Users ─────────────────────────────────────────────────────────────────
export const userAPI = {
  getAll:      ()    => get('/users'),
  getProfile:  (u)   => get(`/users/${u}`),
  update:      (u,d) => put(`/users/${u}`, d),
  follow:      (u)   => post(`/users/${u}/follow`),
  unfollow:    (u)   => del(`/users/${u}/follow`),
  isFollowing: (u)   => get(`/users/${u}/is-following`),
  getSuggested:()    => get('/users/suggested'),
  // DMs: get users you can message (all registered users except self)
  getContacts: ()    => get('/users/contacts'),
};

// ── Posts ─────────────────────────────────────────────────────────────────
export const postAPI = {
  getFeed:     ()         => get('/posts/feed'),
  getUserPosts:(u)        => get(`/posts/user/${u}`),
  create:      (d)        => post('/posts', d),
  delete:      (id)       => del(`/posts/${id}`),
  like:        (id)       => post(`/posts/${id}/like`),
  unlike:      (id)       => del(`/posts/${id}/like`),
  getComments: (id)       => get(`/posts/${id}/comments`),
  addComment:  (id, text) => post(`/posts/${id}/comments`, { text }),
  save:        (id)       => post(`/posts/${id}/save`),
  unsave:      (id)       => del(`/posts/${id}/save`),
};

// ── Messages ──────────────────────────────────────────────────────────────
export const messageAPI = {
  getConversations: () => get('/messages/conversations'),
  getMessages:      (u) => get(`/messages/${u}`),
  send:             (to, text) => post('/messages/send', { to, text }),
  markRead:         (u) => post(`/messages/${u}/read`),
  getUnreadCount:   ()  => get('/messages/unread-count'),
};

// ── Repos ─────────────────────────────────────────────────────────────────
export const repoAPI = {
  getAll: (u)    => get(`/users/${u}/repos`),
  add:    (u, d) => post(`/users/${u}/repos`, d),
  remove: (u,id) => del(`/users/${u}/repos/${id}`),
};

// ── Skills ────────────────────────────────────────────────────────────────
export const skillAPI = {
  get:    (u)    => get(`/users/${u}/skills`),
  update: (u, s) => put(`/users/${u}/skills`, { skills: s }),
};

// ── Events ────────────────────────────────────────────────────────────────
export const eventAPI = {
  getAll: ()    => get('/events'),
  create: (d)   => post('/events', d),
  remove: (id)  => del(`/events/${id}`),
};

// ── Clubs ─────────────────────────────────────────────────────────────────
export const clubAPI = {
  getAll:  ()       => get('/clubs'),
  create:  (d)      => post('/clubs', d),
  update:  (id, d)  => put(`/clubs/${id}`, d),
  remove:  (id)     => del(`/clubs/${id}`),
};

// ── Online count ──────────────────────────────────────────────────────────
export const onlineAPI = {
  count: () => get('/online-count'),
};