// সনদ A4 PDF হিসেবে download. (library দরকার হলেই load হয়)
export async function downloadCertificatePdf(sheetEl, filename) {
  if (document.fonts?.ready) await document.fonts.ready;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const canvas = await html2canvas(sheetEl, {
    scale: 2.5,
    backgroundColor: '#ffffff',
    useCORS: true,
    windowWidth: 1200,
    onclone: (doc) => {
      // mobile-e chhoto kora (scale) thakleo PDF full size-e hobe
      const scale = doc.querySelector('.cert-scale');
      const stage = doc.querySelector('.cert-stage');
      if (scale) scale.style.transform = 'none';
      if (stage) { stage.style.height = 'auto'; stage.style.overflow = 'visible'; stage.style.maxWidth = 'none'; }
    },
  });
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  // A4-te boshay; sanad lomba hole poriman thik rekhe chhoto kore
  const ratio = canvas.height / canvas.width;
  let w = 210;
  let h = w * ratio;
  if (h > 297) { h = 297; w = h / ratio; }
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
  pdf.save(filename);
}
