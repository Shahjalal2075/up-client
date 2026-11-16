import { useEffect, useState } from 'react';
import { CreditCard, Loader2, Save } from 'lucide-react';
import { api } from '../../api';
import { TextField, ObjectList } from '../../components/FormBits';
import { SuccessModal } from '../../components/Modal';

// প্রতি ডাটার চার্জ (মডারেটর দেয়), প্রতি ডাটায় মডারেটরের আয়, উত্তোলন চালু/বন্ধ, বিকাশ/নগদ নম্বর
export default function PaymentSettings() {
  const [fee, setFee] = useState('');
  const [reward, setReward] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [entryOn, setEntryOn] = useState(true);   // মডারেটরের ডাটা এন্ট্রি চালু?
  const [enforce, setEnforce] = useState(true);   // আগের দিনের পেমেন্ট বাধ্যতামূলক?
  const [accounts, setAccounts] = useState(null);
  const [init, setInit] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const apply = (c) => {
    setFee(String(c.entryFee)); setReward(String(c.rewardPerEntry)); setEnabled(!!c.withdrawEnabled); setEntryOn(c.entryEnabled !== false); setEnforce(c.paymentEnforced !== false); setAccounts(c.accounts);
    setInit(JSON.stringify([String(c.entryFee), String(c.rewardPerEntry), !!c.withdrawEnabled, c.accounts, c.entryEnabled !== false, c.paymentEnforced !== false]));
  };
  useEffect(() => { api('/payments/config').then(apply).catch((e) => setError(e.message)); }, []);

  const dirty = accounts && JSON.stringify([fee, reward, enabled, accounts, entryOn, enforce]) !== init;

  async function save() {
    setBusy(true);
    setError('');
    try {
      apply(await api('/payments/config', { method: 'PUT', body: { entryFee: fee, rewardPerEntry: reward, withdrawEnabled: enabled, entryEnabled: entryOn, paymentEnforced: enforce, accounts } }));
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!accounts) {
    return <section className="panel empty">{error ? <div className="alert">{error}</div> : <><Loader2 size={26} className="spin" /><p>লোড হচ্ছে…</p></>}</section>;
  }

  return (
    <>
      <section className="page-head"><h2><CreditCard size={26} /> পেমেন্ট সেটিংস</h2></section>

      <section className="panel settings-panel">
        <h3 className="sec-title">ডাটা এন্ট্রি নিয়ন্ত্রণ (মডারেটর)</h3>
        <div className="ctl-list">
          <label className={`toggle big ${entryOn ? 'on' : ''}`}>
            <input type="checkbox" checked={entryOn} onChange={(e) => setEntryOn(e.target.checked)} />
            <i />
            <span><b>ডাটা এন্ট্রি চালু</b>
              <small>{entryOn ? 'চালু — মডারেটর হোল্ডিং যোগ করতে পারবে।' : 'বন্ধ — কোনো মডারেটরই ডাটা যোগ করতে পারবে না। শুধু Admin ও Super Admin পারবে।'}</small></span>
          </label>
          <label className={`toggle big ${enforce ? 'on' : ''}`}>
            <input type="checkbox" checked={enforce} onChange={(e) => setEnforce(e.target.checked)} />
            <i />
            <span><b>আগের দিনের পেমেন্ট বাধ্যতামূলক</b>
              <small>{enforce ? 'চালু — আগের দিনের পেমেন্ট অনুমোদিত না হলে মডারেটর নতুন ডাটা যোগ করতে পারবে না।' : 'বন্ধ — পেমেন্ট হয়েছে কি না কোনো চেক ছাড়াই মডারেটর সবসময় ডাটা যোগ করতে পারবে।'}</small></span>
          </label>
        </div>

        <h3 className="sec-title">প্রতিটি ডাটা এন্ট্রির চার্জ (মডারেটর ইউনিয়নকে দেয়)</h3>
        <div className="form-grid">
          <TextField label="প্রতি হোল্ডিং এন্ট্রিতে মডারেটর কত টাকা দেবে (টাকা)" value={fee} onChange={setFee} inputMode="decimal"
            hint="চার্জ বদলালে শুধু এরপর থেকে করা নতুন এন্ট্রির জন্য প্রযোজ্য হবে; আগের এন্ট্রির হিসাব বদলাবে না।" />
        </div>

        <h3 className="sec-title">মডারেটরের আয় ও উত্তোলন (মডারেটর ইউনিয়ন থেকে পায়)</h3>
        <div className="form-grid">
          <TextField label="প্রতি হোল্ডিং এন্ট্রিতে মডারেটর কত পাবে (টাকা)" value={reward} onChange={setReward} inputMode="decimal"
            hint="বদলালে শুধু নতুন এন্ট্রির জন্য প্রযোজ্য; আগের এন্ট্রির আয় বদলাবে না।" />
          <label className="field"><span>উত্তোলন (Withdraw)</span>
            <label className={`toggle ${enabled ? 'on' : ''}`}>
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <i /> <b>{enabled ? 'চালু — মডারেটর টাকা তুলতে পারবে' : 'বন্ধ — মডারেটর টাকা তুলতে পারবে না'}</b>
            </label>
          </label>
        </div>

        <h3 className="sec-title">যে নম্বরে মডারেটর টাকা পাঠাবে (পেমেন্ট জমার জন্য)</h3>
        <ObjectList
          label="বিকাশ / নগদ নম্বর" hint="“সক্রিয়” নম্বরগুলোই মডারেটর Pay Now-তে দেখবে।"
          items={accounts} onChange={setAccounts} blank={() => ({ method: 'bkash', number: '', label: '', active: true })}
          addLabel="নতুন নম্বর যোগ করুন" max={10}
          title={(a) => `${a.method === 'nagad' ? 'নগদ' : 'বিকাশ'} ${a.number || ''}`}
        >
          {(it, b) => (
            <div className="form-grid">
              <label className="field"><span>মাধ্যম</span>
                <div className="input"><select value={it.method} onChange={(e) => b('method')(e.target.value)}><option value="bkash">বিকাশ</option><option value="nagad">নগদ</option></select></div>
              </label>
              <TextField label="মোবাইল নম্বর" value={it.number} onChange={b('number')} placeholder="01XXXXXXXXX" inputMode="tel" />
              <TextField label="লেবেল (ঐচ্ছিক)" value={it.label} onChange={b('label')} placeholder="যেমন: পার্সোনাল / এজেন্ট" />
              <label className="agri-same" style={{ alignSelf: 'center' }}>
                <input type="checkbox" checked={it.active} onChange={(e) => b('active')(e.target.checked)} /> সক্রিয় (মডারেটর এই নম্বর দেখবে)
              </label>
            </div>
          )}
        </ObjectList>
      </section>

      <div className="save-bar">
        <span className={dirty ? 'dirty' : 'muted'}>{dirty ? 'সংরক্ষণ না করা পরিবর্তন আছে' : 'কোনো পরিবর্তন নেই'}</span>
        {error && <span className="save-err">{error}</span>}
        <div className="save-actions">
          <button className="btn btn-solid" disabled={!dirty || busy} onClick={save}>
            {busy ? <Loader2 size={18} className="spin" /> : <Save size={18} />} সংরক্ষণ করুন
          </button>
        </div>
      </div>
      {done && <SuccessModal message="পেমেন্ট সেটিংস সংরক্ষণ হয়েছে।" onClose={() => setDone(false)} />}
    </>
  );
}
