const express = require('express');
const admin   = require('firebase-admin');
const router  = express.Router();

module.exports = (db, io, onlineUsers) => {
  const convId = (a, b) => [a, b].sort().join('__');

  // GET /api/messages/conversations
  router.get('/conversations', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      if (!me) return res.status(401).json({ error: 'Not authenticated' });

      // Use simple array-contains — no composite index needed
      const snap = await db.collection('conversations')
        .where('participants', 'array-contains', me)
        .get();

      // Sort in JS to avoid needing Firestore index
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.lastMessageAt?.seconds || 0;
          const tb = b.lastMessageAt?.seconds || 0;
          return tb - ta;
        });

      const convs = await Promise.all(docs.map(async data => {
        const other = data.participants.find(p => p !== me);
        let dept = '', college = '';
        try {
          const uDoc = await db.collection('users').doc(other).get();
          if (uDoc.exists) { dept = uDoc.data().department || ''; college = uDoc.data().college_name || ''; }
        } catch {}
        return {
          id:          data.id,
          withUser:    other,
          lastMessage: data.lastMessage || '',
          unreadCount: data.unreadBy?.[me] || 0,
          dept, college,
        };
      }));

      res.json(convs);
    } catch (e) {
      console.error('GET conversations error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/messages/unread-count
  router.get('/unread-count', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      if (!me) return res.json({ count: 0 });
      const snap = await db.collection('conversations').where('participants', 'array-contains', me).get();
      let total = 0;
      snap.docs.forEach(d => { total += d.data().unreadBy?.[me] || 0; });
      res.json({ count: total });
    } catch { res.json({ count: 0 }); }
  });

  // POST /api/messages/send  ← MUST be before /:withUser
  router.post('/send', async (req, res) => {
    try {
      const me = req.headers['x-username'];
      if (!me) return res.status(401).json({ error: 'Not authenticated' });

      const { to, text } = req.body;
      if (!to || !text?.trim()) return res.status(400).json({ error: 'to and text required' });
      if (me === to) return res.status(400).json({ error: 'Cannot message yourself' });

      const cid     = convId(me, to);
      const convRef = db.collection('conversations').doc(cid);
      const now     = new Date();

      const msgDoc = await convRef.collection('messages').add({
        sender: me, text: text.trim(), read: false, createdAt: now,
      });

      const convSnap = await convRef.get();
      if (convSnap.exists) {
        await convRef.update({
          lastMessage:                           text.trim(),
          lastMessageAt:                         now,
          [`unreadBy.${to}`]:                    admin.firestore.FieldValue.increment(1),
          // Ensure participants field stays correct
        });
      } else {
        await convRef.set({
          participants:  [me, to],
          lastMessage:   text.trim(),
          lastMessageAt: now,
          unreadBy:      { [to]: 1, [me]: 0 },
          createdAt:     now,
        });
      }

      const saved = {
        id:     msgDoc.id,
        sender: me,
        text:   text.trim(),
        read:   false,
        time:   now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
      };

      // Real-time delivery
      if (io && onlineUsers) {
        const destSockets = onlineUsers.get(to);
        if (destSockets) {
          destSockets.forEach(sid => io.to(sid).emit('receiveMessage', {
            ...saved, sender: 'them', senderId: me,
          }));
          destSockets.forEach(sid => io.to(sid).emit('unreadCountUpdate'));
        }
      }

      res.status(201).json(saved);
    } catch (e) {
      console.error('POST /messages/send error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/messages/:fromUser/read
  router.post('/:fromUser/read', async (req, res) => {
    try {
      const me  = req.headers['x-username'];
      if (!me) return res.status(401).json({ error: 'Not authenticated' });
      const cid     = convId(me, req.params.fromUser);
      const convRef = db.collection('conversations').doc(cid);
      const snap    = await convRef.get();
      if (!snap.exists) return res.json({ success: true });

      await convRef.update({ [`unreadBy.${me}`]: 0 });

      // Batch mark messages read (no compound index needed — just filter sender)
      const msgSnap = await convRef.collection('messages')
        .where('sender', '==', req.params.fromUser)
        .where('read', '==', false)
        .get();
      if (!msgSnap.empty) {
        const batch = db.batch();
        msgSnap.docs.forEach(d => batch.update(d.ref, { read: true }));
        await batch.commit();
      }

      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/messages/:withUser  ← last, catches everything else
  router.get('/:withUser', async (req, res) => {
    try {
      const me  = req.headers['x-username'];
      if (!me) return res.status(401).json({ error: 'Not authenticated' });
      const cid  = convId(me, req.params.withUser);
      const snap = await db.collection('conversations').doc(cid)
        .collection('messages').orderBy('createdAt', 'asc').get();
      res.json(snap.docs.map(d => ({
        id:     d.id,
        sender: d.data().sender,
        text:   d.data().text,
        read:   d.data().read || false,
        time:   d.data().createdAt
          ? new Date(d.data().createdAt.seconds * 1000)
              .toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
          : '',
      })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};