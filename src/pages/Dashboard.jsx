import { useCallback, useEffect, useState } from 'react';
import {
  Home, FileText, HandCoins, Wallet, CircleCheck, CircleSlash, CalendarCheck, CalendarRange, CalendarDays,
  Printer, Download, ArrowDownUp, Loader2, Users, BadgeCheck, TriangleAlert, Send,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import PayNowModal from '../components/PayNowModal';
import WithdrawModal from '../components/WithdrawModal';
import { SuccessModal } from '../components/Modal';
import { tk, METHOD_LABEL, STATUS_LABEL } from '../utils/money';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../config/menu';

const bn = (n) => Number(n || 0).toLocaleString('bn-BD', { maximumFractionDigits: 0 });
const TAX_ROLES = ['super_admin', 'admin', 'accounting'];
const TEAM_ROLES = ['super_admin', 'admin'];

// ঢাকার সময়ে আজকের তারিখ (YYYY-MM-DD) ও তারিখ যোগ-বিয়োগ
const dhakaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
const addDays = (s, n) => { const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dmy = (s) => s.split('-').reverse().join('-');
const timeBn = (iso) => new Date(iso).toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });
const dateTimeBn = (iso) => new Date(iso).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function StatCard({ label, value, sub, icon: Icon, tone }) {
  return (
    <article className={`stat tone-${tone}`}>
      <div>
        <strong className={value == null ? 'skeleton' : ''}>{value ?? '\u00A0'}</strong>
        <span>{label}</span>
        {sub && <small>{sub}</small>}
      </div>
      <Icon size={34} strokeWidth={1.5} />
    </article>
  );
}

function Profile({ user }) {
  return (
    <section className="panel">
      <h2 className="panel-title">প্রশাসক প্রোফাইল তথ্য</h2>
      <dl className="profile">
        <dt>ইউজারনেম</dt><dd>{user.username}</dd>
        <dt>অ্যাক্সেস লেভেল</dt><dd><span className="badge">{ROLE_LABEL[user.role]}</span></dd>
        <dt>স্ট্যাটাস</dt>
        <dd className={user.isActive ? 'ok' : 'off'}>
          {user.isActive ? <><CircleCheck size={17} /> একটিভ</> : <><CircleSlash size={17} /> ইনঅ্যাক্টিভ</>}
        </dd>
      </dl>
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const showTax = ['super_admin', 'admin'].includes(user.role); // Accounting-er ট্যাক্স কার্ড নেই
  return (
    <>
      {showTax && <TaxOverview user={user} />}
      {user.role === 'accounting' && <AccountingBilling />}
      {TEAM_ROLES.includes(user.role) && <TeamPanel />}
      {user.role === 'moderator' && <ModeratorPanel />}
      {user.role === 'printer' && <PrinterPanel />}
      {!showTax && <Profile user={user} />}
    </>
  );
}

// ---------- Super Admin / Admin / Accounting ----------
function TaxOverview({ user }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/dashboard/stats').then(setStats).catch((e) => setError(e.message)); }, []);
  const pct = stats && stats.totalTax > 0 ? Math.min(100, Math.round((stats.collectedTax / stats.totalTax) * 100)) : 0;

  return (
    <>
      {error && <div className="alert">{error}</div>}
      <section className="stats">
        <StatCard label="মোট হোল্ডিং সংখ্যা" value={stats && bn(stats.totalHoldings)} icon={Home} tone="blue" />
        <StatCard label="মোট ট্যাক্স ধার্য" value={stats && `${bn(stats.totalTax)} ৳`} icon={FileText} tone="gold" />
        <StatCard label="মোট ট্যাক্স আদায়" value={stats && `${bn(stats.collectedTax)} ৳`} icon={Wallet} tone="green" />
        <StatCard label="মোট বকেয়া ট্যাক্স" value={stats && `${bn(stats.dueTax)} ৳`} icon={HandCoins} tone="red" />
      </section>
      <div className="grid-2">
        <section className="panel">
          <h2 className="panel-title">আদায়ের অগ্রগতি</h2>
          <div className="progress-head">
            <strong>{stats ? `${pct.toLocaleString('bn-BD')}%` : '—'}</strong>
            <span>ধার্যকৃত ট্যাক্সের মধ্যে আদায় হয়েছে</span>
          </div>
          <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pct}%` }} /></div>
        </section>
        <Profile user={user} />
      </div>
    </>
  );
}

// ---------- Super Admin / Admin: আজ মোট + মডারেটর অনুযায়ী ----------
const SORT_OPTIONS = [['count', 'যোগ করা সংখ্যা'], ['name', 'নাম (বর্ণানুক্রম)'], ['recent', 'সর্বশেষ যোগের সময়']];

function TeamPanel() {
  const today = dhakaToday();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [sort, setSort] = useState('count');
  const [order, setOrder] = useState('desc');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/dashboard/team?from=${from}&to=${to}&sort=${sort}&order=${order}`));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to, sort, order]);
  useEffect(() => { load(); }, [load]);

  const quick = [
    ['আজ', today, today],
    ['গতকাল', addDays(today, -1), addDays(today, -1)],
    ['গত ৭ দিন', addDays(today, -6), today],
    ['চলতি মাস', `${today.slice(0, 8)}01`, today],
  ];
  const rangeLabel = data ? (data.from === data.to ? dmy(data.from) : `${dmy(data.from)} থেকে ${dmy(data.to)}`) : '';

  return (
    <section className="panel team-panel">
      <div className="team-head">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>মডারেটর অনুযায়ী হোল্ডিং যোগ</h2>
        <div className="today-box"><CalendarCheck size={22} /><div><strong>{data ? bn(data.todayTotal) : '—'}</strong><span>আজ মোট যোগ হয়েছে</span></div></div>
      </div>

      <div className="filter-bar">
        <label>শুরুর তারিখ<input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} /></label>
        <label>শেষ তারিখ<input type="date" value={to} min={from} max={today} onChange={(e) => e.target.value && setTo(e.target.value)} /></label>
        <div className="chips-row">
          {quick.map(([l, f, t]) => (
            <button key={l} className={`chip-btn ${from === f && to === t ? 'on' : ''}`} onClick={() => { setFrom(f); setTo(t); }}>{l}</button>
          ))}
        </div>
        <label className="push-right">সাজান
          <span className="sort-row">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <button className="chip-btn" onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))} aria-label="ক্রম উল্টান" title="ক্রম উল্টান">
              <ArrowDownUp size={15} /> {order === 'desc' ? 'বেশি → কম' : 'কম → বেশি'}
            </button>
          </span>
        </label>
      </div>

      {error && <div className="alert">{error}</div>}
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>ক্রম</th><th>মডারেটর</th><th>যোগ করেছেন ({rangeLabel})</th><th>সর্বশেষ যোগ</th></tr></thead>
          <tbody>
            {loading && !data && <tr><td colSpan="4" className="cell-msg"><Loader2 size={20} className="spin" /> লোড হচ্ছে…</td></tr>}
            {data && data.moderators.length === 0 && <tr><td colSpan="4" className="cell-msg"><Users size={18} /> এখনো কোনো মডারেটর নেই।</td></tr>}
            {data?.moderators.map((m, i) => (
              <tr key={m.id} className={m.isActive ? '' : 'is-off'}>
                <td className="muted">{bn(i + 1)}</td>
                <td><strong>{m.name}</strong> <span className="muted">({m.username})</span>{!m.isActive && <span className="mini-tag">ইনঅ্যাক্টিভ</span>}</td>
                <td><span className={`num-chip ${m.count ? '' : 'zero'}`}>{bn(m.count)} টি</span></td>
                <td>{m.lastAt ? dateTimeBn(m.lastAt) : '—'}</td>
              </tr>
            ))}
          </tbody>
          {data && (
            <tfoot>
              {data.others > 0 && <tr><td /><td className="muted">অন্যান্য (অ্যাডমিন বা আগের ডাটা)</td><td>{bn(data.others)} টি</td><td /></tr>}
              <tr className="sum"><td /><td>মোট</td><td>{bn(data.rangeTotal)} টি</td><td /></tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}

// ---------- Moderator ----------
const STATUS_CLASS = { pending: 'st-pending', approved: 'st-ok', rejected: 'st-bad' };

function ModeratorPanel() {
  const today = dhakaToday();
  const [a, setA] = useState(null);       // কাজের সংখ্যা (আজ/৭ দিন/মাস/মোট)
  const [b, setB] = useState(null);       // চার্জ ও পেমেন্টের হিসাব
  const [error, setError] = useState('');
  const [date, setDate] = useState(today);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState(false);
  const [done, setDone] = useState('');

  const load = useCallback(() => {
    Promise.all([api('/dashboard/my-activity'), api('/payments/my')])
      .then(([x, y]) => { setA(x); setB(y); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function check(e) {
    e?.preventDefault();
    if (!date) return;
    setBusy(true);
    setError('');
    try {
      const [x, y] = await Promise.all([api(`/dashboard/my-activity?date=${date}`), api(`/payments/my?date=${date}`)]);
      setRes({ ...x.date, bill: y.day });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error && <div className="alert">{error}</div>}
      <section className="stats">
        <StatCard label="আজ যোগ করেছেন" value={a && bn(a.today)} icon={CalendarCheck} tone="green" />
        <StatCard label="গত ৭ দিনে (আজসহ)" value={a && bn(a.week)} icon={CalendarRange} tone="blue" />
        <StatCard label="চলতি মাসে" value={a && bn(a.month)} icon={CalendarDays} tone="gold" />
        <StatCard label="সর্বমোট যোগ করেছেন" value={a && bn(a.total)} icon={Home} tone="red" />
      </section>

      <EarningsPanel />

      <section className="panel bill-panel">
        <div className="bill-head">
          <div>
            <h2 className="panel-title" style={{ marginBottom: 4 }}>আমার পেমেন্টের হিসাব</h2>
            <span className="muted">প্রতিটি হোল্ডিং এন্ট্রির চার্জ {b ? tk(b.fee) : '…'}</span>
          </div>
          <button className="btn btn-solid big-pay" onClick={() => setPay(true)} disabled={!b || b.available <= 0}>
            <Wallet size={18} /> Pay Now
          </button>
        </div>

        {b && b.entryEnabled === false && (
          <div className="alert warn bill-alert">
            <TriangleAlert size={18} /> ডাটা এন্ট্রি এখন বন্ধ আছে (অ্যাকাউন্টিং বন্ধ রেখেছে)। চালু হলে আবার হোল্ডিং যোগ করতে পারবেন।
          </div>
        )}
        {b?.blocked && b.entryEnabled !== false && (
          <div className="alert warn bill-alert">
            <TriangleAlert size={18} /> আগের দিনের {tk(b.previousDue)} বকেয়া আছে। পেমেন্ট অনুমোদিত না হওয়া পর্যন্ত নতুন হোল্ডিং যোগ করা যাবে না।
          </div>
        )}
        {b && !b.blocked && b.available <= 0 && b.pending > 0 && <p className="muted">আপনার পেমেন্ট ({tk(b.pending)}) অনুমোদনের অপেক্ষায় আছে।</p>}

        <div className="bill-grid">
          <div><span>মোট প্রদেয়</span><strong>{b ? tk(b.totalCharge) : '…'}</strong><small>{b ? `${bn(b.totalCount)} টি এন্ট্রি` : ''}</small></div>
          <div><span>পরিশোধিত (অনুমোদিত)</span><strong className="ok">{b ? tk(b.approved) : '…'}</strong></div>
          <div><span>অনুমোদনের অপেক্ষায়</span><strong className="warnc">{b ? tk(b.pending) : '…'}</strong></div>
          <div className="due"><span>এখন দিতে হবে</span><strong>{b ? tk(b.totalDue) : '…'}</strong><small>{b ? `আজকের ${tk(b.todayRow.charge)} সহ` : ''}</small></div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">তারিখ অনুযায়ী দেখুন</h2>
        <form className="filter-bar" onSubmit={check}>
          <label>তারিখ বাছুন<input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} /></label>
          <button className="btn btn-solid" disabled={busy || !date}>{busy ? <Loader2 size={17} className="spin" /> : <CalendarDays size={17} />} দেখুন</button>
        </form>
        {res && (
          <>
            <p className="date-result"><strong>{dmy(res.date)}</strong> তারিখে আপনি <b>{bn(res.count)} টি</b> হোল্ডিং যোগ করেছেন।</p>
            <div className="bill-grid small">
              <div><span>ওই দিনের প্রদেয়</span><strong>{tk(res.bill.charge)}</strong></div>
              <div><span>পরিশোধ করেছেন</span><strong className="ok">{tk(res.bill.paid)}</strong></div>
              <div className="due"><span>বাকি আছে</span><strong>{tk(res.bill.due)}</strong></div>
            </div>
            {res.items.length > 0 && (
              <div className="table-wrap">
                <table className="tbl">
                  <thead><tr><th>ক্রম</th><th>হোল্ডিং নং</th><th>মালিকের নাম</th><th>সময়</th></tr></thead>
                  <tbody>
                    {res.items.map((r, i) => <tr key={r.id}><td className="muted">{bn(i + 1)}</td><td><strong>#{r.holdingNo}</strong></td><td>{r.ownerName}</td><td>{timeBn(r.createdAt)}</td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {b?.payments?.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">আমার জমা দেওয়া পেমেন্ট</h2>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>সময়</th><th>মাধ্যম</th><th>ট্রানজেকশন আইডি</th><th>টাকা</th><th>অবস্থা</th></tr></thead>
              <tbody>
                {b.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{dateTimeBn(p.createdAt)}</td>
                    <td><span className={`method-tag ${p.method}`}>{METHOD_LABEL[p.method]}</span> <span className="muted">{p.senderNumber}</span></td>
                    <td><code>{p.trxId}</code></td>
                    <td><strong>{tk(p.amount)}</strong></td>
                    <td><span className={`st-chip ${STATUS_CLASS[p.status]}`}>{STATUS_LABEL[p.status]}</span>{p.status === 'rejected' && p.note && <small className="muted" style={{ display: 'block' }}>কারণ: {p.note}</small>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {pay && <PayNowModal available={b.available} onClose={() => setPay(false)} onDone={async (m) => { setPay(false); load(); setDone(m); }} />}
      {done && <SuccessModal message={done} onClose={() => setDone('')} />}
    </>
  );
}

// ---------- Moderator: আয় (ব্যালেন্স) ও উত্তোলন ----------
function EarningsPanel() {
  const [e, setE] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState('');
  const load = useCallback(() => api('/payments/earnings').then(setE).catch((x) => setError(x.message)), []);
  useEffect(() => { load(); }, [load]);

  return (
    <section className="panel earn-panel">
      <div className="bill-head">
        <div>
          <h2 className="panel-title" style={{ marginBottom: 4 }}>আমার আয় (ব্যালেন্স)</h2>
          <span className="muted">প্রতিটি হোল্ডিং এন্ট্রির জন্য আপনি পান {e ? tk(e.reward) : '…'}</span>
        </div>
        <button className="btn btn-solid big-pay" onClick={() => setOpen(true)} disabled={!e || !e.enabled || e.available <= 0}>
          <Send size={18} /> Withdraw
        </button>
      </div>
      {error && <div className="alert">{error}</div>}
      {e && !e.enabled && <div className="alert warn bill-alert"><TriangleAlert size={18} /> উত্তোলন এখন বন্ধ আছে। অ্যাকাউন্টিং চালু করলে টাকা তুলতে পারবেন।</div>}

      <div className="bill-grid three">
        <div className="earn"><span>বর্তমান ব্যালেন্স</span><strong>{e ? tk(e.available) : '…'}</strong><small>{e ? `মোট আয় ${tk(e.earned)} (${bn(e.entries)} এন্ট্রি)` : ''}</small></div>
        <div><span>পেন্ডিং ব্যালেন্স</span><strong className="warnc">{e ? tk(e.pending) : '…'}</strong><small>উত্তোলনের অনুরোধ, অনুমোদন হয়নি</small></div>
        <div><span>মোট উত্তোলন</span><strong className="ok">{e ? tk(e.withdrawn) : '…'}</strong><small>অনুমোদিত ও পাঠানো হয়েছে</small></div>
      </div>

      {e?.history?.length > 0 && (
        <>
          <h3 className="sub-h" style={{ marginTop: 18 }}>উত্তোলনের ইতিহাস</h3>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>সময়</th><th>টাকা</th><th>মাধ্যম ও নম্বর</th><th>ট্রানজেকশন আইডি</th><th>অবস্থা</th></tr></thead>
              <tbody>
                {e.history.map((w) => (
                  <tr key={w.id}>
                    <td>{dateTimeBn(w.createdAt)}</td>
                    <td><strong>{tk(w.amount)}</strong></td>
                    <td><span className={`method-tag ${w.method}`}>{METHOD_LABEL[w.method]}</span> {w.number}</td>
                    <td>{w.trxId ? <code>{w.trxId}</code> : <span className="muted">—</span>}</td>
                    <td><span className={`st-chip ${STATUS_CLASS[w.status]}`}>{STATUS_LABEL[w.status]}</span>{w.status === 'rejected' && w.note && <small className="muted" style={{ display: 'block' }}>কারণ: {w.note}</small>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {open && <WithdrawModal balance={e.available} onClose={() => setOpen(false)} onDone={async (m) => { setOpen(false); load(); setDone(m); }} />}
      {done && <SuccessModal message={done} onClose={() => setDone('')} />}
    </section>
  );
}

// ---------- Accounting: সব মডারেটরের পেমেন্টের হিসাব ----------
function AccountingBilling() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/payments/accounts').then(setD).catch((e) => setError(e.message)); }, []);

  const Row = ({ title, sub, v }) => (
    <div className="acc-block">
      <h3>{title} {sub && <small className="muted">{sub}</small>}</h3>
      <div className="stats">
        <StatCard label="মোট ডাটা এন্ট্রি" value={v && bn(v.count)} icon={Home} tone="blue" />
        <StatCard label="মডারেটরদের প্রদেয়" value={v && tk(v.charge)} icon={FileText} tone="gold" />
        <StatCard label="পরিশোধ করেছে" value={v && tk(v.paid)} icon={Wallet} tone="green" />
        <StatCard label="বাকি আছে" value={v && tk(v.due)} icon={HandCoins} tone="red" />
      </div>
    </div>
  );

  return (
    <section className="panel team-panel">
      <div className="team-head">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>মডারেটরদের পেমেন্টের হিসাব</h2>
        <div className="acc-links">
          <Link className="chip-btn" to="/admin/payment-approvals"><BadgeCheck size={15} /> অনুমোদনের অপেক্ষায় {d ? bn(d.pendingCount) : '…'} টি</Link>
          <Link className="chip-btn" to="/admin/moderator-accounts"><Users size={15} /> মডারেটর হিসাব</Link>
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      <Row title="আজকের হিসাব" sub={d ? `(${dmy(d.yesterdayDate)} তারিখের কাজের)` : ''} v={d?.yesterday} />
      <Row title="সর্বমোট হিসাব" sub={d ? `(প্রতি এন্ট্রি ${tk(d.fee)})` : ''} v={d?.overall} />
    </section>
  );
}

// ---------- Printer ----------
function PrinterPanel() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/dashboard/printer').then(setD).catch((e) => setError(e.message)); }, []);
  const sub = (o) => `সনদ ${bn(o.certificate)} · নম্বর প্লেট ${bn(o.plate)}`;

  return (
    <>
      {error && <div className="alert">{error}</div>}
      <section className="stats three">
        <StatCard label="মোট হোল্ডিং সংখ্যা" value={d && bn(d.totalHoldings)} icon={Home} tone="blue" />
        <StatCard label="আপনি মোট প্রিন্ট করেছেন" value={d && `${bn(d.prints.total)} বার`} sub={d && sub(d.prints)} icon={Printer} tone="green" />
        <StatCard label="আপনি মোট ডাউনলোড করেছেন" value={d && `${bn(d.downloads.total)} বার`} sub={d && sub(d.downloads)} icon={Download} tone="gold" />
      </section>
    </>
  );
}
