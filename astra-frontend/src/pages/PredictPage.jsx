import { useState, useEffect, useCallback } from 'react';
import { useAstra } from '../hooks/useAstra.jsx';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { MetricCard } from '../components/MetricCard';

const METRIC_CONFIG = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'BPM', color: '#38A6E8' },
  { key: 'hrv', label: 'HRV', unit: 'ms', color: '#8B7CF6' },
  { key: 'blood_oxygen', label: 'SpO2', unit: '%SpO2', color: '#34D399' },
  { key: 'body_temp', label: 'Temperature', unit: '°C', color: '#FBBF24' },
  { key: 'sleep_duration', label: 'Sleep', unit: 'hrs', color: '#A99CFF' },
  { key: 'activity_level', label: 'Activity', unit: 'index', color: '#F87171' },
  { key: 'exercise_recovery', label: 'Recovery', unit: 'min', color: '#5CC8FF' },
];

const SEVERITY_CONFIG = {
  critical: {
    color: 'text-astra-red',
    bg: 'bg-astra-red/10',
    border: 'border-astra-red/30',
    dot: 'bg-astra-red',
    label: 'CRITICAL',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2">
        <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        <path d="M12 3v2M12 19v2M5 12H3M21 12h-2" strokeWidth="2.5"/>
      </svg>
    ),
  },
  watch: {
    color: 'text-astra-amber',
    bg: 'bg-astra-amber/10',
    border: 'border-astra-amber/30',
    dot: 'bg-astra-amber',
    label: 'WATCH',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
  },
  normal: {
    color: 'text-astra-green',
    bg: 'bg-astra-green/10',
    border: 'border-astra-green/30',
    dot: 'bg-astra-green',
    label: 'NORMAL',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    ),
  },
};

export function PredictPage() {
  const { currentAstronaut, showToast } = useAstra();
  const [analysis, setAnalysis] = useState(null);
  const [measuring, setMeasuring] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState({
    heart_rate: 65, hrv: 42, blood_oxygen: 98, body_temp: 36.6,
    sleep_duration: 7.2, activity_level: 5.0, exercise_recovery: 25,
  });

  const runDetection = async () => {
    if (!currentAstronaut) {
      showToast('Select an astronaut first', 'warning');
      return;
    }
    setMeasuring(true);
    try {
      const result = await api.detectAnomaly(currentAstronaut.id, selectedMetrics);
      setAnalysis(result);
      setHistory(prev => [{ ...result, timestamp: new Date().toISOString() }, ...prev.slice(0, 19)]);
      showToast(
        result.severity === 'critical' ? 'Critical anomaly detected — alert generated' :
        result.severity === 'watch' ? 'Pattern to monitor detected' :
        'All clear — within personal baseline',
        result.severity === 'critical' ? 'error' : result.severity === 'watch' ? 'warning' : 'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Detection failed', 'error');
    }
    setMeasuring(false);
  };

  // Auto-run on mount with current astronaut's latest measurements
  useEffect(() => {
    if (!currentAstronaut) return;
    api.getMeasurements(currentAstronaut.id, 1).then(m => {
      if (m.length > 0) {
        const latest = m[0];
        setSelectedMetrics({
          heart_rate: latest.heart_rate ?? 65,
          hrv: latest.hrv ?? 42,
          blood_oxygen: latest.blood_oxygen ?? 98,
          body_temp: latest.body_temp ?? 36.6,
          sleep_duration: latest.sleep_duration ?? 7.2,
          activity_level: latest.activity_level ?? 5.0,
          exercise_recovery: latest.exercise_recovery ?? 25,
        });
        api.detectAnomaly(currentAstronaut.id, selectedMetrics).then(result => {
          setAnalysis(result);
          setHistory(prev => [{ ...result, timestamp: new Date().toISOString() }, ...prev.slice(0, 19)]);
        });
      }
    });
  }, [currentAstronaut]);

  const sev = SEVERITY_CONFIG[analysis?.severity] || SEVERITY_CONFIG.normal;

  return (
    <div>
      <PageHeader route="predict" />

      {/* Severity banner */}
      {analysis && (
        <div className={`rounded-xl border-2 p-6 mb-6 transition-all ${sev.bg} ${sev.border} ${sev.color}`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${sev.bg}`}>
              {sev.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-2xl font-display font-bold ${sev.color}`}>{sev.label}</span>
                <span className="text-sm text-astra-gray/70 font-mono">
                  Anomaly Score: {analysis.anomaly_score?.toFixed(3)}
                </span>
              </div>
              <p className="text-sm text-astra-white/80 leading-relaxed">{analysis.explanation}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="astra-card">
            <div className="flex items-center justify-between mb-4">
              <div className="astra-metric-label">Current Readings</div>
              <button
                onClick={runDetection}
                disabled={measuring || !currentAstronaut}
                className="astra-btn-primary flex items-center gap-2 text-xs py-2"
              >
                {measuring ? (
                  <>
                    <div className="w-4 h-4 border-2 border-astra-navy border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    Analyze
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              {METRIC_CONFIG.map(c => (
                <div key={c.key} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <label className="flex-1 text-sm text-astra-gray">{c.label}</label>
                  <input
                    type="number"
                    step={c.key === 'sleep_duration' || c.key === 'activity_level' ? '0.1' : '1'}
                    value={selectedMetrics[c.key] ?? 0}
                    onChange={e => setSelectedMetrics(prev => ({ ...prev, [c.key]: parseFloat(e.target.value) || 0 }))}
                    className="astra-input w-20 text-right font-mono text-sm py-1.5"
                    disabled={measuring}
                  />
                  <span className="text-xs text-astra-gray/60 w-12 text-right">{c.unit}</span>
                </div>
              ))}
            </div>

            {currentAstronaut && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={async () => {
                    try {
                      const latest = await api.getMeasurements(currentAstronaut.id, 1);
                      if (latest.length > 0) {
                        const m = latest[0];
                        setSelectedMetrics({
                          heart_rate: m.heart_rate ?? selectedMetrics.heart_rate,
                          hrv: m.hrv ?? selectedMetrics.hrv,
                          blood_oxygen: m.blood_oxygen ?? selectedMetrics.blood_oxygen,
                          body_temp: m.body_temp ?? selectedMetrics.body_temp,
                          sleep_duration: m.sleep_duration ?? selectedMetrics.sleep_duration,
                          activity_level: m.activity_level ?? selectedMetrics.activity_level,
                          exercise_recovery: m.exercise_recovery ?? selectedMetrics.exercise_recovery,
                        });
                        showToast('Loaded latest telemetry', 'info');
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="astra-btn-ghost text-xs w-full"
                >
                  Load Latest Measurement
                </button>
              </div>
            )}
          </div>

          <div className="astra-card">
            <div className="astra-metric-label mb-3">How It Works</div>
            <ul className="space-y-2 text-xs text-astra-gray/80">
              <li className="flex gap-2">
                <span className="text-astra-cyan mt-0.5">•</span>
                <span><strong>Isolation Forest</strong> model learns your personal baseline from your measurement history</span>
              </li>
              <li className="flex gap-2">
                <span className="text-astra-cyan mt-0.5">•</span>
                <span>Multi-signal anomaly scoring — looks at all indicators together, not in isolation</span>
              </li>
              <li className="flex gap-2">
                <span className="text-astra-cyan mt-0.5">•</span>
                <span>Deviations above 1.5 std from baseline are flagged as unusual</span>
              </li>
              <li className="flex gap-2">
                <span className="text-astra-cyan mt-0.5">•</span>
                <span>Combine small changes across multiple signals for richer insights</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Deviations */}
          {analysis && analysis.deviating_metrics.length > 0 && (
            <div className="astra-card">
              <div className="flex items-center justify-between mb-4">
                <div className="astra-metric-label">Deviating Indicators</div>
                <span className="text-xs text-astra-gray font-mono">
                  {analysis.deviating_metrics.length} flagged
                </span>
              </div>
              <div className="space-y-2">
                {analysis.deviating_metrics.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-astra-dark/50 border border-white/5 hover:border-astra-cyan/20 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${d.direction === 'elevated' ? 'bg-astra-red/10 text-astra-red' : 'bg-astra-cyan/10 text-astra-cyan'}`}>
                      {d.direction === 'elevated' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M19 12l-7 7-7-7"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-astra-white">{d.label}</span>
                        <span className="text-xs text-astra-gray/50 font-mono">{d.unit}</span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${d.direction === 'elevated' ? 'bg-astra-red/10 text-astra-red' : 'bg-astra-cyan/10 text-astra-cyan'}`}>
                          {d.direction}
                        </span>
                      </div>
                      <div className="text-xs text-astra-gray mt-0.5">
                        {d.current} vs baseline {d.baseline} (
                        <span className={d.direction === 'elevated' ? 'text-astra-red' : 'text-astra-cyan'}>
                          {d.deviation?.toFixed(1)}σ
                        </span>
                        )
                      </div>
                    </div>
                    <div className={`text-lg font-display font-bold ${d.direction === 'elevated' ? 'text-astra-red' : 'text-astra-cyan'}`}>
                      {d.deviation?.toFixed(1)}σ
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis && analysis.deviating_metrics.length === 0 && (
            <div className="astra-card flex flex-col items-center justify-center py-12">
              <div className="w-14 h-14 rounded-xl bg-astra-green/10 flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div className="text-lg font-display font-semibold text-astra-green">All Clear</div>
              <p className="text-sm text-astra-gray mt-1">No deviations from the personal baseline detected.</p>
            </div>
          )}

          {/* History */}
          <div className="astra-card">
            <div className="flex items-center justify-between mb-4">
              <div className="astra-metric-label">Analysis History</div>
              <span className="text-xs text-astra-gray font-mono">{history.length} analyses</span>
            </div>
            {history.length === 0 ? (
              <div className="py-8 text-center text-sm text-astra-gray">
                No analyses yet. Enter readings above and click Analyze.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((h, i) => {
                  const s = SEVERITY_CONFIG[h.severity] || SEVERITY_CONFIG.normal;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-astra-dark/30 hover:bg-astra-dark/50 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-astra-white">{h.severity.toUpperCase()}</div>
                        <div className="text-[10px] text-astra-gray font-mono truncate">
                          Score: {h.anomaly_score?.toFixed(2)}
                        </div>
                      </div>
                      <span className="text-[10px] text-astra-gray font-mono">
                        {new Date(h.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
