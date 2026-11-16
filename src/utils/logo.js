// সাইটের লোগো: ইউপি সেটিংসে আপলোড করা থাকলে সেটা, না থাকলে ডিফল্ট (src/assets/logo.jpg)
import defaultLogo from '../assets/logo.jpg';

export { defaultLogo };
export const logoSrc = (site) => (site && site.logo) || defaultLogo;
