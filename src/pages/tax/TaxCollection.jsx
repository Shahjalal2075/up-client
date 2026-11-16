import { useCallback, useEffect, useState } from 'react';
import {
  Banknote, Search, CalendarDays, CalendarRange, Wallet, Loader2, CircleCheck, ArrowDownUp, ChevronLeft, ChevronRight, User, MapPin, Phone,
} from 'lucide-react';
import { api } from '../../api';
import { bn } from '../../utils/digits';
import { tk, dmy, dateTimeBn } from '../../utils/money';
import { ConfirmModal, SuccessModal } from '../../components/Modal';

const yr = (y) => Number(y).toLocaleString('bn-BD', { useGrouping: false });
const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <article className={`stat tone-${tone}`}>
      <div><strong className={value == null ? 'skeleton' : ''}>{value ?? '\u00A0'}</strong><span>{label}</span></div>
      <Icon size={34} strokeWidth={1.5} />
    </article>
  );
}

export default function TaxCollection() {
  const [sum, setSum] = useState(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [histKey, setHistKey] = useState(0); // আদায়ের পর ইতিহাস আবার লোড

  const loadSum = useCallback(() => api('/tax/summary').then(setSum).catch((e) => setError(e.message)), []);
  useEffect(() => { loadSum(); }, [loadSum]);

  async function search(e, keep) {
    e?.preventDefault();
    const term = keep ?? q.trim();
    if (!term) return;
    setSearching(true);
    setError('');
    try {
      setResults((await api(`/tax/search?q=${encodeURIComponent(term)}`)).items);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <section className="page-head"><h2><Banknote size={26} /> ট্যাক্স আদায়</h2></section>

      <section className="stats three">
        <StatCard label="চলতি মাসের আদায়" value={sum && tk(sum.month)} icon={CalendarDays} tone="green" />
        <StatCard label={sum ? `${yr(sum.currentYear)} সালের আদায়` : 'চলতি বছরের আদায়'} value={sum && tk(sum.year)} icon={CalendarRange} tone="blue" />
        <StatCard label="মোট আদায়" value={sum && tk(sum.total)} icon={Wallet} tone="gold" />
      </section>

      <section className="panel">
        <h2 className="panel-title">হোল্ডিং খুঁজুন</h2>
        <form className="filter-bar" onSubmit={search}>
          <div className="input search wide grow"><Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="হোল্ডিং নম্বর, মালিকের নাম, গ্রাম বা মোবাইল" aria-label="খুঁজুন" />
          </div>
          <button className="btn btn-solid" disabled={searching || !q.trim()}>{searching ? <Loader2 size={17} className="spin" /> : <Search size={17} />} খুঁজুন</button>
        </form>
        {error && <div className="alert">{error}</div>}
        {results && results.length === 0 && <p className="cell-msg">কোনো হোল্ডিং পাওয়া যায়নি।</p>}
        <div className="tax-results">
          {results?.map((r) => <TaxCard key={r.id} r={r} onPay={(date) => setDialog({ type: 'confirm', r, date })} />)}
        </div>
      </section>

      <History key={histKey} />

      {dialog?.type === 'confirm' && (
        <PayConfirm r={dialog.r} initialDate={dialog.date} onClose={() => setDialog(null)} onDone={async (m) => {
          setDialog({ type: 'success', message: m });
          await Promise.all([loadSum(), search(null, q.trim()), Promise.resolve(setHistKey((k) => k + 1))]);
        }} />
      )}
      {dialog?.type === 'success' && <SuccessModal message={dialog.message} onClose={() => setDialog(null)} />}
    </>
  );
}

// সার্চ রেজাল্ট কার্ড: হোল্ডিংয়ের তথ্য + বকেয়া/সর্বশেষ বছর + আদায়ের তারিখ ও Mark as Paid
function TaxCard({ r, onPay }) {
  const due = r.dueYears.length > 0;
  const [date, setDate] = useState(todayStr());
  return (
    <article className={`tax-card ${due ? 'has-due' : 'clear'}`}>
      <div className="tax-info">
        <div className="tax-title"><span className="tax-no">#{r.holdingNo}</span><strong>{r.ownerName}</strong></div>
        <ul>
          <li><User size={15} /> পিতা/স্বামী: {r.fatherName || '—'}</li>
          <li><MapPin size={15} /> {r.wardNo ? `${bn(r.wardNo)} নং ওয়ার্ড` : ''}{r.village ? `, ${r.village}` : ''}</li>
          <li><Phone size={15} /> {r.mobile || '—'}</li>
          <li>বার্ষিক কর: <b>{tk(r.annualTax)}</b> · গণনা শুরু: {yr(r.startYear)} সাল</li>
        </ul>
      </div>

      <div className="tax-status">
        {due ? (
          <>
            <span className="lbl">মোট বকেয়া</span>
            <strong className="amt">{tk(r.dueTotal)}</strong>
            <span className="years">{r.dueYears.map(yr).join(', ')} সালের কর বাকি ({bn(r.dueYears.length)} বছর × {tk(r.annualTax)})</span>
          </>
        ) : (
          <>
            <span className="allpaid big"><CircleCheck size={18} /> সব পরিশোধিত</span>
            <span className="years">সর্বশেষ কর বছর: <b>{r.lastPaid ? yr(r.lastPaid.year) : yr(r.currentYear)}</b>{r.lastPaid ? ` (আদায়: ${dmy(r.lastPaid.paidOn)})` : ''}</span>
          </>
        )}
      </div>

      <div className="tax-pay">
        <label>আদায়ের তারিখ<input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} disabled={!due} /></label>
        <button className="btn btn-solid" disabled={!due || !date} onClick={() => onPay(date)}>Mark as Paid</button>
      </div>
    </article>
  );
}

function PayConfirm({ r, initialDate, onClose, onDone }) {
  // কার্ডে বাছা তারিখ এখানে আসে; চাইলে বদলানো যায়
  const [date, setDate] = useState(initialDate || todayStr());
  return (
    <ConfirmModal
      tone="ok"
      title="কর আদায় হিসেবে চিহ্নিত করবেন?"
      message={
        <>
          <b>#{r.holdingNo} — {r.ownerName}</b><br />
          {r.dueYears.map(yr).join(', ')} ({bn(r.dueYears.length)} বছর) = <b>{tk(r.dueTotal)}</b><br />
          <span className="pay-date-row">আদায়ের তারিখ: <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} /></span>
        </>
      }
      confirmLabel="হ্যাঁ, আদায় হয়েছে"
      onClose={onClose}
      onConfirm={async () => {
        await api('/tax/collect', { method: 'POST', body: { holdingId: r.id, paidOn: date } });
        await onDone(`${tk(r.dueTotal)} আদায় হিসেবে চিহ্নিত হয়েছে।`);
      }}
    />
  );
}

// ---------- আদায়ের ইতিহাস ----------
function History() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [d, setD] = useState({ items: [], total: 0, rangeTotal: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { const t = setTimeout(() => { setQ(input.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [input]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setD(await api(`/tax/history?from=${from}&to=${to}&q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&page=${page}`));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to, q, sort, order, page]);
  useEffect(() => { load(); }, [load]);

  const nums = [];
  for (let n = Math.max(1, d.page - 2); n <= Math.min(d.pages, d.page + 2); n++) nums.push(n);
  const offset = (d.page - 1) * 20;

  return (
    <section className="panel table-panel">
      <h2 className="panel-title">আদায়ের ইতিহাস <small className="muted">({bn(d.total)} টি · মোট {tk(d.rangeTotal)})</small></h2>
      <div className="filter-bar">
        <label>আদায়ের তারিখ — শুরু<input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /></label>
        <label>শেষ<input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></label>
        <div className="input search wide"><Search size={18} />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="হোল্ডিং নম্বর বা নাম" aria-label="খুঁজুন" />
        </div>
        <label>সাজান
          <span className="sort-row">
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
              <option value="date">তারিখ/সময় অনুযায়ী</option>
              <option value="holding">হোল্ডিং নম্বর অনুযায়ী</option>
            </select>
            <button type="button" className="chip-btn" onClick={() => { setOrder((o) => (o === 'desc' ? 'asc' : 'desc')); setPage(1); }}>
              <ArrowDownUp size={15} /> {order === 'desc' ? (sort === 'date' ? 'নতুন → পুরনো' : 'বড় → ছোট') : (sort === 'date' ? 'পুরনো → নতুন' : 'ছোট → বড়')}
            </button>
          </span>
        </label>
        {(from || to) && <button type="button" className="chip-btn" onClick={() => { setFrom(''); setTo(''); setPage(1); }}>ফিল্টার মুছুন</button>}
      </div>
      {error && <div className="alert">{error}</div>}
      <div className="table-wrap">
        <table className="tbl wide">
          <thead><tr><th>ক্রম</th><th>আদায়ের তারিখ</th><th>হোল্ডিং নং</th><th>মালিকের নাম</th><th>কর বছর</th><th>টাকা</th><th>আদায়কারী</th><th>এন্ট্রির সময়</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="8" className="cell-msg"><Loader2 size={20} className="spin" /> লোড হচ্ছে…</td></tr>}
            {!loading && d.items.length === 0 && <tr><td colSpan="8" className="cell-msg">এখনো কোনো আদায় নেই।</td></tr>}
            {!loading && d.items.map((r, i) => (
              <tr key={r.id}>
                <td className="muted">{bn(offset + i + 1)}</td>
                <td>{dmy(r.paidOn)}</td>
                <td><strong>#{r.holdingNo}</strong></td>
                <td>{r.ownerName}</td>
                <td>{r.years.map(yr).join(', ')} <span className="muted">({bn(r.years.length)} বছর)</span></td>
                <td><span className="tax-chip">{tk(r.amount)}</span></td>
                <td>{r.collector || '—'}</td>
                <td className="muted">{dateTimeBn(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {d.pages > 1 && (
        <nav className="pager" aria-label="পেজ">
          <button className="pg" disabled={d.page <= 1} onClick={() => setPage(d.page - 1)} aria-label="আগের"><ChevronLeft size={17} /></button>
          {nums[0] > 1 && <><button className="pg" onClick={() => setPage(1)}>১</button><span className="muted">…</span></>}
          {nums.map((n) => <button key={n} className={`pg ${n === d.page ? 'on' : ''}`} onClick={() => setPage(n)}>{bn(n)}</button>)}
          {nums[nums.length - 1] < d.pages && <><span className="muted">…</span><button className="pg" onClick={() => setPage(d.pages)}>{bn(d.pages)}</button></>}
          <button className="pg" disabled={d.page >= d.pages} onClick={() => setPage(d.page + 1)} aria-label="পরের"><ChevronRight size={17} /></button>
        </nav>
      )}
    </section>
  );
}
