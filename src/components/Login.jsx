import { useState } from 'react';
import { login, register, errorMessage } from '../api.js';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    try {
      if (mode === 'register') {
        await register(form);
        setNotice('Account created. You can now log in.');
        setMode('login');
      } else {
        onLogin(await login(form.username, form.password));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card auth">
      <h1>{mode === 'login' ? 'Login' : 'Create account'}</h1>
      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert success">{notice}</div>}

      <form onSubmit={submit}>
        <label>Username
          <input value={form.username} onChange={set('username')} required autoFocus />
        </label>
        {mode === 'register' && (
          <label>Email
            <input type="email" value={form.email} onChange={set('email')} required />
          </label>
        )}
        <label>Password
          <input type="password" value={form.password} onChange={set('password')} required minLength={6} />
        </label>
        <button disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}</button>
      </form>

      <p className="muted">
        {mode === 'login' ? 'No account yet? ' : 'Already registered? '}
        <a href="#" onClick={(e) => { e.preventDefault(); setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>
          {mode === 'login' ? 'Register' : 'Login'}
        </a>
      </p>
    </div>
  );
}
