import { useAstra } from '../hooks/useAstra';

const PAGE_TITLES = {
  live: { num: '01', title: 'ASTRA LIVE', sub: 'Health Monitoring Dashboard' },
  predict: { num: '02', title: 'ASTRA PREDICT', sub: 'AI-Powered Health Intelligence' },
  twin: { num: '03', title: 'ASTRA TWIN', sub: 'Digital Health Twin' },
  mind: { num: '04', title: 'ASTRA MIND', sub: 'Behavioral Wellness Monitoring' },
  shield: { num: '05', title: 'ASTRA SHIELD', sub: 'Space Environment Monitoring' },
  copilot: { num: '06', title: 'ASTRA COPILOT', sub: 'AI Health Assistant' },
  command: { num: '07', title: 'ASTRA COMMAND', sub: 'Mission Control Dashboard' },
};

export function PageHeader({ route }) {
  const { currentAstronaut, setCurrentRoute } = useAstra();
  const page = PAGE_TITLES[route] || PAGE_TITLES.live;

  return (
    <div className="mb-8">
      {/* Route tag */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl font-display font-bold text-astra-cyan/80 tracking-widest">
          {page.num}
        </span>
        <div className="h-0.5 w-12 bg-gradient-to-r from-astra-cyan/40 to-transparent" />
      </div>

      {/* Title */}
      <div className="mb-1">
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-astra-white tracking-tight">
          {page.title}
        </h1>
      </div>
      <p className="text-astra-cyan/80 text-sm font-display uppercase tracking-[0.15em] mb-4">
        {page.sub}
      </p>

      {/* Astronaut pill */}
      <div className="flex items-center gap-2 flex-wrap">
        {currentAstronaut && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-astra-navy-light/80 border border-white/5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-astra-cyan to-astra-violet flex items-center justify-center text-[10px] font-display font-bold text-astra-navy shadow">
              {currentAstronaut.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold text-astra-white">{currentAstronaut.name}</div>
              <div className="text-[10px] text-astra-gray font-mono">{currentAstronaut.role}</div>
            </div>
          </div>
        )}
        <span className="text-xs text-astra-gray/40 ml-2 font-mono">
          Mission: {currentAstronaut?.mission || '—'}
        </span>
      </div>
    </div>
  );
}
