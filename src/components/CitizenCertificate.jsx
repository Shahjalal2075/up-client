import { bn } from '../utils/digits';
import CertFrame, { verifyBase } from './CertFrame';

// ঠিকানার সারি (নাগরিক সনদে থানাও ছাপা হয়)
const addrRows = (a) => [
  ['হোল্ডিং নং', a.holding],
  ['ওয়ার্ড নং', a.wardNo ? bn(a.wardNo) : ''],
  ['থানা', a.thana],
  ['গ্রাম', a.village],
  ['ইউনিয়ন', a.union],
  ['উপজেলা', a.upazila],
  ['জেলা', a.district],
];

// নাগরিকত্ব সনদপত্র — ফাঁকা সারিও দেখায় (আগের সনদের মতো)
export default function CitizenCertificate({ cert, site, sheetRef, onReady }) {
  const c = site.certificate;
  const place = [c.upazila, c.district].filter(Boolean).join(', ');

  const rows = [
    ['নাম', cert.applicantName, true],
    ['পিতার নাম', cert.fatherName],
    ['মাতার নাম', cert.motherName],
    ['স্বামী/স্ত্রীর নাম', cert.spouseName],
    ['ন্যাশনাল আইডি নং', cert.nid],
    ['জন্ম তারিখ', cert.birthDate],
    ['জন্ম নিবন্ধন নং', cert.brn],
    ['বৈবাহিক অবস্থা', cert.maritalStatus],
    ['ডাকঘর', cert.postOffice],
  ];

  return (
    <CertFrame
      site={site} certNo={cert.certNo} createdAt={cert.createdAt}
      title="নাগরিকত্ব সনদপত্র" noLabel="নাগরিকত্ব সনদপত্র নং." verifyType="citizen"
      qrUrl={`${verifyBase(site)}/admin/citizen-certificates/${cert.publicKey}`}
      minHeight={1122} compact sheetRef={sheetRef} onReady={onReady}
    >
      <p className="cert-intro">এই মর্মে সনদপত্র প্রদান করা যাচ্ছে যে,</p>

      <table className="cert-rows">
        <tbody>
          {rows.map(([l, v, bold]) => (
            <tr key={l}><th>{l}</th><td>:</td><td className={bold ? 'strong' : ''}>{v}</td></tr>
          ))}
        </tbody>
      </table>

      <div className="cert-addr center">
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

      {c.citizenStatement && <p className="cert-statement">{c.citizenStatement}</p>}

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
