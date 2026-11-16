import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { logoSrc } from '../utils/logo';
import sealBd from '../assets/cert/seal-bd.png';
import { fmtDate } from '../utils/digits';
import '../certificate.css';

const W = 794;

export const verifyBase = (site) => (site.certificate.verifyUrl || window.location.origin).replace(/\/+$/, '');

// সনদ/প্লেটে ছাপা ওয়েবসাইট লেখা: সেটিংসে দেওয়া থাকলে সেটা, না থাকলে এই সাইটের নিজের ঠিকানা
export function siteHost(site, custom) {
  const c = String(custom || '').trim();
  if (c && !/digitalup\.online|upsheba\.com/i.test(c)) return c;
  try { return new URL(verifyBase(site)).host; } catch { return window.location.host; }
}

// সব সনদের কমন ফ্রেম: বর্ডার, হেডার (লোগো/সিল), তারিখ, শিরোনাম, সনদ নং বক্স, ওয়াটারমার্ক, QR ফুটার।
// fixedHeight দিলে ঐ উচ্চতা (agri: ১১২২px = A4), না দিলে লেখা অনুযায়ী বাড়ে (min minHeight)।
export default function CertFrame({ site, certNo, createdAt, title, noLabel, verifyType, fixedHeight, minHeight = 900, compact = false, dateText, padTo, infoExtra, qrUrl, sheetRef, onReady, children }) {
  const wrap = useRef(null);
  const sheet = useRef(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(fixedHeight || minHeight);
  const [qr, setQr] = useState('');
  const c = site.certificate;
  const place = [c.upazila, c.district].filter(Boolean).join(', ');

  useEffect(() => {
    const fit = () => wrap.current && setScale(Math.min(1, wrap.current.clientWidth / W));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    if (fixedHeight || !sheet.current) return undefined;
    const measure = () => setH(sheet.current.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sheet.current);
    return () => ro.disconnect();
  }, [fixedHeight]);

  useEffect(() => {
    // QR স্ক্যান করলে এই সনদটিই খোলে
    const url = qrUrl || `${verifyBase(site)}/`;
    QRCode.toDataURL(url, { margin: 0, width: 260, errorCorrectionLevel: 'M' })
      .then((u) => { setQr(u); onReady?.(); })
      .catch(() => onReady?.());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certNo, c.verifyUrl, qrUrl]);

  const setRefs = (el) => { sheet.current = el; if (sheetRef) sheetRef.current = el; };

  return (
    <div className="cert-wrap" ref={wrap}>
      <div className="cert-stage" style={{ height: h * scale }}>
        <div className="cert-scale" style={{ transform: `scale(${scale})` }}>
          <div className={`cert${compact ? ' compact' : ''}`} ref={setRefs} style={fixedHeight ? { height: fixedHeight } : { minHeight }}>
            <div className="cert-in">
              <img className="cert-wm" src={sealBd} alt="" />

              <header className="cert-head">
                <img src={logoSrc(site)} alt="" className="cert-logo" />
                <div className="cert-head-text">
                  <div className="cert-gov">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
                  <div className="cert-union">{site.unionName}</div>
                  <div className="cert-place">{place}</div>
                  <div className="cert-site">{siteHost(site, c.website)}</div>
                </div>
                <img src={sealBd} alt="" className="cert-logo" />
              </header>
              <div className="cert-date">তারিখ: <b>{dateText ?? fmtDate(createdAt)}</b></div>

              <h2 className="cert-title">{title}</h2>
              <div className="cert-no">
                <b>{noLabel}</b>
                <span>{[...(padTo ? certNo.padStart(padTo, '0') : certNo)].map((d, i) => <i key={i}>{d}</i>)}</span>
              </div>

              {children}

              <footer className="cert-foot">
                {qr && <img src={qr} alt="QR" className="cert-qr" />}
                <div className="cert-foot-text">
                  <p>নির্দেশাবলী: সার্টিফিকেটটি QR Code দিয়ে অথবা {verifyBase(site)}/ ওয়েবসাইট থেকে যাচাই করুন।</p>
                  <p>পরিষদের তথ্য: {[site.unionName, infoExtra].filter(Boolean).join(', ')}</p>
                  {c.credit && <small>{c.credit}</small>}
                </div>
                {c.slogan && <div className="cert-slogan">{c.slogan}</div>}
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
