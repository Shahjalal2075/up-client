import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../api';
import { useSite } from '../../useSite';
import { bn } from '../../utils/digits';
import AgriShell, { HOLDING_CFG, HOLDING_PATH } from '../../components/AgriShell';
import HoldingCertificate from '../../components/HoldingCertificate';
import HoldingPlate from '../../components/HoldingPlate';

const CHUNK = 25; // একসাথে ২৫টি করে লোড

// প্রতিটি সনদ/প্লেট আলাদা পেজে — নতুন প্লেট সবসময় নতুন পেজ থেকে শুরু
const PRINT_CSS = `
@media print {
  .print-page { break-inside: avoid; page-break-inside: avoid; margin: 0 !important; }
  .print-page:not(:last-child) { break-after: page; page-break-after: always; }
}`;

// তালিকা থেকে নির্বাচিত সব সনদ / নম্বর প্লেট একসাথে প্রিন্ট
export default function HoldingPrintAll() {
  const [sp] = useSearchParams();
  const kind = sp.get('kind') === 'plate' ? 'plate' : 'certificate';
  const plate = kind === 'plate';
  const site = useSite();
  const dummyRef = useRef(null);
  const printed = useRef(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [readyCount, setReadyCount] = useState(0);
  const readySet = useRef(new Set());

  useEffect(() => {
    let dead = false;
    let ids = [];
    try { ids = JSON.parse(sessionStorage.getItem('holdingPrintIds') || '[]'); } catch { /* ignore */ }
    if (!ids.length) { setError('কোনো হোল্ডিং নির্বাচন করা নেই। তালিকা থেকে নির্বাচন করে আবার চেষ্টা করুন।'); return undefined; }
    setTotal(ids.length);
    (async () => {
      try {
        for (let i = 0; i < ids.length; i += CHUNK) {
          const part = (await api('/holdings/bulk', { method: 'POST', body: { ids: ids.slice(i, i + CHUNK) } })).items;
          if (dead) return;
          setItems((p) => [...p, ...part]);
        }
        if (!dead) setLoaded(true);
      } catch (e) {
        if (!dead) setError(e.message || 'লোড করা যায়নি।');
      }
    })();
    return () => { dead = true; };
  }, []);

  // সবগুলো সনদ/প্লেট আঁকা শেষ হলে তবেই প্রিন্টের জন্য প্রস্তুত
  const markReady = (id) => {
    if (readySet.current.has(id)) return;
    readySet.current.add(id);
    setReadyCount(readySet.current.size);
  };
  const allReady = loaded && items.length > 0 && readyCount >= items.length;

  const doPrint = () => {
    api('/holdings/events/bulk', { method: 'POST', body: { ids: items.map((x) => x.id), doc: kind, action: 'print' } }).catch(() => {});
    window.print();
  };

  useEffect(() => {
    if (allReady && !printed.current) {
      printed.current = true;
      setTimeout(doPrint, 600);
    }
  }, [allReady]);

  const Doc = plate ? HoldingPlate : HoldingCertificate;
  return (
    <AgriShell cfg={HOLDING_CFG}>
      <style>{PRINT_CSS}</style>
      {error && <div className="alert agri-msg no-print">{error}</div>}
      {!error && !allReady && (
        <div className="agri-loading no-print">
          <Loader2 size={24} className="spin" /> তৈরি হচ্ছে… {bn(readyCount)} / {bn(total)}
        </div>
      )}
      <div className="agri-actions no-print">
        <button className="btn btn-solid" onClick={doPrint} disabled={!allReady}>
          <Printer size={18} /> {plate ? 'সব নম্বর প্লেট প্রিন্ট' : 'সব সনদ প্রিন্ট'} ({bn(items.length)} টি)
        </button>
        <Link className="btn btn-gray" to={HOLDING_PATH}><ArrowLeft size={18} /> তালিকায় ফিরুন</Link>
      </div>

      <div className="print-pages">
        {items.map((h) => (
          <div className="print-page" key={h.id}>
            <Doc h={h} site={site} sheetRef={dummyRef} onReady={() => markReady(h.id)} />
          </div>
        ))}
      </div>
    </AgriShell>
  );
}

