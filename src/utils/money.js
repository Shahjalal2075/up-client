// ৳১,৫০০ (দশমিক থাকলে ২ ঘর পর্যন্ত)
export const tk = (n) => `৳${Number(n || 0).toLocaleString('bn-BD', { maximumFractionDigits: 2 })}`;
export const dmy = (s) => (s ? String(s).split('-').reverse().join('-') : '—');
export const dateTimeBn = (iso) =>
  new Date(iso).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const METHOD_LABEL = { bkash: 'বিকাশ', nagad: 'নগদ' };
export const STATUS_LABEL = { pending: 'অপেক্ষমাণ', approved: 'অনুমোদিত', rejected: 'বাতিল' };
