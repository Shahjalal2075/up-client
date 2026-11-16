import { createRoot } from 'react-dom/client';
import HoldingCertificate from '../components/HoldingCertificate';
import HoldingPlate from '../components/HoldingPlate';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// একটি হোল্ডিংয়ের সনদ/প্লেট পর্দার বাইরে এঁকে ছবি (canvas) বানায়
async function snapshot(Doc, h, site, html2canvas) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:1000px;pointer-events:none;';
  document.body.appendChild(host);
  const root = createRoot(host);
  const ref = { current: null };
  try {
    await new Promise((resolve) => { root.render(<Doc h={h} site={site} sheetRef={ref} onReady={resolve} />); });
    await sleep(80); // ছবি/ফন্ট বসার সময়
    return await html2canvas(ref.current, {
      scale: 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: 1200,
      onclone: (doc) => {
        const sc = doc.querySelector('.cert-scale');
        const st = doc.querySelector('.cert-stage');
        if (sc) sc.style.transform = 'none';
        if (st) { st.style.height = 'auto'; st.style.overflow = 'visible'; st.style.maxWidth = 'none'; }
      },
    });
  } finally {
    root.unmount();
    host.remove();
  }
}

// অনেকগুলো হোল্ডিংয়ের সনদ (১ পেজে ১টি) বা নম্বর প্লেট (১ পেজে ২টি) PDF করে। বড় হলে কয়েকটি ফাইলে ভাগ হয়।
export async function bulkDownload({ kind, ids, site, loadChunk, onProgress, cancelled, logEvents }) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  if (document.fonts?.ready) await document.fonts.ready;
  const plate = kind === 'plate';
  const Doc = plate ? HoldingPlate : HoldingCertificate;
  const PART = plate ? 100 : 50; // এক PDF ফাইলে সর্বোচ্চ কতটি
  const multi = ids.length > PART;

  let pdf = null;
  let inPart = 0;
  let part = 1;
  let files = 0;
  let done = 0;
  let partIds = [];

  const flush = async () => {
    if (!pdf || !inPart) return;
    pdf.save(`holding-${plate ? 'number-plate' : 'info'}${multi ? `-part${part}` : ''}.pdf`);
    files += 1;
    part += 1;
    await logEvents?.(partIds);
    pdf = null; inPart = 0; partIds = [];
  };

  for (let i = 0; i < ids.length && !cancelled(); i += 10) {
    const chunk = await loadChunk(ids.slice(i, i + 10));
    for (const h of chunk) {
      if (cancelled()) break;
      const canvas = await snapshot(Doc, h, site, html2canvas);
      const img = canvas.toDataURL('image/jpeg', 0.9);
      const w = 210;
      const hh = (w * canvas.height) / canvas.width;
      if (!pdf) pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
      if (plate) {
        const slot = inPart % 2;
        if (inPart > 0 && slot === 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, slot ? 151 : 6, w, hh);
      } else {
        if (inPart > 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, 0, w, Math.min(hh, 297));
      }
      inPart += 1;
      partIds.push(h.id);
      done += 1;
      onProgress?.(done);
      if (inPart >= PART) await flush();
    }
  }
  await flush();
  return { files, done };
}
