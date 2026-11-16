# Up Admin (Main Admin Site)

React (JSX, Vite). Hosting: **Vercel**.
API er jonno alada project: `up-server`.

## Ekhon ki ache
- Login page, Dashboard, Sidebar (12 ta menu), Logout
- Role onujayi menu dekhano ar route guard
- Baki page gulo "ComingSoon" placeholder

## Role access (`src/config/menu.js`)
| Role | Access |
|---|---|
| Super Admin / Admin | Sob page |
| Moderator / Printer | Dashboard + ডিজিটাল নেমপ্লেট |
| Accounting | Dashboard only |

Notun page: `MENU`-te ekta line add koro, tarpor `src/pages/`-e component banao.
Backend-er `up-server/src/config/roles.js`-er sathe rule mil rakhte hobe.

## Local run
```bash
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```
Age `up-server` chalu thakte hobe.

## Vercel deploy
1. Ei folder GitHub-e alada repo hisabe push koro.
2. Vercel → **Add New Project** → repo select (Framework: Vite auto).
3. Environment Variable: `VITE_API_URL` = `https://<name>.onrender.com/api`
4. Deploy. Tarpor Vercel URL `up-server`-er Render `CLIENT_URL`-e boshao.

`vercel.json` ache, tai refresh dileo 404 hobe na.

## Design
Colors/fonts `src/styles.css`-er shurute `:root`-e. Font: Hind Siliguri.

## Users page (`/users`)
Notun ইউজার তৈরি, এডিট (username change hoy na), একটিভ/ইনঅ্যাক্টিভ, ডিলিট. Protita action-e confirmation ar success popup ache.
Eta kaj korte `up-server`-er notun version (users API) chalu thakte hobe.

## গ্রাম ভিত্তিক তথ্য ও মসজিদ তথ্য
`src/pages/Villages.jsx` ar `Mosques.jsx` — protita ekta config. Common logic `src/components/CrudPage.jsx`-e.
Ward-er songkha `src/config/wards.js`-e (ekhon 9). Mobile number-e Bangla digit dilao cholbe.

## Routes
| URL | Kaj |
|---|---|
| `http://localhost:5173/` | Public homepage (ekhon sudhu "স্বাগতম"; `src/pages/Home.jsx`) |
| `http://localhost:5173/admin` | Admin dashboard (login na thakle `/admin/login`) |
| `/admin/users`, `/admin/holdings` ... | Admin-er baki page |
| Onno kono route (jemon `/abc`) | Homepage-e pathay + "404 Not Found" popup |
| `/admin/vul-route` | `/admin`-e pathay + 404 popup |

Notun admin page: `src/config/menu.js`-e path `/admin/<name>` diye ekta line add koro.

## Public homepage
`src/pages/Home.jsx` (design) + `src/home.css`. Shob likha `src/config/homeContent.js`-e — ekhane text bodlalei homepage bodle jay.
গ্রাম/মসজিদ list ar "এক নজরে" number `up-server`-er `GET /api/public/overview` theke ashe (mobile number public hoy na).
Chairman-er chobi: `homeContent.js`-e `chairman.photo` e link boshao. Helpline number: `contact.phone`.

## ইউপি সেটিংস (`/admin/settings`)
Homepage-er shob static text ekhan theke edit kora jay: ইউনিয়নের নাম, ট্যাগলাইন, নোটিশ, চেয়ারম্যান, ইতিহাস, ভৌগলিক তথ্য,
header-er "সেবা সমূহ" dropdown (link soho), সেবা card, প্রকল্প, উদ্যোক্তা, সরকারি অফিস (link → new tab), অন্যান্য প্রতিষ্ঠান (count/list → popup).
Data `settings` table-e (`site_content`, `union_name`) save hoy. API na pelo `src/config/homeContent.js`-er default dekhay.
Notun icon lagle: `src/config/icons.jsx` ar backend `siteDefaults.js`-er `ICON_KEYS`-e add koro.

## কৃষি সনদ আবেদন
- `/admin/agriculture-certificates` — তালিকা (২০ টি করে, সনদ নং/নাম/NID/মোবাইল দিয়ে সার্চ, প্রিন্ট, ডিলিট)
- `/admin/agriculture-certificates/new` — আবেদন ফরম → submit করলে সনদ তৈরি
- `/admin/agriculture-certificates/:id` — সনদ (প্রিন্ট / PDF ডাউনলোড / নতুন আবেদন; উপরের বারে সনদ নং/NID/মোবাইল দিয়ে খোঁজা)
- সনদের design: `src/components/Certificate.jsx` + `src/certificate.css` (A4, ৭৯৪×১১২২px). Logo/seal: `src/assets/cert/`.
- সনদের QR → `/?verify=<সনদ নং>` (homepage-e যাচাই popup). হেডার/স্বাক্ষর/ফুটারের লেখা: ইউপি সেটিংস → সনদ।
- নতুন dependency: `qrcode`, `html2canvas`, `jspdf` → `npm install` আবার চালাও।

## ওয়ারিশ সনদ আবেদন
- `/admin/warish-certificates` (তালিকা) · `/new` (আবেদন ফরম, একাধিক ওয়ারিশ) · `/:id` (সনদ: প্রিন্ট/PDF/নতুন আবেদন)
- Design: `src/components/WarishCertificate.jsx` (+ common frame `CertFrame.jsx`). স্থির লেখা: ইউপি সেটিংস → সনদ।
- সার্চ: সনদ নং / মৃতের NID / যেকোনো ওয়ারিশের NID। QR → `/?verify=<নং>&t=warish`।

## নাগরিক সনদ আবেদন
- `/admin/citizen-certificates` (তালিকা) · `/new` · `/:id` — কৃষি প্রত্যয়নপত্রের মতো একই ফরম; design `src/components/CitizenCertificate.jsx`
- ফরম/ভিউ common: `PersonCertForm.jsx`, `PersonCertView.jsx` (কৃষি ও নাগরিক duitai ei duita use kore)
- ঘোষণা বাক্য: ইউপি সেটিংস → সনদ। QR → `/?verify=<নং>&t=citizen`

## ট্রেড লাইসেন্স
- `/admin/trade-licenses` (সকল নিবন্ধিত তালিকা) · `/new` (এন্ট্রি ফরম, মালিকের ছবি) · `/:id` (সনদ: প্রিন্ট/PDF/তালিকা দেখুন)
- Design `src/components/TradeCertificate.jsx`. লাইসেন্স নং ফাঁকা রাখলে অটো (সাল + ১০ সংখ্যা)। সর্বমোট = ফি/কর যোগফল।
- মালিকের ছবি ছোট করে নিজের database-এই থাকে (ImgBB-তে যায় না)। অনুমতির বাক্য/দ্বিতীয় স্বাক্ষরকারী: ইউপি সেটিংস → সনদ।
- QR → `/?verify=<লাইসেন্স নং>&t=trade` (মেয়াদ শেষ হলে popup-এ তা-ও জানায়)

## সবার জন্য খোলা আবেদন (login ছাড়া)
- খোলা: `/admin/<type>/new` (আবেদন ফরম) ও `/admin/<type>/<key>` (নিজের সনদ দেখা/প্রিন্ট/PDF) — type: `citizen-certificates`, `agriculture-certificates`, `warish-certificates`, `trade-licenses`
- শুধু Super Admin/Admin: তালিকা (`/admin/<type>`), ডিলিট, NID/মোবাইল দিয়ে খোঁজা
- সনদের লিংকে sequential id নয়, অনুমান-অযোগ্য `key` থাকে। Public সার্চে শুধু সনদ নম্বর চলে (trade license-এ public সার্চ নেই)।
- একই NID / জন্ম নিবন্ধন / মোবাইল দিয়ে একই সনদে দ্বিতীয় আবেদন আটকানো (ওয়ারিশে: মৃতের NID/BRN)।
- Homepage-er "সেবা সমূহ" menu-r link ei `/new` page gulo (ইউপি সেটিংস → সেবা theke bodlano jay).

## ডিজিটাল নেমপ্লেট (`/admin/holdings`)
- তালিকা (২০ টি করে, নাম/হোল্ডিং/গ্রাম/মোবাইল সার্চ) · "+ নতুন হোল্ডিং যুক্ত করুন" → popup ফরম (এডিটেও একই popup)
- Action: সনদ প্রিন্ট · নম্বর প্লেট প্রিন্ট · এডিট · ডিলিট
- সনদ `/admin/holdings/:id/certificate`, প্লেট `/admin/holdings/:id/plate` (`?print=1` দিলে নিজে প্রিন্ট ডায়ালগ)
- Design: `src/components/HoldingCertificate.jsx`, `HoldingPlate.jsx` + `src/holdingDocs.css`. প্লেটের লেখা (ইমার্জেন্সি নম্বর, স্লোগান): ইউপি সেটিংস → সনদ।
- ড্রপডাউন তালিকা `src/config/holdingOptions.js` (backend-er সাথে মিল রাখো)
- Permission: Printer = দেখা/প্রিন্ট; Moderator = + যোগ/এডিট; Admin/Super Admin = + ডিলিট

## Role onujayi dashboard ও হোল্ডিং visibility
- **Moderator:** শুধু নিজের যোগ করা হোল্ডিং দেখে/এডিট/প্রিন্ট করে। Dashboard: আজ / গত ৭ দিন / চলতি মাস / মোট + তারিখ বেছে সেদিনের সংখ্যা ও তালিকা। (মোট হোল্ডিং/ট্যাক্স কার্ড নেই)
- **Admin/Super Admin:** আগের ড্যাশবোর্ড + নিচে "আজ মোট যোগ" ও মডারেটর অনুযায়ী তালিকা (তারিখ ফিল্টার: from–to + আজ/গতকাল/গত ৭ দিন/চলতি মাস; সর্ট: সংখ্যা/নাম/সর্বশেষ যোগ, উল্টানো যায়)
- **Printer:** মোট হোল্ডিং + নিজে মোট কতবার প্রিন্ট ও ডাউনলোড (সনদ/প্লেট আলাদা)। তালিকায় সনদ/প্লেট বাটনে hover করলে ওই হোল্ডিংয়ের প্রিন্ট/ডাউনলোড সংখ্যা।
- **Accounting:** আগের মতো ট্যাক্সের ড্যাশবোর্ড
- নোটিশ বোর্ড পেজ বাদ (নোটিশ এখন ইউপি সেটিংস → সাধারণ)। Admin, Super Admin-er account Users page-e dekhe na.

## মডারেটর পেমেন্ট (প্রতি ডাটা এন্ট্রিতে চার্জ)
- মডারেটর প্রতিটি হোল্ডিং এন্ট্রির জন্য নির্দিষ্ট টাকা (ডিফল্ট ৳১৫০) দেয়। Rate: **পেমেন্ট সেটিংস** পেজ (`/admin/payment-settings`), সঙ্গে বিকাশ/নগদ নম্বর।
- মডারেটর ড্যাশবোর্ডে: কাজের সংখ্যা, মোট প্রদেয়, পরিশোধিত, অপেক্ষমাণ, বকেয়া, **Pay Now** (মাধ্যম, কোন নম্বর থেকে, ট্রানজেকশন আইডি, টাকা → pending)। তারিখ বেছে সেদিনের কাজ/প্রদেয়/পরিশোধ/বাকি।
- **পেমেন্ট অনুমোদন** পেজ (`/admin/payment-approvals`): শুধু Accounting যাচাই করে approve/reject (reject-এ কারণ লাগে)। Approve হলেই বকেয়া কমে।
- **মডারেটর হিসাব** পেজ (`/admin/moderator-accounts`): কে কতগুলো যোগ করেছে, সর্বশেষ কাজ, বকেয়া (না থাকলে "সব পরিশোধিত")।
- Accounting ড্যাশবোর্ড: "আজকের হিসাব" = গতকালের কাজ, + সর্বমোট হিসাব।
- **নিয়ম:** আজকের আগের কোনো দিনের বকেয়া অনুমোদিত না হলে মডারেটর নতুন হোল্ডিং যোগ করতে পারে না। (Pending পেমেন্ট বকেয়া কমায় না।)
- পেমেন্ট FIFO: পুরনো দিনের বকেয়া আগে মেটে।

## ট্যাক্স আদায় (`/admin/tax-collection`) — শুধু Admin ও Super Admin
- উপরে কার্ড: চলতি মাস / চলতি বছর / মোট আদায়। সার্চ (হোল্ডিং নম্বর, নাম, গ্রাম, মোবাইল) → কার্ডে বকেয়া বছর ও মোট বকেয়া; বাকি না থাকলে "সব পরিশোধিত" + সর্বশেষ কর বছর। আদায়ের তারিখ দিয়ে **Mark as Paid**।
- কর-বছর = ক্যালেন্ডার বছর। গণনা শুরু হোল্ডিং যে বছর এন্ট্রি হয়েছে সেই বছর থেকে; এক বছরের কর দিলে পরের বছর থেকে আবার গণনা। একাধিক বছর বাকি থাকলে সব বছরের কর একসাথে দিতে হয়।
- নিচে আদায়ের ইতিহাস: তারিখ ফিল্টার, সার্চ, সর্ট (সময় / হোল্ডিং নম্বর), ২০ টি করে পেজ।
- ডিজিটাল হোল্ডিং পেজেও সর্ট: তারিখ / হোল্ডিং নম্বর (03/264 < 389 — সংখ্যার হিসাবে)।

## খরচ হিসাব (`/admin/expenses`) — শুধু Accounting
মডারেটরকে কত টাকা কী উদ্দেশ্যে দেওয়া হয়েছে যোগ করা যায়। মোট / দৈনিক / সাপ্তাহিক (শনি–শুক্র) হিসাব + তারিখ ও মডারেটর ফিল্টার।

## QR কোড
- কৃষি, নাগরিক, ওয়ারিশ, ট্রেড লাইসেন্স সনদের QR স্ক্যান করলে **ওই সনদটিই** খোলে।
- হোল্ডিং সনদ ও নম্বর প্লেট — দুটোর QR-ই হোল্ডিংয়ের সনদ (বিস্তারিত তথ্য) পেজ খোলে (`/admin/holdings/view/<key>`)।
- সনদ/প্লেটে ছাপা ওয়েবসাইট লেখা ফাঁকা থাকলে এই সাইটের নিজের ঠিকানা বসে (পুরনো digitalup/upsheba লিংক আর নেই)।

> খরচ হিসাব, মডারেটর হিসাব, পেমেন্ট অনুমোদন ও পেমেন্ট সেটিংস — এই ৪টি পেজ **শুধু Accounting** রোলের (Admin/Super Admin-er na). ট্যাক্স আদায়: শুধু Admin + Super Admin.

## ইউনিয়নের নাম ও লোগো
- নাম: **৩নং পিলজংগ ইউনিয়ন পরিষদ** (ইউপি সেটিংস → সাধারণ থেকেও বদলানো যায়)। `db:init` চালালে আগে সেভ করা পুরনো নামও বদলে যায়।
- লোগো: একটাই — হোমপেজ, লগইন, সাইডবার, সব সনদ, হোল্ডিং সনদ ও নম্বর প্লেটে। ডিফল্ট `src/assets/logo.jpg`; ইউপি সেটিংস → সাধারণ → "লোগো আপলোড করুন" দিলে সেটাই সব জায়গায় বসে।

## মডারেটরের আয় (প্রতি এন্ট্রিতে ৳১৭) ও উত্তোলন
- মডারেটর প্রতিটি হোল্ডিং এন্ট্রির জন্য আয় পায় (ডিফল্ট ৳১৭; **পেমেন্ট সেটিংস**-এ অ্যাকাউন্টিং বদলায়, শুধু নতুন এন্ট্রিতে প্রযোজ্য)। এটা আগের "প্রতি এন্ট্রিতে ইউনিয়নকে ৳১৫০ দেওয়া"-র হিসাব থেকে আলাদা — দুটোই চলে।
- মডারেটর ড্যাশবোর্ড "আমার আয়": বর্তমান ব্যালেন্স, পেন্ডিং ব্যালেন্স (অনুমোদন হয়নি এমন উত্তোলন অনুরোধ), মোট উত্তোলন, **Withdraw** বাটন (টাকা, বিকাশ/নগদ, নম্বর) ও উত্তোলনের ইতিহাস।
- **উত্তোলন অনুরোধ** পেজ (`/admin/withdraw-requests`, শুধু Accounting): approve করতে ট্রানজেকশন আইডি লাগে; reject-এ কারণ লাগে। Reject হলে টাকা ব্যালেন্সে ফিরে যায়।
- পেমেন্ট সেটিংসে **উত্তোলন চালু/বন্ধ** সুইচ (ডিফল্ট বন্ধ)। বন্ধ থাকলে Withdraw দেওয়া যায় না।

## ডিজিটাল হোল্ডিং: তারিখ ফিল্টার ও বাল্ক ডাউনলোড
- নতুন "যোগের তারিখ" কলাম + তারিখ (থেকে–পর্যন্ত) ফিল্টার।
- Printer, Admin, Super Admin: চেকবক্সে একাধিক নির্বাচন; হেডার চেকবক্সে এই পেজের সব; "ফিল্টার অনুযায়ী সব N টি নির্বাচন" (সর্বোচ্চ ১০০০)। তারপর "সনদ ডাউনলোড" বা "নম্বর প্লেট ডাউনলোড" → PDF (সনদ ১ পেজে ১টি; প্লেট ১ পেজে ২টি; বড় হলে কয়েকটি ফাইলে ভাগ)। ডাউনলোডগুলো printer-er count-e ধরা হয়।
- ব্রাউজারেই তৈরি হয় (প্রতিটি ~১ সেকেন্ড), তাই বেশি হলে সময় লাগে।

## খরচ হিসাব ও মডারেটর হিসাব
- খরচে "কাকে দিয়েছেন" ঐচ্ছিক: মডারেটর বাছা অথবা নিজে নাম লেখা (দুটোই ফাঁকা রাখা যায়)।
- মডারেটর হিসাব পেজে নাম/ইউজারনেম দিয়ে সার্চ।

## ডিজিটাল হোল্ডিং: পেজ সাইজ
তালিকার নিচে (ও উপরে) "প্রতি পেজে" ড্রপডাউন: ২০ / ৫০ / ১০০ / ৫০০ / ১০০০। ডিফল্ট ২০; পেজ রিলোড দিলে আবার ২০ (সংরক্ষণ হয় না)।

## মডারেটরের ডাটা এন্ট্রি: অ্যাকাউন্টিংয়ের দুটি সুইচ (পেমেন্ট সেটিংস → "ডাটা এন্ট্রি নিয়ন্ত্রণ")
1. **আগের দিনের পেমেন্ট বাধ্যতামূলক** — চালু: আগের দিনের পেমেন্ট অনুমোদিত না হলে মডারেটর নতুন ডাটা যোগ করতে পারে না (আগের নিয়ম)। বন্ধ: পেমেন্ট হয়েছে কি না কোনো চেক ছাড়াই সবসময় যোগ করতে পারে।
2. **ডাটা এন্ট্রি চালু** — বন্ধ করলে কোনো মডারেটরই ডাটা যোগ করতে পারে না; শুধু Admin ও Super Admin পারে। (ডিফল্ট দুটোই চালু)

## ডিজিটাল হোল্ডিং: ওয়ার্ড ফিল্টার ও রেসপন্সিভ
- নতুন **ওয়ার্ড** ড্রপডাউন ফিল্টার (সব ওয়ার্ড / ১ নং … )। সার্চ, তারিখ, সর্টের সঙ্গে একসাথে কাজ করে; "ফিল্টার অনুযায়ী সব নির্বাচন" ও বাল্ক প্রিন্টেও এই ফিল্টার মানে।
- ফিল্টারগুলো এখন গ্রিডে সাজানো (ফোনে ২ কলাম); ফোনে (৭৬০px-এর নিচে) টেবিল কার্ডে বদলে যায়: প্রতিটি হোল্ডিং একটি কার্ড, অ্যাকশন বাটন বড়।
