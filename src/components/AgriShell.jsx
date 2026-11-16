import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { FULL_ROLES } from '../config/menu';

export const AGRI_PATH = '/admin/agriculture-certificates';
export const WARISH_PATH = '/admin/warish-certificates';
export const CITIZEN_PATH = '/admin/citizen-certificates';
export const TRADE_PATH = '/admin/trade-licenses';
export const HOLDING_PATH = '/admin/holdings';

// কোন সনদের সার্চ বার: label/placeholder/endpoint আলাদা
export const AGRI_CFG = {
  listPath: AGRI_PATH, endpoint: '/agri-certificates', apply: '/apply/agri', publicPlaceholder: 'প্রত্যয়নপত্র নং', noun: 'কৃষি প্রত্যয়নপত্র',
  label: 'আগের কৃষি প্রত্যয়নপত্র অনুসন্ধান ও প্রিন্ট:', placeholder: 'প্রত্যয়নপত্র নং / NID / মোবাইল নম্বর',
};
export const CITIZEN_CFG = {
  listPath: CITIZEN_PATH, endpoint: '/citizen-certificates', apply: '/apply/citizen', publicPlaceholder: 'সনদপত্র নং দিন', noun: 'নাগরিক সনদপত্র',
  label: 'আগের আবেদন অনুসন্ধান ও প্রিন্ট:', placeholder: 'সনদপত্র নং / NID / মোবাইল নম্বর দিন',
};
export const TRADE_CFG = { listPath: TRADE_PATH, apply: '/apply/trade', noSearch: true }; // ট্রেড লাইসেন্সে সার্চ বার নেই
export const HOLDING_CFG = { listPath: HOLDING_PATH, noSearch: true, requireAuth: true }; // শুধু লগইন করা কর্মী
export const HOLDING_PUBLIC_CFG = { listPath: HOLDING_PATH, noSearch: true }; // QR স্ক্যান: সবার জন্য
export const WARISH_CFG = {
  listPath: WARISH_PATH, endpoint: '/warish-certificates', apply: '/apply/warish', publicPlaceholder: 'ওয়ারিশ সনদ নং', noun: 'ওয়ারিশ সনদপত্র',
  label: 'ওয়ারিশ সনদপত্র অনুসন্ধান:', placeholder: 'সনদ নং / মৃতের NID / ওয়ারিশের NID',
};

// আবেদন ও সনদ পেজের কমন ফ্রেম: উপরে "আগের প্রত্যয়নপত্র অনুসন্ধান ও প্রিন্ট" সার্চ বার
export default function AgriShell({ children, cfg = AGRI_CFG }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const staff = !!user && FULL_ROLES.includes(user.role); // অ্যাডমিন হলে তালিকা/NID-মোবাইল সার্চ, নইলে শুধু সনদ নম্বর
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function search(e) {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    setBusy(true);
    setMsg('');
    try {
      const d = await api(`${staff ? cfg.endpoint : cfg.apply}/lookup?q=${encodeURIComponent(v)}`);
      setQ('');
      navigate(`${cfg.listPath}/${d.item.publicKey}`);
    } catch (err) {
      setMsg(err.status === 404 ? `দুঃখিত! ${v} দিয়ে কোনো ${cfg.noun} পাওয়া যায়নি।` : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="agri-page">
      <div className="agri-top no-print">
        <Link to={staff || cfg.requireAuth ? cfg.listPath : '/'} className="agri-back"><ArrowLeft size={17} /> {staff || cfg.requireAuth ? 'তালিকায় ফিরুন' : 'হোমপেজে ফিরুন'}</Link>
        {!cfg.noSearch && (
        <form className="agri-search" onSubmit={search}>
          <strong>{cfg.label}</strong>
          <div className="input">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={staff ? cfg.placeholder : cfg.publicPlaceholder} aria-label="খুঁজুন" />
          </div>
          <button className="btn btn-solid" disabled={busy || !q.trim()}>
            {busy ? <Loader2 size={17} className="spin" /> : <Search size={17} />} খুঁজুন
          </button>
        </form>
        )}
        {msg && <div className="alert agri-msg" role="alert">{msg}</div>}
      </div>
      {children}
    </div>
  );
}
