import { useBASStore } from '../store/basStore';
import { Card, SectionHeader, MetricCard } from '../components/ui/Card';
import { GaugeChart } from '../components/ui/Charts';
import { Badge } from '../components/ui/Controls';
import { motion } from 'framer-motion';
import { Sun, Battery, TrendingUp, Grid, Leaf } from 'lucide-react';

export const SolarModule = () => {
  const { energyData, weatherData, timeSeriesData } = useBASStore();

  const solarPercentage = energyData.current > 0 ? (energyData.solar / energyData.current) * 100 : 0;
  const peakSolar = Math.max(...timeSeriesData.map((d) => d.solar), 1);
  const totalSolar = timeSeriesData.reduce((sum, point) => sum + point.solar, 0);

  const isSolarActive = energyData.solar > 0.5;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <MetricCard title="Grid Import" value={energyData.grid} unit="kW" icon={<Grid className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <Card className="lg:col-span-2 h-full">
          <SectionHeader title="Daily Solar Profile" subtitle="Hourly solar generation through the day" />
          <div className="h-72 flex items-end gap-1 px-4 pt-2">
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
          <div className="flex justify-between text-xs text-gray-500 mt-4 px-4">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </Card>

        <Card className="h-full flex flex-col">
          <SectionHeader title="Solar Performance" subtitle="Generation and utilization snapshot" />
          <div className="flex-1 grid grid-rows-[auto,1fr] gap-6">
            <div className="flex justify-center pt-2">
              <GaugeChart value={solarPercentage} max={100} label="% Solar" color="#eab308" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Peak Generation</span>
                  <span className="text-white">{peakSolar.toFixed(0)} kW</span>
                </div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Today's Total</span>
                  <span className="text-white">{totalSolar.toFixed(0)} kWh</span>
                </div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
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
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">System Status</span>
                  <Badge variant={isSolarActive ? 'success' : 'default'}>
                    {isSolarActive ? 'Generating' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

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
              <p className="text-gray-400 text-sm">CO2 Saved (YTD)</p>
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
