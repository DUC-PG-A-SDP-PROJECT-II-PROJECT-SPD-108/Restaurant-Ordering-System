import React, { useState } from 'react';
import { useAuth, STAFF_ROLES_CATALOG } from '../context/AuthContext';

export default function Login({ onSuccess, onCancel }) {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    const result = await login(username, password);
    setIsLoading(false);
    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.message || 'Login failed. Please check credentials.');
    }
  };

  const handleQuickRoleLogin = async (roleObj) => {
    setUsername(roleObj.username);
    setPassword(roleObj.defaultPassword);
    setIsLoading(true);
    setErrorMsg('');
    const result = await login(roleObj.username, roleObj.defaultPassword);
    setIsLoading(false);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '2.5rem auto',
        padding: '2.25rem 2rem',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          margin: '0 auto 1rem',
          borderRadius: '16px',
          background: '#ffffff',
          padding: '6px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <img
          src="./images/logo.png"
          alt="Bistro Logo"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <h2 style={{ marginBottom: '0.35rem', fontSize: '1.5rem' }}>Bistro Staff &amp; Admin Portal</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Select your authorized role to access the management workspace.
      </p>

      {user && (
        <div
          style={{
            padding: '0.65rem 0.85rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            color: '#10b981',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}
        >
          <span>Active Session: <strong>{user.name || user.username}</strong> ({user.role})</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onSuccess}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            Open Admin &rarr;
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* 1-Click Fast Role Sign-In Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.65rem' }}>
          ⚡ 1-Click Role Sign-In
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
          {(STAFF_ROLES_CATALOG || []).map((r) => (
            <button
              key={r.role}
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickRoleLogin(r)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'flex-start',
                padding: '0.6rem 0.75rem',
                fontSize: '0.82rem',
                borderRadius: '10px',
                textAlign: 'left'
              }}
            >
              <i className={r.icon} style={{ color: r.badgeColor, fontSize: '1rem', width: '18px', textAlign: 'center' }}></i>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.2 }}>
                <span style={{ fontWeight: 800 }}>{r.title}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>user: {r.username}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', gap: '0.75rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR ENTER CREDENTIALS</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
      </div>

      {/* Manual Login Form */}
      <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="login-username" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Staff Username</label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin / manager / staff / kitchen"
            required
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="login-password" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: '0.5rem', justifyContent: 'center', gap: '0.5rem' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <i className="fa-solid fa-spinner fa-spin"></i>
          ) : (
            <i className="fa-solid fa-right-to-bracket"></i>
          )}
          <span>Sign In to Dashboard</span>
        </button>
      </form>

      {/* Credentials Reference Table */}
      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'left'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          DEMO ACCOUNTS (PASSWORD: <code>role123</code>):
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
          <div>👑 <strong>Admin:</strong> <code>admin / admin123</code></div>
          <div>👔 <strong>Manager:</strong> <code>manager / manager123</code></div>
          <div>🛎️ <strong>Staff:</strong> <code>staff / staff123</code></div>
          <div>👨‍🍳 <strong>Kitchen:</strong> <code>kitchen / kitchen123</code></div>
        </div>

        {onCancel && (
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onCancel}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to Customer Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

