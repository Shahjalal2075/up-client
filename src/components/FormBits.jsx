import { useRef, useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus, Upload, ImageIcon, Loader2 } from 'lucide-react';
import { api } from '../api';
import { resizeToDataUrl } from '../utils/image';
import { defaultLogo } from '../utils/logo';
import { Ico, ICON_OPTIONS } from '../config/icons';

// Settings form-er chhoto chhoto ongsho. onChange shobsomoy value (string/array) pay, event na.

export function TextField({ label, value, onChange, hint, placeholder, multiline, rows = 3, className = '', inputMode }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea className="textarea" rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="input">
          <input value={value ?? ''} placeholder={placeholder} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
        </div>
      )}
      {hint && <small className="hint">{hint}</small>}
    </label>
  );
}

export function IconSelect({ label = 'আইকন', value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input icon-select">
        <Ico name={value} size={18} />
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {ICON_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
    </label>
  );
}

function RowControls({ i, n, move, remove }) {
  return (
    <div className="row-ctl">
      <button type="button" className="act act-gray" onClick={() => move(i, -1)} disabled={i === 0} aria-label="উপরে নিন"><ChevronUp size={16} /></button>
      <button type="button" className="act act-gray" onClick={() => move(i, 1)} disabled={i === n - 1} aria-label="নিচে নিন"><ChevronDown size={16} /></button>
      <button type="button" className="act act-red" onClick={() => remove(i)} aria-label="মুছুন"><Trash2 size={16} /></button>
    </div>
  );
}

const mover = (items, onChange) => (i, d) => {
  const j = i + d;
  if (j < 0 || j >= items.length) return;
  const a = [...items];
  [a[i], a[j]] = [a[j], a[i]];
  onChange(a);
};

// Text-er list (jemon notice, shuvechchha bani-r onucchhed)
export function StringList({ label, hint, items, onChange, addLabel, placeholder, multiline, max = 10 }) {
  const move = mover(items, onChange);
  const remove = (i) => onChange(items.filter((_, j) => j !== i));
  return (
    <div className="olist">
      <div className="olist-head"><strong>{label}</strong>{hint && <small>{hint}</small>}</div>
      {items.map((v, i) => (
        <div className="sitem" key={i}>
          {multiline ? (
            <textarea className="textarea" rows={3} value={v} placeholder={placeholder} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          ) : (
            <div className="input"><input value={v} placeholder={placeholder} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} /></div>
          )}
          <RowControls i={i} n={items.length} move={move} remove={remove} />
        </div>
      ))}
      {items.length === 0 && <p className="olist-empty">কিছু যোগ করা নেই।</p>}
      {items.length < max && (
        <button type="button" className="btn btn-ghost add" onClick={() => onChange([...items, ''])}><Plus size={16} /> {addLabel}</button>
      )}
    </div>
  );
}

// Object-er list (jemon সেবা card, অফিস). children(item, bind, index) -> fields
export function ObjectList({ label, hint, items, onChange, blank, addLabel, title, max = 20, children }) {
  const move = mover(items, onChange);
  const remove = (i) => onChange(items.filter((_, j) => j !== i));
  const bind = (i) => (key) => (v) => onChange(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)));
  return (
    <div className="olist">
      <div className="olist-head"><strong>{label}</strong>{hint && <small>{hint}</small>}</div>
      {items.map((it, i) => (
        <div className="oitem" key={i}>
          <div className="oitem-bar">
            <span>{title ? title(it, i) : `#${i + 1}`}</span>
            <RowControls i={i} n={items.length} move={move} remove={remove} />
          </div>
          <div className="oitem-fields">{children(it, bind(i), i)}</div>
        </div>
      ))}
      {items.length === 0 && <p className="olist-empty">কিছু যোগ করা নেই।</p>}
      {items.length < max && (
        <button type="button" className="btn btn-ghost add" onClick={() => onChange([...items, blank()])}><Plus size={16} /> {addLabel}</button>
      )}
    </div>
  );
}

// ছবি আপলোড (ImgBB, server-er maddhome) + link boshanor option
export function ImageField({ label, value, onChange, hint }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [broken, setBroken] = useState(false);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr('');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setErr('শুধু JPG, PNG বা WebP ছবি দেওয়া যাবে।');
    if (file.size > 10 * 1024 * 1024) return setErr('ছবি ১০ MB-এর বেশি হতে পারবে না।');
    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      const d = await api('/settings/upload-image', { method: 'POST', body: { dataUrl } });
      setBroken(false);
      onChange(d.url);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="imgfield">
      <span className="imgfield-label">{label}</span>
      <div className="imgfield-row">
        <div className="imgfield-prev">
          {value && !broken ? <img src={value} alt="প্রিভিউ" onError={() => setBroken(true)} /> : <ImageIcon size={34} strokeWidth={1.4} />}
        </div>
        <div className="imgfield-ctl">
          <div className="imgfield-btns">
            <button type="button" className="btn btn-solid" onClick={() => input.current.click()} disabled={busy}>
              {busy ? <><Loader2 size={17} className="spin" /> আপলোড হচ্ছে…</> : <><Upload size={17} /> ছবি আপলোড করুন</>}
            </button>
            {value && <button type="button" className="btn btn-ghost" onClick={() => { setBroken(false); onChange(''); }} disabled={busy}><Trash2 size={16} /> ছবি সরান</button>}
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
          </div>
          <TextField label="অথবা ছবির লিংক বসান" value={value} onChange={(v) => { setBroken(false); onChange(v); }} placeholder="https://i.ibb.co/…" />
        </div>
      </div>
      {hint && <small className="hint">{hint}</small>}
      {err && <div className="alert" role="alert">{err}</div>}
    </div>
  );
}

// সাইটের লোগো আপলোড (ছোট করে নিজের ডাটাবেসেই থাকে; সনদ/প্লেট/হোমপেজ/লগইন সবখানে এটাই)
export function LogoField({ value, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr('');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setErr('শুধু JPG, PNG বা WebP ছবি দেওয়া যাবে।');
    setBusy(true);
    try {
      onChange(await resizeToDataUrl(file, 400, 180_000));
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="imgfield">
      <span className="imgfield-label">সাইটের লোগো</span>
      <div className="imgfield-row">
        <div className="imgfield-prev logo-prev"><img src={value || defaultLogo} alt="লোগো" /></div>
        <div className="imgfield-ctl">
          <div className="imgfield-btns">
            <button type="button" className="btn btn-solid" onClick={() => input.current.click()} disabled={busy}>
              {busy ? <><Loader2 size={17} className="spin" /> আপলোড হচ্ছে…</> : <><Upload size={17} /> লোগো আপলোড করুন</>}
            </button>
            {value && <button type="button" className="btn btn-ghost" onClick={() => onChange('')}><Trash2 size={16} /> ডিফল্ট লোগো</button>}
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
          </div>
          <small className="hint">হোমপেজ, লগইন, সাইডবার, সনদ, হোল্ডিং সনদ ও নম্বর প্লেট — সবখানে এই লোগো বসবে। আপলোডের পর নিচে “সংরক্ষণ করুন” চাপুন।</small>
        </div>
      </div>
      {err && <div className="alert" role="alert">{err}</div>}
    </div>
  );
}
