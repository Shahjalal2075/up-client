import { useEffect, useMemo, useState } from 'react';
import { Wallet, Loader2, CircleCheck, Search } from 'lucide-react';
import { api } from '../../api';
import { bn } from '../../utils/digits';
import { tk, dmy } from '../../utils/money';

// মডারেটর ধরে ধরে: কতগুলো ডাটা যোগ করেছে, সর্বশেষ কবে কাজ করেছে, কত টাকা বাকি (বাকি না থাকলে "সব পরিশোধিত")
export default function ModeratorAccounts() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('due');
  const [qs, setQs] = useState('');

  useEffect(() => { api('/payments/accounts').then(setD).catch((e) => setError(e.message)); }, []);

  const rows = useMemo(() => {
    if (!d) return [];
    const needle = qs.trim().toLowerCase();
    const list = d.moderators.filter((m) => !needle || `${m.name} ${m.username}`.toLowerCase().includes(needle));
    const by = {
      due: (a, b) => b.totalDue - a.totalDue || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
      last: (a, b) => (b.lastWork || '').localeCompare(a.lastWork || ''),
      count: (a, b) => b.totalCount - a.totalCount,
    };
    return list.sort(by[sort]);
  }, [d, sort, qs]);

  return (
    <>
      <section className="page-head">
        <h2><Wallet size={26} /> মডারেটর হিসাব</h2>
        <span className="muted">প্রতিটি হোল্ডিং এন্ট্রির চার্জ: <b>{d ? tk(d.fee) : '…'}</b></span>
      </section>

      {d && !d.entryEnabled && <div className="alert warn">ডাটা এন্ট্রি এখন <b>বন্ধ</b> আছে — কোনো মডারেটর ডাটা যোগ করতে পারছে না (পেমেন্ট সেটিংসে চালু করা যাবে)।</div>}
      {d && d.entryEnabled && !d.enforced && <div className="alert warn">“আগের দিনের পেমেন্ট বাধ্যতামূলক” সুইচ <b>বন্ধ</b> — বকেয়া থাকলেও মডারেটররা ডাটা যোগ করতে পারছে।</div>}

      <section className="panel table-panel">
        <div className="table-tools">
          <div className="input search wide"><Search size={18} />
            <input value={qs} onChange={(e) => setQs(e.target.value)} placeholder="মডারেটরের নাম বা ইউজারনেম দিয়ে খুঁজুন" aria-label="খুঁজুন" />
          </div>
          <label className="inline-sort">সাজান:
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="due">বকেয়া (বেশি → কম)</option>
              <option value="last">সর্বশেষ কাজের তারিখ</option>
              <option value="count">মোট ডাটা সংখ্যা</option>
              <option value="name">নাম</option>
            </select>
          </label>
          {d && <span className="muted push">মোট বকেয়া: <b>{tk(d.overall.due)}</b></span>}
        </div>
        {error && <div className="alert">{error}</div>}
        <div className="table-wrap">
          <table className="tbl wide">
            <thead>
              <tr><th>ক্রম</th><th>মডারেটর</th><th>মোট ডাটা যোগ</th><th>সর্বশেষ কাজ</th><th>মোট প্রদেয়</th><th>পরিশোধিত</th><th>বকেয়া</th></tr>
            </thead>
            <tbody>
              {!d && !error && <tr><td colSpan="7" className="cell-msg"><Loader2 size={20} className="spin" /> লোড হচ্ছে…</td></tr>}
              {d && rows.length === 0 && <tr><td colSpan="7" className="cell-msg">{qs.trim() ? 'এই নামে কোনো মডারেটর পাওয়া যায়নি।' : 'কোনো মডারেটর নেই।'}</td></tr>}
              {rows.map((m, i) => (
                <tr key={m.id} className={m.isActive ? '' : 'is-off'}>
                  <td className="muted">{bn(i + 1)}</td>
                  <td><strong>{m.name}</strong> <span className="muted">({m.username})</span>{!m.isActive && <span className="mini-tag">ইনঅ্যাক্টিভ</span>}</td>
                  <td>{bn(m.totalCount)} টি</td>
                  <td>{m.lastWork ? dmy(m.lastWork) : '—'}</td>
                  <td>{tk(m.totalCharge)}</td>
                  <td className="paid-c">{tk(m.approved)}</td>
                  <td>
                    {m.totalDue > 0 ? (
                      <>
                        <span className="due-chip">{tk(m.totalDue)}</span>
                        {m.blocked && <span className="mini-tag warn" title="আগের দিনের বকেয়া মেটেনি">এন্ট্রি বন্ধ</span>}
                      </>
                    ) : (
                      <span className="allpaid"><CircleCheck size={15} /> সব পরিশোধিত</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
