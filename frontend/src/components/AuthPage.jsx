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
  Package,
  LogOut,
  KeyRound,
  Send,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { api, getStoredUser, clearAuthSession } from '../services/api';

const C = {
  navy: '#1e2a4a',
  muted: '#6b7a99',
  dim: '#94a3b8',
  border: 'rgba(0, 0, 0, 0.08)',
  blue: '#2563eb',
  blueBg: 'rgba(37, 99, 235, 0.08)',
  green: '#047857',
  greenBg: 'rgba(16, 185, 129, 0.1)',
  amber: '#b45309',
  amberBg: 'rgba(245, 158, 11, 0.1)',
  red: '#b91c1c',
  redBg: 'rgba(244, 63, 94, 0.08)',
  panelBg: '#f8fafc',
  pageBg: '#eef2f9',
};

const inputStyle = {
  width: '100%',
  fontSize: '0.92rem',
  color: C.navy,
  background: '#ffffff',
  border: `1px solid ${C.border}`,
  borderRadius: '10px',
  padding: '11px 14px 11px 40px',
  outline: 'none',
};

const labelStyle = {
  fontSize: '0.83rem',
  fontWeight: 600,
  color: C.muted,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '6px',
};

function InputWrapper({ icon: Icon, children }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <Icon size={16} style={{ position: 'absolute', left: '14px', color: C.dim, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

function Alert({ type, children }) {
  const isError = type === 'error';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.88rem',
      background: isError ? C.redBg : C.greenBg,
      color: isError ? C.red : C.green,
      border: `1px solid ${isError ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`,
    }}>
      {isError ? <AlertCircle size={18} style={{ flexShrink: 0 }} /> : <CheckCircle2 size={18} style={{ flexShrink: 0 }} />}
      <span>{children}</span>
    </div>
  );
}

export default function AuthPage({ onEnterMasterData, onAuthChange }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

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

  useEffect(() => {
    const existingUser = getStoredUser();
    if (existingUser) {
      setLoggedInUser(existingUser);
      setSuccessMsg('Active session detected. Logged in successfully!');
    }

    api.getSmtpStatus()
      .then(res => {
        if (res && res.smtp) setSmtpStatus(res.smtp);
      })
      .catch(() => {});

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

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerData, setRegisterData] = useState({
    name: '',
    employee_id: '',
    role: 'manager',
    email: '',
    phone_number: '',
    batch: 'BATCH-A-01',
    password: '',
    confirmPassword: '',
  });

  const handleRegisterChange = (field, value) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
  };

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

  const handleLogout = () => {
    clearAuthSession();
    setLoggedInUser(null);
    setSuccessMsg('');
    setErrorMsg('');
    setLoginPassword('');
    if (onAuthChange) onAuthChange(null);
  };

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
      if (onAuthChange) onAuthChange(res.user);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
      if (onAuthChange) onAuthChange(res.user);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

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
      background: C.pageBg,
    }}>
      {/* Top Branding */}
      <div style={{ textAlign: 'center', marginBottom: '24px', maxWidth: '580px', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            padding: '10px', borderRadius: '14px',
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Boxes size={28} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.5px', color: C.navy }}>
            StockSense
          </span>
          {onEnterMasterData && (
            <button
              type="button"
              onClick={onEnterMasterData}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', fontSize: '0.78rem', borderRadius: '999px', marginLeft: '6px',
                background: '#f1f5f9', color: '#334155', border: `1px solid ${C.border}`, cursor: 'pointer',
              }}
            >
              <Package size={13} color={C.blue} />
              <span>Master Data Hub &rarr;</span>
            </button>
          )}
        </div>
        <p style={{ color: C.muted, fontSize: '0.92rem' }}>
          Authentication Portal for Inventory Managers & Warehouse Staff
        </p>
      </div>

      {/* Main Card */}
      <div style={{
        width: '100%', maxWidth: '540px', padding: '32px',
        background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: '20px',
        boxShadow: '0 20px 40px -15px rgba(30, 42, 74, 0.12)',
      }}>

        {loggedInUser ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: C.greenBg, border: '1.5px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px', padding: '20px', marginBottom: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', background: '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={30} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: C.green, margin: 0 }}>
                  Login Successful!
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#059669', marginTop: '4px' }}>
                  Authenticated and verified in SQLite database (<code>stock-sense.db</code>)
                </p>
              </div>
            </div>

            <div style={{
              background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: '14px',
              padding: '20px', marginBottom: '24px', textAlign: 'left',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingBottom: '14px', borderBottom: `1px solid ${C.border}`, marginBottom: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: loggedInUser.role === 'manager' ? 'rgba(16, 185, 129, 0.15)' : C.blueBg,
                    color: loggedInUser.role === 'manager' ? C.green : C.blue,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {loggedInUser.role === 'manager' ? <ShieldCheck size={24} /> : <HardHat size={24} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: C.navy }}>{loggedInUser.name}</div>
                    <div style={{ fontSize: '0.78rem', color: C.muted }}>
                      ID: <span style={{ fontFamily: 'var(--font-mono)', color: C.blue }}>{loggedInUser.employee_id}</span>
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '9999px',
                  background: loggedInUser.role === 'manager' ? 'rgba(16,185,129,0.12)' : C.blueBg,
                  color: loggedInUser.role === 'manager' ? C.green : C.blue,
                }}>
                  {loggedInUser.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: C.dim, fontSize: '0.75rem', textTransform: 'uppercase' }}>Work Email</div>
                  <div style={{ color: C.navy, fontWeight: '500', wordBreak: 'break-all' }}>{loggedInUser.email}</div>
                </div>
                <div>
                  <div style={{ color: C.dim, fontSize: '0.75rem', textTransform: 'uppercase' }}>Phone Number</div>
                  <div style={{ color: C.navy, fontWeight: '500' }}>{loggedInUser.phone_number || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: C.dim, fontSize: '0.75rem', textTransform: 'uppercase' }}>Assigned Batch / Shift</div>
                  <div style={{ color: C.blue, fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{loggedInUser.batch || 'GENERAL-01'}</div>
                </div>
                <div>
                  <div style={{ color: C.dim, fontSize: '0.75rem', textTransform: 'uppercase' }}>Role Type</div>
                  <div style={{ color: C.navy, fontWeight: '600' }}>
                    {loggedInUser.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'}
                  </div>
                </div>
              </div>
            </div>

            {onEnterMasterData && (
              <button type="button" className="btn btn-primary" onClick={onEnterMasterData} style={{ width: '100%', marginBottom: '12px', padding: '12px' }}>
                <Package size={18} />
                <span>Open Product & Master Data Hub &rarr;</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%', padding: '10px 18px', borderRadius: '10px', fontWeight: 600,
                background: '#f1f5f9', color: '#334155', border: `1px solid ${C.border}`, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <LogOut size={16} />
              Sign Out / Log in as Another User
            </button>
          </div>
        ) : mode === 'forgot' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: C.muted, fontSize: '0.85rem', cursor: 'pointer', padding: '4px 0' }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem',
                padding: '4px 10px', borderRadius: '999px',
                background: smtpStatus?.configured ? C.greenBg : C.amberBg,
                color: smtpStatus?.configured ? C.green : C.amber,
                border: `1px solid ${smtpStatus?.configured ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: smtpStatus?.configured ? '#10b981' : '#f59e0b' }}></span>
                <span>{smtpStatus?.configured ? `Google SMTP Active` : 'SMTP Pending in .env'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: C.navy, margin: '0 0 6px 0' }}>Forgot Password?</h3>
              <p style={{ fontSize: '0.85rem', color: C.muted, margin: 0, lineHeight: '1.45' }}>
                Enter your work email address below. We will send a 6-digit verification code and reset instructions via Google SMTP.
              </p>
            </div>

            <div style={{
              background: C.blueBg, border: '1px solid rgba(37,99,235,0.18)', borderRadius: '12px',
              padding: '12px 14px', marginBottom: '18px', fontSize: '0.8rem', color: '#334155',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.blue, fontWeight: '600' }}>
                  <HelpCircle size={15} />
                  <span>Google App Password SMTP Setup</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSmtpInfo(!showSmtpInfo)}
                  style={{ background: 'none', border: 'none', color: C.blue, fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {showSmtpInfo ? 'Hide Setup Guide' : 'How to Setup'}
                </button>
              </div>
              {showSmtpInfo && (
                <div style={{ marginTop: '10px', color: C.muted, lineHeight: '1.5', borderTop: `1px solid ${C.border}`, paddingTop: '8px' }}>
                  <div style={{ marginBottom: '4px' }}>1. Open Google Account &rarr; <strong>Security</strong> &rarr; Enable <strong>2-Step Verification</strong>.</div>
                  <div style={{ marginBottom: '4px' }}>2. Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: C.blue }}>myaccount.google.com/apppasswords</a>.</div>
                  <div style={{ marginBottom: '4px' }}>3. Name the app <strong>StockSense</strong>, generate a 16-character App Password, and paste it into <code>backend/.env</code> as <code>SMTP_PASS</code>.</div>
                  <div style={{ marginTop: '6px', color: C.dim, fontSize: '0.75rem' }}>
                    <em>💡 Note: For immediate local testing, the generated reset code is also displayed in the server console and previewed.</em>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && <Alert type="error">{errorMsg}</Alert>}
            {successMsg && <Alert type="success">{successMsg}</Alert>}

            <form onSubmit={handleForgotSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}><Mail size={15} /> Registered Work Email</label>
                <InputWrapper icon={Mail}>
                  <input
                    type="email"
                    style={inputStyle}
                    placeholder="manager@stocksense.com or staff@stocksense.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </InputWrapper>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '14px' }} disabled={loading}>
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

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.82rem', color: C.muted }}>
              Already received your 6-digit code?{' '}
              <button
                type="button"
                onClick={() => { setMode('reset'); setResetEmail(forgotEmail || ''); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
              >
                Enter Code & Reset Password &rarr;
              </button>
            </div>
          </div>
        ) : mode === 'reset' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: C.muted, fontSize: '0.85rem', cursor: 'pointer', padding: '4px 0' }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>

              <span style={{ fontSize: '0.75rem', color: C.blue, background: C.blueBg, padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(37,99,235,0.2)' }}>
                Step 2 of 2: Set Password
              </span>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: C.navy, margin: '0 0 6px 0' }}>Set New Password</h3>
              <p style={{ fontSize: '0.85rem', color: C.muted, margin: 0, lineHeight: '1.45' }}>
                Enter the 6-digit verification code sent to your email, then set a new secure password.
              </p>
            </div>

            {devCodePreview && (
              <div style={{
                background: C.greenBg, border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px',
                padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '0.73rem', textTransform: 'uppercase', color: '#059669', fontWeight: '700', letterSpacing: '0.5px' }}>
                    Local Dev OTP Code:
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: '800', color: C.green, letterSpacing: '4px' }}>
                    {devCodePreview}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setResetCode(devCodePreview); setSuccessMsg('OTP Code auto-filled into form!'); }}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', background: '#f1f5f9', color: '#334155', border: `1px solid ${C.border}`, cursor: 'pointer' }}
                >
                  Autofill Code
                </button>
              </div>
            )}

            {errorMsg && <Alert type="error">{errorMsg}</Alert>}
            {successMsg && <Alert type="success">{successMsg}</Alert>}

            <form onSubmit={handleResetSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}><Mail size={15} /> Registered Email</label>
                <InputWrapper icon={Mail}>
                  <input
                    type="email"
                    style={inputStyle}
                    placeholder="your-email@stocksense.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </InputWrapper>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={labelStyle}><KeyRound size={15} /> 6-Digit Verification Code</label>
                  <span style={{ fontSize: '0.72rem', color: C.dim }}>Valid for 15 minutes</span>
                </div>
                <InputWrapper icon={KeyRound}>
                  <input
                    type="text"
                    style={{ ...inputStyle, letterSpacing: '6px', fontSize: '1.15rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}
                    placeholder="123456"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </InputWrapper>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}><Lock size={15} /> New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', color: C.dim }} />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    style={inputStyle}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}
                  >
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}><Lock size={15} /> Confirm New Password</label>
                <InputWrapper icon={Lock}>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    style={inputStyle}
                    placeholder="Confirm matching password"
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    required
                  />
                </InputWrapper>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '14px' }} disabled={loading}>
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
                onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); setForgotEmail(resetEmail); }}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} /> Resend Code
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontWeight: '500' }}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', background: C.panelBg, padding: '4px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${C.border}` }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem',
                  border: 'none', cursor: 'pointer',
                  background: mode === 'login' ? '#ffffff' : 'transparent',
                  color: mode === 'login' ? C.navy : C.muted,
                  boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Staff & Manager Login
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem',
                  border: 'none', cursor: 'pointer',
                  background: mode === 'register' ? '#ffffff' : 'transparent',
                  color: mode === 'register' ? C.navy : C.muted,
                  boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Register Personnel
              </button>
            </div>

            {/* Demo Quick Fills */}
            <div style={{
              background: C.panelBg, border: `1px dashed ${C.border}`, borderRadius: '12px',
              padding: '10px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: C.muted }}>
                <span>Instant Demo Accounts:</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => fillDemo('manager')}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', background: '#ffffff', color: '#334155', border: `1px solid ${C.border}`, cursor: 'pointer' }}
                >
                  Manager Demo
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('staff')}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', background: '#ffffff', color: '#334155', border: `1px solid ${C.border}`, cursor: 'pointer' }}
                >
                  Staff Demo
                </button>
              </div>
            </div>

            {errorMsg && <Alert type="error">{errorMsg}</Alert>}
            {successMsg && <Alert type="success">{successMsg}</Alert>}

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}><Mail size={15} /> Work Email or Employee ID</label>
                  <InputWrapper icon={Mail}>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="manager@stocksense.com or MGR-1001"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </InputWrapper>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyle}><Lock size={15} /> Password</label>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); if (loginEmail) setForgotEmail(loginEmail); }}
                      style={{
                        background: 'none', border: 'none', color: C.blue, fontSize: '0.78rem', fontWeight: '500',
                        cursor: 'pointer', padding: '0', textDecoration: 'underline', textUnderlineOffset: '2px',
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', color: C.dim }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={inputStyle}
                      placeholder="Enter your security password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
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
              <form onSubmit={handleRegisterSubmit}>
                <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                  <label style={{ ...labelStyle, marginBottom: '8px' }}>Select Operational Role</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { key: 'manager', icon: ShieldCheck, title: 'Inventory Manager', desc: 'Stock auditing, replenishment approvals, POs & team overview.', color: C.green, bg: 'rgba(16,185,129,0.12)' },
                      { key: 'staff', icon: HardHat, title: 'Warehouse Staff', desc: 'Inward handling, barcode scan, dispatch & batch movements.', color: C.blue, bg: C.blueBg },
                    ].map(r => {
                      const selected = registerData.role === r.key;
                      const RIcon = r.icon;
                      return (
                        <div
                          key={r.key}
                          onClick={() => handleRegisterChange('role', r.key)}
                          style={{
                            border: `1.5px solid ${selected ? C.blue : C.border}`,
                            background: selected ? C.blueBg : '#ffffff',
                            borderRadius: '12px', padding: '14px', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', position: 'relative',
                          }}
                        >
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: r.bg, color: r.color }}>
                            <RIcon size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.navy }}>{r.title}</div>
                            <div style={{ fontSize: '0.78rem', color: C.muted, lineHeight: '1.35' }}>{r.desc}</div>
                          </div>
                          {selected && (
                            <div style={{
                              position: 'absolute', top: '10px', right: '12px', width: '18px', height: '18px',
                              borderRadius: '50%', background: C.blue, color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>✓</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}><User size={14} /> Full Name</label>
                    <InputWrapper icon={User}>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="e.g. Liam Foster"
                        value={registerData.name}
                        onChange={(e) => handleRegisterChange('name', e.target.value)}
                        required
                      />
                    </InputWrapper>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}><IdCard size={14} /> Employee ID</label>
                    <InputWrapper icon={IdCard}>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder={registerData.role === 'manager' ? 'MGR-1045' : 'STF-3022'}
                        value={registerData.employee_id}
                        onChange={(e) => handleRegisterChange('employee_id', e.target.value)}
                        required
                      />
                    </InputWrapper>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}><Mail size={14} /> Work Email</label>
                    <InputWrapper icon={Mail}>
                      <input
                        type="email"
                        style={inputStyle}
                        placeholder="name@stocksense.com"
                        value={registerData.email}
                        onChange={(e) => handleRegisterChange('email', e.target.value)}
                        required
                      />
                    </InputWrapper>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}><Phone size={14} /> Phone Number</label>
                    <InputWrapper icon={Phone}>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="+1 555-0199"
                        value={registerData.phone_number}
                        onChange={(e) => handleRegisterChange('phone_number', e.target.value)}
                      />
                    </InputWrapper>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}><Layers size={14} /> Warehouse Batch / Shift Code</label>
                  <InputWrapper icon={Layers}>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="e.g. BATCH-BAY-02, Morning Shift, BATCH-NORTH"
                      value={registerData.batch}
                      onChange={(e) => handleRegisterChange('batch', e.target.value)}
                    />
                  </InputWrapper>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}><Lock size={14} /> Password</label>
                    <InputWrapper icon={Lock}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        style={inputStyle}
                        placeholder="Min 6 chars"
                        value={registerData.password}
                        onChange={(e) => handleRegisterChange('password', e.target.value)}
                        required
                      />
                    </InputWrapper>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}><Lock size={14} /> Confirm</label>
                    <InputWrapper icon={Lock}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        style={inputStyle}
                        placeholder="Repeat password"
                        value={registerData.confirmPassword}
                        onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                        required
                      />
                    </InputWrapper>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
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

        {/* Footer */}
        <div style={{
          marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          color: C.dim, fontSize: '0.8rem', fontWeight: 600,
        }}>
          <Boxes size={13} />
          <span>StockSense</span>
        </div>
      </div>
    </div>
  );
}