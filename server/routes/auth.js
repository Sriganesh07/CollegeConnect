const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();

module.exports = (db) => {
  const toArr = (v) => {
    if (!v || String(v).trim() === '' || String(v).toLowerCase().trim() === 'nil') return ['nil'];
    return String(v).split(',').map(s => s.trim()).filter(Boolean);
  };

  // ── REGISTER ──────────────────────────────────────────────────────────────
  router.post('/register', async (req, res) => {
    try {
      const {
        username, registerNo, phoneNo, password,
        collegeName, department, location,
        hobbies, clubsJoined, professionalSocieties,
      } = req.body;

      if (!username?.trim() || !registerNo?.trim() || !password || !department || !collegeName?.trim())
        return res.status(400).json({ message: 'username, registerNo, password, department and collegeName are required.' });

      const ref = db.collection('users').doc(username.trim());
      if ((await ref.get()).exists)
        return res.status(400).json({ message: 'Username already taken.' });

      const allSnap = await db.collection('users').limit(1).get();
      const role    = allSnap.empty ? 'admin' : 'student';
      const hash    = await bcrypt.hash(password, 10);

      await ref.set({
        username:               username.trim(),
        register_no:            registerNo.trim(),
        phone_no:               phoneNo || '',
        password:               hash,
        college_name:           collegeName.trim(),
        department:             department,
        location:               location || '',
        role,
        bio:                    '',
        github_url:             '',
        website:                '',
        hobbies:                toArr(hobbies),
        clubs_joined:           toArr(clubsJoined),
        professional_societies: toArr(professionalSocieties),
        followers_count:        0,
        following_count:        0,
        skills:                 [],
        createdAt:              new Date(),
      });

      res.status(201).json({ message: 'Account created!' });
    } catch (e) {
      console.error('Register error:', e);
      res.status(500).json({ message: 'Registration failed on server.' });
    }
  });

  // ── LOGIN ────────────────────────────────────────────────────────────────
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        return res.status(400).json({ message: 'Username and password required.' });

      const doc = await db.collection('users').doc(username.trim()).get();
      if (!doc.exists) return res.status(400).json({ message: 'User not found.' });

      const d = doc.data();
      if (!await bcrypt.compare(password, d.password))
        return res.status(400).json({ message: 'Incorrect password.' });

      // Return EVERYTHING the frontend needs — no extra API calls needed on first load
      res.json({
        message: 'Login successful!',
        user: {
          username:               d.username,
          registerNo:             d.register_no,
          collegeName:            d.college_name || '',
          department:             d.department || '',
          location:               d.location || '',
          role:                   d.role || 'student',
          bio:                    d.bio || '',
          github_url:             d.github_url || '',
          website:                d.website || '',
          phone_no:               d.phone_no || '',
          hobbies:                d.hobbies || [],
          clubs_joined:           d.clubs_joined || [],
          professional_societies: d.professional_societies || [],
          followers_count:        d.followers_count || 0,
          following_count:        d.following_count || 0,
        },
      });
    } catch (e) {
      console.error('Login error:', e);
      res.status(500).json({ message: 'Login failed on server.' });
    }
  });

  return router;
};