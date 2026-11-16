import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../api';
import { Modal } from './Modal';
import { METHOD_LABEL, tk } from '../utils/money';

// মডারেটরের "Pay Now": বিকাশ/নগদ বাছা, কোন নম্বর থেকে পাঠিয়েছে, ট্রানজেকশন আইডি ও টাকা → অনুমোদনের জন্য pending
export default function PayNowModal({ available, onClose, onDone }) {
  const [cfg, setCfg] = useState(null);
  const [method, setMethod] = useState('');
  const [accountId, setAccountId] = useState('');
  const [f, setF] = useState({ senderNumber: '', trxId: '', amount: String(available) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/payments/config')
      .then((c) => {
        setCfg(c);
        if (c.accounts[0]) { setMethod(c.accounts[0].method); setAccountId(c.accounts[0].id); }
      })
      .catch((e) => setError(e.message));
  }, []);

  const methods = cfg ? [...new Set(cfg.accounts.map((a) => a.method))] : [];
  const accounts = cfg ? cfg.accounts.filter((a) => a.method === method) : [];
  const pickMethod = (m) => { setMethod(m); setAccountId(cfg.accounts.find((a) => a.method === m)?.id || ''); };
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!accountId) return setError('যে নম্বরে টাকা পাঠিয়েছেন সেটি নির্বাচন করুন।');
    if (!f.senderNumber.trim()) return setError('যে নম্বর থেকে টাকা পাঠিয়েছেন সেটি দিন।');
    if (!f.trxId.trim()) return setError('ট্রানজেকশন আইডি দিন।');
    if (!f.amount.trim()) return setError('টাকার পরিমাণ দিন।');
    setBusy(true);
    try {
      await api('/payments', { method: 'POST', body: { method, accountId, ...f } });
      await onDone('পেমেন্ট জমা হয়েছে। অ্যাকাউন্টিং যাচাই করে অনুমোদন করলে আপনার বকেয়া কমবে।');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="পেমেন্ট করুন (Pay Now)" onClose={onClose} locked={busy} width={520}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {error && <div className="alert" role="alert">{error}</div>}
          {!cfg && !error && <p className="muted"><Loader2 size={16} className="spin" /> লোড হচ্ছে…</p>}
          {cfg && cfg.accounts.length === 0 && <div className="alert warn">পেমেন্টের নম্বর এখনো সেট করা হয়নি। অ্যাকাউন্টিংয়ের সাথে যোগাযোগ করুন।</div>}

          {cfg && cfg.accounts.length > 0 && (
            <>
              <p className="pay-due">জমা দেওয়ার মতো বকেয়া: <b>{tk(available)}</b></p>

              <div className="field"><span>কোন মাধ্যমে পাঠিয়েছেন?</span>
                <div className="method-row">
                  {methods.map((m) => (
                    <button type="button" key={m} className={`method-btn ${m} ${method === m ? 'on' : ''}`} onClick={() => pickMethod(m)}>{METHOD_LABEL[m]}</button>
                  ))}
                </div>
              </div>

              <div className="field"><span>যে নম্বরে টাকা পাঠিয়েছেন</span>
                <div className="acct-list">
                  {accounts.map((a) => (
                    <label key={a.id} className={`acct ${accountId === a.id ? 'on' : ''}`}>
                      <input type="radio" name="acct" checked={accountId === a.id} onChange={() => setAccountId(a.id)} />
                      <b>{a.number}</b>{a.label && <small>{a.label}</small>}
                    </label>
                  ))}
                </div>
                <small className="hint">উপরের নম্বরে আগে টাকা পাঠান, তারপর নিচের তথ্য দিয়ে জমা দিন।</small>
              </div>

              <label className="field"><span>যে নম্বর থেকে টাকা পাঠিয়েছেন <b className="req">*</b></span>
                <div className="input"><input value={f.senderNumber} onChange={set('senderNumber')} placeholder="01XXXXXXXXX" inputMode="tel" /></div>
              </label>
              <div className="form-grid">
                <label className="field"><span>ট্রানজেকশন আইডি <b className="req">*</b></span>
                  <div className="input"><input value={f.trxId} onChange={set('trxId')} placeholder="যেমন: 8N7A6D5EE7" autoCapitalize="characters" /></div>
                </label>
                <label className="field"><span>কত টাকা পাঠিয়েছেন <b className="req">*</b></span>
                  <div className="input"><input value={f.amount} onChange={set('amount')} inputMode="decimal" /></div>
                </label>
              </div>
            </>
          )}
        </div>
        <footer className="dialog-foot">
          <button type="button" className="btn btn-gray" onClick={onClose} disabled={busy}>বাতিল</button>
          <button className="btn btn-solid" disabled={busy || !cfg || cfg.accounts.length === 0}>
            {busy && <Loader2 size={18} className="spin" />} জমা দিন
          </button>
        </footer>
      </form>
    </Modal>
  );
}
