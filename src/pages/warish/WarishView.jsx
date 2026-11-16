import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../api';
import { useSite } from '../../useSite';
import { downloadCertificatePdf } from '../../utils/certPdf';
import AgriShell, { WARISH_CFG, WARISH_PATH } from '../../components/AgriShell';
import WarishCertificate from '../../components/WarishCertificate';

export default function WarishView() {
  const { key } = useParams();
  const [sp] = useSearchParams();
  const site = useSite();
  const sheet = useRef(null);
  const printed = useRef(false);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [dl, setDl] = useState(false);

  useEffect(() => {
    setCert(null); setError(''); setReady(false); printed.current = false;
    api(`${WARISH_CFG.apply}/view/${key}`).then((d) => setCert(d.item)).catch((e) => setError(e.message));
  }, [key]);

  useEffect(() => {
    if (sp.get('print') === '1' && cert && ready && !printed.current) {
      printed.current = true;
      setTimeout(() => window.print(), 500);
    }
  }, [sp, cert, ready]);

  async function download() {
    setDl(true);
    try {
      await downloadCertificatePdf(sheet.current, `warish-sonod-${cert.certNo}.pdf`);
    } catch {
      setError('PDF তৈরি করা যায়নি। “প্রিন্ট করুন” চেপে PDF হিসেবে সেভ করুন।');
    } finally {
      setDl(false);
    }
  }

  return (
    <AgriShell cfg={WARISH_CFG}>
      {error && <div className="alert agri-msg no-print">{error}</div>}
      {!cert && !error && <div className="agri-loading no-print"><Loader2 size={24} className="spin" /> লোড হচ্ছে…</div>}
      {cert && (
        <>
          <div className="agri-actions no-print">
            <button className="btn btn-solid" onClick={() => window.print()}><Printer size={18} /> প্রিন্ট করুন</button>
            <button className="btn btn-blue" onClick={download} disabled={dl}>
              {dl ? <Loader2 size={18} className="spin" /> : <Download size={18} />} ডাউনলোড (PDF)
            </button>
            <Link className="btn btn-gray" to={`${WARISH_PATH}/new`}><ArrowLeft size={18} /> নতুন আবেদন</Link>
          </div>
          <WarishCertificate cert={cert} site={site} sheetRef={sheet} onReady={() => setReady(true)} />
        </>
      )}
    </AgriShell>
  );
}
