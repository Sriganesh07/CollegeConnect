const express = require('express');
const admin   = require('firebase-admin');
const router  = express.Router();

module.exports = (db) => {
  const timeAgo = (ts) => {
    if (!ts) return '';
    const ms = Date.now() - (ts.seconds ? ts.seconds * 1000 : new Date(ts).getTime());
    const m  = Math.floor(ms / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}d ago`;
    return new Date(ts.seconds ? ts.seconds * 1000 : ts).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  };

  const fmt = (id, d, me) => ({
    id,
    author:         d.author || d.username,
    username:       d.username,
    dept:           d.dept || '',
    content:        d.content || '',
    media:          d.media || null,
    mediaType:      d.mediaType || null,
    tags:           d.tags || [],
    likes_count:    d.likes_count || 0,
    comments_count: d.comments_count || 0,
    isLiked:        me ? (d.likedBy || []).includes(me) : false,
    isSaved:        me ? (d.savedBy || []).includes(me) : false,
    time:           timeAgo(d.createdAt),
  });

  // GET /api/posts/feed — load ALL posts newest first
  router.get('/feed', async (req, res) => {
    try {
      const me   = req.headers['x-username'] || '';
      const snap = await db.collection('posts').orderBy('createdAt', 'desc').limit(60).get();
      res.json(snap.docs.map(d => fmt(d.id, d.data(), me)));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/posts/user/:username
  router.get('/user/:username', async (req, res) => {
    try {
      const me   = req.headers['x-username'] || '';
      const snap = await db.collection('posts')
        .where('username', '==', req.params.username)
        .orderBy('createdAt', 'desc').get();
      res.json(snap.docs.map(d => fmt(d.id, d.data(), me)));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/posts — CREATE (the key fix: username comes from x-username header)
  router.post('/', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      if (!me) return res.status(401).json({ error: 'Not authenticated. Please log in again.' });

      const { content, media, mediaType, tags } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'Post content cannot be empty.' });

      // Pull this user's real department + college from Firestore
      const userDoc = await db.collection('users').doc(me).get();
      const dept    = userDoc.exists
        ? (userDoc.data().department || '')
        : '';

      const ref = await db.collection('posts').add({
        author:         me,
        username:       me,
        dept,
        content:        content.trim(),
        media:          media || null,
        mediaType:      mediaType || null,
        tags:           Array.isArray(tags) ? tags : [],
        likes_count:    0,
        comments_count: 0,
        likedBy:        [],
        savedBy:        [],
        createdAt:      new Date(),
      });

      const created = await ref.get();
      res.status(201).json(fmt(ref.id, created.data(), me));
    } catch (e) {
      console.error('POST /posts error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /api/posts/:id
  router.delete('/:id', async (req, res) => {
    try {
      const me  = req.headers['x-username'];
      const doc = await db.collection('posts').doc(req.params.id).get();
      if (!doc.exists)                   return res.status(404).json({ error: 'not found' });
      if (doc.data().username !== me)    return res.status(403).json({ error: 'forbidden' });
      await db.collection('posts').doc(req.params.id).delete();
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/posts/:id/like
  router.post('/:id/like', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      if (!me) return res.status(401).json({ error: 'Not authenticated' });
      await db.collection('posts').doc(req.params.id).update({
        likes_count: admin.firestore.FieldValue.increment(1),
        likedBy:     admin.firestore.FieldValue.arrayUnion(me),
      });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE /api/posts/:id/like
  router.delete('/:id/like', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      if (!me) return res.status(401).json({ error: 'Not authenticated' });
      await db.collection('posts').doc(req.params.id).update({
        likes_count: admin.firestore.FieldValue.increment(-1),
        likedBy:     admin.firestore.FieldValue.arrayRemove(me),
      });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/posts/:id/save
  router.post('/:id/save', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      await db.collection('posts').doc(req.params.id).update({
        savedBy: admin.firestore.FieldValue.arrayUnion(me),
      });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE /api/posts/:id/save
  router.delete('/:id/save', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      await db.collection('posts').doc(req.params.id).update({
        savedBy: admin.firestore.FieldValue.arrayRemove(me),
      });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/posts/:id/comments
  router.get('/:id/comments', async (req, res) => {
    try {
      const snap = await db.collection('posts').doc(req.params.id)
        .collection('comments').orderBy('createdAt', 'asc').get();
      res.json(snap.docs.map(d => ({
        id:       d.id,
        author:   d.data().author || d.data().username,
        username: d.data().username,
        text:     d.data().text,
        time:     d.data().createdAt
          ? new Date(d.data().createdAt.seconds * 1000)
              .toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
          : '',
      })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/posts/:id/comments
  router.post('/:id/comments', async (req, res) => {
    try {
      const me  = req.headers['x-username'];
      const { text } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'text required' });
      const postRef = db.collection('posts').doc(req.params.id);
      await postRef.collection('comments').add({
        text: text.trim(), username: me, author: me, createdAt: new Date(),
      });
      await postRef.update({ comments_count: admin.firestore.FieldValue.increment(1) });
      res.status(201).json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};