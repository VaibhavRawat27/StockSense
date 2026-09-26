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
  ArrowLeft,
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
  Package,
  KeyRound,
  Send,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { api, getStoredUser, clearAuthSession } from '../services/api';

export default function AuthPage({ onEnterMasterData }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Forgot & Reset Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [devCodePreview, setDevCodePreview] = useState(null);
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [showSmtpInfo, setShowSmtpInfo] = useState(false);

  // Check session and parse potential reset link parameters on mount
  useEffect(() => {
    const existingUser = getStoredUser();
    if (existingUser) {
      setLoggedInUser(existingUser);
      setSuccessMsg('Active session detected. Logged in successfully!');
    }

    // Check Google SMTP configuration status from backend
    api.getSmtpStatus()
      .then(res => {
        if (res && res.smtp) setSmtpStatus(res.smtp);
      })
      .catch(() => {});

    // Parse URL query parameters for reset links
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    const emailParam = urlParams.get('email');
    const tokenParam = urlParams.get('token');
    const codeParam = urlParams.get('code');

    if (modeParam === 'reset' || tokenParam || codeParam) {
      setMode('reset');
      if (emailParam) {
        setResetEmail(emailParam);
        setForgotEmail(emailParam);
      }
      if (codeParam) setResetCode(codeParam);
      if (tokenParam) setResetToken(tokenParam);
      setSuccessMsg('Reset code recognized from link. Please enter your new password.');
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

  // Submit Forgot Password (triggers email via Google SMTP)
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setDevCodePreview(null);

    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your registered account email.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.forgotPassword(forgotEmail.trim());
      setSuccessMsg(res.message || 'Password reset email sent! Check your inbox.');
      setResetEmail(forgotEmail.trim());
      if (res.devCode) {
        setDevCodePreview(res.devCode);
        setResetCode(res.devCode);
      }
      if (res.devToken) {
        setResetToken(res.devToken);
      }
      setMode('reset');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Password Reset (updates password in SQLite)
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!resetEmail.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!resetCode.trim() && !resetToken) {
      setErrorMsg('Please enter the 6-digit verification code from your email.');
      return;
    }
    if (!newPassword) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmResetPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.resetPassword({
        email: resetEmail.trim(),
        code: resetCode.trim(),
        token: resetToken,
        new_password: newPassword,
        confirm_password: confirmResetPassword,
      });

      setSuccessMsg(res.message || 'Password updated successfully! Please log in.');
      setLoginEmail(resetEmail.trim());
      setLoginPassword('');
      setNewPassword('');
      setConfirmResetPassword('');
      setResetCode('');
      setResetToken('');
      setDevCodePreview(null);
      setMode('login');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password.');
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
        ) : mode === 'forgot' ? (
          /* ================= FORGOT PASSWORD VIEW (GOOGLE SMTP) ================= */
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '4px 0'
                }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '999px',
                background: smtpStatus?.configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: smtpStatus?.configured ? '#34d399' : '#fbbf24',
                border: `1px solid ${smtpStatus?.configured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: smtpStatus?.configured ? '#10b981' : '#f59e0b'
                }}></span>
                <span>{smtpStatus?.configured ? `Google SMTP Active` : 'SMTP Pending in .env'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff', margin: '0 0 6px 0' }}>
                Forgot Password?
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.45' }}>
                Enter your work email address below. We will send a 6-digit verification code and reset instructions via Google SMTP.
              </p>
            </div>

            {/* Google SMTP Setup Guide Callout */}
            <div style={{
              background: 'rgba(14, 165, 233, 0.07)',
              border: '1px solid rgba(14, 165, 233, 0.22)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '18px',
              fontSize: '0.8rem',
              color: '#cbd5e1'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: '600' }}>
                  <HelpCircle size={15} />
                  <span>Google App Password SMTP Setup</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSmtpInfo(!showSmtpInfo)}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {showSmtpInfo ? 'Hide Setup Guide' : 'How to Setup'}
                </button>
              </div>
              {showSmtpInfo && (
                <div style={{ marginTop: '10px', color: '#94a3b8', lineHeight: '1.5', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                  <div style={{ marginBottom: '4px' }}>1. Open Google Account &rarr; <strong>Security</strong> &rarr; Enable <strong>2-Step Verification</strong>.</div>
                  <div style={{ marginBottom: '4px' }}>2. Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>myaccount.google.com/apppasswords</a>.</div>
                  <div style={{ marginBottom: '4px' }}>3. Name the app <strong>StockSense</strong>, generate a 16-character App Password, and paste it into <code>backend/.env</code> as <code>SMTP_PASS</code>.</div>
                  <div style={{ marginTop: '6px', color: '#64748b', fontSize: '0.75rem' }}>
                    <em>💡 Note: For immediate local testing, the generated reset code is also displayed in the server console and previewed.</em>
                  </div>
                </div>
              )}
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

            <form onSubmit={handleForgotSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={15} /> Registered Work Email
                </label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    className="input-field"
                    placeholder="manager@stocksense.com or staff@stocksense.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '14px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    Dispatching via Google SMTP...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Reset Email via Google SMTP
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Already received your 6-digit code?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setResetEmail(forgotEmail || '');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
              >
                Enter Code & Reset Password &rarr;
              </button>
            </div>
          </div>
        ) : mode === 'reset' ? (
          /* ================= RESET PASSWORD VIEW ================= */
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '4px 0'
                }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>

              <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(14, 165, 233, 0.1)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                Step 2 of 2: Set Password
              </span>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff', margin: '0 0 6px 0' }}>
                Set New Password
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.45' }}>
                Enter the 6-digit verification code sent to your email, then set a new secure password.
              </p>
            </div>

            {/* Dev Code Autofill Banner */}
            {devCodePreview && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.73rem', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: '700', letterSpacing: '0.5px' }}>
                    Local Dev OTP Code:
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: '800', color: '#34d399', letterSpacing: '4px' }}>
                    {devCodePreview}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetCode(devCodePreview);
                    setSuccessMsg('OTP Code auto-filled into form!');
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  Autofill Code
                </button>
              </div>
            )}

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

            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={15} /> Registered Email
                </label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    className="input-field"
                    placeholder="your-email@stocksense.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">
                    <KeyRound size={15} /> 6-Digit Verification Code
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Valid for 15 minutes</span>
                </div>
                <div className="input-wrapper">
                  <KeyRound size={16} className="input-icon" />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="123456"
                    maxLength={6}
                    style={{ letterSpacing: '6px', fontSize: '1.15rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={15} /> New Password
                </label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-action-btn"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                  >
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={15} /> Confirm New Password
                </label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Confirm matching password"
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '14px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    Updating Password in SQLite...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Reset Password & Return to Login
                  </>
                )}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', fontSize: '0.82rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrorMsg('');
                  setSuccessMsg('');
                  setForgotEmail(resetEmail);
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} /> Resend Code
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: '500' }}
              >
                Back to Sign In
              </button>
            </div>
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
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                        if (loginEmail) setForgotEmail(loginEmail);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.78rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        padding: '0',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}
                    >
                      Forgot Password?
                    </button>
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
