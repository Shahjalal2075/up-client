import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { useSite } from '../../useSite';
import { WARD_OPTIONS } from '../../config/wards';
import { toAscii } from '../../utils/digits';
import AgriShell, { WARISH_CFG, WARISH_PATH } from '../../components/AgriShell';

const blankHeir = () => ({ name: '', relation: '', ageOrDob: '', nid: '', note: '' });
const today = () => new Date().toISOString().slice(0, 10);
const MAX = 30;

function F({ label, req, className = '', children }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}{req && <b className="req"> *</b>}</span>
      {children}
    </label>
  );
}

export default function WarishNew() {
  const navigate = useNavigate();
  const site = useSite();
  const c = site.certificate;
  const [f, setF] = useState({
    deceasedName: '', fatherName: '', motherName: '', deceasedNid: '', deathDate: '', deathRegNo: '',
    village: '', postOffice: '', wardNo: '', upazila: '', district: '', applicantName: '', applicantRelation: '',
  });
  const [heirs, setHeirs] = useState([blankHeir()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const inp = (k, p = {}) => <div className="input"><input value={f[k]} onChange={set(k)} {...p} /></div>;
  const setHeir = (i, k) => (e) => setHeirs((h) => h.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)));

  async function submit(e) {
    e.preventDefault();
    setError('');
    const miss = [['deceasedName', 'মৃত ব্যক্তির নাম'], ['fatherName', 'পিতা/স্বামীর নাম'], ['motherName', 'মাতার নাম'], ['applicantName', 'আবেদনকারীর নাম']].find(([k]) => !f[k].trim());
    if (miss) return setError(`${miss[1]} দিন।`);
    if (!f.wardNo) return setError('ওয়ার্ড নং নির্বাচন করুন।');
    const nidOk = (v) => { const s = toAscii(v).replace(/[\s-]/g, ''); return !s || /^\d{10,20}$/.test(s); };
    if (!nidOk(f.deceasedNid)) return setError('মৃতের NID/BRN সঠিক নয় (১০–২০ সংখ্যা)।');

    const list = heirs.filter((h) => Object.values(h).some((v) => v.trim()));
    if (list.length === 0) return setError('কমপক্ষে একজন ওয়ারিশের তথ্য দিন।');
    const bad = list.findIndex((h) => !h.name.trim() || !h.relation.trim());
    if (bad >= 0) return setError(`ওয়ারিশ #${bad + 1}: নাম ও সম্পর্ক দিন।`);
    const badNid = list.findIndex((h) => !nidOk(h.nid));
    if (badNid >= 0) return setError(`ওয়ারিশ #${badNid + 1}: NID/BRN সঠিক নয় (১০–২০ সংখ্যা)।`);

    setBusy(true);
    try {
      const d = await api(WARISH_CFG.apply, { method: 'POST', body: { ...f, heirs: list } });
      navigate(`${WARISH_PATH}/${d.item.publicKey}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AgriShell cfg={WARISH_CFG}>
      <form className="agri-card" onSubmit={submit} noValidate>
        <div className="agri-banner">
          <h1>{site.unionName}</h1>
          <p>{[c.upazila, c.district].filter(Boolean).join(', ')}</p>
        </div>

        <div className="agri-body">
          <h2 className="agri-title">ওয়ারিশ সনদের আবেদন ফরম</h2>
          {error && <div className="alert" role="alert">{error}</div>}

          <h3 className="agri-sec">মৃত ব্যক্তির তথ্য</h3>
          <div className="agri-grid g3">
            <F label="মৃত ব্যক্তির নাম" req>{inp('deceasedName', { autoFocus: true })}</F>
            <F label="পিতা/স্বামীর নাম" req>{inp('fatherName')}</F>
            <F label="মাতার নাম" req>{inp('motherName')}</F>
            <F label="ন্যাশনাল আইডি/জন্ম নিবন্ধন">{inp('deceasedNid', { placeholder: 'NID বা BRN', inputMode: 'numeric' })}</F>
            <F label="মৃত্যু তারিখ"><div className="input"><input type="date" value={f.deathDate} onChange={set('deathDate')} max={today()} /></div></F>
            <F label="মৃত্যু নিবন্ধন নম্বর">{inp('deathRegNo', { placeholder: 'মৃত্যু নিবন্ধন নম্বর' })}</F>
          </div>

          <h3 className="agri-sec">ঠিকানা ও আবেদনকারীর তথ্য</h3>
          <div className="agri-grid g4">
            <F label="গ্রাম">{inp('village')}</F>
            <F label="ডাকঘর">{inp('postOffice')}</F>
            <F label="ওয়ার্ড নং" req>
              <div className="input">
                <select value={f.wardNo} onChange={set('wardNo')}>
                  <option value="">নির্বাচন করুন</option>
                  {WARD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </F>
            <F label="উপজেলা">{inp('upazila', { placeholder: c.upazila })}</F>
            <F label="জেলা">{inp('district', { placeholder: c.district })}</F>
          </div>
          <div className="agri-grid g2">
            <F label="আবেদনকারীর নাম" req>{inp('applicantName')}</F>
            <F label="মৃতের সাথে আবেদনকারীর সম্পর্ক">{inp('applicantRelation', { placeholder: 'যেমন: পুত্র' })}</F>
          </div>

          <div className="agri-sec flex">
            <span>ওয়ারিশগণের তালিকা</span>
            <button type="button" className="btn btn-solid sm" onClick={() => setHeirs((h) => [...h, blankHeir()])} disabled={heirs.length >= MAX}>
              <Plus size={16} /> নতুন ওয়ারিশ যোগ করুন
            </button>
          </div>
          <div className="table-wrap heirs">
            <table className="tbl heir-tbl">
              <thead>
                <tr><th>ওয়ারিশের নাম</th><th>সম্পর্ক</th><th>বয়স / জন্মতারিখ</th><th>NID / BRN নম্বর</th><th>মন্তব্য</th><th>#</th></tr>
              </thead>
              <tbody>
                {heirs.map((h, i) => (
                  <tr key={i}>
                    <td><div className="input"><input value={h.name} onChange={setHeir(i, 'name')} aria-label={`ওয়ারিশ ${i + 1} নাম`} /></div></td>
                    <td><div className="input"><input value={h.relation} onChange={setHeir(i, 'relation')} placeholder="পুত্র" aria-label="সম্পর্ক" /></div></td>
                    <td><div className="input"><input value={h.ageOrDob} onChange={setHeir(i, 'ageOrDob')} placeholder="বয়স বা ১০/০৪/১৯৫৯" aria-label="বয়স" /></div></td>
                    <td><div className="input"><input value={h.nid} onChange={setHeir(i, 'nid')} inputMode="numeric" aria-label="NID" /></div></td>
                    <td><div className="input"><input value={h.note} onChange={setHeir(i, 'note')} placeholder="-" aria-label="মন্তব্য" /></div></td>
                    <td>
                      <button type="button" className="act act-red" disabled={heirs.length === 1} onClick={() => setHeirs((x) => x.filter((_, j) => j !== i))} aria-label="মুছুন"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="agri-submit">
            <button className="btn btn-solid big" disabled={busy}>
              {busy && <Loader2 size={18} className="spin" />} আবেদন ও ওয়ারিশ সনদ তৈরি করুন
            </button>
          </div>
        </div>
      </form>
    </AgriShell>
  );
}
