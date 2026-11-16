import { FileCheck2 } from 'lucide-react';
import CertList from '../../components/CertList';
import { AGRI_PATH } from '../../components/AgriShell';

const cfg = {
  title: 'কৃষি প্রত্যয়নপত্র তালিকা',
  icon: FileCheck2,
  path: AGRI_PATH,
  endpoint: '/agri-certificates',
  placeholder: 'সনদ নং / নাম / NID / মোবাইল',
  columns: [
    { label: 'নাম', render: (r) => r.applicantName },
    { label: 'পিতার নাম', render: (r) => r.fatherName },
    { label: 'মোবাইল', render: (r) => r.mobile },
    { label: 'NID', render: (r) => r.nid },
  ],
  deleteTitle: 'প্রত্যয়নপত্র ডিলিট করবেন?',
  deleteMessage: (r) => `"${r.applicantName}" (${r.certNo}) এর প্রত্যয়নপত্র তালিকা থেকে সরে যাবে এবং QR দিয়ে আর যাচাই করা যাবে না।`,
  deleteSuccess: 'প্রত্যয়নপত্র সফলভাবে ডিলিট করা হয়েছে।',
};

export default function AgriList() {
  return <CertList cfg={cfg} />;
}
