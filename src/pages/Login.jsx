import { useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, UserRound, ShieldCheck, Smartphone, FileCheck2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useBranding } from '../useBranding';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const unionName = useBranding();
  const [form, setForm] = useState({ username: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.username.trim(), form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <section className="login-brand">
        <div className="rings" aria-hidden="true">
          <i /><i /><i /><i />
        </div>
        <div className="login-brand-body">
          <Logo size={88} badge />
          <h2>{unionName}</h2>
          <p className="tagline">ডিজিটাল ইউনিয়ন পরিষদ ব্যবস্থাপনা</p>
          <ul>
            <li><ShieldCheck size={18} /> নিরাপদ ও নিয়ন্ত্রিত অ্যাক্সেস</li>
            <li><FileCheck2 size={18} /> হোল্ডিং, ট্যাক্স ও সনদ এক জায়গায়</li>
            <li><Smartphone size={18} /> মোবাইল ও কম্পিউটারে সমানভাবে চলে</li>
          </ul>
        </div>
      </section>

      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit} noValidate>
          <div className="login-mobile-brand">
            <Logo size={44} />
            <strong>{unionName}</strong>
          </div>
          <h1>অ্যাডমিন লগইন</h1>
          <p className="muted">চালিয়ে যেতে আপনার ইউজারনেম ও পাসওয়ার্ড দিন।</p>

          {error && <div className="alert" role="alert">{error}</div>}

          <label className="field">
            <span>ইউজারনেম</span>
            <div className="input">
              <UserRound size={18} />
              <input value={form.username} onChange={set('username')} autoComplete="username" autoFocus required />
            </div>
          </label>

          <label className="field">
            <span>পাসওয়ার্ড</span>
            <div className="input">
              <LockKeyhole size={18} />
              <input
                type={show ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                autoComplete="current-password"
                required
              />
              <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button className="btn-primary" disabled={busy || !form.username || !form.password}>
            {busy ? <><Loader2 size={18} className="spin" /> অপেক্ষা করুন…</> : 'লগইন করুন'}
          </button>
        </form>
      </section>
    </div>
  );
}
