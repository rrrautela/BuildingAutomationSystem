import { useBASStore } from '../store/basStore';
import { Card, MetricCard, SectionHeader } from '../components/ui/Card';
import { EnergyTimeSeriesChart, EnergyBreakdownChart } from '../components/ui/Charts';
import { motion } from 'framer-motion';
import {
  Thermometer,
  Zap,
  Droplets,
  Users,
  Sun,
  Wind,
  TrendingDown,
  TrendingUp,
  Leaf,
} from 'lucide-react';

export const OverviewModule = () => {
  const { zones, energyData, waterData, timeSeriesData, isPeakHours } = useBASStore();

  const occupiedZones = zones.filter((z) => z.occupied).length;
  const avgTemp = zones.reduce((sum, z) => sum + z.temp, 0) / zones.length;
  const avgCO2 = zones.reduce((sum, z) => sum + z.co2, 0) / zones.length;
  const totalOccupants = zones.reduce((sum, z) => sum + z.occupantCount, 0);

  const epiPercentage = ((energyData.current / energyData.baseline) * 100).toFixed(1);
  const isBelowBaseline = energyData.current < energyData.baseline;

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
          title="Average Temperature"
          value={avgTemp}
          unit="°C"
          icon={<Thermometer className="w-5 h-5" />}
          status={avgTemp > 25 || avgTemp < 20 ? 'warning' : 'normal'}
          subtitle="Across all zones"
        />
        <MetricCard
          title="Energy Consumption"
          value={energyData.current}
          unit="kW"
          icon={<Zap className="w-5 h-5" />}
          trend={isBelowBaseline ? 'down' : 'up'}
          trendValue={`${Math.abs(energyData.current - energyData.baseline).toFixed(0)} kW vs baseline`}
          status={isPeakHours ? 'warning' : 'normal'}
        />
        <MetricCard
          title="Occupancy"
          value={totalOccupants}
          unit="people"
          icon={<Users className="w-5 h-5" />}
          subtitle={`${occupiedZones}/${zones.length} zones occupied`}
        />
        <MetricCard
          title="Solar Generation"
          value={energyData.solar}
          unit="kW"
          icon={<Sun className="w-5 h-5" />}
          status="normal"
          subtitle={`${energyData.selfConsumption}% self-consumed`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader
            title="Energy Profile"
            subtitle="24-hour consumption, solar generation & prediction"
          />
          <EnergyTimeSeriesChart data={timeSeriesData} />
        </Card>

        <Card>
          <SectionHeader title="Energy Breakdown" subtitle="Current consumption by end-use" />
          <EnergyBreakdownChart data={breakdownData} />
          <div className="mt-4 space-y-2">
            {breakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value} kW</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Air Quality (CO₂)"
          value={avgCO2}
          unit="ppm"
          icon={<Wind className="w-5 h-5" />}
          status={avgCO2 > 700 ? 'critical' : avgCO2 > 600 ? 'warning' : 'normal'}
        />
        <MetricCard
          title="EPI Score"
          value={epiPercentage}
          unit="%"
          icon={isBelowBaseline ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          trend={isBelowBaseline ? 'down' : 'up'}
          trendValue={isBelowBaseline ? 'Below baseline' : 'Above baseline'}
          status={isBelowBaseline ? 'normal' : 'warning'}
        />
        <MetricCard
          title="Water Usage"
          value={waterData.fresh}
          unit="L/hr"
          icon={<Droplets className="w-5 h-5" />}
          subtitle={`${waterData.recycled} L/hr recycled`}
          status={waterData.leakDetected ? 'critical' : 'normal'}
        />
        <MetricCard
          title="Carbon Offset"
          value={((energyData.solar / energyData.current) * 100)}
          unit="%"
          icon={<Leaf className="w-5 h-5" />}
          subtitle="From solar generation"
          status="normal"
        />
      </div>

      <Card>
        <SectionHeader title="Zone Status" subtitle="Real-time status of all building zones" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {zones.map((zone) => (
            <motion.div
              key={zone.id}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-lg border transition-colors ${
                zone.hasFault
                  ? 'border-red-800/50 bg-red-950/20'
                  : zone.occupied
                  ? 'border-green-800/50 bg-green-950/10'
                  : 'border-gray-800 bg-gray-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white truncate">{zone.name}</span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    zone.hasFault
                      ? 'bg-red-500 animate-pulse'
                      : zone.occupied
                      ? 'bg-green-500'
                      : 'bg-gray-500'
                  }`}
                />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Temp</span>
                  <span className="text-white">{zone.temp.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">CO₂</span>
                  <span className={zone.co2 > 700 ? 'text-red-400' : 'text-white'}>
                    {zone.co2} ppm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Light</span>
                  <span className="text-white">{zone.lighting}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};
