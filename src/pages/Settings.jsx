import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings2, FileCheck2, UserRound, History, HeartHandshake, HardHat, Building2, ExternalLink, Loader2, Save, RotateCcw,
} from 'lucide-react';
import { api } from '../api';
import { setBranding } from '../useBranding';
import { refreshSite } from '../useSite';
import { SuccessModal } from '../components/Modal';
import { TextField, IconSelect, StringList, ObjectList, ImageField, LogoField } from '../components/FormBits';

const TABS = [
  { key: 'general', label: 'সাধারণ', icon: Settings2 },
  { key: 'chairman', label: 'চেয়ারম্যান', icon: UserRound },
  { key: 'about', label: 'ইউনিয়ন তথ্য', icon: History },
  { key: 'services', label: 'সেবা', icon: HeartHandshake },
  { key: 'cert', label: 'সনদ', icon: FileCheck2 },
  { key: 'dev', label: 'প্রকল্প ও উদ্যোক্তা', icon: HardHat },
  { key: 'places', label: 'অফিস ও প্রতিষ্ঠান', icon: Building2 },
];

const setIn = (obj, path, value) => {
  const [k, ...rest] = path;
  return { ...obj, [k]: rest.length ? setIn(obj[k] ?? {}, rest, value) : value };
};

// server theke ashle count null thake; input-e string lagbe
const toDraft = (site) => ({
  ...site,
  institutions: site.institutions.map((i) => ({ ...i, count: i.count == null ? '' : String(i.count) })),
});

export default function Settings() {
  const [initial, setInitial] = useState(null);
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState('general');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api('/settings/site')
      .then((d) => { const x = toDraft(d.site); setInitial(x); setDraft(x); })
      .catch((e) => setError(e.message));
  }, []);

  const dirty = useMemo(() => draft && JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
  const up = (...path) => (v) => setDraft((d) => setIn(d, path, v));

  async function save() {
    setBusy(true);
    setError('');
    try {
      const d = await api('/settings/site', { method: 'PUT', body: draft });
      const x = toDraft(d.site);
      setInitial(x);
      setDraft(x);
      setBranding(d.site.unionName);
      refreshSite(d.site);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!draft) {
    return (
      <section className="panel empty">
        {error ? <div className="alert">{error}</div> : <><Loader2 size={26} className="spin" /><p>লোড হচ্ছে…</p></>}
      </section>
    );
  }

  const d = draft;
  return (
    <>
      <section className="page-head">
        <h2><Settings2 size={26} /> ইউপি সেটিংস</h2>
        <Link className="btn btn-ghost" to="/" target="_blank"><ExternalLink size={17} /> হোমপেজ দেখুন</Link>
      </section>

      <div className="tabs" role="tablist">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} role="tab" aria-selected={tab === key} className={`tab ${tab === key ? 'on' : ''}`} onClick={() => setTab(key)}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>

      <section className="panel settings-panel">
        {tab === 'general' && (
          <>
            <h3 className="sec-title">ইউনিয়নের পরিচয়</h3>
            <LogoField value={d.logo} onChange={up('logo')} />
            <div className="form-grid">
              <TextField className="span-2" label="ইউনিয়নের নাম" value={d.unionName} onChange={up('unionName')} hint="হোমপেজ, লগইন পেজ ও সাইডবারে দেখাবে।" />
              <TextField label="ব্যানারের ছোট লেখা" value={d.heroEyebrow} onChange={up('heroEyebrow')} placeholder="যেমন: ডিজিটাল ইউনিয়ন পরিষদ" />
              <TextField label="প্রতিষ্ঠাকাল" value={d.established} onChange={up('established')} placeholder="০২/০৭/২০০৫" />
              <TextField className="span-2" label="ট্যাগলাইন (ব্যানারের নিচের লেখা)" multiline rows={2} value={d.tagline} onChange={up('tagline')} />
              <TextField label="আয়তন" value={d.area} onChange={up('area')} placeholder="১৬.৮৪ বর্গ কিঃমিঃ" />
            </div>

            <h3 className="sec-title">সর্বশেষ নোটিশ</h3>
            <StringList label="নোটিশ বার" hint="হোমপেজের লাল বারে একটার পর একটা চলবে।" items={d.notices} onChange={up('notices')} addLabel="নোটিশ যোগ করুন" placeholder="নোটিশের লেখা" />

            <h3 className="sec-title">যোগাযোগ (ফুটার)</h3>
            <div className="form-grid">
              <TextField label="ইমেইল" value={d.contact.email} onChange={up('contact', 'email')} />
              <TextField label="হেল্পলাইন নম্বর" value={d.contact.phone} onChange={up('contact', 'phone')} placeholder="01XXXXXXXXX" />
              <TextField className="span-2" label="ঠিকানা" value={d.contact.address} onChange={up('contact', 'address')} />
            </div>
          </>
        )}

        {tab === 'chairman' && (
          <>
            <h3 className="sec-title">চেয়ারম্যানের তথ্য</h3>
            <div className="form-grid">
              <TextField label="নাম" value={d.chairman.name} onChange={up('chairman', 'name')} />
              <TextField label="পদবি (বন্ধনীতে দেখাবে)" value={d.chairman.designation} onChange={up('chairman', 'designation')} placeholder="প্রশাসক" />
              <TextField label="সম্মানসূচক উপাধি" value={d.chairman.title} onChange={up('chairman', 'title')} placeholder="সম্মানিত চেয়ারম্যান" />
            </div>
            <ImageField label="চেয়ারম্যানের ছবি" value={d.chairman.photo} onChange={up('chairman', 'photo')}
              hint="ছবি আপলোড বা লিংক দেওয়ার পর নিচে “সংরক্ষণ করুন” চাপুন। ফাঁকা থাকলে ডিফল্ট আইকন দেখাবে।" />

            <h3 className="sec-title">শুভেচ্ছা বাণী</h3>
            <TextField label="মূল লাইন (হাইলাইট করা)" multiline rows={2} value={d.chairman.lead} onChange={up('chairman', 'lead')} />
            <StringList label="অনুচ্ছেদ" items={d.chairman.message} onChange={up('chairman', 'message')} addLabel="অনুচ্ছেদ যোগ করুন" multiline max={6} placeholder="অনুচ্ছেদের লেখা" />
          </>
        )}

        {tab === 'about' && (
          <>
            <h3 className="sec-title">ইতিহাস ও ঐতিহ্য</h3>
            <TextField label="বর্ণনা" multiline rows={5} value={d.history.text} onChange={up('history', 'text')} />
            <ObjectList label="সময়রেখা" items={d.history.timeline} onChange={up('history', 'timeline')} blank={() => ({ year: '', text: '' })} addLabel="সময়রেখা যোগ করুন" max={12}
              title={(t) => t.year || 'নতুন'}>
              {(it, b) => (
                <div className="form-grid">
                  <TextField label="সাল" value={it.year} onChange={b('year')} />
                  <TextField label="কী ঘটেছিল" value={it.text} onChange={b('text')} />
                </div>
              )}
            </ObjectList>

            <h3 className="sec-title">ভৌগলিক ও অর্থনৈতিক অবস্থা</h3>
            <TextField label="বর্ণনা" multiline rows={5} value={d.geo.text} onChange={up('geo', 'text')} />
            <ObjectList label="প্রধান খাতসমূহ" items={d.geo.sectors} onChange={up('geo', 'sectors')} blank={() => ({ icon: 'Wheat', label: '' })} addLabel="খাত যোগ করুন" max={12}
              title={(s) => s.label || 'নতুন খাত'}>
              {(it, b) => (
                <div className="form-grid">
                  <TextField label="খাতের নাম" value={it.label} onChange={b('label')} />
                  <IconSelect value={it.icon} onChange={b('icon')} />
                </div>
              )}
            </ObjectList>
          </>
        )}

        {tab === 'services' && (
          <>
            <h3 className="sec-title">হেডার মেনু — সেবা সমূহ (ড্রপডাউন)</h3>
            <ObjectList label="মেনুর আইটেম" hint="লিংক ফাঁকা থাকলে ক্লিকে “শীঘ্রই আসছে” দেখাবে। পেজ তৈরি হলে এখানে লিংক বসান।"
              items={d.serviceMenu} onChange={up('serviceMenu')} blank={() => ({ label: '', url: '' })} addLabel="মেনু আইটেম যোগ করুন" max={12}
              title={(s) => s.label || 'নতুন আইটেম'}>
              {(it, b) => (
                <div className="form-grid">
                  <TextField label="নাম" value={it.label} onChange={b('label')} />
                  <TextField label="লিংক" value={it.url} onChange={b('url')} placeholder="https://… অথবা /path" />
                </div>
              )}
            </ObjectList>

            <h3 className="sec-title">নাগরিক সেবা সমূহ (কার্ড)</h3>
            <ObjectList label="সেবার কার্ড" items={d.services} onChange={up('services')} blank={() => ({ icon: 'FileText', title: '', text: '' })} addLabel="সেবা যোগ করুন" max={12}
              title={(s) => s.title || 'নতুন সেবা'}>
              {(it, b) => (
                <div className="form-grid">
                  <TextField label="সেবার নাম" value={it.title} onChange={b('title')} />
                  <IconSelect value={it.icon} onChange={b('icon')} />
                  <TextField className="span-2" label="ছোট বিবরণ" value={it.text} onChange={b('text')} />
                </div>
              )}
            </ObjectList>
          </>
        )}

        {tab === 'cert' && (
          <>
            <h3 className="sec-title">সনদ / প্রত্যয়নপত্রের তথ্য</h3>
            <p className="muted" style={{ marginBottom: 12 }}>
              সনদের হেডার, ঠিকানার ডিফল্ট, স্বাক্ষর ও ফুটারে এগুলো ব্যবহার হয়। স্বাক্ষরে চেয়ারম্যান ট্যাবের নাম ও পদবি বসে।
            </p>
            <div className="form-grid">
              <TextField label="উপজেলা" value={d.certificate.upazila} onChange={up('certificate', 'upazila')} />
              <TextField label="জেলা" value={d.certificate.district} onChange={up('certificate', 'district')} />
              <TextField label="ইউনিয়নের সংক্ষিপ্ত নাম" value={d.certificate.unionShort} onChange={up('certificate', 'unionShort')} hint="আবেদন ফরমের ইউনিয়ন ঘরে ডিফল্ট হিসেবে বসে।" />
              <TextField label="সনদের ওয়েবসাইট লেখা (হেডারে)" value={d.certificate.website} onChange={up('certificate', 'website')} hint="ফাঁকা রাখলে এই সাইটের নিজের ঠিকানা বসবে।" />
              <TextField className="span-2" label="যাচাইয়ের ওয়েবসাইট লিংক" value={d.certificate.verifyUrl} onChange={up('certificate', 'verifyUrl')}
                placeholder="https://…" hint="QR ও ফুটারে এই লিংক বসে। ফাঁকা রাখলে এই সাইটের ঠিকানাই বসবে (সাধারণত ফাঁকা রাখাই ভালো)।" />
              <TextField className="span-2" label="ঘোষণা বাক্য" multiline rows={2} value={d.certificate.statement} onChange={up('certificate', 'statement')}
                hint="{name} লিখলে সেখানে আবেদনকারীর নাম (বোল্ড) বসবে।" />
              <TextField className="span-2" label="ফুটারের স্লোগান (সবুজ লেখা)" value={d.certificate.slogan} onChange={up('certificate', 'slogan')} />
              <TextField className="span-2" label="ক্রেডিট লাইন (ঐচ্ছিক)" value={d.certificate.credit} onChange={up('certificate', 'credit')} placeholder="যেমন: Developed by …" />
            </div>

            <h3 className="sec-title">হোল্ডিং নম্বর প্লেট ও হোল্ডিং সনদ</h3>
            <div className="form-grid">
              <TextField label="ওয়েবসাইট লেখা (প্লেট ও সনদের হেডারে)" value={d.plate.website} onChange={up('plate', 'website')} hint="ফাঁকা রাখলে এই সাইটের নিজের ঠিকানা বসবে (সাধারণত ফাঁকা রাখাই ভালো)।" />
              <TextField label="ওয়েবসাইট ভিজিটের লেখা" value={d.plate.visitText} onChange={up('plate', 'visitText')} />
              <TextField label="বাম পাশের নীল স্লোগান" value={d.plate.sloganLeft} onChange={up('plate', 'sloganLeft')} />
              <TextField label="ডান পাশের নীল স্লোগান" value={d.plate.sloganRight} onChange={up('plate', 'sloganRight')} />
              <TextField label="থানা (সবুজ বক্স)" value={d.plate.police} onChange={up('plate', 'police')} />
              <TextField label="জাতীয় সেবা (লাল বক্স, ১ম লাইন)" value={d.plate.national} onChange={up('plate', 'national')} />
              <TextField label="ফায়ার সার্ভিস (লাল বক্স, ২য় লাইন)" value={d.plate.fire} onChange={up('plate', 'fire')} />
              <TextField label="স্বাস্থ্য (কালো বক্স, ১ম লাইন)" value={d.plate.health} onChange={up('plate', 'health')} />
              <TextField label="বিদ্যুৎ (কালো বক্স, ২য় লাইন)" value={d.plate.electricity} onChange={up('plate', 'electricity')} />
              <TextField className="span-2" label="প্লেটের নিচের লাইন" value={d.plate.footer} onChange={up('plate', 'footer')} />
              <TextField className="span-2" label="প্লেটের ক্রেডিট লাইন (ঐচ্ছিক)" value={d.plate.credit} onChange={up('plate', 'credit')} />
            </div>

            <h3 className="sec-title">ট্রেড লাইসেন্স</h3>
            <div className="form-grid">
              <TextField label="দ্বিতীয় স্বাক্ষরকারীর নাম (বাম পাশে)" value={d.certificate.officerName} onChange={up('certificate', 'officerName')} />
              <TextField label="তাঁর পদবি" value={d.certificate.officerTitle} onChange={up('certificate', 'officerTitle')} />
              <TextField className="span-2" label="অনুমতির বাক্য" multiline rows={4} value={d.certificate.tradeText} onChange={up('certificate', 'tradeText')}
                hint="{fy} = অর্থ বছর, {from} = শুরুর তারিখ (১ জুলাই), {to} = মেয়াদ উত্তীর্ণ তারিখ। এগুলো বোল্ড হয়ে বসে।" />
            </div>

            <h3 className="sec-title">নাগরিক সনদের স্থির লেখা</h3>
            <TextField label="ঘোষণা বাক্য (ঠিকানার নিচে)" multiline rows={3} value={d.certificate.citizenStatement} onChange={up('certificate', 'citizenStatement')} />

            <h3 className="sec-title">ওয়ারিশ সনদের স্থির লেখা</h3>
            <TextField label="ওয়ারিশগণের তালিকার আগের বাক্য" multiline rows={2} value={d.certificate.warishResident} onChange={up('certificate', 'warishResident')} />
            <TextField label="তালিকার পরের দোয়া/বাক্য" multiline rows={2} value={d.certificate.warishPrayer} onChange={up('certificate', 'warishPrayer')} />
            <TextField label="বিঃদ্রঃ (ছোট ইটালিক লেখা)" multiline rows={3} value={d.certificate.warishNote} onChange={up('certificate', 'warishNote')} />
          </>
        )}

        {tab === 'dev' && (
          <>
            <h3 className="sec-title">চলমান প্রকল্পসমূহ</h3>
            <TextField label="উপরের নোট" multiline rows={2} value={d.projectsNote} onChange={up('projectsNote')} />
            <ObjectList label="প্রকল্প / উন্নয়ন খাত" items={d.projects} onChange={up('projects')} blank={() => ({ icon: 'Route', title: '' })} addLabel="প্রকল্প যোগ করুন" max={15}
              title={(p) => p.title || 'নতুন প্রকল্প'}>
              {(it, b) => (
                <div className="form-grid">
                  <TextField label="নাম" value={it.title} onChange={b('title')} />
                  <IconSelect value={it.icon} onChange={b('icon')} />
                </div>
              )}
            </ObjectList>

            <h3 className="sec-title">ডিজিটাল সেন্টার উদ্যোক্তা</h3>
            <TextField label="বর্ণনা" multiline rows={3} value={d.entrepreneur.text} onChange={up('entrepreneur', 'text')} />
            <StringList label="যে সেবাগুলো পাওয়া যায়" items={d.entrepreneur.helps} onChange={up('entrepreneur', 'helps')} addLabel="সেবা যোগ করুন" max={12} placeholder="যেমন: প্রিন্ট ও স্ক্যান" />
            <TextField label="নিচের নোট" value={d.entrepreneur.note} onChange={up('entrepreneur', 'note')} />
          </>
        )}

        {tab === 'places' && (
          <>
            <h3 className="sec-title">সরকারি অফিস</h3>
            <ObjectList label="অফিসের তালিকা" hint="নামে ক্লিক করলে লিংকটি নতুন পেজ/ট্যাবে খুলবে। লিংক ফাঁকা থাকলে “শীঘ্রই” দেখাবে।"
              items={d.offices} onChange={up('offices')} blank={() => ({ icon: 'Building2', label: '', url: '' })} addLabel="অফিস যোগ করুন" max={20}
              title={(o) => o.label || 'নতুন অফিস'}>
              {(it, b) => (
                <div className="form-grid">
                  <TextField label="অফিসের নাম" value={it.label} onChange={b('label')} />
                  <IconSelect value={it.icon} onChange={b('icon')} />
                  <TextField className="span-2" label="লিংক (https://…)" value={it.url} onChange={b('url')} />
                </div>
              )}
            </ObjectList>

            <h3 className="sec-title">অন্যান্য প্রতিষ্ঠান</h3>
            <ObjectList label="প্রতিষ্ঠানের ধরন" hint="ক্লিক করলে মডালে “এই ইউনিয়নে মোট … টি আছে” দেখাবে।"
              items={d.institutions} onChange={up('institutions')} blank={() => ({ icon: 'School', label: '', count: '', names: [] })} addLabel="প্রতিষ্ঠানের ধরন যোগ করুন" max={20}
              title={(o) => o.label || 'নতুন প্রতিষ্ঠান'}>
              {(it, b) => (
                <div className="form-grid">
                  <TextField label="নাম (যেমন: স্কুল)" value={it.label} onChange={b('label')} />
                  <IconSelect value={it.icon} onChange={b('icon')} />
                  <TextField label="মোট সংখ্যা" inputMode="numeric" value={it.count} onChange={b('count')} placeholder="যেমন: ৫" hint="ফাঁকা রেখে নামের তালিকা দিলে সংখ্যা নিজে গোনা হবে।" />
                  <TextField className="span-2" label="নামের তালিকা (প্রতি লাইনে একটি, ঐচ্ছিক)" multiline rows={4}
                    value={it.names.join('\n')} onChange={(v) => b('names')(v.split('\n'))} />
                </div>
              )}
            </ObjectList>
          </>
        )}
      </section>

      <div className="save-bar">
        <span className={dirty ? 'dirty' : 'muted'}>{dirty ? 'সংরক্ষণ না করা পরিবর্তন আছে' : 'কোনো পরিবর্তন নেই'}</span>
        {error && <span className="save-err">{error}</span>}
        <div className="save-actions">
          <button className="btn btn-ghost" disabled={!dirty || busy} onClick={() => { setDraft(initial); setError(''); }}>
            <RotateCcw size={16} /> বাতিল
          </button>
          <button className="btn btn-solid" disabled={!dirty || busy} onClick={save}>
            {busy ? <Loader2 size={18} className="spin" /> : <Save size={18} />} সংরক্ষণ করুন
          </button>
        </div>
      </div>

      {done && <SuccessModal message="সেটিংস সফলভাবে সংরক্ষণ হয়েছে। হোমপেজে নতুন তথ্য দেখা যাবে।" onClose={() => setDone(false)} />}
    </>
  );
}
