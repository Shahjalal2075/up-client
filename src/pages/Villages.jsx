import { MapPinned } from 'lucide-react';
import CrudPage from '../components/CrudPage';
import { bn } from '../utils/digits';

const cfg = {
  endpoint: '/villages',
  icon: MapPinned,
  title: 'গ্রাম ভিত্তিক তথ্য ব্যবস্থাপনা',
  addLabel: 'নতুন গ্রামের তথ্য যোগ করুন',
  searchPlaceholder: 'গ্রামের নাম বা ওয়ার্ড দিয়ে খুঁজুন…',
  emptyText: 'কোনো গ্রামের তথ্য পাওয়া যায়নি।',
  formTitle: { add: 'গ্রামের তথ্য সংগ্রহ ফর্ম', edit: 'গ্রামের তথ্য সংশোধন' },
  messages: {
    created: 'গ্রামের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।',
    updated: 'গ্রামের তথ্য সফলভাবে আপডেট হয়েছে।',
    deleted: 'গ্রামের তথ্য ডিলিট করা হয়েছে।',
  },
  deleteTitle: 'গ্রামের তথ্য ডিলিট করবেন?',
  deleteMessage: (r) => `"${r.name}" (${bn(r.wardNo)} নং ওয়ার্ড) গ্রামের তথ্য স্থায়ীভাবে মুছে যাবে।`,
  searchText: (r) => `${r.name} ${r.wardNo} ওয়ার্ড ${r.headName} ${r.headMobile}`,
  check: (b) => (b.voters > b.population ? 'মোট ভোটার জনসংখ্যার চেয়ে বেশি হতে পারে না।' : ''),
  columns: [
    { label: 'ওয়ার্ড নং', render: (r) => bn(r.wardNo) },
    { label: 'গ্রামের নাম', render: (r) => <strong>{r.name}</strong> },
    { label: 'মোট জনসংখ্যা', render: (r) => bn(r.population) },
    { label: 'মোট ভোটার', render: (r) => bn(r.voters) },
    { label: 'শিক্ষার হার', render: (r) => `${bn(r.literacyRate)}%` },
    { label: 'গ্রাম প্রধান / ইউপি সদস্য', render: (r) => r.headName },
    { label: 'মোবাইল নম্বর', render: (r) => r.headMobile },
  ],
  fields: [
    { key: 'name', label: 'গ্রামের নাম', type: 'text', required: true, placeholder: 'যেমন: রূপপুর' },
    { key: 'wardNo', label: 'ওয়ার্ড নং', type: 'ward', required: true },
    { key: 'population', label: 'মোট জনসংখ্যা', type: 'int', required: true, placeholder: 'আনুমানিক মোট জনসংখ্যা' },
    { key: 'voters', label: 'মোট ভোটার সংখ্যা', type: 'int', required: true, placeholder: 'মোট ভোটার সংখ্যা' },
    { key: 'literacyRate', label: 'শিক্ষার হার (%)', type: 'decimal', max: 100, required: true, placeholder: 'যেমন: ৬৫.৫' },
    { key: 'headName', label: 'গ্রাম প্রধান / দায়িত্বপ্রাপ্ত সদস্য', type: 'text', required: true, placeholder: 'নাম লিখুন' },
    { key: 'headMobile', label: 'প্রধানের মোবাইল নং', type: 'mobile', required: true, placeholder: '017XXXXXXXX' },
    { key: 'notes', label: 'অন্যান্য বিবরণ বা মন্তব্য', type: 'textarea', span: 2, placeholder: 'গ্রামের উল্লেখযোগ্য তথ্য (যদি থাকে)…' },
  ],
};

export default function Villages() {
  return <CrudPage cfg={cfg} />;
}
