import { useState, useEffect, useCallback } from 'react';
import { useAstra } from '../hooks/useAstra.jsx';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/MetricCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#F87171', '#FBBF24', '#34D399', '#38A6E8', '#8B7CF6', '#5CC8FF'];

export function CommandPage() {
  const { showToast } = useAstra();
  const [overview, setOverview] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAstronaut, setSelectedAstronaut] = useState(null);
  const [alertFilter, setAlertFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const [ov, al] = await Promise.all([
        api.getMissionControlOverview(),
        api.getAllAlerts(),
      ]);
      setOverview(ov);
      setAlerts(al);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resolveAlert = async (id) => {
    try {
      await api.resolveAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
      showToast('Alert resolved', 'success');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to resolve alert', 'error');
    }
  };

  const activeCrew = overview.filter(o => o.alerts.total_open > 0);
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
  const watchCount = alerts.filter(a => a.severity === 'watch' && !a.resolved).length;
  const resolvedCount = alerts.filter(a => a.resolved).length;

  const alertChartData = [
    { name: 'Critical', value: criticalCount, color: '#F87171' },
    { name: 'Watch', value: watchCount, color: '#FBBF24' },
    { name: 'Resolved', value: resolvedCount, color: '#34D399' },
  ].filter(d => d.value > 0);

  const crewAlertData = overview.map(o => ({
    name: o.name.split(' ')[0],
    critical: o.alerts.critical,
    watch: o.alerts.watch,
    total: o.alerts.total_open,
  }));

  const selected = selectedAstronaut || overview[0];

  return (
    <div>
      <PageHeader route="command" />

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="astra-card">
          <div className="astra-metric-label">Crew Status</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-astra-white">{overview.length}</span>
            <span className="text-sm text-astra-gray">astronauts</span>
          </div>
          <div className="mt-2 text-xs text-astra-gray">
            {activeCrew.length > 0
              ? `${activeCrew.length} with active alerts`
              : 'All crew nominal'}
          </div>
        </div>

        <div className="astra-card">
          <div className="astra-metric-label">Critical Alerts</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-3xl font-display font-bold ${criticalCount > 0 ? 'text-astra-red animate-pulse' : 'text-astra-green'}`}>
              {criticalCount}
            </span>
            <span className="text-sm text-astra-gray">active</span>
          </div>
          {criticalCount > 0 && (
            <div className="mt-2 text-xs text-astra-red">Requires immediate attention</div>
          )}
        </div>

        <div className="astra-card">
          <div className="astra-metric-label">Watch Alerts</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-3xl font-display font-bold ${watchCount > 0 ? 'text-astra-amber' : 'text-astra-gray'}`}>
              {watchCount}
            </span>
            <span className="text-sm text-astra-gray">monitoring</span>
          </div>
          {watchCount > 0 && (
            <div className="mt-2 text-xs text-astra-amber">Patterns to review</div>
          )}
        </div>

        <div className="astra-card">
          <div className="astra-metric-label">Resolved Alerts</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-astra-green">{resolvedCount}</span>
            <span className="text-sm text-astra-gray">total</span>
          </div>
          <div className="mt-2 text-xs text-astra-gray">Handled this session</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crew overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="astra-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="astra-metric-label">Crew Health Overview</div>
                <div className="text-xs text-astra-gray mt-0.5">Mission Control dashboard</div>
              </div>
              <div className="text-xs text-astra-gray font-mono">
                {new Date().toLocaleString()}
              </div>
            </div>

            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-astra-cyan border-t-transparent rounded-full animate-spin" />
              </div>
            ) : overview.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-astra-gray">
                No crew data. Seed demo data to load astronauts.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {overview.map(astro => {
                  const hasCritical = astro.alerts.critical > 0;
                  const hasWatch = astro.alerts.watch > 0;
                  const status = hasCritical ? 'critical' : hasWatch ? 'watch' : 'normal';
                  return (
                    <div
                      key={astro.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer
                        ${selectedAstronaut?.id === astro.id
                          ? 'border-astra-cyan/40 bg-astra-cyan/5 shadow-lg shadow-astra-cyan/5'
                          : 'border-white/5 bg-astra-dark/30 hover:border-astra-cyan/20 hover:bg-astra-dark/50'}
                        ${status === 'critical' ? 'border-l-4 border-l-astra-red' :
                          status === 'watch' ? 'border-l-4 border-l-astra-amber' : ''}`}
                      onClick={() => setSelectedAstronaut(astro)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-display font-bold text-astra-navy
                          ${status === 'critical' ? 'bg-astra-red/20' :
                            status === 'watch' ? 'bg-astra-amber/20' : 'bg-astra-green/20'}`}>
                          {astro.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-astra-white truncate">{astro.name}</div>
                          <div className="text-[10px] text-astra-gray">{astro.role}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {hasCritical && (
                            <span className="w-2 h-2 rounded-full bg-astra-red animate-pulse" />
                          )}
                          {hasWatch && !hasCritical && (
                            <span className="w-2 h-2 rounded-full bg-astra-amber" />
                          )}
                          {!hasCritical && !hasWatch && (
                            <span className="w-2 h-2 rounded-full bg-astra-green" />
                          )}
                        </div>
                      </div>

                      {/* Latest vitals */}
                      {astro.latest_measurement && (
                        <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                          {[
                            { label: 'HR', val: astro.latest_measurement.heart_rate, unit: 'BPM', color: '#38A6E8' },
                            { label: 'HRV', val: astro.latest_measurement.hrv, unit: 'ms', color: '#8B7CF6' },
                            { label: 'SpO2', val: astro.latest_measurement.blood_oxygen, unit: '%', color: '#34D399' },
                            { label: 'Temp', val: astro.latest_measurement.body_temp, unit: '°C', color: '#FBBF24' },
                          ].map(v => (
                            <div key={v.label} className="text-center p-1.5 rounded-lg bg-astra-dark/50">
                              <div className="text-[9px] text-astra-gray font-display uppercase">{v.label}</div>
                              <div className="text-sm font-mono font-bold" style={{ color: v.color }}>
                                {v.val ?? '—'}{v.unit}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Alert badges */}
                      <div className="flex items-center gap-2">
                        {astro.alerts.total_open === 0 ? (
                          <span className="text-[10px] text-astra-green font-display font-semibold uppercase tracking-wider">Nominal</span>
                        ) : (
                          <>
                            {astro.alerts.critical > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-astra-red/10 text-astra-red font-display font-semibold">
                                {astro.alerts.critical}C
                              </span>
                            )}
                            {astro.alerts.watch > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-astra-amber/10 text-astra-amber font-display font-semibold">
                                {astro.alerts.watch}W
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alert feed */}
          <div className="astra-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="astra-metric-label">Alert Feed</div>
                <div className="text-xs text-astra-gray mt-0.5">
                  {alerts.filter(a => !a.resolved).length} active • {alerts.length} total
                </div>
              </div>
              <div className="flex gap-1">
                {['all', 'critical', 'watch', 'resolved'].map(f => (
                  <button
                    key={f}
                    onClick={() => setAlertFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-display font-semibold uppercase tracking-wider transition-all
                      ${alertFilter === f ? 'bg-astra-cyan/20 text-astra-cyan border border-astra-cyan/30' : 'bg-astra-dark/50 text-astra-gray border border-transparent hover:text-astra-white'}`}
                  >
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-astra-cyan border-t-transparent rounded-full animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-astra-gray">
                No alerts recorded.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {alerts.filter(a =>
                  alertFilter === 'all' ? true :
                  alertFilter === 'resolved' ? a.resolved :
                  a.severity === alertFilter && !a.resolved
                ).map((alert, i) => {
                  const isResolved = alert.resolved;
                  const sColors = {
                    critical: { text: 'text-astra-red', bg: 'bg-astra-red/10', border: 'border-astra-red/20' },
                    watch: { text: 'text-astra-amber', bg: 'bg-astra-amber/10', border: 'border-astra-amber/20' },
                  };
                  const sc = sColors[alert.severity] || { text: 'text-astra-green', bg: 'bg-astra-green/10', border: 'border-astra-green/20' };
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border transition-all ${isResolved
                        ? 'border-astra-green/10 bg-astra-green/5 opacity-60'
                        : 'border-white/5 bg-astra-dark/30 hover:border-astra-cyan/20 hover:bg-astra-dark/50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={alert.severity} />
                            {isResolved && (
                              <span className="text-[10px] text-astra-green font-display font-semibold uppercase">Resolved</span>
                            )}
                          </div>
                          <div className="text-sm font-semibold text-astra-white mb-1">{alert.title}</div>
                          <div className="text-xs text-astra-gray/70 leading-relaxed mb-2">{alert.description}</div>
                          <div className="flex items-center gap-3 text-[10px] text-astra-gray">
                            <span className="font-mono">{alert.anomaly_score?.toFixed(2) ?? '—'} anomaly score</span>
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                            {alert.deviating_metrics?.length > 0 && (
                              <span className="text-astra-cyan">
                                {alert.deviating_metrics.length} indicator(s) deviating
                              </span>
                            )}
                          </div>
                          {alert.deviating_metrics?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {alert.deviating_metrics.slice(0, 3).map((d, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-astra-cyan/5 text-astra-cyan/80 border border-astra-cyan/10">
                                  {d.label}: {d.current} ({d.direction})
                                </span>
                              ))}
                              {alert.deviating_metrics.length > 3 && (
                                <span className="text-[10px] text-astra-gray">+{alert.deviating_metrics.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {!isResolved && (
                            <button
                              onClick={() => resolveAlert(alert.id)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-display font-semibold uppercase tracking-wider bg-astra-green/10 text-astra-green border border-astra-green/20 hover:bg-astra-green/20 transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-4">
          {/* Alert distribution */}
          <div className="astra-card">
            <div className="astra-metric-label mb-3">Alert Distribution</div>
            <div className="h-40">
              {alertChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={alertChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {alertChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#0d1f3d', border: '1px solid #38A6E840', borderRadius: '8px',
                        color: '#E2E8F0', fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-astra-gray">
                  No alert data
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {alertChartData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-astra-gray">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Crew alert comparison */}
          <div className="astra-card">
            <div className="astra-metric-label mb-3">Crew Alert Comparison</div>
            <div className="h-40">
              {crewAlertData.some(d => d.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crewAlertData} barGap={0} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={25} />
                    <Tooltip
                      contentStyle={{
                        background: '#0d1f3d', border: '1px solid #38A6E840', borderRadius: '8px',
                        color: '#E2E8F0', fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="critical" fill="#F87171" radius={[2, 2, 0, 0]} name="Critical" />
                    <Bar dataKey="watch" fill="#FBBF24" radius={[2, 2, 0, 0]} name="Watch" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-astra-gray">
                  No active alerts
                </div>
              )}
            </div>
            <div className="flex justify-center gap-3 mt-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] text-astra-gray">
                <div className="w-2 h-2 rounded-sm" style={{ background: '#F87171' }} />
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-astra-gray">
                <div className="w-2 h-2 rounded-sm" style={{ background: '#FBBF24' }} />
                <span>Watch</span>
              </div>
            </div>
          </div>

          {/* Selected astronaut detail */}
          {selected && (
            <div className="astra-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="astra-metric-label">Selected Crew Member</div>
                  <div className="text-sm text-astra-white">{selected.name}</div>
                </div>
                <button
                  onClick={() => setSelectedAstronaut(null)}
                  className="text-astra-gray hover:text-astra-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-astra-dark/30">
                  <div className="text-astra-gray">Role</div>
                  <div className="text-astra-white font-semibold">{selected.role}</div>
                </div>
                <div className="p-2 rounded-lg bg-astra-dark/30">
                  <div className="text-astra-gray">Active Alerts</div>
                  <div className={`font-mono font-bold ${selected.alerts.total_open > 0 ? 'text-astra-amber' : 'text-astra-green'}`}>
                    {selected.alerts.total_open}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-astra-dark/30">
                  <div className="text-astra-gray">Critical</div>
                  <div className={`font-mono font-bold ${selected.alerts.critical > 0 ? 'text-astra-red' : 'text-astra-green'}`}>
                    {selected.alerts.critical}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-astra-dark/30">
                  <div className="text-astra-gray">Watch</div>
                  <div className={`font-mono font-bold ${selected.alerts.watch > 0 ? 'text-astra-amber' : 'text-astra-gray'}`}>
                    {selected.alerts.watch}
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
