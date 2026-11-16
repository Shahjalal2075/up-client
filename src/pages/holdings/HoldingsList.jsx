import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home as House, Plus, Search, Printer, CreditCard, SquarePen, Trash2, Loader2, ChevronLeft, ChevronRight,
  User, Info, Briefcase, Wallet, ClipboardList,
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { WARD_OPTIONS } from '../../config/wards';
import { UP_BENEFITS, HOUSE_TYPES } from '../../config/holdingOptions';
import { toAscii, normMobile, bn, fmtMoney, fmtDate } from '../../utils/digits';
import { useSite } from '../../useSite';
import { Modal, ConfirmModal, SuccessModal } from '../../components/Modal';

const BASE = '/admin/holdings';
const PAGE_SIZES = [20, 50, 100, 500, 1000];
const EDITORS = ['super_admin', 'admin', 'moderator'];
const DELETERS = ['super_admin', 'admin'];
const MAX_PRINT = 300; // একবারে সর্বোচ্চ কতগুলো প্রিন্ট করা যাবে

// hover করলে সঙ্গে সঙ্গে দেখায় (table-er overflow-e kete jay na)
function Tip({ text, children }) {
  const [pos, setPos] = useState(null);
  const show = (e) => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.top }); };
  return (
    <span className="tip-wrap" onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)}>
      {children}
      {pos && createPortal(<div className="tip" style={{ left: pos.x, top: pos.y }} role="tooltip">{text}</div>, document.body)}
    </span>
  );
}
const countText = (label, st) => `${label} — প্রিন্ট: ${bn(st?.print || 0)} বার · ডাউনলোড: ${bn(st?.download || 0)} বার`;

const blank = (defaultSurveyor = '') => ({
  holdingNo: '', ownerName: '', fatherName: '', motherName: '', nid: '', mobile: '', wardNo: '', village: '', familyMembers: '',
  permanentAddress: '', upBenefit: UP_BENEFITS[0], landArea: '', houseType: '', occupation: '', annualIncome: '', annualTax: '100',
  surveyorName: defaultSurveyor, note: '',
});

export default function HoldingsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = EDITORS.includes(user.role);
  const canDelete = DELETERS.includes(user.role);
  const canBulk = ['printer', 'admin', 'super_admin'].includes(user.role); // একসাথে অনেকগুলো সনদ/প্লেট প্রিন্ট
  const site = useSite();

  const [data, setData] = useState({ items: [], total: 0, grandTotal: 0, page: 1, pages: 1, pageSize: 20 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // প্রতি পেজে কতটি; ডিফল্ট ২০, রিলোড দিলে আবার ২০ (সংরক্ষণ হয় না)
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date');
  const [order, setOrder] = useState('desc');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [ward, setWard] = useState(''); // ওয়ার্ড অনুযায়ী ফিল্টার ('' = সব)
  const [sel, setSel] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);

  // টাইপ করলে একটু থেমে সার্চ
  useEffect(() => {
    const t = setTimeout(() => { setQ(input.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [input]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/holdings?page=${page}&q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&from=${from}&to=${to}&ward=${ward}&limit=${pageSize}`));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, q, sort, order, from, to, ward, pageSize]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSel(new Set()); }, [q, from, to, ward]); // ফিল্টার বদলালে নির্বাচন মুছে যায়

  const close = () => setDialog(null);
  const done = async (message) => { await load(); setDialog({ type: 'success', message }); };

  const nums = [];
  for (let n = Math.max(1, data.page - 2); n <= Math.min(data.pages, data.page + 2); n++) nums.push(n);
  const offset = (data.page - 1) * data.pageSize;

  const pageIds = data.items.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => sel.has(id));
  const toggleOne = (id) => setSel((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const togglePage = () => setSel((p) => { const n = new Set(p); pageIds.forEach((id) => (allOnPage ? n.delete(id) : n.add(id))); return n; });

  // ফিল্টার অনুযায়ী সব (সব পেজের) হোল্ডিং নির্বাচন
  async function selectAllMatching() {
    try {
      const r = await api(`/holdings/ids?q=${encodeURIComponent(q)}&from=${from}&to=${to}&ward=${ward}`);
      setSel(new Set(r.ids));
      if (r.capped) setError(`সর্বোচ্চ ${bn(r.max)} টি একসাথে নির্বাচন করা যায় (মোট ${bn(r.total)} টি আছে)। তারিখ দিয়ে ছোট করে আবার চেষ্টা করুন।`);
    } catch (e) {
      setError(e.message);
    }
  }

  // নির্বাচিত সবগুলো একসাথে প্রিন্ট — আলাদা পেজে খুলে সেখান থেকে প্রিন্ট হয়
  function startPrintAll(kind) {
    sessionStorage.setItem('holdingPrintIds', JSON.stringify([...sel]));
    navigate(`${BASE}/print-all?kind=${kind}`);
  }
  const cols = 10 + (canBulk ? 1 : 0);

  return (
    <>
      <section className="page-head">
        <h2>
          <House size={26} /> ডিজিটাল হোল্ডিং ম্যানেজমেন্ট সিস্টেম
          <span className="count-pill">সর্বমোট হোল্ডার: {bn(data.grandTotal)} জন</span>
        </h2>
        {canEdit && (
          <button className="btn btn-dark" onClick={() => setDialog({ type: data.billing?.entryEnabled === false ? 'disabled' : data.billing?.blocked ? 'blocked' : 'form' })}><Plus size={18} /> নতুন হোল্ডিং যুক্ত করুন</button>
        )}
      </section>

      <section className="panel table-panel">
        <div className="hl-tools">
          <div className="input search hl-search">
            <Search size={18} />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="নাম, হোল্ডিং, গ্রাম বা মোবাইল দিয়ে খুঁজুন…" aria-label="খুঁজুন" />
          </div>
          <div className="hl-filters">
            <label className="fld">ওয়ার্ড
              <select value={ward} onChange={(e) => { setWard(e.target.value); setPage(1); }}>
                <option value="">সব ওয়ার্ড</option>
                {WARD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="fld">সাজান
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                <option value="date">তারিখ অনুযায়ী</option>
                <option value="holding">হোল্ডিং নম্বর অনুযায়ী</option>
              </select>
            </label>
            <label className="fld">ক্রম
              <select value={order} onChange={(e) => { setOrder(e.target.value); setPage(1); }}>
                <option value="desc">{sort === 'date' ? 'নতুন → পুরনো' : 'বড় → ছোট'}</option>
                <option value="asc">{sort === 'date' ? 'পুরনো → নতুন' : 'ছোট → বড়'}</option>
              </select>
            </label>
            <label className="fld">প্রতি পেজে
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{bn(n)}</option>)}
              </select>
            </label>
            <label className="fld">যোগের তারিখ — থেকে
              <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
            </label>
            <label className="fld">পর্যন্ত
              <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
            </label>
          </div>
          {(q || ward || from || to) && (
            <div className="hl-meta">
              <button type="button" className="chip-btn" onClick={() => { setInput(''); setQ(''); setWard(''); setFrom(''); setTo(''); setPage(1); }}>সব ফিল্টার মুছুন</button>
              <span className="muted">{bn(data.total)} টি পাওয়া গেছে{ward ? ` (${bn(ward)} নং ওয়ার্ড)` : ''}</span>
            </div>
          )}
        </div>

        {error && <div className="alert">{error}</div>}
        {data.billing?.entryEnabled === false && (
          <div className="alert warn">ডাটা এন্ট্রি এখন বন্ধ আছে। অ্যাকাউন্টিং চালু করলে নতুন হোল্ডিং যোগ করতে পারবেন।</div>
        )}
        {data.billing?.blocked && data.billing?.entryEnabled !== false && (
          <div className="alert warn">আগের দিনের ৳{bn(data.billing.previousDue)} পেমেন্ট বাকি। পেমেন্ট অনুমোদিত না হওয়া পর্যন্ত নতুন হোল্ডিং যোগ করা যাবে না। <Link to="/admin">ড্যাশবোর্ডে গিয়ে Pay Now করুন</Link></div>
        )}

        {canBulk && (sel.size > 0 || (allOnPage && data.total > pageIds.length)) && (
          <div className="bulk-bar">
            {allOnPage && data.total > pageIds.length && sel.size < data.total && (
              <span>এই পেজের {bn(pageIds.length)} টি নির্বাচিত। <button type="button" className="linkish" onClick={selectAllMatching}>ফিল্টার অনুযায়ী সব {bn(data.total)} টি নির্বাচন করুন</button></span>
            )}
            {sel.size > 0 && (
              <>
                <b>{bn(sel.size)} টি নির্বাচিত</b>
                <button className="btn btn-solid sm" onClick={() => startPrintAll('certificate')} disabled={sel.size > MAX_PRINT}><Printer size={16} /> সব সনদ প্রিন্ট</button>
                <button className="btn btn-blue sm" onClick={() => startPrintAll('plate')} disabled={sel.size > MAX_PRINT}><CreditCard size={16} /> সব নম্বর প্লেট প্রিন্ট</button>
                <button className="btn btn-ghost sm" onClick={() => setSel(new Set())}>নির্বাচন বাতিল</button>
              </>
            )}
          </div>
        )}

        <div className="table-wrap tw-cards">
          <table className="tbl wide tbl-cards">
            <thead>
              <tr>
                {canBulk && <th className="chk"><input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="এই পেজের সব নির্বাচন" /></th>}
                <th>ক্রমিক নং</th><th>হোল্ডিং নং</th><th>মালিকের নাম</th><th>পিতা/স্বামীর নাম</th>
                <th>ওয়ার্ড নং</th><th>গ্রাম/মহল্লা</th><th>মোবাইল নং</th><th>যোগের তারিখ</th><th>ট্যাক্স</th><th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={cols} className="cell-msg"><Loader2 size={20} className="spin" /> লোড হচ্ছে…</td></tr>}
              {!loading && data.items.length === 0 && <tr><td colSpan={cols} className="cell-msg">কোনো হোল্ডিং পাওয়া যায়নি।</td></tr>}
              {!loading && data.items.map((r, i) => (
                <tr key={r.id} className={sel.has(r.id) ? 'row-sel' : ''}>
                  {canBulk && <td className="chk"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggleOne(r.id)} aria-label="নির্বাচন" /></td>}
                  <td data-label="ক্রমিক নং" className="c-serial">{offset + i + 1}</td>
                  <td data-label="হোল্ডিং নং" className="c-no"><strong>#{r.holdingNo}</strong></td>
                  <td data-label="মালিকের নাম" className="c-owner">{r.ownerName}</td>
                  <td data-label="পিতা/স্বামীর নাম">{r.fatherName || '—'}</td>
                  <td data-label="ওয়ার্ড নং">{r.wardNo ? `${bn(r.wardNo)} নং` : '—'}</td>
                  <td data-label="গ্রাম/মহল্লা">{r.village || '—'}</td>
                  <td data-label="মোবাইল নং">{r.mobile || '—'}</td>
                  <td data-label="যোগের তারিখ">{fmtDate(r.createdAt)}</td>
                  <td data-label="ট্যাক্স"><span className="tax-chip">{fmtMoney(r.annualTax).replace('/-', '')} ৳</span></td>
                  <td className="act-cell">
                    <div className="row-actions">
                      <Tip text={countText('সনদ', r.stats?.certificate)}>
                        <Link className="act act-purple" to={`${BASE}/${r.id}/certificate?print=1`} aria-label="সনদ প্রিন্ট"><Printer size={16} /></Link>
                      </Tip>
                      <Tip text={countText('নম্বর প্লেট', r.stats?.plate)}>
                        <Link className="act act-green" to={`${BASE}/${r.id}/plate?print=1`} aria-label="নম্বর প্লেট প্রিন্ট"><CreditCard size={16} /></Link>
                      </Tip>
                      {canEdit && <button className="act act-blue" title="এডিট" aria-label="এডিট" onClick={() => setDialog({ type: 'form', item: r })}><SquarePen size={16} /></button>}
                      {canDelete && <button className="act act-red" title="ডিলিট" aria-label="ডিলিট" onClick={() => setDialog({ type: 'confirm', item: r })}><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pager-bar">
          <label className="inline-sort">প্রতি পেজে:
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} aria-label="প্রতি পেজে কতটি">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{bn(n)}</option>)}
            </select>
            <span className="muted">· মোট {bn(data.total)} টি</span>
          </label>
          {data.pages > 1 && (
            <nav className="pager" aria-label="পেজ">
              <button className="pg" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)} aria-label="আগের"><ChevronLeft size={17} /></button>
              {nums[0] > 1 && <><button className="pg" onClick={() => setPage(1)}>১</button><span className="muted">…</span></>}
              {nums.map((n) => <button key={n} className={`pg ${n === data.page ? 'on' : ''}`} onClick={() => setPage(n)}>{bn(n)}</button>)}
              {nums[nums.length - 1] < data.pages && <><span className="muted">…</span><button className="pg" onClick={() => setPage(data.pages)}>{bn(data.pages)}</button></>}
              <button className="pg" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)} aria-label="পরের"><ChevronRight size={17} /></button>
            </nav>
          )}
        </div>
      </section>

      {dialog?.type === 'form' && <HoldingForm item={dialog.item} onClose={close} onDone={done} />}
      {dialog?.type === 'confirm' && (
        <ConfirmModal
          tone="danger"
          title="হোল্ডিং ডিলিট করবেন?"
          message={`"${dialog.item.ownerName}" (হোল্ডিং #${dialog.item.holdingNo}) তালিকা থেকে সরে যাবে।`}
          confirmLabel="হ্যাঁ, ডিলিট করুন"
          onClose={close}
          onConfirm={async () => {
            await api(`/holdings/${dialog.item.id}`, { method: 'DELETE' });
            await done('হোল্ডিং সফলভাবে ডিলিট করা হয়েছে।');
          }}
        />
      )}
      {dialog?.type === 'blocked' && (
        <Modal title="আগের দিনের পেমেন্ট বাকি" onClose={close} width={440}>
          <div className="dialog-body">
            <span className="dialog-icon tone-warn"><Wallet size={30} /></span>
            <h2>নতুন এন্ট্রি বন্ধ আছে</h2>
            <p>আগের দিনের <b>৳{bn(data.billing.previousDue)}</b> পেমেন্ট এখনো অনুমোদিত হয়নি। পেমেন্ট সম্পূর্ণ (অনুমোদিত) হলে নতুন হোল্ডিং যোগ করতে পারবেন।</p>
          </div>
          <footer className="dialog-foot">
            <button className="btn btn-ghost" onClick={close}>পরে</button>
            <button className="btn btn-solid" onClick={() => navigate('/admin')}>পেমেন্ট করুন</button>
          </footer>
        </Modal>
      )}
      {dialog?.type === 'disabled' && (
        <Modal title="ডাটা এন্ট্রি বন্ধ" onClose={close} width={440}>
          <div className="dialog-body">
            <span className="dialog-icon tone-warn"><Wallet size={30} /></span>
            <h2>এখন নতুন এন্ট্রি করা যাবে না</h2>
            <p>অ্যাকাউন্টিং ডাটা এন্ট্রি বন্ধ রেখেছে। চালু হলে আবার নতুন হোল্ডিং যোগ করতে পারবেন।</p>
          </div>
          <footer className="dialog-foot single"><button className="btn btn-solid" onClick={close}>ঠিক আছে</button></footer>
        </Modal>
      )}
      {dialog?.type === 'success' && <SuccessModal message={dialog.message} onClose={close} />}
    </>
  );
}

function F({ label, req, className = '', children }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}{req && <b className="req"> *</b>}</span>
      {children}
    </label>
  );
}
const Sec = ({ icon: Icon, children }) => <h4 className="hm-sec"><Icon size={17} /> {children}</h4>;

function HoldingForm({ item, onClose, onDone }) {
  const { user } = useAuth();
  const editing = !!item;
  const [f, setF] = useState(() => {
    if (!item) return blank(user.username);
    const b = blank();
    Object.keys(b).forEach((k) => { b[k] = String(item[k] ?? b[k]); });
    return b;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const inp = (k, p = {}) => <div className="input"><input value={f[k]} onChange={set(k)} {...p} /></div>;

  async function submit(e) {
    e.preventDefault();
    setError('');
    const need = [['holdingNo', 'হোল্ডিং নম্বর'], ['ownerName', 'বাসা/হোল্ডিং মালিকের নাম'], ['fatherName', 'পিতা/স্বামীর নাম'], ['motherName', 'মাতার নাম'],
    ['nid', 'এন আই ডি / জন্ম নিবন্ধন নং'], ['mobile', 'মোবাইল নং'], ['village', 'গ্রাম/মহল্লা'], ['familyMembers', 'পরিবারের সদস্য সংখ্যা'],
    ['permanentAddress', 'স্থায়ী ঠিকানা'], ['landArea', 'জমি জায়গার পরিমাণ'], ['occupation', 'পেশা'], ['annualIncome', 'বাৎসরিক আয়'],
    ['annualTax', 'ধার্যকৃত কর'], ['surveyorName', 'জরিপকারীর নাম']].find(([k]) => !String(f[k]).trim());
    if (need) return setError(`${need[1]} দিন।`);
    if (!f.wardNo) return setError('ওয়ার্ড নং নির্বাচন করুন।');
    if (!f.houseType) return setError('হোল্ডিং / বাসা / বাড়ির ধরন নির্বাচন করুন।');
    if (!normMobile(f.mobile)) return setError('মোবাইল নম্বর সঠিক নয় (যেমন: 01712345678)।');
    if (!/^\d{10,20}$/.test(toAscii(f.nid).replace(/[\s-]/g, ''))) return setError('এন আই ডি / জন্ম নিবন্ধন নং সঠিক নয় (১০–২০ সংখ্যা)।');

    setBusy(true);
    try {
      if (editing) await api(`/holdings/${item.id}`, { method: 'PUT', body: f });
      else await api('/holdings', { method: 'POST', body: f });
      await onDone(editing ? 'হোল্ডিংয়ের তথ্য সফলভাবে আপডেট হয়েছে।' : 'নতুন হোল্ডিং সফলভাবে যুক্ত হয়েছে।');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={<span className="title-with-icon"><House size={22} /> {editing ? 'হোল্ডিং মালিকের তথ্য সংশোধন' : 'নতুন হোল্ডিং মালিকের তথ্য ফর্ম'}</span>}
      onClose={onClose}
      locked={busy}
      width={740}
    >
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {error && <div className="alert" role="alert">{error}</div>}

          <Sec icon={User}>বাসা মালিকের পারিবারিক তথ্য</Sec>
          <div className="form-grid">
            <F label="হোল্ডিং নম্বর" req>{inp('holdingNo', { placeholder: 'যেমন: 103-05 বা 03-0150', autoFocus: true })}</F>
            <F label="বাসা/হোল্ডিং মালিকের নাম" req>{inp('ownerName')}</F>
            <F label="পিতা/স্বামীর নাম" req>{inp('fatherName')}</F>
            <F label="মাতার নাম" req>{inp('motherName')}</F>
            <F label="এন আই ডি / জন্ম নিবন্ধন নং" req>{inp('nid', { inputMode: 'numeric' })}</F>
            <F label="মোবাইল নং" req>{inp('mobile', { inputMode: 'tel' })}</F>
            <F label="ওয়ার্ড নং" req>
              <div className="input">
                <select value={f.wardNo} onChange={set('wardNo')}>
                  <option value="">ওয়ার্ড সিলেক্ট করুন</option>
                  {WARD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </F>
            <F label="গ্রাম/মহল্লা" req>{inp('village')}</F>
            <F label="পরিবারের সদস্য সংখ্যা" req>{inp('familyMembers', { inputMode: 'numeric' })}</F>
            <F label="স্থায়ী ঠিকানা" req>{inp('permanentAddress', { placeholder: 'গ্রাম, পোস্ট, উপজেলা, জেলা' })}</F>
          </div>

          <Sec icon={Info}>ইউপি সুবিধা ও হোল্ডিং বিবরণ</Sec>
          <div className="form-grid">
            <F label="ইউপি কর্তৃক কোনো সুবিধা ভোগ করেন কিনা?" req>
              <div className="input">
                <select value={f.upBenefit} onChange={set('upBenefit')}>
                  {UP_BENEFITS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </F>
            <F label="জমি জায়গার পরিমাণ (শতক/বিঘা)" req>{inp('landArea', { placeholder: 'যেমন: ১০ শতক বা ২ বিঘা' })}</F>
            <F label="হোল্ডিং / বাসা / বাড়ির ধরন" req>
              <div className="input">
                <select value={f.houseType} onChange={set('houseType')}>
                  <option value="">বাড়ি/বাসার ধরন সিলেক্ট করুন</option>
                  {HOUSE_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </F>
          </div>

          <Sec icon={Briefcase}>অর্থনৈতিক ও পেশাগত তথ্য</Sec>
          <div className="form-grid">
            <F label="পেশা" req>{inp('occupation')}</F>
            <F label="বাৎসরিক আয় (টাকা)" req>{inp('annualIncome', { inputMode: 'decimal' })}</F>
          </div>

          <Sec icon={Wallet}>ধার্যকৃত ট্যাক্সের বিবরণ</Sec>
          <div className="form-grid">
            <F label="ধার্যকৃত কর/ট্যাক্সের পরিমাণ (টাকা)" req>{inp('annualTax', { inputMode: 'decimal' })}</F>
          </div>

          <Sec icon={ClipboardList}>অফিসিয়াল তথ্য</Sec>
          <div className="form-grid">
            <F label="জরিপকারীর নাম" req>{inp('surveyorName')}</F>
            <F label="মন্তব্য (যদি থাকে)"><textarea className="textarea" rows={3} value={f.note} onChange={set('note')} /></F>
          </div>
        </div>

        <footer className="dialog-foot">
          <button type="button" className="btn btn-gray" onClick={onClose} disabled={busy}>বাতিল</button>
          <button className="btn btn-solid" disabled={busy}>
            {busy && <Loader2 size={18} className="spin" />} {editing ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
