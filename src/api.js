const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const KEY = 'up_admin_token';

export const tokenStore = {
  get: () => localStorage.getItem(KEY),
  set: (t) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};

export async function api(path, { method = 'GET', body } = {}) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('সার্ভারের সাথে সংযোগ করা যাচ্ছে না। ইন্টারনেট চেক করুন।'), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.message || 'কিছু একটা সমস্যা হয়েছে।'), { status: res.status });
  }
  return data;
}
