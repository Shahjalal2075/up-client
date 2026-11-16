import { BadgeCheck } from 'lucide-react';
import CertList from '../../components/CertList';
import { CITIZEN_PATH } from '../../components/AgriShell';

const cfg = {
  title: 'নাগরিক সনদপত্রের তালিকা',
  icon: BadgeCheck,
  path: CITIZEN_PATH,
  endpoint: '/citizen-certificates',
  placeholder: 'সনদ নং / নাম / মোবাইল দিয়ে খুঁজুন…',
  searchLabel: 'খুঁজুন',
  hideId: true,
  dateLabel: 'আবেদনের তারিখ',
  printLabel: 'প্রিন্ট',
  newSuffix: '',
  columns: [
    { label: 'আবেদনকারীর নাম', render: (r) => r.applicantName },
    { label: 'মোবাইল নম্বর', render: (r) => r.mobile },
    { label: 'এনআইডি / বিআরএন', render: (r) => r.nid || r.brn },
  ],
  deleteTitle: 'নাগরিক সনদ ডিলিট করবেন?',
  deleteMessage: (r) => `"${r.applicantName}" (${r.certNo}) এর নাগরিক সনদ তালিকা থেকে সরে যাবে এবং QR দিয়ে আর যাচাই করা যাবে না।`,
  deleteSuccess: 'নাগরিক সনদ সফলভাবে ডিলিট করা হয়েছে।',
};

export default function CitizenList() {
  return <CertList cfg={cfg} />;
}
