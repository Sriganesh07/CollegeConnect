// server/routes/events.js
const express = require('express');
const router  = express.Router();

module.exports = (db) => {

  // ── GET /api/events ──────────────────────────────────────────────────────
  router.get('/', async (req, res) => {
    try {
      const snap = await db.collection('events').orderBy('createdAt', 'desc').get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/events ─────────────────────────────────────────────────────
  router.post('/', async (req, res) => {
    try {
      const { name, date, club, icon, color } = req.body;
      if (!name || !date) return res.status(400).json({ error: 'name and date required' });
      const ref = await db.collection('events').add({
        name, date, club: club || '', icon: icon || '📅', color: color || '#2563eb',
        createdAt: new Date(),
      });
      res.status(201).json({ id: ref.id, name, date, club, icon, color });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DELETE /api/events/:id ───────────────────────────────────────────────
  router.delete('/:id', async (req, res) => {
    try {
      await db.collection('events').doc(req.params.id).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};