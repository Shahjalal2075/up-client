import { Users } from 'lucide-react';
import CertList from '../../components/CertList';
import { WARISH_PATH } from '../../components/AgriShell';

const cfg = {
  title: 'ওয়ারিশ সনদপত্র তালিকা',
  icon: Users,
  path: WARISH_PATH,
  endpoint: '/warish-certificates',
  placeholder: 'সনদ নং / মৃতের নাম / ওয়ারিশের NID',
  newSuffix: '',
  columns: [
    { label: 'মৃতের নাম', render: (r) => r.deceasedName },
    { label: 'আবেদনকারীর নাম', render: (r) => r.applicantName },
    { label: 'মৃতের NID/BRN', render: (r) => r.deceasedNid },
  ],
  deleteTitle: 'ওয়ারিশ সনদ ডিলিট করবেন?',
  deleteMessage: (r) => `"${r.deceasedName}" (${r.certNo}) এর ওয়ারিশ সনদ তালিকা থেকে সরে যাবে এবং QR দিয়ে আর যাচাই করা যাবে না।`,
  deleteSuccess: 'ওয়ারিশ সনদ সফলভাবে ডিলিট করা হয়েছে।',
};

export default function WarishList() {
  return <CertList cfg={cfg} />;
}
