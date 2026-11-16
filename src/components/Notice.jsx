import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SearchX, ShieldAlert, Info } from 'lucide-react';
import { Modal } from './Modal';

// Global popup message (404, access denied ...). Redirect-er pore-o dekha jay, karon provider Routes-er upore.
export const NOT_FOUND = {
  icon: 'notfound',
  title: '404 – Not Found',
  message: 'দুঃখিত, আপনি যে পেজটি খুঁজছেন সেটি পাওয়া যায়নি।',
};
export const FORBIDDEN = {
  icon: 'forbidden',
  title: 'অ্যাক্সেস নেই',
  message: 'এই পেজে আপনার অ্যাক্সেস নেই।',
};

export const INFO = (title, message) => ({ icon: 'info', title, message });

const NoticeContext = createContext(null);
export const useNotice = () => useContext(NoticeContext);

export function NoticeProvider({ children }) {
  const [notice, setNotice] = useState(null);
  const notify = useCallback((n) => setNotice(n), []);
  const close = useCallback(() => setNotice(null), []);
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NoticeContext.Provider value={value}>
      {children}
      {notice && (
        <Modal onClose={close} width={400}>
          <div className="dialog-body">
            <span className={`dialog-icon ${notice.icon === 'info' ? 'tone-ok' : 'tone-warn'}`}>
              {notice.icon === 'forbidden' ? <ShieldAlert size={30} /> : notice.icon === 'info' ? <Info size={30} /> : <SearchX size={30} />}
            </span>
            <h2>{notice.title}</h2>
            <p>{notice.message}</p>
          </div>
          <footer className="dialog-foot single">
            <button className="btn btn-solid" onClick={close} autoFocus>ঠিক আছে</button>
          </footer>
        </Modal>
      )}
    </NoticeContext.Provider>
  );
}

export function RedirectWithNotice({ to, notice }) {
  const { notify } = useNotice();
  useEffect(() => { notify(notice); }, [notify, notice]);
  return <Navigate to={to} replace />;
}

// Kono route match na korle: `to`-te pathay + 404 popup dekhay
export const NotFound = ({ to }) => <RedirectWithNotice to={to} notice={NOT_FOUND} />;
