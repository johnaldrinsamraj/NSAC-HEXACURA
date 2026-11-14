import { useAstra } from '../hooks/useAstra.jsx';
import { Sidebar } from './Sidebar';
import { Toast } from './Toast';
export function Layout({children}){
 const {setSidebarMobileOpen,currentRoute}=useAstra();
 return <div className="app-shell"><Sidebar/><main className="main-area">
  <header className="topbar"><button className="menu-trigger" onClick={()=>setSidebarMobileOpen(true)}>☰</button><div className="crumb">ASTRA <span>/</span> {currentRoute==='home'?'OVERVIEW':currentRoute.toUpperCase()}</div><div className="topbar-right"><span className="live-indicator"><i/> LIVE SYSTEM</span><span className="topbar-date">{new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</span><div className="top-avatar">A</div></div></header>
  <div className="page-content" key={currentRoute}>{children}</div>
 </main><Toast/></div>
}
