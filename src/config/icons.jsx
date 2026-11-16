import {
  Landmark, MapPinned, ScrollText, Store, Wheat, FileText, Home, Banknote, Droplets, GraduationCap,
  Sprout, HeartHandshake, Building2, School, Stethoscope, Hospital, Mail, Waves, Fish, Route,
  BookOpen, Users, Laptop, HardHat, ShieldCheck,
} from 'lucide-react';

// Backend-er ICON_KEYS-er sathe mil. Admin settings-e ei list theke icon select kora jay.
export const ICON_MAP = {
  Landmark, MapPinned, ScrollText, Store, Wheat, FileText, Home, Banknote, Droplets, GraduationCap,
  Sprout, HeartHandshake, Building2, School, Stethoscope, Hospital, Mail, Waves, Fish, Route,
  BookOpen, Users, Laptop, HardHat, ShieldCheck,
};

export const ICON_OPTIONS = [
  ['Landmark', 'ভবন / মসজিদ'], ['MapPinned', 'মানচিত্র'], ['ScrollText', 'সনদ'], ['Store', 'দোকান / ব্যবসা'],
  ['Wheat', 'কৃষি'], ['FileText', 'ডকুমেন্ট'], ['Home', 'বাড়ি'], ['Banknote', 'টাকা'], ['Droplets', 'পানি'],
  ['GraduationCap', 'শিক্ষা'], ['Sprout', 'চারা / কৃষি'], ['HeartHandshake', 'সহায়তা'], ['Building2', 'অফিস'],
  ['School', 'স্কুল'], ['Stethoscope', 'স্বাস্থ্য'], ['Hospital', 'হাসপাতাল / ক্লিনিক'], ['Mail', 'ডাক'],
  ['Waves', 'নদী'], ['Fish', 'মৎস্য'], ['Route', 'রাস্তা'], ['BookOpen', 'বই / মক্তব'], ['Users', 'মানুষ'],
  ['Laptop', 'কম্পিউটার'], ['HardHat', 'নির্মাণ'], ['ShieldCheck', 'নিরাপত্তা'],
];

export function Ico({ name, ...props }) {
  const C = ICON_MAP[name] || Landmark;
  return <C {...props} />;
}
