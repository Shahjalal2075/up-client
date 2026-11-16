import sealBd from '../assets/cert/seal-bd.png';
import { logoSrc } from '../utils/logo';
import sign from '../assets/cert/sign-blank.jpg';
import { useQr } from '../utils/useQr';
import { verifyBase, siteHost } from './CertFrame';
import ScaledSheet from './ScaledSheet';

// হোল্ডিং নম্বর প্লেট — ৭৯৪×৪৮০px (A4-র প্রস্থে, উপরে বসে)
export default function HoldingPlate({ h, site, sheetRef, onReady }) {
  const qr = useQr(`${verifyBase(site)}/admin/holdings/view/${h.publicKey}`, onReady);
  const p = site.plate;
  const c = site.certificate;
  const rows = [
    ['মালিকের নাম', h.ownerName],
    ['পিতা/স্বামীর নাম', h.fatherName],
    ['হোল্ডিং নং', h.holdingNo],
    ['ওয়ার্ড নং', h.wardNo],
    ['গ্রাম/মহল্লা', h.village],
  ];

  return (
    <ScaledSheet width={794} height={480} sheetRef={sheetRef} className="pl">
      <div className="pl-frame" />
      <i className="pl-dot a" /><i className="pl-dot b" />

      <img src={sealBd} alt="" className="pl-seal" />
      <img src={logoSrc(site)} alt="" className="pl-logo" />
      <img src={logoSrc(site)} alt="" className="pl-wm" />

      <div className="pl-head">
        <div className="l1">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
        <div className="l2">{site.unionName}</div>
        <div className="l3">উপজেলা: {c.upazila}, {c.district}</div>
        <div className="l4">{siteHost(site, p.website)}</div>
        {p.visitText && <div className="l5">{p.visitText}</div>}
      </div>

      <div className="pl-pill left"><span>{p.sloganLeft}</span></div>
      <div className="pl-pill right"><span>{p.sloganRight}</span></div>

      <div className="pl-data">
        {rows.map(([l, v]) => (
          <div key={l}><span className="l">{l}</span><span className="v">: {v}</span></div>
        ))}
      </div>

      <div className="pl-side">
        <div className="pl-qr">{qr && <img src={qr} alt="QR" />}</div>
        <img src={sign} alt="" className="pl-sign" />
        <b>সৌজন্যে</b>
        {/* <b>{site.chairman.name}</b>
        <b>{site.chairman.designation || site.chairman.title}</b> */}
        <span>{site.unionName}</span>
        <span>{c.upazila} উপজেলা, {c.district}</span>
      </div>

      <div className="pl-box green"><b>{p.police}</b></div>
      <div className="pl-box red"><b>{p.national}</b><b>{p.fire}</b></div>
      <div className="pl-box green2"><b>{p.health}</b><b>{p.electricity}</b></div>

      <div className="pl-foot">
        <div>{p.footer}</div>
        {p.credit && <div className="cr">{p.credit}</div>}
      </div>
    </ScaledSheet>
  );
}
