import { useEffect, useState } from 'react';
import { api } from './api';
import { DEFAULT_UNION_NAME } from './config/menu';

let cached = null;
const listeners = new Set();

// ইউপি সেটিংস-e naam bodlale sidebar-o sathe sathe bodlay
export function setBranding(name) {
  cached = name;
  listeners.forEach((fn) => fn(name));
}

export function useBranding() {
  const [name, setName] = useState(cached || DEFAULT_UNION_NAME);
  useEffect(() => {
    listeners.add(setName);
    if (!cached) {
      api('/public/branding')
        .then((d) => { if (d.unionName) setBranding(d.unionName); })
        .catch(() => {});
    }
    return () => listeners.delete(setName);
  }, []);
  return name;
}
