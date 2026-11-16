import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, ImagePlus, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { useSite } from '../../useSite';
import { toAscii, normMobile } from '../../utils/digits';
import { resizeToDataUrl } from '../../utils/image';
import AgriShell, { TRADE_CFG, TRADE_PATH } from '../../components/AgriShell';

const iso = (d) => d.toLocaleDateString('en-CA');
function initial() {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() + 1 >= 7 ? y : y - 1; // অর্থ বছর জুলাই–জুন
  return {
    licenseNo: '', businessName: '', ownerName: '', fatherName: '', motherName: '', mobile: '', nid: '', brn: '', taxId: '',
    businessAddress: '', businessType: '', capital: '',
    issueDate: iso(now), renewalDate: '', expiryDate: `${start + 1}-06-30`, fiscalYear: `${start}-${start + 1}`,
    licenseFee: '0', vat: '0', professionTax: '0', adTax: '0', arrears: '0', serviceCharge: '0',
  };
}

function F({ label, req, className = '', hint, children }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}{req && <b className="req"> *</b>}</span>
      {children}
      {hint && <small className="hint">{hint}</small>}
    </label>
  );
}

export default function TradeNew() {
  const navigate = useNavigate();
  const site = useSite();
  const photoInput = useRef(null);
  const [f, setF] = useState(initial);
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const inp = (k, p = {}) => <div className="input"><input value={f[k]} onChange={set(k)} {...p} /></div>;
  const date = (k) => <div className="input"><input type="date" value={f[k]} onChange={set(k)} /></div>;
  const fee = (k) => <div className="input"><input value={f[k]} onChange={set(k)} inputMode="decimal" /></div>;
  const total = ['licenseFee', 'vat', 'professionTax', 'adTax', 'arrears', 'serviceCharge']
    .reduce((s, k) => s + (Number(toAscii(f[k]).replace(/,/g, '')) || 0), 0);

  async function pickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('শুধু JPG, PNG বা WebP ছবি দেওয়া যাবে।');
    try {
      setPhoto(await resizeToDataUrl(file, 400, 150_000));
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    const miss = [['businessName', 'ব্যবসা প্রতিষ্ঠানের নাম'], ['ownerName', 'মালিকের নাম'], ['fatherName', 'পিতা/স্বামীর নাম'], ['motherName', 'মাতার নাম'],
      ['businessAddress', 'ব্যবসা প্রতিষ্ঠানের ঠিকানা'], ['businessType', 'ব্যবসার ধরন']].find(([k]) => !f[k].trim());
    if (miss) return setError(`${miss[1]} দিন।`);
    if (!normMobile(f.mobile)) return setError('মোবাইল নম্বর সঠিক নয় (যেমন: 01712345678)।');
    const nid = toAscii(f.nid).replace(/[\s-]/g, '');
    if (nid && !/^(\d{10}|\d{13}|\d{17})$/.test(nid)) return setError('NID নম্বর ১০, ১৩ বা ১৭ সংখ্যার হতে হবে।');
    const badFee = ['licenseFee', 'vat', 'professionTax', 'adTax', 'arrears', 'serviceCharge'].find((k) => {
      const v = toAscii(f[k]).replace(/,/g, '');
      return v && !/^\d+(\.\d{1,2})?$/.test(v);
    });
    if (badFee) return setError('ফি ও করের ঘরে শুধু সংখ্যা দিন (যেমন: 200 বা 30.50)।');

    setBusy(true);
    try {
      const d = await api(TRADE_CFG.apply, { method: 'POST', body: { ...f, photo } });
      navigate(`${TRADE_PATH}/${d.item.publicKey}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const c = site.certificate;
  return (
    <AgriShell cfg={TRADE_CFG}>
      <form className="agri-card" onSubmit={submit} noValidate>
        <div className="agri-banner">
          <h1>{site.unionName}</h1>
          <p>{[c.upazila, c.district].filter(Boolean).join(', ')}</p>
        </div>

        <div className="agri-body">
          <h2 className="agri-title">নতুন ট্রেড লাইসেন্স এন্ট্রি ফরম</h2>
          {error && <div className="alert" role="alert">{error}</div>}

          <h3 className="agri-sec">ব্যবসায়িক ও মালিকের তথ্য</h3>
          <div className="agri-grid g3">
            <F label="ট্রেড লাইসেন্স নম্বর (ফাঁকা রাখলে অটো জেনারেট হবে)">{inp('licenseNo', { placeholder: 'যেমন: 030000538' })}</F>
            <F label="ব্যবসা প্রতিষ্ঠানের নাম" req>{inp('businessName', { autoFocus: true })}</F>
            <F label="মালিকের নাম" req>{inp('ownerName')}</F>
            <F label="পিতা/স্বামীর নাম" req>{inp('fatherName')}</F>
            <F label="মাতার নাম" req>{inp('motherName')}</F>
            <F label="মোবাইল" req>{inp('mobile', { placeholder: '017xxxxxxxx', inputMode: 'tel' })}</F>
            <F label="ন্যাশনাল আইডি নম্বর">{inp('nid', { inputMode: 'numeric' })}</F>
            <F label="জন্ম নিবন্ধন নম্বর">{inp('brn')}</F>
            <F label="ট্যাক্স আইডি">{inp('taxId')}</F>
          </div>
          <div className="agri-grid g3 wide-first">
            <F label="ব্যবসা প্রতিষ্ঠানের ঠিকানা" req className="s2">{inp('businessAddress', { placeholder: `গ্রাম: …, ডাকঘর: …, উপজেলা: ${c.upazila}, জেলা: ${c.district}` })}</F>
            <F label="ব্যবসার ধরন" req>{inp('businessType', { placeholder: 'যেমন: জুয়েলারী ব্যবসা' })}</F>
            <F label="মূলধন">{inp('capital')}</F>
          </div>

          <h3 className="agri-sec">তারিখ ও মেয়াদ সংক্রান্ত তথ্য</h3>
          <div className="agri-grid g4">
            <F label="ইস্যুর তারিখ">{date('issueDate')}</F>
            <F label="নবায়ন তারিখ" hint="নবায়ন হলে দিন; তখন সনদে “(নবায়নকৃত)” লেখা হবে।">{date('renewalDate')}</F>
            <F label="মেয়াদ উত্তীর্ণ তারিখ">{date('expiryDate')}</F>
            <F label="অর্থ বছর">{inp('fiscalYear', { placeholder: '২০২৬-২০২৭' })}</F>
          </div>

          <h3 className="agri-sec">ফি ও করের তথ্য (টাকা)</h3>
          <div className="agri-grid g6">
            <F label="লাইসেন্স ফি">{fee('licenseFee')}</F>
            <F label="১৫% ভ্যাট">{fee('vat')}</F>
            <F label="পেশা কর">{fee('professionTax')}</F>
            <F label="বিজ্ঞাপন কর">{fee('adTax')}</F>
            <F label="বকেয়া">{fee('arrears')}</F>
            <F label="সার্ভিস চার্জ">{fee('serviceCharge')}</F>
          </div>
          <p className="muted" style={{ margin: '0 0 10px' }}>সর্বমোট: <b>{total.toFixed(2)}/-</b></p>

          <div className="field">
            <span>মালিকের ছবি</span>
            <div className="photo-pick">
              <div className="photo-box">{photo ? <img src={photo} alt="প্রিভিউ" /> : <ImagePlus size={28} strokeWidth={1.4} />}</div>
              <div>
                <button type="button" className="btn btn-ghost" onClick={() => photoInput.current.click()}><ImagePlus size={17} /> ছবি বাছাই করুন</button>
                {photo && <button type="button" className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={() => setPhoto('')}><Trash2 size={16} /> সরান</button>}
                <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickPhoto} />
                <small className="hint">ছবি নিজের ডাটাবেসেই সংরক্ষিত হয় (ছোট করে), বাইরের কোনো সাইটে যায় না।</small>
              </div>
            </div>
          </div>

          <div className="agri-submit">
            <button className="btn btn-solid big" disabled={busy}>
              {busy ? <Loader2 size={18} className="spin" /> : <Save size={18} />} সংরক্ষণ ও প্রিন্ট ভিউ দেখুন
            </button>
          </div>
        </div>
      </form>
    </AgriShell>
  );
}
