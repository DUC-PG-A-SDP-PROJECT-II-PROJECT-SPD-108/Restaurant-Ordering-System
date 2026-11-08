import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSuccess, onCancel }) {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    const result = await login(cleanUser, password);
    setIsLoading(false);
    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.message || 'Invalid username or password. Please try again.');
    }
  };

  return (
    <div
      style={{
        maxWidth: '440px',
        margin: '2.5rem auto',
        padding: '2.5rem 2rem',
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
          margin: '0 auto 1.25rem',
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

      <h2 style={{ marginBottom: '0.4rem', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
        Bistro Staff &amp; Admin Portal
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
        Please sign in with your authorized credentials to access the console.
      </p>

      {user && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            color: '#10b981',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}
        >
          <span>Active: <strong>{user.name || user.username}</strong> ({user.role})</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onSuccess}
            style={{ padding: '4px 12px', fontSize: '0.78rem' }}
          >
            Open Console &rarr;
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Production Login Form */}
      <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="login-username" style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            Username
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
            autoFocus
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="login-password" style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: '0.5rem', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <i className="fa-solid fa-spinner fa-spin"></i>
          ) : (
            <i className="fa-solid fa-right-to-bracket"></i>
          )}
          <span>Sign In to Console</span>
        </button>
      </form>

      {onCancel && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
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
  );
}
