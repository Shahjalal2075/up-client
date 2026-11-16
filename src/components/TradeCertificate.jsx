import { bnDigits, fmtBnDate, fmtMoney, toAscii } from '../utils/digits';
import CertFrame, { verifyBase, siteHost } from './CertFrame';

// ট্রেড লাইসেন্স — ফাঁকা সারিও দেখায়; তারিখ বাংলা অঙ্কে; লাইসেন্স নং ১৭ ঘরে (বাম দিকে ০ দিয়ে ভরা)
export default function TradeCertificate({ cert, site, sheetRef, onReady }) {
  const c = site.certificate;
  const place = [c.upazila, c.district].filter(Boolean).join(', ');
  const renewed = !!cert.renewalDate;
  const title = renewed ? 'ট্রেড লাইসেন্স (নবায়নকৃত)' : 'ট্রেড লাইসেন্স';
  const created = new Date(cert.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const dateText = fmtBnDate(cert.renewalDate || cert.issueDate || created);

  const rows = [
    ['ট্রেড লাইসেন্স নং', cert.certNo],
    ['ব্যবসা প্রতিষ্ঠানের নাম', cert.businessName, true],
    ['নাম', cert.ownerName],
    ['পিতা/স্বামীর নাম', cert.fatherName],
    ['মাতার নাম', cert.motherName],
    ['মোবাইল', cert.mobile],
    ['ন্যাশনাল আইডি নং', cert.nid],
    ['জন্ম নিবন্ধন নং', cert.brn],
    ['ট্যাক্স আইডি', cert.taxId],
    ['ব্যবসা প্রতিষ্ঠানের ঠিকানা', cert.businessAddress],
    ['ব্যবসার ধরন', cert.businessType],
    ['মূলধন', cert.capital],
    ['ইস্যুর তারিখ', fmtBnDate(cert.issueDate)],
    ['নবায়ন তারিখ', fmtBnDate(cert.renewalDate)],
    ['মেয়াদ উত্তীর্ণ তারিখ', fmtBnDate(cert.expiryDate)],
  ];
  const fees = [
    ['ট্রেড লাইসেন্স ফি (বার্ষিক)', cert.licenseFee],
    ['১৫% ভ্যাট বাবদ জমা', cert.vat],
    ['পেশা ব্যবসা ও বৃত্তির উপর কর', cert.professionTax],
    ['বিজ্ঞাপন কর(বার্ষিক)', cert.adTax],
    ['বকেয়া (বার্ষিক)', cert.arrears],
    ['সার্ভিস চার্জ (বার্ষিক)', cert.serviceCharge],
  ];

  // বাক্যের {fy} {from} {to} বোল্ড মান দিয়ে বসে
  const fyStart = /(\d{4})/.exec(toAscii(cert.fiscalYear))?.[1];
  const vals = {
    fy: bnDigits(cert.fiscalYear),
    from: fyStart ? fmtBnDate(`${fyStart}-07-01`) : '',
    to: fmtBnDate(cert.expiryDate),
  };
  const parts = (c.tradeText || '').split(/(\{fy\}|\{from\}|\{to\})/);
  const info = [site.contact.phone, site.contact.email, siteHost(site, c.website)].filter(Boolean).join(', ');

  return (
    <CertFrame
      site={site} certNo={cert.certNo} createdAt={cert.createdAt}
      title={title} noLabel={`${title} নং.`} verifyType="trade" padTo={17} dateText={dateText} infoExtra={info}
      qrUrl={`${verifyBase(site)}/admin/trade-licenses/${cert.publicKey}`}
      minHeight={1122} sheetRef={sheetRef} onReady={onReady}
    >
      <div className={`tl-photo ${cert.photo ? '' : 'none'}`}>
        {cert.photo && <img src={cert.photo} alt="মালিকের ছবি" />}
      </div>

      <table className="tl-rows">
        <tbody>
          {rows.map(([l, v, bold]) => (
            <tr key={l}><th>{l}</th><td>:</td><td className={bold ? 'strong' : ''}>{v}</td></tr>
          ))}
          <tr className="sub"><th colSpan="3">ফি ও করের পরিমাণ</th></tr>
          {fees.map(([l, v]) => (
            <tr key={l}><th>{l}</th><td>:</td><td>{fmtMoney(v)}</td></tr>
          ))}
          <tr><th>সর্বমোট</th><td>:</td><td className="strong">{fmtMoney(cert.totalFee)}</td></tr>
        </tbody>
      </table>

      {c.tradeText && (
        <p className="tl-text">
          {parts.map((p, i) => {
            const m = /^\{(fy|from|to)\}$/.exec(p);
            return m ? <b key={i}>{vals[m[1]]}</b> : <span key={i}>{p}</span>;
          })}
        </p>
      )}

      <div className="wc-sign tl-sign">
        <div>
          <div className="cert-line" />
          <b>{c.officerName}</b>
          <span className="role">{c.officerTitle}</span>
          <span>{site.unionName}</span>
          <span>{place}</span>
        </div>
        <div>
          <div className="cert-line" />
          <b>{site.chairman.name}</b>
          <span className="role">{site.chairman.designation || site.chairman.title}</span>
          <span>{site.unionName}</span>
          <span>{place}</span>
        </div>
      </div>
    </CertFrame>
  );
}
