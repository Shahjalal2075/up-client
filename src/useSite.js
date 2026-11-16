import { useEffect, useState } from 'react';
import { api } from './api';
import { SITE_DEFAULTS } from './config/homeContent';

let cache = null;
const listeners = new Set();

// ইউপি সেটিংস save করলে সব জায়গায় (লোগো, নাম ...) সঙ্গে সঙ্গে নতুন তথ্য
export function refreshSite(d) {
  cache = { ...SITE_DEFAULTS, ...d };
  listeners.forEach((fn) => fn(cache));
}

// Public site content (সনদে ইউনিয়নের নাম, চেয়ারম্যান, লোগো ইত্যাদির জন্য)
export function useSite() {
  const [site, setSite] = useState(cache || SITE_DEFAULTS);
  useEffect(() => {
    listeners.add(setSite);
    if (!cache) api('/public/site').then(refreshSite).catch(() => {});
    return () => { listeners.delete(setSite); };
  }, []);
  return site;
}
