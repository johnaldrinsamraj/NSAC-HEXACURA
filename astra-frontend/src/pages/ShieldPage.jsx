import { useState, useEffect, useCallback } from 'react';
import { useAstra } from '../hooks/useAstra.jsx';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/MetricCard';

const RADIATION_THRESHOLDS = {
  normal: 1.0,
  watch: 1.5,
  critical: 2.5,
};

export function ShieldPage() {
  const { currentAstronaut, showToast } = useAstra();
  const [readings, setReadings] = useState([]);
  const [cumulative, setCumulative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventFilter, setEventFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        api.getEnvironment(100),
        api.getCumulativeRadiation(),
      ]);
      setReadings(r);
      setCumulative(c);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addReading = async () => {
    if (!currentAstronaut && !true) return;
    const sources = ['Galactic Cosmic Rays', 'Solar Particle Event', 'Trapped Belt Passage', 'Background Radiation'];
    const source = sources[Math.floor(Math.random() * sources.length)];
    let dose = source === 'Solar Particle Event' ? 1.2 + Math.random() * 0.8 :
               source === 'Trapped Belt Passage' ? 0.8 + Math.random() * 0.5 :
               0.4 + Math.random() * 0.4;
    const evt = dose > 1.2 ? 'SPE' : dose > 0.8 ? 'Belt Passage' : null;
    const desc = evt === 'SPE' ? 'Solar particle event detected — shielding holding.' :
                 evt === 'Belt Passage' ? 'Brief passage through radiation belt.' :
                 null;
    try {
      await api.addEnvironmentReading({
        radiation_dose: Math.round(dose * 1000) / 1000,
        radiation_source: source,
        event_type: evt,
        description: desc,
      });
      const fresh = await api.getEnvironment(1);
      setReadings(prev => [fresh[0], ...prev.slice(0, 99)]);
      const cum = await api.getCumulativeRadiation();
      setCumulative(cum);
      showToast('Environment reading recorded', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to record reading', 'error');
    }
  };

  const events = readings.filter(r => r.event_type);
  const filteredEvents = eventFilter === 'all' ? events : events.filter(e => e.event_type === eventFilter);
  const latestReading = readings[0];

  const cumulativeStatus = cumulative ? (() => {
    if (cumulative.total_dose_mGy > 50) return 'critical';
    if (cumulative.total_dose_mGy > 25) return 'watch';
    return 'normal';
  })() : 'neutral';

  // Estimate daily average
  const dailyAvg = cumulative ? (cumulative.total_dose_mGy / Math.max(1, readings.length / 2)) : 0;

  return (
    <div>
      <PageHeader route="shield" />

      {/* Cumulative status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="astra-card">
          <div className="astra-metric-label mb-2">Cumulative Radiation Dose</div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-display font-bold text-astra-white">
              {cumulative?.total_dose_mGy ?? '—'}
            </span>
            <span className="text-lg text-astra-gray">mGy</span>
          </div>
          <div className="mt-3">
            <StatusBadge status={cumulativeStatus} />
          </div>
          <div className="mt-3 text-xs text-astra-gray">
            {cumulative?.readings_count ?? 0} readings recorded
          </div>
        </div>

        <div className="astra-card">
          <div className="astra-metric-label mb-2">Latest Reading</div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-display font-bold text-astra-white">
              {latestReading?.radiation_dose ?? '—'}
            </span>
            <span className="text-lg text-astra-gray">mGy</span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-astra-gray">Source:</span>
            <span className="text-sm text-astra-cyan ml-2">{latestReading?.radiation_source || '—'}</span>
          </div>
          <div className="mt-1">
            <span className="text-xs text-astra-gray">Type:</span>
            <span className="text-xs text-astra-gray ml-2 font-mono">{latestReading?.event_type || 'Background'}</span>
          </div>
        </div>

        <div className="astra-card">
          <div className="astra-metric-label mb-2">Estimated Daily Average</div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-display font-bold text-astra-cyan-bright">
              {dailyAvg > 0 ? dailyAvg.toFixed(2) : '—'}
            </span>
            <span className="text-lg text-astra-gray">mGy/day</span>
          </div>
          <div className="mt-3 text-xs text-astra-gray">
            Based on recorded readings over mission period.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readings timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="astra-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="astra-metric-label">Radiation Exposure Timeline</div>
                <div className="text-xs text-astra-gray mt-0.5">{readings.length} readings</div>
              </div>
              <button
                onClick={addReading}
                className="astra-btn-ghost text-xs flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Record Reading
              </button>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-astra-cyan border-t-transparent rounded-full animate-spin" />
              </div>
            ) : readings.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-astra-gray">
                No environment readings yet. Seed demo data or record a reading.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex gap-1 items-end h-40">
                  {readings.slice(0, 30).map((r, i) => {
                    const height = Math.min(100, (r.radiation_dose / 2.5) * 100);
                    const isEvent = !!r.event_type;
                    return (
                      <div
                        key={i}
                        className={`flex-1 flex flex-col items-center ${isEvent ? 'relative' : ''}`}
                        style={{ height: `${Math.max(4, height)}%` }}
                        title={`${r.radiation_dose}mGy — ${r.radiation_source}${r.event_type ? ' (' + r.event_type + ')' : ''}`}
                        onClick={() => setSelectedEvent(isEvent ? r : null)}
                      >
                        <div
                          className={`w-full rounded-t transition-all ${isEvent
                            ? r.event_type === 'SPE' ? 'bg-astra-red/80 hover:bg-astra-red' :
                              r.event_type === 'Belt Passage' ? 'bg-astra-amber/80 hover:bg-astra-amber' :
                              'bg-astra-cyan/60 hover:bg-astra-cyan'
                            : r.radiation_dose > 1.0 ? 'bg-astra-amber/50' :
                              'bg-astra-cyan/40'}`}
                          style={{ minHeight: '4px' }}
                        />
                        {isEvent && (
                          <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-astra-violet shadow-lg shadow-astra-violet/50" />
                        )}
                        <span className="text-[9px] text-astra-gray font-mono mt-1 truncate max-w-full px-0.5">
                          {new Date(r.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-3 pt-2 border-t border-white/5">
                  {[
                    { label: 'Background', color: 'bg-astra-cyan/40' },
                    { label: 'Elevated (>1.0)', color: 'bg-astra-amber/50' },
                    { label: 'SPE Event', color: 'bg-astra-red/80' },
                    { label: 'Belt Passage', color: 'bg-astra-amber/80' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs text-astra-gray">
                      <div className={`w-2.5 h-2.5 rounded ${s.color}`} />
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Event log */}
          <div className="astra-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="astra-metric-label">Environmental Events</div>
                <div className="text-xs text-astra-gray mt-0.5">{events.length} events recorded</div>
              </div>
              <div className="flex gap-1">
                {['all', 'SPE', 'Belt Passage'].map(f => (
                  <button
                    key={f}
                    onClick={() => setEventFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-display font-semibold uppercase tracking-wider transition-all
                      ${eventFilter === f ? 'bg-astra-cyan/20 text-astra-cyan border border-astra-cyan/30' : 'bg-astra-dark/50 text-astra-gray border border-transparent hover:text-astra-white'}`}
                  >
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="py-8 text-center text-sm text-astra-gray">
                No events of this type recorded.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {filteredEvents.map((e, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedEvent === e ? 'border-astra-cyan/40 bg-astra-cyan/5' : 'border-white/5 bg-astra-dark/30 hover:bg-astra-dark/50'}`}
                    onClick={() => setSelectedEvent(selectedEvent === e ? null : e)}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2 h-2 rounded-full ${e.event_type === 'SPE' ? 'bg-astra-red' : 'bg-astra-amber'}`} />
                      <span className="text-xs font-display font-semibold text-astra-white">
                        {e.event_type === 'SPE' ? 'Solar Particle Event' : 'Belt Passage'}
                      </span>
                      <span className="text-[10px] text-astra-gray font-mono">
                        {new Date(e.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-astra-gray">Dose:</span>
                      <span className="font-mono font-semibold text-astra-white">{e.radiation_dose} mGy</span>
                      <span className="text-astra-gray">Source:</span>
                      <span className="text-astra-cyan">{e.radiation_source}</span>
                    </div>
                    {e.description && (
                      <p className="text-xs text-astra-gray/70 mt-1.5 italic">"{e.description}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <div className="astra-card">
            <div className="astra-metric-label mb-3">Radiation Context</div>
            <div className="text-sm text-astra-gray/80 space-y-2">
              <p>
                Radiation exposure is tracked as an environmental indicator, not as a direct predictor of acute illness.
                The data provides context for overall mission environment monitoring.
              </p>
              <p className="text-xs text-astra-gray/60">
                Sources include Galactic Cosmic Rays (GCR), Solar Particle Events (SPE), and radiation belt passages.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-astra-gray">Current mission dose</span>
                  <span className="font-mono text-astra-white">{cumulative?.total_dose_mGy?.toFixed(2) ?? '—'} mGy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-astra-gray">Latest reading</span>
                  <span className="font-mono text-astra-white">{latestReading?.radiation_dose?.toFixed(2) ?? '—'} mGy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-astra-gray">Source</span>
                  <span className="text-astra-cyan">{latestReading?.radiation_source || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="astra-card">
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <div className="astra-metric-label">Environmental Sources</div>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { name: 'Galactic Cosmic Rays (GCR)', desc: 'Constant low-level background radiation from outside the solar system.' },
                { name: 'Solar Particle Events (SPE)', desc: 'Transient increases from solar activity. Shielding is critical during these events.' },
                { name: 'Trapped Radiation Belts', desc: 'Regions of elevated radiation around planets. Brief passage events.' },
              ].map(s => (
                <div key={s.name} className="p-2.5 rounded-lg bg-astra-dark/30 border border-white/5">
                  <div className="font-semibold text-astra-white text-xs mb-0.5">{s.name}</div>
                  <div className="text-astra-gray/60 text-[10px]">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert */}
          {latestReading && latestReading.radiation_dose > 1.5 && (
            <div className="astra-card bg-astra-red/5 border-astra-red/20">
              <div className="flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" className="mt-0.5">
                  <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                <div>
                  <div className="text-sm font-semibold text-astra-red">Elevated Radiation Reading</div>
                  <div className="text-xs text-astra-gray mt-0.5">
                    Latest reading of {latestReading.radiation_dose} mGy from {latestReading.radiation_source}.
                    This is an environmental indicator, not a medical alert. Monitoring continues.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
