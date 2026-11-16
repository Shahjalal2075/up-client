import { bn } from '../utils/digits';
import CertFrame, { verifyBase } from './CertFrame';

// ওয়ারিশ সনদপত্র — লেখা/ওয়ারিশ সংখ্যা অনুযায়ী উচ্চতা বাড়ে (কমপক্ষে ৯০০px)
export default function WarishCertificate({ cert, site, sheetRef, onReady }) {
  const c = site.certificate;
  const place = [c.upazila, c.district].filter(Boolean).join(', ');

  const addr = [
    cert.village && ['গ্রাম', cert.village],
    cert.postOffice && ['ডাকঘর', cert.postOffice],
    ['উপজেলা', cert.upazila],
    ['জেলা', cert.district],
  ].filter(Boolean).map(([l, v], i) => [i === 0 ? `ঠিকানা: ${l}` : l, v]);

  // ফাঁকা তথ্যের অংশ বাদ যায়
  const clauses = [
    ['পিতা/স্বামী নাম', cert.fatherName],
    ['মাতা', cert.motherName],
    ...addr,
    cert.deceasedNid && ['মৃত ব্যক্তির ন্যাশনাল আইডি / জন্ম নিবন্ধন ', cert.deceasedNid],
    cert.deathDate && ['মৃত্যু তারিখ', cert.deathDate],
    cert.deathRegNo && ['মৃত্যু নিবন্ধন নম্বর ', cert.deathRegNo],
  ].filter(Boolean);

  return (
    <CertFrame
      site={site} certNo={cert.certNo} createdAt={cert.createdAt}
      title="ওয়ারিশ সনদপত্র" noLabel="ওয়ারিশ সনদপত্র নং." verifyType="warish"
      qrUrl={`${verifyBase(site)}/admin/warish-certificates/${cert.publicKey}`}
      sheetRef={sheetRef} onReady={onReady}
    >
      <p className="wc-text">
        এই মর্মে ওয়ারিশ সনদ প্রদান করা যাচ্ছে যে, <b>{cert.deceasedName}</b>
        {clauses.map(([l, v]) => <span key={l}>, {l}: <b>{v}</b></span>)}।
      </p>
      {c.warishResident && <p className="wc-text">{c.warishResident}</p>}

      <table className="wc-table">
        <colgroup><col style={{ width: '6%' }} /><col style={{ width: '27%' }} /><col style={{ width: '15%' }} /><col style={{ width: '14%' }} /><col style={{ width: '23%' }} /><col style={{ width: '15%' }} /></colgroup>
        <thead>
          <tr><th>নং</th><th>নাম</th><th>সম্পর্ক</th><th>বয়স</th><th>এন আই ডি/বি আর এন</th><th>মন্তব্য</th></tr>
        </thead>
        <tbody>
          {cert.heirs.map((h, i) => (
            <tr key={i}>
              <td className="c">{i + 1}</td><td>{h.name}</td><td className="c">{h.relation}</td>
              <td className="c">{h.ageOrDob}</td><td className="c">{h.nid}</td><td className="c">{h.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {c.warishPrayer && <p className="wc-text">{c.warishPrayer}</p>}
      {c.warishNote && <p className="wc-note">{c.warishNote}</p>}

      <div className="wc-who">
        <b>আবেদনকারী: {cert.applicantName}</b>
        {cert.applicantRelation && <b>মৃতের সাথে সম্পর্ক: {cert.applicantRelation}</b>}
      </div>

      <div className="wc-sign">
        <div>
          <div className="cert-line" />
          <b>{bn(cert.wardNo)} নং ওয়ার্ড মেম্বার</b>
          <span>{site.unionName}</span>
          <span>{place}</span>
        </div>
        <div>
          <div className="cert-line" />
          <b>{site.chairman.name}</b>
          <span>{site.chairman.designation || site.chairman.title}</span>
          <span>{site.unionName}</span>
          <span>{place}</span>
        </div>
      </div>
    </CertFrame>
  );
}
