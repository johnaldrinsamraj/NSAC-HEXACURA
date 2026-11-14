export function MetricCard({ label, value, unit, status, trend, icon, onClick }) {
  const statusColors = {
    normal: 'border-l-astra-green text-astra-green',
    watch: 'border-l-astra-amber text-astra-amber',
    critical: 'border-l-astra-red text-astra-red',
    neutral: 'border-l-astra-cyan/40 text-astra-cyan',
  };

  return (
    <button
      onClick={onClick}
      className={`astra-card group hover:border-astra-cyan/20 hover:shadow-astra-cyan/5 transition-all cursor-pointer
        border-l-4 ${status === 'normal' ? 'border-l-astra-green text-astra-green' :
                    status === 'watch' ? 'border-l-astra-amber text-astra-amber' :
                    status === 'critical' ? 'border-l-astra-red text-astra-red' :
                    'border-l-astra-cyan/40'}`}
    >
      {icon && (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors
          ${status === 'normal' ? 'bg-astra-green/10 text-astra-green group-hover:bg-astra-green/20' :
            status === 'watch' ? 'bg-astra-amber/10 text-astra-amber group-hover:bg-astra-amber/20' :
            status === 'critical' ? 'bg-astra-red/10 text-astra-red group-hover:bg-astra-red/20' :
            'bg-astra-cyan/10 text-astra-cyan group-hover:bg-astra-cyan/20'}`}>
          {icon}
        </div>
      )}
      <div className="astra-metric-label">{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="astra-metric-value">{value ?? '—'}</span>
        {unit && <span className="astra-metric-unit">{unit}</span>}
      </div>
      {trend !== undefined && trend !== null && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-astra-red' : trend < 0 ? 'text-astra-green' : 'text-astra-gray'}`}>
          {trend > 0 ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          ) : trend < 0 ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          ) : null}
          <span>{Math.abs(trend).toFixed(1)}%</span>
          <span className="text-astra-gray/60 ml-1">vs baseline</span>
        </div>
      )}
    </button>
  );
}

export function StatusBadge({ status }) {
  const configs = {
    normal: { label: 'Normal', color: 'bg-astra-green/10 text-astra-green border-astra-green/30' },
    watch: { label: 'Watch', color: 'bg-astra-amber/10 text-astra-amber border-astra-amber/30' },
    critical: { label: 'Critical', color: 'bg-astra-red/10 text-astra-red border-astra-red/30' },
  };
  const cfg = configs[status] || configs.normal;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-display border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.color.split(' ').find(c => c.startsWith('bg-'))?.replace('bg-', 'bg-') || 'bg-astra-green'}`} />
      {cfg.label}
    </span>
  );
}
