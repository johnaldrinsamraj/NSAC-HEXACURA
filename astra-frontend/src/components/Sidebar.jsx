import { useState } from 'react';
import { useAstra } from '../hooks/useAstra.jsx';

const items = [
  ['live','Live telemetry','01','pulse'],['predict','AI predictions','02','brain'],
  ['twin','Digital twin','03','orbit'],['mind','Crew wellness','04','mind'],
  ['shield','Radiation & environment','05','shield'],['copilot','ASTRA copilot','06','chat'],
  ['command','Mission control','07','grid'],
];
const glyph = {
 pulse:<><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
 brain:<><path d="M9 4a3 3 0 0 0-5 2 4 4 0 0 0 0 7 3 3 0 0 0 5 3M15 4a3 3 0 0 1 5 2 4 4 0 0 1 0 7 3 3 0 0 1-5 3M9 4v16m6-16v16M9 9h6m-6 6h6"/></>,
 orbit:<><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-35 12 12)"/></>,
 mind:<><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></>,
 shield:<><path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/></>,
 chat:<><path d="M20 11a7 7 0 0 1-7 7H6l-3 3V7a4 4 0 0 1 4-4h6a7 7 0 0 1 7 8Z"/></>,
 grid:<><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></>
};
export function Sidebar(){
 const {currentRoute,setCurrentRoute,currentAstronaut,selectAstronaut,astronauts,sidebarMobileOpen,setSidebarMobileOpen}=useAstra();
 const [crewOpen,setCrewOpen]=useState(false);
 return <>
  {sidebarMobileOpen&&<button aria-label="Close navigation" className="nav-scrim" onClick={()=>setSidebarMobileOpen(false)}/>}
  <aside className={`sidebar ${sidebarMobileOpen?'sidebar-open':''}`}>
   <div className="brand">
    <div className="brand-mark"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="5"/><ellipse cx="16" cy="16" rx="14" ry="6" transform="rotate(-35 16 16)"/><path d="M16 2v4M16 26v4"/></svg></div>
    <div><b>ASTRA<span>•</span></b><small>SPACEFLIGHT INTELLIGENCE</small></div>
    <button className="mobile-close" onClick={()=>setSidebarMobileOpen(false)}>×</button>
   </div>
   <div className="side-caption">MISSION WORKSPACE</div>
   <button className={`nav-link ${currentRoute==='home'?'active':''}`} onClick={()=>{setCurrentRoute('home');setSidebarMobileOpen(false)}}>
    <span className="nav-icon"><svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg></span><span>Overview</span><kbd>⌂</kbd>
   </button>
   <div className="side-caption spaced">SYSTEMS</div>
   {items.map(([id,label,num,icon])=><button key={id} className={`nav-link ${currentRoute===id?'active':''}`} onClick={()=>{setCurrentRoute(id);setSidebarMobileOpen(false)}}>
    <span className="nav-icon"><svg viewBox="0 0 24 24">{glyph[icon]}</svg></span><span>{label}</span><small>{num}</small>
   </button>)}
   <div className="sidebar-bottom">
    <div className="side-caption">ACTIVE CREW</div>
    <button className="crew-select" onClick={()=>setCrewOpen(!crewOpen)}>
      <span className="crew-avatar">{currentAstronaut?.name?.[0]||'+'}</span>
      <span className="crew-copy"><b>{currentAstronaut?.name||'No crew selected'}</b><small>{currentAstronaut?.mission||'Select a crew member'}</small></span><span className="chevron">⌄</span>
    </button>
    {crewOpen&&<div className="crew-menu">{astronauts.map(a=><button key={a.id} onClick={()=>{selectAstronaut(a);setCrewOpen(false)}}>{a.name}<small>{a.role}</small></button>)}</div>}
    <div className="connection"><i/> SYSTEMS NOMINAL <span>LOCAL</span></div>
   </div>
  </aside>
 </>;
}
