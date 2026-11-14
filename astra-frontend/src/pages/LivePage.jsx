import { useState, useEffect, useCallback } from 'react';
import { useAstra } from '../hooks/useAstra.jsx';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { MetricCard, StatusBadge } from '../components/MetricCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts';

const METRIC_CONFIG = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'BPM', color: '#38A6E8',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { key: 'hrv', label: 'HRV', unit: 'ms', color: '#8B7CF6',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a6 6 0 0 0-6 6v4a6 6 0 0 0 12 0V8a6 6 0 0 0-6-6Z"/><path d="M9 12h6"/></svg> },
  { key: 'blood_oxygen', label: 'SpO2', unit: '%SpO2', color: '#34D399',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg> },
  { key: 'body_temp', label: 'Temperature', unit: '°C', color: '#FBBF24',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v10M9 12h6M8 22h8M5 16l3-6 3 6"/></svg> },
  { key: 'sleep_duration', label: 'Sleep Duration', unit: 'hrs', color: '#A99CFF',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
  { key: 'activity_level', label: 'Activity Level', unit: 'index', color: '#F87171',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg> },
  { key: 'exercise_recovery', label: 'Exercise Recovery', unit: 'min', color: '#5CC8FF',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
];

export function LivePage() {
  const { currentAstronaut } = useAstra();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('heart_rate');
  const [simulateLoading, setSimulateLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentAstronaut) return;
    setLoading(true);
    try {
      const data = await api.getMeasurements(currentAstronaut.id, 30);
      setMeasurements(data);
    } catch (err) {
      console.error('Failed to load measurements:', err);
    }
    setLoading(false);
  }, [currentAstronaut]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSimulate = async () => {
    if (!currentAstronaut) return;
    setSimulateLoading(true);
    try {
      const result = await api.simulateMeasurement(currentAstronaut.id);
      const newMeas = {
        id: result.measurement_id,
        timestamp: new Date().toISOString(),
        ...result.anomaly,
        heart_rate: result.measurement_id, // placeholder — we'll re-fetch
      };
      // Re-fetch to get actual data
      const fresh = await api.getMeasurements(currentAstronaut.id, 1);
      setMeasurements(prev => [...prev, fresh[0]]);
      useAstra().showToast(result.anomaly.severity === 'critical' ? 'Critical alert generated' : 'New measurement recorded', result.anomaly.severity === 'critical' ? 'error' : 'success');
    } catch (err) {
      console.error(err);
      useAstra().showToast('Failed to simulate measurement', 'error');
    }
    setSimulateLoading(false);
  };

  const latest = measurements[0];
  const chartData = measurements
    .slice()
    .reverse()
    .map(m => ({
      time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      heart_rate: m.heart_rate ?? null,
      hrv: m.hrv ?? null,
      blood_oxygen: m.blood_oxygen ?? null,
      body_temp: m.body_temp ?? null,
      sleep_duration: m.sleep_duration ?? null,
      activity_level: m.activity_level ?? null,
      exercise_recovery: m.exercise_recovery ?? null,
    }));

  const selectedConfig = METRIC_CONFIG.find(c => c.key === activeMetric) || METRIC_CONFIG[0];

  const value = latest?.[activeMetric];
  const baselines = [];
  const deviation = value !== null && value !== undefined ? (
    (v, bl) => bl ? { diff: v - bl, pct: ((v - bl) / bl * 100) } : null
  ) : null;

  const statusClass = !latest ? '' : (() => {
    if (!value) return 'neutral';
    if (activeMetric === 'heart_rate') return value > 90 || value < 50 ? 'critical' : value > 80 || value < 60 ? 'watch' : 'normal';
    if (activeMetric === 'hrv') return value < 20 ? 'critical' : value < 30 ? 'watch' : 'normal';
    if (activeMetric === 'blood_oxygen') return value < 92 ? 'critical' : value < 95 ? 'watch' : 'normal';
    if (activeMetric === 'body_temp') return value > 38 || value < 35.5 ? 'critical' : value > 37.5 || value < 36 ? 'watch' : 'normal';
    if (activeMetric === 'sleep_duration') return value < 4 ? 'critical' : value < 5.5 ? 'watch' : 'normal';
    if (activeMetric === 'activity_level') return value < 1 ? 'watch' : 'normal';
    if (activeMetric === 'exercise_recovery') return value > 60 ? 'critical' : value > 45 ? 'watch' : 'normal';
    return 'neutral';
  })();

  return (
    <div>
      <PageHeader route="live" />

      {/* Simulate button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleSimulate}
          disabled={simulateLoading || !currentAstronaut}
          className="astra-btn-primary flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={simulateLoading ? 'animate-spin' : ''}>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
          {simulateLoading ? 'Recording telemetry...' : 'New Telemetry Reading'}
        </button>
        <span className="text-xs text-astra-gray/50 font-mono">
          Simulated data • Real NASA data integration pending
        </span>
      </div>

      {/* Metric selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {METRIC_CONFIG.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveMetric(c.key)}
            className={`px-4 py-2 rounded-lg text-sm font-display font-semibold uppercase tracking-wider transition-all
              ${activeMetric === c.key
                ? 'bg-astra-cyan/20 text-astra-cyan border border-astra-cyan/40 shadow-sm'
                : 'bg-astra-navy-light/60 text-astra-gray border border-white/5 hover:border-astra-cyan/20 hover:text-astra-white'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Current reading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="astra-card col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="astra-metric-label">Current {selectedConfig.label}</div>
            <StatusBadge status={statusClass} />
          </div>
          {loading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-astra-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-display font-bold text-astra-white tracking-tight">
                {value !== null && value !== undefined ? value : '—'}
              </span>
              {selectedConfig.unit && (
                <span className="text-xl text-astra-gray font-medium">{selectedConfig.unit}</span>
              )}
            </div>
          )}
        </div>

        <div className="astra-card flex flex-col justify-center">
          <div className="astra-metric-label">Personal Baseline</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-display font-bold text-astra-cyan/80">
              {latest ? '—' : '—'}
            </span>
            <span className="text-sm text-astra-gray">loading...</span>
          </div>
          <p className="text-xs text-astra-gray/50 mt-3">
            Baselines are learned from your personal measurement history.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="astra-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="astra-metric-label">{selectedConfig.label} Trend</div>
            <div className="text-sm text-astra-gray mt-0.5">Last 30 readings</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-astra-gray">
            <span className="w-3 h-3 rounded-full" style={{ background: selectedConfig.color }} />
            <span>{selectedConfig.label}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={selectedConfig.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={selectedConfig.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={40}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip
              contentStyle={{
                background: '#0d1f3d', border: '1px solid #38A6E840', borderRadius: '8px',
                color: '#E2E8F0', fontSize: '12px', padding: '8px 12px',
              }}
              labelStyle={{ color: '#38A6E8', fontWeight: '600' }}
            />
            <Area
              type="monotone"
              dataKey={activeMetric}
              stroke={selectedConfig.color}
              strokeWidth={2}
              fill={`url(#grad-${activeMetric})`}
              dot={false}
              activeDot={{ r: 5, fill: selectedConfig.color, stroke: '#071426', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* All metrics grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="astra-metric-label">All Vitals</div>
          <div className="text-xs text-astra-gray">Current values from latest reading</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {METRIC_CONFIG.map(c => {
            const val = latest?.[c.key];
            let status = 'neutral';
            if (val !== null && val !== undefined) {
              if (c.key === 'heart_rate') status = val > 90 || val < 50 ? 'critical' : val > 80 || val < 60 ? 'watch' : 'normal';
              else if (c.key === 'hrv') status = val < 20 ? 'critical' : val < 30 ? 'watch' : 'normal';
              else if (c.key === 'blood_oxygen') status = val < 92 ? 'critical' : val < 95 ? 'watch' : 'normal';
              else if (c.key === 'body_temp') status = val > 38 || val < 35.5 ? 'critical' : val > 37.5 || val < 36 ? 'watch' : 'normal';
              else if (c.key === 'sleep_duration') status = val < 4 ? 'critical' : val < 5.5 ? 'watch' : 'normal';
              else if (c.key === 'activity_level') status = val < 1 ? 'watch' : 'normal';
              else if (c.key === 'exercise_recovery') status = val > 60 ? 'critical' : val > 45 ? 'watch' : 'normal';
            }
            return (
              <MetricCard
                key={c.key}
                label={c.label}
                value={val}
                unit={c.unit}
                icon={c.icon}
                status={status}
                onClick={() => setActiveMetric(c.key)}
              />
            );
          })}
        </div>
      </div>

      {/* Alert summary */}
      {latest && (
        <div className="mt-6 p-4 rounded-xl bg-astra-dark/50 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-astra-cyan">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            <span className="text-xs font-display font-semibold uppercase tracking-wider text-astra-cyan">Latest Reading Summary</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {METRIC_CONFIG.slice(0, 4).map(c => (
              <div key={c.key} className="flex items-center gap-2">
                <span className="text-astra-gray">{c.label}:</span>
                <span className="font-mono font-semibold text-astra-white">{latest[c.key] ?? '—'}</span>
                <span className="text-astra-gray/60">{c.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {measurements.length === 0 && !loading && (
        <div className="astra-card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-astra-navy-light border border-white/5 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38A6E8" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="text-lg font-display font-semibold text-astra-white mb-2">No telemetry data yet</div>
          <p className="text-sm text-astra-gray max-w-md">
            Click "New Telemetry Reading" to start recording simulated measurements, or seed the demo data to load astronaut profiles.
          </p>
        </div>
      )}
    </div>
  );
}
