import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Printer, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { fmtDate } from '../utils/digits';
import { ConfirmModal, SuccessModal } from './Modal';

// সনদ তালিকা (২০ টি করে, সার্চ, প্রিন্ট, ডিলিট). cfg: title, icon, path, endpoint, placeholder, columns, delete*
export default function CertList({ cfg }) {
  const Icon = cfg.icon;
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const cols = cfg.columns.length + 2 + (cfg.hideId ? 0 : 1) + (cfg.hideDate ? 0 : 1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`${cfg.endpoint}?page=${page}&q=${encodeURIComponent(q)}`));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [cfg.endpoint, page, q]);
  useEffect(() => { load(); }, [load]);

  const submit = (e) => { e.preventDefault(); setPage(1); setQ(input.trim()); };
  const close = () => setDialog(null);

  const nums = [];
  for (let n = Math.max(1, data.page - 2); n <= Math.min(data.pages, data.page + 2); n++) nums.push(n);

  return (
    <>
      <section className="page-head">
        <h2><Icon size={26} /> {cfg.title}</h2>
        <Link className="btn btn-dark" to={`${cfg.path}/new`}><Plus size={18} /> {cfg.newLabel || `নতুন আবেদন ${cfg.newSuffix ?? 'করুন'}`}</Link>
      </section>

      <section className="panel table-panel">
        <form className="table-tools" onSubmit={submit}>
          <div className="input search wide">
            <Search size={18} />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={cfg.placeholder} aria-label="খুঁজুন" />
          </div>
          <button className="btn btn-solid" style={{ height: 42 }}><Search size={16} /> {cfg.searchLabel || 'সার্চ'}</button>
          {q && <button type="button" className="btn btn-ghost" style={{ height: 42 }} onClick={() => { setInput(''); setQ(''); setPage(1); }}>সব দেখুন</button>}
          <span className="muted push">মোট {data.total.toLocaleString('bn-BD')} টি</span>
        </form>

        {error && <div className="alert">{error}</div>}

        <div className="table-wrap">
          <table className="tbl wide">
            <thead>
              <tr>
                {!cfg.hideId && <th>{cfg.idLabel || 'ID'}</th>}<th>সনদ নম্বর</th>
                {cfg.columns.map((c) => <th key={c.label}>{c.label}</th>)}
                {!cfg.hideDate && <th>{cfg.dateLabel || 'তারিখ'}</th>}<th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={cols} className="cell-msg"><Loader2 size={20} className="spin" /> লোড হচ্ছে…</td></tr>}
              {!loading && data.items.length === 0 && <tr><td colSpan={cols} className="cell-msg">কিছু পাওয়া যায়নি।</td></tr>}
              {!loading && data.items.map((r) => (
                <tr key={r.id}>
                  {!cfg.hideId && <td className="muted">{r.id}</td>}
                  <td><Link className="cert-link" to={`${cfg.path}/${r.publicKey}`}>{r.certNo}</Link></td>
                  {cfg.columns.map((c) => <td key={c.label}>{c.render(r) || '—'}</td>)}
                  {!cfg.hideDate && <td>{fmtDate(r.createdAt)}</td>}
                  <td>
                    <div className="row-actions">
                      <Link className="act act-teal" to={`${cfg.path}/${r.publicKey}?print=1`} title="প্রিন্ট" aria-label="প্রিন্ট"><Printer size={16} />{cfg.printLabel && <span className="act-label">{cfg.printLabel}</span>}</Link>
                      <button className="act act-red" title="ডিলিট" aria-label="ডিলিট" onClick={() => setDialog({ type: 'confirm', item: r })}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.pages > 1 && (
          <nav className="pager" aria-label="পেজ">
            <button className="pg" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)} aria-label="আগের"><ChevronLeft size={17} /></button>
            {nums[0] > 1 && <><button className="pg" onClick={() => setPage(1)}>১</button><span className="muted">…</span></>}
            {nums.map((n) => <button key={n} className={`pg ${n === data.page ? 'on' : ''}`} onClick={() => setPage(n)}>{n.toLocaleString('bn-BD')}</button>)}
            {nums[nums.length - 1] < data.pages && <><span className="muted">…</span><button className="pg" onClick={() => setPage(data.pages)}>{data.pages.toLocaleString('bn-BD')}</button></>}
            <button className="pg" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)} aria-label="পরের"><ChevronRight size={17} /></button>
          </nav>
        )}
      </section>

      {dialog?.type === 'confirm' && (
        <ConfirmModal
          tone="danger"
          title={cfg.deleteTitle}
          message={cfg.deleteMessage(dialog.item)}
          confirmLabel="হ্যাঁ, ডিলিট করুন"
          onClose={close}
          onConfirm={async () => {
            await api(`${cfg.endpoint}/${dialog.item.id}`, { method: 'DELETE' });
            await load();
            setDialog({ type: 'success', message: cfg.deleteSuccess });
          }}
        />
      )}
      {dialog?.type === 'success' && <SuccessModal message={dialog.message} onClose={close} />}
    </>
  );
}
