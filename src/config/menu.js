import {
  LayoutDashboard, Home, Banknote, FileText, Store,
  ScrollText, Wheat, MapPinned, Landmark, Settings, Users, Wallet, BadgeCheck, CreditCard, HandCoins, Send,
} from 'lucide-react';

export const ADMIN_BASE = '/admin';

// তালিকা/ডিলিট ইত্যাদি শুধু এই দুই রোল। (আবেদন ফরম ও নিজের সনদ সবার জন্য খোলা)
export const FULL_ROLES = ['super_admin', 'admin'];

export const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  accounting: 'Accounting',
  printer: 'Printer',
};

const ALL = Object.keys(ROLE_LABEL);
const FULL = ['super_admin', 'admin'];
const ACC = [...FULL, 'accounting'];
const ACC_ONLY = ['accounting']; // খরচ, মডারেটর হিসাব, পেমেন্ট অনুমোদন/সেটিংস

// Backend-er config/roles.js-er sathe mil rekhe cholo. Notun page = ekta line.
export const MENU = [
  { key: 'dashboard', path: '/admin', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, roles: ALL },
  { key: 'holdings', path: '/admin/holdings', label: 'ডিজিটাল নেমপ্লেট', icon: Home, roles: [...FULL, 'moderator', 'printer'] },
  { key: 'tax-collection', path: '/admin/tax-collection', label: 'ট্যাক্স আদায়', icon: Banknote, roles: FULL },
  { key: 'citizen-certificates', path: '/admin/citizen-certificates', label: 'নাগরিক সনদ আবেদন', icon: FileText, roles: FULL },
  { key: 'trade-licenses', path: '/admin/trade-licenses', label: 'ট্রেড লাইসেন্স', icon: Store, roles: FULL },
  { key: 'warish-certificates', path: '/admin/warish-certificates', label: 'ওয়ারিশ সনদ আবেদন', icon: ScrollText, roles: FULL },
  { key: 'agriculture-certificates', path: '/admin/agriculture-certificates', label: 'কৃষি সনদ আবেদন', icon: Wheat, roles: FULL },
  { key: 'village-info', path: '/admin/village-info', label: 'গ্রাম ভিত্তিক তথ্য', icon: MapPinned, roles: FULL },
  { key: 'mosque-info', path: '/admin/mosque-info', label: 'মসজিদ তথ্য', icon: Landmark, roles: FULL },
  { key: 'settings', path: '/admin/settings', label: 'ইউপি সেটিংস', icon: Settings, roles: FULL },
  { key: 'expenses', path: '/admin/expenses', label: 'খরচ হিসাব', icon: HandCoins, roles: ACC_ONLY },
  { key: 'moderator-accounts', path: '/admin/moderator-accounts', label: 'মডারেটর হিসাব', icon: Wallet, roles: ACC_ONLY },
  { key: 'payment-approvals', path: '/admin/payment-approvals', label: 'পেমেন্ট অনুমোদন', icon: BadgeCheck, roles: ACC_ONLY },
  { key: 'withdraw-requests', path: '/admin/withdraw-requests', label: 'উত্তোলন অনুরোধ', icon: Send, roles: ACC_ONLY },
  { key: 'payment-settings', path: '/admin/payment-settings', label: 'পেমেন্ট সেটিংস', icon: CreditCard, roles: ACC_ONLY },
  { key: 'users', path: '/admin/users', label: 'ইউজার্স (অ্যাডমিন্স)', icon: Users, roles: FULL },
];

export const DEFAULT_UNION_NAME = '৩নং পিলজংগ ইউনিয়ন পরিষদ';
