import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { GaugeChart } from '../components/ui/Charts';
import { ProgressBar, Badge } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import {
  Sun,
  Zap,
  Battery,
  TrendingUp,
  Cloud,
  ArrowRight,
  Grid,
  Leaf,
} from 'lucide-react';

export const SolarModule = () => {
  const { energyData, weatherData, timeSeriesData } = useBASStore();

  const solarPercentage = (energyData.solar / energyData.current) * 100;
  const gridDependency = 100 - solarPercentage;
  const peakSolar = Math.max(...timeSeriesData.map((d) => d.solar));

  const currentHour = new Date().getHours();
  const isSolarActive = currentHour >= 6 && currentHour <= 18;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Solar Generation"
          value={energyData.solar}
          unit="kW"
          icon={<Sun className="w-5 h-5" />}
          status={isSolarActive ? 'normal' : 'warning'}
          subtitle={isSolarActive ? 'Active' : 'Inactive (Night)'}
        />
        <MetricCard
          title="Self-Consumption"
          value={energyData.selfConsumption}
          unit="%"
          icon={<Battery className="w-5 h-5" />}
          status={energyData.selfConsumption > 70 ? 'normal' : 'warning'}
        />
        <MetricCard
          title="Grid Import"
          value={energyData.grid}
          unit="kW"
          icon={<Grid className="w-5 h-5" />}
        />
        <MetricCard
          title="Carbon Offset"
          value={(energyData.solar * 0.5)}
          unit="kg CO₂"
          icon={<Leaf className="w-5 h-5" />}
          subtitle="Today's savings"
          status="normal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader
            title="Energy Flow"
            subtitle="Real-time power distribution"
          />
          <div className="flex items-center justify-between py-8">
            <motion.div
              className="flex flex-col items-center"
              animate={{ scale: isSolarActive ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  isSolarActive ? 'bg-yellow-500/20' : 'bg-gray-800'
                }`}
                style={{
                  boxShadow: isSolarActive ? '0 0 40px rgba(234, 179, 8, 0.3)' : 'none',
                }}
              >
                <Sun
                  className={`w-12 h-12 ${
                    isSolarActive ? 'text-yellow-400' : 'text-gray-600'
                  }`}
                />
              </div>
              <span className="text-white font-bold text-xl mt-3">
                {energyData.solar} kW
              </span>
              <span className="text-gray-400 text-sm">Solar</span>
            </motion.div>

            <div className="flex-1 flex items-center justify-center px-4">
              <div className="relative w-full max-w-xs">
                <motion.div
                  className="absolute top-1/2 left-0 right-1/2 h-1 bg-yellow-500 rounded-full"
                  style={{ transform: 'translateY(-50%)' }}
                  animate={{ opacity: isSolarActive ? [0.5, 1, 0.5] : 0.2 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute top-1/2 left-1/2 right-0 h-1 bg-cyan-500 rounded-full"
                  style={{ transform: 'translateY(-50%)' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border-2 border-cyan-500 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Grid className="w-12 h-12 text-cyan-400" />
              </div>
              <span className="text-white font-bold text-xl mt-3">
                {energyData.grid} kW
              </span>
              <span className="text-gray-400 text-sm">Grid Import</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">Power Balance</span>
              <span className="text-white">{energyData.current} kW Total Load</span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex">
              <motion.div
                className="h-full bg-yellow-500"
                initial={{ width: 0 }}
                animate={{ width: `${solarPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
              <motion.div
                className="h-full bg-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${gridDependency}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-yellow-400">Solar: {solarPercentage.toFixed(0)}%</span>
              <span className="text-cyan-400">Grid: {gridDependency.toFixed(0)}%</span>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Solar Performance" />
          <div className="flex flex-col items-center py-4">
            <GaugeChart
              value={solarPercentage}
              max={100}
              label="% Solar"
              color="#eab308"
            />
          </div>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Peak Generation</span>
                <span className="text-white">{peakSolar.toFixed(0)} kW</span>
              </div>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Today's Total</span>
                <span className="text-white">
                  {(energyData.solar * 8).toFixed(0)} kWh
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Weather Impact</span>
                <Badge
                  variant={
                    weatherData.condition === 'sunny'
                      ? 'success'
                      : weatherData.condition === 'cloudy'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {weatherData.condition}
                </Badge>
              </div>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">System Status</span>
                <Badge variant="success">Optimal</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Daily Solar Profile" />
        <div className="h-48 flex items-end gap-1 px-4">
          {timeSeriesData.map((data, i) => {
            const height = (data.solar / peakSolar) * 100 || 0;
            return (
              <motion.div
                key={i}
                className="flex-1 bg-yellow-500 rounded-t hover:bg-yellow-400 transition-colors relative group"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(height, 2)}%` }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-gray-900 px-2 py-1 rounded whitespace-nowrap z-10">
                  {data.time}: {data.solar.toFixed(1)} kW
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Sun className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Installed Capacity</p>
              <p className="text-white text-2xl font-bold">50 kWp</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Leaf className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">CO₂ Saved (YTD)</p>
              <p className="text-white text-2xl font-bold">12.4 tons</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">System Efficiency</p>
              <p className="text-white text-2xl font-bold">94.2%</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
