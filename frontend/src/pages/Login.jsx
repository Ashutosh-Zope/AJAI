import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await api.auth.login(form.email, form.password);
      } else {
        data = await api.auth.register(form.email, form.password, form.name);
      }
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ animationDelay: '0.1s' }}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>A</span>
          <span className={styles.logoText}>jaia <em>Docs</em></span>
        </div>
        <p className={styles.tagline}>Where ideas take shape.</p>

        <div className={styles.tabs}>
          <button className={mode === 'login' ? styles.tabActive : styles.tab} onClick={() => setMode('login')}>Sign in</button>
          <button className={mode === 'register' ? styles.tabActive : styles.tab} onClick={() => setMode('register')}>Create account</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label>Full name</label>
              <input value={form.name} onChange={set('name')} placeholder="Your name" required />
            </div>
          )}
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className={styles.demo}>
          <p>Demo accounts (password: <code>demo1234</code>)</p>
          <div className={styles.demoAccounts}>
            {['alice@demo.com', 'bob@demo.com', 'carol@demo.com'].map(email => (
              <button key={email} className={styles.demoBtn}
                onClick={() => setForm(f => ({ ...f, email, password: 'demo1234' }))}>
                {email.split('@')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
