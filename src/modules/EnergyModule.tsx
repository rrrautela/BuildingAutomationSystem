import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { EnergyTimeSeriesChart, EnergyBreakdownChart } from '../components/ui/Charts';
import { ProgressBar } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import { Zap, Target, Activity } from 'lucide-react';

export const EnergyModule = () => {
  const { energyData, timeSeriesData, isPeakHours, zones } = useBASStore();

  const savingsKWh = Math.max(0, energyData.baseline - energyData.current);

  const breakdownData = [
    { name: 'HVAC', value: energyData.hvac, color: '#06b6d4' },
    { name: 'Lighting', value: energyData.lighting, color: '#eab308' },
    { name: 'Plug Loads', value: energyData.plugLoads, color: '#a855f7' },
    { name: 'Other', value: energyData.other, color: '#6b7280' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          value={savingsKWh}
          unit="kW"
          icon={<Target className="w-5 h-5" />}
          status="normal"
          subtitle="vs baseline"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <Card className="lg:col-span-2 h-[25rem] flex flex-col p-0 overflow-hidden">
          <div className="p-4 pb-0">
          <SectionHeader
            title="Energy Consumption Profile"
            subtitle="24-hour consumption trend with prediction"
          />
          </div>
          <div className="flex-1 min-h-0 p-4">
            <EnergyTimeSeriesChart data={timeSeriesData} />
          </div>
        </Card>

        <Card className="h-[25rem] flex flex-col p-0 overflow-hidden">
          <div className="p-4 pb-0">
            <SectionHeader title="End-Use Breakdown" subtitle="Current consumption by category" />
          </div>
          <div className="flex justify-center flex-1 min-h-0 p-4">
            <EnergyBreakdownChart data={breakdownData} />
          </div>
          <div className="px-4 pb-4 space-y-3">
            {breakdownData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
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
                  color={`bg-[${item.color}]`}
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
            const zoneEnergy = zone.occupied ? 20 + (zone.lighting / 100) * 15 + (zone.hvacStatus !== 'idle' ? 25 : 5) : 5;
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
                    <span className="text-gray-300">{zone.hvacStatus !== 'idle' ? '25 kW' : '5 kW'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lighting</span>
                    <span className="text-gray-300">{((zone.lighting / 100) * 15).toFixed(0)} kW</span>
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
