import { AnimatePresence } from 'framer-motion';
import { useBASStore } from './store/basStore';
import { useSimulation, useRealTimeClock } from './hooks/useSimulation';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { BuildingView } from './three/BuildingView';
import {
  OverviewModule,
  HVACModule,
  LightingModule,
  EnergyModule,
  IEQModule,
  SchedulingModule,
  FaultsModule,
  SolarModule,
} from './modules';

const ModuleRenderer = () => {
  const activeTab = useBASStore((state) => state.activeTab);

  const modules: Record<string, JSX.Element> = {
    overview: <OverviewModule />,
    hvac: <HVACModule />,
    lighting: <LightingModule />,
    energy: <EnergyModule />,
    ieq: <IEQModule />,
    scheduling: <SchedulingModule />,
    faults: <FaultsModule />,
    solar: <SolarModule />,
  };

  return modules[activeTab] || <OverviewModule />;
};

function App() {
  useSimulation(3000);
  useRealTimeClock();

  const show3D = useBASStore((state) => state.show3D);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />

      <AnimatePresence mode="wait">
        {show3D && <BuildingView key="building-view" />}
      </AnimatePresence>

      <Navigation />

      <main className="p-6">
        <ModuleRenderer />
      </main>

      <footer className="border-t border-gray-800 px-6 py-4 text-center text-xs text-gray-500">
        <p>Building Automation System | Digital Twin Dashboard | Real-time Monitoring & Control</p>
      </footer>
    </div>
  );
}

export default App;
