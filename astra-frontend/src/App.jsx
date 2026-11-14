import { AstraProvider, useAstra } from './hooks/useAstra';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { LivePage } from './pages/LivePage';
import { PredictPage } from './pages/PredictPage';
import { TwinPage } from './pages/TwinPage';
import { MindPage } from './pages/MindPage';
import { ShieldPage } from './pages/ShieldPage';
import { CopilotPage } from './pages/CopilotPage';
import { CommandPage } from './pages/CommandPage';
function AppContent(){
 const {currentRoute}=useAstra();
 const pages={home:<HomePage/>,live:<LivePage/>,predict:<PredictPage/>,twin:<TwinPage/>,mind:<MindPage/>,shield:<ShieldPage/>,copilot:<CopilotPage/>,command:<CommandPage/>};
 return <Layout>{pages[currentRoute]||pages.home}</Layout>;
}
export default function App(){return <AstraProvider><AppContent/></AstraProvider>}
