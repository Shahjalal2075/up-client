import { useSite } from '../useSite';
import { logoSrc } from '../utils/logo';

// সাইটের লোগো (হোমপেজ, লগইন, সাইডবার ...). badge = অন্ধকার ব্যাকগ্রাউন্ডে সাদা গোল জমি
export default function Logo({ size = 40, badge = false }) {
  const site = useSite();
  return (
    <img
      src={logoSrc(site)}
      alt=""
      width={size}
      height={size}
      className={`logo-img ${badge ? 'badge' : ''}`}
      style={{ width: size, height: size }}
    />
  );
}
