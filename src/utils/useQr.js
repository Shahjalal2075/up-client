import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// text -> QR (data URL). তৈরি হলে onReady() ডাকে (auto-print-er jonno)
export function useQr(text, onReady, width = 300) {
  const [qr, setQr] = useState('');
  useEffect(() => {
    QRCode.toDataURL(text, { margin: 0, width, errorCorrectionLevel: 'M' })
      .then((u) => { setQr(u); onReady?.(); })
      .catch(() => onReady?.());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return qr;
}
