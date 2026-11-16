import { Store } from 'lucide-react';
import CertList from '../../components/CertList';
import { TRADE_PATH } from '../../components/AgriShell';
import { fmtMoney } from '../../utils/digits';

const cfg = {
  title: 'সকল নিবন্ধিত ট্রেড লাইসেন্স',
  icon: Store,
  path: TRADE_PATH,
  endpoint: '/trade-licenses',
  placeholder: 'নাম বা লাইসেন্স নং দিয়ে খুঁজুন…',
  newLabel: 'নতুন লাইসেন্স',
  idLabel: '#',
  hideDate: true,
  printLabel: 'প্রিন্ট',
  columns: [
    { label: 'ব্যবসা প্রতিষ্ঠানের নাম', render: (r) => r.businessName },
    { label: 'মালিকের নাম', render: (r) => r.ownerName },
    { label: 'মোবাইল', render: (r) => r.mobile },
    { label: 'মোট ফি', render: (r) => fmtMoney(r.totalFee) },
  ],
  deleteTitle: 'ট্রেড লাইসেন্স ডিলিট করবেন?',
  deleteMessage: (r) => `"${r.businessName}" (${r.certNo}) এর ট্রেড লাইসেন্স তালিকা থেকে সরে যাবে এবং QR দিয়ে আর যাচাই করা যাবে না।`,
  deleteSuccess: 'ট্রেড লাইসেন্স সফলভাবে ডিলিট করা হয়েছে।',
};

export default function TradeList() {
  return <CertList cfg={cfg} />;
}
