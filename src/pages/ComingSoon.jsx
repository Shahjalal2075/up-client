import { Hammer } from 'lucide-react';

export default function ComingSoon({ title }) {
  return (
    <div className="panel empty">
      <Hammer size={30} />
      <h2>{title}</h2>
      <p>এই পেজটি তৈরির কাজ চলছে। নির্দেশনা পাওয়ার পর যুক্ত করা হবে।</p>
    </div>
  );
}
