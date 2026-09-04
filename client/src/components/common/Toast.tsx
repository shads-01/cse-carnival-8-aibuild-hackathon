import React from 'react';
import { useToastStore, ToastItem } from '../../store/toastStore';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const toastIcons = {
  success: <CheckCircle size={18} style={{ color: 'var(--success)' }} />,
  error: <AlertCircle size={18} style={{ color: 'var(--danger)' }} />,
  warning: <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />,
  info: <Info size={18} style={{ color: 'var(--info)' }} />
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast: ToastItem) => (
        <div
          key={toast.id}
          className="glass-elevated animate-slide-up"
          role="status"
          aria-live="polite"
          style={{
            pointerEvents: 'auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            borderLeft: `4px solid var(--${toast.type})`,
            boxShadow: 'var(--shadow-elevated)'
          }}
        >
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            {toastIcons[toast.type]}
          </div>

          <div style={{ flex: 1 }}>
            {toast.title && (
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {toast.title}
              </div>
            )}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: toast.title ? '2px' : 0 }}>
              {toast.message}
            </div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </aside>
  );
};
