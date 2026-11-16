import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../api';
import { useSite } from '../useSite';
import { WARD_OPTIONS } from '../config/wards';
import { toAscii, normMobile } from '../utils/digits';
import AgriShell from './AgriShell';

const MARITAL = ['বিবাহিত', 'অবিবাহিত', 'বিধবা', 'বিপত্নীক', 'তালাকপ্রাপ্ত'];
const addr = () => ({ village: '', holding: '', wardNo: '', thana: '', union: '', upazila: '', district: '' });
const today = () => new Date().toISOString().slice(0, 10);

function F({ label, req, className = '', children }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}{req && <b className="req"> *</b>}</span>
      {children}
    </label>
  );
}

// ব্যক্তির সনদের আবেদন ফরম (কৃষি, নাগরিক ...): একই ফিল্ড
export default function PersonCertForm({ shellCfg, endpoint, listPath, title }) {
  const navigate = useNavigate();
  const site = useSite();
  const c = site.certificate;
  const [f, setF] = useState({
    applicantName: '', fatherName: '', motherName: '', spouseName: '', birthDate: '', maritalStatus: '',
    mobile: '', nid: '', brn: '', postOffice: '', currentAddress: addr(), permanentAddress: addr(),
  });
  const [same, setSame] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setA = (part, k) => (e) => setF((x) => ({ ...x, [part]: { ...x[part], [k]: e.target.value } }));
  const text = (k, p = {}) => <div className="input"><input value={f[k]} onChange={set(k)} {...p} /></div>;

  const ph = { thana: c.upazila, union: c.unionShort, upazila: c.upazila, district: c.district };
  const addrBlock = (part, disabled) => (
    <div className="agri-grid g4">
      <F label="গ্রাম"><div className="input"><input value={f[part].village} onChange={setA(part, 'village')} disabled={disabled} /></div></F>
      <F label="হোল্ডিং নং"><div className="input"><input value={f[part].holding} onChange={setA(part, 'holding')} disabled={disabled} placeholder="--" /></div></F>
      <F label="ওয়ার্ড নং" req>
        <div className="input">
          <select value={f[part].wardNo} onChange={setA(part, 'wardNo')} disabled={disabled}>
            <option value="">নির্বাচন করুন</option>
            {WARD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </F>
      <F label="থানা"><div className="input"><input value={f[part].thana} onChange={setA(part, 'thana')} disabled={disabled} placeholder={ph.thana} /></div></F>
      <F label="ইউনিয়ন" className="s2"><div className="input"><input value={f[part].union} onChange={setA(part, 'union')} disabled={disabled} placeholder={ph.union} /></div></F>
      <F label="উপজেলা"><div className="input"><input value={f[part].upazila} onChange={setA(part, 'upazila')} disabled={disabled} placeholder={ph.upazila} /></div></F>
      <F label="জেলা"><div className="input"><input value={f[part].district} onChange={setA(part, 'district')} disabled={disabled} placeholder={ph.district} /></div></F>
    </div>
  );

  async function submit(e) {
    e.preventDefault();
    setError('');
    const miss = [['applicantName', 'আবেদনকারীর নাম'], ['fatherName', 'পিতার নাম'], ['motherName', 'মাতার নাম']].find(([k]) => !f[k].trim());
    if (miss) return setError(`${miss[1]} দিন।`);
    if (!f.birthDate) return setError('জন্ম তারিখ দিন।');
    if (!f.maritalStatus) return setError('বৈবাহিক অবস্থা নির্বাচন করুন।');
    if (!normMobile(f.mobile)) return setError('মোবাইল নম্বর সঠিক নয় (যেমন: 01712345678)।');
    const nid = toAscii(f.nid).replace(/[\s-]/g, '');
    if (nid && !/^(\d{10}|\d{13}|\d{17})$/.test(nid)) return setError('NID নম্বর ১০, ১৩ বা ১৭ সংখ্যার হতে হবে।');
    if (!f.currentAddress.wardNo) return setError('বর্তমান ঠিকানার ওয়ার্ড নং নির্বাচন করুন।');
    if (!same && !f.permanentAddress.wardNo) return setError('স্থায়ী ঠিকানার ওয়ার্ড নং নির্বাচন করুন।');

    setBusy(true);
    try {
      const body = { ...f, permanentAddress: same ? f.currentAddress : f.permanentAddress };
      const d = await api(shellCfg.apply, { method: 'POST', body });
      navigate(`${listPath}/${d.item.publicKey}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AgriShell cfg={shellCfg}>
      <form className="agri-card" onSubmit={submit} noValidate>
        <div className="agri-banner">
          <h1>{site.unionName}</h1>
          <p>{[c.upazila, c.district].filter(Boolean).join(', ')}</p>
        </div>

        <div className="agri-body">
          <h2 className="agri-title">{title}</h2>
          {error && <div className="alert" role="alert">{error}</div>}

          <h3 className="agri-sec">ব্যক্তিগত তথ্য</h3>
          <div className="agri-grid g3">
            <F label="আবেদনকারীর নাম" req>{text('applicantName', { autoFocus: true })}</F>
            <F label="পিতার নাম" req>{text('fatherName')}</F>
            <F label="মাতার নাম" req>{text('motherName')}</F>
            <F label="স্বামী/স্ত্রীর নাম">{text('spouseName', { placeholder: 'স্বামী/স্ত্রীর নাম' })}</F>
            <F label="জন্ম তারিখ" req><div className="input"><input type="date" value={f.birthDate} onChange={set('birthDate')} max={today()} /></div></F>
            <F label="বৈবাহিক অবস্থা" req>
              <div className="input">
                <select value={f.maritalStatus} onChange={set('maritalStatus')}>
                  <option value="">নির্বাচন করুন</option>
                  {MARITAL.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </F>
          </div>
          <div className="agri-grid g4">
            <F label="মোবাইল নম্বর" req>{text('mobile', { placeholder: '017xxxxxxxx', inputMode: 'tel' })}</F>
            <F label="ন্যাশনাল আইডি (NID) নম্বর">{text('nid', { inputMode: 'numeric' })}</F>
            <F label="জন্ম নিবন্ধন (BRN) নম্বর">{text('brn', { placeholder: 'জন্ম নিবন্ধন নম্বর', inputMode: 'numeric' })}</F>
            <F label="ডাকঘর">{text('postOffice')}</F>
          </div>

          <h3 className="agri-sec">বর্তমান ঠিকানা</h3>
          {addrBlock('currentAddress', false)}

          <h3 className="agri-sec">স্থায়ী ঠিকানা</h3>
          <label className="agri-same">
            <input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} /> স্থায়ী ঠিকানা বর্তমান ঠিকানার অনুরূপ
          </label>
          {addrBlock('permanentAddress', same)}

          <div className="agri-submit">
            <button className="btn btn-solid big" disabled={busy}>
              {busy && <Loader2 size={18} className="spin" />} আবেদন ও সনদ তৈরি করুন
            </button>
          </div>
        </div>
      </form>
    </AgriShell>
  );
}
