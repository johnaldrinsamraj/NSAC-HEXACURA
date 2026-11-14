import {useEffect,useState} from 'react';
import {useAstra} from '../hooks/useAstra.jsx';
import {api} from '../services/api';
const modules=[
 ['live','01','LIVE TELEMETRY','Physiological signals and crew vitals','↗','cyan'],
 ['predict','02','AI PREDICT','Personalized anomaly detection & trends','⌁','violet'],
 ['twin','03','DIGITAL TWIN','Explore an astronaut health profile','◎','blue'],
 ['mind','04','CREW WELLNESS','Behavioral check-ins and cognitive data','◌','pink'],
 ['shield','05','SPACE ENVIRONMENT','Radiation exposure and event history','⬡','amber'],
 ['copilot','06','ASTRA COPILOT','Ask questions with research context','✳','green'],
 ['command','07','MISSION CONTROL','Crew overview and alert management','▦','cyan']
];
export function HomePage(){
 const {astronauts,currentAstronaut,setCurrentRoute,showToast,loadAstronauts}=useAstra();
 const [overview,setOverview]=useState([]),[alerts,setAlerts]=useState([]),[busy,setBusy]=useState(false);
 useEffect(()=>{Promise.all([api.getMissionControlOverview(),api.getAllAlerts()]).then(([o,a])=>{setOverview(o);setAlerts(a)}).catch(()=>{});},[]);
 const open=(route)=>setCurrentRoute(route);
 const seed=async()=>{setBusy(true);try{await api.seedDemo();await loadAstronauts();const [o,a]=await Promise.all([api.getMissionControlOverview(),api.getAllAlerts()]);setOverview(o);setAlerts(a);showToast('Demo mission data loaded','success')}catch(e){showToast(e.message||'Could not load demo data','error')}finally{setBusy(false)}};
 const active=alerts.filter(a=>!a.resolved).length,critical=alerts.filter(a=>!a.resolved&&a.severity==='critical').length;
 return <div className="home-page">
  <section className="hero-panel"><div className="hero-overlay"/><div className="hero-content"><div className="eyebrow"><i/> HUMAN SPACEFLIGHT HEALTH INTELLIGENCE</div><div className="hero-kicker">MISSION CONTROL / 2026</div><h1>Your crew.<br/><em>Beyond limits.</em></h1><p>One unified intelligence platform for astronaut health, mission awareness and informed decisions — wherever the mission takes you.</p><div className="hero-actions"><button className="primary-action" onClick={()=>open('command')}>OPEN MISSION CONTROL <span>↗</span></button><button className="text-action" onClick={()=>open('live')}>Explore telemetry <span>→</span></button></div></div><div className="hero-coordinates">28° 31' N&nbsp;&nbsp; 80° 39' W<br/>LOW EARTH ORBIT / SIMULATED</div><div className="hero-stamp"><span>ASTRA</span><small>MISSION INTELLIGENCE<br/>PLATFORM</small></div></section>
  <div className="section-heading"><div><div className="eyebrow muted">AT A GLANCE</div><h2>Mission overview</h2></div><div className="overview-meta"><span className="live-indicator"><i/> SYSTEM ONLINE</span><span>DATA REFRESHED ON LOAD</span></div></div>
  <div className="stat-grid">
   <div className="stat-card"><span className="stat-icon cyan">◉</span><div><small>CREW MEMBERS</small><strong>{astronauts.length}</strong><p>Registered astronauts</p></div><span className="stat-line cyan-line"/></div>
   <div className="stat-card"><span className="stat-icon violet">⌁</span><div><small>ACTIVE ALERTS</small><strong>{active}</strong><p>{critical} critical · {active-critical} watch</p></div><span className="stat-line violet-line"/></div>
   <div className="stat-card"><span className="stat-icon green">◎</span><div><small>CREW STATUS</small><strong>{overview.length?`${overview.length}/${overview.length}`:'—'}</strong><p>{overview.length?'Crew profiles reporting':'Awaiting crew data'}</p></div><span className="stat-line green-line"/></div>
   <div className="stat-card"><span className="stat-icon amber">✳</span><div><small>INTELLIGENCE</small><strong>AI</strong><p>Personalized health analysis</p></div><span className="stat-line amber-line"/></div>
  </div>
  <div className="section-heading modules-heading"><div><div className="eyebrow muted">YOUR CONTROL DECK</div><h2>Explore ASTRA systems</h2></div><span className="module-count">07 MODULES</span></div>
  <div className="module-grid">{modules.map(([route,num,title,desc,icon,color])=><button className="module-card" key={route} onClick={()=>open(route)}><div className="module-top"><span className={`module-icon ${color}`}>{icon}</span><span className="module-num">{num} / 07</span></div><h3>{title}</h3><p>{desc}</p><div className="module-bottom"><span>OPEN MODULE</span><b>↗</b></div></button>)}</div>
  {!astronauts.length&&<div className="empty-banner"><div><b>Ready to initialize your mission?</b><p>Load the included demonstration crew and sample telemetry to explore ASTRA.</p></div><button className="primary-action" disabled={busy} onClick={seed}>{busy?'INITIALIZING…':'LOAD DEMO MISSION →'}</button></div>}
  <footer className="page-footer"><span>ASTRA · AUTONOMOUS SPACEFLIGHT TRACKING & RISK ASSESSMENT</span><span>BUILT FOR THE NEXT FRONTIER <b>✦</b></span></footer>
 </div>
}
