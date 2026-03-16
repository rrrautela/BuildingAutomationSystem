import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { EnergyTimeSeriesChart, EnergyBreakdownChart } from '../components/ui/Charts';
import { ProgressBar } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import { Zap, Target, Activity, Gauge } from 'lucide-react';

export const EnergyModule = () => {
  const { energyData, timeSeriesData, isPeakHours, zones } = useBASStore();

  const savingsKW = Math.max(0, energyData.baseline - energyData.current);
  const savingsPercent =
    energyData.baseline > 0 ? Math.round((savingsKW / energyData.baseline) * 100) : 0;

  const breakdownData = [
    { name: 'HVAC', value: energyData.hvac, color: '#06b6d4' },
    { name: 'Lighting', value: energyData.lighting, color: '#eab308' },
    { name: 'Plug Loads', value: energyData.plugLoads, color: '#a855f7' },
    { name: 'Other', value: energyData.other, color: '#6b7280' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Demand"
          value={energyData.current}
          unit="kW"
          icon={<Zap className="w-5 h-5" />}
          status={isPeakHours ? 'warning' : 'normal'}
          subtitle={isPeakHours ? 'Peak hours active' : 'Off-peak'}
        />
        <MetricCard
          title="Peak Demand"
          value={energyData.peakDemand}
          unit="kW"
          icon={<Activity className="w-5 h-5" />}
          subtitle="Today's maximum"
        />
        <MetricCard
          title="Energy Savings"
          value={savingsPercent}
          unit="%"
          icon={<Target className="w-5 h-5" />}
          status="normal"
          subtitle={`${savingsKW.toFixed(0)} kW vs baseline`}
        />
        <MetricCard
          title="EPI Score"
          value={energyData.epi}
          icon={<Gauge className="w-5 h-5" />}
          status="normal"
          subtitle="Energy Performance Index"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <Card className="lg:col-span-2 h-[20rem] sm:h-[25rem] flex flex-col p-0 overflow-hidden">
          <div className="p-4 pb-0">
          <SectionHeader
            title="Energy Consumption Profile"
            subtitle="24-hour consumption trend with prediction"
          />
          </div>
          <div className="flex-1 min-h-0 p-4">
            <EnergyTimeSeriesChart data={timeSeriesData} showSolar={false} />
          </div>
        </Card>

        <Card className="h-[20rem] sm:h-[25rem] flex flex-col p-0 overflow-hidden">
          <div className="p-4 pb-0">
            <SectionHeader title="End-Use Breakdown" subtitle="Current consumption by category" />
          </div>
          <div className="flex justify-center flex-1 min-h-0 p-4">
            <EnergyBreakdownChart data={breakdownData} />
          </div>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
            {breakdownData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-white font-medium">{item.value} kW</span>
                </div>
                <ProgressBar
                  value={item.value}
                  max={energyData.current}
                  showValue={false}
                  color={item.color}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

        <Card>
        <SectionHeader title="Zone Energy Contribution" subtitle="Energy consumption by zone" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {zones.map((zone) => {
            // Presentation: keep each zone in a realistic 40-50 kW band with a small variation per zone.
            const zoneEnergy = 40 + (zone.occupantCount % 11); // 40..50
            const hvacKW = zoneEnergy * 0.55;
            const lightingKW = zoneEnergy * 0.25;
            return (
              <motion.div
                key={zone.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border ${
                  zone.occupied ? 'border-cyan-800/50 bg-cyan-950/10' : 'border-gray-800 bg-gray-900/50'
                }`}
              >
                <div className="text-sm font-medium text-white mb-2">{zone.name}</div>
                <div className="text-2xl font-bold text-cyan-400">{zoneEnergy.toFixed(0)} kW</div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">HVAC</span>
                    <span className="text-gray-300">{hvacKW.toFixed(0)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lighting</span>
                    <span className="text-gray-300">{lightingKW.toFixed(0)} kW</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
