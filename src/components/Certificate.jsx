import { bn } from '../utils/digits';
import CertFrame, { verifyBase } from './CertFrame';

const addrRows = (a) => [
  ['হোল্ডিং নং', a.holding],
  ['ওয়ার্ড নং', a.wardNo ? bn(a.wardNo) : ''],
  ['উপজেলা', a.upazila],
  ['গ্রাম', a.village],
  ['ইউনিয়ন', a.union],
  ['জেলা', a.district],
];

// কৃষি প্রত্যয়নপত্র — A4 (৭৯৪×১১২২px)
export default function Certificate({ cert, site, sheetRef, onReady }) {
  const c = site.certificate;
  const place = [c.upazila, c.district].filter(Boolean).join(', ');

  const rows = [
    ['নাম', cert.applicantName, true],
    ['মাতার নাম', cert.motherName],
    ['পিতার নাম', cert.fatherName],
    cert.spouseName && ['স্বামী/স্ত্রীর নাম', cert.spouseName],
    cert.nid && ['ন্যাশনাল আইডি নং', cert.nid],
    ['জন্ম তারিখ', cert.birthDate],
    ['বৈবাহিক অবস্থা', cert.maritalStatus],
    cert.brn && ['জন্ম নিবন্ধন নং', cert.brn],
    cert.postOffice && ['ডাকঘর', cert.postOffice],
  ].filter(Boolean);

  const parts = (c.statement || '').split('{name}');

  return (
    <CertFrame
      site={site} certNo={cert.certNo} createdAt={cert.createdAt}
      title="কৃষি প্রত্যয়নপত্র" noLabel="কৃষি প্রত্যয়নপত্র নং."
      qrUrl={`${verifyBase(site)}/admin/agriculture-certificates/${cert.publicKey}`}
      fixedHeight={1122} sheetRef={sheetRef} onReady={onReady}
    >
      <p className="cert-intro">এই মর্মে সনদপত্র প্রদান করা যাচ্ছে যে,</p>

      <table className="cert-rows">
        <tbody>
          {rows.map(([l, v, bold]) => (
            <tr key={l}><th>{l}</th><td>:</td><td className={bold ? 'strong' : ''}>{v}</td></tr>
          ))}
        </tbody>
      </table>

      <div className="cert-addr">
        {[['বর্তমান ঠিকানা', cert.currentAddress], ['স্থায়ী ঠিকানা', cert.permanentAddress]].map(([t, a]) => (
          <div key={t}>
            <h4>{t}</h4>
            <table>
              <tbody>
                {addrRows(a).map(([l, v]) => <tr key={l}><th>{l}:</th><td>{v}</td></tr>)}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <p className="cert-statement">
        {parts.length > 1
          ? parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <b>{cert.applicantName}</b>}</span>)
          : c.statement}
      </p>

      <div className="cert-sign">
        <div className="cert-sign-box">
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
