// src/hooks/useProfile.js
import { useState, useEffect, useCallback } from 'react';
import { userAPI, postAPI, repoAPI, skillAPI } from '../api';

const getMe = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

export default function useProfile(username) {
  const me    = getMe();
  const isOwn = !username || username === me?.username;
  const target= isOwn ? me?.username : username;

  const [profile,  setProfile]  = useState(null);
  const [posts,    setPosts]    = useState([]);
  const [repos,    setRepos]    = useState([]);
  const [skills,   setSkills]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    if (!target) return;
    setLoading(true); setError('');
    try {
      const [prof, userPosts, userRepos, userSkills] = await Promise.allSettled([
        userAPI.getProfile(target),
        postAPI.getUserPosts(target),
        repoAPI.getAll(target),
        skillAPI.get(target),
      ]);
      if (prof.status === 'fulfilled')      setProfile(prof.value);
      else                                  setError('User not found or server offline.');
      if (userPosts.status === 'fulfilled') setPosts(Array.isArray(userPosts.value) ? userPosts.value : []);
      if (userRepos.status === 'fulfilled') setRepos(Array.isArray(userRepos.value) ? userRepos.value : []);
      if (userSkills.status === 'fulfilled')setSkills(Array.isArray(userSkills.value) ? userSkills.value : []);
    } catch (e) {
      setError('Could not reach server.');
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async (fields) => {
    setSaving(true);
    try {
      const updated = await userAPI.update(target, fields);
      setProfile(updated);
      if (isOwn) {
        const stored = getMe();
        localStorage.setItem('user', JSON.stringify({ ...stored, ...fields }));
      }
      return true;
    } catch { return false; }
    finally { setSaving(false); }
  };

  const addRepo = async (d) => {
    const r = await repoAPI.add(target, d);
    setRepos(prev => [r, ...prev]);
    return r;
  };

  const removeRepo = async (id) => {
    await repoAPI.remove(target, id);
    setRepos(prev => prev.filter(r => r.id !== id));
  };

  const updateSkills = async (s) => {
    await skillAPI.update(target, s);
    setSkills(s);
  };

  return { profile, posts, repos, skills, loading, error, saving, saveProfile, addRepo, removeRepo, updateSkills, isOwn, reload: load };
}