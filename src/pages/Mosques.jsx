import { Landmark, MapPin, Phone } from 'lucide-react';
import CrudPage from '../components/CrudPage';
import { bn } from '../utils/digits';

const person = (name, mobile) => (
  <>
    <div className="cell-strong">{name}</div>
    <div className="cell-icon phone"><Phone size={13} strokeWidth={2.6} /> {mobile}</div>
  </>
);

const cfg = {
  endpoint: '/mosques',
  icon: Landmark,
  title: 'ইউনিয়ন পরিষদ মসজিদ তথ্য ব্যবস্থাপনা',
  addLabel: 'নতুন মসজিদের তথ্য যোগ করুন',
  searchPlaceholder: 'মসজিদের নাম, গ্রাম বা ইমামের নাম দিয়ে খুঁজুন…',
  emptyText: 'কোনো মসজিদের তথ্য পাওয়া যায়নি।',
  formTitle: { add: 'মসজিদ তথ্য সংগ্রহ ফর্ম', edit: 'মসজিদের তথ্য সংশোধন' },
  messages: {
    created: 'মসজিদের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।',
    updated: 'মসজিদের তথ্য সফলভাবে আপডেট হয়েছে।',
    deleted: 'মসজিদের তথ্য ডিলিট করা হয়েছে।',
  },
  deleteTitle: 'মসজিদের তথ্য ডিলিট করবেন?',
  deleteMessage: (r) => `"${r.name}" (${r.villageName}) মসজিদের তথ্য স্থায়ীভাবে মুছে যাবে।`,
  searchText: (r) => `${r.name} ${r.villageName} ${r.imamName} ${r.muazzinName} ${r.wardNo} ওয়ার্ড`,
  columns: [
    { label: 'ওয়ার্ড ও অবস্থান', render: (r) => (
      <>
        <span className="ward-chip">{bn(r.wardNo)} নং ওয়ার্ড</span>
        <div className="cell-icon pin"><MapPin size={14} strokeWidth={2.6} /> {r.villageName}</div>
      </>
    ) },
    { label: 'মসজিদের নাম', render: (r) => <strong>{r.name}</strong> },
    { label: 'সম্মানিত ইমাম', render: (r) => person(r.imamName, r.imamMobile) },
    { label: 'সম্মানিত মুয়াজ্জিন', render: (r) => person(r.muazzinName, r.muazzinMobile) },
    { label: 'আনুমানিক বাৎসরিক খরচ', render: (r) => (r.annualCost == null ? '—' : <span className="money">{bn(r.annualCost)} <small>৳</small></span>) },
    { label: 'মন্তব্য', render: (r) => (r.notes ? <span className="clamp" title={r.notes}>{r.notes}</span> : '—') },
  ],
  fields: [
    { key: 'name', label: 'মসজিদের নাম', type: 'text', required: true, span: 2, placeholder: 'যেমন: বায়তুল মোকাররম জামে মসজিদ' },
    { key: 'wardNo', label: 'ওয়ার্ড নং', type: 'ward', required: true },
    { key: 'villageName', label: 'গ্রাম/মহল্লা', type: 'text', required: true, placeholder: 'যেমন: রূপপুর' },
    { key: 'imamName', label: 'ইমাম সাহেবের নাম', type: 'text', required: true, placeholder: 'হাফেজ মাওলানা…' },
    { key: 'imamMobile', label: 'ইমাম সাহেবের মোবাইল নং', type: 'mobile', required: true, placeholder: '017XXXXXXXX' },
    { key: 'muazzinName', label: 'মুয়াজ্জিন সাহেবের নাম', type: 'text', required: true, placeholder: 'কারী…' },
    { key: 'muazzinMobile', label: 'মুয়াজ্জিন সাহেবের মোবাইল নং', type: 'mobile', required: true, placeholder: '019XXXXXXXX' },
    { key: 'annualCost', label: 'মসজিদের আনুমানিক বাৎসরিক খরচ/বাজেট (টাকা)', type: 'int', span: 2, placeholder: 'যেমন: ১২০০০০' },
    { key: 'notes', label: 'অন্যান্য বিবরণ (যেমন: এতিমখানা আছে কি না / মক্তব তথ্য)', type: 'textarea', span: 2, placeholder: 'অতিরিক্ত তথ্য বা মন্তব্য…' },
  ],
};

export default function Mosques() {
  return <CrudPage cfg={cfg} />;
}
