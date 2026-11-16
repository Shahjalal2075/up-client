import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { NoticeProvider, NotFound } from './components/Notice';
import { GuestOnly, RequireAuth, RequireRole } from './components/Guards';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ComingSoon from './pages/ComingSoon';
import Users from './pages/Users';
import Villages from './pages/Villages';
import Mosques from './pages/Mosques';
import Settings from './pages/Settings';
import AgriList from './pages/agri/AgriList';
import AgriNew from './pages/agri/AgriNew';
import AgriView from './pages/agri/AgriView';
import CitizenList from './pages/citizen/CitizenList';
import CitizenNew from './pages/citizen/CitizenNew';
import CitizenView from './pages/citizen/CitizenView';
import TradeList from './pages/trade/TradeList';
import TradeNew from './pages/trade/TradeNew';
import TradeView from './pages/trade/TradeView';
import HoldingsList from './pages/holdings/HoldingsList';
import ModeratorAccounts from './pages/payments/ModeratorAccounts';
import PaymentApprovals from './pages/payments/PaymentApprovals';
import PaymentSettings from './pages/payments/PaymentSettings';
import WithdrawRequests from './pages/payments/WithdrawRequests';
import HoldingPrint from './pages/holdings/HoldingPrint';
import HoldingPublic from './pages/holdings/HoldingPublic';
import TaxCollection from './pages/tax/TaxCollection';
import Expenses from './pages/expenses/Expenses';
import WarishList from './pages/warish/WarishList';
import WarishNew from './pages/warish/WarishNew';
import WarishView from './pages/warish/WarishView';
import { MENU, ADMIN_BASE } from './config/menu';
import HoldingPrintAll from './pages/holdings/HoldingPrintAll';

// Je page ready, ekhane boshao. Baki gulo ComingSoon dekhabe.
const PAGES = { users: Users, 'village-info': Villages, 'mosque-info': Mosques, settings: Settings, 'agriculture-certificates': AgriList, 'warish-certificates': WarishList, 'citizen-certificates': CitizenList, 'trade-licenses': TradeList, holdings: HoldingsList, 'tax-collection': TaxCollection, expenses: Expenses,
  'moderator-accounts': ModeratorAccounts, 'payment-approvals': PaymentApprovals, 'payment-settings': PaymentSettings, 'withdraw-requests': WithdrawRequests };
const HOLDING_ROLES = MENU.find((m) => m.key === 'holdings').roles;

function PageFor({ item }) {
  const Page = PAGES[item.key];
  return Page ? <Page /> : <ComingSoon title={item.label} />;
}

export default function App() {
  return (
    <AuthProvider>
      <NoticeProvider>
        <Routes>
          {/* Public homepage */}
          <Route path="/" element={<Home />} />

          {/* Admin panel: shob kichu /admin-er moddhe */}
          <Route path={ADMIN_BASE}>
            <Route element={<GuestOnly />}>
              <Route path="login" element={<Login />} />
            </Route>

            {/* আবেদন ফরম ও নিজের সনদ: সবার জন্য খোলা (login লাগে না). তালিকা পেজ নিচে — শুধু Admin */}
            <Route path="agriculture-certificates/new" element={<AgriNew />} />
            <Route path="agriculture-certificates/:key" element={<AgriView />} />
            <Route path="citizen-certificates/new" element={<CitizenNew />} />
            <Route path="citizen-certificates/:key" element={<CitizenView />} />
            <Route path="trade-licenses/new" element={<TradeNew />} />
            <Route path="trade-licenses/:key" element={<TradeView />} />
            <Route path="warish-certificates/new" element={<WarishNew />} />
            <Route path="warish-certificates/:key" element={<WarishView />} />

            {/* হোল্ডিং সনদ/প্লেটের QR: সবার জন্য */}
            <Route path="holdings/view/:key" element={<HoldingPublic />} />

            <Route element={<RequireAuth />}>
              {/* হোল্ডিং সনদ/প্লেট প্রিন্ট: লগইন করা কর্মী (Admin, Moderator, Printer) */}
              <Route path="holdings/:id/certificate" element={<RequireRole roles={HOLDING_ROLES}><HoldingPrint kind="certificate" /></RequireRole>} />
              <Route path="holdings/:id/plate" element={<RequireRole roles={HOLDING_ROLES}><HoldingPrint kind="plate" /></RequireRole>} />
              <Route path="holdings/print-all" element={<RequireRole roles={HOLDING_ROLES}><HoldingPrintAll kind="plate"/></RequireRole>} />

              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                {MENU.filter((m) => m.path !== ADMIN_BASE).map((m) => (
                  <Route
                    key={m.key}
                    path={m.path.slice(ADMIN_BASE.length + 1)}
                    element={
                      <RequireRole roles={m.roles}>
                        <PageFor item={m} />
                      </RequireRole>
                    }
                  />
                ))}
              </Route>
            </Route>

            {/* /admin/vul-route -> /admin e (login na thakle login-e) + 404 popup */}
            <Route path="*" element={<NotFound to={ADMIN_BASE} />} />
          </Route>

          {/* /admin chhara kono route -> homepage + 404 popup */}
          <Route path="*" element={<NotFound to="/" />} />
        </Routes>
      </NoticeProvider>
    </AuthProvider>
  );
}
