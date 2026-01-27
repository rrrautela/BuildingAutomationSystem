import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { EnergyTimeSeriesChart, LoadProfileChart, EnergyBreakdownChart, GaugeChart } from '../components/ui/Charts';
import { ProgressBar, Badge } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Activity,
  Clock,
} from 'lucide-react';

export const EnergyModule = () => {
  const { energyData, timeSeriesData, isPeakHours, zones } = useBASStore();

  const epiValue = (energyData.current / energyData.baseline) * 100;
  const isBelowBaseline = epiValue < 100;
  const savingsKWh = Math.max(0, energyData.baseline - energyData.current);

  const breakdownData = [
    { name: 'HVAC', value: energyData.hvac, color: '#06b6d4' },
    { name: 'Lighting', value: energyData.lighting, color: '#eab308' },
    { name: 'Plug Loads', value: energyData.plugLoads, color: '#a855f7' },
    { name: 'Other', value: energyData.other, color: '#6b7280' },
  ];

  const loadProfileData = timeSeriesData.slice(-12).map((d) => ({
    time: d.time,
    hvac: d.hvac,
    lighting: d.lighting,
    plugLoads: d.plugLoads,
  }));

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
          title="EPI Score"
          value={epiValue.toFixed(1)}
          unit="%"
          icon={isBelowBaseline ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          trend={isBelowBaseline ? 'down' : 'up'}
          trendValue={isBelowBaseline ? 'Below baseline' : 'Above baseline'}
          status={isBelowBaseline ? 'normal' : 'warning'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader
            title="Energy Consumption Profile"
            subtitle="24-hour consumption trend with prediction"
            action={
              <Badge variant={isPeakHours ? 'warning' : 'success'}>
                {isPeakHours ? 'Peak Hours' : 'Off-Peak'}
              </Badge>
            }
          />
          <EnergyTimeSeriesChart data={timeSeriesData} />
        </Card>

        <Card>
          <SectionHeader title="End-Use Breakdown" subtitle="Current consumption by category" />
          <div className="flex justify-center">
            <EnergyBreakdownChart data={breakdownData} />
          </div>
          <div className="mt-4 space-y-3">
            {breakdownData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader title="Load Profile by End-Use" subtitle="Stacked consumption over time" />
          <LoadProfileChart data={loadProfileData} />
        </Card>

        <Card>
          <SectionHeader title="EPI Performance" subtitle="Energy Performance Index tracking" />
          <div className="flex items-center justify-center py-6">
            <div className="relative">
              <GaugeChart
                value={epiValue}
                max={150}
                label="EPI %"
                thresholds={{ warning: 100, critical: 120 }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Baseline</div>
              <div className="text-lg font-bold text-white">{energyData.baseline} kW</div>
            </div>
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Current</div>
              <div className={`text-lg font-bold ${isBelowBaseline ? 'text-green-400' : 'text-red-400'}`}>
                {energyData.current.toFixed(0)} kW
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Variance</div>
              <div className={`text-lg font-bold ${isBelowBaseline ? 'text-green-400' : 'text-red-400'}`}>
                {isBelowBaseline ? '-' : '+'}
                {Math.abs(energyData.current - energyData.baseline).toFixed(0)} kW
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Zone Energy Contribution"
          subtitle="Energy consumption by zone"
        />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {zones.map((zone) => {
            const zoneEnergy = zone.occupied
              ? 20 + (zone.lighting / 100) * 15 + (zone.hvacStatus !== 'idle' ? 25 : 5)
              : 5;
            return (
              <motion.div
                key={zone.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border ${
                  zone.occupied
                    ? 'border-cyan-800/50 bg-cyan-950/10'
                    : 'border-gray-800 bg-gray-900/50'
                }`}
              >
                <div className="text-sm font-medium text-white mb-2">{zone.name}</div>
                <div className="text-2xl font-bold text-cyan-400">{zoneEnergy.toFixed(0)} kW</div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">HVAC</span>
                    <span className="text-gray-300">
                      {zone.hvacStatus !== 'idle' ? '25 kW' : '5 kW'}
                    </span>
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

      {isPeakHours && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-950/30 border border-yellow-800/50 rounded-lg"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-yellow-400 font-semibold">Peak Hours Active</h3>
              <p className="text-gray-400 text-sm mt-1">
                Current time is within peak demand period (1:00 PM - 4:00 PM). Consider implementing
                load shedding strategies to reduce demand charges.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">
                    Peak ends in {4 - new Date().getHours() + 16} hours
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
