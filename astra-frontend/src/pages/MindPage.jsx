import { useState, useEffect, useCallback, useRef } from 'react';
import { useAstra } from '../hooks/useAstra.jsx';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';

const SCALE_LABELS = ['', 'Very Low', 'Low', 'Below Avg', 'Average', 'Above Avg', 'High', 'Very High', 'Severe', 'Extreme', ''];

const MOOD_EMOJIS = ['😫', '😢', '😟', '😕', '😐', '🙂', '😊', '😄', '🥳', '🤩'];
const STRESS_EMOJIS = ['😌', '😊', '🙂', '😐', '😕', '😟', '😰', '😨', '😱', '🤯'];

export function MindPage() {
  const { currentAstronaut, showToast } = useAstra();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(3);
  const [fatigue, setFatigue] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gameState, setGameState] = useState('idle');
  const [gameResult, setGameResult] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [gameStart, setGameStart] = useState(0);
  const [gameTimeout, setGameTimeout] = useState(null);
  const buttonRef = useRef(null);

  // Load checkins
  useEffect(() => {
    if (!currentAstronaut) return;
    setLoading(true);
    api.getCheckins(currentAstronaut.id, 30).then(data => {
      setCheckins(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentAstronaut]);

  const submitCheckin = async () => {
    if (!currentAstronaut) {
      showToast('Select an astronaut', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await api.addCheckin(currentAstronaut.id, {
        mood, stress_level: stress, fatigue_level: fatigue,
        sleep_quality: sleepQuality, notes: notes || undefined,
      });
      setCheckins(prev => [{ mood, stress_level: stress, fatigue_level: fatigue,
        sleep_quality: sleepQuality, notes, timestamp: new Date().toISOString() }, ...prev.slice(0, 29)]);
      setNotes('');
      showToast('Check-in recorded', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to record check-in', 'error');
    }
    setSubmitting(false);
  };

  // Reaction time game
  const startGame = () => {
    setGameState('waiting');
    setGameResult(null);
    setGameStart(0);
    if (gameTimeout) clearTimeout(gameTimeout);
    const delay = 1500 + Math.random() * 3000;
    setGameTimeout(setTimeout(() => {
      if (gameState === 'waiting') {
        setGameState('go');
        setGameStart(performance.now());
      }
    }, delay));
  };

  const handleClick = (e) => {
    if (gameState === 'idle') {
      startGame();
      return;
    }
    if (gameState === 'waiting') {
      setGameResult({ reactionTime: null, accuracy: null, result: 'early', message: 'Too early! Wait for the green signal.' });
      setGameState('idle');
      if (gameTimeout) clearTimeout(gameTimeout);
      return;
    }
    if (gameState === 'go') {
      const rt = performance.now() - gameStart;
      const accuracy = Math.max(0, 100 - Math.abs(rt - 250) * 0.5);
      setGameResult({
        reactionTime: Math.round(rt),
        accuracy: Math.min(100, Math.round(accuracy)),
        result: rt < 100 ? 'fast' : rt > 500 ? 'slow' : 'good',
        message: rt < 150 ? 'Excellent reaction time!' :
                 rt < 250 ? 'Good reaction time.' :
                 rt < 400 ? 'Average reaction time.' :
                 'Slower than expected — fatigue may be a factor.',
      });
      setGameHistory(prev => [{ reactionTime: Math.round(rt), accuracy: Math.min(100, Math.round(accuracy)),
        timestamp: new Date().toISOString() }, ...prev.slice(0, 19)]);
      setGameState('idle');
      if (gameTimeout) clearTimeout(gameTimeout);
      return;
    }
  };

  const avgRT = gameHistory.length > 0
    ? Math.round(gameHistory.reduce((s, r) => s + r.reactionTime, 0) / gameHistory.length)
    : null;
  const avgAccuracy = gameHistory.length > 0
    ? Math.round(gameHistory.reduce((s, r) => s + r.accuracy, 0) / gameHistory.length)
    : null;

  const chartData = checkins.slice(0, 14).reverse().map(c => ({
    day: new Date(c.timestamp).toLocaleDateString(),
    mood: c.mood,
    stress: c.stress_level,
    fatigue: c.fatigue_level,
    sleep: c.sleep_quality,
  }));

  return (
    <div>
      <PageHeader route="mind" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-in form */}
        <div className="space-y-4">
          <div className="astra-card">
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A99CFF" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
              </svg>
              <div className="astra-metric-label">Daily Wellness Check-in</div>
            </div>

            <div className="space-y-4">
              {/* Mood */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-astra-gray">Mood</label>
                  <span className="text-sm font-display font-bold" style={{ color: '#F87171' }}>
                    {MOOD_EMOJIS[mood - 1] || '😐'} {SCALE_LABELS[mood]}
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
                    <button
                      key={v}
                      onClick={() => setMood(v)}
                      className={`w-8 h-8 rounded-lg text-lg transition-all flex items-center justify-center
                        ${mood === v ? 'ring-2 ring-astra-cyan ring-offset-2 ring-offset-astra-navy' : 'hover:bg-white/5'}`}
                      style={{ background: mood === v ? '#F8717120' : 'transparent' }}
                    >
                      {MOOD_EMOJIS[i]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-astra-gray">Stress Level</label>
                  <span className="text-sm font-display font-bold" style={{ color: '#FBBF24' }}>
                    {STRESS_EMOJIS[stress - 1] || '😌'} {SCALE_LABELS[stress]}
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
                    <button
                      key={v}
                      onClick={() => setStress(v)}
                      className={`w-8 h-8 rounded-lg text-lg transition-all flex items-center justify-center
                        ${stress === v ? 'ring-2 ring-astra-amber ring-offset-2 ring-offset-astra-navy' : 'hover:bg-white/5'}`}
                      style={{ background: stress === v ? '#FBBF2420' : 'transparent' }}
                    >
                      {STRESS_EMOJIS[i]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fatigue */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-astra-gray">Fatigue Level</label>
                  <span className="text-sm font-display font-bold" style={{ color: '#5CC8FF' }}>
                    {SCALE_LABELS[fatigue]}
                  </span>
                </div>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
                    <button
                      key={v}
                      onClick={() => setFatigue(v)}
                      className={`w-8 h-8 rounded-lg text-xs font-display font-bold transition-all
                        ${fatigue === v ? 'ring-2 ring-astra-cyan-bright ring-offset-2 ring-offset-astra-navy bg-astra-cyan/20 text-astra-cyan' : 'bg-astra-dark/50 text-astra-gray hover:bg-white/5'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleep quality */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-astra-gray">Sleep Quality</label>
                  <span className="text-sm font-display font-bold" style={{ color: '#34D399' }}>
                    {SCALE_LABELS[sleepQuality]}
                  </span>
                </div>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
                    <button
                      key={v}
                      onClick={() => setSleepQuality(v)}
                      className={`w-8 h-8 rounded-lg text-xs font-display font-bold transition-all
                        ${sleepQuality === v ? 'ring-2 ring-astra-green ring-offset-2 ring-offset-astra-navy bg-astra-green/20 text-astra-green' : 'bg-astra-dark/50 text-astra-gray hover:bg-white/5'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-astra-gray mb-1 block">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="How are you feeling today? Any concerns..."
                  className="astra-input h-24 resize-none"
                  rows={3}
                />
              </div>

              <button
                onClick={submitCheckin}
                disabled={submitting}
                className="astra-btn-violet w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Record Check-in
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Trend chart */}
          <div className="astra-card">
            <div className="mb-4">
              <div className="astra-metric-label">Wellness Trends</div>
              <div className="text-xs text-astra-gray mt-0.5">Last 14 check-ins</div>
            </div>
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-astra-cyan border-t-transparent rounded-full animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-astra-gray">
                No check-in data yet. Complete a daily check-in above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex gap-4 items-end h-40 pt-4">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex gap-1 items-end h-full" style={{ height: '100%' }}>
                        <div className="flex-1 flex flex-col justify-end gap-0.5">
                          <div className="w-full bg-astra-mood-bg/40 rounded-t" style={{
                            height: `${(d.mood / 10) * 100}%`,
                            background: '#F87171',
                            opacity: 0.7,
                            minHeight: d.mood > 0 ? '4px' : '0',
                          }} title={`Mood: ${d.mood}`} />
                          <div className="w-full bg-astra-stress-bg/40 rounded-t" style={{
                            height: `${(d.stress / 10) * 100}%`,
                            background: '#FBBF24',
                            opacity: 0.6,
                            minHeight: d.stress > 0 ? '4px' : '0',
                          }} title={`Stress: ${d.stress}`} />
                          <div className="w-full bg-astra-fatigue-bg/40 rounded-t" style={{
                            height: `${(d.fatigue / 10) * 100}%`,
                            background: '#5CC8FF',
                            opacity: 0.6,
                            minHeight: d.fatigue > 0 ? '4px' : '0',
                          }} title={`Fatigue: ${d.fatigue}`} />
                        </div>
                      </div>
                      <span className="text-[10px] text-astra-gray font-mono">{d.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-2 pt-2 border-t border-white/5">
                  {[
                    { label: 'Mood', color: '#F87171' },
                    { label: 'Stress', color: '#FBBF24' },
                    { label: 'Fatigue', color: '#5CC8FF' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs text-astra-gray">
                      <div className="w-2.5 h-2.5 rounded" style={{ background: s.color }} />
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent check-ins */}
          <div className="astra-card">
            <div className="flex items-center justify-between mb-4">
              <div className="astra-metric-label">Recent Check-ins</div>
              <span className="text-xs text-astra-gray font-mono">{checkins.length} total</span>
            </div>
            {checkins.length === 0 ? (
              <div className="py-8 text-center text-sm text-astra-gray">No check-ins recorded yet.</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {checkins.slice(0, 8).map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-astra-dark/30 hover:bg-astra-dark/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-astra-navy-light flex items-center justify-center text-lg">
                      {MOOD_EMOJIS[(c.mood || 5) - 1] || '😐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-astra-white">
                        {new Date(c.timestamp).toLocaleDateString()} {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-astra-gray mt-0.5">
                        Mood: {c.mood}/10 • Stress: {c.stress_level}/10 • Fatigue: {c.fatigue_level}/10 • Sleep: {c.sleep_quality}/10
                        {c.notes ? ` — ${c.notes}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reaction time game */}
          <div className="astra-card">
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5CC8FF" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <div className="astra-metric-label">Reaction Time Test</div>
            </div>

            <p className="text-xs text-astra-gray/70 mb-4">
              Click the button when it turns green. Tests your cognitive response time — a key behavioral health indicator.
            </p>

            <div className="flex items-center gap-4">
              <button
                ref={buttonRef}
                onClick={handleClick}
                className={`flex-1 h-20 rounded-xl font-display font-bold text-lg uppercase tracking-wider transition-all duration-200
                  flex items-center justify-center gap-2 ${gameState === 'idle' ? 'bg-astra-navy-light text-astra-gray border border-white/5 hover:border-astra-cyan/30 cursor-pointer' :
                    gameState === 'waiting' ? 'bg-astra-dark text-astra-gray border border-white/5 cursor-not-allowed' :
                    gameState === 'go' ? 'bg-astra-green text-astra-navy border border-astra-green shadow-lg shadow-astra-green/30 cursor-pointer scale-105' : ''}`}
              >
                {gameState === 'idle' && (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    Start Test
                  </>
                )}
                {gameState === 'waiting' && (
                  <>
                    <div className="w-5 h-5 border-2 border-astra-gray border-t-transparent rounded-full animate-spin" />
                    Wait...
                  </>
                )}
                {gameState === 'go' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 3l14 9-14 9V3z"/>
                  </svg>
                )}
                {gameState === 'go' ? 'CLICK NOW!' : gameState === 'idle' ? 'Start Test' : 'Wait...'}
              </button>

              <div className="flex-shrink-0 space-y-2">
                {gameResult ? (
                  <div className={`text-center p-3 rounded-lg ${gameResult.result === 'early' ? 'bg-astra-red/10 border border-astra-red/20' : 'bg-astra-green/10 border border-astra-green/20'}`}>
                    <div className="text-lg font-display font-bold" style={{ color: gameResult.result === 'early' ? '#F87171' : '#34D399' }}>
                      {gameResult.reactionTime !== null ? `${gameResult.reactionTime}ms` : '—'}
                    </div>
                    <div className="text-xs text-astra-gray mt-0.5">{gameResult.message}</div>
                  </div>
                ) : (
                  <div className="text-center p-3 rounded-lg bg-astra-dark/30 border border-white/5">
                    <div className="text-2xl font-display font-bold text-astra-white">—</div>
                    <div className="text-xs text-astra-gray mt-0.5">No test yet</div>
                  </div>
                )}
              </div>
            </div>

            {/* Game history */}
            {gameHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-astra-gray">Session History</div>
                  <div className="text-xs text-astra-gray font-mono">
                    Avg: {avgRT}ms • {avgAccuracy}% accuracy • {gameHistory.length} tests
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {gameHistory.slice(0, 12).map((r, i) => (
                    <div
                      key={i}
                      className={`h-6 rounded-sm transition-all ${r.result === 'early' ? 'bg-astra-red/30' :
                        r.reactionTime < 200 ? 'bg-astra-green/40' :
                        r.reactionTime < 300 ? 'bg-astra-cyan/40' :
                        r.reactionTime < 400 ? 'bg-astra-amber/40' :
                        'bg-astra-red/30'}`}
                      title={`${r.reactionTime}ms`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
