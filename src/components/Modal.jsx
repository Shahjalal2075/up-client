import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TriangleAlert, Loader2, Check } from 'lucide-react';

export function Modal({ title, onClose, children, locked = false, width = 520 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !locked && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, locked]);

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !locked && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        {title && (
          <header className="modal-head">
            <h2>{title}</h2>
            <button className="icon-btn" onClick={onClose} disabled={locked} aria-label="বন্ধ করুন"><X size={20} /></button>
          </header>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

// tone: 'danger' | 'warn' | 'ok'
export function ConfirmModal({ tone = 'danger', title, message, confirmLabel, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} locked={busy} width={430}>
      <div className="dialog-body">
        <span className={`dialog-icon tone-${tone}`}><TriangleAlert size={30} /></span>
        <h2>{title}</h2>
        <p>{message}</p>
        {error && <div className="alert" role="alert">{error}</div>}
      </div>
      <footer className="dialog-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>বাতিল</button>
        <button className={`btn btn-${tone}`} onClick={run} disabled={busy}>
          {busy ? <Loader2 size={18} className="spin" /> : null} {confirmLabel}
        </button>
      </footer>
    </Modal>
  );
}

export function SuccessModal({ message, onClose }) {
  return (
    <Modal onClose={onClose} width={400}>
      <div className="dialog-body">
        <span className="success-mark"><Check size={38} strokeWidth={3} /></span>
        <h2>সফল হয়েছে</h2>
        <p>{message}</p>
      </div>
      <footer className="dialog-foot single">
        <button className="btn btn-solid" onClick={onClose} autoFocus>ঠিক আছে</button>
      </footer>
    </Modal>
  );
}
