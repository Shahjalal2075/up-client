import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../api';
import { Modal } from './Modal';
import { tk } from '../utils/money';

// মডারেটরের Withdraw: টাকা, বিকাশ/নগদ, যে নম্বরে নেবে → অনুরোধ (pending)
export default function WithdrawModal({ balance, onClose, onDone }) {
  const [method, setMethod] = useState('bkash');
  const [f, setF] = useState({ number: '', amount: String(balance) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.amount.trim()) return setError('কত টাকা তুলবেন লিখুন।');
    if (!f.number.trim()) return setError('যে নম্বরে টাকা নেবেন সেটি দিন।');
    setBusy(true);
    try {
      await api('/payments/withdrawals', { method: 'POST', body: { method, ...f } });
      await onDone('উত্তোলনের অনুরোধ জমা হয়েছে। অ্যাকাউন্টিং অনুমোদন করে টাকা পাঠালে আপনি ট্রানজেকশন আইডি দেখতে পাবেন।');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="টাকা তুলুন (Withdraw)" onClose={onClose} locked={busy} width={480}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {error && <div className="alert" role="alert">{error}</div>}
          <p className="pay-due">এখন তোলা যাবে: <b>{tk(balance)}</b></p>

          <div className="field"><span>কোন মাধ্যমে নেবেন?</span>
            <div className="method-row">
              <button type="button" className={`method-btn bkash ${method === 'bkash' ? 'on' : ''}`} onClick={() => setMethod('bkash')}>বিকাশ</button>
              <button type="button" className={`method-btn nagad ${method === 'nagad' ? 'on' : ''}`} onClick={() => setMethod('nagad')}>নগদ</button>
            </div>
          </div>
          <label className="field"><span>যে নম্বরে টাকা নেবেন <b className="req">*</b></span>
            <div className="input"><input value={f.number} onChange={set('number')} placeholder="01XXXXXXXXX" inputMode="tel" autoFocus /></div>
          </label>
          <label className="field"><span>কত টাকা তুলবেন <b className="req">*</b></span>
            <div className="input"><input value={f.amount} onChange={set('amount')} inputMode="decimal" /></div>
          </label>
        </div>
        <footer className="dialog-foot">
          <button type="button" className="btn btn-gray" onClick={onClose} disabled={busy}>বাতিল</button>
          <button className="btn btn-solid" disabled={busy}>{busy && <Loader2 size={18} className="spin" />} অনুরোধ পাঠান</button>
        </footer>
      </form>
    </Modal>
  );
}
