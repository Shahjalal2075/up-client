import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SquarePen, Trash2, UserPlus, UserCheck, UserX, Search, UsersRound,
  Eye, EyeOff, Loader2,
} from 'lucide-react';
import { api } from '../api';
import { ROLE_LABEL } from '../config/menu';
import { Modal, ConfirmModal, SuccessModal } from '../components/Modal';

const ASSIGNABLE = ['admin', 'moderator', 'accounting', 'printer'];
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB').replace(/\//g, '-');

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [dialog, setDialog] = useState(null); // {type:'form'|'confirm'|'success', ...}

  const load = useCallback(async () => {
    try {
      const d = await api('/users');
      setUsers(d.users);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? users.filter((u) => `${u.fullName} ${u.username} ${u.role}`.toLowerCase().includes(s)) : users;
  }, [users, q]);

  const close = () => setDialog(null);
  const done = async (message) => { await load(); setDialog({ type: 'success', message }); };

  const askConfirm = (kind, u) => {
    const who = `"${u.fullName}" (${u.username})`;
    const cfg = {
      delete: {
        tone: 'danger', title: 'ইউজার ডিলিট করবেন?', confirmLabel: 'হ্যাঁ, ডিলিট করুন',
        message: `${who} অ্যাকাউন্টটি ডিলিট হবে এবং সে আর লগইন করতে পারবে না। সিস্টেমের অন্য কোনো তথ্য প্রভাবিত হবে না।`,
        run: () => api(`/users/${u.id}`, { method: 'DELETE' }), ok: 'ইউজারটি সফলভাবে ডিলিট করা হয়েছে।',
      },
      deactivate: {
        tone: 'warn', title: 'ইউজার ইনঅ্যাক্টিভ করবেন?', confirmLabel: 'হ্যাঁ, ইনঅ্যাক্টিভ করুন',
        message: `${who} আর লগইন করতে পারবে না। পরে যেকোনো সময় আবার একটিভ করা যাবে।`,
        run: () => api(`/users/${u.id}/status`, { method: 'PATCH', body: { isActive: false } }), ok: 'ইউজারটি ইনঅ্যাক্টিভ করা হয়েছে।',
      },
      activate: {
        tone: 'ok', title: 'ইউজার একটিভ করবেন?', confirmLabel: 'হ্যাঁ, একটিভ করুন',
        message: `${who} আবার লগইন করতে পারবে।`,
        run: () => api(`/users/${u.id}/status`, { method: 'PATCH', body: { isActive: true } }), ok: 'ইউজারটি একটিভ করা হয়েছে।',
      },
    }[kind];
    setDialog({ type: 'confirm', ...cfg });
  };

  return (
    <>
      <section className="page-head">
        <h2><UsersRound size={26} /> প্যানেল ইউজার ও পারমিশন সেটিংস</h2>
        <button className="btn btn-dark" onClick={() => setDialog({ type: 'form' })}>
          <UserPlus size={18} /> নতুন অ্যাডমিন তৈরি করুন
        </button>
      </section>

      <section className="panel table-panel">
        <div className="table-tools">
          <div className="input search">
            <Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম বা ইউজারনেম দিয়ে খুঁজুন" aria-label="খুঁজুন" />
          </div>
          <span className="muted">মোট {users.length.toLocaleString('bn-BD')} জন</span>
        </div>

        {error && <div className="alert">{error}</div>}

        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>আইডি</th><th>পূর্ণ নাম</th><th>ইউজারনেম (Login ID)</th>
                <th>অ্যাক্সেস রোল</th><th>স্ট্যাটাস</th><th>তৈরির তারিখ</th><th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="cell-msg"><Loader2 size={20} className="spin" /> লোড হচ্ছে…</td></tr>}
              {!loading && shown.length === 0 && <tr><td colSpan="7" className="cell-msg">কোনো ইউজার পাওয়া যায়নি।</td></tr>}
              {shown.map((u) => (
                <tr key={u.id} className={u.isActive ? '' : 'is-off'}>
                  <td className="muted">#USR-{u.id}</td>
                  <td><strong>{u.fullName}</strong></td>
                  <td>{u.username}</td>
                  <td><span className={`role-badge r-${u.role}`}>{ROLE_LABEL[u.role]}</span></td>
                  <td>
                    <span className={`status-pill ${u.isActive ? 'on' : 'off'}`}>
                      <i /> {u.isActive ? 'একটিভ' : 'ইনঅ্যাক্টিভ'}
                    </span>
                  </td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      {u.canEdit && (
                        <button className="act act-blue" title="এডিট" aria-label="এডিট" onClick={() => setDialog({ type: 'form', user: u })}>
                          <SquarePen size={16} />
                        </button>
                      )}
                      {u.canToggle && (
                        <button
                          className={`act ${u.isActive ? 'act-amber' : 'act-green'}`}
                          title={u.isActive ? 'ইনঅ্যাক্টিভ করুন' : 'একটিভ করুন'}
                          aria-label={u.isActive ? 'ইনঅ্যাক্টিভ করুন' : 'একটিভ করুন'}
                          onClick={() => askConfirm(u.isActive ? 'deactivate' : 'activate', u)}
                        >
                          {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      )}
                      {u.canDelete && (
                        <button className="act act-red" title="ডিলিট" aria-label="ডিলিট" onClick={() => askConfirm('delete', u)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {dialog?.type === 'form' && (
        <UserFormModal
          user={dialog.user}
          onClose={close}
          onDone={(msg) => done(msg)}
        />
      )}
      {dialog?.type === 'confirm' && (
        <ConfirmModal
          tone={dialog.tone}
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          onClose={close}
          onConfirm={async () => { await dialog.run(); await done(dialog.ok); }}
        />
      )}
      {dialog?.type === 'success' && <SuccessModal message={dialog.message} onClose={close} />}
    </>
  );
}

function UserFormModal({ user, onClose, onDone }) {
  const editing = !!user;
  const isSuper = user?.role === 'super_admin';
  const [f, setF] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    role: user?.role || 'admin',
    password: '',
  });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    const username = f.username.trim().toLowerCase();
    if (f.fullName.trim().length < 2) return setError('পূর্ণ নাম দিন।');
    if (!editing && !/^[a-z0-9._]{3,30}$/.test(username))
      return setError('ইউজারনেম ৩–৩০ অক্ষরের হতে হবে (ইংরেজি ছোট হাতের অক্ষর, সংখ্যা, . বা _)।');
    if ((!editing || f.password) && f.password.length < 8) return setError('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');

    setBusy(true);
    try {
      if (editing) {
        await api(`/users/${user.id}`, {
          method: 'PATCH',
          body: { fullName: f.fullName.trim(), role: f.role, ...(f.password ? { password: f.password } : {}) },
        });
        await onDone('ইউজারের তথ্য সফলভাবে আপডেট হয়েছে।');
      } else {
        await api('/users', { method: 'POST', body: { fullName: f.fullName.trim(), username, role: f.role, password: f.password } });
        await onDone('নতুন ইউজার সফলভাবে তৈরি হয়েছে।');
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? 'ইউজার এডিট করুন' : 'নতুন ইউজার তৈরি করুন'} onClose={onClose} locked={busy}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {error && <div className="alert" role="alert">{error}</div>}

          <label className="field">
            <span>পূর্ণ নাম</span>
            <div className="input"><input value={f.fullName} onChange={set('fullName')} autoFocus /></div>
          </label>

          <div className="form-row">
            <label className="field">
              <span>ইউজারনেম (Login ID)</span>
              <div className={`input ${editing ? 'is-disabled' : ''}`}>
                <input value={f.username} onChange={set('username')} disabled={editing} autoComplete="off" />
              </div>
              {editing && <small className="hint">ইউজারনেম পরিবর্তন করা যায় না।</small>}
            </label>

            <label className="field">
              <span>অ্যাক্সেস রোল</span>
              <div className={`input ${isSuper ? 'is-disabled' : ''}`}>
                {isSuper ? (
                  <select value="super_admin" disabled><option value="super_admin">Super Admin</option></select>
                ) : (
                  <select value={f.role} onChange={set('role')}>
                    {ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                )}
              </div>
            </label>
          </div>

          <label className="field">
            <span>{editing ? 'নতুন পাসওয়ার্ড' : 'পাসওয়ার্ড'}</span>
            <div className="input">
              <input
                type={show ? 'text' : 'password'}
                value={f.password}
                onChange={set('password')}
                autoComplete="new-password"
                placeholder={editing ? 'খালি রাখলে আগেরটাই থাকবে' : 'কমপক্ষে ৮ অক্ষর'}
              />
              <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'লুকান' : 'দেখুন'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        </div>

        <footer className="dialog-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>বাতিল</button>
          <button className="btn btn-solid" disabled={busy}>
            {busy && <Loader2 size={18} className="spin" />} {editing ? 'আপডেট করুন' : 'তৈরি করুন'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
