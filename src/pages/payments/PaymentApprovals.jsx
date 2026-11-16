import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Search, Check, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api';
import { bn } from '../../utils/digits';
import { tk, dateTimeBn, METHOD_LABEL, STATUS_LABEL } from '../../utils/money';
import { ConfirmModal, Modal, SuccessModal } from '../../components/Modal';

const TABS = [['pending', 'অপেক্ষমাণ'], ['approved', 'অনুমোদিত'], ['rejected', 'বাতিল'], ['', 'সব']];
const CLS = { pending: 'st-pending', approved: 'st-ok', rejected: 'st-bad' };

// মডারেটরদের জমা দেওয়া পেমেন্ট যাচাই করে অনুমোদন বা বাতিল
export default function PaymentApprovals() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [data, setData] = useState({ items: [], total: 0, pages: 1, page: 1, counts: { pending: 0, approved: 0, rejected: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);

  useEffect(() => { const t = setTimeout(() => { setQ(input.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [input]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/payments?status=${status}&page=${page}&q=${encodeURIComponent(q)}`));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, page, q]);
  useEffect(() => { load(); }, [load]);

  const close = () => setDialog(null);
  const done = async (message) => { await load(); setDialog({ type: 'success', message }); };

  return (
    <>
      <section className="page-head">
        <h2><BadgeCheck size={26} /> পেমেন্ট অনুমোদন</h2>
        <span className="muted">মডারেটরদের জমা দেওয়া পেমেন্ট যাচাই করুন</span>
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
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="মডারেটরের নাম, ট্রানজেকশন আইডি বা নম্বর" aria-label="খুঁজুন" />
          </div>
        </div>
        {error && <div className="alert">{error}</div>}
        <div className="table-wrap">
          <table className="tbl wide pay-tbl">
            <thead>
              <tr>
                <th>সময়</th><th>মডারেটর</th><th>পাঠানোর কথা</th><th>পাঠিয়েছে</th><th>মাধ্যম ও কোন নম্বরে</th>
                <th>কোন নম্বর থেকে</th><th>ট্রানজেকশন আইডি</th><th>অবস্থা</th><th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="9" className="cell-msg"><Loader2 size={20} className="spin" /> লোড হচ্ছে…</td></tr>}
              {!loading && data.items.length === 0 && <tr><td colSpan="9" className="cell-msg">কোনো পেমেন্ট পাওয়া যায়নি।</td></tr>}
              {!loading && data.items.map((p) => (
                <tr key={p.id}>
                  <td>{dateTimeBn(p.createdAt)}</td>
                  <td><strong>{p.moderatorName}</strong><br /><span className="muted">{p.moderatorUsername}</span></td>
                  <td>{tk(p.dueAtSubmit)}</td>
                  <td><strong className={p.amount === p.dueAtSubmit ? '' : 'diff'}>{tk(p.amount)}</strong>{p.amount !== p.dueAtSubmit && <small className="muted" style={{ display: 'block' }}>বকেয়ার সমান নয়</small>}</td>
                  <td><span className={`method-tag ${p.method}`}>{METHOD_LABEL[p.method]}</span> <b>{p.toNumber}</b></td>
                  <td>{p.senderNumber}</td>
                  <td><code>{p.trxId}</code></td>
                  <td>
                    <span className={`st-chip ${CLS[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                    {p.status !== 'pending' && <small className="muted" style={{ display: 'block' }}>{p.reviewerName}{p.note ? ` — ${p.note}` : ''}</small>}
                  </td>
                  <td>
                    {p.status === 'pending' && (
                      <div className="row-actions">
                        <button className="act act-green" title="অনুমোদন" aria-label="অনুমোদন" onClick={() => setDialog({ type: 'approve', item: p })}><Check size={17} /></button>
                        <button className="act act-red" title="বাতিল" aria-label="বাতিল" onClick={() => setDialog({ type: 'reject', item: p })}><X size={17} /></button>
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

      {dialog?.type === 'approve' && (
        <ConfirmModal
          tone="ok"
          title="পেমেন্ট অনুমোদন করবেন?"
          message={`${dialog.item.moderatorName} — ${tk(dialog.item.amount)} (${METHOD_LABEL[dialog.item.method]}, ট্রানজেকশন ${dialog.item.trxId})। নিশ্চিত হয়ে নিন টাকাটি আপনার ${dialog.item.toNumber} নম্বরে এসেছে।`}
          confirmLabel="হ্যাঁ, অনুমোদন করুন"
          onClose={close}
          onConfirm={async () => {
            await api(`/payments/${dialog.item.id}/review`, { method: 'PATCH', body: { action: 'approve' } });
            await done('পেমেন্ট অনুমোদিত হয়েছে। মডারেটরের বকেয়া কমে গেছে।');
          }}
        />
      )}
      {dialog?.type === 'reject' && <RejectModal item={dialog.item} onClose={close} onDone={done} />}
      {dialog?.type === 'success' && <SuccessModal message={dialog.message} onClose={close} />}
    </>
  );
}

function RejectModal({ item, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    if (note.trim().length < 3) return setError('বাতিলের কারণ লিখুন।');
    setBusy(true);
    try {
      await api(`/payments/${item.id}/review`, { method: 'PATCH', body: { action: 'reject', note } });
      await onDone('পেমেন্টটি বাতিল করা হয়েছে।');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return (
    <Modal title="পেমেন্ট বাতিল করুন" onClose={onClose} locked={busy} width={460}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {error && <div className="alert">{error}</div>}
          <p>{item.moderatorName} — {tk(item.amount)} (ট্রানজেকশন {item.trxId})</p>
          <label className="field"><span>বাতিলের কারণ <b className="req">*</b></span>
            <textarea className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="যেমন: এই ট্রানজেকশন আইডিতে টাকা আসেনি" autoFocus />
          </label>
        </div>
        <footer className="dialog-foot">
          <button type="button" className="btn btn-gray" onClick={onClose} disabled={busy}>ফিরে যান</button>
          <button className="btn btn-danger" disabled={busy}>{busy && <Loader2 size={18} className="spin" />} বাতিল করুন</button>
        </footer>
      </form>
    </Modal>
  );
}
