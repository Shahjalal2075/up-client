import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Download, Loader2 } from 'lucide-react';
import { api } from '../../api';
import { useSite } from '../../useSite';
import { downloadCertificatePdf } from '../../utils/certPdf';
import AgriShell, { HOLDING_PUBLIC_CFG } from '../../components/AgriShell';
import HoldingCertificate from '../../components/HoldingCertificate';

// হোল্ডিং সনদ/নম্বর প্লেটের QR স্ক্যান করলে এই পেজ খোলে (সবার জন্য, অনুমান-অযোগ্য key দিয়ে)
export default function HoldingPublic() {
  const { key } = useParams();
  const site = useSite();
  const sheet = useRef(null);
  const [h, setH] = useState(null);
  const [error, setError] = useState('');
  const [dl, setDl] = useState(false);

  useEffect(() => {
    setH(null); setError('');
    api(`/public/holding/${key}`).then((d) => setH(d.item)).catch((e) => setError(e.message));
  }, [key]);

  async function download() {
    setDl(true);
    try {
      await downloadCertificatePdf(sheet.current, `holding-info-${h.holdingNo.replace(/[^\w-]/g, '_')}.pdf`);
    } catch {
      setError('PDF তৈরি করা যায়নি। “প্রিন্ট করুন” চেপে PDF হিসেবে সেভ করুন।');
    } finally {
      setDl(false);
    }
  }

  return (
    <AgriShell cfg={HOLDING_PUBLIC_CFG}>
      {error && <div className="alert agri-msg no-print">{error}</div>}
      {!h && !error && <div className="agri-loading no-print"><Loader2 size={24} className="spin" /> লোড হচ্ছে…</div>}
      {h && (
        <>
          <div className="agri-actions no-print">
            <button className="btn btn-solid" onClick={() => window.print()}><Printer size={18} /> প্রিন্ট করুন</button>
            <button className="btn btn-blue" onClick={download} disabled={dl}>
              {dl ? <Loader2 size={18} className="spin" /> : <Download size={18} />} ডাউনলোড (PDF)
            </button>
          </div>
          <HoldingCertificate h={h} site={site} sheetRef={sheet} />
        </>
      )}
    </AgriShell>
  );
}
