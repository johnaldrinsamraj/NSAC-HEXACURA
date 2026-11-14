import { useState, useEffect, useRef } from 'react';
import { useAstra } from '../hooks/useAstra';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';

const SUGGESTED_QUESTIONS = [
  'Why is my heart rate changing?',
  'What does low HRV mean?',
  'My sleep has been decreasing — what could cause that?',
  'How does exercise recovery relate to fatigue?',
  'What are normal blood oxygen levels in space?',
  'When should I escalate a health concern?',
  'How is radiation monitored on a Mars mission?',
  'What behavioral indicators are most important?',
];

const ROLES = ['astronaut', 'mission_control'];

export function CopilotPage() {
  const { currentAstronaut } = useAstra();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      content: "Welcome to ASTRA Copilot. I'm your AI health assistant. I can help you understand your health trends, explain indicators, and provide research-backed information from NASA's knowledge base. What would you like to know?",
      sources: ['ASTRA Knowledge Base'],
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [role, setRole] = useState('astronaut');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text, timestamp: new Date().toISOString() }]);
    setInput('');
    setSending(true);
    try {
      const result = await api.askCopilot({ question: text });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', content: result.answer, sources: result.sources || [], relevant_topics: result.relevant_topics || [], timestamp: new Date().toISOString() }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', content: "I'm sorry, I couldn't retrieve an answer right now. Please try again or rephrase your question.", sources: [], timestamp: new Date().toISOString() }]);
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  useEffect(() => { const el = document.getElementById('copilot-input'); if (el) el.focus(); }, []);

  return (
    <div>
      <PageHeader route="copilot" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="astra-card flex flex-col" style={{ height: '600px' }}>
            <div className="flex items-center gap-3 pb-4 border-b border-white/5 mb-4 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-astra-cyan to-astra-violet flex items-center justify-center shadow-lg shadow-astra-cyan/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#071426" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-display font-bold text-astra-white">ASTRA Copilot</div>
                <div className="text-[10px] text-astra-green font-display uppercase tracking-wider">AI Health Assistant &#8226; Online</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-astra-gray uppercase tracking-wider font-display">Role:</span>
                <div className="flex rounded-lg border border-white/5 overflow-hidden">
                  {ROLES.map(r => (
                    <button key={r} onClick={() => setRole(r)}
                      className={`px-2.5 py-1 text-[10px] font-display font-semibold uppercase tracking-wider transition-colors ${role === r ? 'bg-astra-cyan/20 text-astra-cyan' : 'bg-astra-dark text-astra-gray hover:text-astra-white'}`}>
                      {r === 'astronaut' ? 'Astronaut' : 'Mission Control'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 px-1">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-astra-cyan/15 border border-astra-cyan/20 rounded-2xl rounded-tr-sm' : 'bg-astra-dark/80 border border-white/5 rounded-2xl rounded-tl-sm'}`}>
                    <div className="p-3.5">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="text-[10px] text-astra-cyan/70 uppercase tracking-wider mb-1">Sources</div>
                          <div className="flex flex-wrap gap-1">
                            {msg.sources.map(s => (
                              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-astra-cyan/10 text-astra-cyan/80 border border-astra-cyan/10">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.role === 'bot' && (
                        <div className="mt-1.5 text-[10px] text-astra-gray/40 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-astra-cyan/50" />
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex-shrink-0">
              <div className="flex gap-2">
                <textarea id="copilot-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Ask about your health data, trends, or mission wellness..."
                  className="flex-1 bg-astra-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-astra-white placeholder-astra-gray/40 focus:outline-none focus:border-astra-cyan focus:ring-1 focus:ring-astra-cyan/50 transition-all resize-none"
                  rows={2} disabled={sending} />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="astra-btn-primary flex items-center justify-center w-12 h-12 rounded-xl">
                  {sending ? <div className="w-4 h-4 border-2 border-astra-navy border-t-transparent rounded-full animate-spin" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>}
                </button>
              </div>
              <div className="text-[10px] text-astra-gray/40 mt-1.5 flex items-center gap-2">
                <span>Powered by RAG knowledge base &#8226; Research-grounded responses</span>
                <span className="w-1 h-1 rounded-full bg-astra-gray/40" />
                <span>Not a medical device</span>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="astra-card">
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A99CFF" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
              <div className="astra-metric-label">Quick Questions</div>
            </div>
            <div className="space-y-1.5">
              {SUGGESTED_QUESTIONS.map(q => (
                <button key={q} onClick={() => { setInput(q); setRole('astronaut'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-astra-gray hover:text-astra-white hover:bg-astra-cyan/5 transition-all border border-transparent hover:border-astra-cyan/10">
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="astra-card">
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              <div className="astra-metric-label">Knowledge Base</div>
            </div>
            <div className="text-xs text-astra-gray/80 space-y-2">
              <p>ASTRA Copilot uses a curated knowledge base built from NASA research sources.</p>
              <div className="pt-2 border-t border-white/5 space-y-1">
                {['NASA Human Research Roadmap', 'NASA CIPHER', 'NASA GeneLab', 'NASA OSDR', 'NASA Human Research Program'].map(s => (
                  <div key={s} className="flex items-center gap-1.5 text-astra-cyan/70">
                    <span className="w-1 h-1 rounded-full bg-astra-cyan/50" />
                    <span className="text-[10px]">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="astra-card bg-astra-amber/5 border-astra-amber/10">
            <div className="flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" className="mt-0.5 flex-shrink-0"><path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              <div className="text-xs text-astra-amber/80 leading-relaxed">
                <strong>Important:</strong> ASTRA Copilot provides research-grounded information for reference only. It is not a medical diagnosis tool. Always follow approved medical protocols and contact qualified medical support for concerning symptoms.
              </div>
            </div>
          </div>
          {currentAstronaut && (
            <div className="astra-card">
              <div className="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5CC8FF" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                <div className="astra-metric-label">Current Profile</div>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-astra-gray">Astronaut</span><span className="text-astra-white font-semibold">{currentAstronaut.name}</span></div>
                <div className="flex justify-between"><span className="text-astra-gray">Role</span><span className="text-astra-white">{currentAstronaut.role}</span></div>
                <div className="flex justify-between"><span className="text-astra-gray">Mission</span><span className="text-astra-white font-mono text-[10px]">{currentAstronaut.mission}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
