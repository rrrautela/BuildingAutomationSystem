import { useBASStore } from '../store/basStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Thermometer,
  Lightbulb,
  Zap,
  Wind,
  Droplets,
  Calendar,
  AlertTriangle,
  BarChart3,
  Sun,
} from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'hvac', label: 'HVAC', icon: Thermometer },
  { id: 'lighting', label: 'Lighting', icon: Lightbulb },
  { id: 'energy', label: 'Energy', icon: Zap },
  { id: 'ieq', label: 'IEQ', icon: Wind },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'scheduling', label: 'Scheduling', icon: Calendar },
  { id: 'faults', label: 'Faults', icon: AlertTriangle },
  { id: 'solar', label: 'Solar', icon: Sun },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const Navigation = () => {
  const { activeTab, setActiveTab, faults, alerts } = useBASStore();
  const unacknowledgedFaults = faults.filter((f) => !f.acknowledged && !f.resolved).length;
  const activeAlerts = alerts.filter((a) => !a.dismissed).length;

  return (
    <nav className="border-b border-gray-800 bg-gray-900/30">
      <div className="px-6 flex gap-1 overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const showBadge =
            (tab.id === 'faults' && unacknowledgedFaults > 0) ||
            (tab.id === 'overview' && activeAlerts > 0);
          const badgeCount = tab.id === 'faults' ? unacknowledgedFaults : activeAlerts;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-4 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {showBadge && (
                <span className="absolute -top-0 -right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                  {badgeCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
