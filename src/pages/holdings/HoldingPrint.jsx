import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../api';
import { useSite } from '../../useSite';
import { downloadCertificatePdf } from '../../utils/certPdf';
import AgriShell, { HOLDING_CFG, HOLDING_PATH } from '../../components/AgriShell';
import HoldingCertificate from '../../components/HoldingCertificate';
import HoldingPlate from '../../components/HoldingPlate';

// kind: 'certificate' (বিস্তারিত তথ্য সনদ) | 'plate' (নম্বর প্লেট)
export default function HoldingPrint({ kind }) {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const site = useSite();
  const sheet = useRef(null);
  const printed = useRef(false);
  const [h, setH] = useState(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [dl, setDl] = useState(false);
  const plate = kind === 'plate';
  // প্রিন্ট/ডাউনলোড গোনা (printer dashboard ও তালিকার hover-er jonno)
  const log = (action) => api(`/holdings/${id}/events`, { method: 'POST', body: { doc: kind, action } }).catch(() => {});
  const doPrint = () => { log('print'); window.print(); };

  useEffect(() => {
    setH(null); setError(''); setReady(false); printed.current = false;
    api(`/holdings/${id}`).then((d) => setH(d.item)).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (sp.get('print') === '1' && h && ready && !printed.current) {
      printed.current = true;
      setTimeout(doPrint, 500);
    }
  }, [sp, h, ready]);

  async function download() {
    setDl(true);
    try {
      await downloadCertificatePdf(sheet.current, `${plate ? 'number-plate' : 'holding-info'}-${h.holdingNo.replace(/[^\w-]/g, '_')}.pdf`);
      log('download');
    } catch {
      setError('PDF তৈরি করা যায়নি। “প্রিন্ট করুন” চেপে PDF হিসেবে সেভ করুন।');
    } finally {
      setDl(false);
    }
  }

  const Doc = plate ? HoldingPlate : HoldingCertificate;
  return (
    <AgriShell cfg={HOLDING_CFG}>
      {error && <div className="alert agri-msg no-print">{error}</div>}
      {!h && !error && <div className="agri-loading no-print"><Loader2 size={24} className="spin" /> লোড হচ্ছে…</div>}
      {h && (
        <>
          <div className="agri-actions no-print">
            <button className="btn btn-solid" onClick={doPrint}><Printer size={18} /> {plate ? 'নম্বর প্লেট প্রিন্ট' : 'সনদ প্রিন্ট'}</button>
            {/* <button className="btn btn-blue" onClick={download} disabled={dl}>
              {dl ? <Loader2 size={18} className="spin" /> : <Download size={18} />} ডাউনলোড (PDF)
            </button> */}
            <Link className="btn btn-gray" to={HOLDING_PATH}><ArrowLeft size={18} /> তালিকা দেখুন</Link>
          </div>
          <Doc h={h} site={site} sheetRef={sheet} onReady={() => setReady(true)} />
        </>
      )}
    </AgriShell>
  );
}
