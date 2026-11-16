import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapPinned, MapPin, Landmark, Megaphone, Quote, Users, Vote, CalendarDays, Ruler, History,
  ArrowRight, Laptop, HardHat, PieChart as ChartPie, UserRound, HeartHandshake, Building2, School,
  ChevronDown, Menu, X, Mail, Phone, ExternalLink, CircleCheck, CircleX,
} from 'lucide-react';
import { api } from '../api';
import Logo from '../components/Logo';
import { Modal } from '../components/Modal';
import { useNotice, INFO } from '../components/Notice';
import { Ico } from '../config/icons';
import { SITE_DEFAULTS } from '../config/homeContent';
import { WARD_COUNT } from '../config/wards';
import '../home.css';

const bn = (n) => Number(n).toLocaleString('bn-BD');

const NAV_BEFORE = [
  { label: 'হোম', href: '#home' },
  { label: 'চেয়ারম্যান', href: '#chairman' },
  { label: 'ইউনিয়ন তথ্য', href: '#history' },
];
const NAV_AFTER = [
  { label: 'প্রকল্পসমূহ', href: '#projects' },
  { label: 'উদ্যোক্তা', href: '#entrepreneurs' },
];
const MORE = [
  { label: 'নাগরিক সেবা সমূহ', href: '#services' },
  { label: 'গ্রামসমূহের তালিকা', href: '#villages' },
  { label: 'মসজিদসমূহের তালিকা', href: '#mosques' },
  { label: 'ভৌগলিক ও অর্থনৈতিক অবস্থা', href: '#geo' },
  { label: 'সরকারি অফিস ও প্রতিষ্ঠান', href: '#offices' },
  { label: 'এক নজরে ইউনিয়ন তথ্য', href: '#glance' },
];

export default function Home() {
  const { notify } = useNotice();
  const [site, setSite] = useState(SITE_DEFAULTS); // API aste aste default-i dekhay
  const [data, setData] = useState({ status: 'loading' });
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(null); // 'services' | 'more' | null
  const [inst, setInst] = useState(null);
  const [sp, setSp] = useSearchParams();
  const [verify, setVerify] = useState(null); // সনদের QR scan (/?verify=সনদ নং)
  const headerRef = useRef(null);
  const unionName = site.unionName;

  useEffect(() => {
    api('/public/site').then((d) => setSite({ ...SITE_DEFAULTS, ...d })).catch(() => {});
    api('/public/overview').then((d) => setData({ status: 'ok', ...d })).catch(() => setData({ status: 'error' }));
  }, []);

  useEffect(() => { document.title = unionName; }, [unionName]);

  const verifyNo = sp.get('verify');
  const verifyType = ['warish', 'citizen', 'trade'].includes(sp.get('t')) ? sp.get('t') : 'agriculture';
  useEffect(() => {
    if (!verifyNo) return;
    setVerify({ status: 'loading', no: verifyNo, type: verifyType });
    api(`/public/verify/${verifyType}/${encodeURIComponent(verifyNo)}`)
      .then((d) => setVerify({ status: 'ok', no: verifyNo, type: verifyType, ...d }))
      .catch(() => setVerify({ status: 'bad', no: verifyNo, type: verifyType }));
  }, [verifyNo, verifyType]);
  const closeVerify = () => { setVerify(null); setSp({}, { replace: true }); };

  // dropdown-er baire click / Esc dile bondho
  useEffect(() => {
    const out = (e) => { if (headerRef.current && !headerRef.current.contains(e.target)) setOpen(null); };
    const esc = (e) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', out);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc); };
  }, []);

  // scroll-reveal
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const go = () => { setMenu(false); setOpen(null); };
  const soon = (title, msg) => { go(); notify(INFO(title, msg)); };
  const stats = data.status === 'ok' ? data.stats : null;
  const loading = data.status === 'loading';
  const ch = site.chairman;

  return (
    <div className="hp" id="home">
      {/* ---------- header ---------- */}
      <header className="hp-header" ref={headerRef}>
        <div className="hp-wrap hp-header-in">
          <a href="#home" className="hp-logo" onClick={go}>
            <Logo size={38} />
            <span>{unionName}</span>
          </a>
          <button className="hp-burger icon-btn" onClick={() => setMenu((v) => !v)} aria-label="মেনু" aria-expanded={menu}>
            {menu ? <X size={24} /> : <Menu size={24} />}
          </button>
          <nav className={`hp-nav ${menu ? 'open' : ''}`} aria-label="মূল মেনু">
            {NAV_BEFORE.map((n) => <a key={n.href} href={n.href} onClick={go}>{n.label}</a>)}

            {site.serviceMenu.length > 0 ? (
              <Dropdown id="services" label="সেবা সমূহ" open={open} setOpen={setOpen}>
                {site.serviceMenu.map((it) => <ServiceLink key={it.label} item={it} onDone={go} soon={soon} />)}
              </Dropdown>
            ) : (
              <a href="#services" onClick={go}>সেবা সমূহ</a>
            )}

            {NAV_AFTER.map((n) => <a key={n.href} href={n.href} onClick={go}>{n.label}</a>)}

            <Dropdown id="more" label="অন্যান্য" open={open} setOpen={setOpen}>
              {MORE.map((n) => <a key={n.href} href={n.href} onClick={go}>{n.label}</a>)}
            </Dropdown>
          </nav>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="hp-hero">
        <HeroArt />
        <div className="hp-hero-text hp-wrap">
          {site.heroEyebrow && <span className="hp-eyebrow">{site.heroEyebrow}</span>}
          <h1 className="hp-serif">{unionName}</h1>
          <p>{site.tagline}</p>
          <div className="hp-cta">
            <a className="hp-btn gold" href="#services" onClick={go}>সেবা সমূহ দেখুন <ArrowRight size={18} /></a>
            <a className="hp-btn ghost" href="#history" onClick={go}>ইউনিয়ন সম্পর্কে জানুন</a>
          </div>
        </div>
      </section>

      {/* ---------- notice ticker ---------- */}
      {site.notices.length > 0 && (
        <div className="hp-notice">
          <span className="hp-notice-label"><Megaphone size={16} /> সর্বশেষ নোটিশ</span>
          <div className="hp-marquee">
            <div className="hp-track">
              {[0, 1].map((k) => (
                <div className="hp-track-set" key={k} aria-hidden={k === 1}>
                  {site.notices.map((n, i) => <span key={`${i}-${k}`}>{n}</span>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="hp-main hp-wrap">
        {/* ---------- chairman ---------- */}
        <section id="chairman" className="hp-chair reveal">
          <article className="hp-portrait">
            <div className="hp-avatar">
              {ch.photo ? <img src={ch.photo} alt={ch.name} /> : <UserRound size={92} strokeWidth={1.2} />}
            </div>
            <h3>{ch.name}{ch.designation && ` (${ch.designation})`}</h3>
            <p>{ch.title}</p>
          </article>
          <div className="hp-message">
            <h2 className="hp-serif"><Quote size={26} /> শুভেচ্ছা বাণী</h2>
            {ch.lead && <p className="hp-lead hp-serif">{ch.lead}</p>}
            {ch.message.map((t, i) => <p key={i}>{t}</p>)}
          </div>
        </section>

        {/* ---------- villages + mosques ---------- */}
        <div className="hp-grid2">
          <Card id="villages" tone="blue" icon={<MapPinned size={22} />} title="গ্রামসমূহের তালিকা">
            <DataList
              data={data}
              items={data.villages}
              empty="গ্রামের তালিকা শীঘ্রই প্রকাশিত হবে।"
              row={(v) => (
                <>
                  <span className="hp-ward">{bn(v.wardNo)} নং ওয়ার্ড</span>
                  <strong>{v.name}</strong>
                  <small>জনসংখ্যা {bn(v.population)}</small>
                </>
              )}
            />
          </Card>
          <Card id="mosques" tone="green" icon={<Landmark size={22} />} title="মসজিদসমূহের তালিকা">
            <DataList
              data={data}
              items={data.mosques}
              empty="মসজিদের তালিকা শীঘ্রই প্রকাশিত হবে।"
              row={(m) => (
                <>
                  <span className="hp-ward">{bn(m.wardNo)} নং ওয়ার্ড</span>
                  <strong>{m.name}</strong>
                  <small><MapPin size={13} /> {m.villageName}</small>
                </>
              )}
            />
          </Card>
        </div>

        {/* ---------- history ---------- */}
        <Card id="history" tone="purple" icon={<History size={22} />} title="ইতিহাস ও ঐতিহ্য" wide>
          <div className="hp-split">
            <p>{site.history.text}</p>
            {site.history.timeline.length > 0 && (
              <ol className="hp-timeline">
                {site.history.timeline.map((t, i) => (
                  <li key={i}><b className="hp-serif">{t.year}</b><span>{t.text}</span></li>
                ))}
              </ol>
            )}
          </div>
        </Card>

        {/* ---------- geo ---------- */}
        <Card id="geo" tone="green" icon={<MapPinned size={22} />} title="ভৌগলিক ও অর্থনৈতিক অবস্থা" wide>
          <div className="hp-split">
            <div>
              <p>{site.geo.text}</p>
              <div className="hp-facts">
                {site.area && <div><Ruler size={20} /><b>{site.area}</b><span>আয়তন</span></div>}
                <div><MapPinned size={20} /><b>{bn(WARD_COUNT)} টি</b><span>ওয়ার্ড</span></div>
              </div>
            </div>
            {site.geo.sectors.length > 0 && (
              <div className="hp-sectors">
                <h4>প্রধান খাতসমূহ</h4>
                <div className="hp-chips">
                  {site.geo.sectors.map((s, i) => <span key={i}><Ico name={s.icon} size={16} /> {s.label}</span>)}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ---------- services ---------- */}
        {site.services.length > 0 && (
          <Card id="services" tone="orange" icon={<HeartHandshake size={22} />} title="নাগরিক সেবা সমূহ" wide>
            <div className="hp-services">
              {site.services.map((s, i) => (
                <article key={i} className="hp-service">
                  <span className="hp-service-ico"><Ico name={s.icon} size={24} /></span>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </article>
              ))}
            </div>
          </Card>
        )}

        {/* ---------- projects + entrepreneur ---------- */}
        <div className="hp-grid2">
          <Card id="projects" tone="amber" icon={<HardHat size={22} />} title="চলমান প্রকল্পসমূহ">
            {site.projectsNote && <p className="hp-note">{site.projectsNote}</p>}
            <ul className="hp-iconlist">
              {site.projects.map((p, i) => (
                <li key={i}><span><Ico name={p.icon} size={18} /></span>{p.title}</li>
              ))}
            </ul>
          </Card>
          <Card id="entrepreneurs" tone="blue" icon={<Laptop size={22} />} title="ডিজিটাল সেন্টার উদ্যোক্তা">
            <p className="hp-note">{site.entrepreneur.text}</p>
            <div className="hp-chips">
              {site.entrepreneur.helps.map((h, i) => <span key={i}>{h}</span>)}
            </div>
            {site.entrepreneur.note && <p className="hp-soon">{site.entrepreneur.note}</p>}
          </Card>
        </div>

        {/* ---------- offices + institutions ---------- */}
        <div className="hp-grid2" id="offices">
          <Card tone="red" icon={<Building2 size={22} />} title="সরকারি অফিস">
            <p className="hp-hint">অফিসের নামে ক্লিক করলে নতুন পেজ খুলবে।</p>
            <div className="hp-chips big">
              {site.offices.map((o, i) =>
                o.url ? (
                  <a key={i} href={o.url} target="_blank" rel="noopener noreferrer">
                    <Ico name={o.icon} size={16} /> {o.label} <ExternalLink size={13} className="ext" />
                  </a>
                ) : (
                  <button key={i} type="button" onClick={() => soon(o.label, 'এই অফিসের লিংক শীঘ্রই যুক্ত করা হবে।')}>
                    <Ico name={o.icon} size={16} /> {o.label}
                  </button>
                )
              )}
            </div>
          </Card>
          <Card tone="teal" icon={<School size={22} />} title="অন্যান্য প্রতিষ্ঠান">
            <p className="hp-hint">প্রতিষ্ঠানের নামে ক্লিক করলে বিস্তারিত দেখতে পাবেন।</p>
            <div className="hp-chips big">
              {site.institutions.map((it, i) => {
                const n = it.count ?? (it.names.length || null);
                return (
                  <button key={i} type="button" onClick={() => setInst(it)}>
                    <Ico name={it.icon} size={16} /> {it.label}
                    {n != null && <b className="hp-count">{bn(n)}</b>}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ---------- at a glance ---------- */}
        <section id="glance" className="hp-glance reveal">
          <h2 className="hp-serif"><ChartPie size={26} /> এক নজরে ইউনিয়ন তথ্য</h2>
          <div className="hp-glance-grid">
            <Glance icon={<MapPinned />} label="মোট গ্রাম" value={stats?.villages} loading={loading} />
            <Glance icon={<Landmark />} label="মোট মসজিদ" value={stats?.mosques} loading={loading} />
            <Glance icon={<Users />} label="মোট জনসংখ্যা" value={stats?.population} loading={loading} />
            <Glance icon={<Vote />} label="মোট ভোটার" value={stats?.voters} loading={loading} />
            {site.established && <Glance icon={<CalendarDays />} label="প্রতিষ্ঠাকাল" text={site.established} />}
            {site.area && <Glance icon={<Ruler />} label="আয়তন (বর্গ কি.মি.)" text={site.area.replace(/\s*বর্গ.*$/, '')} />}
          </div>
        </section>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="hp-footer">
        <div className="hp-wrap hp-footer-in">
          <div className="hp-footer-brand">
            <Logo size={44} badge />
            <strong>{unionName}</strong>
          </div>
          <div className="hp-footer-contact">
            {site.contact.phone && <span><Phone size={15} /> হেল্পলাইন: {site.contact.phone}</span>}
            {site.contact.email && <a href={`mailto:${site.contact.email}`}><Mail size={15} /> {site.contact.email}</a>}
            {site.contact.address && <span><MapPin size={15} /> {site.contact.address}</span>}
          </div>
        </div>
        <p className="hp-copy">© {new Date().getFullYear().toLocaleString('bn-BD', { useGrouping: false })} {unionName}। সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>

      {verify && <VerifyModal v={verify} onClose={closeVerify} />}
      {inst && <InstitutionModal inst={inst} unionName={unionName} onClose={() => setInst(null)} />}
    </div>
  );
}

const NOUN = { agriculture: 'প্রত্যয়নপত্র', citizen: 'নাগরিক সনদ', warish: 'ওয়ারিশ সনদ', trade: 'ট্রেড লাইসেন্স' };
const dmy = (iso) => (iso ? iso.split('-').reverse().join('-') : '—');

function VerifyModal({ v, onClose }) {
  const issued = v.issuedAt && new Date(v.issuedAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }).replace(/\//g, '-');
  const rows = [
    [v.type === 'trade' ? 'লাইসেন্স নম্বর' : 'সনদ নম্বর', v.certNo],
    ...(v.type === 'warish'
      ? [['মৃত ব্যক্তির নাম', v.deceasedName], ['আবেদনকারী', v.applicantName], ['ইস্যুর তারিখ', issued]]
      : v.type === 'trade'
        ? [['প্রতিষ্ঠান', v.businessName], ['মালিক', v.ownerName], ['মেয়াদ উত্তীর্ণ', dmy(v.expiryDate)]]
        : [['নাম', v.name], ['পিতার নাম', v.fatherName], ['ইস্যুর তারিখ', issued]]),
  ];
  const noun = NOUN[v.type];
  return (
    <Modal title="সনদ যাচাই" onClose={onClose} width={440}>
      <div className="inst">
        {v.status === 'loading' && <p className="hp-soon">যাচাই করা হচ্ছে…</p>}
        {v.status === 'ok' && (
          <>
            <span className={`inst-ico ${v.expired ? 'bad' : 'ok'}`}>{v.expired ? <CircleX size={34} /> : <CircleCheck size={34} />}</span>
            <h3>{v.expired ? `${noun}টির মেয়াদ শেষ হয়েছে` : `${noun}টি সঠিক ও বৈধ`}</h3>
            <dl className="verify-dl">
              {rows.map(([l, val]) => <span key={l} style={{ display: 'contents' }}><dt>{l}</dt><dd>{val}</dd></span>)}
            </dl>
          </>
        )}
        {v.status === 'bad' && (
          <>
            <span className="inst-ico bad"><CircleX size={34} /></span>
            <h3>পাওয়া যায়নি</h3>
            <p>দুঃখিত! {v.no} নম্বরে কোনো {noun} পাওয়া যায়নি।</p>
          </>
        )}
      </div>
      <footer className="dialog-foot single"><button className="btn btn-solid" onClick={onClose} autoFocus>বন্ধ করুন</button></footer>
    </Modal>
  );
}

function Dropdown({ id, label, open, setOpen, children }) {
  const isOpen = open === id;
  return (
    <div className="hp-more">
      <button type="button" className="hp-more-btn" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
        {label} <ChevronDown size={16} className={isOpen ? 'flip' : ''} />
      </button>
      {isOpen && <div className="hp-more-menu">{children}</div>}
    </div>
  );
}

// সেবা সমূহ dropdown-er item: link thakle oi page-e jay, na thakle "শীঘ্রই আসছে"
function ServiceLink({ item, onDone, soon }) {
  if (!item.url) {
    return <button type="button" onClick={() => soon(item.label, `"${item.label}" সেবাটি শীঘ্রই চালু হবে।`)}>{item.label}</button>;
  }
  if (item.url.startsWith('/')) return <Link to={item.url} onClick={onDone}>{item.label}</Link>;
  return <a href={item.url} onClick={onDone}>{item.label}</a>;
}

function InstitutionModal({ inst, unionName, onClose }) {
  const count = inst.count ?? (inst.names.length || null);
  return (
    <Modal title="প্রতিষ্ঠানের তথ্য" onClose={onClose} width={460}>
      <div className="inst">
        <span className="inst-ico"><Ico name={inst.icon} size={30} /></span>
        <h3>{inst.label}</h3>
        {count != null ? (
          <>
            <div className="inst-count hp-serif">{bn(count)}<small> টি</small></div>
            <p><b>{unionName}</b>-এ মোট <b>{bn(count)} টি</b> {inst.label} রয়েছে।</p>
          </>
        ) : (
          <p className="hp-soon">এই তথ্য শীঘ্রই যুক্ত করা হবে।</p>
        )}
        {inst.names.length > 0 && (
          <ol className="inst-names">
            {inst.names.map((n, i) => <li key={i}>{n}</li>)}
          </ol>
        )}
      </div>
      <footer className="dialog-foot single">
        <button className="btn btn-solid" onClick={onClose} autoFocus>বন্ধ করুন</button>
      </footer>
    </Modal>
  );
}

function Card({ id, tone = 'green', icon, title, wide, children }) {
  return (
    <section id={id} className={`hp-card reveal ${wide ? 'wide' : ''}`}>
      <h2 className="hp-card-title hp-serif">
        <span className={`hp-tile t-${tone}`}>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function DataList({ data, items, empty, row }) {
  const [all, setAll] = useState(false);
  if (data.status === 'loading') return <ul className="hp-list">{[0, 1, 2].map((i) => <li key={i}><i className="hp-skel" /></li>)}</ul>;
  if (data.status === 'error') return <p className="hp-soon">তথ্য লোড করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।</p>;
  if (!items?.length) return <p className="hp-soon">{empty}</p>;
  const shown = all ? items : items.slice(0, 6);
  return (
    <>
      <ul className="hp-list">{shown.map((it) => <li key={it.id}>{row(it)}</li>)}</ul>
      {items.length > 6 && (
        <button className="hp-linkbtn" onClick={() => setAll((v) => !v)}>
          {all ? 'কম দেখুন' : `আরও ${bn(items.length - 6)} টি দেখুন`}
        </button>
      )}
    </>
  );
}

function Glance({ icon, label, value, text, loading }) {
  return (
    <div className="hp-gl">
      <span className="hp-gl-ico">{icon}</span>
      <strong className="hp-serif">{text ?? (loading ? '…' : <Count to={value} />)}</strong>
      <small>{label}</small>
    </div>
  );
}

function Count({ to }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (to == null) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) { setV(to); return; }
    let raf; let started = false;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started) return;
      started = true; io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1400);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{to == null ? '—' : bn(v)}</span>;
}

// Nodir dhare shobuj gram-er illustration (kono image file lage na)
function HeroArt() {
  const treesBack = Array.from({ length: 34 }, (_, i) => ({ cx: i * 44 - 20, rx: 30 + ((i * 7) % 20), ry: 40 + ((i * 11) % 34) }));
  const treesFront = Array.from({ length: 30 }, (_, i) => ({ cx: i * 50 + ((i * 13) % 18), rx: 28 + ((i * 5) % 22), ry: 36 + ((i * 17) % 30) }));
  const reeds = Array.from({ length: 44 }, (_, i) => {
    const left = i < 22;
    const x = left ? i * 16 : 1090 + (i - 22) * 16 + ((i * 7) % 9);
    return { x, h: 80 + ((i * 29) % 90), lean: ((i * 13) % 34) - 17, cat: i % 4 === 0 };
  });
  const wave = (n) => `M0 0${' q30 -6 60 0 t60 0'.repeat(n)}`;
  return (
    <svg className="hp-art" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="hpSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#08362a" /><stop offset=".42" stopColor="#1a8560" />
          <stop offset=".78" stopColor="#92d0a1" /><stop offset="1" stopColor="#f4de9f" />
        </linearGradient>
        <radialGradient id="hpGlow"><stop offset="0" stopColor="#fff3bd" stopOpacity=".95" /><stop offset="1" stopColor="#fff3bd" stopOpacity="0" /></radialGradient>
        <linearGradient id="hpRiver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#58c2a4" /><stop offset="1" stopColor="#0d6558" /></linearGradient>
      </defs>
      <rect width="1440" height="560" fill="url(#hpSky)" />
      <circle cx="720" cy="372" r="250" fill="url(#hpGlow)" />
      <circle cx="720" cy="372" r="46" fill="#fff1b4" />
      <g stroke="#e9f7ee" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" className="hp-birds">
        <path d="M250 150q10-9 20 0q10-9 20 0" /><path d="M300 120q8-7 16 0q8-7 16 0" /><path d="M1130 170q10-9 20 0q10-9 20 0" />
      </g>
      <g fill="#3b9d74" opacity=".7">{treesBack.map((t, i) => <ellipse key={i} cx={t.cx} cy={372 - t.ry * 0.3} rx={t.rx} ry={t.ry} />)}</g>
      <g fill="#14604a">{treesFront.map((t, i) => <ellipse key={i} cx={t.cx} cy={384 - t.ry * 0.25} rx={t.rx} ry={t.ry * 0.85} />)}</g>
      <rect y="380" width="1440" height="110" fill="url(#hpRiver)" />
      <ellipse cx="720" cy="408" rx="70" ry="6" fill="#fff1b4" opacity=".55" />
      <ellipse cx="720" cy="426" rx="40" ry="4" fill="#fff1b4" opacity=".35" />
      <g fill="none" stroke="#fff" strokeLinecap="round">
        <g transform="translate(-120 402)"><path className="hp-ripple r1" d={wave(34)} strokeWidth="2" opacity=".28" /></g>
        <g transform="translate(-120 432)"><path className="hp-ripple r2" d={wave(34)} strokeWidth="2.4" opacity=".2" /></g>
        <g transform="translate(-120 460)"><path className="hp-ripple r3" d={wave(34)} strokeWidth="2.8" opacity=".16" /></g>
      </g>
      <g transform="translate(960 432)"><g className="hp-boat">
        <path d="M0 0q70 28 140 0l-12-13h-116z" fill="#082c22" />
        <path d="M34-13q36-36 72 0z" fill="#082c22" />
        <path d="M122-10L172-46" stroke="#082c22" strokeWidth="3" />
      </g></g>
      <path d="M0 486Q300 458 600 480T1200 474T1440 484V560H0Z" fill="#0b4031" />
      <path d="M0 524Q400 498 800 518T1440 508V560H0Z" fill="#06281f" />
      <g className="hp-reeds" fill="none" stroke="#06281f" strokeWidth="2.2" strokeLinecap="round">
        {reeds.map((r, i) => (
          <g key={i} style={{ animationDelay: `${(i % 7) * 0.35}s` }}>
            <path d={`M${r.x} 560q${r.lean} ${-r.h / 2} ${r.lean * 1.4} ${-r.h}`} />
            {r.cat && <ellipse cx={r.x + r.lean * 1.4} cy={560 - r.h - 8} rx="3.4" ry="11" fill="#3b2a1a" stroke="none" />}
          </g>
        ))}
      </g>
    </svg>
  );
}
