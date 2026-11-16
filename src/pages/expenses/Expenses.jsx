import { useCallback, useEffect, useState } from 'react';
import { HandCoins, Plus, Trash2, Loader2, CalendarDays, CalendarRange, CalendarCheck, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api';
import { bn } from '../../utils/digits';
import { tk, dmy } from '../../utils/money';
import { Modal, ConfirmModal, SuccessModal } from '../../components/Modal';

const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
const addDays = (s, n) => { const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <article className={`stat tone-${tone}`}>
      <div><strong className={value == null ? 'skeleton' : ''}>{value ?? '\u00A0'}</strong><span>{label}</span></div>
      <Icon size={34} strokeWidth={1.5} />
    </article>
  );
}

// অ্যাকাউন্টিংয়ের খরচ: কোন মডারেটরকে কত টাকা কী উদ্দেশ্যে + মোট/দৈনিক/সাপ্তাহিক হিসাব + তারিখ ফিল্টার
export default function Expenses() {
  const today = todayStr();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mod, setMod] = useState('');
  const [page, setPage] = useState(1);
  const [d, setD] = useState(null);
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);

  useEffect(() => { api('/expenses/moderators').then((r) => setMods(r.moderators)).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setD(await api(`/expenses?from=${from}&to=${to}&moderator=${mod}&page=${page}`));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to, mod, page]);
  useEffect(() => { load(); }, [load]);

  const quick = [
    ['আজ', today, today], ['গতকাল', addDays(today, -1), addDays(today, -1)],
    ['গত ৭ দিন', addDays(today, -6), today], ['চলতি মাস', `${today.slice(0, 8)}01`, today], ['সব', '', ''],
  ];
  const done = async (message) => { await load(); setDialog({ type: 'success', message }); };
  const weekLabel = (ws) => `${dmy(ws)} – ${dmy(addDays(ws, 6))}`;

  return (
    <>
      <section className="page-head">
        <h2><HandCoins size={26} /> খরচ হিসাব</h2>
        <button className="btn btn-dark" onClick={() => setDialog({ type: 'form' })}><Plus size={18} /> নতুন খরচ যোগ করুন</button>
      </section>

      <section className="stats">
        <StatCard label="আজকের খরচ" value={d && tk(d.cards.today)} icon={CalendarCheck} tone="green" />
        <StatCard label="গত ৭ দিনের খরচ" value={d && tk(d.cards.week)} icon={CalendarRange} tone="blue" />
        <StatCard label="চলতি মাসের খরচ" value={d && tk(d.cards.month)} icon={CalendarDays} tone="gold" />
        <StatCard label="নির্বাচিত সময়ের মোট" value={d && tk(d.total)} icon={Wallet} tone="red" />
      </section>

      <section className="panel">
        <div className="filter-bar">
          <label>শুরুর তারিখ<input type="date" value={from} max={to || today} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /></label>
          <label>শেষ তারিখ<input type="date" value={to} min={from || undefined} max={today} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></label>
          <label>মডারেটর
            <select value={mod} onChange={(e) => { setMod(e.target.value); setPage(1); }}>
              <option value="">সবাই</option>
              {mods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <div className="chips-row">
            {quick.map(([l, f, t]) => <button key={l} className={`chip-btn ${from === f && to === t ? 'on' : ''}`} onClick={() => { setFrom(f); setTo(t); setPage(1); }}>{l}</button>)}
          </div>
        </div>
        {error && <div className="alert">{error}</div>}

        <div className="grid-2">
          <div>
            <h3 className="sub-h">দৈনিক হিসাব</h3>
            <div className="table-wrap short">
              <table className="tbl">
                <thead><tr><th>তারিখ</th><th>এন্ট্রি</th><th>মোট খরচ</th></tr></thead>
                <tbody>
                  {d?.daily.length === 0 && <tr><td colSpan="3" className="cell-msg">কোনো খরচ নেই।</td></tr>}
                  {d?.daily.map((r) => <tr key={r.date}><td>{dmy(r.date)}</td><td>{bn(r.count)} টি</td><td><strong>{tk(r.total)}</strong></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="sub-h">সাপ্তাহিক হিসাব <small className="muted">(শনি – শুক্র)</small></h3>
            <div className="table-wrap short">
              <table className="tbl">
                <thead><tr><th>সপ্তাহ</th><th>এন্ট্রি</th><th>মোট খরচ</th></tr></thead>
                <tbody>
                  {d?.weekly.length === 0 && <tr><td colSpan="3" className="cell-msg">কোনো খরচ নেই।</td></tr>}
                  {d?.weekly.map((r) => <tr key={r.weekStart}><td>{weekLabel(r.weekStart)}</td><td>{bn(r.count)} টি</td><td><strong>{tk(r.total)}</strong></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="panel table-panel">
        <h2 className="panel-title">খরচের তালিকা <small className="muted">({d ? bn(d.count) : '…'} টি · মোট {d ? tk(d.total) : '…'})</small></h2>
        <div className="table-wrap">
          <table className="tbl wide">
            <thead><tr><th>তারিখ</th><th>কাকে দিয়েছেন</th><th>টাকা</th><th>বিবরণ / উদ্দেশ্য</th><th>এন্ট্রি করেছেন</th><th>অ্যাকশন</th></tr></thead>
            <tbody>
              {loading && !d && <tr><td colSpan="6" className="cell-msg"><Loader2 size={20} className="spin" /> লোড হচ্ছে…</td></tr>}
              {d?.items.length === 0 && <tr><td colSpan="6" className="cell-msg">কোনো খরচ পাওয়া যায়নি।</td></tr>}
              {d?.items.map((r) => (
                <tr key={r.id}>
                  <td>{dmy(r.date)}</td>
                  <td>{r.moderatorName ? <strong>{r.moderatorName}</strong> : r.recipientName ? <><strong>{r.recipientName}</strong> <span className="mini-tag">নিজে লেখা</span></> : <span className="muted">—</span>}</td>
                  <td><span className="due-chip">{tk(r.amount)}</span></td>
                  <td className="note-cell">{r.note}</td>
                  <td className="muted">{r.createdBy}</td>
                  <td><div className="row-actions"><button className="act act-red" title="ডিলিট" aria-label="ডিলিট" onClick={() => setDialog({ type: 'delete', item: r })}><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {d && d.pages > 1 && (
          <nav className="pager">
            <button className="pg" disabled={d.page <= 1} onClick={() => setPage(d.page - 1)}><ChevronLeft size={17} /></button>
            <span className="muted">{bn(d.page)} / {bn(d.pages)}</span>
            <button className="pg" disabled={d.page >= d.pages} onClick={() => setPage(d.page + 1)}><ChevronRight size={17} /></button>
          </nav>
        )}
      </section>

      {dialog?.type === 'form' && <ExpenseForm mods={mods} today={today} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.type === 'delete' && (
        <ConfirmModal
          tone="danger" title="খরচ ডিলিট করবেন?" confirmLabel="হ্যাঁ, ডিলিট করুন"
          message={`${dialog.item.moderatorName || dialog.item.recipientName || 'প্রাপক ছাড়া'} — ${tk(dialog.item.amount)} (${dmy(dialog.item.date)}) তালিকা ও হিসাব থেকে সরে যাবে।`}
          onClose={() => setDialog(null)}
          onConfirm={async () => { await api(`/expenses/${dialog.item.id}`, { method: 'DELETE' }); await done('খরচটি ডিলিট করা হয়েছে।'); }}
        />
      )}
      {dialog?.type === 'success' && <SuccessModal message={dialog.message} onClose={() => setDialog(null)} />}
    </>
  );
}

function ExpenseForm({ mods, today, onClose, onDone }) {
  const [f, setF] = useState({ moderatorId: '', recipientName: '', amount: '', date: today, note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.amount.trim()) return setError('টাকার পরিমাণ দিন।');
    if (f.note.trim().length < 3) return setError('কী উদ্দেশ্যে দেওয়া হয়েছে লিখুন।');
    setBusy(true);
    try {
      await api('/expenses', { method: 'POST', body: f });
      await onDone('খরচ সফলভাবে যোগ হয়েছে।');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="নতুন খরচ যোগ করুন" onClose={onClose} locked={busy} width={500}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {error && <div className="alert" role="alert">{error}</div>}
          <label className="field"><span>কাকে দিয়েছেন (ঐচ্ছিক) — মডারেটর বাছুন</span>
            <div className="input"><select value={f.moderatorId} onChange={set('moderatorId')}>
              <option value="">— বাছাই করবেন না —</option>
              {mods.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.username})</option>)}
            </select></div>
          </label>
          <label className="field"><span>অথবা নিজে নাম লিখুন (ঐচ্ছিক)</span>
            <div className="input"><input value={f.recipientName} onChange={set('recipientName')} placeholder="যেমন: রহিম মিয়া (অন্য কেউ)" maxLength={100} /></div>
            <small className="hint">মডারেটরের তালিকায় না থাকলে এখানে নাম লিখুন। দুটোই ফাঁকা রাখা যায়।</small>
          </label>
          <div className="form-grid">
            <label className="field"><span>কত টাকা <b className="req">*</b></span>
              <div className="input"><input value={f.amount} onChange={set('amount')} inputMode="decimal" placeholder="যেমন: 500" /></div>
            </label>
            <label className="field"><span>তারিখ</span>
              <div className="input"><input type="date" value={f.date} max={today} onChange={set('date')} /></div>
            </label>
          </div>
          <label className="field"><span>বিবরণ / কী উদ্দেশ্যে দেওয়া হয়েছে <b className="req">*</b></span>
            <textarea className="textarea" rows={3} value={f.note} onChange={set('note')} placeholder="যেমন: ৩নং ওয়ার্ডের হোল্ডিং জরিপের জন্য" />
          </label>
        </div>
        <footer className="dialog-foot">
          <button type="button" className="btn btn-gray" onClick={onClose} disabled={busy}>বাতিল</button>
          <button className="btn btn-solid" disabled={busy}>{busy && <Loader2 size={18} className="spin" />} সংরক্ষণ করুন</button>
        </footer>
      </form>
    </Modal>
  );
}
