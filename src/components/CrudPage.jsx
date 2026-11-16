import { useCallback, useEffect, useMemo, useState } from 'react';
import { SquarePen, Trash2, Plus, Search, Loader2 } from 'lucide-react';
import { api } from '../api';
import { Modal, ConfirmModal, SuccessModal } from './Modal';
import { WARD_OPTIONS } from '../config/wards';
import { toAscii, normMobile } from '../utils/digits';

// Config-driven list + add/edit popup + delete confirmation. Notun page = ekta config.
// field.type: text | int | decimal | mobile | ward | textarea

function validate(fields, f) {
  for (const fld of fields) {
    const raw = String(f[fld.key] ?? '').trim();
    if (!raw) {
      if (fld.required) return fld.type === 'ward' ? `${fld.label} নির্বাচন করুন।` : `${fld.label} দিন।`;
      continue;
    }
    const v = toAscii(raw);
    if (fld.type === 'int' && !/^\d+$/.test(v)) return `${fld.label} শুধু সংখ্যায় দিন।`;
    if (fld.type === 'decimal' && (!/^\d+(\.\d{1,2})?$/.test(v) || Number(v) > (fld.max ?? Infinity)))
      return `${fld.label} সঠিকভাবে দিন${fld.max ? ` (০–${fld.max})` : ''}।`;
    if (fld.type === 'mobile' && !normMobile(raw)) return `${fld.label} সঠিক নয় (যেমন: 01712345678)।`;
  }
  return '';
}

function buildBody(fields, f) {
  const body = {};
  for (const { key, type } of fields) {
    const raw = String(f[key] ?? '').trim();
    if (raw === '') body[key] = '';
    else if (type === 'int' || type === 'decimal') body[key] = Number(toAscii(raw));
    else if (type === 'ward') body[key] = Number(raw);
    else if (type === 'mobile') body[key] = normMobile(raw);
    else body[key] = raw;
  }
  return body;
}

export default function CrudPage({ cfg }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [dialog, setDialog] = useState(null);
  const Icon = cfg.icon;
  const colCount = cfg.columns.length + 1;

  const load = useCallback(async () => {
    try {
      const d = await api(cfg.endpoint);
      setItems(d.items);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [cfg.endpoint]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((r) => cfg.searchText(r).toLowerCase().includes(s)) : items;
  }, [items, q, cfg]);

  const close = () => setDialog(null);
  const done = async (message) => { await load(); setDialog({ type: 'success', message }); };

  return (
    <>
      <section className="page-head">
        <h2><Icon size={26} /> {cfg.title}</h2>
        <button className="btn btn-dark" onClick={() => setDialog({ type: 'form' })}>
          <Plus size={18} /> {cfg.addLabel}
        </button>
      </section>

      <section className="panel table-panel">
        <div className="table-tools">
          <div className="input search">
            <Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={cfg.searchPlaceholder} aria-label="খুঁজুন" />
          </div>
          <span className="muted">মোট {items.length.toLocaleString('bn-BD')} টি</span>
        </div>

        {error && <div className="alert">{error}</div>}

        <div className="table-wrap">
          <table className="tbl wide">
            <thead>
              <tr>
                {cfg.columns.map((c) => <th key={c.label}>{c.label}</th>)}
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={colCount} className="cell-msg"><Loader2 size={20} className="spin" /> লোড হচ্ছে…</td></tr>}
              {!loading && shown.length === 0 && <tr><td colSpan={colCount} className="cell-msg">{cfg.emptyText}</td></tr>}
              {shown.map((r) => (
                <tr key={r.id}>
                  {cfg.columns.map((c) => <td key={c.label}>{c.render(r)}</td>)}
                  <td>
                    <div className="row-actions">
                      <button className="act act-blue" title="এডিট" aria-label="এডিট" onClick={() => setDialog({ type: 'form', item: r })}>
                        <SquarePen size={16} />
                      </button>
                      <button className="act act-red" title="ডিলিট" aria-label="ডিলিট" onClick={() => setDialog({ type: 'confirm', item: r })}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {dialog?.type === 'form' && <FormModal cfg={cfg} item={dialog.item} onClose={close} onDone={done} />}
      {dialog?.type === 'confirm' && (
        <ConfirmModal
          tone="danger"
          title={cfg.deleteTitle}
          message={cfg.deleteMessage(dialog.item)}
          confirmLabel="হ্যাঁ, ডিলিট করুন"
          onClose={close}
          onConfirm={async () => {
            await api(`${cfg.endpoint}/${dialog.item.id}`, { method: 'DELETE' });
            await done(cfg.messages.deleted);
          }}
        />
      )}
      {dialog?.type === 'success' && <SuccessModal message={dialog.message} onClose={close} />}
    </>
  );
}

function FormModal({ cfg, item, onClose, onDone }) {
  const editing = !!item;
  const Icon = cfg.icon;
  const [f, setF] = useState(() => Object.fromEntries(cfg.fields.map((x) => [x.key, String(item?.[x.key] ?? '')])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    const msg = validate(cfg.fields, f) || cfg.check?.(buildBody(cfg.fields, f)) || '';
    if (msg) return setError(msg);

    setBusy(true);
    try {
      const body = buildBody(cfg.fields, f);
      if (editing) await api(`${cfg.endpoint}/${item.id}`, { method: 'PUT', body });
      else await api(cfg.endpoint, { method: 'POST', body });
      await onDone(editing ? cfg.messages.updated : cfg.messages.created);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={<span className="title-with-icon"><Icon size={22} /> {editing ? cfg.formTitle.edit : cfg.formTitle.add}</span>}
      onClose={onClose}
      locked={busy}
      width={680}
    >
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {error && <div className="alert" role="alert">{error}</div>}
          <div className="form-grid">
            {cfg.fields.map((fld, i) => (
              <label key={fld.key} className={`field ${fld.span === 2 ? 'span-2' : ''}`}>
                <span>{fld.label}{fld.required && <b className="req"> *</b>}</span>
                {fld.type === 'textarea' ? (
                  <textarea className="textarea" rows={3} value={f[fld.key]} onChange={set(fld.key)} placeholder={fld.placeholder} />
                ) : (
                  <div className="input">
                    {fld.type === 'ward' ? (
                      <select value={f[fld.key]} onChange={set(fld.key)}>
                        <option value="">ওয়ার্ড সিলেক্ট করুন</option>
                        {WARD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input
                        value={f[fld.key]}
                        onChange={set(fld.key)}
                        placeholder={fld.placeholder}
                        autoFocus={i === 0}
                        inputMode={fld.type === 'mobile' ? 'tel' : fld.type === 'int' || fld.type === 'decimal' ? 'decimal' : 'text'}
                        autoComplete="off"
                      />
                    )}
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>
        <footer className="dialog-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>বাতিল</button>
          <button className="btn btn-solid" disabled={busy}>
            {busy && <Loader2 size={18} className="spin" />} {editing ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
