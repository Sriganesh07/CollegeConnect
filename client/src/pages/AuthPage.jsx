import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Biotechnology',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Other',
];

const defaultReg = {
  username: '', registerNo: '', phoneNo: '', password: '', confirmPassword: '',
  collegeName: '', department: '', location: '',
  hobbies: '', clubsJoined: '', professionalSocieties: '',
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode,    setMode]    = useState('login');
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [loginData, setLoginData] = useState({ username:'', password:'' });
  const [reg,       setReg]       = useState(defaultReg);

  const switchMode = (m) => { setMode(m); setStep(1); setError(''); setReg(defaultReg); };
  const sf = (f) => (e) => setReg(p => ({ ...p, [f]: e.target.value }));

  // ── Step 1 → 2 ──────────────────────────────────────────────────────────
  const nextStep = (e) => {
    e.preventDefault(); setError('');
    if (!reg.username.trim())     return setError('Username is required.');
    if (!reg.registerNo.trim())   return setError('Register number is required.');
    if (!reg.password)            return setError('Password is required.');
    if (reg.password.length < 6)  return setError('Password must be at least 6 characters.');
    if (reg.password !== reg.confirmPassword) return setError('Passwords do not match.');
    setStep(2);
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(loginData),
      });
      const d = await r.json();
      if (!r.ok) return setError(d.message || 'Login failed.');
      // Store full user object — username is the key used in every API call
      localStorage.setItem('user', JSON.stringify(d.user));
      navigate('/home');
    } catch { setError('Cannot connect to server. Is it running on port 5000?'); }
    finally { setLoading(false); }
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault(); setError('');
    if (!reg.department)   return setError('Please select your department.');
    if (!reg.collegeName.trim()) return setError('College name is required.');
    setLoading(true);
    try {
      const r = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          username:              reg.username,
          registerNo:            reg.registerNo,
          phoneNo:               reg.phoneNo || null,
          password:              reg.password,
          collegeName:           reg.collegeName,
          department:            reg.department,
          location:              reg.location,
          hobbies:               reg.hobbies || 'nil',
          clubsJoined:           reg.clubsJoined || 'nil',
          professionalSocieties: reg.professionalSocieties || 'nil',
        }),
      });
      const d = await r.json();
      if (!r.ok) return setError(d.message || 'Registration failed.');

      // Auto-login after register
      const lr = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ username: reg.username, password: reg.password }),
      });
      const ld = await lr.json();
      if (lr.ok) { localStorage.setItem('user', JSON.stringify(ld.user)); navigate('/home'); }
      else       { switchMode('login'); setError('Registered! Please log in.'); }
    } catch { setError('Cannot connect to server.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${mode==='register' ? 'auth-card--wide' : ''}`}>
        <h1 className="auth-title">CollegeConnect 🚀</h1>

        {/* Toggle */}
        <div className="auth-toggle-wrapper">
          <button type="button" className={`toggle-btn ${mode==='login'?'active':''}`} onClick={() => switchMode('login')}>Login</button>
          <button type="button" className={`toggle-btn ${mode==='register'?'active':''}`} onClick={() => switchMode('register')}>Register</button>
        </div>

        {/* Step indicator */}
        {mode === 'register' && (
          <div className="step-indicator">
            <div className={`step-dot ${step>=1?'step-dot--active':''}`}>1</div>
            <div className={`step-line ${step>=2?'step-line--active':''}`}/>
            <div className={`step-dot ${step>=2?'step-dot--active':''}`}>2</div>
            <span className="step-label">{step===1 ? 'Account info' : 'College & activities'}</span>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {/* ── LOGIN ── */}
        {mode==='login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Username</label>
              <input type="text" placeholder="Enter your username"
                value={loginData.username} onChange={e => setLoginData({...loginData, username:e.target.value})} required/>
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input type="password" placeholder="Enter your password"
                value={loginData.password} onChange={e => setLoginData({...loginData, password:e.target.value})} required/>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
            <p className="forgot-text">Forgot password?</p>
          </form>
        )}

        {/* ── REGISTER STEP 1 ── */}
        {mode==='register' && step===1 && (
          <form className="auth-form" onSubmit={nextStep}>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Username <span className="required">*</span></label>
                <input type="text" placeholder="e.g. vikram_r" value={reg.username} onChange={sf('username')} required/>
              </div>
              <div className="input-group">
                <label className="input-label">Register Number <span className="required">*</span></label>
                <input type="text" placeholder="e.g. RA2211003" value={reg.registerNo} onChange={sf('registerNo')} required/>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number <span className="optional">(optional)</span></label>
              <input type="tel" placeholder="e.g. 9876543210" value={reg.phoneNo} onChange={sf('phoneNo')}/>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Password <span className="required">*</span></label>
                <input type="password" placeholder="Min 6 characters" value={reg.password} onChange={sf('password')} required/>
              </div>
              <div className="input-group">
                <label className="input-label">Confirm Password <span className="required">*</span></label>
                <input type="password" placeholder="Re-enter password" value={reg.confirmPassword} onChange={sf('confirmPassword')} required/>
              </div>
            </div>
            <button type="submit" className="submit-btn">Next →</button>
          </form>
        )}

        {/* ── REGISTER STEP 2 ── */}
        {mode==='register' && step===2 && (
          <form className="auth-form" onSubmit={handleRegister}>

            {/* College & location */}
            <div className="section-divider"><span>College Info</span></div>

            <div className="input-group">
              <label className="input-label">College Name <span className="required">*</span></label>
              <input type="text" placeholder="e.g. SRM Institute of Science and Technology"
                value={reg.collegeName} onChange={sf('collegeName')} required/>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Department <span className="required">*</span></label>
                <div className="select-wrapper">
                  <select value={reg.department} onChange={sf('department')} required>
                    <option value="">— Select department —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <span className="select-arrow">▾</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">City / Location <span className="optional">(optional)</span></label>
                <input type="text" placeholder="e.g. Chennai, Tamil Nadu"
                  value={reg.location} onChange={sf('location')}/>
              </div>
            </div>

            {/* Activities */}
            <div className="section-divider"><span>Activities</span></div>
            <p className="section-note">Leave blank if not applicable — will be saved as <strong>nil</strong>.</p>

            <div className="input-group">
              <label className="input-label">🎯 Hobbies <span className="optional">(comma separated)</span></label>
              <input type="text" placeholder="e.g. Coding, Music, Photography"
                value={reg.hobbies} onChange={sf('hobbies')}/>
            </div>

            <div className="input-group">
              <label className="input-label">🏛️ Clubs Joined <span className="optional">(comma separated)</span></label>
              <input type="text" placeholder="e.g. Coding Club, Robotics Club, Design Club"
                value={reg.clubsJoined} onChange={sf('clubsJoined')}/>
              <span className="field-hint">College clubs you are a member of</span>
            </div>

            <div className="input-group">
              <label className="input-label">🏅 Professional Societies <span className="optional">(comma separated)</span></label>
              <input type="text" placeholder="e.g. IEEE, ACM, ASME, SAE India"
                value={reg.professionalSocieties} onChange={sf('professionalSocieties')}/>
              <span className="field-hint">Professional bodies you hold membership in</span>
            </div>

            <div className="step2-actions">
              <button type="button" className="back-btn" onClick={() => { setStep(1); setError(''); }}>← Back</button>
              <button type="submit" className="submit-btn" disabled={loading} style={{ flex:1 }}>
                {loading ? 'Creating account…' : 'Create Account 🎉'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}