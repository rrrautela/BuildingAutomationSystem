import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { GaugeChart } from '../components/ui/Charts';
import { Badge } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import {
  Droplets,
  Recycle,
  AlertTriangle,
  Activity,
  ThermometerSun,
  Factory,
  CheckCircle,
} from 'lucide-react';

export const WaterModule = () => {
  const { waterData } = useBASStore();

  const totalWater = waterData.fresh + waterData.recycled;
  const recycledPercentage = (waterData.recycled / totalWater) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Fresh Water"
          value={waterData.fresh}
          unit="L/hr"
          icon={<Droplets className="w-5 h-5" />}
          status="normal"
        />
        <MetricCard
          title="Recycled Water"
          value={waterData.recycled}
          unit="L/hr"
          icon={<Recycle className="w-5 h-5" />}
          status="normal"
          subtitle={`${recycledPercentage.toFixed(0)}% of total`}
        />
        <MetricCard
          title="Daily Usage"
          value={waterData.dailyUsage}
          unit="L"
          icon={<Activity className="w-5 h-5" />}
        />
        <MetricCard
          title="Water Efficiency"
          value={waterData.efficiency}
          unit="%"
          icon={<CheckCircle className="w-5 h-5" />}
          status={waterData.efficiency > 70 ? 'normal' : 'warning'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader title="Water System Overview" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="flex flex-col items-center">
              <GaugeChart
                value={waterData.fresh}
                max={2000}
                label="L/hr"
                color="#3b82f6"
              />
              <span className="text-sm text-gray-400 mt-2">Fresh Water</span>
            </div>
            <div className="flex flex-col items-center">
              <GaugeChart
                value={waterData.recycled}
                max={500}
                label="L/hr"
                color="#22c55e"
              />
              <span className="text-sm text-gray-400 mt-2">Recycled</span>
            </div>
            <div className="flex flex-col items-center">
              <GaugeChart
                value={recycledPercentage}
                max={100}
                label="%"
                color="#06b6d4"
              />
              <span className="text-sm text-gray-400 mt-2">Recycle Rate</span>
            </div>
            <div className="flex flex-col items-center">
              <GaugeChart
                value={waterData.efficiency}
                max={100}
                label="%"
                thresholds={{ warning: 60, critical: 50 }}
              />
              <span className="text-sm text-gray-400 mt-2">Efficiency</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Fresh vs Recycled Water</span>
                <span className="text-white text-sm">{totalWater.toFixed(0)} L/hr total</span>
              </div>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - recycledPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${recycledPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-blue-400">Fresh: {(100 - recycledPercentage).toFixed(0)}%</span>
                <span className="text-green-400">Recycled: {recycledPercentage.toFixed(0)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <ThermometerSun className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-medium">Cooling Tower</span>
                </div>
                <Badge
                  variant={
                    waterData.coolingTowerStatus === 'normal'
                      ? 'success'
                      : waterData.coolingTowerStatus === 'warning'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {waterData.coolingTowerStatus}
                </Badge>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Makeup Water</span>
                    <span className="text-white">125 L/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Blowdown</span>
                    <span className="text-white">45 L/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cycles</span>
                    <span className="text-white">5.2</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Factory className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">STP Status</span>
                </div>
                <Badge
                  variant={
                    waterData.stpStatus === 'operational'
                      ? 'success'
                      : waterData.stpStatus === 'maintenance'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {waterData.stpStatus}
                </Badge>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Inflow</span>
                    <span className="text-white">420 L/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Treated</span>
                    <span className="text-white">{waterData.recycled} L/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quality</span>
                    <span className="text-green-400">Good</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Leak Detection" />
          {waterData.leakDetected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-red-950/30 border border-red-800/50 rounded-lg"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-500/20 rounded-full animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h3 className="text-red-400 font-bold text-lg">Leak Detected!</h3>
                  <p className="text-gray-400 text-sm">
                    {waterData.leakLocation || 'Location unknown'}
                  </p>
                </div>
              </div>
              <button
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                type="button"
                onClick={() => window.alert('Leak investigation started. Check valves/meters for abnormal flow.')}
              >
                Investigate Now
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-green-500/20 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <p className="text-white font-medium text-lg">No Leaks Detected</p>
              <p className="text-sm text-gray-400 mt-2">
                All water systems operating normally
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-800">
            <SectionHeader title="Monitoring Points" />
            <div className="space-y-3">
              {[
                { name: 'Main Supply', status: 'normal', flow: 850 },
                { name: 'HVAC Loop', status: 'normal', flow: 320 },
                { name: 'Domestic', status: 'normal', flow: 180 },
                { name: 'Irrigation', status: 'normal', flow: 0 },
              ].map((point) => (
                <div
                  key={point.name}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        point.status === 'normal' ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                      }`}
                    />
                    <span className="text-white text-sm">{point.name}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{point.flow} L/hr</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Daily Water Usage Trend" />
        <div className="h-48 flex items-end justify-between gap-2 px-4">
          {Array.from({ length: 24 }).map((_, i) => {
            const baseUsage = i >= 9 && i <= 18 ? 200 : 80;
            const usage = baseUsage + Math.random() * 50;
            return (
              <motion.div
                key={i}
                className="relative flex-1 bg-blue-500 rounded-t hover:bg-blue-400 transition-colors"
                initial={{ height: 0 }}
                animate={{ height: `${(usage / 250) * 100}%` }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
              >
                <div className="opacity-0 hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-gray-900 px-2 py-1 rounded whitespace-nowrap">
                  {i}:00 - {usage.toFixed(0)} L
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2 px-4">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </Card>
    </div>
  );
};
