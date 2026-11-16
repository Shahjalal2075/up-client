// Union-e koyta ward. Alada hole shudhu ei number bodlao (backend: up-server/src/config/constants.js-eo).
export const WARD_COUNT = 9;
export const WARD_OPTIONS = Array.from({ length: WARD_COUNT }, (_, i) => ({
  value: String(i + 1),
  label: `${(i + 1).toLocaleString('bn-BD')} নং ওয়ার্ড`,
}));
