const BN = '০১২৩৪৫৬৭৮৯';
export const toAscii = (v) => String(v ?? '').replace(/[০-৯]/g, (d) => BN.indexOf(d)).trim();
export const bn = (n) => Number(n).toLocaleString('bn-BD', { maximumFractionDigits: 2 });

export function normMobile(v) {
  let s = toAscii(v).replace(/[\s-]/g, '');
  if (s.startsWith('+88')) s = s.slice(3);
  else if (s.length === 13 && s.startsWith('88')) s = s.slice(2);
  return /^01[3-9]\d{8}$/.test(s) ? s : null;
}

// 24-10-2026 (ঢাকার সময়)
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }).replace(/\//g, '-');

// English digit -> Bangla digit
export const bnDigits = (v) => String(v ?? '').replace(/[0-9]/g, (d) => BN[d]);
// 2026-09-21 -> ২১-০৯-২০২৬ (ফাঁকা হলে '')
export const fmtBnDate = (iso) => (iso ? bnDigits(String(iso).split('-').reverse().join('-')) : '');
// 1230 -> 1230.00/-
export const fmtMoney = (n) => `${Number(n || 0).toFixed(2)}/-`;
