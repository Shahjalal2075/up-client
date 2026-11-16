import { useCallback, useEffect, useState } from 'react';
import { Send, Search, Check, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api';
import { bn } from '../../utils/digits';
import { tk, dateTimeBn, METHOD_LABEL, STATUS_LABEL } from '../../utils/money';
import { Modal, SuccessModal } from '../../components/Modal';

const TABS = [['pending', 'অপেক্ষমাণ'], ['approved', 'অনুমোদিত'], ['rejected', 'বাতিল'], ['', 'সব']];
const CLS = { pending: 'st-pending', approved: 'st-ok', rejected: 'st-bad' };

// মডারেটরদের উত্তোলন অনুরোধ: অনুমোদন (টাকা পাঠিয়ে ট্রানজেকশন আইডি দিয়ে) বা বাতিল
export default function WithdrawRequests() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [data, setData] = useState({ items: [], pages: 1, page: 1, counts: { pending: 0, approved: 0, rejected: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);

  useEffect(() => { const t = setTimeout(() => { setQ(input.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [input]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/payments/withdrawals?status=${status}&page=${page}&q=${encodeURIComponent(q)}`));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, page, q]);
  useEffect(() => { load(); }, [load]);

  const done = async (message) => { await load(); setDialog({ type: 'success', message }); };

  return (
    <>
      <section className="page-head">
        <h2><Send size={26} /> উত্তোলন অনুরোধ</h2>
        <span className="muted">মডারেটররা যে টাকা তুলতে চেয়েছে</span>
      </section>

      <div className="tabs">
        {TABS.map(([k, l]) => (
          <button key={l} className={`tab ${status === k ? 'on' : ''}`} onClick={() => { setStatus(k); setPage(1); }}>
            {l}{k && <span className="tab-n">{bn(data.counts[k])}</span>}
          </button>
        ))}
      </div>

      <section className="panel table-panel">
        <div className="table-tools">
          <div className="input search wide"><Search size={18} />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="মডারেটরের নাম, নম্বর বা ট্রানজেকশন আইডি" aria-label="খুঁজুন" />
          </div>
        </div>
        {error && <div className="alert">{error}</div>}
        <div className="table-wrap">
          <table className="tbl wide">
            <thead><tr><th>অনুরোধের সময়</th><th>মডারেটর</th><th>টাকা</th><th>পাঠাতে হবে (মাধ্যম ও নম্বর)</th><th>অবস্থা</th><th>অ্যাকশন</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="cell-msg"><Loader2 size={20} className="spin" /> লোড হচ্ছে…</td></tr>}
              {!loading && data.items.length === 0 && <tr><td colSpan="6" className="cell-msg">কোনো অনুরোধ পাওয়া যায়নি।</td></tr>}
              {!loading && data.items.map((w) => (
                <tr key={w.id}>
                  <td>{dateTimeBn(w.createdAt)}</td>
                  <td><strong>{w.moderatorName}</strong><br /><span className="muted">{w.moderatorUsername}</span></td>
                  <td><span className="due-chip">{tk(w.amount)}</span></td>
                  <td><span className={`method-tag ${w.method}`}>{METHOD_LABEL[w.method]}</span> <b>{w.number}</b></td>
                  <td>
                    <span className={`st-chip ${CLS[w.status]}`}>{STATUS_LABEL[w.status]}</span>
                    {w.status === 'approved' && <small style={{ display: 'block' }}>ট্রানজেকশন: <code>{w.trxId}</code></small>}
                    {w.status !== 'pending' && <small className="muted" style={{ display: 'block' }}>{w.reviewerName}{w.status === 'rejected' && w.note ? ` — ${w.note}` : ''}</small>}
                  </td>
                  <td>
                    {w.status === 'pending' && (
                      <div className="row-actions">
                        <button className="act act-green" title="অনুমোদন" aria-label="অনুমোদন" onClick={() => setDialog({ type: 'approve', item: w })}><Check size={17} /></button>
                        <button className="act act-red" title="বাতিল" aria-label="বাতিল" onClick={() => setDialog({ type: 'reject', item: w })}><X size={17} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.pages > 1 && (
          <nav className="pager">
            <button className="pg" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}><ChevronLeft size={17} /></button>
            <span className="muted">{bn(data.page)} / {bn(data.pages)}</span>
            <button className="pg" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}><ChevronRight size={17} /></button>
          </nav>
        )}
      </section>

      {dialog?.type === 'approve' && <ReviewModal mode="approve" item={dialog.item} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.type === 'reject' && <ReviewModal mode="reject" item={dialog.item} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.type === 'success' && <SuccessModal message={dialog.message} onClose={() => setDialog(null)} />}
    </>
  );
}

function ReviewModal({ mode, item, onClose, onDone }) {
  const approve = mode === 'approve';
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!val.trim()) return setError(approve ? 'ট্রানজেকশন আইডি দিন।' : 'বাতিলের কারণ লিখুন।');
    setBusy(true);
    try {
      await api(`/payments/withdrawals/${item.id}/review`, { method: 'PATCH', body: approve ? { action: 'approve', trxId: val } : { action: 'reject', note: val } });
      await onDone(approve ? 'উত্তোলন অনুমোদিত হয়েছে। মডারেটর ট্রানজেকশন আইডি দেখতে পাবে।' : 'উত্তোলনের অনুরোধ বাতিল করা হয়েছে। টাকা মডারেটরের ব্যালেন্সে ফিরে গেছে।');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={approve ? 'উত্তোলন অনুমোদন করুন' : 'উত্তোলন বাতিল করুন'} onClose={onClose} locked={busy} width={480}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {error && <div className="alert">{error}</div>}
          <p className="pay-due">
            <b>{item.moderatorName}</b> — {tk(item.amount)}<br />
            {approve ? <>আগে <span className={`method-tag ${item.method}`}>{METHOD_LABEL[item.method]}</span> <b>{item.number}</b> নম্বরে {tk(item.amount)} পাঠান, তারপর ট্রানজেকশন আইডি দিয়ে অনুমোদন করুন।</> : null}
          </p>
          <label className="field">
            <span>{approve ? 'ট্রানজেকশন আইডি' : 'বাতিলের কারণ'} <b className="req">*</b></span>
            {approve
              ? <div className="input"><input value={val} onChange={(e) => setVal(e.target.value)} placeholder="যেমন: 8N7A6D5EE7" autoCapitalize="characters" autoFocus /></div>
              : <textarea className="textarea" rows={3} value={val} onChange={(e) => setVal(e.target.value)} placeholder="কেন বাতিল করছেন" autoFocus />}
          </label>
        </div>
        <footer className="dialog-foot">
          <button type="button" className="btn btn-gray" onClick={onClose} disabled={busy}>ফিরে যান</button>
          <button className={`btn ${approve ? 'btn-solid' : 'btn-danger'}`} disabled={busy}>{busy && <Loader2 size={18} className="spin" />} {approve ? 'অনুমোদন করুন' : 'বাতিল করুন'}</button>
        </footer>
      </form>
    </Modal>
  );
}
