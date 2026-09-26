import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Lock,
  Mail,
  User,
  IdCard,
  Phone,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  HardHat,
  Loader2,
  Sparkles,
  Database,
  LogOut,
  BadgeCheck,
  Package
} from 'lucide-react';
import { api, getStoredUser, clearAuthSession } from '../services/api';

export default function AuthPage({ onEnterMasterData }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Check if session was already active on mount
  useEffect(() => {
    const existingUser = getStoredUser();
    if (existingUser) {
      setLoggedInUser(existingUser);
      setSuccessMsg('Active session detected. Logged in successfully!');
    }
  }, []);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    employee_id: '',
    role: 'manager', // 'manager' | 'staff'
    email: '',
    phone_number: '',
    batch: 'BATCH-A-01',
    password: '',
    confirmPassword: '',
  });

  // Handle register field change
  const handleRegisterChange = (field, value) => {
    setRegisterData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Quick Demo Autofill
  const fillDemo = (roleType) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoggedInUser(null);
    setMode('login');
    if (roleType === 'manager') {
      setLoginEmail('manager@stocksense.com');
      setLoginPassword('Manager@123');
      setSuccessMsg('Loaded Inventory Manager demo credentials.');
    } else {
      setLoginEmail('staff@stocksense.com');
      setLoginPassword('Staff@123');
      setSuccessMsg('Loaded Warehouse Staff demo credentials.');
    }
  };

  // Clear session / Log out
  const handleLogout = () => {
    clearAuthSession();
    setLoggedInUser(null);
    setSuccessMsg('');
    setErrorMsg('');
    setLoginPassword('');
  };

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please enter both your email/Employee ID and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(loginEmail.trim(), loginPassword);
      setLoggedInUser(res.user);
      setSuccessMsg('Login Successful!');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const { name, employee_id, role, email, phone_number, batch, password, confirmPassword } = registerData;

    if (!name.trim()) return setErrorMsg('Full Name is required.');
    if (!employee_id.trim()) return setErrorMsg('Employee ID is required (e.g. MGR-104 or STF-205).');
    if (!email.trim()) return setErrorMsg('Valid work email address is required.');
    if (!password) return setErrorMsg('Password is required.');
    if (password.length < 6) return setErrorMsg('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setErrorMsg('Passwords do not match.');

    try {
      setLoading(true);
      const res = await api.register({
        name: name.trim(),
        employee_id: employee_id.trim().toUpperCase(),
        role,
        email: email.trim(),
        phone_number: phone_number.trim(),
        batch: batch.trim() || 'BATCH-GENERAL',
        password,
      });

      setLoggedInUser(res.user);
      setSuccessMsg(`Registration Successful! Account created in SQLite.`);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px 16px',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Background Grid Pattern */}
      <div className="bg-grid"></div>

      {/* Top Branding & Connection Tag */}
      <div style={{ textAlign: 'center', marginBottom: '24px', maxWidth: '580px', width: '100%' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '12px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            padding: '10px',
            borderRadius: '14px',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Boxes size={28} color="#ffffff" />
          </div>
          <span style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            StockSense
          </span>
          {onEnterMasterData && (
            <button
              type="button"
              onClick={onEnterMasterData}
              className="btn btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.78rem', borderRadius: '999px', marginLeft: '6px' }}
            >
              <Package size={13} color="#0ea5e9" />
              <span>Master Data Hub &rarr;</span>
            </button>
          )}

        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Authentication Portal for Inventory Managers & Warehouse Staff
        </p>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '32px' }}>

        {/* ================= SUCCESS STATE: LOGGED IN USER CARD ================= */}
        {loggedInUser ? (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            {/* Prominent Login Successful Banner */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
              }}>
                <CheckCircle2 size={30} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#6ee7b7', margin: 0 }}>
                  Login Successful!
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#a7f3d0', marginTop: '4px' }}>
                  Authenticated and verified in SQLite database (<code>stock-sense.db</code>)
                </p>
              </div>
            </div>

            {/* Authenticated User Details Table / Profile Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: loggedInUser.role === 'manager' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                    color: loggedInUser.role === 'manager' ? '#34d399' : '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {loggedInUser.role === 'manager' ? <ShieldCheck size={24} /> : <HardHat size={24} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>
                      {loggedInUser.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ID: <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{loggedInUser.employee_id}</span>
                    </div>
                  </div>
                </div>
                <span className={`badge ${loggedInUser.role === 'manager' ? 'badge-manager' : 'badge-staff'}`}>
                  {loggedInUser.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'}
                </span>
              </div>

              {/* User Information Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Work Email</div>
                  <div style={{ color: '#fff', fontWeight: '500', wordBreak: 'break-all' }}>{loggedInUser.email}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Phone Number</div>
                  <div style={{ color: '#fff', fontWeight: '500' }}>{loggedInUser.phone_number || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Assigned Batch / Shift</div>
                  <div style={{ color: '#38bdf8', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{loggedInUser.batch || 'GENERAL-01'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Role Type</div>
                  <div style={{ color: '#fff', fontWeight: '600' }}>
                    {loggedInUser.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'}
                  </div>
                </div>
              </div>
            </div>

            {/* Open Master Data Console Button */}
            {onEnterMasterData && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onEnterMasterData}
                style={{ width: '100%', marginBottom: '12px', padding: '12px' }}
              >
                <Package size={18} />
                <span>Open Product & Master Data Hub &rarr;</span>
              </button>
            )}

            {/* Logout / Switch User Button */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ width: '100%' }}
            >
              <LogOut size={16} />
              Sign Out / Log in as Another User
            </button>
          </div>
        ) : (
          /* ================= LOGIN & REGISTER FORMS ================= */
          <>
            {/* Tab switch between Login & Register */}
            <div className="tabs-nav">
              <button
                type="button"
                className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                Staff & Manager Login
              </button>
              <button
                type="button"
                className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                Register Personnel
              </button>
            </div>

            {/* Demo Quick Fills */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Instant Demo Accounts:</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                  onClick={() => fillDemo('manager')}
                >
                  Manager Demo
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                  onClick={() => fillDemo('staff')}
                >
                  Staff Demo
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="alert alert-error">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMsg && (
              <div className="alert alert-success">
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ================= LOGIN FORM ================= */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={15} /> Work Email or Employee ID
                  </label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="manager@stocksense.com or MGR-1001"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">
                      <Lock size={15} /> Password
                    </label>
                  </div>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Enter your security password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      Verifying Credentials in SQLite...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ================= REGISTER FORM ================= */
              <form onSubmit={handleRegisterSubmit}>

                {/* Target Role Selector */}
                <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                  <label className="form-label" style={{ marginBottom: '8px' }}>
                    Select Operational Role
                  </label>
                  <div className="role-cards-grid">
                    <div
                      className={`role-card ${registerData.role === 'manager' ? 'selected' : ''}`}
                      onClick={() => handleRegisterChange('role', 'manager')}
                    >
                      <div className="role-icon-box manager">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <div className="role-title">Inventory Manager</div>
                        <div className="role-desc">Stock auditing, replenishment approvals, POs & team overview.</div>
                      </div>
                    </div>

                    <div
                      className={`role-card ${registerData.role === 'staff' ? 'selected' : ''}`}
                      onClick={() => handleRegisterChange('role', 'staff')}
                    >
                      <div className="role-icon-box staff">
                        <HardHat size={20} />
                      </div>
                      <div>
                        <div className="role-title">Warehouse Staff</div>
                        <div className="role-desc">Inward handling, barcode scan, dispatch & batch movements.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name and Employee ID Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      <User size={14} /> Full Name
                    </label>
                    <div className="input-wrapper">
                      <User size={15} className="input-icon" />
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Liam Foster"
                        value={registerData.name}
                        onChange={(e) => handleRegisterChange('name', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <IdCard size={14} /> Employee ID
                    </label>
                    <div className="input-wrapper">
                      <IdCard size={15} className="input-icon" />
                      <input
                        type="text"
                        className="input-field"
                        placeholder={registerData.role === 'manager' ? 'MGR-1045' : 'STF-3022'}
                        value={registerData.employee_id}
                        onChange={(e) => handleRegisterChange('employee_id', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email and Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      <Mail size={14} /> Work Email
                    </label>
                    <div className="input-wrapper">
                      <Mail size={15} className="input-icon" />
                      <input
                        type="email"
                        className="input-field"
                        placeholder="name@stocksense.com"
                        value={registerData.email}
                        onChange={(e) => handleRegisterChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Phone size={14} /> Phone Number
                    </label>
                    <div className="input-wrapper">
                      <Phone size={15} className="input-icon" />
                      <input
                        type="text"
                        className="input-field"
                        placeholder="+1 555-0199"
                        value={registerData.phone_number}
                        onChange={(e) => handleRegisterChange('phone_number', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Batch / Shift Code */}
                <div className="form-group">
                  <label className="form-label">
                    <Layers size={14} /> Warehouse Batch / Shift Code
                  </label>
                  <div className="input-wrapper">
                    <Layers size={15} className="input-icon" />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. BATCH-BAY-02, Morning Shift, BATCH-NORTH"
                      value={registerData.batch}
                      onChange={(e) => handleRegisterChange('batch', e.target.value)}
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      <Lock size={14} /> Password
                    </label>
                    <div className="input-wrapper">
                      <Lock size={15} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input-field"
                        placeholder="Min 6 chars"
                        value={registerData.password}
                        onChange={(e) => handleRegisterChange('password', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Lock size={14} /> Confirm
                    </label>
                    <div className="input-wrapper">
                      <Lock size={15} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input-field"
                        placeholder="Repeat password"
                        value={registerData.confirmPassword}
                        onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '10px' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      Registering User into SQLite...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* Database Footer Status */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--text-dim)',
          fontSize: '0.8rem'
        }}>
          <span>StockSense</span>
        </div>
      </div>
    </div>
  );
}
