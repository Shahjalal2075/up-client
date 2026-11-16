import { useEffect, useRef, useState } from 'react';
import '../holdingDocs.css';

// নির্দিষ্ট px মাপের কাগজ (সনদ/প্লেট); স্ক্রিন ছোট হলে ছোট করে দেখায়, প্রিন্ট/PDF-এ আসল মাপ।
export default function ScaledSheet({ width, height, sheetRef, className = '', children }) {
  const wrap = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => wrap.current && setScale(Math.min(1, wrap.current.clientWidth / width));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [width]);

  return (
    <div className="cert-wrap" ref={wrap}>
      <div className="cert-stage" style={{ height: height * scale, maxWidth: width }}>
        <div className="cert-scale" style={{ width, transform: `scale(${scale})` }}>
          <div className={`hd-sheet ${className}`} ref={sheetRef} style={{ width, height }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
