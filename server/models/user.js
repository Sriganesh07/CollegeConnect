// server/routes/users.js
const express = require('express');
const router  = express.Router();

module.exports = (db) => {

  // ── Helper: format user doc for response ────────────────────────────────
  const fmt = (data) => ({
    username:               data.username,
    registerNo:             data.register_no,
    department:             data.department || '',
    role:                   data.role || 'student',
    bio:                    data.bio || '',
    location:               data.location || '',
    phone_no:               data.phone_no || '',
    github_url:             data.github_url || '',
    website:                data.website || '',
    hobbies:                data.hobbies || ['nil'],
    clubs_joined:           data.clubs_joined || ['nil'],
    student_chapters:       data.student_chapters || ['nil'],
    professional_societies: data.professional_societies || ['nil'],
    followers_count:        data.followers_count || 0,
    following_count:        data.following_count || 0,
    joined:                 data.createdAt
      ? new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : 'Recently',
  });

  // ── GET /api/users  — all users (admin use) ─────────────────────────────
  router.get('/', async (req, res) => {
    try {
      const snap = await db.collection('users').get();
      const users = snap.docs.map(d => fmt(d.data()));
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/users/:username ─────────────────────────────────────────────
  router.get('/:username', async (req, res) => {
    try {
      const doc = await db.collection('users').doc(req.params.username).get();
      if (!doc.exists) return res.status(404).json({ error: 'User not found' });
      res.json(fmt(doc.data()));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── PUT /api/users/:username  — update own profile ───────────────────────
  router.put('/:username', async (req, res) => {
    try {
      const ref = db.collection('users').doc(req.params.username);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: 'User not found' });

      // Only allow updating safe fields
      const ALLOWED = [
        'bio','location','phone_no','github_url','website',
        'hobbies','clubs_joined','student_chapters','professional_societies',
      ];
      const update = {};
      ALLOWED.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
      update.updatedAt = new Date();

      await ref.update(update);
      const updated = await ref.get();
      res.json(fmt(updated.data()));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/users/:username/follow ────────────────────────────────────
  router.post('/:username/follow', async (req, res) => {
    try {
      // Very simple: increment target's followers_count, requester's following_count
      const targetRef  = db.collection('users').doc(req.params.username);
      // In a real app you'd read the requester from JWT; we trust the body for now
      const meUsername = req.body.me || req.headers['x-username'];
      const meRef      = meUsername ? db.collection('users').doc(meUsername) : null;

      const targetDoc = await targetRef.get();
      if (!targetDoc.exists) return res.status(404).json({ error: 'User not found' });

      await targetRef.update({ followers_count: (targetDoc.data().followers_count || 0) + 1 });
      if (meRef) {
        const meDoc = await meRef.get();
        if (meDoc.exists) await meRef.update({ following_count: (meDoc.data().following_count || 0) + 1 });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DELETE /api/users/:username/follow ──────────────────────────────────
  router.delete('/:username/follow', async (req, res) => {
    try {
      const targetRef = db.collection('users').doc(req.params.username);
      const meUsername = req.body.me || req.headers['x-username'];
      const meRef = meUsername ? db.collection('users').doc(meUsername) : null;

      const targetDoc = await targetRef.get();
      if (!targetDoc.exists) return res.status(404).json({ error: 'User not found' });

      const fc = targetDoc.data().followers_count || 0;
      await targetRef.update({ followers_count: Math.max(0, fc - 1) });
      if (meRef) {
        const meDoc = await meRef.get();
        if (meDoc.exists) {
          const fwc = meDoc.data().following_count || 0;
          await meRef.update({ following_count: Math.max(0, fwc - 1) });
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/users/:username/repos ──────────────────────────────────────
  router.get('/:username/repos', async (req, res) => {
    try {
      const snap = await db
        .collection('users').doc(req.params.username)
        .collection('repos')
        .orderBy('createdAt', 'desc')
        .get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/users/:username/repos ─────────────────────────────────────
  router.post('/:username/repos', async (req, res) => {
    try {
      const { name, desc, lang } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const ref = await db
        .collection('users').doc(req.params.username)
        .collection('repos')
        .add({ name, desc: desc || '', lang: lang || 'JavaScript', stars: 0, forks: 0, createdAt: new Date(), updated: 'just now' });
      res.status(201).json({ id: ref.id, name, desc, lang, stars: 0, forks: 0, updated: 'just now' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DELETE /api/users/:username/repos/:repoId ───────────────────────────
  router.delete('/:username/repos/:repoId', async (req, res) => {
    try {
      await db
        .collection('users').doc(req.params.username)
        .collection('repos').doc(req.params.repoId)
        .delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/users/:username/skills ─────────────────────────────────────
  router.get('/:username/skills', async (req, res) => {
    try {
      const doc = await db.collection('users').doc(req.params.username).get();
      if (!doc.exists) return res.json([]);
      res.json(doc.data().skills || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── PUT /api/users/:username/skills ─────────────────────────────────────
  router.put('/:username/skills', async (req, res) => {
    try {
      const { skills } = req.body;
      if (!Array.isArray(skills)) return res.status(400).json({ error: 'skills must be array' });
      await db.collection('users').doc(req.params.username).update({ skills, updatedAt: new Date() });
      res.json({ success: true, skills });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};