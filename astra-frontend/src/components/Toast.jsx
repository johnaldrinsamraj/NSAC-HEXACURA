import { useAstra } from '../hooks/useAstra.jsx';

export function Toast() {
  const { toast, dismissToast } = useAstra();
  if (!toast) return null;

  const colors = {
    info: 'border-astra-cyan/50 bg-astra-cyan/10 text-astra-cyan',
    success: 'border-astra-green/50 bg-astra-green/10 text-astra-green',
    warning: 'border-astra-amber/50 bg-astra-amber/10 text-astra-amber',
    error: 'border-astra-red/50 bg-astra-red/10 text-astra-red',
  };

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg border backdrop-blur-md shadow-2xl animate-slide-in ${colors[toast.type] || colors.info}`}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold">{toast.message || 'Notification'}</p>
      </div>
      <button
        onClick={dismissToast}
        className="text-current opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
