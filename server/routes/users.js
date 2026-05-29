const express = require('express');
const admin   = require('firebase-admin');
const router  = express.Router();

module.exports = (db) => {

  const fmt = (d) => ({
    username:               d.username,
    collegeName:            d.college_name || '',
    department:             d.department || '',
    location:               d.location || '',
    role:                   d.role || 'student',
    bio:                    d.bio || '',
    phone_no:               d.phone_no || '',
    github_url:             d.github_url || '',
    website:                d.website || '',
    hobbies:                d.hobbies || [],
    clubs_joined:           d.clubs_joined || [],
    professional_societies: d.professional_societies || [],
    followers_count:        d.followers_count || 0,
    following_count:        d.following_count || 0,
    skills:                 d.skills || [],
    joined: d.createdAt
      ? new Date(d.createdAt.seconds ? d.createdAt.seconds*1000 : d.createdAt)
          .toLocaleDateString('en-IN', { month:'long', year:'numeric' })
      : 'Recently',
  });

  // GET /api/users/suggested — returns only users NOT yet followed
  router.get('/suggested', async (req, res) => {
    try {
      const me = req.headers['x-username'] || '';

      // Get who I already follow
      const followSnap = await db.collection('follows')
        .where('follower', '==', me)
        .get();
      const alreadyFollowing = new Set(followSnap.docs.map(d => d.data().following));
      alreadyFollowing.add(me); // exclude self

      const snap = await db.collection('users').limit(20).get();
      const all  = snap.docs
        .map(d => fmt(d.data()))
        .filter(u => !alreadyFollowing.has(u.username));

      res.json(all.slice(0, 5));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/users/contacts — all users except self
  router.get('/contacts', async (req, res) => {
    try {
      const me   = req.headers['x-username'] || '';
      const snap = await db.collection('users').get();
      const all  = snap.docs.map(d => ({
        username:    d.data().username,
        department:  d.data().department || '',
        collegeName: d.data().college_name || '',
      })).filter(u => u.username !== me);
      res.json(all);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/users
  router.get('/', async (req, res) => {
    try {
      const snap = await db.collection('users').get();
      res.json(snap.docs.map(d => fmt(d.data())));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/users/:username
  router.get('/:username', async (req, res) => {
    try {
      const doc = await db.collection('users').doc(req.params.username).get();
      if (!doc.exists) return res.status(404).json({ error: 'User not found' });
      res.json(fmt(doc.data()));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/users/:username
  router.put('/:username', async (req, res) => {
    try {
      const ALLOWED = ['bio','location','phone_no','github_url','website',
                       'hobbies','clubs_joined','professional_societies','college_name','department'];
      const update = { updatedAt: new Date() };
      ALLOWED.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
      if (req.body.collegeName !== undefined) update.college_name = req.body.collegeName;
      await db.collection('users').doc(req.params.username).update(update);
      const doc = await db.collection('users').doc(req.params.username).get();
      res.json(fmt(doc.data()));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/users/:username/follow
  router.post('/:username/follow', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      const target = req.params.username;
      if (!me || me === target) return res.status(400).json({ error: 'invalid' });

      const followRef = db.collection('follows').doc(`${me}_${target}`);
      if ((await followRef.get()).exists) return res.json({ already: true });

      await followRef.set({ follower: me, following: target, createdAt: new Date() });
      await db.collection('users').doc(target).update({ followers_count: admin.firestore.FieldValue.increment(1) });
      await db.collection('users').doc(me).update({ following_count: admin.firestore.FieldValue.increment(1) });

      // Create notification for the target user
      await db.collection('notifications').add({
        type:      'follow',
        from:      me,
        to:        target,
        message:   `${me} started following you`,
        read:      false,
        createdAt: new Date(),
      });

      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE /api/users/:username/follow
  router.delete('/:username/follow', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      const target = req.params.username;
      if (!me) return res.status(400).json({ error: 'not authenticated' });

      const followRef = db.collection('follows').doc(`${me}_${target}`);
      if (!(await followRef.get()).exists) return res.json({ notFollowing: true });

      await followRef.delete();
      await db.collection('users').doc(target).update({ followers_count: admin.firestore.FieldValue.increment(-1) });
      await db.collection('users').doc(me).update({ following_count: admin.firestore.FieldValue.increment(-1) });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/users/:username/is-following
  router.get('/:username/is-following', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      if (!me) return res.json({ following: false });
      const doc = await db.collection('follows').doc(`${me}_${req.params.username}`).get();
      res.json({ following: doc.exists });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/users/:username/repos
  router.get('/:username/repos', async (req, res) => {
    try {
      const snap = await db.collection('users').doc(req.params.username)
        .collection('repos').orderBy('createdAt','desc').get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/users/:username/repos
  router.post('/:username/repos', async (req, res) => {
    try {
      const { name, desc, lang } = req.body;
      if (!name) return res.status(400).json({ error: 'name required' });
      const ref = await db.collection('users').doc(req.params.username)
        .collection('repos').add({ name, desc: desc||'', lang: lang||'JavaScript',
          stars:0, forks:0, updated:'just now', createdAt: new Date() });
      res.status(201).json({ id: ref.id, name, desc: desc||'', lang: lang||'JavaScript', stars:0, forks:0, updated:'just now' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE /api/users/:username/repos/:repoId
  router.delete('/:username/repos/:repoId', async (req, res) => {
    try {
      await db.collection('users').doc(req.params.username)
        .collection('repos').doc(req.params.repoId).delete();
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/users/:username/skills
  router.get('/:username/skills', async (req, res) => {
    try {
      const doc = await db.collection('users').doc(req.params.username).get();
      res.json(doc.exists ? (doc.data().skills || []) : []);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/users/:username/skills
  router.put('/:username/skills', async (req, res) => {
    try {
      const { skills } = req.body;
      if (!Array.isArray(skills)) return res.status(400).json({ error: 'skills must be array' });
      await db.collection('users').doc(req.params.username).update({ skills, updatedAt: new Date() });
      res.json({ success: true, skills });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/users/:username/notifications
  router.get('/:username/notifications', async (req, res) => {
    try {
      const snap = await db.collection('notifications')
        .where('to', '==', req.params.username)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { res.json([]); }
  });

  // POST /api/users/:username/notifications/read
  router.post('/:username/notifications/read', async (req, res) => {
    try {
      const snap = await db.collection('notifications')
        .where('to', '==', req.params.username)
        .where('read', '==', false)
        .get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();
      res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
  });

  return router;
};