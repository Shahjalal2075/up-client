import { logoSrc } from '../utils/logo';
import { bnDigits, fmtMoney } from '../utils/digits';
import { useQr } from '../utils/useQr';
import { verifyBase, siteHost } from './CertFrame';
import ScaledSheet from './ScaledSheet';

const bnNo = (n) => `${bnDigits(n)}।`;

// হোল্ডিং মালিকের বিস্তারিত তথ্য — A4 (৭৯৪×১১২২px)
export default function HoldingCertificate({ h, site, sheetRef, onReady }) {
  const qr = useQr(`${verifyBase(site)}/admin/holdings/view/${h.publicKey}`, onReady);
  const place = [site.certificate.upazila && `উপজেলা: ${site.certificate.upazila}`, site.certificate.district && `জেলা: ${site.certificate.district}`]
    .filter(Boolean).join(', ');
  const benefit = h.upBenefit.startsWith('না') ? 'না' : `হ্যাঁ (${h.upBenefit.replace(/^হ্যাঁ,\s*/, '')})`;

  const rows = [
    ['বাসা মালিকের নাম', h.ownerName, true],
    ['পিতা/স্বামীর নাম', h.fatherName],
    ['মাতার নাম', h.motherName],
    ['হোল্ডিং/বাড়ি নং', h.holdingNo, true],
    ['স্থায়ী ঠিকানা', `গ্রাম: ${h.village}, ওয়ার্ড নং: ${h.wardNo}, ${h.permanentAddress}`],
    ['এনআইডি নং', h.nid],
    ['মোবাইল নং', h.mobile],
    ['পেশা', h.occupation],
    ['হোল্ডিং/বাসা/বাড়ির ধরন', h.houseType],
    ['জমি জায়গার পরিমাণ', h.landArea],
    ['ইউপি সুবিধা ভোগ করেন কিনা', benefit],
  ];

  return (
    <ScaledSheet width={794} height={1122} sheetRef={sheetRef} className="hc">
      <header className="hc-head">
        <img src={logoSrc(site)} alt="" className="hc-logo" />
        <div className="hc-title">
          <h1>{site.unionName}</h1>
          <p>{place}।</p>
          <b>{siteHost(site, site.plate.website)}</b>
        </div>
        <div className="hc-qr">{qr && <img src={qr} alt="QR" />}</div>
      </header>

      <div className="hc-bar">হোল্ডিং মালিকের বিস্তারিত তথ্য</div>
      <div className="hc-rows">
        {rows.map(([l, v, bold], i) => (
          <div className="hc-row" key={l}>
            <span className="n">{bnNo(i + 1)}</span><span className="l">{l}</span><span className="c">:</span>
            <span className={`v ${bold ? 'b' : ''}`}>{v}</span>
          </div>
        ))}
      </div>

      <div className="hc-bar">ধার্যকৃত হোল্ডিং ট্যাক্সের বিবরণ</div>
      <div className="hc-rows">
        <div className="hc-row"><span className="n">{bnNo(1)}</span><span className="l">ধার্যকের পরিমাণ</span><span className="c">:</span>
          <span className="v b">{fmtMoney(h.annualTax).replace('/-', '')} <small>৳</small></span></div>
        <div className="hc-row"><span className="n">{bnNo(2)}</span><span className="l">মন্তব্য</span><span className="c">:</span>
          <span className="v">{h.note || 'নাই'}</span></div>
      </div>

      <div className="hc-sign">
        <div><i />নাগরিকের স্বাক্ষর</div>
        <div><i />তদন্তকারীর স্বাক্ষর</div>
        <div><i />ইউপি চেয়ারম্যান/সচিব</div>
      </div>
    </ScaledSheet>
  );
}
