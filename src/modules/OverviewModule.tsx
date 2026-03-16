import { useBASStore } from '../store/basStore';
import { Card, MetricCard, SectionHeader } from '../components/ui/Card';
import { EnergyTimeSeriesChart, EnergyBreakdownChart } from '../components/ui/Charts';
import { motion } from 'framer-motion';
import { Thermometer, Zap, Users, Wind, Gauge } from 'lucide-react';

export const OverviewModule = () => {
  const { zones, energyData, timeSeriesData, isPeakHours } = useBASStore();

  const occupiedZones = zones.filter((z) => z.occupied).length;
  const avgTemp = zones.reduce((sum, z) => sum + z.temp, 0) / zones.length;
  const avgCO2 = zones.reduce((sum, z) => sum + z.co2, 0) / zones.length;
  const totalOccupants = zones.reduce((sum, z) => sum + z.occupantCount, 0);
  const isBelowBaseline = energyData.current < energyData.baseline;
  const savingsKW = Math.abs(energyData.current - energyData.baseline);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Average Temperature"
          value={avgTemp}
          unit={'\u00B0C'}
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
          trendValue={`${savingsPercent}% (${savingsKW.toFixed(0)} kW) vs baseline`}
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
            title="EPI Score"
            value={energyData.epi}
            icon={<Gauge className="w-5 h-5" />}
            status="normal"
            subtitle="Energy Performance Index"
          />
        <MetricCard
          title="Air Quality (CO2)"
          value={avgCO2}
          unit="ppm"
          icon={<Wind className="w-5 h-5" />}
          status={avgCO2 > 700 ? 'critical' : avgCO2 > 600 ? 'warning' : 'normal'}
        />
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <Card className="lg:col-span-2 min-h-[20rem] sm:min-h-[25.5rem] h-full flex flex-col p-0 overflow-hidden">
            <div className="p-4 pb-0">
              <SectionHeader
                title="Energy Profile"
                subtitle="24-hour consumption & prediction"
              />
            </div>
            <div className="w-full flex-1 min-h-0 p-4">
              <EnergyTimeSeriesChart data={timeSeriesData} showSolar={false} />
            </div>
          </Card>

          <Card className="min-h-[20rem] sm:min-h-[25.5rem] h-full flex flex-col p-0 overflow-hidden">
            <div className="p-4 pb-0">
              <SectionHeader title="Energy Breakdown" subtitle="Current consumption by end-use" />
            </div>
          <div className="w-full flex-1 min-h-0 p-3 sm:p-4 flex items-center justify-center">
            <EnergyBreakdownChart data={breakdownData} />
          </div>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-1.5 sm:space-y-2">
            {breakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value} kW</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Zone Status" subtitle="Real-time status of all building zones" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
                    zone.hasFault ? 'bg-red-500 animate-pulse' : zone.occupied ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Temp</span>
                  <span className="text-white">{zone.temp.toFixed(1)}{'\u00B0C'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">CO2</span>
                  <span className={zone.co2 > 700 ? 'text-red-400' : 'text-white'}>
                    {zone.co2} ppm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Light</span>
                  <span className="text-white">{zone.lighting}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Occupants</span>
                  <span className="text-white">{zone.occupantCount}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};
